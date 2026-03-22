# Google Play Store Launch Checklist

> Everything required before going live on Google Play.
> Last updated: March 22, 2026

---

## 1. Google Play Console Account

- [ ] Developer account registered ($25 one-time fee)
- [ ] Developer profile completed (name, address, phone, email)
- [ ] Developer email verified
- [ ] Organization details filled in (if publishing as org)

---

## 2. App Signing & Build

- [ ] App signing by Google Play enabled (recommended)
- [ ] Upload key generated and stored securely
- [ ] Production build created with EAS: `eas build --platform android --profile production`
- [ ] AAB (Android App Bundle) generated — not APK
- [ ] Version code incremented (currently: 45 in app.config.js)
- [ ] Version name set (currently: 1.4.2)
- [ ] Target SDK 35 (required by Google Play — already configured)
- [ ] Min SDK 26 / Android 8.0 (already configured)

---

## 3. Store Listing

- [ ] App name entered: "Dating App"
- [ ] Short description pasted (see PLAY_STORE_LISTING.md)
- [ ] Full description pasted (see PLAY_STORE_LISTING.md)
- [ ] App icon uploaded (512x512 PNG — `assets/icon.png`)
- [ ] Feature graphic uploaded (1024x500 — see PLAY_STORE_ASSETS_GUIDE.md)
- [ ] Phone screenshots uploaded (minimum 2, recommended 4-8)
- [ ] Tablet screenshots uploaded (recommended, 2-4)
- [ ] App category set: Social > Dating
- [ ] Contact email: support@datingapp.com
- [ ] Contact website: https://dating-app-seven-peach.vercel.app
- [ ] Default language set

---

## 4. Content Rating

- [ ] Content rating questionnaire completed via Play Console
- [ ] Dating app declaration: Yes
- [ ] User-generated content: Yes
- [ ] Users can communicate: Yes
- [ ] Location shared: Yes (approximate only)
- [ ] Minimum age: 18
- [ ] Expected rating: Mature 17+
- [ ] Rating applied to store listing

---

## 5. Data Safety Form

- [ ] Data types collected declared (see PLAY_STORE_LISTING.md for full table)
- [ ] Data sharing practices disclosed
- [ ] Security practices declared (encryption in transit + at rest)
- [ ] Data deletion policy declared (30-day deletion)
- [ ] Privacy Policy URL provided: https://dating-app-seven-peach.vercel.app/privacy-policy.html

---

## 6. Legal & Compliance

- [ ] Privacy Policy published and accessible: `/public/privacy-policy.html`
- [ ] Terms of Service published and accessible: `/public/terms-of-service.html`
- [ ] Child Safety Standards page published: `/public/child-safety-standards.html`
- [ ] GDPR compliance verified (EU users — data export, deletion, consent)
- [ ] CCPA compliance verified (California users)
- [ ] Age gate / 18+ verification in place
- [ ] Account deletion flow working (Settings > Account > Delete Account)

---

## 7. App Content Declarations

- [ ] Ads declaration: No ads (or declare ad SDK if added)
- [ ] Government apps: Not applicable
- [ ] Financial features: Not applicable
- [ ] Health apps: Not applicable
- [ ] News apps: Not applicable
- [ ] COVID-19 contact tracing: Not applicable
- [ ] Dating app declaration: Yes
- [ ] Contains in-app purchases: Yes (premium subscription via Google Play Billing)

---

## 8. Testing

- [ ] Internal testing track used first (recommended before production)
- [ ] App tested on physical Android device
- [ ] App tested on Android emulator (multiple API levels)
- [ ] All critical flows verified:
  - [ ] Registration (email + Google OAuth)
  - [ ] Login / logout
  - [ ] Profile creation and editing
  - [ ] Photo upload
  - [ ] Swiping / discovery
  - [ ] Matching
  - [ ] Chat / messaging
  - [ ] Report / block user
  - [ ] Premium purchase flow
  - [ ] Account deletion
  - [ ] Push notifications
- [ ] No crashes on launch
- [ ] Deep links working (dating-app:// scheme + https://dating-app.com)
- [ ] OTA updates working (EAS Update)

---

## 9. Backend & Infrastructure

- [ ] Production backend deployed and healthy
- [ ] API URL configured correctly in environment variables
- [ ] Database (MongoDB) production cluster running
- [ ] Redis configured (if used for caching/sessions)
- [ ] Sentry error tracking active
- [ ] SSL/TLS certificates valid
- [ ] CORS configured for production domains
- [ ] Rate limiting enabled

---

## 10. Pre-Launch Review

- [ ] Demo/test account credentials prepared for Google reviewers
- [ ] All placeholder content removed
- [ ] No debug/development screens accessible
- [ ] No test data visible to users
- [ ] App icon and splash screen look professional
- [ ] Permissions are minimal (no unnecessary permissions declared)
  - Current Android permissions: [] (empty — good, uses runtime requests)
- [ ] Deep link verification: `assetlinks.json` hosted if using App Links

---

## 11. Release

- [ ] Release notes written (see RELEASE_NOTES_TEMPLATE.md)
- [ ] Rollout percentage chosen (recommend 10-20% staged rollout initially)
- [ ] Monitoring dashboards ready (Sentry, server metrics)
- [ ] Support email monitored for user feedback
- [ ] Rollback plan documented (revert to previous AAB in Play Console)

---

## 12. Post-Launch

- [ ] Verify app appears in Play Store search
- [ ] Install from Play Store on a real device and test
- [ ] Monitor crash reports in Play Console (Android Vitals)
- [ ] Monitor Sentry for new errors
- [ ] Respond to early user reviews
- [ ] Monitor server load and scaling
- [ ] Plan next release based on feedback

---

## Quick Reference: Key URLs

| Resource         | URL                                                                   |
| ---------------- | --------------------------------------------------------------------- |
| Play Console     | https://play.google.com/console                                       |
| Privacy Policy   | https://dating-app-seven-peach.vercel.app/privacy-policy.html         |
| Terms of Service | https://dating-app-seven-peach.vercel.app/terms-of-service.html       |
| Child Safety     | https://dating-app-seven-peach.vercel.app/child-safety-standards.html |
| Backend API      | https://dating-app-backend-x4yq.onrender.com/api                      |
| EAS Dashboard    | https://expo.dev                                                      |
| Sentry Dashboard | https://sentry.io                                                     |

---

## Quick Reference: Build Commands

```bash
# Production build (AAB for Play Store)
eas build --platform android --profile production

# Submit to Play Store (requires google-service-account.json)
eas submit --platform android --profile production

# OTA update (no new build needed for JS-only changes)
eas update --branch production --message "Description of update"
```
