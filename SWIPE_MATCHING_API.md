# Swipe & Matching System - API Documentation

## Swipe Service (Frontend)

### SwipeController.saveSwipe()
Save a swipe action with limit checking.

**Signature**
```typescript
static async saveSwipe(
  swiperId: string,
  targetId: string, 
  type: 'like' | 'dislike',
  isPremium: boolean = false
): Promise<SwipeResult>
```

**Parameters**
- `swiperId` (string): User ID performing the swipe
- `targetId` (string): User ID being swiped on
- `type` (string): 'like' or 'dislike'
- `isPremium` (boolean): Whether user has premium subscription

**Returns**
```javascript
{
  success: boolean,
  swipeId: string,          // ID of created swipe
  match: boolean,           // True if mutual like
  matchId: string,          // ID of match if created
  error: string,            // Error message if failed
  limitExceeded: boolean,   // True if daily limit reached
  remaining: number         // Swipes remaining
}
```

**Example**
```javascript
const result = await SwipeController.saveSwipe(
  currentUser.uid, 
  targetUser.id, 
  'like',
  isPremium
);

if (result.success && result.match) {
  console.log(`Matched with ${targetUser.name}!`);
}
```

---

### SwipeController.checkSwipeLimit()
Check if user can perform swipes.

**Signature**
```typescript
static async checkSwipeLimit(
  userId: string,
  isPremium: boolean = false
): Promise<LimitCheck>
```

**Returns**
```javascript
{
  canSwipe: boolean,        // True if under limit
  remaining: number,        // Swipes left (or -1 for unlimited)
  isUnlimited: boolean      // True if premium
}
```

---

### SwipeController.getSwipesCountToday()
Get number of swipes made today.

**Signature**
```typescript
static async getSwipesCountToday(userId: string): Promise<number>
```

**Returns** - Number of swipes made since midnight UTC

---

### SwipeController.undoSwipe()
Remove last swipe and restore counter.

**Signature**
```typescript
static async undoSwipe(
  userId: string,
  swipeId: string
): Promise<UndoResult>
```

**Returns**
```javascript
{
  success: boolean,
  message: string,
  error: string             // Only if failed
}
```

---

### SwipeController.checkAndCreateMatch()
Check for mutual like and create match.

**Signature**
```typescript
static async checkAndCreateMatch(
  swiperId: string,
  targetId: string
): Promise<MatchResult>
```

**Returns**
```javascript
{
  isMatch: boolean,
  matchId: string           // Only if matched
}
```

---

### SwipeController.getUserMatches()
Get all matches for a user with expiration info.

**Signature**
```typescript
static async getUserMatches(userId: string): Promise<Match[]>
```

**Returns**
```javascript
[
  {
    id: string,             // Match document ID
    userId: string,         // Other user's ID
    user: {
      id: string,
      name: string,
      photoURL: string,
      age: number
    },
    createdAt: Timestamp,
    isExpired: boolean,     // If 14+ days old
  },
  ...
]
```

---

### SwipeController.unmatch()
Remove match and delete relationship.

**Signature**
```typescript
static async unmatch(
  userId1: string,
  userId2: string
): Promise<UnmatchResult>
```

**Returns**
```javascript
{
  success: boolean,
  message: string,
  error: string             // Only if failed
}
```

---

### SwipeController.isMatchExpired()
Check if match has expired.

**Signature**
```typescript
static isMatchExpired(
  matchData: Object,
  expirationDays: number = 14
): boolean
```

---

### SwipeController.getDaysUntilExpiration()
Get remaining days until match expires.

**Signature**
```typescript
static getDaysUntilExpiration(
  matchData: Object,
  expirationDays: number = 14
): number
```

**Returns** - Days remaining (0 if expired)

---

### SwipeController.cleanupExpiredMatches()
Remove all expired matches for user.

**Signature**
```typescript
static async cleanupExpiredMatches(
  userId: string,
  expirationDays: number = 14
): Promise<CleanupResult>
```

**Returns**
```javascript
{
  success: boolean,
  removedCount: number,
  error: string             // Only if failed
}
```

---

## Backend API Endpoints

### POST /api/swipes
Create a new swipe.

**Request**
```javascript
{
  targetId: string,
  action: 'like' | 'pass' | 'superlike'
}
```

**Response (Success)**
```javascript
{
  success: true,
  data: {
    swipeId: string,
    action: string,
    match: boolean,
    remaining: number
  }
}
```

**Response (Limit Exceeded)**
```javascript
{
  success: false,
  message: 'Daily swipe limit reached',
  remaining: 0,
  limit: 50
}
```

**Status Codes**
- 200: Swipe created successfully
- 400: Invalid input or duplicate swipe
- 429: Daily limit exceeded
- 500: Server error

---

### GET /api/swipes/count/today
Get today's swipe count.

**Response**
```javascript
{
  success: true,
  data: {
    used: number,
    remaining: number,
    limit: number | 'unlimited',
    isPremium: boolean
  }
}
```

---

### POST /api/swipes/undo
Undo last swipe.

**Request**
```javascript
{
  swipeId: string
}
```

**Response**
```javascript
{
  success: true,
  message: 'Swipe undone successfully'
}
```

**Status Codes**
- 200: Swipe undone
- 400: Missing swipeId
- 403: Unauthorized (not swiper)
- 404: Swipe not found
- 500: Server error

---

### GET /api/swipes/user
Get user's swipes.

**Response**
```javascript
{
  success: true,
  data: {
    swipes: [
      {
        _id: string,
        swiperId: string,
        swipedId: {
          _id: string,
          name: string,
          photoURL: string,
          age: number
        },
        action: string,
        createdAt: Date
      }
    ],
    count: number
  }
}
```

---

### GET /api/swipes/received
Get received swipes (likes).

**Response**
```javascript
{
  success: true,
  data: {
    swipes: [
      {
        _id: string,
        swiperId: {
          _id: string,
          name: string,
          photoURL: string,
          age: number
        },
        swipedId: string,
        action: string,
        createdAt: Date
      }
    ],
    count: number
  }
}
```

---

## Data Models

### Swipe Document
```javascript
{
  _id: ObjectId,
  swiperId: ObjectId,      // Who swiped
  swipedId: ObjectId,      // Who was swiped on
  action: 'like' | 'pass' | 'superlike',
  createdAt: Date,
  // Auto-delete after 30 days
}
```

**Indexes**
```javascript
{ swiperId: 1, swipedId: 1 }    // Unique: prevent duplicates
{ swiperId: 1, createdAt: -1 }  // Find user's swipes
{ swipedId: 1, action: 1 }      // Find who swiped on user
```

---

### Match Document (Firestore)
```javascript
{
  _id: "userId1_userId2",   // Lexicographically sorted
  user1: string,
  user2: string,
  createdAt: Timestamp,
  lastMessageAt: Timestamp,
  lastMessage: string
}
```

---

### User Updates
```javascript
{
  swipesToday: number,
  lastSwipeDate: string,    // Format: "MM/DD/YYYY"
  matches: [string],        // Array of user IDs
  swipedUsers: [string]     // Array of swiped user IDs
}
```

---

## Error Handling

### Common Error Responses

**Daily Limit Exceeded**
```javascript
{
  success: false,
  error: 'Daily swipe limit reached',
  limitExceeded: true,
  remaining: 0
}
```

**Duplicate Swipe**
```javascript
{
  success: false,
  error: 'Swipe already exists'
}
```

**Unauthorized**
```javascript
{
  success: false,
  error: 'Unauthorized to delete this swipe'
}
```

**Not Found**
```javascript
{
  success: false,
  error: 'Swipe not found'
}
```

---

## Rate Limiting

- **Free Users**: 50 swipes per 24 hours
- **Premium Users**: Unlimited swipes
- **Reset Time**: Daily at midnight UTC
- **Check Before**: Every swipe action validates limit

---

## Timestamps

All timestamps in ISO 8601 format:
```
2024-01-15T14:30:45.123Z
```

Daily counter resets based on UTC date:
```javascript
new Date().toDateString()  // "Mon Jan 15 2024"
```

---

## Pagination

Not currently implemented, but can be added:
```javascript
// Future: Support offset/limit for swipes list
GET /api/swipes/user?offset=0&limit=20
```

---

## Webhooks

Not currently implemented, but could add:
- `match.created` - When mutual like detected
- `match.expired` - When match reaches 14 days
- `swipe.limit_reached` - When user hits daily limit
