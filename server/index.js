// index.js
const express = require('express');
const webPush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 4000;

// ---------- middleware ----------
app.use(cors()); // tighten allowed origins later if you want
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

// ---------- database ----------
const useSSL = process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL
});

async function initDb() {
  await pool.query(`
    create table if not exists subscriptions (
      id serial primary key,
      endpoint text unique not null,
      p256dh text not null,
      auth text not null,
      reminders jsonb not null default '[]'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    create index if not exists idx_subscriptions_updated_at on subscriptions(updated_at desc);
  `);
}

async function upsertSubscription({ subscription, reminders }) {
  const { endpoint, keys } = subscription || {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw new Error('Invalid subscription payload');
  }
  const r = Array.isArray(reminders) ? reminders : [];
  await pool.query(
    `
    insert into subscriptions (endpoint, p256dh, auth, reminders)
    values ($1, $2, $3, $4)
    on conflict (endpoint)
    do update set p256dh = excluded.p256dh,
                  auth = excluded.auth,
                  reminders = excluded.reminders,
                  updated_at = now()
    `,
    [endpoint, keys.p256dh, keys.auth, JSON.stringify(r)]
  );
}

async function getAllSubscriptions() {
  const { rows } = await pool.query(`select endpoint, p256dh, auth, reminders from subscriptions`);
  return rows.map(r => ({
    subscription: {
      endpoint: r.endpoint,
      keys: { p256dh: r.p256dh, auth: r.auth }
    },
    reminders: r.reminders || []
  }));
}

async function removeSubscriptionByEndpoint(endpoint) {
  await pool.query(`delete from subscriptions where endpoint = $1`, [endpoint]);
}

// ---------- routes ----------
app.post('/subscribe', async (req, res) => {
  try {
    const { subscription, reminders } = req.body || {};
    await upsertSubscription({ subscription, reminders });
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

function hhmm(d) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function timesBetween(since, now) {
  const out = new Set();
  for (let t = new Date(since); t <= now; t = new Date(t.getTime() + 60_000)) {
    out.add(hhmm(t));
  }
  return out;
}

async function scanAndSendSince(since) {
  const now = new Date();
  const windowTimes = timesBetween(since, now);
  const subs = await getAllSubscriptions();

  for (const sub of subs) {
    for (const r of sub.reminders || []) {
      if (windowTimes.has(r.time)) {
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
    await initDb();
    app.listen(PORT, () => {
      console.log(`Push server running on port ${PORT}`);
    });
  } catch (e) {
    console.error('failed to init', e);
    process.exit(1);
  }
})();
