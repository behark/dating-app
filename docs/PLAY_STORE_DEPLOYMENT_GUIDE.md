# Play Store Deployment Guide

Complete step-by-step guide to deploy your dating app to Google Play Store.

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] Google Play Console account ($25 one-time registration fee)
- [ ] Google Cloud Console project (same as Firebase project)
- [ ] Backend deployed and running (Render/Railway/Heroku)
- [ ] Privacy Policy and Terms of Service hosted publicly
- [ ] App tested on physical Android device
- [ ] All required environment variables configured

---

## Phase 1: Legal & Compliance Setup (2-3 hours)

### Step 1: Host Legal Documents

Your legal documents are already created in `/public`:

- `privacy-policy.html`
- `terms-of-service.html`

**Deploy these to a public URL:**

#### Option A: Deploy with Vercel (Recommended)

```bash
cd /home/behar/dating-app
vercel --prod
```

Your documents will be available at:

- `https://your-app.vercel.app/privacy-policy.html`
- `https://your-app.vercel.app/terms-of-service.html`

#### Option B: Use GitHub Pages

```bash
# Push public folder to gh-pages branch
git subtree push --prefix public origin gh-pages
```

Documents available at:

- `https://your-username.github.io/dating-app/privacy-policy.html`

#### Option C: Use Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy public folder
cd public
netlify deploy --prod
```

### Step 2: Update Legal URLs

After hosting, update `.env`:

```bash
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://your-domain.com/privacy-policy.html
EXPO_PUBLIC_TERMS_OF_SERVICE_URL=https://your-domain.com/terms-of-service.html
EXPO_PUBLIC_SUPPORT_EMAIL=support@your-domain.com
EXPO_PUBLIC_PRIVACY_EMAIL=privacy@your-domain.com
```

### Step 3: Customize Legal Documents

Edit the HTML files to replace placeholders:

- `[Your Company Name]` → Your actual company name
- `[Your Company Address]` → Your actual address
- `[Your Jurisdiction]` → Your state/country
- `support@your-dating-app.com` → Your actual support email

---

## Phase 2: Google Play Console Setup (1-2 hours)

### Step 1: Create Play Console Account

1. Go to https://play.google.com/console
2. Sign in with your Google account
3. Pay $25 one-time registration fee
4. Complete developer profile:
   - Developer name
   - Email address
   - Phone number
   - Website (optional)

### Step 2: Create App

1. Click **"Create app"**
2. Fill in details:
   - **App name:** Dating App (or your chosen name)
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free (with in-app purchases)
3. Accept declarations:
   - [ ] App follows Play policies
   - [ ] App complies with US export laws
4. Click **"Create app"**

### Step 3: Set Up App Signing

**Option A: Let Google Play manage signing (Recommended)**

1. Go to **Setup > App signing**
2. Click **"Continue"** to let Google manage your signing key
3. Google will generate and secure your keys

**Option B: Use your own signing key**

```bash
# Generate upload key
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore upload-keystore.jks \
  -alias upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Save the keystore file securely
# Note the passwords - you'll need them for EAS
```

### Step 4: Create Service Account for EAS

1. Go to **Setup > API access**
2. Click **"Create new service account"**
3. Follow link to Google Cloud Console
4. In Cloud Console:
   - Click **"Create Service Account"**
   - Name: `eas-deploy`
   - Role: **Service Account User**
   - Click **"Done"**
5. Click on the service account
6. Go to **"Keys"** tab
7. Click **"Add Key"** > **"Create new key"**
8. Choose **JSON** format
9. Download the JSON file
10. Save as `google-service-account.json` in project root

⚠️ **IMPORTANT:** Add to `.gitignore`:

```bash
echo "google-service-account.json" >> .gitignore
```

11. Back in Play Console, grant access:
    - Go to **Setup > API access**
    - Find your service account
    - Click **"Grant access"**
    - Permissions: **Admin (all permissions)**
    - Click **"Invite user"**

---

## Phase 3: Google OAuth Setup (30 minutes)

### Step 1: Configure Android OAuth Client

1. Go to https://console.cloud.google.com
2. Select your Firebase project
3. Go to **APIs & Services > Credentials**
4. Click **"Create Credentials"** > **"OAuth client ID"**
5. Application type: **Android**
6. Fill in:
   - **Name:** Dating App Android
   - **Package name:** `com.datingapp.app`
   - **SHA-1 certificate fingerprint:** (see below)

### Step 2: Get SHA-1 Fingerprint

**For Google Play App Signing:**

```bash
# After setting up app signing in Play Console
# Go to Setup > App signing
# Copy the SHA-1 certificate fingerprint shown there
```

**For local testing:**

```bash
# Get SHA-1 from debug keystore
keytool -list -v -keystore ~/.android/debug.keystore \
  -alias androiddebugkey -storepass android -keypass android
```

### Step 3: Update Environment Variables

Copy the OAuth client ID:

```bash
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
```

---

## Phase 4: Store Listing (2-3 hours)

### Step 1: App Details

Go to **Store presence > Main store listing**

**App name:** Dating App (or your chosen name)

**Short description** (80 characters max):

```
Find meaningful connections with people near you
```

**Full description** (4000 characters max):

```
Dating App helps you meet new people and find meaningful connections.

KEY FEATURES:
• Smart Matching - Swipe through profiles of people near you
• Real-time Chat - Message your matches instantly
• Profile Verification - Feel safe with verified profiles
• Location-based - Find people in your area
• Privacy First - Your data is secure and private

HOW IT WORKS:
1. Create your profile with photos and bio
2. Set your preferences (age, distance, interests)
3. Swipe right on people you like
4. Match when they swipe right on you too
5. Start chatting and get to know each other

SAFETY FEATURES:
• Report and block users
• Photo verification
• In-app safety tips
• 24/7 support team

PREMIUM FEATURES:
• Unlimited swipes
• See who liked you
• Rewind accidental swipes
• Boost your profile visibility
• Advanced filters

Join thousands of people finding connections on Dating App!

Age requirement: 18+
```

**App icon:** Upload `assets/icon.png` (512x512 PNG)

**Feature graphic:** Create 1024x500 image (see Assets section below)

### Step 2: Screenshots

**Required:** At least 2 screenshots for phone

**Recommended:**

- 4-8 phone screenshots (1080x1920 or 1080x2340)
- 2-4 tablet screenshots (1920x1080 or 2560x1440)

**Screenshot ideas:**

1. Profile browsing/swiping screen
2. Match notification
3. Chat conversation
4. Profile editing screen
5. Matches list
6. Settings screen

**How to capture:**

```bash
# Run app on Android device/emulator
npm run android

# Take screenshots using:
# - Device screenshot button
# - Android Studio Device File Explorer
# - adb shell screencap -p /sdcard/screenshot.png
```

### Step 3: Categorization

- **App category:** Dating
- **Tags:** dating, social, relationships, chat, meet people
- **Content rating:** Complete questionnaire (see below)

### Step 4: Contact Details

- **Email:** support@your-domain.com
- **Phone:** (optional)
- **Website:** https://your-domain.com
- **Privacy Policy URL:** https://your-domain.com/privacy-policy.html

---

## Phase 5: Content Rating (30 minutes)

Go to **Policy > App content > Content rating**

### Complete IARC Questionnaire

**App category:** Dating

**Key questions:**

1. **Does your app contain violence?** No
2. **Does your app contain sexual content?** Mild (dating context)
3. **Does your app contain nudity?** No (enforce in moderation)
4. **Does your app contain profanity?** No (moderated chat)
5. **Does your app contain drug/alcohol references?** No
6. **Does your app allow users to interact?** Yes
7. **Does your app share user location?** Yes (approximate)
8. **Does your app allow purchases?** Yes (in-app purchases)

**Expected rating:** Mature 17+ / PEGI 18

---

## Phase 6: Data Safety (1 hour)

Go to **Policy > App content > Data safety**

### Data Collection

**Personal Info:**

- ✅ Name (Required for app functionality)
- ✅ Email address (Required for app functionality)
- ✅ User IDs (Required for app functionality)
- ✅ Photos (Required for app functionality)
- ✅ Date of birth (Required for app functionality)

**Location:**

- ✅ Approximate location (Required for app functionality)
- ❌ Precise location (Not collected)

**App Activity:**

- ✅ App interactions (Analytics)
- ✅ In-app search history (App functionality)
- ✅ Other user-generated content (App functionality)

**Messages:**

- ✅ Emails (App functionality)
- ✅ Other in-app messages (App functionality)

### Data Usage

**Purpose:**

- App functionality (matching, messaging)
- Analytics
- Developer communications
- Fraud prevention and security

### Data Sharing

**Do you share data with third parties?** Yes

**Third parties:**

- Analytics providers (Firebase Analytics)
- Cloud storage (MongoDB Atlas)
- Error tracking (Sentry)
- Authentication (Google OAuth)

**Data shared:**

- User interactions (Analytics)
- Error logs (Sentry)
- Authentication tokens (Google)

### Security Practices

- ✅ Data encrypted in transit (TLS 1.2+)
- ✅ Data encrypted at rest (MongoDB encryption)
- ✅ Users can request data deletion
- ✅ Committed to Google Play Families Policy (No - 18+ only)

---

## Phase 7: Build & Test (1-2 hours)

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

### Step 2: Configure EAS Build

Your `eas.json` is already configured. Verify production profile:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle",
        "autoIncrement": "versionCode"
      }
    }
  }
}
```

### Step 3: Set Environment Variables

Create `.env.production`:

```bash
cp .env.playstore .env.production
# Edit and fill in all values
```

### Step 4: Build Production AAB

```bash
# Build Android App Bundle for Play Store
eas build --platform android --profile production

# This will:
# 1. Upload your code to EAS servers
# 2. Build the app bundle (.aab)
# 3. Sign it with your credentials
# 4. Provide download link (takes 10-20 minutes)
```

### Step 5: Download and Test

```bash
# Download the .aab file from EAS dashboard
# Or use the provided link

# Test on device using bundletool:
bundletool build-apks --bundle=app.aab --output=app.apks
bundletool install-apks --apks=app.apks
```

### Step 6: Internal Testing

1. Go to **Testing > Internal testing**
2. Click **"Create new release"**
3. Upload your `.aab` file
4. Add release notes
5. Click **"Save"** then **"Review release"**
6. Click **"Start rollout to Internal testing"**
7. Add testers (email addresses)
8. Test thoroughly:
   - Sign up flow
   - Profile creation
   - Swiping/matching
   - Chat messaging
   - In-app purchases
   - Push notifications
   - All major features

---

## Phase 8: Production Release (30 minutes)

### Step 1: Complete All Policy Requirements

Go through each section in Play Console:

**Policy > App content:**

- [x] Content rating
- [x] Data safety
- [x] Privacy policy
- [x] App access (provide test account if needed)
- [x] Ads (declare if you show ads)
- [x] Target audience (18+)
- [x] News apps (No)
- [x] COVID-19 contact tracing (No)
- [x] Data safety (completed above)

### Step 2: Set Up Countries

**Production > Countries/regions:**

- Select countries where you want to distribute
- Consider starting with: US, UK, Canada, Australia
- Can expand later

### Step 3: Pricing

**Production > In-app products:**

1. Create subscription products:
   - Premium Monthly ($9.99/month)
   - Premium Yearly ($79.99/year)
2. Set prices for each country
3. Activate products

### Step 4: Create Production Release

1. Go to **Production > Releases**
2. Click **"Create new release"**
3. Upload your `.aab` file (same one from internal testing)
4. Add release notes:

```
Initial release of Dating App!

Features:
• Smart matching algorithm
• Real-time chat
• Profile verification
• Location-based matching
• Premium subscriptions

We're excited to help you find meaningful connections!
```

5. Click **"Save"** then **"Review release"**

### Step 5: Submit for Review

1. Review all sections - ensure no warnings
2. Click **"Start rollout to Production"**
3. Confirm submission

**Review timeline:** 1-7 days (usually 1-3 days)

---

## Phase 9: Post-Submission

### Monitor Review Status

Check Play Console daily for:

- Review status updates
- Reviewer questions
- Policy violation warnings

### Prepare for Rejection (Common Issues)

If rejected, common reasons:

1. **Privacy policy missing/incomplete** - Ensure URL is accessible
2. **Content rating mismatch** - Review questionnaire answers
3. **Permissions not justified** - Explain why you need each permission
4. **Screenshots misleading** - Ensure screenshots match actual app
5. **Test account needed** - Provide working credentials

### After Approval

1. **Monitor crashes:** Check Play Console > Quality > Crashes
2. **Watch reviews:** Respond to user reviews promptly
3. **Track metrics:** Monitor installs, retention, ratings
4. **Plan updates:** Regular updates improve ranking

---

## Quick Reference Commands

```bash
# Build for Play Store
eas build --platform android --profile production

# Submit to Play Store (after manual review)
eas submit --platform android --latest

# Check build status
eas build:list

# View build logs
eas build:view [build-id]

# Update app version
# Edit app.config.js: version and versionCode
# Then rebuild

# Generate new build
eas build --platform android --profile production --clear-cache
```

---

## Troubleshooting

### Build Fails

**Error: Missing credentials**

```bash
# Configure credentials
eas credentials
# Select Android > production
# Choose "Set up new credentials"
```

**Error: Gradle build failed**

```bash
# Clear cache and rebuild
eas build --platform android --profile production --clear-cache
```

### Upload Fails

**Error: Version code must be higher**

- Increment `versionCode` in `app.config.js`
- Rebuild

**Error: APK/AAB signature mismatch**

- Ensure you're using same signing key
- Check EAS credentials match Play Console

### Review Rejection

**Privacy policy not accessible**

- Verify URL works in incognito browser
- Ensure HTTPS (not HTTP)
- Check for 404 errors

**Content rating issue**

- Re-complete questionnaire
- Ensure app enforces 18+ age requirement
- Add age verification at signup

---

## Assets Checklist

Create these assets before submission:

### Required

- [x] App icon (512x512 PNG) - ✅ Already in `assets/icon.png`
- [ ] Feature graphic (1024x500 PNG)
- [ ] Phone screenshots (2-8 images, 1080x1920)

### Recommended

- [ ] Tablet screenshots (2-4 images)
- [ ] Promo video (30-120 seconds)
- [ ] TV banner (1280x720) - if supporting Android TV

### Feature Graphic Template

Create a 1024x500 image with:

- App name/logo
- Tagline: "Find Meaningful Connections"
- Attractive background (gradient or photo)
- No text covering important areas

**Tools:**

- Canva (free templates)
- Figma
- Photoshop
- GIMP (free)

---

## Support Contacts

**Play Console Help:**

- https://support.google.com/googleplay/android-developer

**EAS Build Support:**

- https://docs.expo.dev/build/introduction/
- https://forums.expo.dev/

**Emergency Contact:**

- Google Play Developer Support (in Play Console)

---

## Timeline Summary

| Phase               | Duration       | Can Start           |
| ------------------- | -------------- | ------------------- |
| Legal setup         | 2-3 hours      | Immediately         |
| Play Console setup  | 1-2 hours      | After legal docs    |
| OAuth setup         | 30 min         | After Play Console  |
| Store listing       | 2-3 hours      | After Play Console  |
| Content rating      | 30 min         | After store listing |
| Data safety         | 1 hour         | After store listing |
| Build & test        | 1-2 hours      | After OAuth setup   |
| Production release  | 30 min         | After testing       |
| **Total prep time** | **8-12 hours** |                     |
| **Review time**     | **1-7 days**   | After submission    |
| **Total to live**   | **2-3 weeks**  |                     |

---

**Good luck with your Play Store launch! 🚀**

_Last updated: January 13, 2026_
