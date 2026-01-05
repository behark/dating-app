# Redis Setup Guide

## 🧪 Testing (Mock Redis)

**The mock is ONLY used during Jest tests** - it will NOT be used in production.

### How it works:
- `backend/__tests__/setup.js` - Mocks `ioredis` with `ioredis-mock`
- This file is ONLY loaded when Jest runs (`jest.config.js` → `setupFilesAfterEnv`)
- When you run `npm test`, Jest loads the setup file and mocks Redis
- **When you run `npm start` or deploy, Jest is NOT running, so the mock is NOT used**

### Verification:
```bash
# This uses the mock (Jest runs setup.js)
npm test

# This uses REAL Redis (Jest is not running)
npm start
```

---

## 🚀 Production (Real Redis)

**Production uses the REAL `ioredis` library** from `backend/config/redis.js`.

### Configuration Options:

#### Option 1: Redis URL (Recommended for Cloud)
Set in your environment variables:
```bash
REDIS_URL=redis://your-redis-host:6379
# Or with password:
REDIS_URL=redis://:password@your-redis-host:6379
# Or TLS:
REDIS_URL=rediss://:password@your-redis-host:6380
```

#### Option 2: Individual Settings
```bash
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your_password  # Optional
REDIS_DB=0  # Optional
```

### Where to Set Environment Variables:

#### Render.com:
1. Go to your service dashboard
2. Environment → Add Environment Variable
3. Add `REDIS_URL` or individual Redis settings

#### Docker:
Add to `docker-compose.yml` or your Dockerfile:
```yaml
environment:
  - REDIS_URL=redis://redis:6379
```

#### Local Development:
Add to `backend/.env`:
```bash
REDIS_URL=redis://localhost:6379
```

---

## ✅ How to Verify Production Uses Real Redis

### Check 1: Look at the code
- `backend/config/redis.js` line 6: `const Redis = require('ioredis');`
- This is the REAL library, not the mock
- The mock is only in `__tests__/setup.js` which is NOT imported in production code

### Check 2: Check server logs
When your server starts, you should see:
```
Redis connecting...
Redis connected and ready
```

If Redis is not available, you'll see:
```
Redis error: connect ECONNREFUSED 127.0.0.1:6379
```

### Check 3: Test the connection
The app will work without Redis, but these features won't work:
- ❌ Caching (slower responses)
- ❌ Rate limiting (may fail)
- ❌ Job queues (background jobs won't process)
- ❌ Online status tracking
- ❌ Real-time features

---

## 🔧 Quick Setup for Production

### For Render.com:
1. Create a Redis instance (Upstash, Redis Cloud, or Render's Redis)
2. Get the connection URL
3. Add to Render environment variables: `REDIS_URL=redis://...`

### For Docker:
```bash
docker-compose -f docker-compose.full.yml up redis -d
```

### For Local Testing:
```bash
# Install Redis
sudo apt-get install redis-server  # Ubuntu/Debian
brew install redis                  # macOS

# Start Redis
sudo systemctl start redis-server  # Linux
brew services start redis           # macOS
```

---

## 📝 Summary

| Environment | Redis Used | Configuration |
|------------|------------|---------------|
| **Jest Tests** | Mock (`ioredis-mock`) | Automatic via `setup.js` |
| **Development** | Real Redis (if available) | Set `REDIS_URL` or use defaults |
| **Production** | Real Redis (required) | Set `REDIS_URL` in environment |

**You don't need to "fix" anything** - the mock is automatically only used in tests. Just configure a real Redis instance for production!
