# Quick Start Guide - Run Your Dating App

## Current Status

- ✅ Backend server is running
- ❌ Frontend (Expo) is NOT running

## To See Your Full App:

### Option 1: Run on Web Browser (Easiest)

```bash
cd /home/behar/dating-app
npm run web
```

This will:

- Start Expo development server
- Open your app in a web browser automatically
- You can see the full app interface

### Option 2: Run on Mobile Device

```bash
cd /home/behar/dating-app
npm start
```

Then:

- Scan the QR code with Expo Go app (iOS/Android)
- Or press `w` to open in web browser
- Or press `i` for iOS simulator (if you have Xcode)
- Or press `a` for Android emulator (if you have Android Studio)

### Option 3: Run Backend + Frontend Together

```bash
# Terminal 1 - Backend (already running)
cd /home/behar/dating-app/backend
npm start

# Terminal 2 - Frontend
cd /home/behar/dating-app
npm start
```

## What You Need:

1. **Node.js** - Should already be installed
2. **Dependencies** - Run if not installed:

   ```bash
   npm install
   ```

3. **Environment Variables** - Make sure `.env` file exists with:
   - API URLs
   - Firebase credentials (if using Firebase)
   - Other required configs

## Troubleshooting:

### If you see errors:

1. **"Module not found"** → Run `npm install`
2. **"Cannot connect to backend"** → Check backend is running on correct port
3. **"Expo not found"** → Run `npm install -g expo-cli` or use `npx expo start`

### Check Backend URL:

Make sure `src/config/api.js` points to your running backend:

- Usually: `http://localhost:3000` or your deployed backend URL

## Quick Commands:

```bash
# Start frontend (web)
npm run web

# Start frontend (all platforms)
npm start

# Check if backend is running
curl http://localhost:3000/health

# Install dependencies
npm install
```

---

**Note:** The HTML preview files I created are just static visual previews. To see the **actual working app** with all functionality, you need to run the Expo development server!
