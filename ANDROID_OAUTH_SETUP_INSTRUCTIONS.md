# Android OAuth Client Setup Instructions

## Your Debug Keystore Details ✅

**SHA-1 Fingerprint:**

```
E0:9E:A5:79:C6:90:D8:C8:40:0D:E7:12:7C:6C:C2:21:62:E6:F0:A8
```

**SHA-256 Fingerprint:**

```
06:8F:FB:CB:EA:10:0B:EC:28:29:B1:78:58:A3:0A:F6:1B:73:7E:80:65:C4:84:B6:82:E1:49:78:86:E8:70:24
```

**Keystore File:** `debug.jks` (in project root, gitignored)  
**Password:** `android`  
**Alias:** `androiddebugkey`

---

## 🎯 Create Android OAuth Client - Step by Step

### Step 1: Go to Google Cloud Console

1. Open: https://console.cloud.google.com
2. Sign in with: **Behar Enterprise** account
3. Select project: **manifest-ivy-482900-c6** (or your preferred project)

### Step 2: Navigate to Credentials

1. In the left menu, click: **APIs & Services**
2. Click: **Credentials**
3. You should see your existing web client

### Step 3: Create Android OAuth Client ID

1. Click the **"+ CREATE CREDENTIALS"** button at the top
2. Select: **OAuth client ID**
3. Application type: **Android**

### Step 4: Fill in the Form

**Name:**

```
Dating App Android
```

**Package name:**

```
com.datingapp.app
```

**SHA-1 certificate fingerprint:**

```
E0:9E:A5:79:C6:90:D8:C8:40:0D:E7:12:7C:6C:C2:21:62:E6:F0:A8
```

### Step 5: Create and Copy Client ID

1. Click **"CREATE"**
2. Copy the generated Client ID (will look like: `xxxxx-xxxxx.apps.googleusercontent.com`)
3. Keep this window open

---

## 📝 Update Your Environment Variables

After creating the Android client, update your `.env` file:

```bash
# Add this line (replace with your actual Android client ID)
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=YOUR-ANDROID-CLIENT-ID.apps.googleusercontent.com
```

**Example:**

```bash
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=250684267048-abc123xyz.apps.googleusercontent.com
```

---

## 🔄 For Production (Play Store)

When you're ready for Play Store, you'll need to create **another** Android OAuth client with the **production SHA-1**:

### Get Production SHA-1

**Option A: From Play Console (Recommended)**

1. Go to https://play.google.com/console
2. Select your app
3. Go to: **Setup > App signing**
4. Copy the **SHA-1 certificate fingerprint** for the upload key

**Option B: From EAS Build**

```bash
# After first production build
eas credentials
# Select Android > Production
# View SHA-1 fingerprint
```

### Create Production Android Client

1. Repeat the steps above in Google Cloud Console
2. Use the **production SHA-1** instead
3. Name it: "Dating App Android Production"
4. Same package: `com.datingapp.app`
5. Update `.env.production` with the production client ID

---

## ✅ Verification Checklist

After creating the Android OAuth client:

- [ ] Android OAuth client created in Google Cloud Console
- [ ] Client ID copied
- [ ] Added to `.env` as `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- [ ] Tested Google Sign-In on Android device/emulator

---

## 🧪 Test Google Sign-In on Android

```bash
# Build and run on Android
npm run android

# Or build with EAS
eas build --platform android --profile development

# Test Google Sign-In
# Should now work with your Android client ID
```

---

## 📋 Your Complete OAuth Setup

After completing the above, you'll have:

| Client Type            | Client ID           | SHA-1               | Status                   |
| ---------------------- | ------------------- | ------------------- | ------------------------ |
| **Web**                | 589309553030-...g57 | N/A                 | ✅ Configured            |
| **Android Debug**      | (to be created)     | E0:9E:A5:79:...     | ⏳ Create now            |
| **Android Production** | (create later)      | (from Play Console) | ⏳ Create for Play Store |

---

## 🚨 Common Issues

### "Sign-in failed" on Android

- Verify SHA-1 matches exactly (no extra spaces)
- Ensure package name is `com.datingapp.app`
- Wait 5-10 minutes after creating client (propagation time)

### "API not enabled"

1. Go to Google Cloud Console
2. **APIs & Services > Library**
3. Enable: **Google+ API** and **People API**
4. Wait 5 minutes

### Multiple projects confusion

- Use the same project for all clients: **manifest-ivy-482900-c6**
- This keeps everything organized in one place

---

## 📞 Need Help?

**Google Cloud Console:** https://console.cloud.google.com  
**OAuth Setup Docs:** https://developers.google.com/identity/sign-in/android/start

---

**Next Step:** Create the Android OAuth client using the instructions above, then update your `.env` file with the client ID.

**Status:** Debug keystore ready ✅ | Android OAuth client pending ⏳

_Updated: January 13, 2026_
