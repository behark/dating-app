# Quick Setup Guide for Tier 1 Features

## Prerequisites

- Node.js 18+
- MongoDB instance (local or MongoDB Atlas)
- Gmail account (for email verification)
- Twilio account (for SMS verification - optional)
- Expo CLI installed

## Installation & Configuration

### 1. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in backend directory:
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dating-app

# JWT Secrets (generate secure random strings)
JWT_SECRET=your-very-long-secret-key-for-jwt
JWT_REFRESH_SECRET=your-very-long-secret-key-for-refresh-token

# Email Configuration (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Frontend URL
FRONTEND_URL=http://localhost:3000
PORT=3000
```

**To get Gmail app password:**
1. Enable 2-Factor Authentication on your Google account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Generate an app-specific password for "Mail"
4. Use this password in EMAIL_PASSWORD

### 2. Frontend Setup

```bash
npm install
```

Update `app.config.js` with your Firebase and Google OAuth credentials:
```javascript
extra: {
  backendUrl: "http://localhost:3000/api",
  // ... other config
}
```

### 3. Running the Application

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**:
```bash
npm start
```

Then select your platform:
- Press `i` for iOS
- Press `a` for Android
- Press `w` for Web

## Testing Authentication Flow

### Test Registration
1. Open the app
2. Go to Register screen
3. Fill in email, password, name, age, gender
4. Submit
5. Check email for verification link
6. Click verification link to verify email

### Test Email/Password Login
1. Go to Login screen
2. Enter registered email and password
3. Click Sign In
4. You should be logged in

### Test Password Reset
1. Go to Forgot Password screen
2. Enter your email
3. Check email for reset link
4. Click link to reset password
5. Enter new password
6. Login with new password

### Test Phone Verification
1. Go to phone verification screen
2. Enter phone number (with country code, e.g., +1234567890)
3. You should receive SMS with code (configure Twilio for real SMS)
4. Enter code to verify

### Test Profile Editing
1. Login to app
2. Go to Profile/Edit Profile
3. Upload photos (up to 6)
4. Edit bio, interests, age, etc.
5. Save changes
6. Changes should persist on refresh

## API Testing with cURL

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234",
    "name": "Test User",
    "age": 25,
    "gender": "male"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234"
  }'
```

Copy the `authToken` from response.

### Get My Profile
```bash
curl -X GET http://localhost:3000/api/profile/me \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### Update Profile
```bash
curl -X PUT http://localhost:3000/api/profile/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "bio": "I love hiking and traveling",
    "interests": ["hiking", "travel", "photography"]
  }'
```

### Upload Photos
```bash
curl -X POST http://localhost:3000/api/profile/photos/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "photos": [
      {
        "url": "https://example.com/photo.jpg",
        "order": 0
      }
    ]
  }'
```

### Send Phone Verification
```bash
curl -X POST http://localhost:3000/api/auth/send-phone-verification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "phoneNumber": "+1234567890"
  }'
```

### Verify Phone
```bash
curl -X POST http://localhost:3000/api/auth/verify-phone \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "code": "123456"
  }'
```

## Troubleshooting

### "Cannot find module 'bcryptjs'"
```bash
cd backend
npm install bcryptjs jsonwebtoken nodemailer
```

### MongoDB connection failed
- Check MONGODB_URI in .env
- Ensure MongoDB is running
- Verify network access if using MongoDB Atlas
- Check IP whitelist in MongoDB Atlas

### Email verification not sending
- Check EMAIL_USER and EMAIL_PASSWORD
- Enable "Less secure apps" in Gmail settings
- Use app-specific password if 2FA enabled
- Check email service provider logs

### "CORS error when calling backend"
- Ensure backend is running on correct port
- Check CORS configuration in backend/server.js
- Verify frontend is calling correct API URL

### Photo upload failures
- Check photo URLs are valid and accessible
- Ensure array format: `{ "photos": [{ "url": "...", "order": 0 }] }`
- Verify token is not expired

## Common Issues & Solutions

### Getting 401 Unauthorized
- Token may be expired, use refresh token endpoint
- Check Authorization header format: `Bearer <token>`
- Verify token in AsyncStorage on frontend

### Photos not appearing
- Check moderationStatus - pending photos may not show
- Verify photos array is populated in database
- Check photo URLs are accessible

### Can't verify email
- Check email inbox (including spam folder)
- Verify EMAIL_USER credentials are correct
- Check token expiry (24 hours)
- Resend verification email if needed

### Phone verification not working
- Set up Twilio account and credentials
- Implement SMS sending in phoneController.js
- Test with valid phone number format

## Production Checklist

Before deploying to production:

- [ ] Change JWT_SECRET and JWT_REFRESH_SECRET
- [ ] Set NODE_ENV to 'production'
- [ ] Configure proper email service (SendGrid/Mailgun)
- [ ] Set up SMS service (Twilio)
- [ ] Configure cloud storage for photos (Firebase/S3)
- [ ] Enable HTTPS
- [ ] Set up rate limiting
- [ ] Configure CORS for production domain
- [ ] Set up error monitoring (Sentry)
- [ ] Configure backups for database
- [ ] Set up CDN for static assets
- [ ] Enable security headers (Helmet)
- [ ] Test payment integration if applicable
- [ ] Set up admin dashboard
- [ ] Configure staging environment

## Support

For issues or questions:
1. Check [TIER1_IMPLEMENTATION.md](TIER1_IMPLEMENTATION.md) for detailed documentation
2. Review error messages in backend logs
3. Check frontend console for errors
4. Verify all environment variables are set correctly
5. Test API endpoints with cURL before testing from app

## Next Features to Build

1. **Swipe/Discovery System** - Find and like profiles
2. **Matching** - When two users like each other
3. **Chat System** - Real-time messaging
4. **Premium Features** - Subscription system
5. **User Search** - Advanced filtering
6. **Notifications** - Push notifications for matches/messages
7. **Admin Dashboard** - User and content management
