# 🚀 Production Deployment Guide

**Last Updated:** January 6, 2026  
**Project:** Dating App  
**Deployment Platforms:** Render (Backend) + Vercel (Frontend)

---

## 📋 Pre-Deployment Checklist

Before deploying to production, complete these critical steps:

### ✅ 1. Generate JWT Secrets

```bash
# Generate strong, cryptographically secure secrets
node scripts/generate-jwt-secrets.js

# This creates:
# - JWT_SECRET (64+ characters)
# - JWT_REFRESH_SECRET (64+ characters)
# - API_KEY (32 characters)
```

**⚠️ IMPORTANT:** Use different secrets for each environment (dev/staging/production)

### ✅ 2. Validate Environment Variables

```bash
# Test your environment configuration
node scripts/validate-production-env.js

# Fix any critical issues before proceeding
```

### ✅ 3. Security Review

- [x] HTTPS enforcement enabled (`backend/server.js`)
- [x] CORS origins exclude localhost in production
- [x] Enhanced security headers configured (Helmet)
- [x] Rate limiting active on all endpoints
- [x] Input sanitization implemented
- [x] JWT tokens using secure storage (SecureStore)

---

## 🔐 Environment Variables Configuration

### Backend (Render)

Configure these environment variables in Render Dashboard → Service → Environment:

```bash
# === CRITICAL (Required) ===
NODE_ENV=production
JWT_SECRET=<64-char-secret-from-script>
JWT_REFRESH_SECRET=<64-char-secret-from-script>
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dating-app?retryWrites=true&w=majority
FRONTEND_URL=https://your-app.vercel.app

# === HIGH PRIORITY (Recommended) ===
REDIS_URL=redis://default:password@redis-host:6379
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# === SECURITY ===
CORS_ORIGIN=https://your-app.vercel.app
API_KEY=<32-char-secret-from-script>

# === JWT CONFIGURATION ===
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# === RATE LIMITING ===
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# === OPTIONAL ===
PORT=3000
LOG_LEVEL=info
```

### Frontend (Vercel)

Configure in Vercel Dashboard → Project → Settings → Environment Variables:

```bash
# API Configuration
EXPO_PUBLIC_API_URL=https://your-backend.onrender.com
EXPO_PUBLIC_WS_URL=wss://your-backend.onrender.com

# Environment
NODE_ENV=production
```

---

## 🏗️ Backend Deployment (Render)

### Initial Setup

1. **Create Render Account**
   - Visit: https://render.com
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select `dating-app` repository

3. **Configure Service**
   ```
   Name: dating-app-backend
   Region: Select closest to your users
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Starter ($7/month) or Standard
   ```

4. **Add Environment Variables**
   - Copy all variables from the section above
   - Use "Add from .env" feature if available
   - **Never paste secrets in code - use Render's secure env vars**

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Verify at: https://your-service.onrender.com/health

### Database Setup

1. **MongoDB Atlas (Recommended)**
   ```
   1. Create account: https://www.mongodb.com/cloud/atlas
   2. Create cluster (M0 Free tier for testing, M10+ for production)
   3. Configure network access (allow Render IPs)
   4. Create database user
   5. Get connection string → Add to MONGODB_URI
   ```

2. **Redis (Upstash - Free tier)**
   ```
   1. Create account: https://upstash.com
   2. Create Redis database
   3. Copy connection URL → Add to REDIS_URL
   ```

### Continuous Deployment

Render automatically deploys when you push to `main` branch:

```bash
git add .
git commit -m "Production deployment"
git push origin main
```

---

## 🎨 Frontend Deployment (Vercel)

### Initial Setup

1. **Create Vercel Account**
   - Visit: https://vercel.com
   - Sign up with GitHub

2. **Import Project**
   - Click "Add New..." → "Project"
   - Import `dating-app` repository
   - Select root directory (not backend)

3. **Configure Build Settings**
   ```
   Framework Preset: Expo
   Build Command: npm run build (or expo export:web)
   Output Directory: web-build
   Install Command: npm install
   ```

4. **Add Environment Variables**
   - Add `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WS_URL`
   - Use Production environment tab
   - Click "Deploy"

5. **Custom Domain (Optional)**
   - Go to Settings → Domains
   - Add your custom domain
   - Update DNS records as instructed

### Mobile App Build

For iOS and Android builds:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build for production
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## 🔍 Post-Deployment Verification

### 1. Health Checks

```bash
# Backend health
curl https://your-backend.onrender.com/health

# Detailed health (includes MongoDB, Redis)
curl https://your-backend.onrender.com/health/detailed
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-06T...",
  "services": {
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

### 2. Test Critical Flows

- [ ] User registration
- [ ] User login
- [ ] JWT token refresh
- [ ] Profile creation/update
- [ ] Swiping functionality
- [ ] Matching
- [ ] Real-time chat
- [ ] Push notifications

### 3. Monitor Errors

Check Sentry dashboard:
- Visit: https://sentry.io/organizations/your-org/issues/
- Verify errors are being captured
- Set up alerts for critical errors

### 4. Performance Monitoring

Monitor in Render Dashboard:
- CPU usage
- Memory usage
- Response times
- Error rates

---

## 📱 Legal Documents Deployment

### Host Privacy Policy & Terms of Service

#### Option 1: Static Hosting (Vercel)

1. **Create public directory** in your frontend project:
   ```bash
   mkdir -p public/legal
   cp PRIVACY_POLICY_TEMPLATE.html public/legal/privacy.html
   cp TERMS_OF_SERVICE_TEMPLATE.html public/legal/terms.html
   ```

2. **Update documents**:
   - Fill in company name
   - Add contact email
   - Set effective date
   - Add company address

3. **Deploy**:
   - Documents will be available at:
     - `https://your-app.vercel.app/legal/privacy.html`
     - `https://your-app.vercel.app/legal/terms.html`

#### Option 2: Dedicated Legal Pages (Recommended)

Create React Native Web pages:
```bash
src/screens/legal/PrivacyPolicyScreen.js
src/screens/legal/TermsOfServiceScreen.js
```

Add routes:
```javascript
// In navigation
<Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
<Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
```

### Link in App Settings

Update settings screen to include:
```javascript
<Button 
  title="Privacy Policy" 
  onPress={() => navigation.navigate('PrivacyPolicy')}
/>
<Button 
  title="Terms of Service" 
  onPress={() => navigation.navigate('TermsOfService')}
/>
```

---

## 🛡️ Security Best Practices

### 1. Secrets Management

- ✅ Store all secrets in platform environment variables (Render, Vercel)
- ✅ Never commit `.env` files to git
- ✅ Use different secrets for dev/staging/production
- ✅ Rotate secrets every 90 days

### 2. HTTPS Enforcement

Already implemented in `backend/server.js`:
```javascript
// Automatic HTTP → HTTPS redirect in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (!req.secure && req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}
```

### 3. Rate Limiting

Monitor rate limit headers in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704574800
```

### 4. Database Security

- Enable MongoDB IP whitelist
- Use strong database passwords
- Enable encryption at rest
- Regular backups (MongoDB Atlas automatic backups)
- Monitor slow queries

---

## 📊 Monitoring & Alerts

### Sentry Error Tracking

1. **Configure Alerts**:
   - Go to Sentry → Settings → Alerts
   - Create alert rule for critical errors
   - Set notification channels (email, Slack)

2. **Monitor Performance**:
   - Track API response times
   - Identify slow endpoints
   - Monitor memory leaks

### Uptime Monitoring

Use a service like UptimeRobot (free):
1. Add monitor for: `https://your-backend.onrender.com/health`
2. Set check interval: 5 minutes
3. Configure alerts

---

## 🔄 Rollback Procedure

If critical issues are found after deployment:

### Backend (Render)

1. Go to Render Dashboard → Your Service
2. Click "Manual Deploy" → Select previous successful build
3. Or: Revert git commit and push

```bash
git revert HEAD
git push origin main
```

### Frontend (Vercel)

1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "⋯" → "Promote to Production"

---

## 📝 Deployment Logs

### View Logs

**Render:**
```
Dashboard → Service → Logs (live tail)
```

**Vercel:**
```
Dashboard → Deployment → Runtime Logs
```

### Common Issues

| Issue | Solution |
|-------|----------|
| 503 Service Unavailable | Check MongoDB connection string |
| CORS errors | Verify FRONTEND_URL in backend env vars |
| WebSocket connection fails | Ensure WS_URL uses wss:// protocol |
| 401 Unauthorized | Check JWT_SECRET matches between backend restarts |
| Rate limit errors | Review rate limit configuration |

---

## 🎯 Production Checklist

Before announcing launch:

- [ ] All environment variables configured
- [ ] JWT secrets generated and set
- [ ] Database properly configured
- [ ] Redis connected
- [ ] Sentry error monitoring active
- [ ] Legal documents deployed and linked
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Rate limiting tested
- [ ] All critical user flows tested
- [ ] Performance benchmarks met
- [ ] Backup strategy in place
- [ ] Monitoring and alerts configured
- [ ] Support email configured
- [ ] App store submissions prepared

---

## 📞 Support & Resources

### Documentation
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [MongoDB Atlas](https://docs.atlas.mongodb.com/)
- [Sentry Docs](https://docs.sentry.io/)

### Quick Commands

```bash
# Generate secrets
node scripts/generate-jwt-secrets.js

# Validate environment
node scripts/validate-production-env.js

# Test production build locally
npm run build
npm run start:prod

# Check for security vulnerabilities
npm audit
npm audit fix
```

### Emergency Contacts

```
Backend Issues: Check Render logs first
Frontend Issues: Check Vercel deployment logs
Database Issues: Check MongoDB Atlas metrics
Security Issues: Rotate secrets immediately
```

---

## 🎉 Launch Day!

After successful deployment:

1. ✅ Announce on social media
2. ✅ Monitor error rates closely (first 24 hours)
3. ✅ Watch server metrics (CPU, memory, response times)
4. ✅ Check user feedback
5. ✅ Celebrate! 🎊

---

**Need Help?** Refer to `PRODUCTION_APP_STORE_COMPLIANCE_AUDIT.md` for detailed security compliance information.
