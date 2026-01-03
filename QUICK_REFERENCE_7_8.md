# Quick Reference: Features 7 & 8

## 🚀 Getting Started

### Run the App
```bash
npm start
```

### Access Features
1. **Preferences** → Profile → Tap "Preferences" button
2. **Notifications** → Profile → Tap "Notifications" button (NEW)

---

## 📋 Feature 7: Filters & Preferences

### What Users Can Do
- Set age range (18-100)
- Set distance radius (1-500 km)  
- Choose gender preference (Women/Men/Everyone)
- Select relationship type (Casual/Serious/Marriage/Not Sure)
- Save all preferences with one tap

### UI Components
```
PreferencesScreen
├── Age Range [RangeSlider]
├── Discovery Range [SingleSlider]
├── I'm Interested In [Button Group]
├── Looking For [Grid 2x2]
└── [Save Button]
```

### Service Methods
```javascript
// src/services/PreferencesService.js
PreferencesService.getUserPreferences(userId)
PreferencesService.updateUserPreferences(userId, prefs)
PreferencesService.validatePreferences(prefs)
```

---

## 🔔 Feature 8: Push Notifications

### What Users Can Do
- Toggle notification types (Match/Message/Like/System)
- Choose notification frequency (Instant/Daily/Weekly)
- Set quiet hours (e.g., 10 PM - 8 AM)
- Save all notification settings

### UI Components
```
NotificationPreferencesScreen
├── Notification Types [4 Toggles]
├── Notification Frequency [Picker]
├── Quiet Hours [Toggle + Time Settings]
└── [Save Button]
```

### Service Methods
```javascript
// src/services/NotificationService.js
NotificationService.getNotificationPreferences(userId)
NotificationService.updateNotificationPreferences(userId, prefs)
NotificationService.sendMatchNotification(userId, name)
NotificationService.sendLikeNotification(userId, name)
NotificationService.sendMessageNotification(userId, name, msg)
NotificationService.sendSystemNotification(userId, title, msg)
```

---

## 🎨 Components

### RangeSlider
**File:** `src/components/Slider/RangeSlider.js`

```javascript
<RangeSlider
  min={18}
  max={100}
  minValue={preferences.minAge}
  maxValue={preferences.maxAge}
  onChangeMin={(val) => updatePreference('minAge', val)}
  onChangeMax={(val) => updatePreference('maxAge', val)}
  label="Age Range"
  color="#FF6B6B"
/>
```

### SingleSlider
**File:** `src/components/Slider/SingleSlider.js`

```javascript
<SingleSlider
  min={1}
  max={500}
  value={preferences.maxDistance}
  onChange={(val) => updatePreference('maxDistance', val)}
  label="Maximum Distance"
  unit=" km"
  color="#4ECDC4"
/>
```

---

## 🔌 API Endpoints

All endpoints require authentication and use `/api/notifications` prefix.

### GET /preferences
Get user's notification settings
```bash
curl http://localhost:3000/api/notifications/preferences \
  -H "Authorization: Bearer TOKEN"
```

### PUT /preferences
Update notification settings
```bash
curl -X PUT http://localhost:3000/api/notifications/preferences \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "matchNotifications": true,
    "messageNotifications": true,
    "likeNotifications": false,
    "systemNotifications": true,
    "notificationFrequency": "instant",
    "quietHours": {
      "enabled": true,
      "start": "22:00",
      "end": "08:00"
    }
  }'
```

### POST /send
Send single notification
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toUserId": "USER_ID",
    "type": "system",
    "title": "Test",
    "message": "Test notification"
  }'
```

### POST /send-bulk
Send to multiple users
```bash
curl -X POST http://localhost:3000/api/notifications/send-bulk \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["user1", "user2"],
    "type": "system",
    "title": "Announcement",
    "message": "New feature available!"
  }'
```

### PUT /enable
Enable all notifications
```bash
curl -X PUT http://localhost:3000/api/notifications/enable \
  -H "Authorization: Bearer TOKEN"
```

### PUT /disable
Disable all notifications
```bash
curl -X PUT http://localhost:3000/api/notifications/disable \
  -H "Authorization: Bearer TOKEN"
```

---

## 📊 Data Structure

### Preferences (in Firestore)
```javascript
{
  minAge: 18,
  maxAge: 100,
  maxDistance: 50,
  interestedIn: 'both',      // 'women' | 'men' | 'both'
  lookingFor: 'any',         // 'casual' | 'serious' | 'marriage' | 'any'
  // ... other preference fields
}
```

### Notification Settings (in Firestore)
```javascript
{
  matchNotifications: true,
  messageNotifications: true,
  likeNotifications: true,
  systemNotifications: true,
  notificationFrequency: 'instant',  // 'instant' | 'daily' | 'weekly'
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  }
}
```

---

## 🧪 Testing Quick Commands

### Test Age Slider
```bash
# In PreferencesScreen, drag age slider
# Verify: min ≤ max, values update in real-time
```

### Test Distance Slider
```bash
# In PreferencesScreen, drag distance slider
# Verify: range 1-500, label updates, value persists
```

### Test Notifications
```bash
# In NotificationPreferencesScreen
# 1. Toggle each notification type
# 2. Verify toggles persist after save
# 3. Set quiet hours and verify they work
```

### Test API
```bash
# Get preferences (replace TOKEN)
curl http://localhost:3000/api/notifications/preferences \
  -H "Authorization: Bearer TOKEN"

# Should return user's settings with 200 status
```

---

## 🐛 Troubleshooting

### Sliders Not Working
- ✅ Check if on actual device (not just web simulator)
- ✅ Verify touch input is enabled
- ✅ Check for console errors

### Preferences Not Saving
- ✅ Verify Firestore rules allow write
- ✅ Check network connection
- ✅ Verify user is authenticated
- ✅ Review console for errors

### Notifications Not Sending
- ✅ Verify notification type is enabled
- ✅ Check quiet hours aren't blocking
- ✅ Ensure API endpoint is accessible
- ✅ Verify authorization token is valid

---

## 📁 File Locations

### Components
- `src/components/Slider/RangeSlider.js`
- `src/components/Slider/SingleSlider.js`

### Screens
- `src/screens/PreferencesScreen.js`
- `src/screens/NotificationPreferencesScreen.js`

### Services
- `src/services/PreferencesService.js`
- `src/services/NotificationService.js`

### Backend
- `backend/controllers/notificationController.js`
- `backend/routes/notifications.js`

### Documentation
- `FEATURES_IMPLEMENTATION.md` - Full documentation
- `FEATURE_7_8_TESTING.md` - Testing guide
- `IMPLEMENTATION_SUMMARY_7_8.md` - Overview
- `FEATURE_CHECKLIST.md` - Checklist

---

## 🚦 Status

| Feature | Status | Location |
|---------|--------|----------|
| Age Range | ✅ Complete | PreferencesScreen |
| Distance | ✅ Complete | PreferencesScreen |
| Gender | ✅ Complete | PreferencesScreen |
| Looking For | ✅ Complete | PreferencesScreen |
| Match Notifications | ✅ Complete | NotificationPreferencesScreen |
| Message Notifications | ✅ Complete | NotificationPreferencesScreen |
| Like Notifications | ✅ Complete | NotificationPreferencesScreen |
| System Announcements | ✅ Complete | API + NotificationPreferencesScreen |
| Notification Preferences | ✅ Complete | NotificationPreferencesScreen |

---

## 📚 Documentation

**Full Implementation Guide:** `FEATURES_IMPLEMENTATION.md`
- Component documentation
- Service documentation
- API documentation
- Database schema
- Code examples

**Testing Guide:** `FEATURE_7_8_TESTING.md`
- Test cases
- API examples
- E2E workflows
- Troubleshooting

**Summary:** `IMPLEMENTATION_SUMMARY_7_8.md`
- What was built
- Files created/modified
- Technical achievements

---

## 💡 Tips

1. **Always call services** for Firestore access
2. **Validate input** before sending to backend
3. **Show loading states** during saves
4. **Display error messages** to users
5. **Test on actual device** for real touch feedback
6. **Check console** for detailed error messages
7. **Use logout/login** to reload user data
8. **Quiet hours** use 24-hour format (00:00-23:59)

---

## 🔄 Common Workflows

### Set User Preferences
```javascript
const prefs = {
  minAge: 25,
  maxAge: 35,
  maxDistance: 25,
  interestedIn: 'women',
  lookingFor: 'serious'
};

await PreferencesService.updateUserPreferences(userId, prefs);
```

### Update Notifications
```javascript
const settings = {
  matchNotifications: true,
  messageNotifications: true,
  likeNotifications: false,
  systemNotifications: true,
  notificationFrequency: 'instant',
  quietHours: { enabled: false, start: '22:00', end: '08:00' }
};

await NotificationService.updateNotificationPreferences(userId, settings);
```

### Send Notification
```javascript
await NotificationService.sendMatchNotification(userId, 'Jane');
await NotificationService.sendLikeNotification(userId, 'John');
await NotificationService.sendMessageNotification(userId, 'Alex', 'Hi!');
```

---

**Last Updated:** January 3, 2026  
**Status:** ✅ Production Ready
