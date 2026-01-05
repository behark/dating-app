# Render Environment Variables Guide

## ⚠️ Important: Do NOT Add All Variables

**You should NOT add all variables from your `.env` file to Render.** Many are for local development only.

---

## ✅ **MUST ADD** (Required for Production)

These are **critical** and must be added to Render:

### Core Server

- ✅ `NODE_ENV` = `production` (already in render.yaml)
- ✅ `PORT` = `10000` (already in render.yaml)
- ✅ `FRONTEND_URL` = Your production frontend URL (e.g., `https://dating-app-beharks-projects.vercel.app`)
- ✅ `CORS_ORIGIN` = Your production frontend URL (same as above)

### Database

- ✅ `MONGODB_URI` = Your MongoDB Atlas connection string (already set)

### Authentication (CRITICAL - Generate New Secrets!)

- ✅ `JWT_SECRET` = **Generate a new secure random 64+ character string** (don't use dev value!)
- ✅ `JWT_REFRESH_SECRET` = **Generate a different secure random 64+ character string**
- ✅ `JWT_EXPIRES_IN` = `7d` (already in render.yaml)
- ✅ `JWT_REFRESH_EXPIRES_IN` = `30d` (already in render.yaml)
- ✅ `HASH_SALT` = **Generate a new secure random 32+ character string** (don't use dev value!)
- ✅ `ENCRYPTION_KEY` = **Generate a new secure 32-byte key** (don't use dev value!)

### OAuth (If Using)

- ✅ `GOOGLE_CLIENT_ID` = Your Google OAuth client ID (already set)
- ✅ `GOOGLE_CLIENT_SECRET` = Your Google OAuth secret (already set)

### Firebase (If Using Push Notifications/Firestore)

- ✅ `FIREBASE_PROJECT_ID` = `my-project-de65d` (needs to be added)
- ✅ `FIREBASE_CLIENT_EMAIL` = `firebase-adminsdk@my-project-de65d.iam.gserviceaccount.com` (needs to be added)
- ✅ `FIREBASE_PRIVATE_KEY` = Full private key from Firebase service account (needs to be added)

### Monitoring

- ✅ `SENTRY_DSN` = Your Sentry DSN (needs to be added)
- ✅ `DD_API_KEY` = Your Datadog API key (already set)
- ✅ `DD_SITE` = `datadoghq.eu` (already set)
- ✅ `DD_ENV` = `prod` (already set)
- ✅ `DD_AGENT_HOST` = `localhost` (already set)

---

## 🔶 **SHOULD ADD** (If Using These Features)

Only add these if you're actually using the feature:

### File Storage (Cloudinary)

- 🔶 `STORAGE_PROVIDER` = `cloudinary`
- 🔶 `CLOUDINARY_CLOUD_NAME` = Your Cloudinary cloud name
- 🔶 `CLOUDINARY_API_KEY` = Your Cloudinary API key
- 🔶 `CLOUDINARY_API_SECRET` = Your Cloudinary API secret
- 🔶 `CLOUDINARY_UPLOAD_PRESET` = Your upload preset name

### AI Features (OpenAI)

- 🔶 `OPENAI_API_KEY` = Your OpenAI API key (if using AI features)
- 🔶 `OPENAI_MODEL` = `gpt-4` or `gpt-3.5-turbo`

### Email Service (SMTP)

- 🔶 `SMTP_HOST` = Your SMTP server
- 🔶 `SMTP_PORT` = `587`
- 🔶 `SMTP_USER` = Your SMTP username
- 🔶 `SMTP_PASS` = Your SMTP password
- 🔶 `EMAIL_FROM` = `noreply@yourdomain.com`

### Redis (If Using Caching/Queues)

- 🔶 `REDIS_URL` = Your Redis connection URL (or use individual settings below)
- 🔶 `REDIS_HOST` = Your Redis host
- 🔶 `REDIS_PORT` = `6379`
- 🔶 `REDIS_PASSWORD` = Your Redis password

### Payment Processing (Stripe)

- 🔶 `STRIPE_SECRET_KEY` = Your Stripe secret key
- 🔶 `STRIPE_PUBLISHABLE_KEY` = Your Stripe publishable key
- 🔶 `STRIPE_WEBHOOK_SECRET` = Your Stripe webhook secret

---

## ❌ **DO NOT ADD** (Development Only)

These should **NOT** be added to Render:

- ❌ `DEBUG` = `true` (development only)
- ❌ `LOG_LEVEL` = `debug` (use `info` or `warn` in production)
- ❌ `ENABLE_SWAGGER` = `true` (disable in production for security)
- ❌ `VERCEL` = `false` (not needed on Render)
- ❌ Local development URLs (localhost:3000, localhost:19006, etc.)
- ❌ `REDIS_HOST` = `localhost` (use production Redis URL instead)
- ❌ `REDIS_PORT` = `6379` (if using `REDIS_URL`, this is redundant)
- ❌ `REDIS_DB` = `0` (default, not needed)
- ❌ `DD_APM_INSTRUMENTATION_ENABLED` = `host` (Render handles this)
- ❌ `DD_APM_INSTRUMENTATION_LIBRARIES` (not needed on Render)
- ❌ Firebase frontend config variables (these are for frontend, not backend):
  - ❌ `FIREBASE_API_KEY`
  - ❌ `FIREBASE_AUTH_DOMAIN`
  - ❌ `FIREBASE_STORAGE_BUCKET`
  - ❌ `FIREBASE_MESSAGING_SENDER_ID`
  - ❌ `FIREBASE_APP_ID`
  - ❌ `FIREBASE_MEASUREMENT_ID`

---

## 🔐 **Security Checklist**

Before deploying to production:

1. **Generate new secrets** for:
   - `JWT_SECRET` (64+ characters)
   - `JWT_REFRESH_SECRET` (64+ characters, different from JWT_SECRET)
   - `HASH_SALT` (32+ characters)
   - `ENCRYPTION_KEY` (32 bytes)

2. **Use production values** for:
   - `FRONTEND_URL` (your actual production URL)
   - `CORS_ORIGIN` (your actual production URL)
   - `MONGODB_URI` (production MongoDB Atlas cluster)

3. **Never commit** `.env` file to git

4. **Use Render's secure environment variables** - they're encrypted at rest

---

## 📋 **Quick Reference: Current Status**

Based on your current Render setup:

### ✅ Already Configured (7)

- `NODE_ENV`
- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `DD_API_KEY`
- `DD_SITE`
- `DD_ENV`
- `DD_AGENT_HOST`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `FRONTEND_URL`
- `CORS_ORIGIN`
- `HASH_SALT`

### ❌ Missing (4) - Add These:

1. `SENTRY_DSN` = `https://e21c92d839607c2d0f9378d08ca96903@o4510655194726400.ingest.de.sentry.io/4510655204687952`
2. `FIREBASE_PROJECT_ID` = `my-project-de65d`
3. `FIREBASE_CLIENT_EMAIL` = `firebase-adminsdk@my-project-de65d.iam.gserviceaccount.com`
4. `FIREBASE_PRIVATE_KEY` = (Get from Firebase Console → Service Accounts → Generate Key)

---

## 🚀 **How to Add Variables to Render**

1. Go to: https://dashboard.render.com
2. Select your service: `dating-app-backend`
3. Click: **Environment** tab
4. Click: **Add Environment Variable**
5. Add each variable:
   - **Key**: Variable name (e.g., `SENTRY_DSN`)
   - **Value**: Variable value
6. Click: **Save Changes**
7. Service will automatically redeploy

---

## 💡 **Pro Tips**

1. **Use Render's "Sync" feature** for variables that should be the same across environments
2. **Mark sensitive variables** - Render will mask them in logs
3. **Test after adding** - Check your service logs to ensure variables are loaded correctly
4. **Use different secrets** for staging vs production if you have multiple environments

---

## 🔍 **Verify Variables Are Set**

After adding variables, you can verify they're loaded by:

1. Checking Render service logs
2. Adding a temporary endpoint that returns `process.env` (remove after testing!)
3. Using the check script: `node check-render-env-vars.js`

---

## 📝 **Summary**

**Add to Render:**

- ✅ All production-critical variables (database, auth, OAuth)
- ✅ Variables for features you're using (Cloudinary, OpenAI, etc.)
- ✅ Monitoring variables (Sentry, Datadog)

**Don't Add:**

- ❌ Development-only variables (DEBUG, localhost URLs)
- ❌ Frontend-only variables (Firebase frontend config)
- ❌ Variables with default values that work fine

**Always:**

- 🔐 Generate new secure secrets for production
- 🔐 Use production URLs, not localhost
- 🔐 Never use development secrets in production
