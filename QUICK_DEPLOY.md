# 🚀 Quick Deployment Checklist

## ✅ YOUR PROJECT IS READY TO DEPLOY!

All critical security issues have been fixed. You just need to provide environment variables.

---

## 📝 WHAT YOU NEED

### 🔴 BACKEND (Render) - 5 CRITICAL VARIABLES

Generate these first:

```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('HASH_SALT=' + require('crypto').randomBytes(32).toString('hex'))"
```

Then add to Render:

```
JWT_SECRET=<generated-value>
JWT_REFRESH_SECRET=<generated-value>
HASH_SALT=<generated-value>
MONGODB_URI=<mongodb-atlas-connection-string>
NODE_ENV=production
```

### 🔴 FRONTEND (Vercel) - 7 FIREBASE VARIABLES

Get from Firebase Console → Project Settings → Your apps → Web app:

```
EXPO_PUBLIC_FIREBASE_API_KEY=<firebase-api-key>
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=<project-id>
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=<project>.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
EXPO_PUBLIC_FIREBASE_APP_ID=<app-id>
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<google-client-id>
```

After backend deploys, add:

```
EXPO_PUBLIC_API_URL=<your-render-backend-url>
```

---

## 🎯 DEPLOYMENT STEPS

### 1️⃣ Create External Services (15 min)

- [ ] **MongoDB Atlas:** Create free cluster → Get connection string
  - https://www.mongodb.com/cloud/atlas
  - Whitelist all IPs (0.0.0.0/0)
- [ ] **Firebase:** Create project → Enable Auth → Get config
  - https://console.firebase.google.com/
  - Enable Email/Password and Google sign-in

### 2️⃣ Deploy Backend to Render (5 min)

- [ ] Go to https://dashboard.render.com/
- [ ] Click "New" → "Blueprint"
- [ ] Connect GitHub repo
- [ ] **Add critical environment variables** (JWT_SECRET, etc.)
- [ ] Click "Apply"
- [ ] Wait for deployment (~3-5 min)
- [ ] **Copy your backend URL** (e.g., https://dating-app-backend-xxx.onrender.com)

### 3️⃣ Deploy Frontend to Vercel (5 min)

- [ ] Go to https://vercel.com/dashboard
- [ ] Click "Add New" → "Project"
- [ ] Import GitHub repo
- [ ] **Add all Firebase environment variables**
- [ ] **Add EXPO_PUBLIC_API_URL** (your Render backend URL)
- [ ] Click "Deploy"
- [ ] Wait for deployment (~2-3 min)
- [ ] **Copy your Vercel URL** (e.g., https://your-app.vercel.app)

### 4️⃣ Update Backend CORS (2 min)

- [ ] Go back to Render dashboard
- [ ] Add/update these variables:
  ```
  FRONTEND_URL=<your-vercel-url>
  CORS_ORIGIN=<your-vercel-url>
  ```
- [ ] Save and wait for backend to restart

### 5️⃣ Test Everything (5 min)

- [ ] Open your Vercel app
- [ ] Try signing up with email/password
- [ ] Try logging in
- [ ] Check browser console for errors (F12)
- [ ] Check Render logs for backend errors

---

## 🎉 DONE!

Your app should be live and working!

**Total Time:** ~30 minutes

---

## 📋 ENVIRONMENT VARIABLES SUMMARY

### Backend (Render) - MINIMUM

| Variable             | Required | Generate With                                                              |
| -------------------- | -------- | -------------------------------------------------------------------------- |
| `JWT_SECRET`         | ✅ YES   | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | ✅ YES   | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `HASH_SALT`          | ✅ YES   | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `MONGODB_URI`        | ✅ YES   | MongoDB Atlas                                                              |
| `NODE_ENV`           | ✅ YES   | `production`                                                               |
| `FRONTEND_URL`       | ⚠️ YES   | Your Vercel URL                                                            |
| `CORS_ORIGIN`        | ⚠️ YES   | Your Vercel URL                                                            |

### Frontend (Vercel) - MINIMUM

| Variable                                   | Required    | Get From                |
| ------------------------------------------ | ----------- | ----------------------- |
| `EXPO_PUBLIC_API_URL`                      | ✅ YES      | Your Render backend URL |
| `EXPO_PUBLIC_FIREBASE_API_KEY`             | ✅ YES      | Firebase Console        |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`         | ✅ YES      | Firebase Console        |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID`          | ✅ YES      | Firebase Console        |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`      | ✅ YES      | Firebase Console        |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ✅ YES      | Firebase Console        |
| `EXPO_PUBLIC_FIREBASE_APP_ID`              | ✅ YES      | Firebase Console        |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`         | ⚠️ Optional | Google Cloud Console    |

---

## 🐛 Quick Troubleshooting

**Backend won't start:**

- Check Render logs for "JWT_SECRET is not set" error
- Verify all critical variables are added

**Frontend can't connect:**

- Check CORS error in browser console
- Verify FRONTEND_URL matches Vercel URL
- Verify EXPO_PUBLIC_API_URL matches Render URL

**Firebase errors:**

- Verify all 6 Firebase variables are set
- Check Firebase Console → Authentication is enabled

---

## 📚 Full Documentation

- **Detailed Guide:** `DEPLOYMENT_GUIDE.md`
- **Security Report:** `CRITICAL_ISSUES_REPORT.md`
- **Fixes Applied:** `SECURITY_FIXES_SUMMARY.md`

---

**Need help?** Open an issue or check the logs:

- **Backend logs:** Render Dashboard → Your Service → Logs
- **Frontend logs:** Browser Console (F12)
