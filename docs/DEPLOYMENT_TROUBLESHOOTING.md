# Deployment Troubleshooting Guide

Quick reference for common deployment issues across all platforms.

---

## Vercel (Frontend) Issues

### Build fails with "web-build not found"
```
Error: No output directory named 'web-build' found
```
**Solution:**
- Verify `buildCommand` runs correctly locally: `npm run vercel-build`
- Check `expo export` is working: `npx expo export -p web --output-dir web-build`
- Ensure dependencies installed: `npm install --legacy-peer-deps`

### Routes not working (404 errors)
**Issue:** Deep links returning 404 (e.g., `/chat/user-id`)  
**Solution:** 
- Check `vercel.json` has rewrite rule:
```json
{
  "source": "/(.*)",
  "destination": "/index.html"
}
```
- Verify this rewrites ALL routes to index.html for SPA routing

### Security headers missing
**Issue:** CSP violations or missing HSTS headers  
**Solution:**
- Verify `headers` array in `vercel.json` is complete
- Redeploy after config changes (not automatic)
- Check response headers: `curl -I https://dating-app-seven-peach.vercel.app`

---

## Render (Backend) Issues

### API connection timeout
```
Error: connect ECONNREFUSED 127.0.0.1:10000
```
**Solution:**
- Check backend running: `curl https://dating-app-backend-render.onrender.com/health`
- Verify PORT=10000 environment variable set
- Check `startCommand` in render.yaml: `npm start`
- Restart service in Render dashboard

### Environment variables not loading
**Issue:** Backend crashes with "FIREBASE_PROJECT_ID undefined"  
**Solution:**
- Set manually in Render dashboard (don't use render.yaml for secrets)
- Variables marked `sync: false` must be added manually
- Restart service after adding variables

### MongoDB connection fails
```
Error: connect ETIMEDOUT (trying to reach MongoDB)
```
**Solution:**
- Verify MONGODB_URI set and correct in Render dashboard
- Test connection string locally first
- Check MongoDB Atlas IP whitelist includes Render IPs
- Render IPs: 209.97.142.0/24, 45.33.32.0/22, etc.

### Health check failing
```
Unhealthy: GET /health returned 500
```
**Solution:**
- Endpoint at `backend/server.js` line ~50:
```javascript
app.get('/health', (req, res) => res.json({ status: 'ok' }));
```
- If modified, update `healthCheckPath` in render.yaml
- Check logs in Render dashboard

---

## EAS Build (Mobile) Issues

### Build fails on iOS
```
Error: Provisioning profile not found
```
**Solution:**
- Use Expo's managed signing (auto-provisioning)
- In `eas.json`, ensure `managed: true` under ios
- Requires Apple Developer account linked to Expo

### Android build succeeds but app won't open
**Issue:** "App won't install" or crashes on launch  
**Solution:**
- Check `app.json` configuration
- Verify `EXPO_PUBLIC_ENV` environment variable
- Ensure Firebase credentials configured
- Download APK, use: `adb install app.apk`

### Builds timing out
```
Timeout building project (>90 min)
```
**Solution:**
- Increase resource class in eas.json:
```json
"ios": {
  "resourceClass": "m-medium"  // or "m-large"
}
```
- Reduce app size:
  - Remove unused dependencies
  - Optimize images
  - Code split if possible

### "Export failed" error
**Issue:** Updates channel not available  
**Solution:**
- Verify channel exists: `npx eas channel list`
- Create if needed: `npx eas channel create --name preview`
- Update eas.json to use correct channel

---

## Cross-Platform Issues

### Frontend can't reach backend
```
CORS error or connection refused
```
**Solution:**
- Check CORS_ORIGIN in backend (render.yaml):
```yaml
- key: CORS_ORIGIN
  value: https://dating-app-seven-peach.vercel.app
```
- Update if frontend URL changed
- Verify API endpoint in `.env`:
```
EXPO_PUBLIC_API_URL=https://dating-app-backend-render.onrender.com
```

### Authentication failing
**Issue:** Login works locally but not in production  
**Solution:**
- Verify Firebase config matches all platforms
- Check JWT secrets consistent across environments
- Verify GOOGLE_CLIENT_ID/SECRET environment variables
- Test auth flow: `npm run test:backend`

### Images/assets not loading
**Issue:** 404s for images in production  
**Solution:**
- Check `public/` folder exists and deployed
- Verify image paths are relative: `/assets/...` not `./assets/...`
- On Vercel, ensure static assets in `public/` or `web-build/`
- On backend, verify serve-static middleware configured

---

## Debugging Commands

```bash
# Vercel deployments
vercel logs --follow

# Render logs (requires Render CLI)
render logs dating-app-backend

# EAS Build logs
eas build:view [BUILD_ID]
eas diagnostics

# Local testing
npm run start:backend  # Local backend
npm run web           # Local frontend
```

---

## Emergency Rollback

### Vercel Rollback
Dashboard → Deployments → Select previous → "Redeploy"

### Render Rollback
Dashboard → Deploys → Select previous → "Deploy"

### EAS Rollback (Mobile)
App can't rollback automatically. Options:
1. Release new version with bug fix
2. Use Expo Updates to push JS patch
3. Notify users to reinstall from app store

---

**Last Updated:** March 4, 2026
