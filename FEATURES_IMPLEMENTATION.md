# Feature 7 & 8 Implementation Guide
## Filters & Preferences + Push Notifications

### Overview
This document describes the implementation of two major features:
- **Feature 7: Filters & Preferences** - Age range, distance, gender, and relationship type filtering
- **Feature 8: Push Notifications** - Match, message, like, and system notifications with granular control

---

## Feature 7: Filters & Preferences

### Components Added

#### 1. **RangeSlider Component** (`src/components/Slider/RangeSlider.js`)
A reusable component for selecting min/max ranges.

**Props:**
- `min` - Minimum value (default: 0)
- `max` - Maximum value (default: 100)
- `step` - Step increment (default: 1)
- `minValue` - Current minimum value
- `maxValue` - Current maximum value
- `onChangeMin(value)` - Callback for min change
- `onChangeMax(value)` - Callback for max change
- `label` - Display label
- `color` - Slider color (default: '#667eea')

**Features:**
- Touch-friendly input areas
- Smooth visual feedback
- Real-time value display
- Prevents invalid ranges (min > max)

#### 2. **SingleSlider Component** (`src/components/Slider/SingleSlider.js`)
A component for selecting a single numeric value.

**Props:**
- `min`, `max`, `step` - Range configuration
- `value` - Current value
- `onChange(value)` - Callback for value change
- `label`, `unit` - Display formatting
- `color` - Slider color

**Features:**
- Clean, minimal design
- Labeled display with unit
- Touch-friendly dragging

#### 3. **Enhanced PreferencesScreen** (`src/screens/PreferencesScreen.js`)
Updated to include:

**New Sections:**
- **Age Range** - RangeSlider (18-100 years)
- **Discovery Range** - SingleSlider (1-500 km)
- **Interested In** - Gender preference selector (Women, Men, Everyone)
- **Looking For** - Relationship type selector:
  - 😎 Casual
  - 💑 Serious
  - 💍 Marriage
  - 🤔 Not Sure

**Validation:**
- Age range validation (18-100, min ≤ max)
- Distance validation (1-500 km)
- Relationship type validation

### Preferences Service Enhancements (`src/services/PreferencesService.js`)

Added support for:
```javascript
{
  minAge: 18,
  maxAge: 100,
  maxDistance: 50,
  interestedIn: 'both', // 'men', 'women', 'both'
  lookingFor: 'any',    // 'casual', 'serious', 'marriage', 'any'
  // ... existing fields
}
```

**New Methods:**
- Already existing: `getUserPreferences()`, `updateUserPreferences()`
- Enhanced validation in `validatePreferences()` for `lookingFor`

### Firestore Structure
User preferences are stored in the user document:
```
users/{userId}
├── preferences
│   ├── minAge: number
│   ├── maxAge: number
│   ├── maxDistance: number
│   ├── interestedIn: string
│   ├── lookingFor: string
│   └── ... (other preferences)
```

---

## Feature 8: Push Notifications

### Components Added

#### 1. **NotificationPreferencesScreen** (`src/screens/NotificationPreferencesScreen.js`)
Comprehensive UI for notification settings.

**Sections:**

**A. Notification Types**
- Match Notifications (💗) - When you match with someone
- Message Notifications (💬) - New messages from matches
- Like Notifications (⚡) - Someone liked your profile
- System Announcements (📢) - App updates and announcements

Each has a toggle switch with description.

**B. Notification Frequency**
- Instant (default) - Get notified right away
- Daily Digest - Once per day at 9:00 AM
- Weekly Digest - Once per week on Monday

Modal picker for selection.

**C. Quiet Hours**
- Enable/disable quiet hours
- Set start and end times
- Notifications suppressed during quiet hours
- Default: 10 PM - 8 AM

#### 2. **Enhanced NotificationService** (`src/services/NotificationService.js`)

**New Methods:**

```javascript
// Send different notification types
static async sendLikeNotification(likedUserId, likerName)
static async sendSystemNotification(toUserId, title, message, data)
static async sendBulkNotification(userIds, title, body, data)

// Manage preferences
static async updateNotificationPreferences(userId, preferences)
static async getNotificationPreferences(userId)

// Utility
static isWithinQuietHours(quietHours)
```

**Notification Preferences Structure:**
```javascript
{
  matchNotifications: boolean,
  messageNotifications: boolean,
  likeNotifications: boolean,
  systemNotifications: boolean,
  notificationFrequency: 'instant' | 'daily' | 'weekly',
  quietHours: {
    enabled: boolean,
    start: 'HH:MM',
    end: 'HH:MM'
  }
}
```

### Backend API Endpoints

#### **Notification Routes** (`backend/routes/notifications.js`)
Base path: `/api/notifications`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/preferences` | Get user's notification preferences | Required |
| PUT | `/preferences` | Update notification preferences | Required |
| POST | `/send` | Send notification to a user | Required |
| POST | `/send-bulk` | Send bulk notifications | Required |
| PUT | `/enable` | Enable all notifications | Required |
| PUT | `/disable` | Disable all notifications | Required |

#### **GET /api/notifications/preferences**
Returns user's notification settings.

Response:
```json
{
  "success": true,
  "data": {
    "preferences": {
      "matchNotifications": true,
      "messageNotifications": true,
      "likeNotifications": true,
      "systemNotifications": true,
      "notificationFrequency": "instant",
      "quietHours": {
        "enabled": false,
        "start": "22:00",
        "end": "08:00"
      }
    }
  }
}
```

#### **PUT /api/notifications/preferences**
Update notification preferences.

Request:
```json
{
  "matchNotifications": true,
  "messageNotifications": true,
  "likeNotifications": true,
  "systemNotifications": true,
  "notificationFrequency": "instant",
  "quietHours": {
    "enabled": true,
    "start": "22:00",
    "end": "08:00"
  }
}
```

#### **POST /api/notifications/send**
Send a single notification.

Request:
```json
{
  "toUserId": "userId123",
  "type": "match|message|like|system",
  "title": "It's a Match!",
  "message": "You and Jane liked each other!",
  "data": {
    "matcherId": "userId456"
  }
}
```

#### **POST /api/notifications/send-bulk**
Send notifications to multiple users.

Request:
```json
{
  "userIds": ["userId1", "userId2", "userId3"],
  "type": "system",
  "title": "New Feature Available!",
  "message": "Check out our new feature...",
  "data": {}
}
```

### Notification Integration

#### **1. Match Notifications** (swipeController.js)
Triggered when:
- User A likes User B
- User B already liked User A
- System creates match record
- Both users receive match notification

#### **2. Like Notifications** (swipeController.js)
Triggered when:
- User A likes User B
- User B hasn't yet liked User A
- User B receives like notification

#### **3. Message Notifications** (server.js socket handler)
Triggered when:
- User sends message in chat
- Receiver's preferences allow message notifications
- Respects quiet hours if enabled

#### **4. System Notifications** (Manual via API)
Triggered for:
- App announcements
- Feature releases
- Maintenance notifications
- Admin-initiated communications

### Notification Preference Flow

```
User Action
    ↓
Check Preferences
    ├─ Type enabled? (match/message/like/system)
    ├─ Within quiet hours?
    └─ Frequency setting respected?
    ↓
Send/Queue Notification
    ↓
Notification Delivered
```

### Socket.io Integration

Messages sent via socket.io automatically trigger notifications:

```javascript
socket.on('send_message', async (data) => {
  // ... create message ...
  
  // Send notification if enabled
  const receiverUser = await User.findById(receiverId);
  if (receiverUser?.notificationPreferences?.messageNotifications !== false) {
    // Notify receiver
  }
});
```

### Navigation

Profile Screen now includes:
- **Preferences** button → PreferencesScreen
- **Notifications** button → NotificationPreferencesScreen (NEW)
- Other existing buttons

### Database Schema Updates

**User Model Enhancement:**
```javascript
{
  preferences: {
    minAge: Number,
    maxAge: Number,
    maxDistance: Number,
    interestedIn: String,
    lookingFor: String,
    matchNotifications: Boolean,
    messageNotifications: Boolean,
    likeNotifications: Boolean,
    systemNotifications: Boolean,
    // ... other fields
  },
  notificationPreferences: {
    matchNotifications: Boolean,
    messageNotifications: Boolean,
    likeNotifications: Boolean,
    systemNotifications: Boolean,
    notificationFrequency: String,
    quietHours: {
      enabled: Boolean,
      start: String,
      end: String
    }
  }
}
```

**Firestore Rules:**
- Users can read/write their own preferences
- Preferences stored in user document
- Notification settings are private

---

## Usage Examples

### Setting Preferences (Frontend)

```javascript
// In PreferencesScreen
await PreferencesService.updateUserPreferences(userId, {
  minAge: 21,
  maxAge: 35,
  maxDistance: 25,
  interestedIn: 'women',
  lookingFor: 'serious'
});
```

### Managing Notifications (Frontend)

```javascript
// In NotificationPreferencesScreen
await NotificationService.updateNotificationPreferences(userId, {
  matchNotifications: true,
  messageNotifications: true,
  likeNotifications: false,
  systemNotifications: true,
  notificationFrequency: 'instant',
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '08:00'
  }
});
```

### Sending Notifications (Backend)

```javascript
// In swipeController.js - on match
await sendNotificationInternal(
  targetId,
  'match',
  '🎉 It\'s a Match!',
  `You and ${swiperUserName} liked each other!`,
  { type: 'match', matcherId: swiperId }
);

// Via API
fetch('/api/notifications/send', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    toUserId: userId,
    type: 'system',
    title: 'New Feature!',
    message: 'Check out our new discover feature...'
  })
});
```

---

## Testing Checklist

### Preferences Features
- [ ] Age range slider works (18-100)
- [ ] Distance slider works (1-500 km)
- [ ] Gender preference selection works
- [ ] Relationship type selection works
- [ ] Preferences save correctly
- [ ] Preferences load correctly
- [ ] Validation prevents invalid ranges
- [ ] User is filtered based on preferences

### Notification Features
- [ ] Notification preferences screen loads
- [ ] Toggle switches work for all types
- [ ] Frequency picker works
- [ ] Quiet hours can be enabled/disabled
- [ ] Quiet hours times can be set
- [ ] Preferences save correctly
- [ ] Match notification sent on match
- [ ] Like notification sent on like
- [ ] Message notification sent on message
- [ ] Quiet hours suppress notifications
- [ ] Disabled types don't send

### Integration
- [ ] Navigation to both screens works
- [ ] Data persists across app restarts
- [ ] Backend endpoints respond correctly
- [ ] Notifications respect user preferences
- [ ] No errors in console

---

## Future Enhancements

1. **Analytics**
   - Track notification open rates
   - Monitor preference changes
   - A/B test notification timing

2. **Advanced Filtering**
   - Height filtering
   - Education level filtering
   - Location area-based filtering

3. **Smart Notifications**
   - Machine learning for optimal timing
   - Personalized frequency recommendations
   - Context-aware notifications

4. **Notification Center**
   - In-app notification history
   - Notification archive
   - Undo/redo for actions

5. **Integration**
   - Email notifications as fallback
   - SMS notifications for critical events
   - Push notification service integration (Expo)

---

## Files Modified/Created

### New Files
- `src/components/Slider/RangeSlider.js`
- `src/components/Slider/SingleSlider.js`
- `src/screens/NotificationPreferencesScreen.js`
- `backend/controllers/notificationController.js`
- `backend/routes/notifications.js`
- `FEATURES_IMPLEMENTATION.md` (this file)

### Modified Files
- `src/screens/PreferencesScreen.js` - Added relationship type, improved sliders
- `src/services/PreferencesService.js` - Added lookingFor field support
- `src/services/NotificationService.js` - Added new notification types
- `src/navigation/AppNavigator.js` - Added NotificationPreferencesScreen route
- `src/screens/ProfileScreen.js` - Added Notifications button
- `backend/server.js` - Added notification routes, message notification integration
- `backend/controllers/swipeController.js` - Added match/like notifications
- `firestore.rules` - Added preference read/write rules

---

## Support & Debugging

### Common Issues

**Q: Notifications not showing?**
- Check notification preferences are enabled for that type
- Verify quiet hours aren't active
- Check browser/device notification permissions
- Ensure notificationFrequency is not blocking

**Q: Preferences not saving?**
- Verify Firestore rules allow write access
- Check network connectivity
- Review console for validation errors
- Ensure user is authenticated

**Q: Sliders not responding?**
- Test touch responsiveness on device
- Verify min/max values are valid
- Check for JavaScript console errors

### Debug Commands

```bash
# Test notification API
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toUserId": "userId123",
    "type": "system",
    "title": "Test",
    "message": "Test notification"
  }'

# Get preferences
curl http://localhost:3000/api/notifications/preferences \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-03 | Initial implementation of Features 7 & 8 |

