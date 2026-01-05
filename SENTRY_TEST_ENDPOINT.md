# Sentry Test Endpoint Setup ✅

## Status

Sentry is configured and a test endpoint has been added to verify it's working!

---

## ✅ What Was Done

### 1. Updated Sentry Configuration
- Updated `tracesSampleRate` to `1.0` (100% as per Sentry recommendation)
- Updated `profileSessionSampleRate` to `1.0` (100% as per Sentry recommendation)
- Configuration now matches Sentry's latest recommendations

### 2. Added Test Endpoint
- **Route**: `/api/test-sentry`
- **Method**: GET
- **Purpose**: Intentionally triggers an error to test Sentry integration

---

## 🧪 How to Test Sentry

### Option 1: Use the Test Endpoint

1. **Start your backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Visit the test endpoint:**
   ```
   http://localhost:3000/api/test-sentry
   ```

   Or if deployed:
   ```
   https://your-backend.onrender.com/api/test-sentry
   ```

3. **Check Sentry Dashboard:**
   - Go to: https://kabashi.sentry.io/issues/
   - You should see the test error appear within a few seconds
   - The "Waiting for error" message should disappear

### Option 2: Trigger a Real Error

Any unhandled error in your application will automatically be sent to Sentry:
- API errors (500 status codes)
- Unhandled exceptions
- Promise rejections

---

## 🔍 Verify Sentry is Working

### 1. Check Server Logs
When server starts, you should see:
```
✅ Sentry initialized with profiling
```

### 2. Check Sentry Dashboard
After visiting `/api/test-sentry`:
- Go to: https://kabashi.sentry.io/issues/
- Look for: "Test error for Sentry"
- You should see:
  - Error details
  - Stack trace
  - Request information
  - Performance data

### 3. Check Metrics
- Go to: https://kabashi.sentry.io/performance/
- Look for traces and spans
- You should see performance data

---

## 📋 Current Sentry Configuration

**File**: `backend/instrument.js`

```javascript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [nodeProfilingIntegration()],
  enableLogs: true,
  tracesSampleRate: 1.0,              // 100% of transactions
  profileSessionSampleRate: 1.0,      // 100% of sessions
  profileLifecycle: 'trace',
  sendDefaultPii: true,
});
```

**Matches Sentry's recommendations!** ✅

---

## ⚠️ Important Notes

### Environment Variable
Make sure `SENTRY_DSN` is set:
- **Local**: In `backend/.env`
- **Render**: In Render Dashboard → Environment Variables

Your DSN:
```
SENTRY_DSN=https://e21c92d839607c2d0f9378d08ca96903@o4510655194726400.ingest.de.sentry.io/4510655204687952
```

### Test Endpoint Security
⚠️ **Remove or protect the test endpoint in production!**

You can:
1. Only enable in development:
   ```javascript
   if (process.env.NODE_ENV !== 'production') {
     app.get('/api/test-sentry', ...);
   }
   ```

2. Or add authentication:
   ```javascript
   app.get('/api/test-sentry', authenticate, ...);
   ```

---

## 🎯 Next Steps

1. **Test locally:**
   ```bash
   curl http://localhost:3000/api/test-sentry
   ```

2. **Check Sentry dashboard** - error should appear

3. **Remove test endpoint** (optional) - or keep it for testing

---

## ✅ Summary

- ✅ Sentry configuration updated to match recommendations
- ✅ Test endpoint added at `/api/test-sentry`
- ✅ Ready to test and verify Sentry is working

**Visit the test endpoint to send your first error to Sentry!** 🚀
