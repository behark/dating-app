# TIER 3: Nice-to-Have Features Implementation Guide

## Overview

This document provides a comprehensive guide to the TIER 3 features implementation, which includes:
- **Feature 15: Social Features** (Group Dates, Friend Reviews, In-App Events, Profile Sharing)
- **Feature 16: Gamification** (Swipe Streaks, Daily Login Rewards, Achievement Badges, Leaderboards)

## Table of Contents

1. [Feature 15: Social Features](#feature-15-social-features)
   - [Group Dates](#group-dates)
   - [Friend Reviews](#friend-reviews)
   - [In-App Events & Meetups](#in-app-events--meetups)
   - [Share Profile Externally](#share-profile-externally)

2. [Feature 16: Gamification](#feature-16-gamification)
   - [Swipe Streaks](#swipe-streaks)
   - [Daily Login Rewards](#daily-login-rewards)
   - [Achievement Badges](#achievement-badges)
   - [Leaderboards](#leaderboards)

3. [API Documentation](#api-documentation)
4. [Frontend Integration](#frontend-integration)
5. [Database Schema](#database-schema)

---

## Feature 15: Social Features

### Group Dates

**Purpose**: Allow users to organize and join group dating events with matched users.

#### Database Model: `GroupDate`

```javascript
{
  _id: ObjectId,
  hostId: UserId,                    // User who created the group date
  title: String,
  description: String,
  eventType: String,                 // 'dinner', 'drinks', 'activity', etc.
  location: GeoJSON Point,
  locationName: String,
  address: String,
  startTime: Date,
  endTime: Date,
  maxParticipants: Number,
  currentParticipants: [{
    userId: UserId,
    joinedAt: Date,
    status: String                   // 'interested', 'going', 'not_going', 'attended'
  }],
  requiredCriteria: {
    ageRange: { min, max },
    genders: [String]
  },
  status: String,                    // 'planning', 'open', 'full', 'cancelled', 'completed'
  coverImage: String,
  tags: [String],
  isPublic: Boolean,
  isFriendsOnly: Boolean,
  reviews: [ReviewObject],
  averageRating: Number,
  chatGroupId: ChatGroupId            // For group messaging
}
```

#### API Endpoints

**Create Group Date**
```
POST /api/social/group-dates
Body: {
  hostId: "userId",
  title: "Happy Hour at The Bar",
  description: "Casual drinks with other singles",
  eventType: "drinks",
  location: { type: "Point", coordinates: [lon, lat] },
  locationName: "The Bar",
  address: "123 Main St",
  startTime: "2026-01-15T18:00:00Z",
  endTime: "2026-01-15T21:00:00Z",
  maxParticipants: 8,
  tags: ["casual", "drinks", "downtown"]
}
```

**Join Group Date**
```
POST /api/social/group-dates/:groupDateId/join
Body: { userId: "userId" }
```

**Leave Group Date**
```
POST /api/social/group-dates/:groupDateId/leave
Body: { userId: "userId" }
```

**Get Nearby Group Dates**
```
GET /api/social/group-dates/nearby?longitude=X&latitude=Y&maxDistance=5000
```

#### Frontend Usage

```javascript
import SocialFeaturesService from '../services/SocialFeaturesService';

// Create a group date
const createGroupDate = async () => {
  const groupDate = await SocialFeaturesService.createGroupDate({
    hostId: currentUser._id,
    title: "Weekend Brunch",
    // ... other properties
  });
};

// Get nearby group dates
const getNearby = async () => {
  const data = await SocialFeaturesService.getNearbyGroupDates(
    userLocation.longitude,
    userLocation.latitude
  );
  console.log(data.groupDates);
};

// Join a group date
const joinGroupDate = async (groupDateId) => {
  await SocialFeaturesService.joinGroupDate(groupDateId, currentUser._id);
};
```

---

### Friend Reviews

**Purpose**: Allow users to review and recommend matched users to their friends.

#### Database Model: `FriendReview`

```javascript
{
  _id: ObjectId,
  reviewerId: UserId,               // Who is writing the review
  revieweeId: UserId,               // Who is being reviewed
  matchId: MatchId,                 // Reference to the match
  groupDateId: GroupDateId,         // Reference to group date if applicable
  reviewType: String,               // 'private_match', 'friend_opinion', 'group_date_participant'
  rating: Number,                   // 1-5
  categories: {
    friendliness: Number,
    authenticity: Number,
    reliability: Number,
    conversationSkills: Number
  },
  comment: String,
  pros: [String],                   // e.g., ['Good listener', 'Punctual']
  cons: [String],
  wouldRecommend: Boolean,
  isAnonymous: Boolean,
  isPublic: Boolean,                // Can reviewee see this?
  isVerified: Boolean,              // Verified that match happened
  helpful: Number,                  // Upvote count
  unhelpful: Number,                // Downvote count
  moderationStatus: String          // 'pending', 'approved', 'rejected'
}
```

#### API Endpoints

**Create a Friend Review**
```
POST /api/social/reviews
Body: {
  reviewerId: "userId",
  revieweeId: "otherUserId",
  matchId: "matchId",
  rating: 4,
  categories: {
    friendliness: 5,
    authenticity: 4,
    reliability: 4,
    conversationSkills: 3
  },
  comment: "Great person to grab coffee with!",
  pros: ["Good listener", "Funny"],
  cons: ["Talks a bit fast"],
  wouldRecommend: true
}
```

**Get User Reviews**
```
GET /api/social/reviews/:userId
Returns: {
  reviews: [...],
  stats: {
    averageRating: 4.5,
    totalReviews: 12,
    wouldRecommendPercentage: 92,
    categories: { ... }
  }
}
```

#### Frontend Usage

```javascript
// Create a review
const createReview = async () => {
  const review = await SocialFeaturesService.createFriendReview({
    reviewerId: currentUser._id,
    revieweeId: matchUserId,
    rating: 4,
    // ... other properties
  });
};

// Get reviews for a user
const getReviews = async (userId) => {
  const data = await SocialFeaturesService.getUserReviews(userId);
  console.log(data.stats); // Review statistics
};
```

---

### In-App Events & Meetups

**Purpose**: Platform-organized and user-organized events for singles to meet.

#### Database Model: `Event`

```javascript
{
  _id: ObjectId,
  organizerId: UserId,
  title: String,
  description: String,
  category: String,                 // 'networking', 'singles_mixer', 'speed_dating', etc.
  location: GeoJSON Point,
  locationName: String,
  startTime: Date,
  endTime: Date,
  registrationDeadline: Date,
  maxAttendees: Number,
  currentAttendeeCount: Number,
  attendees: [{
    userId: UserId,
    registeredAt: Date,
    status: String                  // 'registered', 'checked_in', 'attended', 'no_show'
  }],
  ticketPrice: Number,
  ticketType: String,               // 'free', 'paid', 'vip'
  eventImages: [ImageObject],
  bannerImage: String,
  tags: [String],
  ageRestriction: { minAge, maxAge },
  status: String,                   // 'draft', 'published', 'ongoing', 'completed', 'cancelled'
  visibility: String,               // 'public', 'private', 'friends_only', 'premium_only'
  reviews: [ReviewObject],
  averageRating: Number,
  agenda: [AgendaItem],
  sponsors: [SponsorObject],
  socialLinks: { facebook, instagram, twitter, website }
}
```

#### API Endpoints

**Create Event**
```
POST /api/social/events
Body: {
  organizerId: "userId",
  title: "Tech Singles Mixer",
  description: "Network with other tech professionals",
  category: "networking",
  location: { type: "Point", coordinates: [lon, lat] },
  locationName: "Tech Hub",
  startTime: "2026-02-01T19:00:00Z",
  maxAttendees: 100,
  ticketPrice: 25,
  tags: ["tech", "networking", "singles"]
}
```

**Register for Event**
```
POST /api/social/events/:eventId/register
Body: { userId: "userId" }
```

**Get Nearby Events**
```
GET /api/social/events/nearby?longitude=X&latitude=Y&maxDistance=10000&category=networking
```

#### Frontend Usage

```javascript
// Get nearby events
const getNearbyEvents = async () => {
  const data = await SocialFeaturesService.getNearbyEvents(
    userLocation.longitude,
    userLocation.latitude,
    10000,
    'networking' // optional category filter
  );
};

// Register for an event
const registerEvent = async (eventId) => {
  await SocialFeaturesService.registerForEvent(eventId, currentUser._id);
};
```

---

### Share Profile Externally

**Purpose**: Allow users to share their profile via links, QR codes, and social media.

#### Database Model: `SharedProfile`

```javascript
{
  _id: ObjectId,
  userId: UserId,                   // Profile being shared
  sharedByUserId: UserId,           // User who initiated the share
  shareMethod: String,              // 'link', 'qr_code', 'social_media', 'email', 'direct_message'
  shareToken: String,               // Unique token for the share link
  expiresAt: Date,                  // Default 30 days
  platform: String,                 // 'instagram', 'facebook', 'whatsapp', etc.
  viewCount: Number,
  viewHistory: [{
    viewedAt: Date,
    viewerInfo: { ipAddress, userAgent, location }
  }],
  customMessage: String,
  isActive: Boolean,
  trackingEnabled: Boolean,
  createdAt: Date
}
```

#### API Endpoints

**Create Shareable Profile Link**
```
POST /api/social/share-profile/:userId
Body: {
  shareMethod: "link",
  customMessage: "Check out my profile and let me know what you think!"
}
Returns: {
  shareToken: "abc123...",
  shareUrl: "https://app.com/shared-profile/abc123...",
  qrCode: "...",
  expiresAt: Date
}
```

**Get Shared Profile (No Auth Required)**
```
GET /api/social/shared-profile/:shareToken
Returns: {
  profile: UserObject,
  customMessage: String,
  sharedAt: Date
}
```

**Get All Shared Profiles for User**
```
GET /api/social/share-profile/:userId/links
Returns: {
  sharedProfiles: [SharedProfileObject],
  count: Number
}
```

**Deactivate Share Link**
```
DELETE /api/social/share-profile/:shareToken
```

#### Frontend Usage

```javascript
import { Share } from 'react-native';

// Create and share profile
const createShareLink = async (method) => {
  const result = await SocialFeaturesService.createShareableProfileLink(
    currentUser._id,
    method,
    "Custom message"
  );

  await Share.share({
    message: `Check out my profile! ${result.shareUrl}`,
    title: 'Share My Profile'
  });
};

// Get all shared profiles
const getSharedProfiles = async () => {
  const data = await SocialFeaturesService.getUserSharedProfiles(currentUser._id);
  console.log(data.sharedProfiles);
};
```

---

## Feature 16: Gamification

### Swipe Streaks

**Purpose**: Encourage daily engagement by tracking consecutive days of swiping.

#### Database Model: `SwipeStreak`

```javascript
{
  _id: ObjectId,
  userId: UserId,
  currentStreak: Number,            // Current consecutive days
  longestStreak: Number,
  lastSwipeDate: Date,
  streakStartDate: Date,
  swipesInCurrentStreak: Number,
  totalSwipes: Number,
  swipeHistory: [{
    date: Date,
    swipeCount: Number
  }],
  streakBrokenCount: Number,
  notifiedAboutStreak: Boolean,
  milestoneReached: Number,         // e.g., 7, 14, 30, 60, 100
  createdAt: Date
}
```

#### API Endpoints

**Track a Swipe**
```
POST /api/gamification/streaks/track
Body: { userId: "userId" }
Returns: {
  streak: SwipeStreakObject,
  stats: GamificationStats
}
```

**Get Swipe Streak**
```
GET /api/gamification/streaks/:userId
```

**Get Streak Leaderboard**
```
GET /api/gamification/leaderboards/streaks?limit=10
Returns: {
  leaderboard: [{ userId, currentStreak, longestStreak, ... }],
  count: Number
}
```

**Get Longest Streak Leaderboard**
```
GET /api/gamification/leaderboards/longest-streaks?limit=10
```

#### Frontend Integration

```javascript
import GamificationService from '../services/GamificationService';

// Track a swipe (call in HomeScreen when user swipes)
const handleSwipe = async (direction) => {
  // ... swipe logic
  const result = await GamificationService.trackSwipe(currentUser._id);
  console.log(result.streak);
};

// Get user streak
const getStreak = async () => {
  const streak = await GamificationService.getSwipeStreak(currentUser._id);
};

// Get leaderboard
const getLeaderboard = async () => {
  const data = await GamificationService.getStreakLeaderboard(10);
  console.log(data.leaderboard);
};
```

**UI Component: StreakCard**
```javascript
import StreakCard from '../components/Gamification/StreakCard';

<StreakCard 
  currentStreak={streak.currentStreak}
  longestStreak={streak.longestStreak}
  lastSwipeDate={streak.lastSwipeDate}
/>
```

---

### Daily Login Rewards

**Purpose**: Incentivize daily app usage with earned rewards.

#### Database Model: `DailyReward`

```javascript
{
  _id: ObjectId,
  userId: UserId,
  rewardDate: Date,
  rewardType: String,               // 'login', 'swipe', 'match', 'message', 'profile_view'
  rewardValue: Number,              // Points or currency
  rewardDescription: String,
  isClaimed: Boolean,
  claimedAt: Date,
  expiresAt: Date,                  // 24 hours
  loginStreak: Number,
  bonusMultiplier: Number,          // Increases with consecutive logins
  metadata: {
    source: String,
    relatedId: ObjectId
  }
}
```

#### Reward Types

- **Daily Login**: 10 points + bonus multiplier
- **Swipe Milestone**: 100 swipes = 50 points
- **Match Created**: 25 points per match
- **Message Exchange**: 5 points
- **Profile View**: 2 points
- **Achievement Unlock**: Variable points

#### API Endpoints

**Get Daily Rewards**
```
GET /api/gamification/rewards/:userId
Returns: {
  unclaimedRewards: [RewardObject],
  totalUnclaimed: Number,
  totalValue: Number
}
```

**Claim Reward**
```
POST /api/gamification/rewards/:rewardId/claim
Returns: {
  success: true,
  reward: RewardObject
}
```

#### Frontend Integration

```javascript
// Check for daily login reward
const checkDailyReward = async () => {
  const data = await GamificationService.getDailyRewards(currentUser._id);
  if (data.unclaimedRewards.length > 0) {
    // Show notification
  }
};

// Claim reward
const claimReward = async (rewardId) => {
  await GamificationService.claimReward(rewardId);
};
```

**UI Component: DailyRewardNotification**
```javascript
import DailyRewardNotification from '../components/Gamification/DailyRewardNotification';

<DailyRewardNotification 
  userId={currentUser._id}
  onRewardClaimed={handleRewardClaimed}
/>
```

---

### Achievement Badges

**Purpose**: Recognize and celebrate user milestones and achievements.

#### Database Model: `AchievementBadge`

```javascript
{
  _id: ObjectId,
  userId: UserId,
  badgeType: String,               // 'first_match', 'matchmaker', 'legendary', etc.
  badgeName: String,
  badgeDescription: String,
  badgeIcon: String,               // Emoji or URL
  rarity: String,                  // 'common', 'uncommon', 'rare', 'epic', 'legendary'
  progressRequired: Number,
  progressCurrent: Number,
  isUnlocked: Boolean,
  unlockedAt: Date,
  displayOrder: Number,
  points: Number                   // Bonus points for unlocking
}
```

#### Badge Types

**Match-Based Badges**
- 🎁 **First Match** - Got your first match
- 🎯 **Matchmaker** - 10 matches
- 🌟 **Socialite** - 25 matches
- 👑 **Legend** - 50 matches

**Swipe-Based Badges**
- ⚡ **Swipe Master** - 100 swipes in a day
- 🔥 **Swipe Legend** - 500 total swipes

**Streak-Based Badges**
- 🏆 **7-Day Champion** - 7-day swipe streak
- 🏅 **30-Day Champion** - 30-day swipe streak
- 💎 **100-Day Champion** - 100-day swipe streak

**Social Badges**
- 💬 **Conversation Starter** - First message exchanged
- 💌 **Chat Enthusiast** - 10 conversations
- ✨ **Profile Perfectionist** - Complete profile
- 🎉 **Group Date Host** - Created first group date
- 🎊 **Event Attendee** - Attended first event
- ⭐ **Friend Reviewer** - Left first friend review
- 🦋 **Social Butterfly** - 5 friends
- 🔗 **Connector** - Recommended a friend
- ✅ **Verified User** - Completed verification

#### API Endpoints

**Award Badge**
```
POST /api/gamification/badges/award
Body: {
  userId: "userId",
  badgeType: "first_match",
  badgeName: "First Match",
  badgeDescription: "Got your first match!",
  points: 50
}
```

**Get User Badges**
```
GET /api/gamification/badges/:userId
Returns: {
  badges: [BadgeObject],
  totalBadges: Number,
  unlockedBadges: Number
}
```

**Update Badges**
```
POST /api/gamification/badges/:userId/update
```

#### Frontend Integration

```javascript
// Get user badges
const getBadges = async () => {
  const data = await GamificationService.getUserBadges(currentUser._id);
  console.log(data.badges);
};

// Update badges (call after significant actions)
const updateBadges = async () => {
  await GamificationService.updateBadges(currentUser._id);
};
```

**UI Component: BadgeShowcase**
```javascript
import BadgeShowcase from '../components/Gamification/BadgeShowcase';

<BadgeShowcase badges={badges} />
```

---

### Leaderboards (Optional)

**Purpose**: Create friendly competition and engagement.

#### Types of Leaderboards

1. **Current Streak Leaderboard** - Top 10 active streaks
2. **Longest Streak Leaderboard** - Top 10 all-time streaks
3. **Match Count Leaderboard** - Top 10 most matches
4. **Badge Collection Leaderboard** - Top 10 most badges

#### API Endpoints

**Get Current Streak Leaderboard**
```
GET /api/gamification/leaderboards/streaks?limit=10
```

**Get Longest Streak Leaderboard**
```
GET /api/gamification/leaderboards/longest-streaks?limit=10
```

#### Frontend Usage

```javascript
// Display leaderboard
const fetchLeaderboard = async () => {
  const data = await GamificationService.getStreakLeaderboard(10);
  setLeaderboard(data.leaderboard);
};
```

---

## API Documentation

### Base URL
```
https://api.datingapp.com/api
```

### Authentication
All endpoints (except public profile sharing) require:
```
Authorization: Bearer {token}
```

### Response Format
```javascript
{
  success: true,
  data: { /* response data */ },
  message: "Success message"
}

// Error
{
  success: false,
  error: "Error message",
  statusCode: 400
}
```

### Rate Limiting
- Gamification endpoints: 100 requests/minute per user
- Social features endpoints: 50 requests/minute per user

---

## Frontend Integration

### Updated Navigation

Add these screens to your `AppNavigator.js`:

```javascript
// In Tab Navigator
<Tab.Screen 
  name="Social" 
  component={SocialTabNavigator}
  options={{ title: '👫 Social' }}
/>

// In Drawer Navigator
<Drawer.Screen 
  name="Gamification" 
  component={GamificationScreen}
  options={{ title: '🎮 Gamification' }}
/>
```

### Integration Points

**HomeScreen**
- Add `StreakCard` component
- Track swipes with `GamificationService.trackSwipe()`
- Show `DailyRewardNotification`

**ProfileScreen**
- Display `BadgeShowcase` component
- Show gamification stats
- Add link to `ProfileSharingScreen`

**New Screens**
- `GroupDatesScreen` - Browse and join group dates
- `EventsScreen` - Browse and register for events
- `ProfileSharingScreen` - Create and manage share links
- `GamificationScreen` - View streaks, badges, and leaderboards

---

## Database Schema

### Indexes for Performance

```javascript
// SwipeStreak indexes
db.swipestreaks.createIndex({ userId: 1 })
db.swipestreaks.createIndex({ currentStreak: -1 })
db.swipestreaks.createIndex({ longestStreak: -1 })

// DailyReward indexes
db.dailyrewards.createIndex({ userId: 1, rewardDate: -1 })
db.dailyrewards.createIndex({ isClaimed: 1, expiresAt: 1 })

// AchievementBadge indexes
db.achievementbadges.createIndex({ userId: 1, isUnlocked: 1 })
db.achievementbadges.createIndex({ userId: 1, badgeType: 1 }, { unique: true })

// GroupDate indexes
db.groupdates.createIndex({ location: "2dsphere" })
db.groupdates.createIndex({ hostId: 1 })
db.groupdates.createIndex({ status: 1 })

// Event indexes
db.events.createIndex({ location: "2dsphere" })
db.events.createIndex({ organizerId: 1 })
db.events.createIndex({ category: 1 })

// SharedProfile indexes
db.sharedprofiles.createIndex({ shareToken: 1 }, { unique: true })
db.sharedprofiles.createIndex({ userId: 1 })
db.sharedprofiles.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

---

## Environment Setup

### Backend

1. **Update `.env`**
```
GAMIFICATION_ENABLED=true
SOCIAL_FEATURES_ENABLED=true
MAX_SHARE_LINK_EXPIRY_DAYS=30
DAILY_REWARD_RESET_HOUR=0
```

2. **Update `server.js`**
```javascript
const gamificationRoutes = require('./routes/gamification');
const socialFeaturesRoutes = require('./routes/socialFeatures');

app.use('/api/gamification', gamificationRoutes);
app.use('/api/social', socialFeaturesRoutes);
```

### Frontend

1. **Update services/api.js**
```javascript
// Ensure axios instance is properly configured
export default axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});
```

2. **Update Navigation**
```javascript
// Add new screens to navigation stack
import GroupDatesScreen from '../screens/GroupDatesScreen';
import EventsScreen from '../screens/EventsScreen';
import ProfileSharingScreen from '../screens/ProfileSharingScreen';
```

---

## Testing

### Manual Testing Checklist

**Swipe Streaks**
- [ ] Track consecutive swipes across days
- [ ] Verify streak breaks after 24 hours without swiping
- [ ] Check milestone notifications at 7, 14, 30, 60, 100 days
- [ ] Verify leaderboard rankings

**Daily Rewards**
- [ ] Claim daily login reward
- [ ] Check expiration after 24 hours
- [ ] Verify bonus multiplier increases with consecutive logins

**Achievement Badges**
- [ ] Unlock first match badge
- [ ] Verify badge progression updates
- [ ] Check badge icons and rarities display correctly

**Group Dates**
- [ ] Create new group date
- [ ] Join/leave group date
- [ ] Filter nearby group dates by location
- [ ] Test capacity limits

**Events**
- [ ] Create event
- [ ] Register for event
- [ ] Filter by category
- [ ] Test sold-out scenario

**Profile Sharing**
- [ ] Create share link
- [ ] Share via multiple methods
- [ ] View shared profile
- [ ] Track view counts
- [ ] Deactivate link

---

## Performance Considerations

1. **Caching**: Cache leaderboards and badge definitions
2. **Batch Operations**: Batch update streak milestones
3. **Lazy Loading**: Load gamification data on demand
4. **Database Indexes**: Use provided indexes for fast queries
5. **Rate Limiting**: Implement rate limiting for API endpoints

---

## Future Enhancements

1. **Social Integrations**: Direct sharing to Facebook, Instagram
2. **Notifications**: Push notifications for streaks, badges, events
3. **Analytics**: Track engagement metrics and user behavior
4. **Monetization**: Premium badge unlocks, VIP event access
5. **Friend Lists**: Official friend system with friend-only events
6. **Seasonal Events**: Limited-time badges and challenges
7. **Guilds/Tribes**: Group communities with shared goals
8. **Rewards Shop**: Redeem points for premium features

---

## Support & Debugging

### Common Issues

**Streaks not tracking**
- Check timestamp formatting (should be UTC)
- Verify user timezone handling
- Confirm swipe events are being logged

**Badges not unlocking**
- Check badge progression calculation
- Verify milestone conditions in GamificationService
- Check badge type enum values

**Group dates not showing**
- Verify geospatial index on MongoDB
- Check location coordinates format [longitude, latitude]
- Ensure API is returning correct GeoJSON

**Share links not working**
- Verify share token generation
- Check token expiration logic
- Confirm frontend URL configuration

---

## Documentation Version

- **Version**: 1.0.0
- **Last Updated**: January 2026
- **Status**: Complete

