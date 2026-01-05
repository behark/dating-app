# App Store Compliance Guide

## Table of Contents
1. [Apple App Store Requirements](#apple-app-store-requirements)
2. [Google Play Store Requirements](#google-play-store-requirements)
3. [Privacy Policy Requirements](#privacy-policy-requirements)
4. [GDPR/CCPA Compliance](#gdprccpa-compliance)
5. [Content Rating](#content-rating)
6. [Age Verification](#age-verification)
7. [Required Permissions](#required-permissions)
8. [Pre-Submission Checklist](#pre-submission-checklist)

---

## Apple App Store Requirements

### App Store Review Guidelines Compliance

#### 1.1 Safety - User Generated Content
- [x] Report/block functionality implemented (`/api/safety/report`, `/api/safety/block`)
- [x] Content moderation for photos (admin approval flow)
- [x] Message content filtering
- [ ] **Action Required**: Ensure 24-hour response to user reports

#### 1.2 Safety - Dating Apps Specific (Guideline 5.1.1)
- [ ] Users must be 18+ (age verification required)
- [ ] Clear explanation of dating app purpose
- [ ] Photo verification optional but recommended
- [ ] Safety tips for meeting in person

#### 1.3 Privacy (Guideline 5.1.1)
- [x] Privacy Policy URL in app
- [x] Data collection disclosure
- [x] Account deletion functionality
- [x] Data export capability (GDPR)

#### 1.4 Performance (Guideline 2.1)
- [x] App completeness - no placeholder content
- [x] No crashes (memory leaks fixed)
- [x] Proper error handling

#### 1.5 Business (Guideline 3.1.1)
- [x] In-App Purchases using Apple's system
- [ ] Subscription management through Apple
- [ ] Clear subscription terms displayed

#### 1.6 Design (Guideline 4.0)
- [ ] Human Interface Guidelines compliance
- [ ] Accessibility support (VoiceOver)
- [ ] Appropriate use of system features

### Required App Store Information

```json
{
  "appName": "Dating App",
  "category": "Social Networking",
  "subcategory": "Dating",
  "ageRating": "17+",
  "contentDescriptors": [
    "Infrequent/Mild Sexual Content and Nudity",
    "Infrequent/Mild Mature/Suggestive Themes"
  ],
  "privacyPolicyUrl": "https://yourdomain.com/privacy",
  "supportUrl": "https://yourdomain.com/support",
  "marketingUrl": "https://yourdomain.com"
}
```

---

## Google Play Store Requirements

### Play Store Policy Compliance

#### Dating Apps Policy
1. **Age Requirement**: Must be rated for users 18+
2. **Safety Features Required**:
   - Block and report functionality ✅
   - Safety tips displayed to users
   - Photo verification (recommended)

#### User Generated Content Policy
- Content moderation system in place ✅
- Ability to report inappropriate content ✅
- Clear community guidelines

#### Data Safety Section

```yaml
Data Collected:
  - Personal Info:
      - Name: Collected, Required
      - Email: Collected, Required
      - Phone: Optional
      - Date of Birth: Collected, Required
      - Photos: Collected, Required
  - Location:
      - Approximate Location: Collected, Required
      - Precise Location: Optional
  - App Activity:
      - App interactions: Collected, Analytics
      - In-app search history: Collected, App functionality
  - Messages:
      - In-app messages: Collected, App functionality

Data Sharing:
  - No data shared with third parties for advertising
  - Data may be shared with service providers for:
    - Analytics
    - Payment processing
    - Cloud storage

Security Practices:
  - Data encrypted in transit: Yes (TLS 1.2+)
  - Data encrypted at rest: Yes (MongoDB Atlas encryption)
  - Account deletion available: Yes
  - Data retention: Deleted after account deletion
```

### Content Rating (IARC)

```
Rating: Mature 17+
Content Descriptors:
- Users Interact
- In-App Purchases
- Shares Location
- Sexual Themes
```

---

## Privacy Policy Requirements

### Required Sections

1. **Information We Collect**
   - Personal information (name, email, date of birth)
   - Profile information (bio, photos, preferences)
   - Location data (for matching purposes)
   - Usage data (app interactions, analytics)
   - Device information

2. **How We Use Information**
   - Provide dating/matching services
   - Improve user experience
   - Send notifications
   - Prevent fraud and abuse
   - Legal compliance

3. **Information Sharing**
   - With other users (limited profile info)
   - Service providers (hosting, analytics)
   - Legal requirements
   - Business transfers

4. **User Rights**
   - Access your data
   - Correct inaccurate data
   - Delete your account/data
   - Export your data
   - Opt-out of marketing

5. **Data Security**
   - Encryption in transit and at rest
   - Access controls
   - Regular security audits

6. **Data Retention**
   - Active accounts: Data retained while active
   - Deleted accounts: Data removed within 30 days
   - Legal holds: May retain for legal purposes

7. **Children's Privacy**
   - Service not intended for users under 18
   - Age verification at registration

8. **Contact Information**
   - Email: privacy@yourdomain.com
   - Address: [Company Address]

---

## GDPR/CCPA Compliance

### GDPR Requirements (EU Users)

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Lawful basis for processing | ✅ | Consent + Contract |
| Data minimization | ✅ | Only necessary data collected |
| Purpose limitation | ✅ | Data used only for stated purposes |
| Accuracy | ✅ | Users can update profile |
| Storage limitation | ✅ | Data deleted with account |
| Integrity & confidentiality | ✅ | Encryption + access controls |
| Right to access | ✅ | `/api/profile/export` |
| Right to rectification | ✅ | Profile editing |
| Right to erasure | ✅ | Account deletion |
| Right to data portability | ✅ | Data export feature |
| Right to object | ✅ | Marketing opt-out |

### CCPA Requirements (California Users)

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Right to know | ✅ | Privacy policy disclosure |
| Right to delete | ✅ | Account deletion |
| Right to opt-out of sale | ✅ | No data selling |
| Non-discrimination | ✅ | Equal service regardless of choices |

### Implementation Checklist

```javascript
// Required API endpoints for compliance
const complianceEndpoints = {
  // Data access request
  'GET /api/privacy/data-request': 'Returns user data package',
  
  // Account deletion
  'DELETE /api/profile': 'Deletes user account and data',
  
  // Data export
  'GET /api/profile/export': 'Exports user data in JSON format',
  
  // Consent management
  'PUT /api/privacy/consent': 'Updates user consent preferences',
  
  // Marketing opt-out
  'PUT /api/privacy/marketing': 'Manages marketing preferences',
};
```

---

## Content Rating

### Age Rating Justification

| Category | Rating | Reason |
|----------|--------|--------|
| Violence | None | No violent content |
| Sexual Content | Mild | Dating/romantic context |
| Language | None | Moderated chat |
| Controlled Substances | None | Not applicable |
| Mature Themes | Moderate | Dating/relationships |

### Recommended Rating

- **Apple App Store**: 17+ (Dating apps require 17+)
- **Google Play**: Mature 17+

---

## Age Verification

### Current Implementation

```javascript
// Registration validation
const validateAge = (dateOfBirth) => {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 18;
};
```

### Recommended Enhancements

1. **Self-Declaration**: User declares they are 18+ ✅
2. **Date of Birth Verification**: Calculate from DOB ✅
3. **Terms Acceptance**: Must accept terms stating 18+ requirement
4. **Optional Photo Verification**: Consider for premium features

---

## Required Permissions

### iOS Permissions (Info.plist)

```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to take profile photos</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>We need photo library access to select profile photos</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to show matches near you</string>

<key>NSUserTrackingUsageDescription</key>
<string>We use this to improve your experience with personalized matches</string>

<key>NSContactsUsageDescription</key>
<string>We can help you find friends who also use the app (optional)</string>
```

### Android Permissions (AndroidManifest.xml)

```xml
<!-- Required -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Location (required for matching) -->
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

<!-- Camera and Photos -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

<!-- Push Notifications -->
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.VIBRATE" />
```

---

## Pre-Submission Checklist

### Apple App Store

- [ ] App Store Connect account setup
- [ ] App icons (all required sizes)
- [ ] Screenshots (all device sizes)
- [ ] App Preview video (optional)
- [ ] Privacy Policy URL
- [ ] Support URL
- [ ] Age rating questionnaire completed
- [ ] In-App Purchase configuration
- [ ] App Review Information (demo account)
- [ ] Export compliance (encryption)

### Google Play Store

- [ ] Google Play Console account setup
- [ ] App icons and feature graphic
- [ ] Screenshots (phone and tablet)
- [ ] Promotional video (optional)
- [ ] Store listing translation (if applicable)
- [ ] Content rating questionnaire
- [ ] Data safety form completed
- [ ] App signing by Google Play
- [ ] Internal testing completed
- [ ] Closed testing (recommended)

### Technical Pre-Launch

- [ ] All critical bugs fixed
- [ ] Performance optimized
- [ ] Security audit passed
- [ ] Integration tests passing
- [ ] Error monitoring configured
- [ ] Analytics configured
- [ ] Push notifications tested
- [ ] Deep linking configured

### Legal & Compliance

- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] GDPR compliance verified
- [ ] CCPA compliance verified
- [ ] Age verification working
- [ ] Content moderation active
- [ ] Report/block system tested

---

## Environment Variables for App Store URLs

```bash
# Production URLs (set these before submission)
PRIVACY_POLICY_URL=https://yourdomain.com/privacy
TERMS_OF_SERVICE_URL=https://yourdomain.com/terms
SUPPORT_URL=https://yourdomain.com/support
MARKETING_URL=https://yourdomain.com

# App Store Configuration
APPLE_APP_ID=123456789
GOOGLE_PLAY_PACKAGE=com.yourcompany.datingapp

# Age Rating
MIN_USER_AGE=18
CONTENT_RATING=17+
```

---

## Next Steps

1. **Immediate Actions**:
   - Create and host Privacy Policy
   - Create and host Terms of Service
   - Complete app store questionnaires
   - Set up test accounts for reviewers

2. **Before Submission**:
   - Run production readiness check
   - Complete all integration tests
   - Test on physical devices
   - Test with slow network conditions

3. **Post-Submission**:
   - Monitor review status
   - Be prepared to respond to reviewer questions
   - Have bug fix process ready for quick updates
