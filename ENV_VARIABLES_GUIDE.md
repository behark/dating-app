# Environment Variables Guide

## 🚀 RENDER (Backend) Environment Variables

Copy these to your Render Dashboard → Environment section.

### Required Variables (MUST SET)

```env
# ===== CORE CONFIGURATION =====
NODE_ENV=production
PORT=10000

# ===== DATABASE =====
# Get from MongoDB Atlas: https://cloud.mongodb.com
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/dating-app?retryWrites=true&w=majority

# ===== AUTHENTICATION =====
# Generate secure random strings (64+ chars): openssl rand -hex 32
JWT_SECRET=<generate-secure-64-char-random-string>
JWT_REFRESH_SECRET=<generate-different-secure-64-char-random-string>
ENCRYPTION_KEY=<generate-another-secure-32-char-random-string>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# ===== CORS & FRONTEND =====
CORS_ORIGIN=https://dating-app-seven-peach.vercel.app
FRONTEND_URL=https://dating-app-seven-peach.vercel.app

# ===== GOOGLE OAUTH =====
# Get from Google Cloud Console: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=489822402223-ijgd0vvfbma9s22944go4e2gnqk92ipd.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

### Firebase Configuration (Required for Auth)

```env
# ===== FIREBASE ADMIN SDK =====
# Get from Firebase Console → Project Settings → Service Accounts → Generate New Private Key
FIREBASE_PROJECT_ID=my-project-de65d
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@my-project-de65d.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Monitoring (Recommended)

```env
# ===== SENTRY ERROR TRACKING =====
SENTRY_DSN=https://e21c92d839607c2d0f9378d08ca96903@o4510655194726400.ingest.de.sentry.io/4510655204687952

# ===== DATADOG APM (Optional) =====
DD_API_KEY=<your-datadog-api-key>
DD_SITE=datadoghq.eu
DD_ENV=production
DD_SERVICE=dating-app-backend
```

### Email Service (Optional - for verification emails)

```env
# ===== EMAIL SERVICE =====
EMAIL_SERVICE=gmail
EMAIL_USER=<your-email@gmail.com>
EMAIL_PASSWORD=<your-app-specific-password>
```

### AI Features (Optional)

```env
# ===== OPENAI =====
OPENAI_API_KEY=<your-openai-api-key>
OPENAI_MODEL=gpt-3.5-turbo
USE_OPENAI=true
```

### Stripe Payments (Optional)

```env
# ===== STRIPE =====
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>
```

### AWS/CDN (Optional - for image storage)

```env
# ===== AWS S3 =====
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
AWS_REGION=us-east-1
S3_BUCKET_NAME=dating-app-images

# ===== CLOUDFRONT CDN =====
CLOUDFRONT_DISTRIBUTION_ID=<your-distribution-id>
CLOUDFRONT_DOMAIN=<your-cloudfront-domain>.cloudfront.net
CDN_URL=https://<your-cloudfront-domain>.cloudfront.net
```

### Redis (Optional - for caching/queues)

```env
# ===== REDIS =====
REDIS_URL=redis://<username>:<password>@<host>:<port>
```

### Rate Limiting (Optional)

```env
# ===== RATE LIMITS =====
FREE_DAILY_SWIPE_LIMIT=100
PREMIUM_DAILY_SWIPE_LIMIT=500
```

---

## 🌐 VERCEL (Frontend) Environment Variables

Copy these to Vercel Dashboard → Settings → Environment Variables.

### Required Variables (MUST SET)

```env
# ===== API CONFIGURATION =====
EXPO_PUBLIC_API_URL=https://dating-app-backend-x4yq.onrender.com/api
EXPO_PUBLIC_BACKEND_URL=https://dating-app-backend-x4yq.onrender.com

# ===== FIREBASE (Client-side) =====
# Get from Firebase Console → Project Settings → General → Your apps → Web app
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...<your-firebase-api-key>
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=my-project-de65d.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=my-project-de65d
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=my-project-de65d.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
EXPO_PUBLIC_FIREBASE_APP_ID=1:xxxxxxxxx:web:xxxxxxxxx
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# ===== GOOGLE OAUTH (Web Client ID) =====
# IMPORTANT: This must be an OAuth 2.0 Client ID for "Web application"
# Get from Google Cloud Console → APIs & Services → Credentials
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=489822402223-ijgd0vvfbma9s22944go4e2gnqk92ipd.apps.googleusercontent.com
```

### Optional Variables

```env
# ===== GOOGLE OAUTH (Native Clients - for mobile builds) =====
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<your-ios-client-id>.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=<your-android-client-id>.apps.googleusercontent.com

# ===== AI GATEWAY (Optional) =====
EXPO_PUBLIC_VERCEL_AI_GATEWAY_KEY=<your-vercel-ai-gateway-key>
EXPO_PUBLIC_VERCEL_AI_GATEWAY_URL=https://api.vercel.ai

# ===== MISC =====
EXPO_PUBLIC_PLACEHOLDER_IMAGE_URL=https://via.placeholder.com/100
```

---

## 📋 Quick Copy-Paste Templates

### Render - Minimal Required (Copy All)

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=<YOUR_MONGODB_URI>
JWT_SECRET=<GENERATE_RANDOM_64_CHAR_STRING>
JWT_REFRESH_SECRET=<GENERATE_ANOTHER_RANDOM_64_CHAR_STRING>
ENCRYPTION_KEY=<GENERATE_RANDOM_32_CHAR_STRING>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=https://dating-app-seven-peach.vercel.app
FRONTEND_URL=https://dating-app-seven-peach.vercel.app
GOOGLE_CLIENT_ID=489822402223-ijgd0vvfbma9s22944go4e2gnqk92ipd.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<YOUR_GOOGLE_CLIENT_SECRET>
FIREBASE_PROJECT_ID=my-project-de65d
FIREBASE_CLIENT_EMAIL=<YOUR_FIREBASE_SERVICE_ACCOUNT_EMAIL>
FIREBASE_PRIVATE_KEY=<YOUR_FIREBASE_PRIVATE_KEY>
SENTRY_DSN=https://e21c92d839607c2d0f9378d08ca96903@o4510655194726400.ingest.de.sentry.io/4510655204687952
```

### Vercel - Minimal Required (Copy All)

```env
EXPO_PUBLIC_API_URL=https://dating-app-backend-x4yq.onrender.com/api
EXPO_PUBLIC_BACKEND_URL=https://dating-app-backend-x4yq.onrender.com
EXPO_PUBLIC_FIREBASE_API_KEY=<YOUR_FIREBASE_API_KEY>
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=my-project-de65d.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=my-project-de65d
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=my-project-de65d.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<YOUR_SENDER_ID>
EXPO_PUBLIC_FIREBASE_APP_ID=<YOUR_APP_ID>
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=489822402223-ijgd0vvfbma9s22944go4e2gnqk92ipd.apps.googleusercontent.com
```

---

## 🔐 How to Generate Secure Secrets

### Using OpenSSL (Linux/Mac)

```bash
# Generate 64-character hex string for JWT_SECRET
openssl rand -hex 32

# Generate 32-character hex string for ENCRYPTION_KEY
openssl rand -hex 16
```

### Using Node.js

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Using Python

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## 📍 Where to Find Values

| Variable                  | Where to Get                                                                      |
| ------------------------- | --------------------------------------------------------------------------------- |
| `MONGODB_URI`             | MongoDB Atlas → Database → Connect → Drivers                                      |
| `GOOGLE_CLIENT_ID/SECRET` | Google Cloud Console → APIs & Services → Credentials                              |
| `FIREBASE_*` (Client)     | Firebase Console → Project Settings → General → Web app                           |
| `FIREBASE_PRIVATE_KEY`    | Firebase Console → Project Settings → Service Accounts → Generate New Private Key |
| `STRIPE_*`                | Stripe Dashboard → Developers → API Keys                                          |
| `OPENAI_API_KEY`          | OpenAI Platform → API Keys                                                        |
| `DD_API_KEY`              | Datadog → Organization Settings → API Keys                                        |

---

## ⚠️ Important Notes

1. **Never commit secrets to git** - Use `.env.local` for local development
2. **Firebase Private Key** - Must include the full key with `\n` characters or be properly escaped
3. **Google OAuth** - Make sure to add your Vercel domain to "Authorized JavaScript origins" in Google Cloud Console
4. **CORS** - If using multiple domains, separate with commas in `CORS_ORIGIN`
5. **After changing Render env vars** - Trigger a manual deploy for changes to take effect
