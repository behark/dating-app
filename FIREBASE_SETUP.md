# Firebase Setup Guide

This guide will walk you through getting all the Firebase configuration values you need for your dating app.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter a project name (e.g., "dating-app")
4. Follow the setup wizard:
   - Disable Google Analytics (optional, you can enable later)
   - Click **"Create project"**
5. Wait for the project to be created, then click **"Continue"**

## Step 2: Get Your Firebase Configuration

### Option A: From Project Settings (Recommended)

1. In your Firebase project, click the **gear icon** ⚙️ next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to the **"Your apps"** section
4. Click the **Web icon** (`</>`) to add a web app
5. Register your app:
   - App nickname: "Dating App Web" (or any name)
   - **Don't check** "Also set up Firebase Hosting"
   - Click **"Register app"**
6. You'll see your Firebase configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project.appspot.com',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcdef1234567890',
};
```

### Option B: From General Settings

1. Go to **Project settings** (gear icon)
2. Scroll to the **"General"** tab
3. Look for the **"Your apps"** section
4. If you already have a web app, click on it to see the config
5. If not, follow Option A to create one

## Step 3: Enable Firebase Services

### Enable Authentication

1. In the left sidebar, click **"Authentication"**
2. Click **"Get started"**
3. Go to the **"Sign-in method"** tab
4. Enable **"Email/Password"**:
   - Click on "Email/Password"
   - Toggle **"Enable"**
   - Click **"Save"**
5. Enable **"Google"**:
   - Click on "Google"
   - Toggle **"Enable"**
   - Enter a support email
   - Click **"Save"**

### Create Firestore Database

1. In the left sidebar, click **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for development)
4. Select a location (choose closest to your users)
5. Click **"Enable"**

**⚠️ Important:** For production, you'll need to update Firestore security rules. For now, test mode allows read/write access.

### Set Up Storage

1. In the left sidebar, click **"Storage"**
2. Click **"Get started"**
3. Start with **"Start in test mode"**
4. Click **"Next"**
5. Choose a location (same as Firestore is recommended)
6. Click **"Done"**

## Step 4: Get Google OAuth Client ID (for Google Sign-In)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project from the dropdown at the top
3. Go to **"APIs & Services"** > **"Credentials"**
4. Under **"OAuth 2.0 Client IDs"**, find your **Web client**
5. Copy the **"Client ID"** (this is your `googleWebClientId`)

**OR** if you don't see a Web client:

1. Click **"Create Credentials"** > **"OAuth client ID"**
2. Application type: **"Web application"**
3. Name: "Dating App Web Client"
4. Authorized JavaScript origins: Add your Vercel URL (e.g., `https://your-app.vercel.app`)
5. Authorized redirect URIs: Add Firebase Auth domain
6. Click **"Create"**
7. Copy the **Client ID**

## Step 5: Update Your App Configuration

Now update `app.json` with your Firebase values:

```json
{
  "expo": {
    "extra": {
      "firebaseApiKey": "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "firebaseAuthDomain": "your-project.firebaseapp.com",
      "firebaseProjectId": "your-project-id",
      "firebaseStorageBucket": "your-project.appspot.com",
      "firebaseMessagingSenderId": "123456789012",
      "firebaseAppId": "1:123456789012:web:abcdef1234567890",
      "googleWebClientId": "123456789-abcdefghijklmnop.apps.googleusercontent.com"
    }
  }
}
```

## Step 6: Deploy Updated Configuration

After updating `app.json`:

```bash
cd /home/behar/dating-app
git add app.json
git commit -m "Add Firebase configuration"
git push  # If connected to GitHub
vercel --prod  # Redeploy to Vercel
```

## Quick Reference: Where to Find Each Value

| Value                       | Location                                                                    |
| --------------------------- | --------------------------------------------------------------------------- |
| `firebaseApiKey`            | Firebase Console > Project Settings > Your apps > Web app config            |
| `firebaseAuthDomain`        | Firebase Console > Project Settings > Your apps > Web app config            |
| `firebaseProjectId`         | Firebase Console > Project Settings > General tab > Project ID              |
| `firebaseStorageBucket`     | Firebase Console > Project Settings > Your apps > Web app config            |
| `firebaseMessagingSenderId` | Firebase Console > Project Settings > Your apps > Web app config            |
| `firebaseAppId`             | Firebase Console > Project Settings > Your apps > Web app config            |
| `googleWebClientId`         | Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client IDs |

## Troubleshooting

### "Permission denied" errors

- Make sure Firestore and Storage are in test mode (for development)
- Check that Authentication is enabled

### Google Sign-In not working

- Verify the OAuth consent screen is configured
- Check that the redirect URI matches your Firebase Auth domain
- Ensure the Client ID is correct

### Can't find the config

- Make sure you've created a **Web app** in Firebase (not iOS/Android)
- The config is only shown once when you create the app
- You can always create a new web app to see the config again

## Security Note

⚠️ **Important for Production:**

- Update Firestore security rules before going live
- Update Storage security rules
- Never commit sensitive keys to public repositories
- Consider using environment variables in Vercel instead of `app.json`
