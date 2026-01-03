# Dating App - Tier 1 Features Implementation Guide

## Overview
This document covers the complete implementation of all Tier 1 (Must-Have) core features for the dating app, including authentication, profile management, and photo handling.

---

## 1. Authentication & User Management

### 1.1 Email/Password Registration
**Status**: ✅ IMPLEMENTED

**Backend Files**:
- [backend/controllers/authController.js](backend/controllers/authController.js) - `register()` function
- [backend/routes/auth.js](backend/routes/auth.js) - POST `/api/auth/register`

**Frontend Files**:
- [src/screens/RegisterScreen.js](src/screens/RegisterScreen.js)
- [src/context/AuthContext.js](src/context/AuthContext.js) - `signup()` function

**Features**:
- Email validation
- Password strength requirement (minimum 8 characters)
- Name, age, and gender collection during registration
- Automatic JWT token generation
- Email verification workflow

**API Endpoint**:
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepass123",
  "name": "John Doe",
  "age": 25,
  "gender": "male"
}

Response:
{
  "success": true,
  "message": "User registered successfully. Please verify your email.",
  "data": {
    "user": { ...user data... },
    "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 1.2 OAuth (Google, Apple, Facebook)
**Status**: ✅ IMPLEMENTED

**Backend Files**:
- [backend/controllers/authController.js](backend/controllers/authController.js)
  - `googleAuth()` function
  - `facebookAuth()` function
  - `appleAuth()` function
- [backend/routes/auth.js](backend/routes/auth.js) - POST `/api/auth/google`, `/api/auth/facebook`, `/api/auth/apple`

**Frontend Files**:
- [src/context/AuthContext.js](src/context/AuthContext.js) - OAuth integration with expo-auth-session

**Features**:
- Google OAuth authentication
- Facebook OAuth authentication
- Apple OAuth authentication
- Automatic account creation for new OAuth users
- Account linking for existing users
- Profile image from OAuth provider

**API Endpoints**:
```bash
POST /api/auth/google
POST /api/auth/facebook
POST /api/auth/apple
```

---

### 1.3 Phone Verification
**Status**: ✅ IMPLEMENTED

**Backend Files**:
- [backend/controllers/phoneController.js](backend/controllers/phoneController.js)
- [backend/routes/auth.js](backend/routes/auth.js) - Phone verification endpoints
- [backend/models/User.js](backend/models/User.js) - Phone fields in schema

**Frontend Files**:
- [src/screens/PhoneVerificationScreen.js](src/screens/PhoneVerificationScreen.js)
- [src/context/AuthContext.js](src/context/AuthContext.js) - Phone verification functions

**Features**:
- SMS code generation (6-digit code)
- Code expiration (15 minutes)
- Resend functionality with cooldown timer
- Phone number validation
- Phone number uniqueness check

**API Endpoints**:
```bash
POST /api/auth/send-phone-verification
{
  "phoneNumber": "+1234567890"
}

POST /api/auth/verify-phone
{
  "code": "123456"
}

POST /api/auth/resend-phone-verification
```

**Note**: SMS service uses Twilio (placeholder implementation in code, requires configuration with actual Twilio credentials).

---

### 1.4 JWT/Session Management
**Status**: ✅ IMPLEMENTED

**Backend Files**:
- [backend/middleware/auth.js](backend/middleware/auth.js) - Authentication middleware
- [backend/models/User.js](backend/models/User.js)
  - `generateAuthToken()` method
  - `generateRefreshToken()` method

**Features**:
- JWT token generation (7-day expiry)
- Refresh token generation (30-day expiry)
- Token verification middleware
- Optional authentication middleware for public routes
- Secure token storage in AsyncStorage (frontend)

**Token Structure**:
```javascript
// Auth Token (7 days)
{
  userId: "...",
  email: "...",
  iat: ...,
  exp: ...
}

// Refresh Token (30 days)
{
  userId: "...",
  iat: ...,
  exp: ...
}
```

**API Endpoint**:
```bash
POST /api/auth/refresh-token
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 1.5 Password Reset Flow
**Status**: ✅ IMPLEMENTED

**Backend Files**:
- [backend/controllers/authController.js](backend/controllers/authController.js)
  - `forgotPassword()` function
  - `resetPassword()` function
- [backend/routes/auth.js](backend/routes/auth.js)

**Frontend Files**:
- [src/screens/ForgotPasswordScreen.js](src/screens/ForgotPasswordScreen.js)
- [src/context/AuthContext.js](src/context/AuthContext.js)

**Features**:
- Email-based password reset
- Reset token with 1-hour expiry
- Password validation
- Email notification with reset link
- Frontend reset screen

**Flow**:
1. User enters email → receives reset link
2. User clicks link → goes to reset screen with token
3. User enters new password → password is updated
4. User can login with new password

**API Endpoints**:
```bash
POST /api/auth/forgot-password
{
  "email": "user@example.com"
}

POST /api/auth/reset-password
{
  "token": "...",
  "newPassword": "newsecurepass123"
}
```

---

### 1.6 Account Deletion
**Status**: ✅ IMPLEMENTED

**Backend Files**:
- [backend/controllers/authController.js](backend/controllers/authController.js) - `deleteAccount()` function
- [backend/routes/auth.js](backend/routes/auth.js) - DELETE `/api/auth/delete-account`

**Features**:
- Password verification before deletion
- User data cleanup
- JWT authentication required
- Cascading delete for related data (photos, messages, swipes)

**API Endpoint**:
```bash
DELETE /api/auth/delete-account
Authorization: Bearer <authToken>
{
  "password": "currentpassword"
}
```

---

## 2. Profile System

### 2.1 Multi-Photo Upload (4-6 images)
**Status**: ✅ IMPLEMENTED

**Backend Files**:
- [backend/controllers/profileController.js](backend/controllers/profileController.js) - `uploadPhotos()` function
- [backend/routes/profile.js](backend/routes/profile.js)

**Frontend Files**:
- [src/services/ProfileService.js](src/services/ProfileService.js) - `uploadPhotos()` method
- [src/screens/EditProfileScreen.js](src/screens/EditProfileScreen.js)

**Features**:
- Maximum 6 photos per profile
- Minimum 1 photo required
- Photo moderation status tracking (pending/approved/rejected)
- Image URI handling
- Validation before upload

**API Endpoint**:
```bash
POST /api/profile/photos/upload
Authorization: Bearer <authToken>
{
  "photos": [
    {
      "url": "https://...",
      "order": 0
    }
  ]
}

Response:
{
  "success": true,
  "message": "Photos uploaded successfully. They are pending moderation.",
  "data": {
    "photos": [...]
  }
}
```

---

### 2.2 Photo Reordering
**Status**: ✅ IMPLEMENTED

**Backend Files**:
- [backend/controllers/profileController.js](backend/controllers/profileController.js) - `reorderPhotos()` function
- [backend/routes/profile.js](backend/routes/profile.js) - PUT `/api/profile/photos/reorder`

**Frontend Files**:
- [src/services/ProfileService.js](src/services/ProfileService.js) - `reorderPhotos()` method
- [src/screens/EditProfileScreen.js](src/screens/EditProfileScreen.js)

**Features**:
- Drag-and-drop reordering support
- Photo order persistence
- Automatic re-indexing

**API Endpoint**:
```bash
PUT /api/profile/photos/reorder
Authorization: Bearer <authToken>
{
  "photoIds": ["photoId1", "photoId2", "photoId3"]
}
```

---

### 2.3 Bio Text Field (500 char max)
**Status**: ✅ IMPLEMENTED

**Backend Files**:
- [backend/models/User.js](backend/models/User.js) - bio field with maxlength: 500
- [backend/controllers/profileController.js](backend/controllers/profileController.js)

**Frontend Files**:
- [src/services/ProfileService.js](src/services/ProfileService.js) - `validateBio()` method
- [src/screens/EditProfileScreen.js](src/screens/EditProfileScreen.js)

**Features**:
- 500 character limit
- Real-time character count display
- Validation before save
- Trim whitespace

**API Endpoint**:
```bash
PUT /api/profile/update
Authorization: Bearer <authToken>
{
  "bio": "I love hiking and traveling..."
}
```

---

### 2.4 Basic Info (age, gender, name)
**Status**: ✅ IMPLEMENTED

**Backend Files**:
- [backend/models/User.js](backend/models/User.js)
  - name (string, required)
  - age (number, 18-100)
  - gender (enum: male, female, other)
- [backend/controllers/profileController.js](backend/controllers/profileController.js) - `updateProfile()` function

**Frontend Files**:
- [src/services/ProfileService.js](src/services/ProfileService.js)
  - `validateAge()` method
- [src/screens/EditProfileScreen.js](src/screens/EditProfileScreen.js)

**Features**:
- Age validation (18-100 range)
- Gender selection (male, female, other)
- Full name support
- Required field validation

**API Endpoint**:
```bash
PUT /api/profile/update
Authorization: Bearer <authToken>
{
  "name": "John Doe",
  "age": 25,
  "gender": "male"
}
```

---

### 2.5 Profile Photo Moderation Queue
**Status**: ✅ IMPLEMENTED

**Backend Files**:
- [backend/models/User.js](backend/models/User.js) - Photo schema with moderationStatus field
- [backend/controllers/profileController.js](backend/controllers/profileController.js)
  - `approvePhoto()` function
  - `rejectPhoto()` function
  - `getPendingPhotos()` function (admin)

**Features**:
- Three moderation statuses: pending, approved, rejected
- Admin-only approval/rejection endpoints
- Rejection reason tracking
- Pending photos queue retrieval

**Photo Schema**:
```javascript
{
  _id: ObjectId,
  url: String,
  order: Number,
  moderationStatus: 'pending' | 'approved' | 'rejected',
  rejectionReason: String (optional),
  uploadedAt: Date
}
```

**Admin API Endpoints**:
```bash
# Get pending photos for moderation
GET /api/admin/photos/pending
Authorization: Bearer <adminToken>

# Approve a photo
PUT /api/profile/photos/:photoId/approve
Authorization: Bearer <adminToken>

# Reject a photo
PUT /api/profile/photos/:photoId/reject
Authorization: Bearer <adminToken>
{
  "reason": "Violates community guidelines"
}
```

---

### 2.6 Edit Profile Interface
**Status**: ✅ IMPLEMENTED

**Frontend Files**:
- [src/screens/EditProfileScreen.js](src/screens/EditProfileScreen.js)

**Features**:
- Comprehensive profile editing UI
- Photo upload and management
- Bio editing with character counter
- Interest management (add/remove tags)
- Age and gender selection
- Profile completeness indicator
- Save changes functionality
- Loading and error states
- Success feedback

**Screen Structure**:
1. Photos section (with upload/delete/reorder)
2. Basic information (name, age, gender)
3. Bio section (with character count)
4. Interests section (add/remove tags)
5. Save button

---

## Environment Setup

### Required Environment Variables

**Backend (.env)**:
```bash
# Database
MONGODB_URI=mongodb+srv://...

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production

# Email Service
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

**Frontend (app.config.js extra)**:
```javascript
extra: {
  backendUrl: "http://localhost:3000/api",
  googleIosClientId: "...",
  googleAndroidClientId: "...",
  googleWebClientId: "...",
  firebaseApiKey: "...",
  firebaseAuthDomain: "...",
  firebaseProjectId: "...",
  firebaseStorageBucket: "...",
  firebaseMessagingSenderId: "...",
  firebaseAppId: "..."
}
```

---

## Dependencies

### Backend
```json
{
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.1.2",
  "nodemailer": "^6.9.7",
  "express": "^4.18.2",
  "mongoose": "^8.0.3"
}
```

### Frontend
```json
{
  "@react-native-async-storage/async-storage": "1.23.1",
  "expo-auth-session": "~6.0.0",
  "expo-image-picker": "~16.0.4"
}
```

---

## API Authentication

All protected endpoints require:
```
Authorization: Bearer <authToken>
```

The `authToken` is a JWT token with 7-day expiry. When it expires, use the `refreshToken` to obtain a new one.

---

## Testing the Implementation

### 1. Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepass123",
    "name": "Test User",
    "age": 25,
    "gender": "male"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepass123"
  }'
```

### 3. Update Profile
```bash
curl -X PUT http://localhost:3000/api/profile/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <authToken>" \
  -d '{
    "name": "Updated Name",
    "age": 26,
    "gender": "male",
    "bio": "Updated bio..."
  }'
```

### 4. Upload Photos
```bash
curl -X POST http://localhost:3000/api/profile/photos/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <authToken>" \
  -d '{
    "photos": [
      {
        "url": "https://example.com/photo1.jpg",
        "order": 0
      }
    ]
  }'
```

---

## Security Considerations

1. **Password Hashing**: Passwords are hashed using bcryptjs with 10 salt rounds
2. **JWT Tokens**: Tokens are signed and verified on each request
3. **Email Verification**: Required before full account access
4. **Phone Verification**: OTP-based with time-limited codes
5. **CORS**: Configured with specific origin restrictions
6. **Helmet**: Security headers enabled
7. **Input Validation**: Express-validator on all inputs
8. **Rate Limiting**: Recommended to add rate limiting in production
9. **HTTPS**: Should be enforced in production
10. **Environment Variables**: Sensitive data stored in .env file

---

## Next Steps

1. **SMS Integration**: Configure Twilio for phone verification
2. **Email Service**: Set up Gmail or SendGrid for email notifications
3. **Cloud Storage**: Integrate Firebase Storage or AWS S3 for photo storage
4. **Payment Integration**: Add Stripe for premium features
5. **Push Notifications**: Configure Firebase Cloud Messaging
6. **Admin Dashboard**: Build admin interface for photo moderation
7. **Testing**: Add comprehensive unit and integration tests
8. **Monitoring**: Set up error tracking and logging
9. **Rate Limiting**: Implement API rate limiting
10. **Performance**: Add caching and optimization

---

## Troubleshooting

### Email verification not sending
- Check EMAIL_USER and EMAIL_PASSWORD in .env
- Enable "Less secure app access" for Gmail
- Use app-specific password for Gmail accounts with 2FA

### Phone verification code not received
- Implement Twilio integration
- Check phone number format
- Verify Twilio credentials

### Photo moderation queue not working
- Ensure user has `isAdmin: true` in database
- Check authorization headers
- Verify MongoDB indexes created

### JWT token expired
- Use refresh token endpoint to get new token
- Implement automatic token refresh on frontend
- Check token expiry time in environment variables

---

## Support & Documentation

- **Backend API**: See [backend/README.md](backend/README.md)
- **Frontend**: See [README.md](README.md)
- **Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md)
