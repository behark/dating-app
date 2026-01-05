# Render Deployment Checklist for Backend

## ✅ What You Already Have

### 1. **Render CLI Installed** ✓

- Render CLI version 2.6.1 is installed at `/home/behar/.local/bin/render`
- You can deploy via CLI

### 2. **Render Blueprint Configuration** ✓

- `render.yaml` exists in the root directory
- Configured for Node.js runtime
- Health check endpoint configured (`/health`)
- Root directory set to `backend`
- Build and start commands configured

### 3. **Backend Structure** ✓

- `backend/server.js` exists and is properly configured
- `backend/package.json` has `start` script: `node server.js`
- Health endpoint exists at `/health`
- Server listens on `process.env.PORT` (defaults to 3000, but Render will set it)

### 4. **Node.js Configuration** ✓

- `package.json` specifies Node.js >= 18.0.0
- All dependencies are listed in `package.json`

## ⚠️ What You Need to Check/Configure

### 1. **Render Account & Authentication**

```bash
# Check if you're logged in to Render
render whoami

# If not logged in, login:
render login
```

### 2. **Required Environment Variables**

Your `render.yaml` has some environment variables, but you'll need to set these **manually in Render Dashboard** (marked with `sync: false` or missing):

#### **Critical - Must Set Manually:**

- ✅ `MONGODB_URI` - Your MongoDB connection string (marked as `sync: false` in render.yaml)
- ✅ `JWT_SECRET` - Will be auto-generated (marked as `generateValue: true`)
- ✅ `ENCRYPTION_KEY` - Will be auto-generated (marked as `generateValue: true`)

#### **Additional Required Variables** (from `.env.example`):

You should add these to your Render service environment variables:

**Database & Cache:**

- `REDIS_HOST` - Redis host (or use `REDIS_URL` if using Redis Cloud/Upstash)
- `REDIS_PORT` - Redis port (default: 6379)
- `REDIS_PASSWORD` - Redis password (if required)
- `REDIS_DB` - Redis database number (default: 0)
- `REDIS_QUEUE_DB` - Redis queue database (default: 1)

**OAuth Providers:**

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `FACEBOOK_APP_ID` (if using)
- `FACEBOOK_APP_SECRET` (if using)

**File Storage:**

- `STORAGE_PROVIDER` - Either 's3' or 'cloudinary'
- `CLOUDINARY_CLOUD_NAME` (if using Cloudinary)
- `CLOUDINARY_API_KEY` (if using Cloudinary)
- `CLOUDINARY_API_SECRET` (if using Cloudinary)
- `AWS_ACCESS_KEY_ID` (if using S3)
- `AWS_SECRET_ACCESS_KEY` (if using S3)
- `AWS_REGION` (if using S3)
- `AWS_S3_BUCKET` (if using S3)
- `CDN_URL` - Your CDN URL

**Firebase:**

- `FIREBASE_PROJECT_ID` - Already in render.yaml ✓
- `FIREBASE_PRIVATE_KEY_ID`
- `FIREBASE_PRIVATE_KEY` - Full private key with newlines
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_CLIENT_ID`

**Other Services:**

- `OPENAI_API_KEY` (if using AI features)
- `TWILIO_ACCOUNT_SID` (if using phone verification)
- `TWILIO_AUTH_TOKEN` (if using phone verification)
- `TWILIO_PHONE_NUMBER` (if using phone verification)
- `SENTRY_DSN` (if using error tracking)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (if using email)
- `EXPO_ACCESS_TOKEN` (if using Expo push notifications)

**Security:**

- `CORS_ORIGIN` - Already in render.yaml ✓ (update if your frontend URL changes)

### 3. **Update render.yaml (Optional Improvements)**

Your current `render.yaml` is good, but you might want to:

1. **Update PORT**: Render automatically sets PORT, so you don't need to hardcode it to 10000. However, if you want to keep it, that's fine.

2. **Add Redis Service** (if you need Redis):

```yaml
services:
  - type: redis
    name: dating-app-redis
    plan: free
    maxmemoryPolicy: allkeys-lru
```

3. **Add PostgreSQL** (if you want to use it instead of MongoDB):

```yaml
services:
  - type: pspg
    name: dating-app-db
    plan: free
```

### 4. **Verify Health Check Endpoint**

Your health check is at `/health` which matches `render.yaml`. ✓

## 🚀 Deployment Steps

### Option 1: Deploy via Render CLI

```bash
# 1. Make sure you're logged in
render login

# 2. Deploy from the project root
cd /home/behar/dating-app
render blueprint launch

# OR deploy a specific service
render services create --name dating-app-backend \
  --type web \
  --runtime node \
  --region oregon \
  --plan free \
  --root-dir backend \
  --build-command "npm install" \
  --start-command "npm start" \
  --health-check-path "/health"
```

### Option 2: Deploy via Render Dashboard (Using Blueprint)

1. Go to https://dashboard.render.com
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Render will detect `render.yaml` and create services
5. Set environment variables in the dashboard

## 📋 Pre-Deployment Checklist

- [ ] Render CLI installed ✓
- [ ] Logged in to Render (`render login`)
- [ ] MongoDB URI ready (MongoDB Atlas or other)
- [ ] Redis configured (if needed)
- [ ] All environment variables documented
- [ ] Firebase credentials ready
- [ ] Storage provider configured (Cloudinary/S3)
- [ ] CORS_ORIGIN updated to your frontend URL
- [ ] Health check endpoint working locally
- [ ] `npm start` works locally in backend directory

## 🔍 Verify Deployment

After deployment:

1. **Check Health Endpoint:**

```bash
curl https://your-service.onrender.com/health
```

2. **Check Logs:**

```bash
render logs --service dating-app-backend
```

3. **Check Service Status:**

```bash
render services list
```

## ⚠️ Important Notes

1. **Free Tier Limitations:**
   - Services spin down after 15 minutes of inactivity
   - First request after spin-down may take 30-60 seconds
   - Consider upgrading to paid plan for production

2. **Environment Variables:**
   - Sensitive variables (MONGODB_URI, API keys) should be set in dashboard, not in render.yaml
   - Use `sync: false` for sensitive data in render.yaml

3. **Port Configuration:**
   - Render automatically sets `PORT` environment variable
   - Your server.js already uses `process.env.PORT || 3000` ✓

4. **Build Time:**
   - First deployment may take 5-10 minutes
   - Subsequent deployments are faster

5. **Database:**
   - You'll need MongoDB Atlas or another MongoDB service
   - Render doesn't provide MongoDB on free tier

## 🐛 Troubleshooting

### Service won't start:

- Check logs: `render logs --service dating-app-backend`
- Verify all required environment variables are set
- Check that MongoDB URI is correct and accessible

### Health check fails:

- Verify `/health` endpoint works locally
- Check that server is listening on the correct port
- Ensure database connections are working

### Build fails:

- Check Node.js version compatibility
- Verify all dependencies in package.json
- Check build logs in Render dashboard

## 📝 Next Steps

1. **Set up MongoDB Atlas** (if not already done)
2. **Set up Redis** (Upstash free tier or Render Redis service)
3. **Configure all environment variables** in Render dashboard
4. **Deploy using CLI or Dashboard**
5. **Test the health endpoint**
6. **Update frontend** to use new backend URL

---

**Status**: You have most of what you need! Just need to:

1. Log in to Render CLI
2. Set up environment variables
3. Deploy!
