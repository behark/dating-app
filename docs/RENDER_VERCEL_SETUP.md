# Production Deployment Environment Setup

## Quick Reference for Render (Backend) and Vercel (Frontend)

---

## 🚀 Render.com (Backend) Environment Variables

### Step 1: Navigate to Environment

1. Go to Render Dashboard → Your Web Service
2. Click "Environment" tab
3. Add each variable below

### Step 2: Add Variables

#### 🔴 CRITICAL (App won't work without these)

| Key                  | Type   | Example Value                                                                        | Notes                                                                           |
| -------------------- | ------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `NODE_ENV`           | Plain  | `production`                                                                         | Always "production"                                                             |
| `JWT_SECRET`         | Secret | `(64-char random hex)`                                                               | Run: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | Secret | `(64-char random hex)`                                                               | Generate separately, must be different from JWT_SECRET                          |
| `HASH_SALT`          | Secret | `(32-char random)`                                                                   | Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `MONGODB_URI`        | Secret | `mongodb+srv://user:pass@cluster.mongodb.net/dating-app?retryWrites=true&w=majority` | From MongoDB Atlas                                                              |
| `FRONTEND_URL`       | Plain  | `https://your-app.vercel.app`                                                        | Your Vercel deployment URL                                                      |

#### 🟡 IMPORTANT (Features will break without these)

| Key                     | Type   | Example Value                             | Notes                      |
| ----------------------- | ------ | ----------------------------------------- | -------------------------- |
| `REDIS_URL`             | Secret | `redis://default:xxx@xxx.upstash.io:6379` | From Upstash or similar    |
| `EMAIL_SERVICE`         | Plain  | `gmail`                                   | Or `sendgrid`, etc.        |
| `EMAIL_USER`            | Secret | `your-email@gmail.com`                    | Email account              |
| `EMAIL_PASSWORD`        | Secret | `your-app-password`                       | Use App Password for Gmail |
| `CLOUDINARY_CLOUD_NAME` | Plain  | `your-cloud-name`                         | From Cloudinary dashboard  |
| `CLOUDINARY_API_KEY`    | Secret | `123456789012345`                         | From Cloudinary dashboard  |
| `CLOUDINARY_API_SECRET` | Secret | `aBcDeFgHiJkLmNoPqRsTuVwXyZ`              | From Cloudinary dashboard  |

#### 💳 PAYMENTS (Required for premium features)

| Key                      | Type   | Example Value | Notes                             |
| ------------------------ | ------ | ------------- | --------------------------------- |
| `STRIPE_SECRET_KEY`      | Secret | `sk_live_...` | From Stripe Dashboard (Live mode) |
| `STRIPE_PUBLISHABLE_KEY` | Plain  | `pk_live_...` | From Stripe Dashboard             |
| `STRIPE_WEBHOOK_SECRET`  | Secret | `whsec_...`   | Create webhook in Stripe          |
| `STRIPE_PRICE_MONTHLY`   | Plain  | `price_...`   | Create in Stripe Products         |
| `STRIPE_PRICE_YEARLY`    | Plain  | `price_...`   | Create in Stripe Products         |

#### 📊 MONITORING (Highly recommended)

| Key               | Type  | Example Value                          | Notes               |
| ----------------- | ----- | -------------------------------------- | ------------------- |
| `SENTRY_DSN`      | Plain | `https://xxx@xxx.ingest.sentry.io/xxx` | From Sentry project |
| `RELEASE_VERSION` | Plain | `1.0.0`                                | Your app version    |

#### 📱 APP STORES (Required for mobile app payments)

| Key                   | Type   | Example Value               | Notes                      |
| --------------------- | ------ | --------------------------- | -------------------------- |
| `APPLE_BUNDLE_ID`     | Plain  | `com.yourcompany.datingapp` | Your iOS bundle ID         |
| `APPLE_SHARED_SECRET` | Secret | `(from App Store Connect)`  | App-Specific Shared Secret |
| `APPLE_ENVIRONMENT`   | Plain  | `production`                | Use `sandbox` for testing  |
| `GOOGLE_PACKAGE_NAME` | Plain  | `com.yourcompany.datingapp` | Your Android package       |

#### 📄 LEGAL (Required for App Store submission)

| Key                    | Type  | Example Value                  | Notes                       |
| ---------------------- | ----- | ------------------------------ | --------------------------- |
| `PRIVACY_POLICY_URL`   | Plain | `https://yoursite.com/privacy` | Must be publicly accessible |
| `TERMS_OF_SERVICE_URL` | Plain | `https://yoursite.com/terms`   | Must be publicly accessible |

---

## 🌐 Vercel (Frontend) Environment Variables

### Step 1: Navigate to Environment

1. Go to Vercel Dashboard → Your Project
2. Click "Settings" → "Environment Variables"
3. Add each variable below

### Step 2: Add Variables

#### 🔴 CRITICAL (App won't connect to backend without this)

| Key                   | Environment | Value                                   | Notes                            |
| --------------------- | ----------- | --------------------------------------- | -------------------------------- |
| `EXPO_PUBLIC_API_URL` | Production  | `https://your-backend.onrender.com/api` | Your Render backend URL + `/api` |
| `EXPO_PUBLIC_API_URL` | Preview     | `https://your-backend.onrender.com/api` | Same as production               |
| `EXPO_PUBLIC_API_URL` | Development | `http://localhost:3001/api`             | Local backend                    |

#### 🔥 FIREBASE (Required for authentication)

| Key                                        | Environment | Value                          | Notes                                    |
| ------------------------------------------ | ----------- | ------------------------------ | ---------------------------------------- |
| `EXPO_PUBLIC_FIREBASE_API_KEY`             | All         | `AIzaSy...`                    | From Firebase Console → Project Settings |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`         | All         | `your-project.firebaseapp.com` | From Firebase Console                    |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID`          | All         | `your-project-id`              | From Firebase Console                    |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`      | All         | `your-project-id.appspot.com`  | From Firebase Console                    |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | All         | `123456789012`                 | From Firebase Console                    |
| `EXPO_PUBLIC_FIREBASE_APP_ID`              | All         | `1:123456789012:web:abc123`    | From Firebase Console                    |

#### 🔑 GOOGLE OAUTH (If using Google Sign-In)

| Key                                | Environment | Value                            | Notes                     |
| ---------------------------------- | ----------- | -------------------------------- | ------------------------- |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | All         | `xxx.apps.googleusercontent.com` | From Google Cloud Console |

#### 📊 MONITORING

| Key                      | Environment | Value                                  | Notes               |
| ------------------------ | ----------- | -------------------------------------- | ------------------- |
| `EXPO_PUBLIC_SENTRY_DSN` | Production  | `https://xxx@xxx.ingest.sentry.io/xxx` | From Sentry project |

#### 📄 LEGAL

| Key                                | Environment | Value                          | Notes              |
| ---------------------------------- | ----------- | ------------------------------ | ------------------ |
| `EXPO_PUBLIC_PRIVACY_POLICY_URL`   | All         | `https://yoursite.com/privacy` | Same as backend    |
| `EXPO_PUBLIC_TERMS_OF_SERVICE_URL` | All         | `https://yoursite.com/terms`   | Same as backend    |
| `EXPO_PUBLIC_SUPPORT_EMAIL`        | All         | `support@yourapp.com`          | Your support email |

#### 💳 PAYMENTS

| Key                                  | Environment | Value         | Notes                       |
| ------------------------------------ | ----------- | ------------- | --------------------------- |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Production  | `pk_live_...` | Publishable key only (safe) |

---

## 🔐 Secret Generation Commands

Run these in your terminal to generate secure secrets:

```bash
# JWT Secret (64 characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# JWT Refresh Secret (64 characters - run separately!)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Hash Salt (32 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# API Key (optional, 32 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## ✅ Pre-Deployment Checklist

### Before deploying to Render:

- [ ] Generated unique JWT_SECRET (64+ chars)
- [ ] Generated unique JWT_REFRESH_SECRET (64+ chars, different from JWT_SECRET)
- [ ] Generated HASH_SALT (32+ chars)
- [ ] Created MongoDB Atlas cluster and got connection string
- [ ] Set up Upstash Redis and got URL
- [ ] Created Cloudinary account and got credentials
- [ ] Set up email service (Gmail App Password or SendGrid)
- [ ] Created Stripe account and got live keys (if using payments)
- [ ] Created Sentry project and got DSN

### Before deploying to Vercel:

- [ ] Backend is deployed and URL is known
- [ ] Firebase project created and configured
- [ ] All EXPO*PUBLIC*\* variables added
- [ ] Privacy Policy and Terms of Service URLs are live

---

## 🚨 Common Mistakes to Avoid

1. **Using the same JWT_SECRET and JWT_REFRESH_SECRET** - They MUST be different
2. **Using short secrets** - JWT secrets must be 64+ characters
3. **Using HTTP instead of HTTPS** - All production URLs must be HTTPS
4. **Forgetting /api suffix** - EXPO_PUBLIC_API_URL should end with `/api`
5. **Using localhost in production** - Never use localhost URLs in production vars
6. **Exposing secrets to frontend** - Only EXPO*PUBLIC*\* vars are visible to client
7. **Using test Stripe keys in production** - Use `sk_live_` not `sk_test_`

---

## 📞 Where to Get Each Value

| Service       | URL                                 | What to Get                                 |
| ------------- | ----------------------------------- | ------------------------------------------- |
| MongoDB Atlas | https://cloud.mongodb.com           | Connection string (Database → Connect)      |
| Upstash       | https://upstash.com                 | Redis URL (Create Database → REST API)      |
| Cloudinary    | https://cloudinary.com              | Cloud name, API key, API secret (Dashboard) |
| Stripe        | https://dashboard.stripe.com        | Secret key, Publishable key, Webhook secret |
| Firebase      | https://console.firebase.google.com | Project settings → Your apps                |
| Sentry        | https://sentry.io                   | Project → Settings → Client Keys (DSN)      |
| Google Cloud  | https://console.cloud.google.com    | APIs & Services → Credentials               |

---

_Last Updated: January 2026_
