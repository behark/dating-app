# 🚀 Deployment Guide - Vercel (Frontend) & Render (Backend)

**Status:** ✅ Ready to Deploy (with environment variables)

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### ✅ What's Already Configured

- ✅ Vercel config file (`vercel.json`) - properly configured
- ✅ Render blueprint (`render.yaml`) - ready for backend deployment
- ✅ Backend start script - configured
- ✅ Frontend build script - `vercel-build` ready
- ✅ CORS configuration - includes Vercel domain
- ✅ Security fixes - all critical issues resolved
- ✅ Environment validation - backend validates required vars on startup
- ✅ API URL configuration - frontend dynamically uses backend URL

### ⚠️ What You Need to Provide

**Backend (Render):** 5 critical variables  
**Frontend (Vercel):** 7 Firebase variables + backend URL

---

## 🔧 BACKEND DEPLOYMENT (Render)

### Step 1: Generate Secure Secrets

Run these commands to generate secure random values:

```bash
# JWT Secret (64 characters)
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# JWT Refresh Secret (64 characters)
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Hash Salt (32 characters)
node -e "console.log('HASH_SALT=' + require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Environment Variables for Render

**🔴 CRITICAL (Required for server to start):**

```bash
# Authentication Secrets
JWT_SECRET=<paste-generated-value-here>
JWT_REFRESH_SECRET=<paste-generated-value-here>
HASH_SALT=<paste-generated-value-here>

# Database
MONGODB_URI=<your-mongodb-atlas-connection-string>

# Server
NODE_ENV=production
PORT=10000
```

**🟡 IMPORTANT (Required for functionality):**

```bash
# Frontend CORS
FRONTEND_URL=https://your-vercel-app.vercel.app
CORS_ORIGIN=https://your-vercel-app.vercel.app

# JWT Configuration
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

**🟢 OPTIONAL (For enhanced features):**

```bash
# Redis (for caching and job queues)
REDIS_HOST=<redis-host>
REDIS_PORT=6379
REDIS_PASSWORD=<redis-password>
# OR use Redis URL
REDIS_URL=redis://:<password>@<host>:<port>

# Email Service (for password reset, notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<your-email>
SMTP_PASS=<your-app-password>
EMAIL_FROM=noreply@yourapp.com

# File Storage - Cloudinary (for photos/media)
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# OAuth Providers
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
FACEBOOK_APP_ID=<facebook-app-id>
FACEBOOK_APP_SECRET=<facebook-app-secret>

# OpenAI (for AI features)
OPENAI_API_KEY=<openai-api-key>
OPENAI_MODEL=gpt-4

# Monitoring
SENTRY_DSN=<sentry-dsn>
DATADOG_API_KEY=<datadog-api-key>

# Push Notifications
EXPO_ACCESS_TOKEN=<expo-access-token>
```

### Step 3: Deploy to Render

**Option A: Using Blueprint (Recommended)**

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will detect `render.yaml` automatically
5. Review the configuration
6. **Add the critical environment variables** (JWT_SECRET, etc.)
7. Click **"Apply"**

**Option B: Manual Setup**

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New"** → **"Web Service"**
3. Connect your repository
4. Configure:
   - **Name:** `dating-app-backend`
   - **Region:** Oregon (or nearest to you)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (or upgrade as needed)
5. Add all environment variables listed above
6. Click **"Create Web Service"**

### Step 4: Get Your Backend URL

After deployment, Render will give you a URL like:
```
https://dating-app-backend-x4yq.onrender.com
```

**Copy this URL - you'll need it for Vercel!**

---

## 🎨 FRONTEND DEPLOYMENT (Vercel)

### Step 1: Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create one)
3. Go to **Project Settings** → **General**
4. Scroll to **"Your apps"** section
5. Click **Web app** (or add one if not exists)
6. Copy the config values

### Step 2: Environment Variables for Vercel

**🔴 CRITICAL (Required):**

```bash
# Backend API URL (from Render deployment)
EXPO_PUBLIC_API_URL=https://your-render-backend.onrender.com

# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=<your-firebase-api-key>
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-project>.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
EXPO_PUBLIC_FIREBASE_APP_ID=<your-app-id>

# Google OAuth (for Google Sign-In)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<your-google-web-client-id>
```

**🟢 OPTIONAL:**

```bash
# Cloudinary (if using for frontend image optimization)
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=<your-cloud-name>

# Analytics
EXPO_PUBLIC_MIXPANEL_TOKEN=<mixpanel-token>

# Environment
EXPO_PUBLIC_ENV=production
```

### Step 3: Deploy to Vercel

**Option A: Using Vercel CLI (Recommended)**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (from root directory)
vercel

# Follow prompts:
# - Link to existing project or create new
# - Choose root directory: ./
# - Override settings? No

# Add environment variables (or use dashboard)
vercel env add EXPO_PUBLIC_API_URL production
vercel env add EXPO_PUBLIC_FIREBASE_API_KEY production
# ... add all other variables

# Deploy to production
vercel --prod
```

**Option B: Using Vercel Dashboard**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Other
   - **Root Directory:** `./` (leave default)
   - **Build Command:** `npm run vercel-build`
   - **Output Directory:** `web-build`
   - **Install Command:** `npm install --legacy-peer-deps`
5. Add environment variables (Settings → Environment Variables):
   - Add all variables listed above
   - Make sure to select **"Production"** environment
6. Click **"Deploy"**

### Step 4: Update Backend CORS

After Vercel deployment, you'll get a URL like:
```
https://your-app-name.vercel.app
```

**Update Render backend environment variables:**
```bash
FRONTEND_URL=https://your-app-name.vercel.app
CORS_ORIGIN=https://your-app-name.vercel.app
```

Then **restart** the Render backend service.

---

## 🗄️ DATABASE SETUP

### MongoDB Atlas (Free Tier Available)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Click **"Connect"** → **"Connect your application"**
4. Copy the connection string
5. Replace `<password>` with your database password
6. Example:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dating-app?retryWrites=true&w=majority
   ```
7. Add this as `MONGODB_URI` in Render

**Important:**
- Whitelist Render's IP addresses (or use `0.0.0.0/0` for all IPs)
- Create a database user with read/write permissions

---

## 🔥 FIREBASE SETUP

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Follow the wizard

### Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **"Get started"**
3. Enable sign-in methods:
   - ✅ Email/Password
   - ✅ Google (recommended)
   - Optional: Facebook, Apple

### Step 3: Configure Firestore

1. Go to **Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in production mode"**
4. Select a location (choose nearest to your users)

### Step 4: Get Configuration

See "Frontend Step 1" above for getting Firebase config values.

---

## ☁️ OPTIONAL SERVICES

### Cloudinary (Image/Media Storage)

**Free Tier:** 25 GB storage, 25 GB bandwidth/month

1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Get your **Cloud Name**, **API Key**, **API Secret**
3. Add to both Render backend and Vercel frontend

**Backend (.env):**
```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Frontend (.env):**
```bash
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

### Redis (Caching & Job Queues)

**Free Options:**
- [Upstash](https://upstash.com/) - Free 10K commands/day
- [Redis Cloud](https://redis.com/redis-enterprise-cloud/) - 30MB free

1. Create a Redis instance
2. Get connection details
3. Add to Render backend:
   ```bash
   REDIS_URL=redis://:<password>@<host>:<port>
   ```

### Email Service

**Options:**
- Gmail (free, limited) - Use App Password
- SendGrid (free 100 emails/day)
- Mailgun (free tier available)

**For Gmail:**
1. Enable 2FA on your Google account
2. Generate an App Password
3. Use in Render:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```

---

## ✅ POST-DEPLOYMENT TESTING

### Backend Health Check

```bash
# Check if backend is running
curl https://your-backend.onrender.com/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2026-01-04T...",
  "uptime": 123.45
}
```

### Test Authentication

1. Open your Vercel app
2. Try signing up with email/password
3. Try logging in
4. Try Google OAuth

### Check Browser Console

Open browser DevTools (F12) and check for:
- ✅ No CORS errors
- ✅ API requests succeeding
- ✅ No Firebase errors
- ✅ WebSocket connection established

---

## 🐛 TROUBLESHOOTING

### Backend won't start on Render

**Error:** "JWT_SECRET environment variable is not set"
- **Solution:** Add JWT_SECRET, JWT_REFRESH_SECRET, HASH_SALT to Render environment variables

**Error:** "MongoDB connection failed"
- **Solution:** Check MONGODB_URI is correct and MongoDB Atlas allows Render's IP

### Frontend can't connect to backend

**Error:** CORS errors in browser
- **Solution:** Update FRONTEND_URL and CORS_ORIGIN in Render to match your Vercel URL

**Error:** "Network request failed"
- **Solution:** Check EXPO_PUBLIC_API_URL in Vercel matches your Render backend URL

### Firebase authentication not working

- Check all 6 Firebase variables are set in Vercel
- Verify Firebase authentication is enabled in Firebase Console
- Check Firebase console for error logs

### Google OAuth not working

- Add your Vercel domain to Google OAuth authorized domains
- Check EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is set correctly

---

## 📊 MONITORING

### Render Dashboard
- Monitor backend health, logs, metrics
- Check for errors in real-time logs

### Vercel Dashboard
- Monitor frontend deployments
- Check build logs
- View analytics

### Firebase Console
- Monitor authentication
- Check Firestore usage
- View error logs

---

## 💰 COST ESTIMATION

### Free Tier (Perfect for MVP/Testing)

| Service | Free Tier | Limit |
|---------|-----------|-------|
| **Render** | Free | 750 hours/month, sleeps after 15 min inactivity |
| **Vercel** | Free | 100 GB bandwidth/month, unlimited deployments |
| **MongoDB Atlas** | Free | 512 MB storage, shared cluster |
| **Firebase** | Free | 50K reads/day, 20K writes/day, 1 GB storage |
| **Cloudinary** | Free | 25 GB storage, 25 GB bandwidth/month |

**Total: $0/month** for getting started!

### Scaling Costs (When you grow)

- **Render Starter:** $7/month (no sleep, better performance)
- **Vercel Pro:** $20/month (team features, more bandwidth)
- **MongoDB M10:** $57/month (dedicated cluster)
- **Redis Upstash:** $10/month for higher limits

---

## 🎯 DEPLOYMENT CHECKLIST

### Before Deploying:

- [ ] Generated secure JWT_SECRET (64 chars)
- [ ] Generated secure JWT_REFRESH_SECRET (64 chars, different)
- [ ] Generated secure HASH_SALT (32 chars)
- [ ] Created MongoDB Atlas cluster
- [ ] Created Firebase project
- [ ] Got Firebase config values
- [ ] Tested backend locally with production env vars
- [ ] Tested frontend locally with production env vars

### Backend Deployment:

- [ ] Deployed backend to Render
- [ ] Added all critical environment variables
- [ ] Backend health check passes
- [ ] Can access /health endpoint
- [ ] Logs show "Environment validation passed"

### Frontend Deployment:

- [ ] Deployed frontend to Vercel
- [ ] Added all Firebase environment variables
- [ ] Added EXPO_PUBLIC_API_URL (backend URL)
- [ ] Updated CORS settings in backend with Vercel URL
- [ ] Can access Vercel app in browser

### Final Testing:

- [ ] User registration works
- [ ] User login works
- [ ] Google OAuth works (if enabled)
- [ ] Can upload photos
- [ ] Real-time chat works
- [ ] No errors in browser console
- [ ] No errors in Render logs

---

## 📞 SUPPORT

If you encounter issues:

1. **Backend Logs:** Check Render dashboard → Logs
2. **Frontend Logs:** Check browser console (F12)
3. **Environment Variables:** Verify all are set correctly
4. **Health Check:** Test backend `/health` endpoint
5. **Database:** Verify MongoDB connection in Render logs

**Common Issues Document:** `CRITICAL_ISSUES_REPORT.md`
**Security Summary:** `SECURITY_FIXES_SUMMARY.md`

---

## 🚀 QUICK DEPLOY COMMANDS

```bash
# 1. Generate secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('HASH_SALT=' + require('crypto').randomBytes(32).toString('hex'))"

# 2. Deploy to Vercel
npm install -g vercel
vercel login
vercel --prod

# 3. Deploy to Render
# Use Render dashboard - it's easier for first deployment
```

---

**✅ You're ready to deploy! Follow the steps above and your dating app will be live in ~30 minutes!**
