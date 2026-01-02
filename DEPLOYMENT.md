# Deployment Guide

This guide explains how to deploy the dating app to GitHub and Vercel.

## Prerequisites

- GitHub account
- Vercel account (sign up at https://vercel.com)
- Vercel CLI installed: `npm install -g vercel`

## Step 1: Push to GitHub

### Option A: Using GitHub CLI (Recommended)

```bash
# Install GitHub CLI if not already installed
# On Linux: sudo apt install gh
# On macOS: brew install gh

# Login to GitHub
gh auth login

# Create and push to GitHub
cd /home/behar/dating-app
gh repo create dating-app --public --source=. --remote=origin --push
```

### Option B: Manual GitHub Setup

1. Create a new repository on GitHub (don't initialize with README)

2. Add remote and push:
```bash
cd /home/behar/dating-app
git add .
git commit -m "Initial commit: Tinder-style dating app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/dating-app.git
git push -u origin main
```

## Step 2: Configure Environment Variables

Before deploying, you need to set up your Firebase credentials in Vercel:

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add the following variables:
   - `EXPO_PUBLIC_FIREBASE_API_KEY`
   - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
   - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `EXPO_PUBLIC_FIREBASE_APP_ID`
   - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

**OR** update `app.json` with your Firebase credentials before pushing to GitHub.

## Step 3: Deploy to Vercel

### Using Vercel CLI

```bash
cd /home/behar/dating-app

# Login to Vercel (first time only)
vercel login

# Deploy
vercel

# For production deployment
vercel --prod
```

### Using Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Other
   - **Build Command**: `npm run web:build`
   - **Output Directory**: `web-build`
   - **Install Command**: `npm install`
4. Add environment variables (if not using app.json)
5. Click Deploy

## Step 4: Update Firebase Configuration for Web

If you're using environment variables, update `src/config/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || Constants.expoConfig?.extra?.firebaseApiKey,
  // ... rest of config
};
```

## Troubleshooting

### Build Fails on Vercel

1. Check that all dependencies are in `package.json`
2. Ensure Node.js version is compatible (Vercel uses Node 18+ by default)
3. Check build logs in Vercel dashboard

### Web Build Issues

- Make sure `expo export -p web` works locally first
- Check that all React Native components have web alternatives
- Some native modules may not work on web (like ImagePicker)

### Firebase Connection Issues

- Verify environment variables are set correctly
- Check Firebase console for API restrictions
- Ensure Firestore rules allow web access

## Continuous Deployment

Once connected to GitHub, Vercel will automatically deploy:
- Every push to `main` branch → Production
- Pull requests → Preview deployments

## Notes

- This is a **web version** of the mobile app
- Some mobile-specific features may need web alternatives
- For native mobile apps, use Expo's build service (EAS Build)
- The web version works best on desktop browsers
