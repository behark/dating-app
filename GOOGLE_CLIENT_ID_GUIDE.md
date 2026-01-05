# How to Find Your Google Web Client ID

The string `baDyyDNoCITkXoSQafVViT1IWbw1` doesn't look like a Google Web Client ID. Here's how to find the correct one:

## What a Google Web Client ID Looks Like

A Google Web Client ID has this format:

```
466295464562-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
```

It's typically:

- A long string with numbers and letters
- Ends with `.apps.googleusercontent.com`
- Has your project number at the start (466295464562 in your case)

## Where to Find It

### Method 1: From Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **my-project-de65d**
3. Click **"Authentication"** in the left sidebar
4. Go to **"Sign-in method"** tab
5. Click on **"Google"** provider
6. You'll see a section that says **"Web SDK configuration"**
7. Look for **"Web client ID"** - it will look like:
   ```
   466295464562-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
   ```
8. Copy that entire string

### Method 2: From Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Make sure you select your Firebase project: **my-project-de65d**
3. Go to **"APIs & Services"** → **"Credentials"**
4. Under **"OAuth 2.0 Client IDs"**, find the one with type **"Web client"**
5. Click on it to see the details
6. Copy the **"Client ID"** (it's the long string ending in `.apps.googleusercontent.com`)

## What is `baDyyDNoCITkXoSQafVViT1IWbw1`?

This string could be:

- A Firestore document ID
- A user UID
- An API key (but API keys are longer and start with "AIza")
- Some other identifier

**It's NOT a Google Web Client ID** because:

- It doesn't end with `.apps.googleusercontent.com`
- It's too short
- It doesn't have the project number prefix

## If You Don't See a Web Client ID

If you don't see a Web client ID in Firebase Console, you need to:

1. Enable Google Sign-In in Firebase:
   - Firebase Console → Authentication → Sign-in method
   - Click "Google"
   - Toggle "Enable"
   - Enter a support email
   - Click "Save"

2. After enabling, the Web client ID will appear automatically

## Update app.json

Once you have the correct Web Client ID, update `app.json`:

```json
"googleWebClientId": "466295464562-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com"
```

Then redeploy:

```bash
git add app.json
git commit -m "Add Google Web Client ID"
vercel --prod
```
