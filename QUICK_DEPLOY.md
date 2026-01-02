# Quick Deployment Guide

## 🚀 Deploy to GitHub & Vercel

### Step 1: Authenticate with GitHub

```bash
gh auth login
```

Follow the prompts to authenticate.

### Step 2: Push to GitHub

```bash
cd /home/behar/dating-app

# Create and push to GitHub
gh repo create dating-app --public --source=. --remote=origin --push
```

**OR** if you prefer manual setup:

1. Create a new repo at https://github.com/new (name it `dating-app`)
2. Then run:
```bash
git remote add origin https://github.com/YOUR_USERNAME/dating-app.git
git push -u origin main
```

### Step 3: Configure Firebase (IMPORTANT!)

Before deploying, update your Firebase credentials in `app.json`:

```json
"extra": {
  "firebaseApiKey": "YOUR_ACTUAL_API_KEY",
  "firebaseAuthDomain": "YOUR_PROJECT.firebaseapp.com",
  "firebaseProjectId": "YOUR_PROJECT_ID",
  "firebaseStorageBucket": "YOUR_PROJECT.appspot.com",
  "firebaseMessagingSenderId": "YOUR_SENDER_ID",
  "firebaseAppId": "YOUR_APP_ID",
  "googleWebClientId": "YOUR_GOOGLE_CLIENT_ID"
}
```

Then commit and push:
```bash
git add app.json
git commit -m "Add Firebase configuration"
git push
```

### Step 4: Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)

```bash
# Login to Vercel (first time only)
vercel login

# Deploy to production
cd /home/behar/dating-app
vercel --prod
```

#### Option B: Using Vercel Dashboard

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your `dating-app` repository
4. Configure:
   - **Framework Preset**: Other
   - **Build Command**: `npm run web:build`
   - **Output Directory**: `web-build`
   - **Install Command**: `npm install`
5. Click "Deploy"

### Step 5: Set Environment Variables (Alternative to app.json)

If you prefer using environment variables instead of `app.json`:

1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Add these variables:
   - `EXPO_PUBLIC_FIREBASE_API_KEY`
   - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
   - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `EXPO_PUBLIC_FIREBASE_APP_ID`
   - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

Then update `src/config/firebase.js` to use `process.env.EXPO_PUBLIC_*` variables.

## ✅ Done!

Your app will be live at: `https://your-project.vercel.app`

## 🔄 Continuous Deployment

Once connected, Vercel automatically deploys:
- Every push to `main` → Production
- Pull requests → Preview deployments

## 📝 Notes

- This deploys the **web version** of your app
- For native mobile apps, use Expo's EAS Build service
- Make sure Firebase Firestore rules allow web access
