# Environment Variables Reference

## Complete Production Environment Setup for Render (Backend) & Vercel (Frontend)

---

## Table of Contents

1. [Backend Variables (Render)](#backend-variables-render)
2. [Frontend Variables (Vercel)](#frontend-variables-vercel)
3. [Variable Validation](#variable-validation)
4. [Production Blockers](#production-blockers)
5. [Security Warnings](#security-warnings)
6. [Quick Setup Tables](#quick-setup-tables)

---

## Backend Variables (Render)

### 🔴 CRITICAL - Authentication & Security

| Variable | Required | Description | Safe to Expose | Example |
|----------|----------|-------------|----------------|---------|
| `JWT_SECRET` | **YES** | JWT signing key (64+ chars) | ❌ NO | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | **YES** | Refresh token key (64+ chars, different from JWT_SECRET) | ❌ NO | Generate separately |
| `HASH_SALT` | **YES** | Hash salt for sensitive data (32+ chars) | ❌ NO | Random string |
| `API_KEY` | Optional | Server-to-server API key | ❌ NO | Random string |

### 🔴 CRITICAL - Database

| Variable | Required | Description | Safe to Expose | Example |
|----------|----------|-------------|----------------|---------|
| `MONGODB_URI` | **YES** | MongoDB Atlas connection string | ❌ NO | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `MONGODB_URL` | Alt | Alternative name for MONGODB_URI | ❌ NO | Same as above |

### 🔴 CRITICAL - Application

| Variable | Required | Description | Safe to Expose | Example |
|----------|----------|-------------|----------------|---------|
| `NODE_ENV` | **YES** | Environment mode | ✅ YES | `production` |
| `PORT` | Auto | Server port (Render sets automatically) | ✅ YES | `3001` |
| `FRONTEND_URL` | **YES** | Frontend URL for CORS & emails | ✅ YES | `https://app.vercel.app` |
| `CORS_ORIGIN` | Optional | Additional CORS origins (comma-sep) | ✅ YES | `https://app1.com,https://app2.com` |

### 🟡 IMPORTANT - Redis Cache

| Variable | Required | Description | Safe to Expose | Example |
|----------|----------|-------------|----------------|---------|
| `REDIS_URL` | Recommended | Full Redis connection URL | ❌ NO | `redis://default:xxx@host:6379` |
| `REDIS_HOST` | Alt | Redis host (if not using URL) | ✅ YES | `localhost` |
| `REDIS_PORT` | Alt | Redis port | ✅ YES | `6379` |
| `REDIS_PASSWORD` | Alt | Redis password | ❌ NO | - |
| `REDIS_DB` | Optional | Redis database number | ✅ YES | `0` |
| `REDIS_QUEUE_DB` | Optional | Redis DB for job queues | ✅ YES | `1` |

### 🟡 IMPORTANT - Email Service

| Variable | Required | Description | Safe to Expose | Example |
|----------|----------|-------------|----------------|---------|
| `EMAIL_SERVICE` | For auth | Email provider | ✅ YES | `gmail` |
| `EMAIL_USER` | For auth | Email username/address | ❌ NO | `noreply@app.com` |
| `EMAIL_PASSWORD` | For auth | Email password/app password | ❌ NO | - |
| `EMAIL_FROM` | Optional | From address | ✅ YES | `noreply@app.com` |
| `SMTP_HOST` | Alt | SMTP server host | ✅ YES | `smtp.sendgrid.net` |
| `SMTP_PORT` | Alt | SMTP port | ✅ YES | `587` |
| `SMTP_SECURE` | Alt | Use TLS | ✅ YES | `false` |
| `SMTP_USER` | Alt | SMTP username | ❌ NO | - |
| `SMTP_PASS` | Alt | SMTP password | ❌ NO | - |

### 🟡 IMPORTANT - File Storage (Cloudinary)

| Variable | Required | Description | Safe to Expose | Example |
|----------|----------|-------------|----------------|---------|
| `STORAGE_PROVIDER` | Optional | Storage provider selection | ✅ YES | `cloudinary` |
| `CLOUDINARY_CLOUD_NAME` | For photos | Cloudinary cloud name | ✅ YES | `my-cloud` |
| `CLOUDINARY_API_KEY` | For photos | Cloudinary API key | ❌ NO | - |
| `CLOUDINARY_API_SECRET` | For photos | Cloudinary API secret | ❌ NO | - |
| `CLOUDINARY_UPLOAD_PRESET` | Optional | Upload preset name | ✅ YES | `dating_app` |

### 🟡 IMPORTANT - File Storage (AWS S3 - Alternative)

| Variable | Required | Description | Safe to Expose | Example |
|----------|----------|-------------|----------------|---------|
| `AWS_REGION` | For S3 | AWS region | ✅ YES | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | For S3 | AWS access key | ❌ NO | - |
| `AWS_SECRET_ACCESS_KEY` | For S3 | AWS secret key | ❌ NO | - |
| `AWS_S3_BUCKET` | For S3 | S3 bucket name | ✅ YES | `dating-app-uploads` |
| `S3_BUCKET_NAME` | Alt | Alternative bucket name var | ✅ YES | Same as above |
| `S3_BUCKET_URL` | Optional | S3 bucket URL | ✅ YES | - |

### 🟡 IMPORTANT - CDN

| Variable | Required | Description | Safe to Expose | Example |
|----------|----------|-------------|----------------|---------|
| `CDN_URL` | Optional | CDN base URL | ✅ YES | `https://cdn.app.com` |
| `CLOUDFRONT_URL` | Optional | CloudFront URL | ✅ YES | `https://xxx.cloudfront.net` |
| `CLOUDFRONT_DOMAIN` | Optional | CloudFront domain | ✅ YES | `xxx.cloudfront.net` |
| `CLOUDFRONT_DISTRIBUTION_ID` | Optional | Distribution ID | ✅ YES | `E1234567890` |
| `CLOUDFRONT_KEY_PAIR_ID` | Optional | Signed URL key pair | ❌ NO | - |
| `CLOUDFRONT_PRIVATE_KEY` | Optional | Signed URL private key | ❌ NO | - |
| `CLOUDFLARE_ZONE_ID` | Optional | Cloudflare zone | ❌ NO | - |
| `CLOUDFLARE_CDN_DOMAIN` | Optional | Cloudflare CDN domain | ✅ YES | - |

### 💳 Payment Processing

| Variable | Required | Description | Safe to Expose | Example |
|----------|----------|-------------|----------------|---------|
| `STRIPE_SECRET_KEY` | For payments | Stripe secret key | ❌ NO | `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | For payments | Stripe public key | ✅ YES | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | For payments | Webhook signing secret | ❌ NO | `whsec_...` |
| `STRIPE_PRICE_MONTHLY` | For subs | Monthly price ID | ✅ YES | `price_...` |
| `STRIPE_PRICE_YEARLY` | For subs | Yearly price ID | ✅ YES | `price_...` |
| `STRIPE_PRODUCT_SUPER_LIKES_5` | Optional | Product ID | ✅ YES | `prod_...` |
| `STRIPE_PRODUCT_SUPER_LIKES_15` | Optional | Product ID | ✅ YES | `prod_...` |
| `STRIPE_PRODUCT_BOOST_1` | Optional | Product ID | ✅ YES | `prod_...` |
| `STRIPE_PRODUCT_BOOST_5` | Optional | Product ID | ✅ YES | `prod_...` |
| `PAYPAL_CLIENT_ID` | Optional | PayPal client ID | ❌ NO | - |
| `PAYPAL_CLIENT_SECRET` | Optional | PayPal secret | ❌ NO | - |
| `PAYPAL_MODE` | Optional | sandbox or live | ✅ YES | `live` |
| `PAYPAL_WEBHOOK_ID` | Optional | PayPal webhook ID | ❌ NO | - |

### 📱 App Store In-App Purchases

| Variable | Required | Description | Safe to Expose | Example |
|----------|----------|-------------|----------------|---------|
| `APPLE_BUNDLE_ID` | For iOS | iOS bundle ID | ✅ YES | `com.app.dating` |
| `APPLE_SHARED_SECRET` | For iOS | App Store shared secret | ❌ NO | - |
| `APPLE_ENVIRONMENT` | For iOS | sandbox or production | ✅ YES | `production` |
| `APPLE_KEY_ID` | For iOS | App Store Connect key | ❌ NO | - |
| `APPLE_ISSUER_ID` | For iOS | App Store issuer | ❌ NO | - |
| `APPLE_PRIVATE_KEY` | For iOS | Private key | ❌ NO | - |
| `GOOGLE_PACKAGE_NAME` | For Android | Android package name | ✅ YES | `com.app.dating` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | For Android | Service account | ❌ NO | - |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | For Android | Private key | ❌ NO | - |

### 🔑 OAuth

| Variable | Required | Description | Safe to Expose | Example |
|----------|----------|-------------|----------------|---------|
| `GOOGLE_CLIENT_ID` | For OAuth | Google OAuth client ID | ✅ YES | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | For OAuth | Google OAuth secret | ❌ NO | - |

### 🤖 AI Features

| Variable | Required | Description | Safe to Expose | Example |
|----------|----------|-------------|----------------|---------|
| `OPENAI_API_KEY` | For AI | OpenAI API key | ❌ NO | `sk-...` |
| `OPENAI_MODEL` | Optional | Model to use | ✅ YES | `gpt-3.5-turbo` |
| `USE_OPENAI` | Optional | Enable OpenAI | ✅ YES | `true` |

### 📊 Monitoring & Logging

| Variable | Required | Description | Safe to Expose | Example |
|----------|----------|-------------|----------------|---------|
| `SENTRY_DSN` | Recommended | Sentry error tracking | ✅ YES | `https://xxx@sentry.io/xxx` |
| `RELEASE_VERSION` | Optional | App version for Sentry | ✅ YES | `1.0.0` |
| `DATADOG_API_KEY` | Optional | Datadog API key | ❌ NO | - |
| `DD_API_KEY` | Alt | Datadog API key | ❌ NO | - |
| `DD_APP_KEY` | Optional | Datadog app key | ❌ NO | - |
| `DD_SITE` | Optional | Datadog site | ✅ YES | `datadoghq.com` |
| `DD_ENV` | Optional | Datadog environment | ✅ YES | `production` |
| `DD_AGENT_HOST` | Optional | Datadog agent host | ✅ YES | `localhost` |
| `LOG_LEVEL` | Optional | Log level | ✅ YES | `info` |
| `LOG_DIR` | Optional | Log directory | ✅ YES | `logs` |
| `ENABLE_FILE_LOGGING` | Optional | Enable file logs | ✅ YES | `false` |

### ⚙️ Rate Limiting & Performance

| Variable | Required | Description | Safe to Expose | Example |
|----------|----------|-------------|----------------|---------|
| `FREE_DAILY_SWIPE_LIMIT` | Optional | Free tier swipe limit | ✅ YES | `100` |
| `PREMIUM_DAILY_SWIPE_LIMIT` | Optional | Premium swipe limit | ✅ YES | `500` |
| `SLOW_REQUEST_THRESHOLD` | Optional | Slow request ms | ✅ YES | `1000` |
| `VERY_SLOW_REQUEST_THRESHOLD` | Optional | Very slow request ms | ✅ YES | `3000` |
| `SLOW_QUERY_THRESHOLD` | Optional | Slow query ms | ✅ YES | `500` |
| `VERY_SLOW_QUERY_THRESHOLD` | Optional | Very slow query ms | ✅ YES | `2000` |

### 🏷️ Legal URLs

| Variable | Required | Description | Safe to Expose | Example |
|----------|----------|-------------|----------------|---------|
| `PRIVACY_POLICY_URL` | For stores | Privacy policy URL | ✅ YES | `https://app.com/privacy` |
| `TERMS_OF_SERVICE_URL` | For stores | Terms of service URL | ✅ YES | `https://app.com/terms` |
| `SUPPORT_URL` | Optional | Support URL | ✅ YES | `https://app.com/support` |

---

## Frontend Variables (Vercel)

### 🌐 API Connection

| Variable | Required | Description | Safe to Expose | Example |
|----------|----------|-------------|----------------|---------|
| `EXPO_PUBLIC_API_URL` | **YES** | Backend API URL | ✅ YES | `https://api.render.com/api` |
| `EXPO_PUBLIC_BACKEND_URL` | Alt | Alternative API URL var | ✅ YES | Same as above |
| `EXPO_PUBLIC_API_URL_PRODUCTION` | Alt | Production API URL | ✅ YES | Same as above |
| `EXPO_PUBLIC_API_URL_DEVELOPMENT` | Dev | Dev API URL | ✅ YES | `http://localhost:3001/api` |
| `EXPO_PUBLIC_API_URL_DEV` | Dev | Dev API URL alt | ✅ YES | Same as above |
| `EXPO_PUBLIC_ENV` | Optional | Environment name | ✅ YES | `production` |

### 🔥 Firebase (Public Configuration)

| Variable | Required | Description | Safe to Expose | Example |
|----------|----------|-------------|----------------|---------|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | For Firebase | Firebase API key | ✅ YES | `AIzaSy...` |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | For Firebase | Auth domain | ✅ YES | `project.firebaseapp.com` |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | For Firebase | Project ID | ✅ YES | `my-project` |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | For Firebase | Storage bucket | ✅ YES | `project.appspot.com` |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | For Firebase | FCM sender ID | ✅ YES | `123456789` |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | For Firebase | App ID | ✅ YES | `1:xxx:web:xxx` |
| `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` | Optional | Analytics ID | ✅ YES | `G-XXXXXXXXXX` |

### 🔑 Google OAuth (Public Client IDs)

| Variable | Required | Description | Safe to Expose | Example |
|----------|----------|-------------|----------------|---------|
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | For OAuth | Web client ID | ✅ YES | `xxx.apps.googleusercontent.com` |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | For OAuth | iOS client ID | ✅ YES | `xxx.apps.googleusercontent.com` |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | For OAuth | Android client ID | ✅ YES | `xxx.apps.googleusercontent.com` |

### 📊 Error Tracking

| Variable | Required | Description | Safe to Expose | Example |
|----------|----------|-------------|----------------|---------|
| `EXPO_PUBLIC_SENTRY_DSN` | Recommended | Sentry DSN | ✅ YES | `https://xxx@sentry.io/xxx` |

### 🏷️ Legal & Support

| Variable | Required | Description | Safe to Expose | Example |
|----------|----------|-------------|----------------|---------|
| `EXPO_PUBLIC_PRIVACY_POLICY_URL` | For stores | Privacy policy | ✅ YES | `https://app.com/privacy` |
| `EXPO_PUBLIC_TERMS_OF_SERVICE_URL` | For stores | Terms URL | ✅ YES | `https://app.com/terms` |
| `EXPO_PUBLIC_SUPPORT_EMAIL` | Optional | Support email | ✅ YES | `support@app.com` |
| `EXPO_PUBLIC_COMPANY_ADDRESS` | Optional | Company address | ✅ YES | - |
| `EXPO_PUBLIC_GOVERNING_JURISDICTION` | Optional | Legal jurisdiction | ✅ YES | `the United States` |

### 🖼️ Assets

| Variable | Required | Description | Safe to Expose | Example |
|----------|----------|-------------|----------------|---------|
| `EXPO_PUBLIC_PLACEHOLDER_IMAGE_URL` | Optional | Default image | ✅ YES | `https://via.placeholder.com/200` |
| `EXPO_PUBLIC_CDN_URL` | Optional | CDN for images | ✅ YES | `https://cdn.app.com` |

### 💳 Stripe (Public Key Only)

| Variable | Required | Description | Safe to Expose | Example |
|----------|----------|-------------|----------------|---------|
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | For payments | Stripe public key | ✅ YES | `pk_live_...` |

---

## Variable Validation

### Backend Validation (runs on startup)

The backend validates critical variables on startup via `backend/utils/validateEnv.js`:

```javascript
// CRITICAL - Server will not start without these:
JWT_SECRET (min 32 chars, no default values)
JWT_REFRESH_SECRET (min 32 chars, no default values)
HASH_SALT (min 16 chars)

// IMPORTANT - Warnings if missing:
MONGODB_URI or MONGODB_URL
FRONTEND_URL (required in production)
```

### Frontend Validation

The frontend validates Firebase configuration via `src/config/environments.js`.

---

## Production Blockers

### 🚫 App Will NOT Work Without:

1. **Authentication Broken**
   - Missing: `JWT_SECRET`, `JWT_REFRESH_SECRET`
   - Impact: Login/register fails, all API calls fail

2. **Database Broken**
   - Missing: `MONGODB_URI`
   - Impact: No data persistence, all features fail

3. **CORS Blocked**
   - Missing/Wrong: `FRONTEND_URL`
   - Impact: Frontend cannot call backend API

4. **Email Features Broken**
   - Missing: `EMAIL_USER`, `EMAIL_PASSWORD`
   - Impact: Password reset, email verification fail

5. **Photo Upload Broken**
   - Missing: `CLOUDINARY_*` or `AWS_*` credentials
   - Impact: Users cannot upload profile photos

6. **Payments Broken**
   - Missing: `STRIPE_SECRET_KEY`
   - Impact: Premium subscriptions fail

---

## Security Warnings

### ⚠️ CRITICAL Security Checks

1. **JWT Secrets**
   - Must be 64+ characters
   - Must be cryptographically random
   - JWT_SECRET ≠ JWT_REFRESH_SECRET
   - Never use default/example values

2. **Database Credentials**
   - Never commit to Git
   - Use MongoDB Atlas with IP whitelist
   - Enable authentication

3. **Frontend Exposure**
   - ONLY `EXPO_PUBLIC_*` variables are exposed
   - Firebase keys are safe (use security rules)
   - Stripe publishable key is safe
   - NEVER expose `*_SECRET` variables

4. **Production Checklist**
   - [ ] All secrets rotated from development
   - [ ] No localhost URLs in production
   - [ ] HTTPS enforced everywhere
   - [ ] .env files in .gitignore

---

## Quick Setup Tables

### Render (Backend) - Minimum Required

| Variable | Value to Set |
|----------|-------------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Generate 64-char random |
| `JWT_REFRESH_SECRET` | Generate 64-char random (different) |
| `HASH_SALT` | Generate 32-char random |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `FRONTEND_URL` | Your Vercel URL |
| `REDIS_URL` | Upstash Redis URL |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |
| `SENTRY_DSN` | From Sentry project |

### Vercel (Frontend) - Minimum Required

| Variable | Value to Set |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Your Render backend URL + `/api` |
| `EXPO_PUBLIC_ENV` | `production` |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | From Firebase console |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | From Firebase console |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | From Firebase console |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | From Firebase console |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | From Firebase console |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | From Firebase console |
| `EXPO_PUBLIC_SENTRY_DSN` | From Sentry project |
| `EXPO_PUBLIC_PRIVACY_POLICY_URL` | Your privacy policy URL |
| `EXPO_PUBLIC_TERMS_OF_SERVICE_URL` | Your terms URL |

---

## Generate Secure Secrets

```bash
# Generate JWT_SECRET
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT_REFRESH_SECRET (run separately!)
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Generate HASH_SALT
node -e "console.log('HASH_SALT=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate API_KEY
node -e "console.log('API_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

---

*Last Updated: January 2026*
