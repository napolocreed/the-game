// index.js
const express = require('express');
const webPush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const { createStorage } = require('./storage');

const app = express();
const PORT = process.env.PORT || 4000;

// ---------- middleware ----------
// ALLOWED_ORIGINS: comma-separated list (e.g. "https://napolocreed.github.io").
// Unset = allow all (local development).
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);
app.use(cors(allowedOrigins.length > 0 ? { origin: allowedOrigins } : {}));
app.use(bodyParser.json());

// ---------- health + public key ----------
app.get('/health', (_, res) => res.status(200).send('ok'));
app.get('/vapidPublicKey', (_, res) =>
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' })
);

// ---------- web-push ----------
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'mailto:you@example.com';
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.warn('⚠️  Missing VAPID keys. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.');
}
webPush.setVapidDetails(CONTACT_EMAIL, VAPID_PUBLIC_KEY || 'missing', VAPID_PRIVATE_KEY || 'missing');

// ---------- storage ----------
// Pluggable backend (firestore / postgres / memory) — see storage.js.
const storage = createStorage();

function isValidTimeZone(tz) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

async function upsertSubscription({ subscription, reminders, tz }) {
  const { endpoint, keys } = subscription || {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw new Error('Invalid subscription payload');
  }
  await storage.upsert({
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    reminders: Array.isArray(reminders) ? reminders : [],
    tz: typeof tz === 'string' && isValidTimeZone(tz) ? tz : 'UTC',
  });
}

async function getAllSubscriptions() {
  const rows = await storage.getAll();
  return rows.map(r => ({
    subscription: {
      endpoint: r.endpoint,
      keys: { p256dh: r.p256dh, auth: r.auth }
    },
    reminders: r.reminders || [],
    tz: r.tz || 'UTC'
  }));
}

async function removeSubscriptionByEndpoint(endpoint) {
  await storage.removeByEndpoint(endpoint);
}

// ---------- routes ----------
app.post('/subscribe', async (req, res) => {
  try {
    const { subscription, reminders, tz } = req.body || {};
    await upsertSubscription({ subscription, reminders, tz });
    res.status(201).json({ message: 'Subscription saved.' });
  } catch (e) {
    console.error('subscribe error', e);
    res.status(400).json({ error: e.message });
  }
});

app.post('/send-test', async (req, res) => {
  try {
    const { subscription } = req.body || {};
    if (!subscription?.endpoint) {
      console.log('/send-test received bad request: no subscription');
      return res.status(400).json({ error: 'Missing subscription' });
    }

    console.log('Attempting to send test notification to:', subscription.endpoint);
    const payload = JSON.stringify({ title: 'The Game', body: 'This is a test notification! 🚀' });
    
    await webPush.sendNotification(subscription, payload);
    
    console.log('Successfully queued test notification for:', subscription.endpoint);
    res.json({ ok: true });
  } catch (e) {
    // Log the full error object for more details
    console.error('Failed to send test notification. Error details:', e);
    // The existing log is good too, it captures specific web-push properties
    console.error('send-test error status:', e.statusCode, 'body:', e.body || e.message);
    res.status(500).json({ error: 'Failed to send test' });
  }
});

// ---------- scheduler + catch-up ----------
let lastCheck = new Date(Date.now() - 30 * 60 * 1000); // catch up 30 min at cold start

const WEEKDAY_TO_NUM = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const tzFormatters = new Map();

function getTzFormatter(tz) {
  if (!tzFormatters.has(tz)) {
    tzFormatters.set(tz, new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }));
  }
  return tzFormatters.get(tz);
}

// Returns entries like "3|08:30" (weekday|HH:mm) for every minute in [since, now],
// expressed in the subscriber's own timezone. Reminder times are entered in the
// user's local time, so comparing them against server-local time (UTC on most
// hosts) fired reminders hours off — this is the fix.
function timesBetweenInTz(since, now, tz) {
  const out = new Set();
  const fmt = getTzFormatter(tz);
  for (let t = new Date(since); t <= now; t = new Date(t.getTime() + 60_000)) {
    const parts = Object.fromEntries(fmt.formatToParts(t).map(p => [p.type, p.value]));
    out.add(`${WEEKDAY_TO_NUM[parts.weekday]}|${parts.hour}:${parts.minute}`);
  }
  return out;
}

async function scanAndSendSince(since) {
  const now = new Date();
  const subs = await getAllSubscriptions();

  for (const sub of subs) {
    let windowTimes;
    try {
      windowTimes = timesBetweenInTz(since, now, sub.tz);
    } catch (e) {
      windowTimes = timesBetweenInTz(since, now, 'UTC');
    }
    for (const r of sub.reminders || []) {
      const days = Array.isArray(r.days) && r.days.length > 0 ? r.days : [0, 1, 2, 3, 4, 5, 6];
      const isDue = days.some(day => windowTimes.has(`${day}|${r.time}`));
      if (isDue) {
        const payload = JSON.stringify({
          title: 'The Game Reminder',
          body: r.name ? `Don't forget "${r.name}"` : 'Reminder time!'
        });
        try {
          await webPush.sendNotification(sub.subscription, payload);
          console.log('sent to', sub.subscription.endpoint, 'for', r.time);
        } catch (error) {
          console.warn('send error', error.statusCode, error.body || error.message);
          // 410 Gone (or 404 Not Found) => remove dead subscription
          if (error.statusCode === 410 || error.statusCode === 404) {
            await removeSubscriptionByEndpoint(sub.subscription.endpoint);
            console.log('removed dead subscription', sub.subscription.endpoint);
          }
        }
      }
    }
  }

  lastCheck = now;
}

// normal 1-minute sweep while the instance is awake
setInterval(() => {
  const since = new Date(Date.now() - 60_000);
  scanAndSendSince(since).catch(err => console.error('interval scan error', err));
}, 60 * 1000);

// called by external ping to catch up after sleeps/restarts
app.get('/check', async (_, res) => {
  try {
    await scanAndSendSince(lastCheck);
    res.json({ ok: true, lastCheck });
  } catch (e) {
    console.error('check error', e);
    res.status(500).json({ error: 'check failed' });
  }
});

// ---------- start ----------
(async () => {
  try {
    await storage.init();
    app.listen(PORT, () => {
      console.log(`Push server running on port ${PORT} (storage: ${storage.name})`);
    });
  } catch (e) {
    console.error('failed to init', e);
    process.exit(1);
  }
})();
