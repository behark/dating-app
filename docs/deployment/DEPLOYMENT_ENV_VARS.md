# Deployment Environment Variables

Critical environment variables to add to Render and Vercel for production deployment.

---

## Cloudinary Variables (REQUIRED for Photo Uploads)

### **Add to Render Dashboard:**

Go to: Dashboard > Your Service > Environment > Add Environment Variables

```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
STORAGE_PROVIDER=cloudinary
```

### **Add to Vercel Dashboard:**

Go to: Project Settings > Environment Variables

```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
STORAGE_PROVIDER=cloudinary
```

---

## All Required Environment Variables

### **For Render (Backend):**

```bash
# Server
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-app.vercel.app

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dating-app

# Redis
REDIS_URL=redis://your-redis-url

# Authentication (GENERATE SECURE VALUES)
JWT_SECRET=<generate-64-char-hex>
JWT_REFRESH_SECRET=<generate-64-char-hex>
HASH_SALT=<generate-32-char-hex>
ENCRYPTION_KEY=<generate-32-char-hex>

# Cloudinary (REQUIRED for uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
STORAGE_PROVIDER=cloudinary

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=your-firebase-private-key

# Sentry
SENTRY_DSN=your-sentry-dsn

# Datadog
DD_API_KEY=your-datadog-api-key
DD_SITE=datadoghq.eu
DD_ENV=production
DD_SERVICE=dating-app-backend

# CORS
CORS_ORIGIN=https://your-app.vercel.app

# Backup Monitoring
MONGODB_BACKUP_ENABLED=true
MONGODB_BACKUP_MAX_AGE_HOURS=30
```

### **For Vercel (Frontend):**

```bash
# API URL
EXPO_PUBLIC_API_URL=https://your-backend.onrender.com/api
EXPO_PUBLIC_BACKEND_URL=https://your-backend.onrender.com

# Firebase (public config)
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id

# Google OAuth (public client ID)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Cloudinary (for direct uploads from frontend)
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset

# Monitoring
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

---

## Generate Secure Secrets

```bash
# Generate JWT secret (64+ characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate encryption key (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate hash salt (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Security Notes

- **NEVER** commit real secrets to git
- Add secrets to deployment platforms (Render/Vercel) manually via their dashboards
- Rotate secrets immediately if they are ever exposed
- Use long, randomly generated values for all secrets

---

## How to Add Variables

### **Render:**

1. Go to https://dashboard.render.com
2. Select your backend service
3. Click "Environment"
4. Add each variable
5. Save and redeploy

### **Vercel:**

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add each variable for Production/Preview/Development
5. Redeploy

---

## Verification Checklist

After adding variables:

- [ ] All required backend variables set on Render
- [ ] All required frontend variables set on Vercel
- [ ] JWT secrets are freshly generated (not dev values)
- [ ] Firebase credentials configured
- [ ] Cloudinary configured
- [ ] Both services redeployed
- [ ] Test photo upload
- [ ] Test authentication
- [ ] Monitor error logs
