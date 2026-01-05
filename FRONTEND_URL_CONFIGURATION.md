# Frontend/Website URL Configuration Guide

## Where to Set the Frontend URL

### 🔴 **BACKEND (Render.com) - REQUIRED**

You need to set these environment variables in **Render Dashboard** for your backend service:

#### 1. `FRONTEND_URL`

**Where:** Render Dashboard → Your Backend Service → Environment

**Value:** `https://dating-app-seven-peach.vercel.app`

**Used for:**

- Email verification links
- Password reset links
- Payment redirect URLs
- Social sharing URLs
- General frontend references

#### 2. `CORS_ORIGIN`

**Where:** Render Dashboard → Your Backend Service → Environment

**Value:** `https://dating-app-seven-peach.vercel.app`

**Used for:**

- CORS (Cross-Origin Resource Sharing) configuration
- Allows your frontend to make API requests to the backend

**Note:** You can set multiple origins by comma-separating them:

```
https://dating-app-seven-peach.vercel.app,https://dating-app-beharks-projects.vercel.app
```

---

### 🟡 **FRONTEND (Vercel) - OPTIONAL**

If you need to override the backend API URL at runtime, you can set:

#### `EXPO_PUBLIC_API_URL` or `EXPO_PUBLIC_BACKEND_URL`

**Where:** Vercel Dashboard → Your Project → Settings → Environment Variables

**Value:** `https://dating-app-backend-x4yq.onrender.com/api`

**Note:** This is usually not needed because the frontend code already defaults to the correct backend URL.

---

## Current Configuration Status

### ✅ What's Currently Set

Based on the code:

- **Backend CORS** allows all `*.vercel.app` domains (regex pattern)
- **Frontend API URL** defaults to: `https://dating-app-backend-x4yq.onrender.com/api`

### ⚠️ What Needs to Be Updated

**In Render Dashboard**, set:

1. `FRONTEND_URL` = `https://dating-app-seven-peach.vercel.app`
2. `CORS_ORIGIN` = `https://dating-app-seven-peach.vercel.app`

---

## How to Update Render Environment Variables

### Option 1: Via Render Dashboard (Recommended)

1. Go to: https://dashboard.render.com
2. Select your backend service (e.g., `dating-app-backend`)
3. Click **Environment** tab
4. Click **Add Environment Variable** or edit existing ones
5. Add/Update:
   - Key: `FRONTEND_URL`
   - Value: `https://dating-app-seven-peach.vercel.app`
6. Add/Update:
   - Key: `CORS_ORIGIN`
   - Value: `https://dating-app-seven-peach.vercel.app`
7. Click **Save Changes**
8. Render will automatically redeploy

### Option 2: Via Script

Use the existing script:

```bash
./update_render_env_vars.sh
```

Or manually via API (see `update_render_env_vars.sh` for reference)

---

## Verification

After updating, verify the settings:

### Check via SSH:

```bash
ssh srv-d5cooc2li9vc73ct9j70@ssh.oregon.render.com "printenv | grep -E '^(FRONTEND_URL|CORS_ORIGIN)'"
```

Expected output:

```
CORS_ORIGIN=https://dating-app-seven-peach.vercel.app
FRONTEND_URL=https://dating-app-seven-peach.vercel.app
```

### Test CORS:

```bash
curl -X OPTIONS https://dating-app-backend-x4yq.onrender.com/api/auth/login \
  -H "Origin: https://dating-app-seven-peach.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v | grep -i "access-control-allow-origin"
```

Should return:

```
< access-control-allow-origin: https://dating-app-seven-peach.vercel.app
```

---

## Important Notes

1. **No trailing slash** - Don't include `/` at the end of URLs
2. **HTTPS required** - Always use `https://` in production
3. **Multiple domains** - If you have multiple frontend URLs, comma-separate them in `CORS_ORIGIN`
4. **Automatic redeploy** - Render will redeploy after you save environment variables

---

## Troubleshooting

### Issue: CORS errors in browser console

**Solution:** Make sure `CORS_ORIGIN` includes your exact frontend URL

### Issue: Email verification links don't work

**Solution:** Make sure `FRONTEND_URL` is set correctly

### Issue: Login/signup still not working

**Solution:**

1. Check that both `FRONTEND_URL` and `CORS_ORIGIN` are set
2. Verify the backend has redeployed after changes
3. Check browser console for specific error messages
