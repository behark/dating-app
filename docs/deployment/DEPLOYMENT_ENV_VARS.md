# Deployment Environment Variables

Simplified stack: **Vercel** (frontend) + **Render** (backend + Socket.io) + **MongoDB Atlas** (database)

---

## All Required Environment Variables

### **For Render (Backend):**

```bash
# Server
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGIN=https://your-app.vercel.app

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dating-app

# Redis (optional but recommended)
REDIS_URL=redis://your-redis-url

# Authentication (GENERATE SECURE VALUES)
JWT_SECRET=<generate-64-char-hex>
JWT_REFRESH_SECRET=<generate-64-char-hex>
HASH_SALT=<generate-32-char-hex>

# Cloudinary (REQUIRED for uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Sentry (optional)
SENTRY_DSN=your-sentry-dsn
```

### **For Vercel (Frontend):**

```bash
# API URL
EXPO_PUBLIC_API_URL=https://your-backend.onrender.com/api
EXPO_PUBLIC_BACKEND_URL=https://your-backend.onrender.com

# Google OAuth (public client ID)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Cloudinary
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name

# Monitoring (optional)
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

---

## Generate Secure Secrets

```bash
# Generate JWT secret (64+ characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

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
- [ ] Cloudinary configured
- [ ] Both services redeployed
- [ ] Test photo upload
- [ ] Test authentication
- [ ] Monitor error logs
