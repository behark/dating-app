# Play Store Quick Start Guide

Fast-track guide to get your app on Google Play Store in 2-3 weeks.

---

## ⚡ Quick Overview

**Total Time:** 8-12 hours prep + 1-7 days review  
**Cost:** $25 (one-time Play Console fee)  
**Difficulty:** Moderate

---

## 📅 Week-by-Week Plan

### Week 1: Preparation (8-12 hours)

**Day 1-2: Legal & Configuration (4 hours)**

- ✅ Privacy Policy & Terms created (already done!)
- [ ] Host legal documents publicly
- [ ] Set up environment variables
- [ ] Configure Google OAuth

**Day 3-4: Play Console Setup (3 hours)**

- [ ] Create Play Console account ($25)
- [ ] Set up app listing
- [ ] Configure app signing
- [ ] Create service account

**Day 5-7: Assets & Build (5 hours)**

- [ ] Create feature graphic
- [ ] Take screenshots
- [ ] Build production APK/AAB
- [ ] Internal testing

### Week 2: Submission & Review

**Day 8: Submit (1 hour)**

- [ ] Complete all policy sections
- [ ] Upload APK/AAB
- [ ] Submit for review

**Day 9-14: Review Period**

- Wait for Google review (1-7 days)
- Monitor for questions
- Fix issues if rejected

### Week 3: Launch!

**Day 15+: Go Live**

- App approved and published
- Monitor reviews and crashes
- Respond to user feedback

---

## 🎯 Critical Path (Must Do)

### 1. Host Legal Documents (30 min)

```bash
# Deploy to Vercel (easiest)
cd /home/behar/dating-app
vercel --prod

# Your URLs will be:
# https://your-app.vercel.app/privacy-policy.html
# https://your-app.vercel.app/terms-of-service.html
```

**Update .env:**

```bash
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://your-app.vercel.app/privacy-policy.html
EXPO_PUBLIC_TERMS_OF_SERVICE_URL=https://your-app.vercel.app/terms-of-service.html
EXPO_PUBLIC_SUPPORT_EMAIL=support@your-domain.com
```

### 2. Create Play Console Account (15 min)

1. Go to https://play.google.com/console
2. Pay $25 registration fee
3. Complete developer profile
4. Create new app

### 3. Set Up App Signing (10 min)

1. In Play Console: Setup > App signing
2. Choose: "Let Google manage my signing key"
3. Click Continue

### 4. Create Service Account (20 min)

1. Play Console > Setup > API access
2. Create new service account
3. Download JSON key
4. Save as `google-service-account.json`
5. Add to .gitignore

### 5. Configure Android OAuth (15 min)

1. Go to https://console.cloud.google.com
2. Select Firebase project
3. APIs & Services > Credentials
4. Create OAuth Client ID (Android)
5. Package: `com.datingapp.app`
6. Get SHA-1 from Play Console app signing
7. Copy client ID to .env

```bash
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-id.apps.googleusercontent.com
```

### 6. Create Feature Graphic (1 hour)

**Use Canva (easiest):**

1. Go to canva.com
2. Custom size: 1024 x 500
3. Add gradient background (#667eea to #764ba2)
4. Add app icon
5. Add text: "Dating App" and "Find Meaningful Connections"
6. Download PNG
7. Save to `assets/playstore/feature-graphic.png`

### 7. Take Screenshots (1 hour)

```bash
# Run app on device/emulator
npm run android

# Take 4-6 screenshots:
# 1. Profile browsing (swipe screen)
# 2. Match notification
# 3. Chat interface
# 4. Profile screen
# 5. Matches list
# 6. Premium features

# Save to: assets/playstore/screenshots/phone/
```

### 8. Build Production APK (30 min)

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Build for Play Store
eas build --platform android --profile production

# Wait 10-20 minutes for build to complete
# Download the .aab file
```

### 9. Complete Store Listing (2 hours)

**In Play Console > Store presence > Main store listing:**

**App name:** Dating App

**Short description:**

```
Find meaningful connections with people near you
```

**Full description:**

```
Dating App helps you meet new people and find meaningful connections.

KEY FEATURES:
• Smart Matching - Swipe through profiles
• Real-time Chat - Message your matches
• Profile Verification - Feel safe
• Location-based - Find people nearby
• Privacy First - Your data is secure

Join thousands finding connections!
Age requirement: 18+
```

**Upload:**

- App icon (512x512)
- Feature graphic (1024x500)
- Screenshots (minimum 2)

**Contact details:**

- Email: support@your-domain.com
- Privacy Policy: https://your-app.vercel.app/privacy-policy.html

### 10. Complete Content Rating (30 min)

**Policy > App content > Content rating**

Complete IARC questionnaire:

- App category: Dating
- Violence: No
- Sexual content: Mild (dating context)
- User interaction: Yes
- Location sharing: Yes (approximate)
- In-app purchases: Yes

Expected rating: Mature 17+

### 11. Complete Data Safety (1 hour)

**Policy > App content > Data safety**

**Data collected:**

- Personal info: Name, email, photos, DOB
- Location: Approximate only
- Messages: In-app messages
- App activity: Interactions

**Data usage:**

- App functionality
- Analytics
- Security

**Data sharing:**

- Analytics providers
- Cloud storage
- Authentication services

**Security:**

- Encrypted in transit
- Encrypted at rest
- User can delete data

### 12. Submit for Review (15 min)

1. Complete all policy sections
2. Go to Production > Releases
3. Create new release
4. Upload .aab file
5. Add release notes
6. Review and submit

---

## 📋 Pre-Submission Checklist

Use this before submitting:

```bash
# Run validation script
node scripts/validate-playstore-readiness.js

# Should show all green checkmarks
```

**Manual checks:**

- [ ] Legal documents hosted and accessible
- [ ] All environment variables set
- [ ] Google Android OAuth configured
- [ ] Service account JSON downloaded
- [ ] Feature graphic created (1024x500)
- [ ] Screenshots taken (minimum 2)
- [ ] APK/AAB built successfully
- [ ] App tested on physical device
- [ ] Content rating completed
- [ ] Data safety form completed
- [ ] All policy sections green

---

## 🚨 Common Issues & Fixes

### Issue: Build Fails

**Error: Missing credentials**

```bash
eas credentials
# Select Android > production > Set up new credentials
```

**Error: Gradle build failed**

```bash
eas build --platform android --profile production --clear-cache
```

### Issue: Can't Upload to Play Console

**Error: Version code must be higher**

- Increment versionCode in app.config.js
- Rebuild

**Error: Signature mismatch**

- Ensure using same signing key
- Check EAS credentials

### Issue: Review Rejected

**Privacy policy not accessible**

- Test URL in incognito browser
- Ensure HTTPS (not HTTP)

**Age verification missing**

- Add DOB check at signup
- Show 18+ requirement clearly

**Screenshots misleading**

- Use actual app screens
- No stock photos

---

## 💡 Pro Tips

1. **Start with internal testing**
   - Upload to internal track first
   - Test with 5-10 people
   - Fix bugs before production

2. **Respond quickly to reviewers**
   - Check email daily during review
   - Answer questions within 24 hours

3. **Monitor after launch**
   - Check crash reports daily
   - Respond to reviews
   - Fix critical bugs ASAP

4. **Plan updates**
   - Monthly updates improve ranking
   - Add new features regularly
   - Keep users engaged

---

## 📞 Need Help?

**Stuck on something?**

1. Check full guide: `docs/PLAY_STORE_DEPLOYMENT_GUIDE.md`
2. Check assets guide: `docs/PLAY_STORE_ASSETS_GUIDE.md`
3. Google Play Console Help Center
4. Expo forums: https://forums.expo.dev/

**Common questions:**

Q: How long does review take?
A: Usually 1-3 days, can be up to 7 days

Q: What if I get rejected?
A: Fix the issues mentioned and resubmit

Q: Can I update after launch?
A: Yes, upload new version anytime

Q: Do I need a website?
A: No, but hosting legal docs is required

---

## ✅ Success Criteria

You're ready to submit when:

- ✅ All validation checks pass
- ✅ App tested on real device
- ✅ Legal documents accessible
- ✅ All assets created
- ✅ Store listing complete
- ✅ Content rating done
- ✅ Data safety done

---

## 🎉 After Approval

**Day 1:**

- App goes live on Play Store
- Share link with friends/family
- Post on social media

**Week 1:**

- Monitor crash reports
- Respond to reviews
- Track install numbers

**Month 1:**

- Analyze user behavior
- Plan feature updates
- Optimize based on feedback

---

**Good luck! You've got this! 🚀**

_Last updated: January 13, 2026_
