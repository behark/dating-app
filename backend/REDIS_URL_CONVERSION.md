# Redis URL Conversion Guide

## Your Redis Connection Details

From your code example:

- **Host**: `redis-18372.c99.us-east-1-4.ec2.cloud.redislabs.com`
- **Port**: `18372`
- **Username**: `default`
- **Password**: `pPjl1LpcwRC3hw9iIm5Ku3deXgTLGA0A`

## ⚠️ Important Note

Your example uses the `redis` package:

```javascript
import { createClient } from 'redis'; // Different package!
```

But your project uses `ioredis`:

```javascript
const Redis = require('ioredis'); // This is what you're using
```

Both work, but `ioredis` is what's configured in your project.

---

## ✅ Convert to REDIS_URL Format

For `ioredis`, use this format:

```
redis://[username]:[password]@[host]:[port]
```

### Your REDIS_URL:

```bash
REDIS_URL=redis://default:pPjl1LpcwRC3hw9iIm5Ku3deXgTLGA0A@redis-18372.c99.us-east-1-4.ec2.cloud.redislabs.com:18372
```

---

## 🔒 Security Warning

**⚠️ DO NOT commit this password to Git!**

The password `pPjl1LpcwRC3hw9iIm5Ku3deXgTLGA0A` should be:

- ✅ Set in environment variables
- ✅ Stored in `.env` file (which is in `.gitignore`)
- ❌ Never committed to Git
- ❌ Never hardcoded in source code

---

## 📝 How to Configure

### Option 1: Environment Variable (Recommended)

#### For Local Development:

Add to `backend/.env`:

```bash
REDIS_URL=redis://default:pPjl1LpcwRC3hw9iIm5Ku3deXgTLGA0A@redis-18372.c99.us-east-1-4.ec2.cloud.redislabs.com:18372
```

#### For Production (Render.com):

1. Go to your Render dashboard
2. Select your service
3. Environment → Add Environment Variable
4. Key: `REDIS_URL`
5. Value: `redis://default:pPjl1LpcwRC3hw9iIm5Ku3deXgTLGA0A@redis-18372.c99.us-east-1-4.ec2.cloud.redislabs.com:18372`
6. Save

#### For Docker:

Add to `docker-compose.yml`:

```yaml
environment:
  - REDIS_URL=redis://default:pPjl1LpcwRC3hw9iIm5Ku3deXgTLGA0A@redis-18372.c99.us-east-1-4.ec2.cloud.redislabs.com:18372
```

---

## 🧪 Test the Connection

### Test 1: Using Node.js

```javascript
const Redis = require('ioredis');

const redis = new Redis(
  'redis://default:pPjl1LpcwRC3hw9iIm5Ku3deXgTLGA0A@redis-18372.c99.us-east-1-4.ec2.cloud.redislabs.com:18372'
);

redis.on('connect', () => {
  console.log('✅ Redis connected!');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

// Test
redis
  .set('test', 'hello')
  .then(() => {
    return redis.get('test');
  })
  .then((result) => {
    console.log('Result:', result); // Should print: hello
    redis.quit();
  });
```

### Test 2: Using redis-cli

```bash
redis-cli -h redis-18372.c99.us-east-1-4.ec2.cloud.redislabs.com -p 18372 -a pPjl1LpcwRC3hw9iIm5Ku3deXgTLGA0A
```

### Test 3: Check in Your App

When your server starts, you should see:

```
Redis connecting...
Redis connected and ready
```

---

## 🔄 Alternative: Individual Settings

If you prefer not to use REDIS_URL, you can set individual variables:

```bash
REDIS_HOST=redis-18372.c99.us-east-1-4.ec2.cloud.redislabs.com
REDIS_PORT=18372
REDIS_USERNAME=default
REDIS_PASSWORD=pPjl1LpcwRC3hw9iIm5Ku3deXgTLGA0A
```

However, your current `config/redis.js` only checks for `REDIS_URL` or uses defaults. You'd need to update it to support username separately.

---

## ✅ Quick Setup Steps

1. **Add to `.env` file** (local development):

   ```bash
   REDIS_URL=redis://default:pPjl1LpcwRC3hw9iIm5Ku3deXgTLGA0A@redis-18372.c99.us-east-1-4.ec2.cloud.redislabs.com:18372
   ```

2. **Add to Render.com** (production):
   - Dashboard → Your Service → Environment
   - Add `REDIS_URL` with the same value

3. **Restart your server**:

   ```bash
   npm start
   ```

4. **Check logs** for:
   ```
   Redis connecting...
   Redis connected and ready
   ```

---

## 🎯 Summary

- ✅ Yes, this is a real Redis URL from Redis Labs
- ✅ Converted format: `redis://default:pPjl1LpcwRC3hw9iIm5Ku3deXgTLGA0A@redis-18372.c99.us-east-1-4.ec2.cloud.redislabs.com:18372`
- ✅ Set as `REDIS_URL` environment variable
- ⚠️ Keep password secret (never commit to Git)
