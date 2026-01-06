# App Store / Play Store Submission Checklist

## 📦 PHASE 6 — PLAY STORE / APP STORE REQUIREMENTS

### ✅ MUST HAVE - Implementation Status

#### 1. Privacy Policy URL ✅

**Status**: ✅ Implemented

- **Location**: `src/screens/PrivacyPolicyScreen.js`
- **Access**:
  - Login Screen → "Privacy Policy" link
  - Register Screen → "Privacy Policy" link
  - Privacy Settings Screen → "View Full Privacy Policy" button
- **Web URL**: Set `EXPO_PUBLIC_PRIVACY_POLICY_URL` environment variable
- **Action Required**:
  - [ ] Host privacy policy on your website
  - [ ] Update `EXPO_PUBLIC_PRIVACY_POLICY_URL` in production environment
  - [ ] Review and customize privacy policy content for your app

#### 2. Terms of Service ✅

**Status**: ✅ Implemented

- **Location**: `src/screens/TermsOfServiceScreen.js`
- **Access**:
  - Login Screen → "Terms of Service" link
  - Register Screen → "Terms of Service" link
- **Web URL**: Set `EXPO_PUBLIC_TERMS_OF_SERVICE_URL` environment variable
- **Action Required**:
  - [ ] Host terms of service on your website
  - [ ] Update `EXPO_PUBLIC_TERMS_OF_SERVICE_URL` in production environment
  - [ ] Review and customize terms content (update jurisdiction, contact info)
  - [ ] Add your company address and contact email

#### 3. App Description ✅

**Status**: ⚠️ Needs Content

- **Location**: App store listing (Google Play Console / App Store Connect)
- **Action Required**:
  - [ ] Write compelling app description (4000 chars max for Play Store)
  - [ ] Write short description (80 chars max)
  - [ ] Include key features and benefits
  - [ ] Add screenshots descriptions
  - [ ] Include keywords for discoverability

#### 4. Screenshots ⚠️

**Status**: ⚠️ Needs Creation

- **Requirements**:
  - **Play Store**:
    - At least 2 screenshots (up to 8)
    - Minimum 320px, maximum 3840px
    - Aspect ratio: 16:9 or 9:16
  - **App Store**:
    - iPhone screenshots (various sizes for different devices)
    - iPad screenshots (if supported)
    - Minimum 1242 x 2208 pixels
- **Action Required**:
  - [ ] Take screenshots of key screens:
    - [ ] Login/Registration
    - [ ] Home/Discovery feed
    - [ ] Profile screen
    - [ ] Chat/Messages
    - [ ] Matches screen
    - [ ] Premium features (if applicable)
  - [ ] Create promotional graphics
  - [ ] Add text overlays if needed
  - [ ] Ensure no placeholder content in screenshots

#### 5. App Icon ✅

**Status**: ⚠️ Needs Creation

- **Requirements**:
  - **Play Store**:
    - 512 x 512 pixels (PNG, 32-bit)
    - No transparency
  - **App Store**:
    - 1024 x 1024 pixels (PNG, 24-bit RGB)
    - No transparency, no rounded corners (system adds)
- **Action Required**:
  - [ ] Design app icon (1024x1024)
  - [ ] Ensure it looks good at small sizes
  - [ ] Test on different backgrounds
  - [ ] Export in required formats

#### 6. No Crashes on Launch ✅

**Status**: ✅ Should be Verified

- **Current Implementation**:
  - Error boundaries implemented
  - Proper error handling
  - Loading states prevent premature access
- **Action Required**:
  - [ ] Test app launch on physical devices
  - [ ] Test on iOS and Android
  - [ ] Test with no internet connection
  - [ ] Test with invalid/missing environment variables
  - [ ] Use crash reporting (Sentry) to monitor
  - [ ] Fix any crashes found

#### 7. No Placeholder Text ✅

**Status**: ✅ Verified

- **Checked**: All placeholder text found is appropriate (input placeholders)
- **Input Placeholders** (These are OK):
  - "Email", "Password", "Name", "Age" - Standard form placeholders
  - "Type a message..." - Chat input placeholder
  - "Enter password to confirm" - Account deletion confirmation
- **Action Required**:
  - [ ] Review all user-facing text
  - [ ] Ensure no "Lorem ipsum" or "TODO" text visible to users
  - [ ] Replace any generic placeholders with meaningful text

#### 8. Account Deletion Option ✅

**Status**: ✅ Implemented

- **Location**: `src/screens/PrivacySettingsScreen.js`
- **Access**:
  - Preferences → Privacy & Data Settings → Delete Account
- **Features**:
  - Password confirmation required
  - Clear warning about permanent deletion
  - GDPR compliant (Right to be Forgotten)
  - Backend endpoint: `DELETE /api/privacy/delete-account`
- **Action Required**:
  - [ ] Test account deletion flow end-to-end
  - [ ] Verify all user data is actually deleted
  - [ ] Ensure deletion is permanent and irreversible
  - [ ] Test with various user states (premium, active matches, etc.)

#### 9. GDPR Consent (if EU) ✅

**Status**: ✅ Implemented

- **Location**: `src/screens/PrivacySettingsScreen.js`
- **Features**:
  - Data export (GDPR Data Portability)
  - Account deletion (Right to be Forgotten)
  - Consent management endpoints
  - CCPA compliance (Do Not Sell)
- **Action Required**:
  - [ ] Add GDPR consent banner on first launch (if required)
  - [ ] Implement consent tracking
  - [ ] Ensure consent is recorded in backend
  - [ ] Test consent withdrawal flow

---

## 📋 Additional Requirements

### App Store Specific

#### iOS App Store

- [ ] **App Store Connect Setup**
  - [ ] Create app listing
  - [ ] Set up app categories
  - [ ] Configure pricing and availability
  - [ ] Set up in-app purchases (if applicable)
- [ ] **App Information**
  - [ ] App name (30 chars max)
  - [ ] Subtitle (30 chars max)
  - [ ] Promotional text (170 chars, can update without new version)
  - [ ] Keywords (100 chars max)
  - [ ] Support URL
  - [ ] Marketing URL (optional)
- [ ] **Age Rating**
  - [ ] Complete age rating questionnaire
  - [ ] Ensure app meets age requirements (18+ for dating apps)
- [ ] **App Review Information**
  - [ ] Provide demo account credentials
  - [ ] Add review notes
  - [ ] Include contact information
- [ ] **Privacy**
  - [ ] Privacy policy URL (required)
  - [ ] Privacy practices (data collection disclosure)
  - [ ] App Privacy Details (data types collected)

#### Google Play Store

- [ ] **Play Console Setup**
  - [ ] Create app listing
  - [ ] Set up app categories
  - [ ] Configure pricing and distribution
  - [ ] Set up in-app products (if applicable)
- [ ] **Store Listing**
  - [ ] App name (50 chars max)
  - [ ] Short description (80 chars max)
  - [ ] Full description (4000 chars max)
  - [ ] Graphic assets (icon, screenshots, feature graphic)
  - [ ] Promotional video (optional)
- [ ] **Content Rating**
  - [ ] Complete content rating questionnaire
  - [ ] Ensure Mature 17+ rating for dating apps
- [ ] **Privacy Policy**
  - [ ] Privacy policy URL (required)
  - [ ] Data safety section (data collection disclosure)
- [ ] **Target Audience**
  - [ ] Set target age group (18+)
  - [ ] Configure content guidelines compliance

---

## 🔍 Pre-Submission Testing

### Functional Testing

- [ ] Test all core features
- [ ] Test authentication flow
- [ ] Test profile creation and editing
- [ ] Test matching and messaging
- [ ] Test premium features (if applicable)
- [ ] Test payment flows (if applicable)
- [ ] Test account deletion
- [ ] Test data export

### Device Testing

- [ ] Test on iOS (multiple devices)
- [ ] Test on Android (multiple devices)
- [ ] Test on tablets (if supported)
- [ ] Test on different screen sizes
- [ ] Test on different OS versions

### Edge Cases

- [ ] Test with no internet connection
- [ ] Test with slow internet
- [ ] Test with invalid credentials
- [ ] Test with expired tokens
- [ ] Test with missing permissions
- [ ] Test with full storage
- [ ] Test with low battery

### Performance

- [ ] App launch time < 3 seconds
- [ ] No memory leaks
- [ ] Smooth scrolling
- [ ] Fast image loading
- [ ] Efficient battery usage

---

## 📝 Legal & Compliance

### Required Documents

- [ ] Privacy Policy (hosted and linked) ✅
- [ ] Terms of Service (hosted and linked) ✅
- [ ] End User License Agreement (EULA) - Optional
- [ ] Refund Policy (if applicable)
- [ ] Age Verification (18+ requirement)

### Data Protection

- [ ] GDPR compliance (if EU users) ✅
- [ ] CCPA compliance (if California users) ✅
- [ ] COPPA compliance (not applicable - 18+ app)
- [ ] Data retention policy
- [ ] Data breach notification plan

### Content Guidelines

- [ ] No prohibited content
- [ ] Appropriate for 18+ audience
- [ ] No hate speech or harassment
- [ ] Safety features implemented ✅
- [ ] Reporting mechanisms in place ✅

---

## 🚀 Submission Steps

### iOS App Store

1. [ ] Build app with Xcode
2. [ ] Archive and upload to App Store Connect
3. [ ] Complete app information in App Store Connect
4. [ ] Submit for review
5. [ ] Respond to any review feedback
6. [ ] Release to App Store

### Google Play Store

1. [ ] Build release APK/AAB
2. [ ] Create app in Play Console
3. [ ] Complete store listing
4. [ ] Upload app bundle
5. [ ] Complete content rating
6. [ ] Submit for review
7. [ ] Respond to any review feedback
8. [ ] Release to production

---

## 📊 Post-Submission

### Monitoring

- [ ] Set up crash reporting (Sentry) ✅
- [ ] Set up analytics
- [ ] Monitor app reviews
- [ ] Track app performance metrics
- [ ] Monitor user feedback

### Updates

- [ ] Plan for regular updates
- [ ] Fix bugs reported by users
- [ ] Add new features based on feedback
- [ ] Keep privacy policy and terms updated

---

## ✅ Quick Checklist Summary

### Must Have (All Required)

- ✅ Privacy Policy URL - Implemented
- ✅ Terms of Service - Implemented
- ⚠️ App Description - Needs content
- ⚠️ Screenshots - Needs creation
- ⚠️ App Icon - Needs creation
- ✅ No Crashes on Launch - Needs testing
- ✅ No Placeholder Text - Verified
- ✅ Account Deletion Option - Implemented
- ✅ GDPR Consent - Implemented

### Action Items

1. **Create App Icon** (1024x1024)
2. **Take Screenshots** (all required sizes)
3. **Write App Description** (short + full)
4. **Host Privacy Policy** (update URL in env)
5. **Host Terms of Service** (update URL in env)
6. **Test App Launch** (multiple devices)
7. **Test Account Deletion** (end-to-end)
8. **Review All Text** (no placeholders)

---

## 📞 Support Information

**Contact Email**: support@your-dating-app.com  
**Privacy Email**: privacy@your-dating-app.com  
**Company Address**: [Your Company Address]  
**Support URL**: https://your-domain.com/support  
**Privacy Policy URL**: https://your-domain.com/privacy-policy  
**Terms URL**: https://your-domain.com/terms-of-service

---

**Last Updated**: [Current Date]  
**Status**: Ready for submission after completing action items
