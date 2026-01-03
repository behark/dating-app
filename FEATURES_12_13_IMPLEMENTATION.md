# Feature 12 & 13 Implementation Guide

## Overview
This document outlines the implementation of Advanced Interactions (Feature 12) and Discovery Enhancements (Feature 13) for the dating app.

## Feature 12: Advanced Interactions

### 1. Super Like (5/day free, unlimited for premium)
- **Endpoint**: `POST /api/interactions/super-like`
- **Model**: `SuperLike.js`
- **Controller**: `advancedInteractionsController.js`
- **Frontend Screen**: `SuperLikeScreen.js`

**How it works**:
- Free users get 5 super likes per day
- Premium users get unlimited super likes
- Super likes include an optional message
- 2x more likely to result in matches
- Recipient is notified

**Daily Reset**: Resets at UTC midnight

### 2. Rewind (1/day free, unlimited for premium)
- **Endpoint**: `POST /api/interactions/rewind`
- **Model**: `Rewind.js`
- **Controller**: `advancedInteractionsController.js`

**How it works**:
- Undo your last swipe
- Free users: 1 per day
- Premium users: unlimited
- Deletes original swipe and creates rewind record

### 3. Boost Profile (1/day free, unlimited for premium)
- **Endpoint**: `POST /api/interactions/boost`
- **Model**: `BoostProfile.js`
- **Controller**: `advancedInteractionsController.js`

**How it works**:
- Increases profile visibility for 30 minutes
- Free: 3x visibility multiplier
- Premium: 5x visibility multiplier
- Profile appears at top of discovery results
- Active boost info returned with user data

### 4. GIFs/Stickers Support
- **Endpoints**: 
  - `POST /api/chat/media/gif` - Send GIF
  - `POST /api/chat/media/sticker` - Send sticker
  - `GET /api/chat/media/gifs/popular` - Get popular GIFs
  - `GET /api/chat/media/gifs/search?query=...` - Search GIFs
  - `GET /api/chat/media/sticker-packs` - Get sticker packs

**Models**: Message type extended to support 'gif' and 'sticker'

### 5. Voice Messages
- **Endpoints**:
  - `POST /api/chat/media/voice` - Send voice message
  - `POST /api/chat/media/voice/transcribe` - Transcribe voice

**Features**:
- Duration tracking (1-300 seconds)
- Language support
- Optional AI transcription
- Media metadata storage

### 6. Video Calls
- **Endpoints**:
  - `POST /api/chat/media/video-call/initiate` - Start call
  - `PUT /api/chat/media/video-call/status` - Update call status

**Features**:
- Initiation via message
- Status tracking (pending, accepted, declined, missed, ended)
- Duration recording
- Call history

## Feature 13: Discovery Enhancements

### 1. Explore/Browse Mode
- **Endpoint**: `GET /api/discovery/explore`
- **Frontend Screen**: `ExploreScreen.js`

**Filters**:
- Age range
- Gender
- Distance
- Sort options: recentActivity, profileQuality, verified, boosted

**Response**: Grid view of users with profiles and boosted/verified badges

### 2. Top Picks Algorithm
- **Endpoint**: `GET /api/discovery/top-picks`
- **Model**: `TopPicks.js`
- **Frontend Screen**: `TopPicksScreen.js`

**Scoring Factors**:
- Age compatibility
- Location compatibility
- Interest compatibility
- Height compatibility
- Ethnicity compatibility
- Occupation compatibility
- Profile quality
- Engagement score

**Update Frequency**: Calculated daily or on-demand

**Caching**: Stores compatibility scores for quick retrieval

### 3. Recently Active Users
- **Endpoint**: `GET /api/discovery/recently-active`
- **Model**: `UserActivity.js`

**Tracking**:
- Login events
- Profile views
- Swipes
- Messages
- Matches
- Activity stored for 90 days (auto-delete TTL)

**Response**: List of recently active users (last 24 hours by default)

### 4. Verified Profiles Badge
- **Endpoints**:
  - `POST /api/discovery/verify-profile` - User initiates verification
  - `POST /api/discovery/approve-verification` - Admin approves

**Verification Methods**:
- Photo verification
- Video verification
- ID verification

**Fields**:
- `isProfileVerified` - Boolean
- `verificationStatus` - unverified, pending, verified, rejected
- `verificationMethod` - photo, video, id, none
- `verificationDate` - Timestamp

## Database Modifications

### User Schema Additions
```javascript
// Feature 12 fields
superLikeUsageToday: Number
superLikeResetTime: Date
rewindUsageToday: Number
rewindResetTime: Date
boostUsageToday: Number
boostResetTime: Date
activeBoostId: ObjectId

// Feature 13 fields
isProfileVerified: Boolean
verificationStatus: String (enum)
verificationMethod: String (enum)
verificationDate: Date
lastActivityAt: Date
activityScore: Number (0-100)
totalSwipes: Number
totalMatches: Number
totalConversations: Number
responseRate: Number (0-100)
```

### Message Schema Extensions
```javascript
type: String (enum: 'text', 'image', 'gif', 'sticker', 'voice', 'video_call', 'system')
mediaUrl: String
mediaMetadata: {
  width, height, size, mimeType, duration, gifId, stickerPackId
}
voiceMessage: {
  duration, transcript, isTranscribed, language
}
videoCall: {
  callId, initiatedBy, duration, status, endedAt
}
reactions: Array of reactions with emoji and userId
```

## Integration Points

### Socket.IO Events (Server)
```javascript
// Video calls
socket.on('video-call:initiate', (data) => {})
socket.on('video-call:accept', (data) => {})
socket.on('video-call:decline', (data) => {})
socket.on('video-call:end', (data) => {})

// Voice messages
socket.on('voice-message:sent', (data) => {})

// Activity tracking
socket.on('user:active', (data) => {})
socket.on('user:inactive', (data) => {})

// Real-time updates
socket.on('discovery:boost-update', (data) => {})
```

## Frontend Integration

### Navigation Structure
```
HomeScreen
├── ExploreScreen (new)
├── TopPicksScreen (new)
├── RecentlyActiveScreen (could be part of ExploreScreen)
├── SuperLikeScreen (modal from ProfileViewScreen)
├── ChatScreen
│   ├── GIF picker
│   ├── Sticker picker
│   ├── Voice message recorder
│   └── Video call button
```

### Context Updates
- `ChatContext`: Add media message handlers
- `AuthContext`: Track premium status and feature quotas
- New context: `DiscoveryContext` for tracking explore state

## Premium Features

### Free Users
- 5 Super likes/day
- 1 Rewind/day
- 1 Boost/day
- Standard visibility in discovery
- Limited to verified profiles filter

### Premium Users
- Unlimited super likes
- Unlimited rewinds
- Unlimited boosts
- 5x visibility multiplier on boosts
- Priority in top picks algorithm
- Blue verified badge

## Testing Checklist

- [ ] Super like limit enforcement (5/day free)
- [ ] Premium unlimited verification
- [ ] Rewind successfully undoes swipe
- [ ] Boost visibility multiplier working
- [ ] GIF search and sending
- [ ] Sticker pack loading
- [ ] Voice message recording/sending
- [ ] Video call initiation
- [ ] Explore filters working
- [ ] Top picks algorithm scoring
- [ ] Recently active list accurate
- [ ] Verified badge displaying
- [ ] Activity tracking logging
- [ ] Daily quota resets at midnight
- [ ] Socket.IO real-time updates

## API Response Examples

### Super Like Response
```json
{
  "success": true,
  "message": "Super like sent successfully",
  "data": {
    "superLikeId": "id",
    "isMatch": false,
    "recipientName": "John",
    "remaining": 4
  }
}
```

### Top Picks Response
```json
{
  "success": true,
  "data": {
    "topPicks": [
      {
        "_id": "id",
        "userId": { /* user data */ },
        "compatibilityScore": 87,
        "scoreBreakdown": { /* breakdown */ },
        "rankPosition": 1
      }
    ],
    "count": 10
  }
}
```

### Explore Response
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "id",
        "name": "Jane",
        "age": 25,
        "isBoosted": true,
        "distance": 2.5,
        /* more fields */
      }
    ],
    "count": 20
  }
}
```

## Performance Considerations

1. **Caching**: Top picks calculated once daily and cached
2. **Indexing**: Proper indexes on activity tracking and discovery queries
3. **Pagination**: All discovery endpoints support pagination
4. **Media Compression**: GIFs/voice files should be compressed
5. **TTL Indexes**: Activity records auto-delete after 90 days
6. **Real-time**: Socket.IO used for live updates only when necessary

## Future Enhancements

1. Machine learning for better top picks algorithm
2. Advanced video call features (screen sharing, group calls)
3. Sticker packs marketplace
4. Voice message transcription in multiple languages
5. Analytics dashboard for boost effectiveness
6. A/B testing for discovery algorithm
