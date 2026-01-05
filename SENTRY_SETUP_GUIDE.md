# Sentry Setup Guide

**Date:** 2026-01-05

---

## 🎯 Quick Answers:

### 1. **Select Node.js (NOT Next.js)**

**Why Node.js?**

- Your backend is **Node.js/Express** (not Next.js)
- Your frontend is **Expo/React Native** (not Next.js)
- Next.js is a React framework for server-side rendering - you're not using it

**Select:** ✅ **Node.js** for your backend

---

### 2. **Yes, You Need the Sentry DSN (API Key)**

The DSN (Data Source Name) is like an API key that Sentry provides. You'll get it after:

1. Selecting **Node.js** as your platform
2. Following the setup instructions
3. Creating the project

The DSN looks like:

```
https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

---

## 📋 Step-by-Step Setup:

### Step 1: Select Platform in Sentry

1. On the Sentry page, click **"Node.js"** (green icon with Node.js logo)
2. **Do NOT** select Next.js (that's for Next.js apps only)

### Step 2: Follow Sentry's Setup Instructions

After selecting Node.js, Sentry will show you:

1. Installation command (you already have `@sentry/node` installed ✅)
2. Configuration code
3. **Your DSN** - copy this!

### Step 3: Add DSN to Your Backend

Add the DSN to your `backend/.env` file:

```bash
# Error Monitoring - Sentry
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

### Step 4: Restart Your Backend

```bash
cd backend && npm start
```

---

## 🔍 Current Status:

✅ **Already Installed:**

- `@sentry/node` is in your `backend/package.json`
- Sentry initialization code exists in `backend/server.js`
- Code checks for `SENTRY_DSN` environment variable

❌ **Missing:**

- `SENTRY_DSN` in your `backend/.env` file

---

## 📝 What Your Code Already Does:

Your `backend/server.js` already has Sentry setup:

```javascript
// Line 125: Initializes Sentry if DSN is provided
if (process.env.SENTRY_DSN) {
  monitoringService.initSentry(app);
}
```

So once you add the `SENTRY_DSN` to your `.env` file, Sentry will automatically start working!

---

## 🎯 Summary:

1. **Select:** ✅ **Node.js** (not Next.js)
2. **Get DSN:** Copy it from Sentry after project creation
3. **Add to `.env`:** `SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
4. **Restart backend:** It will automatically start monitoring errors

---

## 💡 Optional: Frontend Sentry (Later)

For your Expo/React Native frontend, you could set up:

- **React Native** Sentry SDK (if you want frontend error tracking)
- But for now, focus on backend error monitoring first

---

**Next Steps:** Select Node.js in Sentry, get your DSN, and add it to `backend/.env`! 🚀
