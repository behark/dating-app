# Render Port Connection Issue - Fix

## The Problem

If you saw logs saying the deployment couldn't connect to the port, it's likely because:

1. **Render automatically sets PORT** - but sometimes it needs to be explicitly in environment variables
2. **Server needs to listen on 0.0.0.0** - not just the default (which might be localhost)

## The Solution

### Option 1: Add PORT explicitly in Render Dashboard (Recommended)

Even though PORT is in `render.yaml`, sometimes Render needs it explicitly set in the dashboard:

**Add this in Render Dashboard → Environment:**
```
PORT=10000
```

### Option 2: Update server.js to listen on 0.0.0.0

The server should listen on all interfaces, not just localhost. Check if `server.listen` needs to be updated:

**Current code (line 768):**
```javascript
server.listen(PORT, () => {
```

**Should be:**
```javascript
server.listen(PORT, '0.0.0.0', () => {
```

This ensures the server listens on all network interfaces, which Render requires.

## Why This Happens

- Render's load balancer needs to connect to your app
- If the server only listens on `localhost` or `127.0.0.1`, Render can't reach it
- Listening on `0.0.0.0` makes it accessible from outside the container

## Quick Fix

1. **Add PORT=10000 in Render Dashboard** (even though it's in render.yaml)
2. **Or update server.js** to explicitly listen on `0.0.0.0`

Both should work, but doing both is safest.
