# Premium Features Implementation Guide

## Overview
Complete implementation of all 7 premium features for the dating app. Features are tied to subscription status and managed through MongoDB backend with Firebase integration on the frontend.

---

## 1. Unlimited Swipes

### Feature Description
- Free users: 50 swipes per day
- Premium users: Unlimited swipes

### Backend Implementation
- **Model**: `Subscription` model tracks `status` field ('free', 'trial', 'active')
- **Controller**: `swipeController.js` - `createSwipe()` checks subscription status
- **API**: `POST /api/swipes` - integrates with `Subscription.findOne()` for premium check

### Implementation Details
```javascript
// Check if premium using Subscription model
const subscription = await Subscription.findOne({ userId: swiperId });
const isPremium = subscription && subscription.isActive;
const limitCheck = await Swipe.canSwipe(swiperId, isPremium);
```

### Frontend Usage
```javascript
// In PremiumService
const status = await PremiumService.checkPremiumStatus(userId, token);
if (status.features.unlimitedSwipes) {
  // Show unlimited swipes indicator
}
```

---

## 2. See Who Liked You

### Feature Description
Premium users can see which users have liked their profile, with full user details

### Backend Implementation
- **Model**: 
  - `User.receivedLikes[]` - array tracking all likes received
  - `Subscription.features.seeWhoLikedYou` - feature flag
  
- **Controller**: `premiumController.js` - `getReceivedLikes()`
- **API**: `GET /api/premium/likes/received`

### Implementation Details
```javascript
// Auto-tracked in swipeController when like is created
await User.findByIdAndUpdate(
  targetId,
  {
    $push: {
      receivedLikes: {
        fromUserId: swiperId,
        action: action, // 'like' or 'superlike'
        receivedAt: new Date()
      }
    }
  }
);

// Retrieved via premium controller with user details populated
const likesWithDetails = [];
for (const like of receivedLikes) {
  const likerUser = await User.findById(like.fromUserId)
    .select('_id name age gender photos location bio interests education');
  likesWithDetails.push({ ...like, user: likerUser });
}
```

### Frontend Usage
```javascript
const likes = await PremiumService.getReceivedLikes(userId, token);
// Returns array of likes with user profiles
```

---

## 3. Passport (Location Change)

### Feature Description
Premium users can temporarily override their location to match with people in different cities

### Backend Implementation
- **Model**: `User.passportMode` object containing:
  - `enabled`: boolean
  - `currentLocation`: GeoJSON point with city/country
  - `lastChanged`: timestamp
  - `changeHistory`: array of location changes

- **Controller**: `premiumController.js`
  - `setPassportLocation()`
  - `getPassportStatus()`
  - `disablePassport()`

- **API Endpoints**:
  - `POST /api/premium/passport/location` - set new location
  - `GET /api/premium/passport/status` - check status
  - `POST /api/premium/passport/disable` - disable passport mode

### Implementation Details
```javascript
// Set passport location
const newLocation = {
  type: 'Point',
  coordinates: [longitude, latitude],
  city: city,
  country: country
};

user.passportMode = {
  enabled: true,
  currentLocation: newLocation,
  lastChanged: new Date(),
  changeHistory: [
    { location: newLocation, city, country, changedAt: new Date() }
  ]
};
```

### Frontend Usage
```javascript
// Set passport location
await PremiumService.setPassportLocation(
  lon, lat, 'New York', 'USA', token
);

// Check status
const status = await PremiumService.getPassportStatus(userId, token);

// Disable
await PremiumService.disablePassport(userId, token);
```

---

## 4. Advanced Filters

### Feature Description
Premium users can filter matches by additional criteria beyond basic preferences

### Supported Filters
- **Income**: min/max range
- **Education**: high_school, bachelor, masters, phd
- **Body Type**: slim, athletic, average, curvy, stocky
- **Drinking**: never, rarely, socially, regularly
- **Smoking**: never, rarely, sometimes, regularly
- **Marital Status**: single, divorced, widowed, separated
- **Children**: has children (yes/no), wants children (yes/no/maybe/unsure)
- **Religion**: christian, jewish, muslim, hindu, buddhist, atheist, agnostic, other
- **Zodiac**: all 12 signs
- **Languages**: english, spanish, french, german, italian, portuguese, russian, chinese, japanese, korean
- **Travel Frequency**: never, rarely, sometimes, frequently

### Backend Implementation
- **Model**: `User.advancedFilters` object containing all filter fields
- **Controller**: `premiumController.js`
  - `getAdvancedFilterOptions()` - returns available options
  - `updateAdvancedFilters()` - saves user's filters

- **API Endpoints**:
  - `GET /api/premium/filters/options` - get available filter values
  - `POST /api/premium/filters/update` - update user's filters

### Implementation Details
```javascript
// User profile stores their advanced filters
advancedFilters: {
  minIncome: 50000,
  maxIncome: 150000,
  educationLevel: ['bachelor', 'masters'],
  bodyType: ['athletic', 'average'],
  // ... etc
}
```

### Frontend Usage
```javascript
// Get available options
const options = await PremiumService.getAdvancedFilterOptions(userId, token);

// Update filters
await PremiumService.updateAdvancedFilters({
  minIncome: 50000,
  maxIncome: 150000,
  educationLevel: ['bachelor'],
  smoker: 'never'
}, token);
```

---

## 5. Priority Likes

### Feature Description
Premium users' likes appear at the top of the "See Who Liked You" list for recipients

### Backend Implementation
- **Model**: 
  - `Swipe.isPriority` - boolean flag on swipe
  - `Swipe.prioritySentAt` - timestamp for sorting
  - `User.priorityLikesReceived` - counter for stats
  - `User.priorityLikesSent` - counter for stats

- **Controller**: `premiumController.js` - `sendPriorityLike()`
- **API**: `POST /api/premium/likes/priority`

### Implementation Details
```javascript
// Create priority like
const swipe = new Swipe({
  swiperId: userId,
  swipedId: targetUserId,
  action: 'like',
  isPriority: true,
  prioritySentAt: new Date()
});

// Track in user stats
await User.findByIdAndUpdate(userId, { $inc: { priorityLikesSent: 1 } });
await User.findByIdAndUpdate(targetUserId, { $inc: { priorityLikesReceived: 1 } });
```

### Frontend Usage
```javascript
// Send priority like
await PremiumService.sendPriorityLike(targetUserId, token);
```

### Sorting in "See Who Liked You"
Likes returned from `getReceivedLikes()` should be sorted by:
1. Priority likes first (isPriority === true)
2. Then by receivedAt timestamp (newest first)

---

## 6. Hide Ads

### Feature Description
Premium users see no advertisements in the app

### Backend Implementation
- **Model**: 
  - `Subscription.features.hideAds` - feature flag
  - `User.adsPreferences` object:
    - `showAds`: boolean
    - `adCategories`: array of ad category preferences
    - `lastAdUpdate`: timestamp

- **Controller**: `premiumController.js` - `updateAdsPreferences()`
- **API**: `POST /api/premium/ads/preferences`

### Implementation Details
```javascript
// Update ads preferences
await User.findByIdAndUpdate(
  userId,
  {
    'adsPreferences.showAds': showAds !== false,
    'adsPreferences.adCategories': adCategories || [],
    'adsPreferences.lastAdUpdate': new Date()
  }
);

// Check before showing ads on frontend
const hasAds = !subscription.features.hideAds;
if (hasAds) {
  // Display ad
}
```

### Frontend Usage
```javascript
// Disable ads for premium user
await PremiumService.updateAdsPreferences(false, [], token);

// Check premium status
const status = await PremiumService.checkPremiumStatus(userId, token);
if (status.features.hideAds) {
  // Don't show ads
}
```

---

## 7. Profile Boost Analytics

### Feature Description
Premium users can see detailed analytics about their profile boosts, including:
- Total number of boosts
- Views gained during boosts
- Likes received during boosts
- Matches made during boosts
- Average views/likes per boost
- Historical boost data

### Backend Implementation
- **Model**: `User.boostAnalytics` object containing:
  - `totalBoosts`: number
  - `totalProfileViews`: number
  - `totalLikesReceivedDuringBoosts`: number
  - `averageViewsPerBoost`: number
  - `averageLikesPerBoost`: number
  - `boostHistory[]`: array of boost sessions with metrics

- **Controller**: `premiumController.js`
  - `getBoostAnalytics()` - retrieve analytics
  - `recordBoostSession()` - log a boost

- **API Endpoints**:
  - `GET /api/premium/analytics/boosts` - get analytics
  - `POST /api/premium/analytics/boost-session` - record session

### Implementation Details
```javascript
// Boost session structure
{
  startTime: Date,
  endTime: Date,
  duration: Number, // in minutes
  viewsGained: Number,
  likesGained: Number,
  matches: Number
}

// Record a boost
const newBoost = {
  startTime: new Date(new Date().getTime() - duration * 60000),
  endTime: new Date(),
  duration: duration,
  viewsGained: viewsGained || 0,
  likesGained: likesGained || 0,
  matches: matches || 0
};

// Update totals and recalculate averages
boostAnalytics.boostHistory.push(newBoost);
boostAnalytics.totalBoosts++;
boostAnalytics.totalProfileViews += viewsGained;
boostAnalytics.totalLikesReceivedDuringBoosts += likesGained;
boostAnalytics.averageViewsPerBoost = Math.round(totalViews / totalBoosts);
boostAnalytics.averageLikesPerBoost = Math.round(totalLikes / totalBoosts);
```

### Frontend Usage
```javascript
// Get boost analytics
const analytics = await PremiumService.getBoostAnalytics(userId, token);
// Returns: { totalBoosts, totalProfileViews, totalLikes, boostHistory, averages }

// Record a boost session after it ends
await PremiumService.recordBoostSession(
  30, // duration in minutes
  150, // views gained
  25, // likes gained
  5, // matches
  token
);
```

---

## Database Models Summary

### Subscription Model
```javascript
{
  userId: ObjectId (unique),
  status: 'free' | 'trial' | 'active' | 'expired' | 'cancelled',
  planType: 'trial' | 'monthly' | 'yearly',
  startDate: Date,
  endDate: Date,
  features: {
    unlimitedSwipes: Boolean,
    seeWhoLikedYou: Boolean,
    passport: Boolean,
    advancedFilters: Boolean,
    priorityLikes: Boolean,
    hideAds: Boolean,
    profileBoostAnalytics: Boolean
  },
  paymentMethod: 'stripe' | 'apple' | 'google' | 'manual',
  // ... other subscription details
}
```

### User Model Premium Fields
```javascript
{
  // See Who Liked You
  receivedLikes: [{
    fromUserId: ObjectId,
    action: 'like' | 'superlike',
    receivedAt: Date
  }],

  // Passport
  passportMode: {
    enabled: Boolean,
    currentLocation: GeoJSON,
    lastChanged: Date,
    changeHistory: []
  },

  // Advanced Filters
  advancedFilters: {
    minIncome: Number,
    maxIncome: Number,
    educationLevel: [String],
    // ... 10+ filter fields
  },

  // Priority Likes
  priorityLikesReceived: Number,
  priorityLikesSent: Number,

  // Ads
  adsPreferences: {
    showAds: Boolean,
    adCategories: [String],
    lastAdUpdate: Date
  },

  // Profile Boost Analytics
  boostAnalytics: {
    totalBoosts: Number,
    totalProfileViews: Number,
    totalLikesReceivedDuringBoosts: Number,
    boostHistory: [],
    averageViewsPerBoost: Number,
    averageLikesPerBoost: Number
  }
}
```

---

## API Endpoints Summary

### Subscription Management
- `GET /api/premium/subscription/status` - Check current subscription
- `POST /api/premium/subscription/trial/start` - Start 7-day trial
- `POST /api/premium/subscription/upgrade` - Upgrade to paid plan
- `POST /api/premium/subscription/cancel` - Cancel subscription

### See Who Liked You
- `GET /api/premium/likes/received` - Get received likes with user details

### Passport
- `GET /api/premium/passport/status` - Check passport status
- `POST /api/premium/passport/location` - Set passport location
- `POST /api/premium/passport/disable` - Disable passport

### Advanced Filters
- `GET /api/premium/filters/options` - Get available filter options
- `POST /api/premium/filters/update` - Update user's filters

### Priority Likes
- `POST /api/premium/likes/priority` - Send a priority like

### Ads
- `POST /api/premium/ads/preferences` - Update ads preferences

### Analytics
- `GET /api/premium/analytics/boosts` - Get boost analytics
- `POST /api/premium/analytics/boost-session` - Record boost session

---

## Frontend Integration Notes

1. **PremiumService** - Updated with all new methods using backend API instead of Firebase
2. **All API calls require authentication token** - Pass token in headers
3. **Error handling** - All methods return `{ success, data/error }` format
4. **Premium checks** - Always check subscription status before showing premium features

---

## Testing Checklist

- [ ] Create trial subscription
- [ ] Upgrade to monthly/yearly plans
- [ ] Cancel subscription
- [ ] Test swipe limits for free vs premium
- [ ] View received likes
- [ ] Set passport location
- [ ] Get/update advanced filters
- [ ] Send priority likes
- [ ] Toggle ads
- [ ] Record boost sessions
- [ ] Retrieve boost analytics

---

## Next Steps

1. **Frontend UI Components**: Create screens for each premium feature
2. **Payment Integration**: Integrate Stripe/Apple Pay/Google Pay for payments
3. **Email Notifications**: Send trial starting/ending emails
4. **Analytics Dashboard**: Build admin dashboard for subscription metrics
5. **A/B Testing**: Test different pricing and feature combinations
