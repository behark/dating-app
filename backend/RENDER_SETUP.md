# Render.com Redis Setup Guide

## ✅ What You Need to Add to Render

**Only ONE environment variable:**

```
REDIS_URL=redis://default:pPjl1LpcwRC3hw9iIm5Ku3deXgTLGA0A@redis-18372.c99.us-east-1-4.ec2.cloud.redislabs.com:18372
```

---

## 📝 Step-by-Step Instructions

### 1. Go to Render Dashboard
- Visit: https://dashboard.render.com
- Log in to your account

### 2. Select Your Backend Service
- Click on your backend service (e.g., "dating-app-backend")

### 3. Navigate to Environment
- In the left sidebar, click **"Environment"**

### 4. Add Environment Variable
- Click **"Add Environment Variable"** button
- **Key**: `REDIS_URL`
- **Value**: `redis://default:pPjl1LpcwRC3hw9iIm5Ku3deXgTLGA0A@redis-18372.c99.us-east-1-4.ec2.cloud.redislabs.com:18372`
- Click **"Save Changes"**

### 5. Redeploy
- After saving, Render will automatically redeploy your service
- Or manually trigger a redeploy from the "Manual Deploy" section

---

## ✅ Verification

After deployment, check your service logs. You should see:

```
Redis connecting...
Redis connected and ready
```

If you see this, Redis is working! 🎉

---

## 🔒 Security Note

- ✅ The password is already in your Redis URL
- ✅ Render encrypts environment variables at rest
- ✅ Only your service can access this variable
- ❌ Never commit this to Git (it's already in .env which is gitignored)

---

## 📋 Summary

**What to add to Render:**
- **Key**: `REDIS_URL`
- **Value**: `redis://default:pPjl1LpcwRC3hw9iIm5Ku3deXgTLGA0A@redis-18372.c99.us-east-1-4.ec2.cloud.redislabs.com:18372`

**That's it!** Just one environment variable. Your backend code will automatically use it.
