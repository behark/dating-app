# Features 12 & 13 - Quick Reference Guide

## Feature 12: Advanced Interactions

### 1. Super Like (5/day free, unlimited premium)
**Usage**: Navigate to profile → tap "Super Like" button
```
POST /api/interactions/super-like
Body: { recipientId, message? }
Response: { superLikeId, isMatch, remaining }
```
**Files**: SuperLike.js, SuperLikeScreen.js

### 2. Rewind (1/day free, unlimited premium)
**Usage**: Tap "Undo" button after swiping
```
POST /api/interactions/rewind
Response: { rewindId, rewindAction, targetUser }
```
**Files**: Rewind.js

### 3. Boost Profile (1/day free, unlimited premium)
**Usage**: Profile tab → tap "Boost Profile"
```
POST /api/interactions/boost
Body: { durationMinutes? }
Response: { boostId, endsAt, visibilityMultiplier }
```
**Files**: BoostProfile.js

### 4. GIFs & Stickers
**Usage**: Chat screen → tap GIF/sticker icon
```
POST /api/chat/media/gif | /sticker
GET /api/chat/media/gifs/popular | /search | /sticker-packs
```
**Components**: GifPickerModal.js, StickerPickerModal.js

### 5. Voice Messages
**Usage**: Chat screen → hold microphone button to record
```
POST /api/chat/media/voice
Body: { matchId, voiceUrl, duration, language }
POST /api/chat/media/voice/transcribe
```
**Hook**: useVoiceMessage.js (guide in SOCKET_IO_INTEGRATION.md)

### 6. Video Calls
**Usage**: Chat screen → tap camera icon
```
POST /api/chat/media/video-call/initiate
PUT /api/chat/media/video-call/status
Socket: video-call:initiate, :accept, :decline, :end
```
**Hook**: useVideoCall.js (guide in SOCKET_IO_INTEGRATION.md)

## Feature 13: Discovery Enhancements

### 1. Explore/Browse Mode
**Usage**: Tap "Explore" tab
```
GET /api/discovery/explore?lat=x&lng=y&minAge=18&maxAge=50&gender=any&sortBy=recentActivity
sortBy options: recentActivity | profileQuality | verified | boosted
```
**Screen**: ExploreScreen.js
**Features**: Grid view, filters, distance, boost badge, verified badge

### 2. Top Picks
**Usage**: Tap "Top Picks" tab
```
GET /api/discovery/top-picks?limit=10
Response: [{ userId, compatibilityScore, scoreBreakdown, rankPosition }]
```
**Screen**: TopPicksScreen.js
**Features**: Swipeable cards, compatibility percentage, why-picker display

### 3. Recently Active Users
**Usage**: Part of Explore or separate section
```
GET /api/discovery/recently-active?hoursBack=24&limit=20
Tracks: login, profile_view, swipe, message, match, super_like, video_call, profile_update
```
**Model**: UserActivity.js (auto-deletes after 90 days)

### 4. Verified Profiles Badge
**Usage**: Shows on profiles, appears in verified filter
```
POST /api/discovery/verify-profile
Body: { verificationMethod: 'photo' | 'video' | 'id' }

Admin:
POST /api/discovery/approve-verification
Body: { userId }
```
**Display**: Green checkmark badge ✓

## API Base URLs

```javascript
const API_BASE_URL = 'http://localhost:3000/api';

// Advanced Interactions
/interactions/super-like
/interactions/super-like-quota
/interactions/rewind
/interactions/rewind-quota
/interactions/boost
/interactions/boost-quota

// Discovery
/discovery/explore
/discovery/top-picks
/discovery/recently-active
/discovery/verified
/discovery/verify-profile
/discovery/approve-verification

// Media Messages
/chat/media/gif
/chat/media/sticker
/chat/media/gifs/popular
/chat/media/gifs/search
/chat/media/sticker-packs
/chat/media/voice
/chat/media/voice/transcribe
/chat/media/video-call/initiate
/chat/media/video-call/status
```

## Premium vs Free Limits

| Feature | Free | Premium |
|---------|------|---------|
| Super Likes/day | 5 | Unlimited |
| Rewinds/day | 1 | Unlimited |
| Boosts/day | 1 | Unlimited |
| Boost Multiplier | 3x | 5x |
| Top Picks Priority | Standard | High |
| Visibility | Standard | Enhanced |

## Model Quick Reference

### SuperLike
- senderId, recipientId, message, isViewed, viewedAt

### Rewind
- userId, originalSwipeId, swipedUserId, originalAction, success

### BoostProfile
- userId, durationMinutes, startedAt, endsAt, isActive, visibilityMultiplier, impressions

### TopPicks
- userId, forUserId, compatibilityScore, scoreBreakdown, rankPosition, isSeen

### UserActivity
- userId, activityType, relatedUserId, metadata, createdAt (TTL: 90 days)

### User (Extended)
- superLikeUsageToday, rewindUsageToday, boostUsageToday, activeBoostId
- isProfileVerified, verificationStatus, verificationMethod, verificationDate
- lastActivityAt, activityScore, totalSwipes, totalMatches, responseRate

### Message (Extended)
- type: 'gif' | 'sticker' | 'voice' | 'video_call'
- mediaUrl, mediaMetadata, voiceMessage, videoCall, reactions

## Services

```javascript
// Advanced Interactions
import AdvancedInteractionsService from '../services/AdvancedInteractionsService';
const service = new AdvancedInteractionsService(authToken);
await service.sendSuperLike(recipientId, message);
await service.rewindLastSwipe();
await service.boostProfile(30);

// Discovery
import DiscoveryService from '../services/DiscoveryService';
const service = new DiscoveryService(authToken);
await service.exploreUsers(lat, lng, options);
await service.getTopPicks(10);
await service.getRecentlyActiveUsers(24, 20);
await service.getVerifiedProfiles(lat, lng, options);

// Media Messages
import MediaMessagesService from '../services/MediaMessagesService';
const service = new MediaMessagesService(authToken);
await service.sendGif(matchId, gifUrl, gifId);
await service.sendSticker(matchId, stickerUrl, packId, stickerId);
await service.sendVoiceMessage(matchId, voiceUrl, duration);
await service.initiateVideoCall(matchId, callId);
```

## Frontend Integration Checklist

- [ ] Add SuperLikeScreen to navigation
- [ ] Add ExploreScreen to tab navigation
- [ ] Add TopPicksScreen to tab navigation
- [ ] Add Super Like button to ProfileViewScreen
- [ ] Integrate GifPickerModal to ChatScreen
- [ ] Integrate StickerPickerModal to ChatScreen
- [ ] Add voice recording button to ChatScreen
- [ ] Add video call button to ChatScreen
- [ ] Connect useVideoCall hook to ChatContext
- [ ] Connect useVoiceMessage hook to ChatContext
- [ ] Setup useActivityTracking in AppNavigator
- [ ] Configure Socket.IO events in ChatContext
- [ ] Add boost badge to profile cards
- [ ] Add verified badge to profile cards
- [ ] Test premium feature gating

## Socket.IO Events

```javascript
// Video Calls
socket.emit('video-call:initiate', { matchId, callId, recipientId });
socket.emit('video-call:accept', { matchId, callId });
socket.emit('video-call:decline', { matchId, callId });
socket.emit('video-call:end', { matchId, callId, duration });
socket.emit('video-call:offer', { matchId, offer });
socket.emit('video-call:answer', { matchId, answer });
socket.emit('video-call:ice-candidate', { matchId, candidate });

// Voice Messages
socket.emit('voice-message:sent', { matchId, messageId, duration });
socket.emit('voice-message:start', { matchId });
socket.emit('voice-message:cancel', { matchId });

// Activity
socket.emit('user:active');
socket.emit('user:inactive');

// Listening
socket.on('video-call:incoming', (data) => {});
socket.on('video-call:accepted', (data) => {});
socket.on('voice-message:received', (data) => {});
socket.on('profile:boosted-active', (data) => {});
```

## Documentation Files

1. **FEATURES_12_13_IMPLEMENTATION.md** - Detailed implementation guide
2. **FEATURES_12_13_TESTING.md** - Complete testing checklist and examples
3. **SOCKET_IO_INTEGRATION.md** - Socket.IO setup and WebRTC integration
4. **FEATURES_12_13_COMPLETE.md** - Full completion summary

## Common Issues & Solutions

### Super Like Limit Not Working
- Check `User.isPremium` status
- Verify daily reset (UTC midnight)
- Check `superLikeUsageToday` counter

### Explore Not Finding Users
- Verify 2dsphere index on location
- Check coordinates are valid lat/lng
- Ensure user location is set

### Top Picks Empty
- Run `TopPicks.recalculateForUser(userId)`
- Check compatibility algorithm
- Verify candidate users exist

### Video Call Not Connecting
- Check Socket.IO events firing
- Verify TURN/STUN servers configured
- Check WebRTC peer connection state

## Performance Tips

1. Cache top picks for 24 hours
2. Use pagination for explore (limit 20)
3. Index frequently queried fields
4. Compress media files
5. Use CDN for images/videos
6. Debounce activity events (max 1/5s)

## Security Reminders

- ✅ Always verify `req.user.isPremium` for unlimited features
- ✅ Validate `recipientId` exists before super like
- ✅ Check `originalSwipeId` exists before rewind
- ✅ Rate limit all interactions
- ✅ Validate media URLs and types
- ✅ Use HTTPS/WSS for all connections
- ✅ Validate Socket.IO authentication

## Deployment Steps

1. Run migrations for new models
2. Create indexes on all new collections
3. Deploy backend controllers and routes
4. Update frontend navigation
5. Configure Socket.IO on production
6. Setup TURN servers for video calls
7. Configure Giphy API key for GIF search
8. Set SSL certificates for WSS
9. Monitor error logs
10. Test all features in staging

---

**Quick Test**: 
```bash
# Test super like
curl -X POST http://localhost:3000/api/interactions/super-like \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipientId":"USER_ID","message":"Hi!"}'

# Test explore
curl -X GET "http://localhost:3000/api/discovery/explore?lat=40.7128&lng=-74.0060&minAge=25&maxAge=35&gender=any" \
  -H "Authorization: Bearer $TOKEN"

# Test top picks
curl -X GET http://localhost:3000/api/discovery/top-picks?limit=5 \
  -H "Authorization: Bearer $TOKEN"
```

**Current Status**: ✅ ALL FEATURES IMPLEMENTED AND DOCUMENTED
