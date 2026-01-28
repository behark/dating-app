# Production Environment Variables Guide

Complete guide for setting up environment variables for the Dating App in production.

---

## 🏗️ Architecture Recommendation

### Current Setup: Backend on Render + Frontend on Vercel ✅ RECOMMENDED

**Keep your current architecture.** Here's why:

| Aspect | Current (Render + Vercel) | All on Vercel |
|--------|---------------------------|---------------|
| **Backend** | Full Node.js server with WebSockets | Serverless functions (cold starts, 10s timeout) |
| **WebSockets** | ✅ Native support | ❌ Not supported in Vercel Functions |
| **Database** | Any MongoDB Atlas | Same |
| **File Storage** | Cloudinary/S3 | Same |
| **Cost** | Render free tier + Vercel free tier | Similar |
| **Real-time Chat** | ✅ Socket.io works perfectly | ❌ Would need external service (Pusher/Ably) |
| **Long-running tasks** | ✅ Background jobs supported | ❌ 10-60s function timeout |

**Verdict**: Your dating app needs WebSockets for real-time chat and typing indicators. **Keep Render for backend.**

### If You Want Everything on One Platform

Consider **Railway** or **Fly.io** instead - they support both frontend and persistent backend servers.

---

## 📱 Frontend Environment Variables (Vercel/Expo)

Set these in **Vercel Dashboard** → Project → Settings → Environment Variables

### Required Variables

```bash
# ===========================================
# API Configuration (CRITICAL)
# ===========================================
EXPO_PUBLIC_API_URL=https://dating-app-backend-x4yq.onrender.com/api
EXPO_PUBLIC_BACKEND_URL=https://dating-app-backend-x4yq.onrender.com
EXPO_PUBLIC_ENV=production

# ===========================================
# Google OAuth (Required for Google Sign-In)
# ===========================================
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-google-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-google-android-client-id.apps.googleusercontent.com

# ===========================================
# Firebase Configuration (if using Firebase)
# ===========================================
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXX

# ===========================================
# Cloudinary (Image CDN)
# ===========================================
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
EXPO_PUBLIC_CDN_URL=https://res.cloudinary.com/your-cloud-name

# ===========================================
# Monitoring (Sentry)
# ===========================================
EXPO_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# ===========================================
# App Info
# ===========================================
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_BUILD_NUMBER=1

# ===========================================
# Legal & Support URLs
# ===========================================
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://your-domain.com/privacy-policy.html
EXPO_PUBLIC_TERMS_OF_SERVICE_URL=https://your-domain.com/terms-of-service.html
EXPO_PUBLIC_SUPPORT_EMAIL=support@datingapp.com
```

---

## 🖥️ Backend Environment Variables (Render)

Set these in **Render Dashboard** → Web Service → Environment

### Critical Security Variables (MUST CHANGE)

```bash
# ===========================================
# SECURITY - Generate unique values!
# ===========================================
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-64-char-random-string-here
JWT_REFRESH_SECRET=different-64-char-random-string-here
HASH_SALT=your-32-char-random-string-here
API_KEY=your-api-key-for-server-to-server
```

### Server Configuration

```bash
# ===========================================
# Server
# ===========================================
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
FRONTEND_URL=https://dating-app-seven-peach.vercel.app
CORS_ORIGIN=https://dating-app-seven-peach.vercel.app
```

### Database (MongoDB Atlas)

```bash
# ===========================================
# MongoDB Atlas
# ===========================================
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dating-app?retryWrites=true&w=majority
MONGODB_POOL_SIZE=10
```

### Cache (Redis - Optional but Recommended)

```bash
# ===========================================
# Redis (Upstash recommended for serverless)
# ===========================================
REDIS_URL=redis://default:password@your-redis-host:6379
```

### Authentication

```bash
# ===========================================
# JWT Configuration
# ===========================================
JWT_EXPIRES_IN=7d
JWT_ACCESS_EXPIRY=7d
JWT_REFRESH_EXPIRES_IN=30d
JWT_REFRESH_EXPIRY=30d
```

### OAuth Providers

```bash
# ===========================================
# Google OAuth
# ===========================================
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# ===========================================
# Apple Sign In (iOS)
# ===========================================
APPLE_CLIENT_ID=com.yourcompany.datingapp
APPLE_TEAM_ID=your-team-id
APPLE_KEY_ID=your-key-id
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
```

### File Storage (Cloudinary)

```bash
# ===========================================
# Cloudinary
# ===========================================
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_PRESET=dating-app-uploads
MAX_FILE_SIZE=5242880
```

### Push Notifications

```bash
# ===========================================
# Expo Push Notifications
# ===========================================
EXPO_ACCESS_TOKEN=your-expo-access-token
```

### Monitoring

```bash
# ===========================================
# Sentry
# ===========================================
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### Email (Optional)

```bash
# ===========================================
# Email Service (SendGrid, Mailgun, etc.)
# ===========================================
EMAIL_SERVICE=sendgrid
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@datingapp.com
```

### Feature Flags

```bash
# ===========================================
# Features
# ===========================================
FEATURE_PREMIUM=true
FEATURE_AI_MATCHING=true
FEATURE_CHAT=true
FEATURE_VIDEO_CALLS=false
MAINTENANCE_MODE=false
```

### Rate Limiting

```bash
# ===========================================
# Rate Limiting
# ===========================================
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
FREE_DAILY_SWIPE_LIMIT=100
PREMIUM_DAILY_SWIPE_LIMIT=500
```

### Logging

```bash
# ===========================================
# Logging
# ===========================================
LOG_LEVEL=info
LOG_FORMAT=json
```

---

## 🚀 EAS Build Variables (Expo)

Set these in **Expo Dashboard** → Project → Secrets or in `eas.json`

```bash
# For EAS Build
SENTRY_AUTH_TOKEN=your-sentry-auth-token
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project

# App Store Submission
APPLE_ID=your-apple-id@email.com
ASC_APP_ID=your-app-store-connect-app-id
APPLE_TEAM_ID=your-apple-team-id
```

---

## 📋 Quick Setup Checklist

### Vercel (Frontend)
- [ ] `EXPO_PUBLIC_API_URL` - Your Render backend URL
- [ ] `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` - From Google Cloud Console
- [ ] `EXPO_PUBLIC_FIREBASE_*` - From Firebase Console (if using)
- [ ] `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` - From Cloudinary
- [ ] `EXPO_PUBLIC_SENTRY_DSN` - From Sentry

### Render (Backend)
- [ ] `JWT_SECRET` - **Generate unique 64-char string**
- [ ] `JWT_REFRESH_SECRET` - **Generate different 64-char string**
- [ ] `MONGODB_URI` - From MongoDB Atlas
- [ ] `FRONTEND_URL` - Your Vercel frontend URL
- [ ] `CORS_ORIGIN` - Your Vercel frontend URL
- [ ] `CLOUDINARY_*` - From Cloudinary dashboard
- [ ] `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - From Google Cloud Console

---

## 🔐 Security Notes

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Use different secrets** for JWT_SECRET and JWT_REFRESH_SECRET
3. **Rotate secrets** periodically (every 90 days recommended)
4. **Use MongoDB Atlas IP whitelist** - Allow only Render's IPs
5. **Enable 2FA** on all service accounts (Render, Vercel, MongoDB, etc.)

---

## 🌐 Service URLs Quick Reference

| Service | Dashboard URL |
|---------|--------------|
| **Render** | https://dashboard.render.com |
| **Vercel** | https://vercel.com/dashboard |
| **MongoDB Atlas** | https://cloud.mongodb.com |
| **Cloudinary** | https://cloudinary.com/console |
| **Sentry** | https://sentry.io |
| **Firebase** | https://console.firebase.google.com |
| **Google Cloud** | https://console.cloud.google.com |
| **Expo** | https://expo.dev |
