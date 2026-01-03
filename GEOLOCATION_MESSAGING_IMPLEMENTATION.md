# Geolocation & Discovery + Real-Time Messaging Implementation

## Overview
This document outlines the complete implementation of features 5 (Geolocation & Discovery) and 6 (Real-Time Messaging) from the dating app roadmap.

## Feature 5: Geolocation & Discovery

### 5.1 User Location Capture ✅
**Files Modified:**
- `src/services/LocationService.js`
- `src/screens/HomeScreen.js`

**Implementation:**
- `LocationService.getCurrentLocation()` - Requests foreground location permission and gets current GPS coordinates
- `LocationService.requestLocationPermission()` - Handles permission prompts
- `LocationService.updateUserLocation(userId, location)` - Saves location to Firebase
- HomeScreen automatically captures location on app focus and displays location indicator in header

**Key Features:**
- Balanced accuracy GPS sampling
- Automatic location updates every 5 minutes
- Location stored with timestamp and accuracy metadata

### 5.2 Distance Calculation ✅
**Files Modified:**
- `src/services/LocationService.js`
- `backend/controllers/discoveryController.js`

**Implementation:**
- `LocationService.calculateDistance(coord1, coord2)` - Haversine formula for accurate distance calculation
- Backend filters users based on geospatial queries using MongoDB 2dsphere indexes
- Distance displayed on discovery cards (rounded to 1 decimal place)

**Supported Methods:**
- Client-side calculation (LocationService)
- Server-side MongoDB geospatial queries (`$near` operator)

### 5.3 Radius-Based Filtering ✅
**Files Modified:**
- `backend/models/User.js`
- `backend/controllers/discoveryController.js`

**Implementation:**
- `User.findNearby(longitude, latitude, maxDistance, options)` - Static method for radius filtering
- Supports custom search radius (1-50,000 meters)
- MongoDB 2dsphere index on location field for performance
- Compound indexes for efficient multi-field queries (location, gender, age, verification status)

**Discovery API Endpoint:**
```
GET /api/discover/users?lat=40.7128&lng=-74.0060&radius=50000
```

### 5.4 Location Permission Handling ✅
**Files Modified:**
- `src/services/LocationService.js`

**Implementation:**
- `requestLocationPermission()` - Foreground location (live tracking)
- `requestBackgroundLocationPermission()` - Background location (future feature)
- Graceful fallback if permissions denied
- User-friendly alert prompts

**Permission Flow:**
1. Request foreground permissions on app focus
2. User grants/denies in native dialog
3. If denied, show alert and return null
4. If granted, proceed with location capture

### 5.5 Privacy Controls ✅
**Files Modified:**
- `backend/models/User.js`
- `backend/controllers/discoveryController.js`
- `src/screens/PreferencesScreen.js`
- `src/services/LocationService.js`

**Implementation:**

**Database Fields Added:**
```javascript
locationPrivacy: {
  type: String,
  enum: ['hidden', 'visible_to_matches', 'visible_to_all'],
  default: 'visible_to_matches'
}
locationHistoryEnabled: Boolean
preferredDistance: Number (default: 50 km)
lastLocationUpdate: Date
```

**Privacy Levels:**
1. **Hidden** - Location not visible to anyone (discovery still works, just no distance shown)
2. **Visible to Matches** - Only matched users can see location
3. **Visible to All** - All users in discovery can see location

**UI Components:**
- PreferencesScreen with location privacy selector
- Icon indicators for each privacy level
- Descriptions of what each level means

**API Endpoints Added:**
```
PUT /api/discovery/location-privacy
GET /api/discovery/location-privacy
PUT /api/discovery/preferred-distance
```

**Methods in LocationService:**
- `updateLocationPrivacy(userId, privacyLevel)`
- `getLocationPrivacy(userId)`

---

## Feature 6: Real-Time Messaging

### 6.1 WebSocket/Socket.io Setup ✅
**Files Modified:**
- `backend/server.js`
- `src/context/ChatContext.js`

**Implementation:**

**Backend Socket.io:**
```javascript
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

**Key Socket Events:**
- `connection` - User connects to chat server
- `join_room` - User joins a specific match room
- `send_message` - Send message to match
- `typing_start/typing_stop` - Typing indicators
- `message_read` - Mark message as read
- `disconnect` - User disconnects

**Frontend Socket.io Integration:**
- Located in `ChatProvider` (ChatContext.js)
- Auto-connects when user authenticates
- Maintains connection with fallback to polling
- Handles reconnection automatically

### 6.2 1-on-1 Chat Interface ✅
**Files Modified:**
- `src/screens/ChatScreen.js`
- `src/context/ChatContext.js`

**Implementation:**

**Chat Screen Features:**
- Message list with pagination (50 messages per page)
- Load more functionality for older messages
- Auto-scroll to latest message
- Connection indicator (green=connected, red=disconnected)
- Other user name and status display

**Message Rendering:**
- Different styling for sent vs received messages
- Gradient backgrounds for sent messages
- Plain white background for received messages
- Message timestamps
- Avatar support (ready for implementation)

### 6.3 Message Persistence ✅
**Files Modified:**
- `backend/models/Message.js`
- `backend/controllers/chatController.js`
- `backend/server.js`

**Implementation:**

**Message Schema:**
```javascript
{
  matchId: ObjectId (ref: 'Swipe'),
  senderId: ObjectId (ref: 'User'),
  receiverId: ObjectId (ref: 'User'),
  content: String (max 1000 chars),
  type: String ('text', 'image', 'gif', 'system'),
  imageUrl: String (for images/GIFs),
  imageMetadata: {
    width: Number,
    height: Number,
    size: Number,
    mimeType: String
  },
  isRead: Boolean,
  readAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Database Queries:**
- `Message.getMessagesForMatch(matchId, limit, skip)` - Get paginated messages
- `Message.markMatchAsRead(matchId, userId)` - Mark all as read
- `Message.getUnreadCount(userId)` - Get unread count
- Compound indexes for efficient queries

**Persistence Flow:**
1. Message sent via Socket.io
2. Validated on server
3. Saved to MongoDB
4. Emitted to all users in room
5. Stored in ChatContext state

### 6.4 Read Receipts ✅
**Files Modified:**
- `backend/models/Message.js`
- `backend/controllers/chatController.js`
- `backend/server.js`
- `src/context/ChatContext.js`
- `src/screens/ChatScreen.js`

**Implementation:**

**Database Tracking:**
- `isRead` boolean field
- `readAt` timestamp field
- `readBy` user ID (for future group chat support)

**Read Receipt Flow:**
1. Message received and displayed in ChatScreen
2. useEffect detects new message for current user
3. Client sends `message_read` event after 500ms delay
4. Server updates message: `isRead = true`, `readAt = now()`
5. Server broadcasts `message_read_receipt` to match room
6. All clients update message UI with read status

**Visual Indicators:**
- Single checkmark ✓ - Message sent
- Double checkmark ✓✓ - Message read
- Checkmark color changes opacity when read
- Read timestamp tracked in database

**API Endpoints:**
```
PUT /api/chat/messages/:messageId/read - Mark specific message as read
GET /api/chat/messages/:matchId/read-receipts - Get all read receipts
```

### 6.5 Typing Indicators ✅
**Files Modified:**
- `backend/server.js`
- `src/context/ChatContext.js`
- `src/screens/ChatScreen.js`

**Implementation:**

**Socket Events:**
- `typing_start` - User starts typing
- `typing_stop` - User stops typing
- `user_typing` - Broadcast to other user

**Client-Side Logic:**
- User types in TextInput
- `handleTextChange()` called
- If text exists and no timeout: emit `typing_start`
- 1-second timeout resets after each keystroke
- After 1 second of no input: emit `typing_stop`

**UI Display:**
- "typing..." indicator below user name in header
- Italicized gray text
- Only shown for other user (not self)
- Updates in real-time

**Methods in ChatContext:**
- `startTyping()` - Emit typing_start event
- `stopTyping()` - Emit typing_stop event
- `otherUserTyping` state - Tracks if other user is typing

### 6.6 Message Timestamps ✅
**Files Modified:**
- `backend/models/Message.js`
- `src/screens/ChatScreen.js`

**Implementation:**

**Timestamp Recording:**
- `createdAt` - When message was created
- `readAt` - When message was read
- `updatedAt` - Mongoose automatic field

**Display Format:**
```
HH:MM (12-hour format with AM/PM)
Example: "2:45 PM"
```

**Rendering:**
- Shows below message content
- Different styling for sent (lighter) vs received (darker)
- Truncates to just time (no date) for cleaner UI
- Optional: Can add date separators for messages from different days

### 6.7 Image/GIF Sharing ✅
**Files Modified:**
- `backend/models/Message.js`
- `backend/controllers/chatController.js`
- `backend/server.js`
- `src/context/ChatContext.js`
- `src/screens/ChatScreen.js`

**Implementation:**

**Image Message Types:**
- `image` - Photo from gallery or camera
- `gif` - Animated GIF

**Image Handling in ChatScreen:**

**UI Components:**
- Media button next to text input (image icon)
- Tapping opens action sheet with options:
  - "Take Photo" - Open camera
  - "Choose from Library" - Open photo picker
  - "Cancel"

**Methods:**
- `handlePickImage()` - Launch image picker
- `handleTakePicture()` - Open camera
- `handleShowMediaOptions()` - Show action sheet

**Permission Handling:**
- Camera permissions for photo capture
- Photo library permissions for picker
- Graceful errors if permissions denied

**Image Message Sending:**
```javascript
sendImageMessage(matchId, imageUri, {
  caption: string,
  width: number,
  height: number,
  size: number,
  mimeType: string
})
```

**Socket Event:**
```javascript
socket.emit('send_message', {
  matchId,
  content: caption,
  type: 'image',
  imageUrl,
  imageMetadata: {width, height, size, mimeType}
})
```

**Image Display:**
- 200x200px thumbnail in message
- Rounded corners (12px border radius)
- Caption below image if provided
- Timestamp below caption
- Read receipt indicator in corner

**Database Storage:**
- Images stored as URLs (external storage ready)
- Image metadata (width, height, size, MIME type)
- Supports JPEG, PNG, GIF, WebP

**GIF Support:**
- Handled same as images
- MIME type: 'image/gif'
- Type: 'gif'
- Animated in message display

**Future Enhancements:**
- External image upload to S3/GCS
- Image compression before upload
- Thumbnail generation
- Image viewing modal with fullscreen option

---

## Database Schema Updates

### User Model Enhancements
```javascript
// Location and privacy
location: {
  type: { type: String, enum: ['Point'] },
  coordinates: [Number] // [longitude, latitude]
}
locationPrivacy: String // 'hidden', 'visible_to_matches', 'visible_to_all'
lastLocationUpdate: Date
locationHistoryEnabled: Boolean
preferredDistance: Number
```

### Message Model Enhancements
```javascript
// Image/GIF support
type: String // 'text', 'image', 'gif', 'system'
imageUrl: String
imageMetadata: {
  width: Number,
  height: Number,
  size: Number,
  mimeType: String
}

// Read receipts
isRead: Boolean
readAt: Date
```

---

## API Reference

### Discovery Endpoints
```
GET /api/discover/users?lat=40.7128&lng=-74.0060&radius=50000
  - Discover nearby users
  - Returns: Array of users with distance

PUT /api/discovery/location-privacy
  - Update location privacy level
  - Body: { privacyLevel: 'hidden' | 'visible_to_matches' | 'visible_to_all' }

GET /api/discovery/location-privacy
  - Get current location privacy settings

PUT /api/discovery/preferred-distance
  - Update preferred discovery distance
  - Body: { preferredDistance: number }
```

### Chat Endpoints
```
GET /api/chat/messages/:matchId?page=1&limit=50
  - Get messages with pagination

PUT /api/chat/messages/:matchId/read
  - Mark all messages in conversation as read

PUT /api/chat/messages/:messageId/read
  - Mark specific message as read

GET /api/chat/messages/:matchId/read-receipts
  - Get read receipt status for all messages

GET /api/chat/conversations
  - Get all conversations with last message

DELETE /api/chat/messages/:messageId
  - Delete a message
```

---

## Socket.io Events

### Connection Events
```javascript
'connect'           - Connected to server
'disconnect'        - Disconnected from server
'error'            - Connection error
```

### Room Events
```javascript
'join_room'        - Join a match conversation
'joined_room'      - Confirmation of joining room
```

### Message Events
```javascript
'send_message'     - Send message
  Data: { matchId, content, type, imageUrl?, imageMetadata? }

'new_message'      - Receive message
  Data: { message: {_id, matchId, senderId, content, type, imageUrl, createdAt} }

'message_sent'     - Confirmation of sent message
  Data: { messageId, timestamp }
```

### Read Receipt Events
```javascript
'message_read'     - Mark message as read
  Data: { messageId, matchId }

'message_read_receipt' - Broadcast read receipt
  Data: { messageId, readBy, readAt }
```

### Typing Events
```javascript
'typing_start'     - Start typing
  Data: matchId

'typing_stop'      - Stop typing
  Data: matchId

'user_typing'      - Receive typing status
  Data: { userId, isTyping }
```

---

## Testing Checklist

### Geolocation & Discovery
- [ ] Location permission prompts work correctly
- [ ] Current location captured accurately
- [ ] Location updates every 5 minutes
- [ ] Distance calculations are accurate
- [ ] Radius-based filtering works for various distances
- [ ] Privacy level changes take effect immediately
- [ ] Distance hidden when location privacy is 'hidden'
- [ ] Preferred distance affects discovery results
- [ ] Location indicator shows in header

### Real-Time Messaging
- [ ] Socket connection establishes on app start
- [ ] Messages send and receive in real-time
- [ ] Message timestamps display correctly
- [ ] Read receipts update with checkmark icon
- [ ] Typing indicators show/hide appropriately
- [ ] Old messages load when scrolling up
- [ ] Pagination works correctly (50 per page)
- [ ] Auto-scroll to new message works
- [ ] Image picker opens and sends images
- [ ] Camera works for taking photos
- [ ] Images display in message thread
- [ ] Connection indicator shows connection status
- [ ] Unread count updates correctly
- [ ] Conversation list shows latest message

---

## Performance Optimizations

1. **Geolocation:**
   - Balanced accuracy GPS (not high precision)
   - 5-minute update interval (not continuous)
   - Client-side filtering before sending to server
   - MongoDB 2dsphere indexing

2. **Messaging:**
   - 50-message pagination limit
   - Message text limited to 1000 characters
   - Image metadata stored, not base64 encoding
   - Socket connection pooling
   - Room-based broadcasting (not global)

3. **Database:**
   - Compound indexes for common queries
   - TTL indexes for optional message archival
   - Lean queries for read-only operations

---

## Security Considerations

1. **Location Privacy:**
   - Privacy levels enforced at query time
   - Exact coordinates hidden (only distance shown)
   - User control over visibility

2. **Messaging:**
   - Match verification before allowing messages
   - User ID validation in all operations
   - Message content length validation
   - Rate limiting recommended

3. **Authentication:**
   - Socket.io auth via userId handshake
   - JWT tokens recommended for production
   - CORS configured for frontend domain

---

## Future Enhancements

1. **Geolocation:**
   - Background location tracking
   - Location history for analytics
   - Heat maps of user locations
   - Geofencing notifications
   - Smart location suggestions

2. **Messaging:**
   - Video message support
   - Voice messages
   - Message reactions/emojis
   - Message search
   - Message editing/deletion UI
   - Group chat support
   - Call integration (audio/video)

3. **Integration:**
   - AWS S3 for image storage
   - Image compression
   - Thumbnail generation
   - CDN for image delivery
   - Message encryption

---

## Deployment Notes

1. Ensure MongoDB has 2dsphere indexes created:
   ```javascript
   db.users.createIndex({ location: "2dsphere" })
   ```

2. Environment variables needed:
   - `MONGODB_URI` - MongoDB connection string
   - `FRONTEND_URL` - Frontend URL for CORS
   - `JWT_SECRET` - For authentication
   - `NODE_ENV` - production/development

3. Update package.json dependencies if missing:
   - `socket.io` - WebSocket server
   - `socket.io-client` - WebSocket client
   - `expo-image-picker` - Image selection
   - `expo-location` - GPS/location

4. iOS Permissions (Info.plist):
   ```xml
   <key>NSLocationWhenInUseUsageDescription</key>
   <string>We need your location for discovery</string>
   <key>NSLocationAlwaysUsageDescription</key>
   <string>We need your location for background updates</string>
   <key>NSPhotoLibraryUsageDescription</key>
   <string>To share photos in messages</string>
   <key>NSCameraUsageDescription</key>
   <string>To take photos for messages</string>
   ```

5. Android Permissions (AndroidManifest.xml):
   ```xml
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
   <uses-permission android:name="android.permission.CAMERA" />
   <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
   ```

---

## Version Info
- Implementation Date: January 3, 2026
- Features Implemented: 5 (Geolocation & Discovery), 6 (Real-Time Messaging)
- Status: ✅ Complete and ready for testing
