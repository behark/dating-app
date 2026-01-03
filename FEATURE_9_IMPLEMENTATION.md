# Feature 9: Safety & Moderation Implementation Guide

## Overview

Feature 9 implements comprehensive safety and moderation features for the dating app, protecting users and maintaining a safe community environment.

## Features Implemented

### 1. Report User System
Users can report abuse, inappropriate content, or violations of community guidelines.

**File:** `src/services/SafetyService.js`

```javascript
// Report a user
const result = await SafetyService.reportUser(
  reporterId,
  reportedUserId,
  'harassment', // category
  'Detailed description of violation',
  [] // evidence
);
```

**Report Categories:**
- `inappropriate_photos` - Explicit or inappropriate profile photos
- `fake_profile` - Profile appears fraudulent or false
- `harassment` - Harassment, threats, or abuse
- `scam` - Financial scams or exploitation
- `offensive_behavior` - Offensive or discriminatory behavior
- `other` - Other violations

**Backend Endpoint:** `POST /api/safety/report`

### 2. Block User System
Users can block other users to prevent contact and hide their profile.

**File:** `src/services/SafetyService.js`

```javascript
// Block a user
await SafetyService.blockUser(userId, blockedUserId);

// Unblock a user
await SafetyService.unblockUser(userId, blockedUserId);

// Get list of blocked users
const blocked = await SafetyService.getBlockedUsers(userId);

// Check if interaction is allowed
const interaction = await SafetyService.canInteractWith(userId, targetUserId);
```

**Backend Endpoints:**
- `POST /api/safety/block` - Block user
- `DELETE /api/safety/block/:blockedUserId` - Unblock user
- `GET /api/safety/blocked` - Get blocked users list
- `GET /api/safety/blocked/:otherUserId` - Check block status

### 3. Photo Verification System
Verify user identity through photo verification with liveness detection.

**File:** `src/services/PhotoVerificationService.js`

```javascript
// Submit photo for verification
const result = await PhotoVerificationService.submitVerificationPhoto(
  userId,
  photoUri,
  metadata
);

// Get verification status
const status = await PhotoVerificationService.getVerificationStatus(userId);

// Perform liveness check
const livenessResult = await PhotoVerificationService.performLivenessCheck(photoUri);

// Advanced verification (match with profile photo)
const matchResult = await PhotoVerificationService.performAdvancedLivenessCheck(
  currentPhotoUri,
  profilePhotoUri
);
```

**Verification Statuses:**
- `not_submitted` - No verification submitted
- `pending` - Verification pending review
- `approved` - Identity verified ✓
- `rejected` - Failed verification
- `expired` - Verification expired (1 year validity)

**Backend Endpoints:**
- Verification endpoints can be added for admin review

### 4. Safety Tips Screen
Educational content to help users stay safe while dating online.

**File:** `src/screens/SafetyTipsScreen.js`

**Content Sections:**
- 📸 Protect Your Personal Information
- ✅ Verify Before Meeting
- 📍 Safe First Meeting
- 💬 Online Interaction Safety
- ⚠️ Red Flags to Watch For
- 🚨 If Something Goes Wrong

**Features:**
- Expandable safety tip cards
- Emergency resources section
- Community guidelines overview
- Step-by-step reporting guide
- Best practices for online dating

### 5. Content Moderation Flagging
Flag inappropriate content within the app (photos, messages, profiles).

**File:** `src/services/SafetyService.js`

```javascript
// Flag content
const result = await SafetyService.flagContent(
  userId,
  'message', // content type
  contentId,
  'explicit', // reason
  'Description of violation'
);

// Get flags for content
const flags = await SafetyService.getContentFlags(contentId);
```

**Content Types:**
- `message` - Inappropriate message
- `profile_photo` - Inappropriate profile photo
- `bio` - Offensive bio content
- `profile` - Overall profile violation

**Flag Reasons:**
- `explicit` - Explicit sexual content
- `hateful` - Hateful or discriminatory content
- `violent` - Violent or threatening content
- `misleading` - Misleading or fraudulent content
- `spam` - Spam or commercial solicitation

**Backend Endpoint:** `POST /api/safety/flag`

### 6. Report User Screen
User interface for reporting users.

**File:** `src/screens/ReportUserScreen.js`

**Features:**
- Report category selection (modal picker)
- Detailed description input with character limit
- User information display
- Validation and error handling
- Loading states
- Safety notice and disclaimers

**Navigation Route:** `ReportUserScreen` (passed via route.params with `userId` and `userName`)

## File Structure

### Frontend Files
```
src/
  services/
    SafetyService.js           # Core safety service
    PhotoVerificationService.js # Photo verification
  screens/
    ReportUserScreen.js        # Report user UI
    SafetyTipsScreen.js        # Safety education
  navigation/
    AppNavigator.js            # Updated with new routes
  screens/
    ProfileScreen.js           # Added Safety Tips button
```

### Backend Files
```
backend/
  controllers/
    safetyController.js        # Safety endpoints
  routes/
    safety.js                  # Safety route definitions
  server.js                    # Updated with safety routes
  models/
    Report.js                  # (To be created for production)
    Block.js                   # (To be created for production)
```

## API Endpoints

### Reporting
- `POST /api/safety/report` - Submit user report
- `GET /api/safety/reports` - Get all reports (admin)
- `PUT /api/safety/reports/:reportId/review` - Review report (admin)

### Blocking
- `POST /api/safety/block` - Block user
- `DELETE /api/safety/block/:blockedUserId` - Unblock user
- `GET /api/safety/blocked` - Get blocked users
- `GET /api/safety/blocked/:otherUserId` - Check block status

### Content Moderation
- `POST /api/safety/flag` - Flag content
- `GET /api/safety/flags/:contentId` - Get content flags (admin)

### Safety Information
- `GET /api/safety/tips` - Get safety tips (public)
- `GET /api/safety/safety-score/:userId` - Get user safety score (admin)
- `PUT /api/safety/suspend/:userId` - Suspend user (admin)
- `PUT /api/safety/unsuspend/:userId` - Unsuspend user (admin)

## Integration with Existing Features

### ViewProfileScreen Integration
Add report button to profile card menu:

```javascript
<TouchableOpacity onPress={() => {
  navigation.navigate('ReportUser', {
    userId: user.id,
    userName: user.name
  });
}}>
  <Ionicons name="flag" size={20} color="#FF6B6B" />
</TouchableOpacity>
```

### ChatScreen Integration
Add report/block options in message menus:

```javascript
<TouchableOpacity onPress={() => {
  navigation.navigate('ReportUser', {
    userId: otherUser.id,
    userName: otherUser.name
  });
}}>
  <Text>Report User</Text>
</TouchableOpacity>
```

## Database Schema

### Firestore Collections

**verifications** collection:
```javascript
{
  userId: string,
  photoUrl: string,
  status: 'pending' | 'approved' | 'rejected',
  reason: string,
  submittedAt: timestamp,
  reviewedAt: timestamp,
  expiresAt: timestamp,
  livenessCheck: {
    method: 'basic' | 'selfie_match' | 'advanced',
    timestamp: timestamp,
    passed: boolean,
    confidence: number
  },
  attempts: number
}
```

**reports** collection:
```javascript
{
  reporterId: string,
  reportedUserId: string,
  category: string,
  description: string,
  evidence: array,
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed',
  createdAt: timestamp,
  updatedAt: timestamp,
  adminNotes: string
}
```

**flags** collection:
```javascript
{
  userId: string,
  contentType: 'message' | 'profile_photo' | 'bio' | 'profile',
  contentId: string,
  reason: string,
  description: string,
  status: 'pending' | 'reviewed' | 'action_taken',
  createdAt: timestamp
}
```

### MongoDB/User Document Updates
Add to User schema:
```javascript
{
  blockedUsers: [string],     // Array of blocked user IDs
  reportCount: number,        // Number of reports against user
  blockedCount: number,       // Number of users who blocked this user
  photoVerified: boolean,     // Photo verification status
  verificationSubmittedAt: timestamp,
  verificationApprovedAt: timestamp,
  suspended: boolean,         // Account suspended status
  suspendedAt: timestamp,
  suspendReason: string
}
```

## Safety Validation Rules

### Report Validation
```javascript
{
  isValid: boolean,
  errors: [string]
}
```

Rules:
- Category is required and must be valid
- Description minimum 10 characters, maximum 500 characters
- Cannot report self

### Photo Validation
```javascript
{
  isValid: boolean,
  errors: [string]
}
```

Requirements:
- Minimum file size: 500 KB
- Maximum file size: 10 MB
- Aspect ratio: 0.75 to 1.33 (portrait/square)
- Clear face visible
- Recent photo (within 30 days)
- No heavy filters or editing
- Only subject in photo

## Safety Score Calculation

Safety score ranges from 0-100:
```
Base: 100
- Suspended: -100
- Reports: -10 per report (max -50)
- Email unverified: -10
- Phone unverified: -5
- Photo unverified: -15
- Blocks: -5 per block (max -20)
```

## User Experience Flow

### Reporting a User
1. User navigates to ReportUserScreen
2. Selects report category from dropdown
3. Provides detailed description
4. Reviews notice about false reports
5. Submits report
6. Success confirmation message
7. Automatic block option (optional)

### Blocking a User
1. User views profile or conversation
2. Taps menu → Block User
3. Confirmation dialog
4. User blocked - prevents all interaction
5. User can unblock anytime from blocked list

### Photo Verification
1. User navigates to Verification screen
2. Reviews requirements checklist
3. Takes/uploads selfie photo
4. System performs liveness detection
5. Photo submitted for review
6. Status shows "pending"
7. Admin reviews within 24 hours
8. Status updates to "approved" or "rejected"

### Learning About Safety
1. User taps "Safety Tips" in Profile
2. Views expandable safety tip categories
3. Reads red flags and best practices
4. Accesses emergency resources
5. Views community guidelines
6. Learns how to report violations

## Best Practices

1. **Privacy First:** Never ask for personal information too quickly
2. **Verify Identity:** Always verify identity before meeting
3. **Public Meetings:** Always meet in public places
4. **Tell Someone:** Inform a friend of your location and plans
5. **Trust Gut Feeling:** Don't ignore red flags
6. **Report Immediately:** Report suspicious behavior right away
7. **Save Evidence:** Document violations for reporting
8. **Contact Authorities:** Report serious crimes to police

## Admin Features

### Monitoring & Moderation
- View all pending reports
- Review user safety scores
- Suspend/unsuspend accounts
- Review photo verifications
- Track content flags
- Monitor user complaints

### Report Review Workflow
1. Admin receives report notification
2. Reviews report details and evidence
3. Examines reported user's history
4. Makes decision: dismiss, warn, or suspend
5. Documents reasoning
6. Takes action
7. Notifies relevant users

## Testing Checklist

- [ ] Report user functionality works
- [ ] Block/unblock user functionality works
- [ ] Blocked users cannot interact
- [ ] Photo verification submission works
- [ ] Liveness detection functions
- [ ] Safety tips screen displays correctly
- [ ] All report categories available
- [ ] Character limits enforced
- [ ] Validation messages show correctly
- [ ] Backend endpoints respond correctly
- [ ] User data persists to database
- [ ] Reports show in admin dashboard

## Security Considerations

1. **Rate Limiting:** Implement rate limiting on report endpoints
2. **False Report Penalties:** Track false reports and penalize repeat offenders
3. **Doxxing Prevention:** Don't expose reporter identity to reported user
4. **Evidence Storage:** Securely store evidence for potential legal proceedings
5. **Data Privacy:** Comply with GDPR/privacy regulations
6. **Encryption:** Encrypt sensitive report data
7. **Access Control:** Restrict admin features to authorized users
8. **Audit Logs:** Log all safety actions for compliance

## Integration Notes

- SafetyService uses Firestore for real-time updates
- PhotoVerificationService integrates with Firebase Storage
- Backend controllers use authentication middleware
- All routes require `authenticateToken` except public safety tips
- Verification photos stored separately from profile photos
- Report history maintained for admin review

## Future Enhancements

- ML-based content moderation
- Automated spam detection
- AI-powered fake profile detection
- Advanced facial recognition for photo verification
- Two-factor authentication for sensitive accounts
- Automated suspicious pattern detection
- Integration with law enforcement
- Machine learning-based risk scoring
- Real-time abuse detection in messages
- IP address logging for fraud detection

## Support & Resources

For implementation questions:
1. Check API documentation
2. Review component prop interfaces
3. Examine test files and examples
4. Contact development team

For user support:
1. In-app Safety Tips screen
2. Help & FAQ section
3. Contact support team
4. Emergency services contact information
