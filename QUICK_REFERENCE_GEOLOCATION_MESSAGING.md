# Quick Reference: Geolocation & Messaging Features

## Core Features Summary

### Geolocation & Discovery (Feature 5)
✅ User location capture via GPS
✅ Distance calculation (Haversine formula)  
✅ Radius-based filtering (1-50,000m)
✅ Location permission handling
✅ Privacy controls (hidden/matches-only/public)

### Real-Time Messaging (Feature 6)
✅ WebSocket/Socket.io setup
✅ 1-on-1 chat interface
✅ Message persistence (MongoDB)
✅ Read receipts with timestamps
✅ Typing indicators
✅ Message timestamps
✅ Image/GIF sharing

---

## Key Files Modified

### Backend
- `backend/models/User.js` - Added location privacy fields
- `backend/models/Message.js` - Added readAt, imageUrl, imageMetadata
- `backend/controllers/discoveryController.js` - Privacy filtering, distance endpoints
- `backend/controllers/chatController.js` - Read receipt endpoints
- `backend/server.js` - Socket.io events for messages/typing/read receipts

### Frontend
- `src/services/LocationService.js` - Location capture, privacy, periodic updates
- `src/context/ChatContext.js` - Socket.io connection, message management
- `src/screens/ChatScreen.js` - Chat UI with read receipts, typing, images
- `src/screens/HomeScreen.js` - Location display, initialization
- `src/screens/PreferencesScreen.js` - Location privacy settings

---

## Quick Start: Using the Features

### Location Capture (Frontend)
```javascript
import { LocationService } from '../services/LocationService';

// Capture current location
const location = await LocationService.getCurrentLocation();
// Returns: { latitude, longitude, accuracy }

// Update in database
await LocationService.updateUserLocation(userId, location);

// Start periodic updates (5 min interval)
LocationService.startPeriodicLocationUpdates(userId);

// Stop updates
LocationService.stopPeriodicLocationUpdates();
```

### Location Privacy
```javascript
// Update privacy level
await LocationService.updateLocationPrivacy(userId, 'visible_to_matches');
// Options: 'hidden', 'visible_to_matches', 'visible_to_all'

// Get current privacy level
const privacy = await LocationService.getLocationPrivacy(userId);
```

### Distance Calculation
```javascript
// Calculate distance between two points
const distance = LocationService.calculateDistance(
  { latitude: 40.7128, longitude: -74.0060 },
  { latitude: 40.7580, longitude: -73.9855 }
);
// Returns: distance in kilometers
```

### Sending Messages
```javascript
import { useChat } from '../context/ChatContext';

const { sendMessage, sendImageMessage, sendGifMessage } = useChat();

// Text message
sendMessage(matchId, 'Hello!');

// Image message
sendImageMessage(matchId, imageUri, {
  caption: 'Check this out!',
  width: 1080,
  height: 1920
});

// GIF message
sendGifMessage(matchId, gifUrl, {
  caption: 'Haha!',
  width: 480,
  height: 480
});
```

### Read Receipts
```javascript
// Send read receipt for a message
sendReadReceipt(messageId);

// Messages automatically tracked with:
// - message.isRead (boolean)
// - message.readAt (timestamp)
```

### Typing Indicators
```javascript
// Start typing
startTyping();

// Stop typing (auto after 1 second of no input)
stopTyping();

// Listen for other user typing
const { otherUserTyping } = useChat();
```

---

## Database Queries

### Find Nearby Users
```javascript
const nearbyUsers = await User.findNearby(
  longitude,    // User's longitude
  latitude,     // User's latitude
  50000,        // Search radius in meters
  {
    excludeIds: [userId],
    minAge: 18,
    maxAge: 100,
    preferredGender: 'female'
  }
);
```

### Get Messages
```javascript
const messages = await Message.getMessagesForMatch(
  matchId,
  50,   // limit
  0     // skip (for pagination)
);
```

### Mark Messages as Read
```javascript
await Message.markMatchAsRead(matchId, userId);
```

### Get Read Receipts
```javascript
const messages = await Message.find({ matchId })
  .select('_id senderId receiverId isRead readAt');
```

---

## API Endpoints

### Discovery
```
GET /api/discover/users?lat=40.7128&lng=-74.0060&radius=50000
PUT /api/discovery/location-privacy
GET /api/discovery/location-privacy
PUT /api/discovery/preferred-distance
```

### Chat
```
GET /api/chat/messages/:matchId?page=1&limit=50
PUT /api/chat/messages/:matchId/read
GET /api/chat/conversations
PUT /api/chat/messages/:messageId/read
```

---

## Socket.io Events

### Send/Receive Messages
```javascript
// Send
socket.emit('send_message', {
  matchId,
  content,
  type: 'text' | 'image' | 'gif'
});

// Receive
socket.on('new_message', (data) => {
  const { message } = data;
  // Update UI
});
```

### Typing Indicators
```javascript
socket.emit('typing_start', matchId);
socket.emit('typing_stop', matchId);

socket.on('user_typing', (data) => {
  const { userId, isTyping } = data;
});
```

### Read Receipts
```javascript
socket.emit('message_read', {
  messageId,
  matchId
});

socket.on('message_read_receipt', (data) => {
  const { messageId, readBy, readAt } = data;
});
```

---

## Common Tasks

### Show Distance on Discovery Card
```javascript
const distance = LocationService.getLocationDisplayString(distanceKm);
// Returns: "< 1 km away", "5.2 km away", "25 km away", etc.
```

### Get User Location
```javascript
const location = await LocationService.getCurrentLocation();
if (location) {
  console.log(`Lat: ${location.latitude}, Lng: ${location.longitude}`);
}
```

### Check if Message is Read
```javascript
const isRead = message.isRead;
const readTime = message.readAt; // ISO string

// Display check marks
if (isRead) {
  // Show double checkmark ✓✓
} else {
  // Show single checkmark ✓
}
```

### Load Old Messages
```javascript
const page2Messages = await loadMessages(matchId, 2);
// Automatically handles pagination
```

### Send Image Message
```javascript
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.8
});

if (!result.canceled) {
  sendImageMessage(matchId, result.assets[0].uri, {
    caption: 'Check it out!',
    width: result.assets[0].width,
    height: result.assets[0].height
  });
}
```

---

## State Management (ChatContext)

```javascript
const {
  // State
  isConnected,           // boolean - Socket connection status
  conversations,         // array - List of all conversations
  currentMatchId,        // string - Current chat room ID
  messages,             // array - Messages in current room
  unreadCount,          // number - Total unread message count
  otherUserTyping,      // boolean - Is other user typing

  // Actions
  loadConversations,    // Load all chat rooms
  loadMessages,         // Load messages for match (with pagination)
  joinRoom,            // Join a chat room
  sendMessage,         // Send text message
  sendImageMessage,    // Send image with caption
  sendGifMessage,      // Send GIF with caption
  markAsRead,          // Mark all conversation messages as read
  sendReadReceipt,     // Send read receipt for specific message
  startTyping,         // Emit typing_start event
  stopTyping,          // Emit typing_stop event
  clearCurrentConversation // Clear message state
} = useChat();
```

---

## Debugging Tips

### Check Socket Connection
```javascript
const { isConnected } = useChat();
console.log('Socket connected:', isConnected);
```

### View Location
```javascript
const { userLocation } = useHomeScreen();
console.log('Location:', userLocation);
// { latitude: 40.7128, longitude: -74.0060, accuracy: 5 }
```

### Check Message Status
```javascript
messages.forEach(msg => {
  console.log(`ID: ${msg._id}, Read: ${msg.isRead}, ReadAt: ${msg.readAt}`);
});
```

### Monitor Socket Events
```javascript
socket.onAny((event, data) => {
  console.log(`Socket event: ${event}`, data);
});
```

---

## Error Handling

### Location Errors
```javascript
try {
  const location = await LocationService.getCurrentLocation();
  if (!location) {
    console.log('Location permission denied');
  }
} catch (error) {
  console.error('Location error:', error);
}
```

### Message Errors
```javascript
if (!isConnected) {
  Alert.alert('Not Connected', 'Waiting for connection...');
  return;
}

if (!messageText.trim()) {
  Alert.alert('Empty Message', 'Cannot send empty message');
  return;
}
```

---

## Performance Notes

- Location updates: Every 5 minutes (configurable)
- Message pagination: 50 per page
- Max message length: 1000 characters
- Image dimensions tracked (not resized server-side)
- Socket pooling recommended for production

---

## Next Steps / Future Work

1. AWS S3 image upload integration
2. Image compression before sending
3. Message search functionality
4. Video messages
5. Voice messages
6. Group chat support
7. Call integration
8. End-to-end encryption
9. Offline message queue
10. Message reactions/emojis

---

Last Updated: January 3, 2026
Status: ✅ Complete and tested
