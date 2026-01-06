# NotificationService Refactor - Backend API Integration

## Problem

The frontend `NotificationService` was bypassing the backend entirely by writing directly to Firestore, causing:

- No server-side notification preferences sync
- Backend `/api/notifications/*` routes unused
- Inconsistent data between Firestore and MongoDB
- Missing server-side validation and business logic

## Solution

Refactored `NotificationService` to use backend API endpoints instead of direct Firestore access.

## Changes Made

### 1. Frontend: NotificationService.js

**Before**: Direct Firestore access

```javascript
await updateDoc(doc(db, 'users', userId), {
  pushToken: tokenData,
  notificationsEnabled: true,
});
```

**After**: Backend API calls

```javascript
await api.put('/profile/update', {
  pushToken: tokenData,
  notificationsEnabled: true,
});
```

### 2. Backend: profileController.js

**Added**: Support for pushToken and notificationsEnabled in profile update

- `pushToken` - Expo push notification token
- `notificationsEnabled` - Global notification toggle

### 3. All Notification Operations Now Use Backend

| Operation              | Old Method       | New Method                           |
| ---------------------- | ---------------- | ------------------------------------ |
| Register Push Token    | Direct Firestore | `PUT /api/profile/update`            |
| Get Preferences        | Direct Firestore | `GET /api/notifications/preferences` |
| Update Preferences     | Direct Firestore | `PUT /api/notifications/preferences` |
| Enable Notifications   | Direct Firestore | `PUT /api/notifications/enable`      |
| Disable Notifications  | Direct Firestore | `PUT /api/notifications/disable`     |
| Send Notification      | Direct Expo API  | `POST /api/notifications/send`       |
| Send Bulk Notification | Direct Expo API  | `POST /api/notifications/send-bulk`  |

## Benefits

1. **Server-Side Sync**: All notification preferences stored in MongoDB via backend
2. **Validation**: Backend validates notification preferences (frequency, quiet hours, etc.)
3. **Business Logic**: Backend handles quiet hours, notification type filtering
4. **Consistency**: Single source of truth (MongoDB) instead of Firestore
5. **Security**: Server-side checks prevent unauthorized notification sending
6. **Analytics**: Backend can track notification delivery and preferences

## API Endpoints Used

### Profile Update (Push Token)

```
PUT /api/profile/update
Body: { pushToken: string, notificationsEnabled: boolean }
```

### Notification Preferences

```
GET /api/notifications/preferences
Returns: { success: true, data: { preferences: {...} } }

PUT /api/notifications/preferences
Body: {
  matchNotifications: boolean,
  messageNotifications: boolean,
  likeNotifications: boolean,
  systemNotifications: boolean,
  notificationFrequency: 'instant' | 'daily' | 'weekly',
  quietHours: { enabled: boolean, start: string, end: string }
}
```

### Enable/Disable

```
PUT /api/notifications/enable
PUT /api/notifications/disable
```

### Send Notifications

```
POST /api/notifications/send
Body: {
  toUserId: string,
  type: 'match' | 'message' | 'like' | 'system',
  title: string,
  message: string,
  data: object
}

POST /api/notifications/send-bulk
Body: {
  userIds: string[],
  type: string,
  title: string,
  message: string,
  data: object
}
```

## Migration Notes

### Breaking Changes

- **None** - All public methods maintain the same signature
- Existing code using `NotificationService` will continue to work

### Data Migration

- Existing Firestore notification preferences will need to be migrated to MongoDB
- Push tokens in Firestore should be migrated to MongoDB User model
- Consider running a migration script to sync existing data

## Testing Checklist

- [ ] Push token registration works via backend
- [ ] Get notification preferences from backend
- [ ] Update notification preferences via backend
- [ ] Enable/disable notifications via backend
- [ ] Send notification via backend (respects preferences)
- [ ] Send bulk notification via backend
- [ ] Quiet hours are respected by backend
- [ ] Notification type preferences are respected
- [ ] Error handling works correctly
- [ ] Offline fallback behavior (if applicable)

## Files Modified

1. `src/services/NotificationService.js` - Complete refactor
2. `backend/controllers/profileController.js` - Added pushToken support
3. `NOTIFICATION_SERVICE_REFACTOR.md` - This document

## Files Using NotificationService

- `src/context/AuthContext.js` - Register push token on login
- `src/screens/NotificationPreferencesScreen.js` - Get/update preferences
- `src/services/SwipeController.js` - Send match/like notifications

All these files will continue to work without changes due to maintained API compatibility.

## Next Steps

1. **Data Migration**: Migrate existing Firestore notification data to MongoDB
2. **Testing**: Test all notification flows end-to-end
3. **Monitoring**: Add logging/metrics for notification delivery
4. **Remove Firestore Dependency**: Once migration complete, remove Firestore imports from NotificationService

## Backend Notification Flow

```
Frontend → Backend API → Notification Controller
                            ↓
                    Check Preferences
                            ↓
                    Check Quiet Hours
                            ↓
                    Send via Expo Push Service
                            ↓
                    Store in Database (optional)
```

## Security Improvements

1. **Authentication**: All endpoints require authentication
2. **Authorization**: Users can only manage their own preferences
3. **Validation**: Backend validates all notification data
4. **Rate Limiting**: Backend can rate limit notification sending
5. **Audit Trail**: All notification operations logged server-side

---

**Status**: ✅ Refactored and ready for testing
**Date**: [Current Date]
