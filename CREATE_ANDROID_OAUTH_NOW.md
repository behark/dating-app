# 🚀 Create Android OAuth Client - Quick Guide

## Your Information (Ready to Use)

**SHA-1 Fingerprint:**

```
E0:9E:A5:79:C6:90:D8:C8:40:0D:E7:12:7C:6C:C2:21:62:E6:F0:A8
```

**Package Name:**

```
com.datingapp.app
```

**Google Cloud Project:**

```
manifest-ivy-482900-c6
```

---

## 📝 5-Minute Setup

### 1. Open Google Cloud Console

👉 **Click here:** https://console.cloud.google.com/apis/credentials?project=manifest-ivy-482900-c6

### 2. Create Credentials

1. Click **"+ CREATE CREDENTIALS"** (blue button at top)
2. Select **"OAuth client ID"**

### 3. Configure Android Client

- **Application type:** Android
- **Name:** `Dating App Android`
- **Package name:** `com.datingapp.app`
- **SHA-1:** `E0:9E:A5:79:C6:90:D8:C8:40:0D:E7:12:7C:6C:C2:21:62:E6:F0:A8`

### 4. Create & Copy

1. Click **"CREATE"**
2. Copy the Client ID (looks like: `xxxxx-xxxxx.apps.googleusercontent.com`)

### 5. Update .env File

Open `.env` and add:

```bash
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=YOUR-CLIENT-ID-HERE.apps.googleusercontent.com
```

---

## ✅ Done!

After adding the client ID to `.env`, test it:

```bash
npm run android
```

Google Sign-In should now work on Android! 🎉

---

**Need the detailed guide?** See `ANDROID_OAUTH_SETUP_INSTRUCTIONS.md`
