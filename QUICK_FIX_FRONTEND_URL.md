# Quick Fix: Update Frontend URL in Render

## ⚠️ Current Issue

Your backend is configured for: `https://dating-app-beharks-projects.vercel.app`
But your actual frontend is: `https://dating-app-seven-peach.vercel.app`

## ✅ Quick Fix (Choose One Method)

### Method 1: Via Render Dashboard (Easiest)

1. Go to: https://dashboard.render.com
2. Click on your backend service: `dating-app-backend`
3. Click **Environment** tab
4. Find and update these two variables:
   - `CORS_ORIGIN` → Change to: `https://dating-app-seven-peach.vercel.app`
   - `FRONTEND_URL` → Change to: `https://dating-app-seven-peach.vercel.app`
5. Click **Save Changes**
6. Wait for automatic redeploy (2-3 minutes)

### Method 2: Via Script

Run this command:
```bash
./update_render_env_vars.sh
```

This will update both variables automatically.

### Method 3: Manual API Call

```bash
curl -X POST "https://api.render.com/v1/services/srv-d5cooc2li9vc73ct9j70/env-vars" \
  -H "Authorization: Bearer rnd_uxGa5DLMWLzFvyvRlvhxslstAyaO" \
  -H "Content-Type: application/json" \
  -d '{"envVar": {"key": "CORS_ORIGIN", "value": "https://dating-app-seven-peach.vercel.app"}}'

curl -X POST "https://api.render.com/v1/services/srv-d5cooc2li9vc73ct9j70/env-vars" \
  -H "Authorization: Bearer rnd_uxGa5DLMWLzFvyvRlvhxslstAyaO" \
  -H "Content-Type: application/json" \
  -d '{"envVar": {"key": "FRONTEND_URL", "value": "https://dating-app-seven-peach.vercel.app"}}'
```

## ✅ Verification

After updating, test that it works:
```bash
curl -X OPTIONS https://dating-app-backend-x4yq.onrender.com/api/auth/login \
  -H "Origin: https://dating-app-seven-peach.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v | grep -i "access-control-allow-origin"
```

Should show:
```
< access-control-allow-origin: https://dating-app-seven-peach.vercel.app
```

## 📝 Note

The backend code already has a regex pattern that allows all `*.vercel.app` domains, so CORS might work even without this change. However, setting the exact URL ensures:
- Email verification links work correctly
- Password reset links work correctly
- Payment redirects work correctly
- Better security (explicit allowlist)
