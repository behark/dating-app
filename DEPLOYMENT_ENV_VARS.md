# Environment Variables for Deployment

This document lists the **EXACT** environment variable names used in this codebase.  
All variable names are extracted directly from the source code.

---

## Backend (Render) Environment Variables

### 🔴 CRITICAL - Required for App to Function

| Variable Name        | Description                                         | Required |
| -------------------- | --------------------------------------------------- | -------- |
| `NODE_ENV`           | Environment: `development`, `staging`, `production` | ✅ Yes   |
| `PORT`               | Server port (Render sets automatically)             | ✅ Yes   |
| `MONGODB_URI`        | MongoDB Atlas connection string                     | ✅ Yes   |
| `JWT_SECRET`         | JWT signing key (min 64 chars)                      | ✅ Yes   |
| `JWT_REFRESH_SECRET` | Refresh token secret (min 64 chars)                 | ✅ Yes   |
| `HASH_SALT`          | Password hashing salt (min 32 chars)                | ✅ Yes   |
| `FRONTEND_URL`       | Frontend app URL for CORS                           | ✅ Yes   |

### 🟡 Authentication & OAuth

| Variable Name            | Description                        | Required           |
| ------------------------ | ---------------------------------- | ------------------ |
| `JWT_EXPIRES_IN`         | Access token expiry (e.g., `7d`)   | ✅ Yes             |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry (e.g., `30d`) | ✅ Yes             |
| `GOOGLE_CLIENT_ID`       | Google OAuth client ID             | For Google login   |
| `GOOGLE_CLIENT_SECRET`   | Google OAuth client secret         | For Google login   |
| `FACEBOOK_APP_ID`        | Facebook OAuth app ID              | For Facebook login |
| `FACEBOOK_APP_SECRET`    | Facebook OAuth app secret          | For Facebook login |
| `APPLE_KEY_ID`           | Apple Sign In key ID               | For Apple login    |
| `APPLE_ISSUER_ID`        | Apple Sign In issuer ID            | For Apple login    |
| `APPLE_PRIVATE_KEY`      | Apple Sign In private key          | For Apple login    |
| `APPLE_BUNDLE_ID`        | iOS app bundle ID                  | For Apple login    |

### 🟡 Redis Cache & Queues

| Variable Name    | Description                          | Required            |
| ---------------- | ------------------------------------ | ------------------- |
| `REDIS_URL`      | Full Redis URL (Upstash/Redis Cloud) | ✅ Yes (production) |
| `REDIS_HOST`     | Redis hostname                       | Alternative to URL  |
| `REDIS_PORT`     | Redis port                           | Alternative to URL  |
| `REDIS_PASSWORD` | Redis password                       | Alternative to URL  |
| `REDIS_DB`       | Redis database number                | Optional            |
| `REDIS_QUEUE_DB` | Redis DB for Bull queues             | Optional            |

### 🟡 File Storage

| Variable Name                | Description                | Required        |
| ---------------------------- | -------------------------- | --------------- |
| `STORAGE_PROVIDER`           | `cloudinary` or `s3`       | ✅ Yes          |
| `CLOUDINARY_CLOUD_NAME`      | Cloudinary cloud name      | For Cloudinary  |
| `CLOUDINARY_API_KEY`         | Cloudinary API key         | For Cloudinary  |
| `CLOUDINARY_API_SECRET`      | Cloudinary API secret      | For Cloudinary  |
| `CLOUDINARY_UPLOAD_PRESET`   | Upload preset name         | For Cloudinary  |
| `AWS_ACCESS_KEY_ID`          | AWS access key             | For S3          |
| `AWS_SECRET_ACCESS_KEY`      | AWS secret key             | For S3          |
| `AWS_REGION`                 | AWS region                 | For S3          |
| `AWS_S3_BUCKET`              | S3 bucket name             | For S3          |
| `S3_BUCKET_NAME`             | Alternative S3 bucket name | For S3          |
| `S3_BUCKET_URL`              | S3 bucket URL              | For S3          |
| `CDN_URL`                    | CDN URL for assets         | Optional        |
| `CLOUDFRONT_DOMAIN`          | CloudFront domain          | For CloudFront  |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution    | For CloudFront  |
| `CLOUDFRONT_KEY_PAIR_ID`     | CloudFront key pair ID     | For signed URLs |
| `CLOUDFRONT_PRIVATE_KEY`     | CloudFront private key     | For signed URLs |
| `CLOUDFRONT_URL`             | CloudFront full URL        | For CloudFront  |
| `CLOUDFLARE_CDN_DOMAIN`      | Cloudflare CDN domain      | For Cloudflare  |

### 🟡 Email Service

| Variable Name    | Description                        | Required  |
| ---------------- | ---------------------------------- | --------- |
| `EMAIL_SERVICE`  | Email service name (e.g., `gmail`) | For email |
| `EMAIL_USER`     | Email username/address             | For email |
| `EMAIL_PASSWORD` | Email password/app password        | For email |
| `EMAIL_FROM`     | From address for emails            | For email |
| `SMTP_HOST`      | SMTP server hostname               | For SMTP  |
| `SMTP_PORT`      | SMTP server port                   | For SMTP  |
| `SMTP_USER`      | SMTP username                      | For SMTP  |
| `SMTP_PASS`      | SMTP password                      | For SMTP  |
| `SMTP_SECURE`    | Use TLS (`true`/`false`)           | For SMTP  |

### 🟡 Push Notifications

| Variable Name           | Description                    | Required |
| ----------------------- | ------------------------------ | -------- |
| `EXPO_ACCESS_TOKEN`     | Expo push notification token   | For push |
| `FIREBASE_PROJECT_ID`   | Firebase project ID            | For FCM  |
| `FIREBASE_PRIVATE_KEY`  | Firebase service account key   | For FCM  |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email | For FCM  |

### 🟡 Payment Processing

#### Stripe

| Variable Name                   | Description                    | Required   |
| ------------------------------- | ------------------------------ | ---------- |
| `STRIPE_SECRET_KEY`             | Stripe secret key              | For Stripe |
| `STRIPE_PUBLISHABLE_KEY`        | Stripe publishable key         | For Stripe |
| `STRIPE_WEBHOOK_SECRET`         | Stripe webhook secret          | For Stripe |
| `STRIPE_PRICE_MONTHLY`          | Monthly subscription price ID  | For Stripe |
| `STRIPE_PRICE_YEARLY`           | Yearly subscription price ID   | For Stripe |
| `STRIPE_PRODUCT_SUPER_LIKES_5`  | Super likes 5-pack product ID  | For Stripe |
| `STRIPE_PRODUCT_SUPER_LIKES_15` | Super likes 15-pack product ID | For Stripe |
| `STRIPE_PRODUCT_BOOST_1`        | Boost 1-pack product ID        | For Stripe |
| `STRIPE_PRODUCT_BOOST_5`        | Boost 5-pack product ID        | For Stripe |

#### PayPal

| Variable Name          | Description            | Required   |
| ---------------------- | ---------------------- | ---------- |
| `PAYPAL_CLIENT_ID`     | PayPal client ID       | For PayPal |
| `PAYPAL_CLIENT_SECRET` | PayPal client secret   | For PayPal |
| `PAYPAL_MODE`          | `sandbox` or `live`    | For PayPal |
| `PAYPAL_WEBHOOK_ID`    | PayPal webhook ID      | For PayPal |
| `PAYPAL_PLAN_MONTHLY`  | PayPal monthly plan ID | For PayPal |
| `PAYPAL_PLAN_YEARLY`   | PayPal yearly plan ID  | For PayPal |

#### Apple App Store

| Variable Name         | Description               | Required      |
| --------------------- | ------------------------- | ------------- |
| `APPLE_BUNDLE_ID`     | iOS bundle identifier     | For Apple IAP |
| `APPLE_SHARED_SECRET` | App Store shared secret   | For Apple IAP |
| `APPLE_ENVIRONMENT`   | `sandbox` or `production` | For Apple IAP |
| `APPLE_KEY_ID`        | App Store API key ID      | For Apple IAP |
| `APPLE_ISSUER_ID`     | App Store issuer ID       | For Apple IAP |
| `APPLE_PRIVATE_KEY`   | App Store private key     | For Apple IAP |

#### Google Play

| Variable Name                        | Description                  | Required       |
| ------------------------------------ | ---------------------------- | -------------- |
| `GOOGLE_PACKAGE_NAME`                | Android package name         | For Google IAP |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL`       | Service account email        | For Google IAP |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Service account key          | For Google IAP |
| `GOOGLE_RTDN_TOPIC`                  | Real-time notification topic | For Google IAP |

### 🟡 AI Services

| Variable Name    | Description                    | Required        |
| ---------------- | ------------------------------ | --------------- |
| `OPENAI_API_KEY` | OpenAI API key                 | For AI features |
| `OPENAI_MODEL`   | OpenAI model name              | For AI features |
| `USE_OPENAI`     | Enable OpenAI (`true`/`false`) | For AI features |

### 🟡 Monitoring & Analytics

| Variable Name     | Description                          | Required    |
| ----------------- | ------------------------------------ | ----------- |
| `SENTRY_DSN`      | Sentry error tracking DSN            | Recommended |
| `DD_API_KEY`      | Datadog API key                      | For Datadog |
| `DATADOG_API_KEY` | Alternative Datadog API key          | For Datadog |
| `DD_SITE`         | Datadog site (`datadoghq.eu`/`.com`) | For Datadog |
| `DD_ENV`          | Datadog environment tag              | For Datadog |
| `DD_AGENT_HOST`   | Datadog agent host                   | For Datadog |
| `DD_APP_KEY`      | Datadog app key                      | For Datadog |

### 🟡 Rate Limiting & Limits

| Variable Name               | Description             | Required |
| --------------------------- | ----------------------- | -------- |
| `RATE_LIMIT_ENABLED`        | Enable rate limiting    | Optional |
| `RATE_LIMIT_WINDOW_MS`      | Rate limit window in ms | Optional |
| `RATE_LIMIT_MAX`            | Max requests per window | Optional |
| `FREE_DAILY_SWIPE_LIMIT`    | Free tier daily swipes  | Optional |
| `PREMIUM_DAILY_SWIPE_LIMIT` | Premium daily swipes    | Optional |

### 🟡 Feature Flags

| Variable Name         | Description             | Required |
| --------------------- | ----------------------- | -------- |
| `FEATURE_PREMIUM`     | Enable premium features | Optional |
| `FEATURE_AI_MATCHING` | Enable AI matching      | Optional |
| `FEATURE_CHAT`        | Enable chat feature     | Optional |
| `FEATURE_VIDEO_CALLS` | Enable video calls      | Optional |
| `MAINTENANCE_MODE`    | Enable maintenance mode | Optional |

### 🟡 Logging & Debug

| Variable Name                 | Description                                  | Required |
| ----------------------------- | -------------------------------------------- | -------- |
| `LOG_LEVEL`                   | Log level (`debug`, `info`, `warn`, `error`) | Optional |
| `LOG_FORMAT`                  | Log format type                              | Optional |
| `LOG_DIR`                     | Directory for log files                      | Optional |
| `ENABLE_FILE_LOGGING`         | Write logs to files                          | Optional |
| `SLOW_QUERY_THRESHOLD`        | Slow query warning threshold (ms)            | Optional |
| `VERY_SLOW_QUERY_THRESHOLD`   | Very slow query threshold (ms)               | Optional |
| `SLOW_REQUEST_THRESHOLD`      | Slow request threshold (ms)                  | Optional |
| `VERY_SLOW_REQUEST_THRESHOLD` | Very slow request threshold (ms)             | Optional |

### 🟡 Security

| Variable Name    | Description                    | Required |
| ---------------- | ------------------------------ | -------- |
| `CORS_ORIGIN`    | Allowed CORS origins           | ✅ Yes   |
| `CORS_ORIGINS`   | Alternative CORS origins       | Optional |
| `ENCRYPTION_KEY` | Data encryption key (32 bytes) | Optional |
| `API_KEY`        | Internal API key               | Optional |
| `MAX_FILE_SIZE`  | Max upload file size           | Optional |

### 🟡 Database Options

| Variable Name       | Description             | Required    |
| ------------------- | ----------------------- | ----------- |
| `MONGODB_URL`       | Alternative MongoDB URL | Alternative |
| `MONGO_URI`         | Alternative MongoDB URI | Alternative |
| `MONGODB_POOL_SIZE` | Connection pool size    | Optional    |

### 🟡 Misc

| Variable Name     | Description              | Required    |
| ----------------- | ------------------------ | ----------- |
| `HOST`            | Server host binding      | Optional    |
| `RELEASE_VERSION` | App version for tracking | Optional    |
| `VERCEL_ENV`      | Vercel environment       | Vercel only |

---

## Frontend (Vercel) Environment Variables

All frontend variables use the `EXPO_PUBLIC_` prefix to be accessible at build time.

### 🔴 CRITICAL - Required

| Variable Name         | Description                               | Required |
| --------------------- | ----------------------------------------- | -------- |
| `EXPO_PUBLIC_API_URL` | Backend API URL                           | ✅ Yes   |
| `EXPO_PUBLIC_ENV`     | Environment (`development`, `production`) | ✅ Yes   |

### 🟡 API URLs

| Variable Name                     | Description               | Required |
| --------------------------------- | ------------------------- | -------- |
| `EXPO_PUBLIC_BACKEND_URL`         | Alternative backend URL   | Optional |
| `EXPO_PUBLIC_API_URL_DEV`         | Development API URL       | Optional |
| `EXPO_PUBLIC_API_URL_DEVELOPMENT` | Development API URL (alt) | Optional |
| `EXPO_PUBLIC_API_URL_PRODUCTION`  | Production API URL        | Optional |
| `EXPO_PUBLIC_CDN_URL`             | CDN URL for assets        | Optional |

### 🟡 Google OAuth

| Variable Name                          | Description                    | Required         |
| -------------------------------------- | ------------------------------ | ---------------- |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`     | Google web OAuth client ID     | For Google login |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`     | Google iOS OAuth client ID     | For Google login |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Google Android OAuth client ID | For Google login |

### 🟡 Firebase

| Variable Name                              | Description                  | Required     |
| ------------------------------------------ | ---------------------------- | ------------ |
| `EXPO_PUBLIC_FIREBASE_API_KEY`             | Firebase API key             | For Firebase |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Firebase auth domain         | For Firebase |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID`          | Firebase project ID          | For Firebase |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Firebase storage bucket      | For Firebase |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | For Firebase |
| `EXPO_PUBLIC_FIREBASE_APP_ID`              | Firebase app ID              | For Firebase |
| `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`      | Firebase measurement ID      | Optional     |

### 🟡 AI Gateway (Vercel AI)

| Variable Name                       | Description               | Required        |
| ----------------------------------- | ------------------------- | --------------- |
| `EXPO_PUBLIC_VERCEL_AI_GATEWAY_KEY` | Vercel AI Gateway API key | For AI features |
| `EXPO_PUBLIC_VERCEL_AI_GATEWAY_URL` | Vercel AI Gateway URL     | For AI features |

### 🟡 Image Services

| Variable Name                             | Description                | Required   |
| ----------------------------------------- | -------------------------- | ---------- |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`       | Cloudinary cloud name      | For images |
| `EXPO_PUBLIC_PLACEHOLDER_IMAGE_URL`       | Fallback placeholder image | Optional   |
| `EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY` | Vision API for moderation  | Optional   |

### 🟡 Content Moderation

| Variable Name                        | Description             | Required |
| ------------------------------------ | ----------------------- | -------- |
| `EXPO_PUBLIC_MODERATION_SERVICE`     | Moderation service name | Optional |
| `EXPO_PUBLIC_MODERATION_API_KEY`     | Moderation API key      | Optional |
| `EXPO_PUBLIC_SIGHTENGINE_API_SECRET` | SightEngine API secret  | Optional |

### 🟡 Monitoring

| Variable Name            | Description                    | Required    |
| ------------------------ | ------------------------------ | ----------- |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry DSN for frontend errors | Recommended |

### 🟡 App Info

| Variable Name              | Description        | Required |
| -------------------------- | ------------------ | -------- |
| `EXPO_PUBLIC_APP_VERSION`  | App version string | Optional |
| `EXPO_PUBLIC_BUILD_NUMBER` | Build number       | Optional |

### 🟡 Legal & Support (Required for App Store)

| Variable Name                        | Description           | Required      |
| ------------------------------------ | --------------------- | ------------- |
| `EXPO_PUBLIC_PRIVACY_POLICY_URL`     | Privacy policy URL    | ✅ For stores |
| `EXPO_PUBLIC_TERMS_OF_SERVICE_URL`   | Terms of service URL  | ✅ For stores |
| `EXPO_PUBLIC_SUPPORT_EMAIL`          | Support email address | ✅ For stores |
| `EXPO_PUBLIC_PRIVACY_EMAIL`          | Privacy contact email | Recommended   |
| `EXPO_PUBLIC_COMPANY_ADDRESS`        | Company address       | Recommended   |
| `EXPO_PUBLIC_GOVERNING_JURISDICTION` | Legal jurisdiction    | Recommended   |

---

## Render Deployment Quick Reference

Copy these to Render Dashboard → Environment:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
HASH_SALT=
FRONTEND_URL=
CORS_ORIGIN=
REDIS_URL=
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
SENTRY_DSN=
```

---

## Vercel Deployment Quick Reference

Copy these to Vercel Dashboard → Settings → Environment Variables:

```
EXPO_PUBLIC_API_URL=https://your-backend.onrender.com/api
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=
EXPO_PUBLIC_PRIVACY_POLICY_URL=
EXPO_PUBLIC_TERMS_OF_SERVICE_URL=
EXPO_PUBLIC_SUPPORT_EMAIL=
```

---

## Generating Secure Secrets

Run this command to generate secure random values for JWT_SECRET, JWT_REFRESH_SECRET, and HASH_SALT:

```bash
# Generate 64-character hex string for JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate 32-character hex string for HASH_SALT
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
