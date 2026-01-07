# Architecture Overview

## Current Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│                  Dating App Architecture                 │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Frontend (React Native)             │   │
│  │  ┌──────────────────────────────────────────┐   │   │
│  │  │         App.js (Root Component)           │   │   │
│  │  │  • Authentication Context                 │   │   │
│  │  │  • AppNavigator (Tab-based routing)      │   │   │
│  │  └──────────────────────────────────────────┘   │   │
│  │                     ↓                            │   │
│  │  ┌──────────────────────────────────────────┐   │   │
│  │  │         Navigation Structure              │   │   │
│  │  │  • HomeScreen (Swipe cards)               │   │   │
│  │  │  • MatchesScreen (Matches list)           │   │   │
│  │  │  • ChatScreen (Messaging)                 │   │   │
│  │  │  • ProfileScreen (User profile)           │   │   │
│  │  │  • LoginScreen (Auth)                     │   │   │
│  │  └──────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────┘   │
│                     ↓                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │          Backend (Node.js/Express)                │  │
│  │  ┌─────────────────────────────────────────┐    │  │
│  │  │  Authentication                         │    │  │
│  │  │  • JWT Tokens                           │    │  │
│  │  │  • OAuth (Google, Facebook, Apple)      │    │  │
│  │  │  • Session management                   │    │  │
│  │  └─────────────────────────────────────────┘    │  │
│  │                     ↓                            │  │
│  │  ┌─────────────────────────────────────────┐    │  │
│  │  │  Data Storage                           │    │  │
│  │  │  • MongoDB (Database)                   │    │  │
│  │  │  • Redis (Caching)                      │    │  │
│  │  │  • S3/Cloudinary (Media Storage)        │    │  │
│  │  │  • Socket.io (Real-time)                │    │  │
│  │  └─────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## State Management Flow

```
┌────────────────────────────────────────────┐
│         React Context (AuthContext)        │
│                                             │
│  • currentUser (from JWT Auth)             │
│  • loading state                           │
│  • login(email, password)                 │
│  • signup(email, password)                │
│  • logout()                               │
│                                             │
│  Persisted to Secure Storage ↓            │
└────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────┐
│      Backend API (REST + WebSocket)          │
│                                             │
│  • User profiles (MongoDB)                  │
│  • Matches (MongoDB Query)                 │
│  • Messages (MongoDB + Socket.io)          │
│  • Images (S3/Cloudinary)                   │
└────────────────────────────────────────────┘
```

## File Organization

```
src/
├── components/              # Reusable UI components
│   ├── Auth/               # Auth-related components
│   ├── Card/               # SwipeCard & variants
│   ├── Chat/               # Chat UI components
│   └── Profile/            # Profile UI components
│
├── screens/                # Full-screen components (one per route)
│   ├── ChatScreen.js       # Messaging screen
│   ├── HomeScreen.js       # Swipe cards screen
│   ├── LoginScreen.js      # Authentication
│   ├── MatchesScreen.js    # Matches list
│   ├── ProfileScreen.js   # User profile
│   └── ViewProfileScreen.js # View other user profile
│
├── config/                 # Configuration files
│   └── api.js              # API configuration
│
├── context/                # React Context providers
│   └── AuthContext.js      # Authentication state
│
├── navigation/             # Navigation configuration
│   └── AppNavigator.js     # Tab & stack navigation setup
│
├── services/               # Service layer
│   ├── api.js             # API client
│   └── [feature services] # Feature-specific services
│
├── utils/                  # Helper functions
│   ├── validation.js      # Input validation
│   ├── formatting.js      # Data formatting
│   └── constants.js       # App constants
│
└── __tests__/              # Test files (mirrors src structure)
    ├── firebase.test.js
    └── app.test.js
```

## Backend Structure

```
backend/
├── controllers/            # Request handlers
├── services/               # Business logic
├── models/                # Mongoose models
├── routes/                # API routes
├── middleware/            # Express middleware
├── utils/                # Utility functions
└── config/               # Configuration
```

## Key Technologies

- **Frontend**: React Native, Expo, React Navigation
- **Backend**: Node.js, Express, MongoDB, Redis
- **Authentication**: JWT, OAuth 2.0
- **Real-time**: Socket.io
- **Storage**: AWS S3, Cloudinary
- **Monitoring**: Sentry, Datadog

## Performance Optimization

- **Caching**: Redis for frequently accessed data
- **Image Optimization**: Compression and CDN delivery
- **Code Splitting**: Lazy loading of screens and components
- **Database Indexing**: Optimized MongoDB queries
- **Connection Pooling**: Efficient database connections

## Security Layers

1. **Authentication**: JWT tokens with refresh mechanism
2. **Authorization**: Role-based access control
3. **Input Validation**: Express-validator on all endpoints
4. **Rate Limiting**: Per-user and per-endpoint limits
5. **HTTPS**: Enforced on all connections
6. **Security Headers**: Helmet.js middleware

## Monitoring & Metrics

- **Error Tracking**: Sentry integration
- **Performance**: Response time monitoring
- **Analytics**: User behavior tracking
- **Health Checks**: `/health`, `/ready`, `/live` endpoints

---

**Last Updated**: January 2026  
**Maintained By**: Development Team
