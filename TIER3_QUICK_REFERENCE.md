# TIER 3 Features - Quick Reference

## 🎮 Gamification Quick Start

### 1. Swipe Streaks
**What**: Track consecutive days of swiping
**Key Model**: `SwipeStreak`
**Main Service**: `GamificationService.updateSwipeStreak()`
**Component**: `<StreakCard />`

```javascript
// Track a swipe
await GamificationService.trackSwipe(userId);

// Get streak
const streak = await GamificationService.getSwipeStreak(userId);
console.log(streak.currentStreak); // Days
```

**Milestones**: 7, 14, 30, 60, 100 days → Award badges + points

---

### 2. Daily Login Rewards
**What**: Rewards for logging in and daily activities
**Key Model**: `DailyReward`
**Main Service**: `GamificationService.createDailyReward()`
**Component**: `<DailyRewardNotification />`

```javascript
// Get unclaimed rewards
const data = await GamificationService.getDailyRewards(userId);
data.unclaimedRewards.forEach(reward => {
  console.log(reward.rewardValue); // Points
});

// Claim reward
await GamificationService.claimReward(rewardId);
```

**Reward Types**: login, swipe, match, message, profile_view

---

### 3. Achievement Badges
**What**: Unlockable badges for achievements
**Key Model**: `AchievementBadge`
**Main Service**: `GamificationService.awardBadge()`
**Component**: `<BadgeShowcase />`

```javascript
// Get all badges
const data = await GamificationService.getUserBadges(userId);
data.badges.forEach(badge => {
  if (badge.isUnlocked) {
    console.log(`🏆 ${badge.badgeName}`);
  }
});

// Manually award (usually automatic)
await GamificationService.awardBadge(userId, 'first_match', ...);
```

**Rarities**: common, uncommon, rare, epic, legendary

---

### 4. Leaderboards (Optional)
**What**: Competitive rankings
**Main Service**: `GamificationService.getStreakLeaderboard()`

```javascript
// Get top 10 current streaks
const data = await GamificationService.getStreakLeaderboard(10);
data.leaderboard.map((user, i) => 
  console.log(`${i+1}. ${user.userId.name}: ${user.currentStreak} days`)
);
```

---

## 👫 Social Features Quick Start

### 1. Group Dates
**What**: Organized group dating events
**Key Model**: `GroupDate`
**Main Service**: `SocialFeaturesService`

```javascript
// Create group date
await SocialFeaturesService.createGroupDate({
  hostId: userId,
  title: "Happy Hour",
  eventType: "drinks",
  location: { type: "Point", coordinates: [lon, lat] },
  startTime: new Date(),
  maxParticipants: 8
});

// Get nearby
const data = await SocialFeaturesService.getNearbyGroupDates(lon, lat);

// Join
await SocialFeaturesService.joinGroupDate(groupDateId, userId);
```

**Status Flow**: planning → open → full → completed

---

### 2. Friend Reviews
**What**: Peer reviews of other users
**Key Model**: `FriendReview`
**Main Service**: `SocialFeaturesService`

```javascript
// Create review
await SocialFeaturesService.createFriendReview({
  reviewerId: userId,
  revieweeId: otherUserId,
  rating: 4,
  categories: {
    friendliness: 5,
    authenticity: 4,
    reliability: 4,
    conversationSkills: 3
  },
  comment: "Great person!",
  wouldRecommend: true
});

// Get reviews
const data = await SocialFeaturesService.getUserReviews(userId);
console.log(data.stats.averageRating);
```

**Review Types**: private_match, friend_opinion, group_date_participant

---

### 3. In-App Events
**What**: Platform and user-organized events
**Key Model**: `Event`
**Main Service**: `SocialFeaturesService`

```javascript
// Create event
await SocialFeaturesService.createEvent({
  organizerId: userId,
  title: "Tech Singles Mixer",
  category: "networking",
  location: { type: "Point", coordinates: [lon, lat] },
  startTime: new Date(),
  maxAttendees: 100,
  ticketPrice: 25
});

// Register
await SocialFeaturesService.registerForEvent(eventId, userId);

// Get nearby by category
const data = await SocialFeaturesService.getNearbyEvents(lon, lat, 10000, "networking");
```

**Categories**: networking, singles_mixer, social_party, speed_dating, activity, workshop

---

### 4. Share Profile Externally
**What**: Shareable profile links
**Key Model**: `SharedProfile`
**Main Service**: `SocialFeaturesService`

```javascript
// Create share link
const result = await SocialFeaturesService.createShareableProfileLink(
  userId,
  "link", // or "qr_code", "instagram", "email"
  "Check me out!"
);
console.log(result.shareUrl); // Send to friends

// View shared profile (public endpoint)
const profileData = await SocialFeaturesService.getSharedProfile(shareToken);

// Get all links
const data = await SocialFeaturesService.getUserSharedProfiles(userId);
data.sharedProfiles.forEach(link => {
  console.log(`${link.viewCount} views`);
});

// Deactivate link
await SocialFeaturesService.deactivateShareLink(shareToken);
```

**Expiration**: 30 days by default

---

## 📍 API Endpoints Summary

### Gamification
```
POST   /api/gamification/streaks/track
GET    /api/gamification/streaks/:userId
GET    /api/gamification/leaderboards/streaks
GET    /api/gamification/leaderboards/longest-streaks
POST   /api/gamification/badges/award
GET    /api/gamification/badges/:userId
POST   /api/gamification/badges/:userId/update
GET    /api/gamification/rewards/:userId
POST   /api/gamification/rewards/:rewardId/claim
GET    /api/gamification/stats/:userId
```

### Social Features
```
POST   /api/social/group-dates
POST   /api/social/group-dates/:groupDateId/join
POST   /api/social/group-dates/:groupDateId/leave
GET    /api/social/group-dates/nearby
POST   /api/social/reviews
GET    /api/social/reviews/:userId
POST   /api/social/events
POST   /api/social/events/:eventId/register
GET    /api/social/events/nearby
POST   /api/social/share-profile/:userId
GET    /api/social/shared-profile/:shareToken [NO AUTH]
GET    /api/social/share-profile/:userId/links
DELETE /api/social/share-profile/:shareToken
```

---

## 🎯 Integration Checklist

### Backend
- [x] Create all 7 models
- [x] Create 2 controllers
- [x] Create 2 route files
- [x] Create 2 service files
- [x] Register routes in server.js
- [ ] Add authentication middleware to routes
- [ ] Add input validation
- [ ] Add error handling
- [ ] Create database indexes

### Frontend
- [x] Create 3 gamification components
- [x] Create 3 social feature screens
- [x] Create 2 service files
- [ ] Integrate into existing screens
- [ ] Update navigation
- [ ] Add context/state management
- [ ] Add error handling
- [ ] Add loading states

### Testing
- [ ] Unit tests for services
- [ ] Integration tests for API
- [ ] E2E tests for features
- [ ] Performance testing

### Deployment
- [ ] Update environment variables
- [ ] Run database migrations
- [ ] Update API documentation
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Monitor performance

---

## 🚀 Feature Flags

Add to `.env`:
```
GAMIFICATION_ENABLED=true
SOCIAL_FEATURES_ENABLED=true
LEADERBOARDS_ENABLED=false
```

In code:
```javascript
if (process.env.GAMIFICATION_ENABLED) {
  // Show gamification features
}
```

---

## 📊 Key Metrics to Track

### Gamification
- Active streaks
- Average streak length
- Daily reward claim rate
- Badge unlock rate

### Social Features
- Group dates created/joined
- Event registrations
- Friend reviews submitted
- Profile shares/views

---

## 🔗 Important Files

**Backend**
- Models: `backend/models/SwipeStreak.js`, `DailyReward.js`, `AchievementBadge.js`
- Models: `backend/models/GroupDate.js`, `FriendReview.js`, `Event.js`, `SharedProfile.js`
- Controllers: `backend/controllers/gamificationController.js`, `socialFeaturesController.js`
- Services: `backend/services/GamificationService.js`, `SocialFeaturesService.js`
- Routes: `backend/routes/gamification.js`, `socialFeatures.js`

**Frontend**
- Components: `src/components/Gamification/StreakCard.js`, `BadgeShowcase.js`, `DailyRewardNotification.js`
- Screens: `src/screens/GroupDatesScreen.js`, `EventsScreen.js`, `ProfileSharingScreen.js`
- Services: `src/services/GamificationService.js`, `SocialFeaturesService.js`

---

## 💡 Pro Tips

1. **Batch Badge Updates**: Call `updateBadgesForUser()` after matches, not every swipe
2. **Cache Leaderboards**: Update every 1 hour, not on every request
3. **Async Streak Updates**: Track swipes asynchronously to avoid blocking UI
4. **Cleanup Old Data**: Use TTL indexes for expired rewards and share links
5. **Rate Limit**: Prevent abuse of reward claiming and profile sharing

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Streaks not tracking | Check timestamp format (UTC) and timezone handling |
| Badges stuck | Verify progression calculation and trigger conditions |
| Events not showing | Check geospatial index and coordinate format [lon, lat] |
| Share links broken | Verify token generation and frontend URL config |

---

**Version**: 1.0.0  
**Last Updated**: January 2026
