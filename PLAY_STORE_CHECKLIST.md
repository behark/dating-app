# Play Store Submission Checklist

Use this checklist to track your progress toward Play Store submission.

---

## Phase 1: Legal & Compliance ⚖️

- [ ] **Privacy Policy Created** ✅ (Already done: `public/privacy-policy.html`)
- [ ] **Terms of Service Created** ✅ (Already done: `public/terms-of-service.html`)
- [ ] **Legal Documents Hosted Publicly**
  - Deploy to Vercel/Netlify/GitHub Pages
  - Test URLs work in incognito browser
  - URLs must be HTTPS
- [ ] **Customize Legal Documents**
  - Replace `[Your Company Name]`
  - Replace `[Your Company Address]`
  - Replace `[Your Jurisdiction]`
  - Replace email addresses
- [ ] **Environment Variables Set**
  - `EXPO_PUBLIC_PRIVACY_POLICY_URL`
  - `EXPO_PUBLIC_TERMS_OF_SERVICE_URL`
  - `EXPO_PUBLIC_SUPPORT_EMAIL`
  - `EXPO_PUBLIC_PRIVACY_EMAIL`

---

## Phase 2: Google Play Console Setup 🎮

- [ ] **Create Play Console Account**
  - Pay $25 registration fee
  - Complete developer profile
  - Verify email and phone
- [ ] **Create New App**
  - App name: Dating App
  - Default language: English
  - App type: App (not game)
  - Free with in-app purchases
- [ ] **Set Up App Signing**
  - Choose "Let Google manage signing key"
  - Or upload your own keystore
  - Note SHA-1 fingerprint
- [ ] **Create Service Account**
  - Setup > API access
  - Create service account in Cloud Console
  - Download JSON key
  - Save as `google-service-account.json`
  - Grant access in Play Console
  - Add to `.gitignore`

---

## Phase 3: Google OAuth Configuration 🔐

- [ ] **Create Android OAuth Client**
  - Go to Google Cloud Console
  - Select Firebase project
  - APIs & Services > Credentials
  - Create OAuth Client ID (Android)
  - Package name: `com.datingapp.app`
  - SHA-1 from Play Console app signing
- [ ] **Update Environment Variable**
  - `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
  - Should end with `.apps.googleusercontent.com`
- [ ] **Test Google Sign-In**
  - Build and test on device
  - Verify Google login works

---

## Phase 4: Store Assets 🎨

- [ ] **Feature Graphic (REQUIRED)**
  - Dimensions: 1024 x 500 pixels
  - Format: PNG or JPEG
  - Save to: `assets/playstore/feature-graphic.png`
  - Use Canva/Figma to create
- [ ] **Phone Screenshots (REQUIRED - minimum 2)**
  - Take 4-8 screenshots
  - Dimensions: 1080 x 1920 (or similar)
  - Save to: `assets/playstore/screenshots/phone/`
  - Screenshots needed:
    - [ ] Profile browsing/swipe screen
    - [ ] Match notification
    - [ ] Chat interface
    - [ ] Profile screen
    - [ ] Matches list
    - [ ] Premium features
- [ ] **Tablet Screenshots (OPTIONAL)**
  - Take 2-4 screenshots
  - Save to: `assets/playstore/screenshots/tablet/`
- [ ] **Promo Video (OPTIONAL)**
  - 30-120 seconds
  - Save to: `assets/playstore/promo-video.mp4`

---

## Phase 5: Store Listing 📝

- [ ] **Main Store Listing**
  - App name
  - Short description (80 chars)
  - Full description (4000 chars)
  - App icon (512x512)
  - Feature graphic (1024x500)
  - Screenshots (minimum 2)
- [ ] **Contact Details**
  - Email address
  - Website (optional)
  - Privacy Policy URL
- [ ] **Categorization**
  - Category: Dating
  - Tags: dating, social, relationships

---

## Phase 6: Policy & Compliance 📋

- [ ] **Content Rating**
  - Complete IARC questionnaire
  - Expected rating: Mature 17+
  - Questions about violence, sexual content, etc.
- [ ] **Data Safety Form**
  - List all data collected
  - Explain data usage
  - Describe security practices
  - Declare data sharing
- [ ] **App Access**
  - Provide test account if needed
  - Or explain how to test without account
- [ ] **Ads Declaration**
  - Declare if app shows ads (No for this app)
- [ ] **Target Audience**
  - Age: 18+
  - Content appropriate for adults

---

## Phase 7: Build & Test 🔨

- [ ] **Install EAS CLI**
  ```bash
  npm install -g eas-cli
  eas login
  ```
- [ ] **Configure Environment**
  - Copy `.env.playstore` to `.env.production`
  - Fill in all values
  - Remove placeholder text
- [ ] **Build Production APK/AAB**
  ```bash
  eas build --platform android --profile production
  ```
- [ ] **Download Build**
  - Wait 10-20 minutes
  - Download .aab file from EAS
- [ ] **Test on Physical Device**
  - Install APK/AAB
  - Test all major features:
    - [ ] Sign up / Login
    - [ ] Profile creation
    - [ ] Swiping/matching
    - [ ] Chat messaging
    - [ ] In-app purchases
    - [ ] Push notifications
    - [ ] Settings
    - [ ] Account deletion

---

## Phase 8: Internal Testing (RECOMMENDED) 🧪

- [ ] **Create Internal Testing Track**
  - Testing > Internal testing
  - Create new release
  - Upload .aab file
- [ ] **Add Testers**
  - Add 5-10 email addresses
  - Share testing link
- [ ] **Collect Feedback**
  - Test for 3-7 days
  - Fix critical bugs
  - Gather user feedback
- [ ] **Verify All Features Work**
  - No crashes
  - All features functional
  - Good performance

---

## Phase 9: Production Submission 🚀

- [ ] **Complete All Policy Sections**
  - All sections show green checkmarks
  - No warnings or errors
- [ ] **Set Up Countries/Regions**
  - Select distribution countries
  - Start with major markets
- [ ] **Configure In-App Products**
  - Create subscription products
  - Set pricing
  - Activate products
- [ ] **Create Production Release**
  - Production > Releases
  - Create new release
  - Upload .aab file
  - Add release notes
- [ ] **Review Everything**
  - Double-check all information
  - Verify URLs work
  - Test screenshots display correctly
- [ ] **Submit for Review**
  - Click "Start rollout to Production"
  - Confirm submission
  - Note submission date

---

## Phase 10: Post-Submission 📊

- [ ] **Monitor Review Status**
  - Check Play Console daily
  - Watch for reviewer questions
  - Respond within 24 hours
- [ ] **Prepare for Possible Rejection**
  - Have fixes ready for common issues
  - Be ready to resubmit quickly
- [ ] **After Approval**
  - [ ] Verify app is live
  - [ ] Test download and install
  - [ ] Share with friends/family
  - [ ] Post on social media
  - [ ] Monitor crash reports
  - [ ] Respond to reviews
  - [ ] Track metrics

---

## Validation Commands

Run these before submission:

```bash
# Validate readiness
node scripts/validate-playstore-readiness.js

# Should show all green checkmarks
# Fix any red X issues before submitting
```

---

## Quick Reference

**Build Command:**

```bash
eas build --platform android --profile production
```

**Submit Command (after manual review):**

```bash
eas submit --platform android --latest
```

**Check Build Status:**

```bash
eas build:list
```

---

## Timeline Estimate

| Phase                 | Time           | Status |
| --------------------- | -------------- | ------ |
| Legal & Compliance    | 2-3 hours      | ⬜     |
| Play Console Setup    | 1-2 hours      | ⬜     |
| OAuth Configuration   | 30 min         | ⬜     |
| Store Assets          | 2-3 hours      | ⬜     |
| Store Listing         | 1-2 hours      | ⬜     |
| Policy & Compliance   | 1-2 hours      | ⬜     |
| Build & Test          | 1-2 hours      | ⬜     |
| Internal Testing      | 3-7 days       | ⬜     |
| Production Submission | 30 min         | ⬜     |
| **Total Prep Time**   | **8-12 hours** |        |
| **Review Time**       | **1-7 days**   |        |
| **Total to Live**     | **2-3 weeks**  |        |

---

## Resources

- **Full Guide:** `docs/PLAY_STORE_DEPLOYMENT_GUIDE.md`
- **Quick Start:** `docs/PLAY_STORE_QUICK_START.md`
- **Assets Guide:** `docs/PLAY_STORE_ASSETS_GUIDE.md`
- **Environment Template:** `.env.playstore`

---

## Support

**Need help?**

- Google Play Console Help Center
- Expo Documentation: https://docs.expo.dev
- Expo Forums: https://forums.expo.dev

---

**Last Updated:** January 13, 2026

**Status:** Ready to start! ✅
