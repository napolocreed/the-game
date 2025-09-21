# The Game - Push Notification Server

This is a simple Node.js server using Express and `web-push` to handle sending push notifications for the main application.

## Local Development

### 1. Install Dependencies
Navigate into the `server` directory and run:
```bash
npm install
```

### 2. Generate VAPID Keys
VAPID keys are required to securely send push notifications. You only need to do this once.
```bash
npx web-push generate-vapid-keys
```
This will output a public and a private key.

### 3. Set Environment Variables
For local development, you can create a `.env` file in the `server` directory (though this file should not be committed to git). For production, you will set these in your hosting provider's dashboard.

```
# .env file
VAPID_PUBLIC_KEY=YOUR_GENERATED_PUBLIC_KEY
VAPID_PRIVATE_KEY=YOUR_GENERATED_PRIVATE_KEY
```

Then, update `server/index.js` to use a library like `dotenv` or manually set them for local testing.

**Important:** You must also update the `VAPID_PUBLIC_KEY` in the client-side code at `hooks/useGameLogic.ts` to match the public key you generated.

### 4. Start the Server
```bash
npm start
```
The server will start, by default on `http://localhost:4000`.

## Deployment (Example: Render.com)

This server is ready to be deployed on a service like Render.

1.  **Create a New "Web Service"** on Render and connect your Git repository.
2.  **Set the Root Directory** to `server`. This tells Render to only look inside this folder for the service.
3.  **Build Command:** `npm install`
4.  **Start Command:** `npm start`
5.  **Add Environment Variables:** In the Render dashboard for your service, go to the "Environment" tab and add the following secrets:
    *   `VAPID_PUBLIC_KEY`: Paste the public key you generated.
    *   `VAPID_PRIVATE_KEY`: Paste the private key you generated.
6.  **Deploy!**
7.  **Update Client URL:** Once deployed, Render will give you a public URL (e.g., `https://your-app.onrender.com`). You **must** update the `PUSH_SERVER_URL` constant in the client-side file `hooks/useGameLogic.ts` to this new URL.

That's it! Your push server will now be live and your application will be able to send reliable notifications.
