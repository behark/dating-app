# Google OAuth Setup - Behar Enterprise

Your Google OAuth clients have been configured!

---

## ✅ What's Been Set Up

### Web Client (For Google Sign-In)

- **Client ID:** `589309553030-a5mthkhatathb46k7inqdc4lq72a8g57.apps.googleusercontent.com`
- **Project ID:** `manifest-ivy-482900-c6`
- **Type:** Web application
- **Status:** ✅ Configured in `.env`

### Desktop/Mobile Client

- **Client ID:** `250684267048-fhlnak126eam5of44dbj00vu4jt72s7v.apps.googleusercontent.com`
- **Project ID:** `temporal-field-470304-e0`
- **Type:** Installed application
- **Status:** Available but not needed for Expo

---

## 📝 Current Configuration

Your `.env` file now has:

```bash
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=589309553030-a5mthkhatathb46k7inqdc4lq72a8g57.apps.googleusercontent.com
```

This is the **web client** which is correct for Expo/React Native Google Sign-In.

---

## 🚨 For Play Store: You Still Need Android Client

For Google Play Store deployment, you need to create an **Android OAuth client**:

### Step 1: Go to Google Cloud Console

1. Visit: https://console.cloud.google.com
2. Select project: **manifest-ivy-482900-c6** (or your preferred project)
3. Go to: **APIs & Services > Credentials**

### Step 2: Create Android OAuth Client

1. Click **"Create Credentials"** > **"OAuth client ID"**
2. Application type: **Android**
3. Fill in:
   - **Name:** Dating App Android
   - **Package name:** `com.datingapp.app`
   - **SHA-1 certificate fingerprint:** (see below)

### Step 3: Get SHA-1 Fingerprint

**Option A: From Play Console (Recommended)**

1. Go to https://play.google.com/console
2. Select your app
3. Go to: **Setup > App signing**
4. Copy the **SHA-1 certificate fingerprint** shown there

**Option B: From EAS (After first build)**

```bash
# After running: eas build --platform android --profile production
# EAS will show you the SHA-1 fingerprint
# Or get it from: eas credentials
```

**Option C: For local testing**

```bash
keytool -list -v -keystore ~/.android/debug.keystore \
  -alias androiddebugkey -storepass android -keypass android
```

### Step 4: Update Environment Variable

After creating the Android client, add to `.env`:

```bash
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
```

---

## 🔍 Verify Your Setup

### Test Web OAuth (Current)

```bash
# Start the app
npm start

# Test Google Sign-In on web
npm run web

# Should work with current web client ID
```

### Test Android OAuth (After creating Android client)

```bash
# Build for Android
npm run android

# Test Google Sign-In on Android device
# Will work after Android client is created
```

---

## 📋 OAuth Client Summary

| Client Type   | Client ID           | Project                  | Status        | Used For         |
| ------------- | ------------------- | ------------------------ | ------------- | ---------------- |
| **Web**       | 589309553030-...g57 | manifest-ivy-482900-c6   | ✅ Configured | Web & Expo Go    |
| **Installed** | 250684267048-...s7v | temporal-field-470304-e0 | ⚠️ Not needed | Desktop apps     |
| **Android**   | ❌ Not created yet  | TBD                      | ⏳ TODO       | Play Store build |
| **iOS**       | ❌ Not created yet  | TBD                      | ⏳ Optional   | App Store build  |

---

## 🎯 Next Steps for Play Store

1. **Create Play Console account** (if not done)
2. **Set up app signing** in Play Console
3. **Get SHA-1 fingerprint** from app signing
4. **Create Android OAuth client** with that SHA-1
5. **Add to `.env`:**
   ```bash
   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
   ```

---

## 🔐 Security Notes

**✅ Good practices:**

- Client secret files are in `.gitignore` ✅
- Never commit `.env` file ✅
- Web client ID is safe to expose (it's public) ✅

**⚠️ Important:**

- Keep `client_secret_*.json` files secure
- Don't share client secrets publicly
- Android/iOS client IDs don't have secrets (safe to expose)

---

## 🆘 Troubleshooting

### Google Sign-In not working on web?

- Verify web client ID is correct in `.env`
- Check Firebase console has Google auth enabled
- Clear browser cache and try again

### Google Sign-In not working on Android?

- You need to create Android OAuth client first
- SHA-1 must match your app signing certificate
- Package name must be `com.datingapp.app`

### "API not enabled" error?

1. Go to Google Cloud Console
2. Enable: **Google+ API** and **People API**
3. Wait 5 minutes and try again

---

## 📚 Documentation

- **Google Cloud Console:** https://console.cloud.google.com
- **Expo Google Sign-In:** https://docs.expo.dev/guides/google-authentication/
- **Firebase Auth:** https://firebase.google.com/docs/auth

---

**Status:** Web OAuth configured ✅  
**Next:** Create Android OAuth client for Play Store  
**Updated:** January 13, 2026
