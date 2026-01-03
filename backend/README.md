# Dating App Backend

This is the backend API for the dating app, built with Node.js, Express, and MongoDB.

## Features

- **User Discovery**: Find users within a specified radius using geospatial queries
- **Location-based Matching**: MongoDB 2dsphere indexing for efficient location queries
- **Real-time Chat**: Socket.io-powered messaging with room-based conversations
- **Swipe Tracking**: Record and filter user interactions
- **RESTful API**: Clean API endpoints with validation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Validation**: express-validator
- **Security**: Helmet, CORS
- **Development**: Nodemon, Jest

## Quick Start

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB connection string
   ```

3. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

4. **Start the server**:
   ```bash
   npm run dev  # Development mode with auto-restart
   # or
   npm start    # Production mode
   ```

## API Endpoints

### Discovery
- `GET /api/discover?lat={lat}&lng={lng}&radius={radius}` - Discover users within radius
- `GET /api/discover/settings` - Get user discovery preferences
- `PUT /api/discover/location` - Update user location

### AI
- `POST /api/ai/icebreaker` - Generate icebreaker messages for a target user
  - Body: `{ "targetUserId": "user_id_here" }`
  - Returns: `{ "success": true, "icebreakers": ["message1", "message2", "message3"] }`

### Authentication
Currently using mock authentication via `X-User-ID` header for testing.

## Socket.io Events

### Client Events (emit)
- `join_room` (matchId): Join a chat room for a specific match
- `send_message` (data): Send a message to a room
  - `data.matchId`: Match ID
  - `data.content`: Message content
  - `data.type`: Message type ('text', 'image', etc.)
- `typing_start` (matchId): Indicate user started typing
- `typing_stop` (matchId): Indicate user stopped typing

### Server Events (listen)
- `joined_room` (data): Confirmation of room join
- `new_message` (data): New message received
- `user_typing` (data): Typing status update
- `message_sent` (data): Confirmation of message delivery
- `error` (error): Error occurred

### Room-based Architecture
- Each match has its own Socket.io room named by `matchId`
- Users automatically join their match rooms
- Messages are broadcast to all room members
- Typing indicators are sent to other room members

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/dating-app |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |
| `NODE_ENV` | Environment mode | development |
| `OPENAI_API_KEY` | OpenAI API key (optional) | - |
| `OPENAI_MODEL` | OpenAI model to use | gpt-3.5-turbo |
| `USE_OPENAI` | Enable OpenAI (set to 'false' to use mock) | true if API key exists |

## Database Models

### User
- **Location**: GeoJSON Point with 2dsphere index for geospatial queries
- **Profile**: Basic user information, photos, preferences
- **Activity**: Last active timestamp, verification status

### Swipe
- **Interactions**: Track likes, passes, and superlikes
- **Relationships**: Link swiper to swiped user
- **TTL Index**: Auto-expire old swipes after 30 days

## Testing

```bash
npm test              # Run tests once
npm run test:watch    # Watch mode

# Test Socket.io functionality
node test-socket.js   # Run Socket.io test client
```

## API Usage Examples

### Discover Users
```bash
curl -H "X-User-ID: 507f1f77bcf86cd799439011" \
     "http://localhost:3000/api/discover?lat=40.7128&lng=-74.0060&radius=5000"
```

### Update Location
```bash
curl -X PUT \
     -H "Content-Type: application/json" \
     -H "X-User-ID: 507f1f77bcf86cd799439011" \
     -d '{"latitude": 40.7128, "longitude": -74.0060}' \
     http://localhost:3000/api/discover/location
```

### Generate Icebreakers
```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -H "X-User-ID: 507f1f77bcf86cd799439011" \
     -d '{"targetUserId": "507f1f77bcf86cd799439012"}' \
     http://localhost:3000/api/ai/icebreaker
```

## Development

- Uses ESLint for code linting
- Morgan for request logging
- Compression and Helmet for production optimizations
- Graceful shutdown handling

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set up proper authentication middleware
4. Configure CORS for your frontend domain
5. Set up monitoring and logging