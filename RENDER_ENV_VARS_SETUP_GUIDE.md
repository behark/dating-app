# Render Environment Variables Setup Guide

**Complete checklist for setting up your backend on Render**

---

## ✅ Already Configured in `render.yaml` (Auto-set)

These variables are automatically set when you deploy via Blueprint:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | ✅ Auto-set |
| `PORT` | `10000` | ✅ Auto-set |
| `FIREBASE_PROJECT_ID` | `my-project-de65d` | ✅ Auto-set |
| `CORS_ORIGIN` | `https://dating-app-beharks-projects.vercel.app` | ✅ Auto-set |
| `FRONTEND_URL` | `https://dating-app-beharks-projects.vercel.app` | ✅ Auto-set |
| `JWT_EXPIRES_IN` | `7d` | ✅ Auto-set |
| `JWT_REFRESH_EXPIRES_IN` | `30d` | ✅ Auto-set |
| `DD_SITE` | `datadoghq.eu` | ✅ Auto-set |
| `DD_ENV` | `prod` | ✅ Auto-set |
| `DD_AGENT_HOST` | `localhost` | ✅ Auto-set |
| `SENTRY_DSN` | `https://e21c92d839607c2d0f9378d08ca96903@o4510655194726400.ingest.de.sentry.io/4510655204687952` | ✅ Auto-set |

**Auto-generated (Render generates secure values):**
- `JWT_SECRET` - ✅ Auto-generated
- `JWT_REFRESH_SECRET` - ✅ Auto-generated
- `ENCRYPTION_KEY` - ✅ Auto-generated

---

## 🔴 CRITICAL - Must Add Manually in Render Dashboard

These are marked as `sync: false` in `render.yaml` and **MUST** be added manually:

### 1. **MONGODB_URI** ⚠️ REQUIRED
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dating-app?retryWrites=true&w=majority
```
**Where to get:** MongoDB Atlas → Connect → Connection String  
**Action:** Copy your MongoDB Atlas connection string

---

### 2. **HASH_SALT** ⚠️ REQUIRED
```
HASH_SALT=<generate-64-character-random-string>
```
**How to generate:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
**Action:** Generate and paste the value

---

### 3. **FIREBASE_PRIVATE_KEY** ⚠️ REQUIRED (if using Firebase)
```
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```
**Where to get:** Firebase Console → Project Settings → Service Accounts → Generate New Private Key  
**Action:** Download JSON, copy the `private_key` field (keep the `\n` characters)

---

### 4. **FIREBASE_CLIENT_EMAIL** ⚠️ REQUIRED (if using Firebase)
```
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@my-project-de65d.iam.gserviceaccount.com
```
**Where to get:** Same Firebase service account JSON, copy the `client_email` field  
**Action:** Copy from the service account JSON

---

## 🟡 RECOMMENDED - Add for Full Functionality

### 5. **DD_API_KEY** (Datadog Monitoring)
```
DD_API_KEY=your-datadog-api-key-here
```
**Where to get:** Datadog Dashboard → Organization Settings → API Keys  
**Action:** Create API key and paste (if using Datadog)

---

### 6. **Storage Configuration** (Choose one)

**Option A: Cloudinary** (Recommended for images)
```
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_PRESET=dating-app-uploads
```

**Option B: AWS S3**
```
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
CDN_URL=https://your-cdn-url.cloudfront.net
```

---

### 7. **OAuth Providers** (If using social login)

**Google OAuth:**
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Facebook OAuth:**
```
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

**Apple Sign In:**
```
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY_PATH=./keys/apple-auth-key.p8
```

---

### 8. **Email Service** (For notifications)

**Option A: SMTP**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdatingapp.com
```

**Option B: SendGrid**
```
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdatingapp.com
```

---

### 9. **Redis** (For caching - Optional but recommended)

**Option A: Redis Cloud/Upstash**
```
REDIS_URL=redis://:password@host:port
```

**Option B: Individual settings**
```
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0
REDIS_QUEUE_DB=1
```

---

## 🟢 OPTIONAL - Nice to Have

### 10. **AI Services** (If using AI features)
```
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4
```

### 11. **Phone Verification** (If using SMS)
```
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_VERIFY_SERVICE_SID=your-verify-service-sid
```

### 12. **Payment Processing** (If using payments)
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 13. **Push Notifications**
```
EXPO_ACCESS_TOKEN=your-expo-access-token
```

### 14. **Feature Flags** (Optional - defaults work)
```
ENABLE_PREMIUM_FEATURES=true
ENABLE_AI_MATCHING=true
ENABLE_VIDEO_PROFILES=true
ENABLE_VOICE_MESSAGES=true
ENABLE_VIDEO_CALLS=false
```

### 15. **Rate Limiting** (Optional - defaults work)
```
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
FREE_DAILY_SWIPE_LIMIT=100
PREMIUM_DAILY_SWIPE_LIMIT=500
```

---

## 📋 Quick Setup Checklist

### Minimum Required (Backend will start):
- [x] `MONGODB_URI` - **MUST ADD**
- [x] `HASH_SALT` - **MUST ADD**
- [x] `FIREBASE_PRIVATE_KEY` - **MUST ADD** (if using Firebase)
- [x] `FIREBASE_CLIENT_EMAIL` - **MUST ADD** (if using Firebase)

### Recommended (For full functionality):
- [ ] `DD_API_KEY` - For monitoring
- [ ] `STORAGE_PROVIDER` + Cloudinary/S3 config - For file uploads
- [ ] `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` - For Google login
- [ ] Email service config - For notifications
- [ ] `REDIS_URL` or Redis config - For caching

### Optional (Nice to have):
- [ ] `OPENAI_API_KEY` - For AI features
- [ ] `TWILIO_*` - For SMS verification
- [ ] `STRIPE_SECRET_KEY` - For payments
- [ ] `EXPO_ACCESS_TOKEN` - For push notifications

---

## 🚀 How to Add Variables in Render Dashboard

1. Go to your Render Dashboard
2. Select your **dating-app-backend** service
3. Click **Environment** tab
4. Click **Add Environment Variable**
5. Enter the **Key** and **Value**
6. Click **Save Changes**
7. Render will automatically redeploy

---

## ⚠️ Security Notes

- **Never commit** `.env` files to git
- **Never share** secret keys publicly
- Use **Render's secret management** (variables marked `sync: false`)
- Rotate secrets periodically
- Use different secrets for staging/production

---

## 🔍 Verify Your Setup

After adding variables, check your deployment logs:

```bash
# SSH into your Render service (if enabled)
ssh your-service@ssh.render.com

# Check environment variables
printenv | grep -E '^(MONGODB_URI|JWT_SECRET|HASH_SALT|FIREBASE|CORS_ORIGIN|FRONTEND_URL)' | sort
```

Or check the Render dashboard → Service → Logs for startup validation messages.

---

## 📝 Summary

**Minimum to get started:**
1. `MONGODB_URI` ✅
2. `HASH_SALT` ✅
3. `FIREBASE_PRIVATE_KEY` ✅ (if using Firebase)
4. `FIREBASE_CLIENT_EMAIL` ✅ (if using Firebase)

Everything else is optional or already configured! 🎉
