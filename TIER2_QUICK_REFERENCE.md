# Tier 2 Quick Reference - Enhanced Profiles & Activity

## What's New - Quick Overview

### Enhanced Profile Fields
- ✅ Profile Prompts (icebreakers) - 3 max, 300 char answers
- ✅ Education (school, degree, field, graduation year)
- ✅ Occupation (job title, company, industry)
- ✅ Height (with cm/ft units)
- ✅ Ethnicity (3 selections)
- ✅ Spotify & Instagram integration
- ⏳ Video clips (6-15s) - schema ready, endpoints pending

### Activity Features
- ✅ Online status (online, active now, active X minutes ago, offline)
- ✅ Profile view counter
- ✅ Who viewed you (premium feature)
- ✅ Last active timestamp
- ✅ Activity indicator component

---

## Quick Integration Guide

### 1. Add Enhanced Profile Screen to Navigation

```javascript
// In your AppNavigator.js or navigation structure
import EnhancedProfileEditScreen from '../screens/EnhancedProfileEditScreen';

// Add to stack
Stack.Screen 
  name="EnhancedProfileEdit" 
  component={EnhancedProfileEditScreen}
  options={{ title: 'Complete Your Profile' }}
/>
```

### 2. Add Profile Views Screen

```javascript
import ProfileViewsScreen from '../screens/ProfileViewsScreen';

Stack.Screen 
  name="ProfileViews" 
  component={ProfileViewsScreen}
  options={{ title: 'Profile Views' }}
/>
```

### 3. Add Social Media Connection Screen

```javascript
import SocialMediaConnectionScreen from '../screens/SocialMediaConnectionScreen';

Stack.Screen 
  name="SocialMediaConnection" 
  component={SocialMediaConnectionScreen}
  options={{ title: 'Connect Social Media' }}
/>
```

### 4. Use Activity Indicator in User Cards

```javascript
import ActivityIndicator from '../components/ActivityIndicator';

// In your user card/profile component
<ActivityIndicator userId={user._id} showLabel={true} />
```

### 5. Record Profile Views

```javascript
import { ActivityService } from '../services/ActivityService';

// When user views another profile
const handleViewProfile = async (userId) => {
  try {
    await ActivityService.viewProfile(userId);
    // Navigate to profile
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### 6. Setup Online Status Tracking

```javascript
import { ActivityService } from '../services/ActivityService';
import { useFocusEffect } from '@react-navigation/native';

export default function YourScreen() {
  useFocusEffect(
    React.useCallback(() => {
      // Set online when screen focused
      ActivityService.updateOnlineStatus(true);
      
      // Send heartbeat every 5 minutes
      const heartbeatInterval = setInterval(() => {
        ActivityService.sendHeartbeat();
      }, 5 * 60 * 1000);
      
      return () => {
        clearInterval(heartbeatInterval);
        // Optionally set offline when leaving
        // ActivityService.updateOnlineStatus(false);
      };
    }, [])
  );
  
  // ... rest of component
}
```

---

## Backend API Examples

### Get Profile Prompts
```bash
curl http://localhost:3000/api/profile/prompts/list \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "success": true,
  "data": {
    "prompts": [
      "My ideal weekend is...",
      "I'm most passionate about...",
      "You'd be surprised to know..."
    ]
  }
}
```

### Update Profile Prompts
```bash
curl -X PUT http://localhost:3000/api/profile/prompts/update \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "prompts": [
      { "prompt": "My ideal weekend is...", "answer": "Hiking in the mountains" },
      { "prompt": "I am most passionate about...", "answer": "Technology and innovation" }
    ]
  }'
```

### Get Online Status
```bash
curl http://localhost:3000/api/activity/online-status/{userId} \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "active_5m_ago",
    "lastActive": "2024-01-20T10:30:00Z",
    "isOnline": false
  }
}
```

### Get Profile Views
```bash
curl http://localhost:3000/api/activity/profile-views \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "success": true,
  "data": {
    "totalViews": 42,
    "isPremium": true,
    "viewers": [
      {
        "userId": "user123",
        "userName": "John",
        "viewedAt": "2024-01-20T11:00:00Z"
      }
    ]
  }
}
```

### Connect Spotify
```bash
curl -X POST http://localhost:3000/api/social-media/connect-spotify \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "spotify_user",
    "profileUrl": "https://open.spotify.com/user/..."
  }'
```

---

## Frontend Service Quick Reference

### EnhancedProfileService
```javascript
import { EnhancedProfileService } from '../services/EnhancedProfileService';

// All methods
getAllPrompts()                    // Get 12 available prompts
updatePrompts(prompts)             // Save 3 prompts with answers
updateEducation(education)         // Save school, degree, field, year
updateOccupation(occupation)       // Save job, company, industry
updateHeight(height)               // Save height with unit
updateEthnicity(ethnicity)         // Save 3 ethnicities
```

### ActivityService
```javascript
import { ActivityService } from '../services/ActivityService';

// All methods
updateOnlineStatus(isOnline)       // Set online/offline
getOnlineStatus(userId)            // Get user's activity status
viewProfile(userId)                // Record profile view
getProfileViews()                  // Get your view count & viewers
getMultipleStatus(userIds)         // Get status for multiple users
sendHeartbeat()                    // Keep-alive signal
```

### SocialMediaService
```javascript
import { SocialMediaService } from '../services/SocialMediaService';

// All methods
connectSpotify(data)               // Connect Spotify account
connectInstagram(data)             // Connect Instagram account
disconnectSpotify()                // Remove Spotify
disconnectInstagram()              // Remove Instagram
getSocialMedia(userId)             // Get public social profiles
```

---

## Component Usage

### ActivityIndicator Component
```javascript
import ActivityIndicator from '../components/ActivityIndicator';

// Basic usage
<ActivityIndicator userId={user._id} />

// Without label (just dot)
<ActivityIndicator userId={user._id} showLabel={false} />
```

Displays:
- Green dot: Online or active now
- Orange dot: Active recently (within 5 minutes to 1 hour)
- Gray dot: Offline
- Text: "Online", "Active now", "Active 5m ago", etc.

---

## User Experience Flow

### Profile Completion Flow
1. User taps "Complete Profile" button
2. Opens EnhancedProfileEditScreen
3. User swipes through tabs:
   - Prompts: Select 3 and answer each
   - Education: Fill in school/degree info
   - Work: Fill in job/company info
   - Height: Enter height with unit
   - Ethnicity: Select up to 3
4. Each tab has save button
5. Success message shows after save

### Activity Status Flow
1. User opens app → online status set to true
2. User closes app → online status set to false
3. System sends heartbeat every 5 minutes while active
4. Activity status shown on profile cards

### Profile Views Flow
1. User views another person's profile
2. ViewProfile API called to record view
3. Viewer can later check their profile views
4. If premium, see list of who viewed
5. If not premium, see only count

### Social Media Connection Flow
1. User taps "Connect Spotify"
2. Enters Spotify username
3. Account saved and shown on profile
4. Can disconnect anytime
5. Same for Instagram

---

## Configuration

### Activity Status Calculation
Server-side calculation based on `lastActive` timestamp:
- **Online**: `isOnline === true`
- **Active now**: `lastActive < 5 minutes ago`
- **Active Xm ago**: `lastActive < 60 minutes ago`
- **Active Xh ago**: `lastActive < 24 hours ago`
- **Offline**: Everything else

### Profile View Deduplication
- One view per user per 24 hours
- Checks if user already viewed in last 24h
- Prevents view count spam

### Premium Features
- **Requires**: `isPremium === true` and `premiumExpiresAt > now`
- **Gate**: Who viewed me (detailed viewers list)
- **Fallback**: Non-premium users see total count only

---

## Database Indexes (Recommended)

For optimal performance, add these MongoDB indexes:

```javascript
// User model indexes
db.users.createIndex({ "lastActive": 1 });
db.users.createIndex({ "profileViewCount": 1 });
db.users.createIndex({ "isOnline": 1 });
db.users.createIndex({ "profileViewedBy.userId": 1 });
```

---

## Testing Checklist

### Manual Testing
- [ ] Can select and answer 3 prompts
- [ ] Can enter education information
- [ ] Can enter occupation information
- [ ] Can set height with cm/ft toggle
- [ ] Can select up to 3 ethnicities
- [ ] Online status shows correctly
- [ ] Activity indicator updates every 30 seconds
- [ ] Profile view counter increments
- [ ] Can see profile viewers (if premium)
- [ ] Can connect/disconnect Spotify
- [ ] Can connect/disconnect Instagram

### API Testing
- [ ] All endpoints return correct status codes
- [ ] Input validation works
- [ ] Authentication required on protected routes
- [ ] Premium gating works on viewers list
- [ ] Profile view deduplication works
- [ ] Timestamps stored correctly

---

## Common Issues & Solutions

**Issue**: Activity indicator not updating
- **Solution**: Check that `refreshing` state is false between refreshes

**Issue**: Profile views not counting
- **Solution**: Ensure `viewProfile()` is called before navigating to profile

**Issue**: Social media won't connect
- **Solution**: Check username format and ensure profile is public

**Issue**: Premium gating not working
- **Solution**: Verify `isPremium` flag and `premiumExpiresAt` in database

**Issue**: Online status stuck on "online"
- **Solution**: Ensure app calls `updateOnlineStatus(false)` on logout or app close

---

## Next Phase (Tier 3 - Future)

Recommended features to implement next:
- Video clips with upload and moderation
- Payment/subscription system for premium
- Match algorithm improvements
- Messaging with read receipts
- Notifications system
- User blocking/reporting
- Advanced profile search filters

---

**Status**: Tier 2 Features Ready for Testing ✅
**Backend**: 100% Complete
**Frontend**: 95% Complete (video endpoints pending)
**Integration Points**: Ready for App Integration
