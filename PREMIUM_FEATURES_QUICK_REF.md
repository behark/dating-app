# Premium Features - Quick Reference

## Roadmap Status
✅ **14. Premium Features - COMPLETE**
- ✅ Unlimited swipes
- ✅ See who liked you
- ✅ Passport (location change)
- ✅ Advanced filters
- ✅ Priority likes
- ✅ Hide ads
- ✅ Profile boost analytics

---

## Files Created/Modified

### Backend Models
- **NEW**: `/backend/models/Subscription.js` - Complete subscription management
- **MODIFIED**: `/backend/models/User.js` - Added premium feature fields
- **MODIFIED**: `/backend/models/Swipe.js` - Added isPriority & prioritySentAt fields

### Backend Controllers
- **NEW**: `/backend/controllers/premiumController.js` - All premium feature logic

### Backend Routes
- **NEW**: `/backend/routes/premium.js` - Premium API endpoints
- **MODIFIED**: `/backend/server.js` - Registered premium routes

### Backend Controllers (Modified)
- **MODIFIED**: `/backend/controllers/swipeController.js` - Integrated Subscription model & received likes tracking

### Frontend Services
- **MODIFIED**: `/src/services/PremiumService.js` - Updated to use backend API with authentication

### Documentation
- **NEW**: `/PREMIUM_FEATURES_IMPLEMENTATION.md` - Comprehensive feature documentation

---

## Backend API Endpoints

### Base URL: `/api/premium`

#### Subscription Management
```
POST   /subscription/trial/start      - Start 7-day free trial
POST   /subscription/upgrade          - Upgrade to premium (body: { planType })
POST   /subscription/cancel           - Cancel subscription
GET    /subscription/status           - Get current subscription status
```

#### See Who Liked You
```
GET    /likes/received                - Get all received likes with user details
```

#### Priority Likes
```
POST   /likes/priority                - Send a priority like (body: { targetUserId })
```

#### Passport (Location Override)
```
GET    /passport/status               - Check passport status
POST   /passport/location             - Set new location (body: { longitude, latitude, city, country })
POST   /passport/disable              - Disable passport mode
```

#### Advanced Filters
```
GET    /filters/options               - Get available filter options
POST   /filters/update                - Update user's filters (body: filter object)
```

#### Ads Preferences
```
POST   /ads/preferences               - Update ads settings (body: { showAds, adCategories })
```

#### Profile Boost Analytics
```
GET    /analytics/boosts              - Get boost analytics
POST   /analytics/boost-session       - Record boost session (body: { duration, viewsGained, likesGained, matches })
```

---

## Frontend Service Usage

### Import
```javascript
import { PremiumService } from '../services/PremiumService';
```

### Check Subscription Status
```javascript
const status = await PremiumService.checkPremiumStatus(userId, token);
// Returns: { isPremium, status, planType, endDate, features }
```

### Start Trial
```javascript
const result = await PremiumService.startTrialSubscription(userId, token);
// Returns: { success, message, data }
```

### Upgrade to Premium
```javascript
const result = await PremiumService.upgradeToPremium(userId, 'monthly', token);
// planType: 'monthly' or 'yearly'
```

### Get Received Likes
```javascript
const likes = await PremiumService.getReceivedLikes(userId, token);
// Returns: { totalLikes, likes: [...] }
```

### Passport Feature
```javascript
// Set location
await PremiumService.setPassportLocation(lon, lat, 'City', 'Country', token);

// Check status
const status = await PremiumService.getPassportStatus(userId, token);

// Disable
await PremiumService.disablePassport(userId, token);
```

### Advanced Filters
```javascript
// Get available options
const options = await PremiumService.getAdvancedFilterOptions(userId, token);

// Update filters
await PremiumService.updateAdvancedFilters({
  minIncome: 50000,
  maxIncome: 150000,
  educationLevel: ['bachelor', 'masters'],
  drinkingFrequency: 'socially'
}, token);
```

### Priority Likes
```javascript
const result = await PremiumService.sendPriorityLike(targetUserId, token);
```

### Ads Preferences
```javascript
// Hide ads (requires premium)
await PremiumService.updateAdsPreferences(false, [], token);

// Show ads with preferences
await PremiumService.updateAdsPreferences(true, ['dating', 'lifestyle'], token);
```

### Boost Analytics
```javascript
// Get analytics
const analytics = await PremiumService.getBoostAnalytics(userId, token);

// Record boost session (after boost ends)
await PremiumService.recordBoostSession(
  30,    // duration in minutes
  150,   // views gained
  25,    // likes gained
  5,     // matches made
  token
);
```

---

## Subscription Features Matrix

| Feature | Free | Trial | Paid |
|---------|------|-------|------|
| Unlimited Swipes | 50/day | ✓ | ✓ |
| See Who Liked You | ✗ | ✓ | ✓ |
| Passport (Location) | ✗ | ✓ | ✓ |
| Advanced Filters | ✗ | ✓ | ✓ |
| Priority Likes | ✗ | ✓ | ✓ |
| Hide Ads | ✗ | ✓ | ✓ |
| Boost Analytics | ✗ | ✓ | ✓ |

---

## Key Database Relationships

### Subscription ↔ User
- One-to-One relationship
- `Subscription.userId` → `User._id`
- Subscription determines which features user can access

### Swipe ↔ Premium Features
- `Swipe.isPriority` flag indicates priority like
- Tracked in `User.priorityLikesReceived` and `User.priorityLikesSent`

### User ↔ Received Likes
- `User.receivedLikes[]` stores all likes received
- Auto-populated when swipe is created in `swipeController`
- Filtered and returned by `premiumController.getReceivedLikes()`

### User ↔ Passport
- `User.passportMode` stores location override data
- `changeHistory` tracks all location changes
- `enabled` flag controls if passport is active

---

## Error Handling

All API endpoints return standardized response format:

### Success Response
```javascript
{
  success: true,
  message: "Operation successful",
  data: { /* endpoint-specific data */ }
}
```

### Error Response
```javascript
{
  success: false,
  message: "Error description"
}
```

### Common HTTP Status Codes
- `200 OK` - Success
- `400 Bad Request` - Invalid input
- `403 Forbidden` - Premium feature required / Unauthorized
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit or daily limit reached
- `500 Internal Server Error` - Server error

---

## Environment Variables

Ensure these are set in `.env`:
```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
PORT=3000
```

---

## Testing Commands

### Test subscription creation
```bash
curl -X POST http://localhost:3000/api/premium/subscription/trial/start \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test upgrade
```bash
curl -X POST http://localhost:3000/api/premium/subscription/upgrade \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"planType":"monthly"}'
```

### Test received likes
```bash
curl -X GET http://localhost:3000/api/premium/likes/received \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Integration Notes

1. **Authentication Required**: All endpoints require Bearer token in Authorization header
2. **Token Expiry**: Tokens expire after 7 days, refresh token expires after 30 days
3. **Rate Limiting**: Consider implementing rate limiting for subscription endpoints
4. **Payment Processing**: Currently using mock subscription - integrate Stripe/Apple Pay/Google Pay in production
5. **Email Notifications**: Send confirmation emails for subscription changes
6. **Webhook Handling**: Handle payment provider webhooks for subscription events

---

## Future Enhancements

1. **Recurring Billing**: Auto-renewal setup
2. **Promotional Codes**: Discount codes for new users
3. **Feature Analytics**: Track which features users use most
4. **A/B Testing**: Test different price points and features
5. **Freemium Upsell**: Strategic paywall placement
6. **Family Plans**: Discounts for multiple subscriptions
7. **Corporate Plans**: Enterprise subscription options
