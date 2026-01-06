# Frontend/Backend API Alignment Report

## Issues Found and Fixed

### 1. ✅ Fixed: `registerForEvent` API Mismatch

**Issue:**
- Frontend was sending `userId` in the request body: `api.post('/social/events/${eventId}/register', { userId })`
- Backend now uses `req.user.id` from JWT authentication and doesn't expect `userId` in the body

**Fix:**
- Updated `src/services/SocialFeaturesService.js` to remove `userId` parameter from `registerForEvent`
- Updated `src/screens/EventsScreen.js` to call `registerForEvent(eventId)` without userId
- `EventDetailScreen.js` was already correct

**Files Changed:**
- `src/services/SocialFeaturesService.js`
- `src/screens/EventsScreen.js`

---

### 2. ✅ Fixed: Missing `leaveEvent` API in Frontend

**Issue:**
- Backend has `POST /api/social/events/:eventId/leave` endpoint
- Frontend service was missing the `leaveEvent` method

**Fix:**
- Added `leaveEvent` method to `src/services/SocialFeaturesService.js`
- Method signature: `leaveEvent(eventId)` - no userId needed (uses auth token)

**Files Changed:**
- `src/services/SocialFeaturesService.js`

---

### 3. ✅ Fixed: `getNearbyEvents` Response Structure Mismatch

**Issue:**
- Backend returns: `{ success: true, data: events, pagination: {...} }`
- Frontend expects: `{ events: [...], pagination: {...} }`
- Frontend code accesses `data.events` which would be undefined

**Fix:**
- Updated `getNearbyEvents` in `src/services/SocialFeaturesService.js` to normalize the response
- Now returns: `{ events: response.data || [], pagination: response.pagination || {}, ...response }`
- Added support for pagination parameters (`page`, `limit`)

**Files Changed:**
- `src/services/SocialFeaturesService.js`

---

### 4. ⚠️ Note: Socket.io Event Handlers Not Yet Implemented in Frontend

**Status:** Backend is ready, frontend integration pending

**Backend Events Available:**
- `join_event_room` - Subscribe to event updates
- `leave_event_room` - Unsubscribe from event updates
- `event:user_joined` - Emitted when user joins event
- `event:user_left` - Emitted when user leaves event
- `event:capacity_updated` - Emitted when event reaches capacity
- `event:status_changed` - Emitted when event status changes

**Recommendation:**
- Add Socket.io event handlers in `EventDetailScreen.js` and `EventsScreen.js` to:
  - Subscribe to event room when viewing event details
  - Update UI in real-time when users join/leave
  - Show capacity updates without page refresh

**Example Implementation:**
```javascript
// In EventDetailScreen.js
useEffect(() => {
  if (event?._id && socket) {
    // Join event room
    socket.emit('join_event_room', { eventId: event._id });
    
    // Listen for updates
    const unsubscribe = socket.on('event:user_joined', (data) => {
      // Update attendee count
      setEvent(prev => ({
        ...prev,
        currentAttendeeCount: data.attendeeCount,
        isFull: data.isFull
      }));
    });
    
    return () => {
      socket.emit('leave_event_room', { eventId: event._id });
      unsubscribe();
    };
  }
}, [event?._id, socket]);
```

---

## API Endpoints Summary

### Events API

| Method | Endpoint | Frontend Method | Status |
|--------|----------|----------------|--------|
| POST | `/api/social/events` | `createEvent(data)` | ✅ Aligned |
| POST | `/api/social/events/:eventId/register` | `registerForEvent(eventId)` | ✅ Fixed |
| POST | `/api/social/events/:eventId/leave` | `leaveEvent(eventId)` | ✅ Added |
| GET | `/api/social/events/nearby` | `getNearbyEvents(lng, lat, maxDist, category, page, limit)` | ✅ Fixed |

### Response Formats

**Backend Response Format (Standard):**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "pagination": { ... } // if applicable
}
```

**Frontend Normalization:**
- `registerForEvent`: Returns `response.data` directly (contains `{ event, attendeeCount, isFull }`)
- `leaveEvent`: Returns `response.data` directly (contains `{ event, attendeeCount }`)
- `getNearbyEvents`: Normalized to `{ events: [...], pagination: {...}, ...response }`

---

## Testing Recommendations

1. **Test Event Registration:**
   - Verify no userId is sent in request body
   - Verify authentication token is used correctly
   - Test error handling for capacity full, deadline passed, etc.

2. **Test Event Leave:**
   - Verify leave functionality works
   - Test that organizer cannot leave their own event

3. **Test Nearby Events:**
   - Verify response structure matches frontend expectations
   - Test pagination parameters
   - Test category filtering
   - Test with/without user location

4. **Test Socket.io Integration (Future):**
   - Verify real-time updates work when users join/leave
   - Test event room subscription/unsubscription
   - Test capacity update notifications

---

## Next Steps

1. ✅ All critical API mismatches have been fixed
2. ⚠️ Consider adding Socket.io event handlers for real-time updates (optional enhancement)
3. ✅ Frontend and backend are now aligned for event features
