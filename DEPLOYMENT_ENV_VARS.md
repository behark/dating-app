# 🚀 Deployment Environment Variables

Critical environment variables to add to Render and Vercel for production deployment.

---

## ✅ Cloudinary Variables (REQUIRED for Photo Uploads)

### **Add to Render Dashboard:**

Go to: Dashboard → Your Service → Environment → Add Environment Variables

```
CLOUDINARY_CLOUD_NAME=deypafphv
CLOUDINARY_API_KEY=888717335975415
CLOUDINARY_API_SECRET=7d6ry-QOU8tYE6lD2-zi_a4h9LY
STORAGE_PROVIDER=cloudinary
```

### **Add to Vercel Dashboard:**

Go to: Project Settings → Environment Variables

```
CLOUDINARY_CLOUD_NAME=deypafphv
CLOUDINARY_API_KEY=888717335975415
CLOUDINARY_API_SECRET=7d6ry-QOU8tYE6lD2-zi_a4h9LY
STORAGE_PROVIDER=cloudinary
```

---

## 📋 All Required Environment Variables

### **For Render (Backend):**

```bash
# Server
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-app.vercel.app

# Database
MONGODB_URI=mongodb+srv://beharkabashi19_db_user:Behar123.@cluster0.jvmgujl.mongodb.net/dating-app

# Redis
REDIS_URL=redis://default:pPjl1LpcwRC3hw9iIm5Ku3deXgTLGA0A@redis-18372.c99.us-east-1-4.ec2.cloud.redislabs.com:18372

# Authentication (CHANGE THESE!)
JWT_SECRET=your-production-jwt-secret-min-64-chars
JWT_REFRESH_SECRET=your-production-refresh-secret-min-64-chars

# Cloudinary (REQUIRED for uploads)
CLOUDINARY_CLOUD_NAME=deypafphv
CLOUDINARY_API_KEY=888717335975415
CLOUDINARY_API_SECRET=7d6ry-QOU8tYE6lD2-zi_a4h9LY
STORAGE_PROVIDER=cloudinary

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Sentry
SENTRY_DSN=https://e21c92d839607c2d0f9378d08ca96903@o4510655194726400.ingest.de.sentry.io/4510655204687952

# Datadog
DD_API_KEY=0714d04b31b454298a11efc572156901
DD_SITE=datadoghq.eu
DD_ENV=production

# CORS
CORS_ORIGIN=https://your-app.vercel.app

# Security
ENCRYPTION_KEY=your-32-char-encryption-key
HASH_SALT=your-32-char-hash-salt
```

### **For Vercel (Frontend):**

```bash
# API URL
EXPO_PUBLIC_API_URL=https://your-backend.onrender.com

# Cloudinary (for direct uploads from frontend)
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=deypafphv
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset

# Google OAuth (if using)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

---

## ⚠️ IMPORTANT Security Notes

### **1. Generate Secure Secrets:**

```bash
# Generate JWT secret (64+ characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate encryption key (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **2. Never Commit Secrets:**
- ✅ Secrets are in `.env` (git-ignored)
- ✅ Add to deployment platforms manually
- ❌ Never commit `.env` to git
- ❌ Never hardcode secrets in code

### **3. Cloudinary Upload Preset:**

**Create in Cloudinary Dashboard:**
1. Go to Settings → Upload
2. Add Upload Preset
3. Name: `dating-app-uploads`
4. Signing Mode: **Unsigned** (for direct uploads)
5. Folder: `dating-app/photos`
6. Save preset name

Then add to Vercel:
```
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=dating-app-uploads
```

---

## 🔧 How to Add Variables

### **Render:**

1. Go to https://dashboard.render.com
2. Select your backend service
3. Click "Environment"
4. Click "Add Environment Variable"
5. Add each variable one by one
6. Click "Save Changes"
7. Service will auto-redeploy

### **Vercel:**

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable
5. Select environments (Production/Preview/Development)
6. Click "Save"
7. Redeploy for changes to take effect

---

## ✅ Verification Checklist

**After adding variables:**

- [ ] Cloudinary variables added to Render
- [ ] JWT secrets generated (new, not dev ones)
- [ ] All required variables added
- [ ] Frontend variables added to Vercel
- [ ] Redeploy both services
- [ ] Test photo upload in production
- [ ] Test authentication works
- [ ] Monitor error logs

---

## 🚨 Critical for Photo Uploads

**Without Cloudinary variables:**
- ❌ Photo uploads will fail
- ❌ Users can't complete profiles
- ❌ App functionality broken

**With Cloudinary variables:**
- ✅ Photo uploads work
- ✅ Users can add photos
- ✅ Full app functionality

---

## 📝 Quick Copy-Paste

**Render (Backend) - Cloudinary Only:**
```
CLOUDINARY_CLOUD_NAME=deypafphv
CLOUDINARY_API_KEY=888717335975415
CLOUDINARY_API_SECRET=7d6ry-QOU8tYE6lD2-zi_a4h9LY
STORAGE_PROVIDER=cloudinary
```

**Vercel (Frontend) - Cloudinary Only:**
```
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=deypafphv
```

---

## 💡 Pro Tips

1. **Use production secrets:**
   - Don't use `dev-super-secret` in production
   - Generate long, random secrets

2. **Set CORS correctly:**
   - Match your actual frontend URL
   - Include https://

3. **Monitor after deployment:**
   - Check Sentry for errors
   - Verify uploads work
   - Test authentication

4. **Document your setup:**
   - Keep list of all variables
   - Note which service needs which
   - Update when you change them

---

## 🎉 That's It!

Add these variables to Render and Vercel, and your photo uploads will work in production!

**Don't forget:** Redeploy after adding variables for changes to take effect!
