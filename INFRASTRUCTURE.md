# Backend Infrastructure Implementation

## Overview

This document describes the complete backend infrastructure implementation for the dating app.

## ✅ Technical Implementation Checklist

### Backend Infrastructure

| Component                        | Status | Implementation                                     |
| -------------------------------- | ------ | -------------------------------------------------- |
| Database schema design (MongoDB) | ✅     | Enhanced with indexes, connection pooling          |
| REST API endpoints               | ✅     | Full Express.js API with validation                |
| File storage (S3/Cloudinary)     | ✅     | Dual provider support with CDN                     |
| CDN setup for images             | ✅     | Cloudinary transformations + CloudFront            |
| Redis for caching                | ✅     | ioredis with comprehensive caching service         |
| Message queue (Bull/Redis)       | ✅     | Bull queues for background processing              |
| WebSocket server                 | ✅     | Socket.io with presence & reconnection             |
| Background jobs                  | ✅     | Job processors for notifications, matches, cleanup |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Load Balancer / CDN                      │
│                        (Nginx/CloudFront)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
         ┌──────▼──────┐            ┌───────▼───────┐
         │   API Server │            │  WebSocket    │
         │  (Express)   │            │   (Socket.io) │
         └──────┬───────┘            └───────┬───────┘
                │                            │
    ┌───────────┴────────────────────────────┴───────────┐
    │                                                     │
┌───▼───┐  ┌───────┐  ┌─────────┐  ┌──────────┐  ┌──────▼─────┐
│MongoDB│  │ Redis │  │ Storage │  │  Worker  │  │ Bull Queue │
│       │  │ Cache │  │ S3/CDN  │  │ (Jobs)   │  │            │
└───────┘  └───────┘  └─────────┘  └──────────┘  └────────────┘
```

## File Structure

```
backend/
├── config/
│   ├── database.js      # MongoDB connection with pooling
│   ├── redis.js         # Redis client and cache utilities
│   └── firebase.js      # Firebase Admin SDK
├── middleware/
│   ├── auth.js          # JWT authentication
│   ├── rateLimiter.js   # Redis-based rate limiting
│   └── upload.js        # Multer file upload handling
├── services/
│   ├── StorageService.js    # S3/Cloudinary file uploads
│   ├── CacheService.js      # High-level caching abstractions
│   ├── QueueService.js      # Bull queue management
│   ├── JobProcessors.js     # Background job handlers
│   └── WebSocketService.js  # Enhanced Socket.io
├── worker.js            # Background job worker entry point
└── server.js            # Main API server
```

## Quick Start

### 1. Setup Environment

```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit with your credentials
nano backend/.env
```

### 2. Start Infrastructure

```bash
# Start MongoDB and Redis
docker compose -f docker-compose.full.yml up -d mongo redis

# Or use the helper script
./scripts/infrastructure.sh start
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

### 4. Start Services

```bash
# Terminal 1: Start API
npm run dev

# Terminal 2: Start Worker
npm run worker:dev
```

### 5. Development Tools (Optional)

```bash
# Start Redis Commander & Mongo Express
docker compose -f docker-compose.full.yml --profile development up -d
```

Access at:

- Redis Commander: http://localhost:8081
- Mongo Express: http://localhost:8082

## Configuration

### Required Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/dating-app

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key

# Storage (choose one)
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# OR for S3
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=xxx
```

## Services Deep Dive

### Redis Caching

```javascript
const { UserCache, DiscoveryCache } = require('./services/CacheService');

// Cache user profile
await UserCache.setProfile(userId, userData);

// Get cached profile
const user = await UserCache.getProfile(userId);

// Cache-through pattern
const user = await UserCache.getOrFetch(userId, async (id) => {
  return User.findById(id);
});
```

### Background Jobs

```javascript
const QueueService = require('./services/QueueService');

// Send push notification
await QueueService.sendPushNotification(userId, 'Title', 'Body', { type: 'match' });

// Process new match
await QueueService.processMatch(swiperId, swipedId, matchId);

// Send email
await QueueService.sendEmail(email, 'welcome', { name: 'John' });
```

### File Uploads

```javascript
const StorageService = require('./services/StorageService');

// Upload file
const result = await StorageService.upload(file, userId, 'image');

// Get optimized URL
const url = StorageService.getOptimizedUrl(originalUrl, {
  width: 600,
  height: 800,
  quality: 'auto',
});
```

### Rate Limiting

```javascript
const { swipeLimiter, authLimiter } = require('./middleware/rateLimiter');

// Apply to routes
router.post('/swipe', auth, swipeLimiter, swipeController.swipe);
router.post('/login', authLimiter, authController.login);
```

## Production Deployment

### Docker Compose

```bash
# Full production stack
docker compose -f docker-compose.full.yml --profile production up -d
```

### Environment

Set these in production:

- `NODE_ENV=production`
- Strong `JWT_SECRET`
- Production database URIs
- Real storage credentials

### Scaling

- API: Run multiple instances behind load balancer
- Worker: Scale horizontally for more throughput
- Redis: Use Redis Cluster for HA
- MongoDB: Use replica set

## Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

### Queue Metrics

```javascript
const metrics = await QueueService.getQueueMetrics('notifications');
// { waiting: 5, active: 2, completed: 100, failed: 1, delayed: 0 }
```

### Connected Users

```javascript
const { getConnectedUserCount } = require('./services/WebSocketService');
const count = getConnectedUserCount();
```

## Security

- JWT authentication with refresh tokens
- Redis-based rate limiting
- File type validation on uploads
- Image moderation via Cloudinary
- CORS configuration
- Helmet.js security headers
