const express = require('express');
const webPush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

// In-memory storage for subscriptions. 
// For a production app, you would use a persistent database (e.g., Redis, PostgreSQL).
let subscriptions = [];

// --- VAPID Keys ---
// You should generate your own VAPID keys and store them as environment variables.
// To generate keys, run: npx web-push generate-vapid-keys
const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY || 'BPhgcyf5kY_H29yV8s_1jA3S5OtT_l4aLg3g1y_aH7-pQxWz8s_R6n9n0z9g9Z3i2y_J6h9f1k2q4w0',
    privateKey: process.env.VAPID_PRIVATE_KEY || 'YOUR_PRIVATE_KEY_HERE' // REPLACE THIS
};

if (vapidKeys.privateKey === 'YOUR_PRIVATE_KEY_HERE') {
    console.warn('WARNING: You are using a placeholder VAPID private key. Please generate your own and set it as an environment variable.');
}

webPush.setVapidDetails(
    'mailto:your-email@example.com', // Replace with your email
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

app.use(cors());
app.use(bodyParser.json());

// Render health check endpoint
app.get('/health', (_, res) => res.status(200).send('ok'));


// Endpoint for clients to subscribe for push notifications
app.post('/subscribe', (req, res) => {
    const { subscription, reminders } = req.body;

    // Find if the subscription already exists
    const existingSubIndex = subscriptions.findIndex(s => s.subscription.endpoint === subscription.endpoint);
    
    if (existingSubIndex > -1) {
        // Update existing subscription with new reminders
        subscriptions[existingSubIndex] = { subscription, reminders };
        console.log(`Updated subscription for endpoint: ${subscription.endpoint}`);
    } else {
        // Add new subscription
        subscriptions.push({ subscription, reminders });
        console.log(`New subscription added for endpoint: ${subscription.endpoint}`);
    }

    res.status(201).json({ message: 'Subscription received.' });
});

app.post('/send-test', (req, res) => {
    const { subscription } = req.body;
    
    const payload = JSON.stringify({
        title: 'Test Notification',
        body: 'If you see this, the push server is working!'
    });

    webPush.sendNotification(subscription, payload)
        .then(() => res.status(200).json({ message: 'Test notification sent.' }))
        .catch(err => {
            console.error('Error sending test notification:', err);
            res.sendStatus(500);
        });
});


// Check for reminders every minute
setInterval(() => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    console.log(`[${currentTime}] Checking for reminders... ${subscriptions.length} subscriptions active.`);

    subscriptions.forEach(sub => {
        sub.reminders.forEach(reminder => {
            if (reminder.time === currentTime) {
                console.log(`Sending reminder for "${reminder.name}" to ${sub.subscription.endpoint}`);
                
                const payload = JSON.stringify({
                    title: 'The Game Reminder',
                    body: `Don't forget your habit: "${reminder.name}"!`
                });

                webPush.sendNotification(sub.subscription, payload)
                    .catch(error => {
                        console.error('Error sending notification: ', error);
                        // If subscription is expired or invalid, remove it
                        if (error.statusCode === 410) {
                            subscriptions = subscriptions.filter(s => s.subscription.endpoint !== sub.subscription.endpoint);
                            console.log(`Removed invalid subscription: ${sub.subscription.endpoint}`);
                        }
                    });
            }
        });
    });

}, 60 * 1000); // 60 seconds

app.listen(PORT, () => {
    console.log(`Push server running on port ${PORT}`);
});
