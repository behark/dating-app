# Refactoring Master Plan
**Dating App - Professional Transformation**  
**Timeline:** 8-12 weeks  
**Status:** Ready for Implementation

---

## 🎯 VISION

Transform the dating app from a working prototype into a production-ready, scalable, maintainable application following industry best practices and professional coding standards.

### Success Criteria
- ✅ Zero critical security vulnerabilities
- ✅ <200ms average API response time
- ✅ >80% test coverage
- ✅ 100% TypeScript coverage
- ✅ <1% error rate
- ✅ Professional code architecture
- ✅ Comprehensive documentation

---

## 📅 IMPLEMENTATION TIMELINE

### Phase 1: Critical Fixes & Foundation (Week 1-2)
**Goal:** Fix critical issues, establish standards, remove technical debt

### Phase 2: Architecture Refactoring (Week 3-5)
**Goal:** Implement clean architecture, improve code quality

### Phase 3: Performance & Optimization (Week 6-7)
**Goal:** Optimize queries, caching, bundle size

### Phase 4: Testing & Documentation (Week 8-9)
**Goal:** Comprehensive test coverage, documentation

### Phase 5: TypeScript Migration (Week 10-11)
**Goal:** Complete TypeScript migration

### Phase 6: Final Polish & Launch Prep (Week 12)
**Goal:** Final review, monitoring, deployment

---

## 🏗️ PROFESSIONAL ARCHITECTURE DESIGN

### New Project Structure
```
dating-app/
├── backend/
│   ├── src/
│   │   ├── api/                    # API layer
│   │   │   ├── controllers/        # Request handlers
│   │   │   ├── routes/             # Route definitions
│   │   │   ├── middleware/         # Express middleware
│   │   │   └── validators/         # Request validation
│   │   │
│   │   ├── core/                   # Business logic layer
│   │   │   ├── domain/             # Domain models & entities
│   │   │   ├── services/           # Business services
│   │   │   ├── repositories/       # Data access layer
│   │   │   └── use-cases/          # Application use cases
│   │   │
│   │   ├── infrastructure/         # Infrastructure layer
│   │   │   ├── database/           # Database connections
│   │   │   ├── cache/              # Redis/caching
│   │   │   ├── queues/             # Job queues
│   │   │   ├── storage/            # File storage
│   │   │   └── external/           # Third-party services
│   │   │
│   │   ├── shared/                 # Shared utilities
│   │   │   ├── types/              # TypeScript types
│   │   │   ├── constants/          # Constants & enums
│   │   │   ├── utils/              # Utility functions
│   │   │   └── errors/             # Custom error classes
│   │   │
│   │   ├── config/                 # Configuration
│   │   │   ├── env.ts              # Environment validation
│   │   │   ├── database.ts         # Database config
│   │   │   └── logging.ts          # Logging config
│   │   │
│   │   └── server.ts               # Server entry point
│   │
│   ├── tests/
│   │   ├── unit/                   # Unit tests
│   │   ├── integration/            # Integration tests
│   │   ├── e2e/                    # End-to-end tests
│   │   └── fixtures/               # Test data
│   │
│   └── scripts/                    # Utility scripts
│
├── frontend/
│   ├── src/
│   │   ├── app/                    # App entry & navigation
│   │   │   ├── navigation/         # Navigation config
│   │   │   └── App.tsx             # Root component
│   │   │
│   │   ├── features/               # Feature modules
│   │   │   ├── auth/               # Authentication
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── screens/
│   │   │   │   ├── services/
│   │   │   │   └── store/
│   │   │   │
│   │   │   ├── discovery/          # User discovery
│   │   │   ├── matching/           # Swipe & match
│   │   │   ├── chat/               # Messaging
│   │   │   ├── profile/            # User profile
│   │   │   └── premium/            # Premium features
│   │   │
│   │   ├── shared/                 # Shared code
│   │   │   ├── components/         # Reusable UI
│   │   │   ├── hooks/              # Custom hooks
│   │   │   ├── utils/              # Utilities
│   │   │   ├── types/              # TypeScript types
│   │   │   ├── constants/          # Constants
│   │   │   └── api/                # API client
│   │   │
│   │   ├── store/                  # State management
│   │   │   ├── slices/             # Redux slices
│   │   │   └── store.ts            # Store configuration
│   │   │
│   │   └── theme/                  # Design system
│   │       ├── colors.ts
│   │       ├── typography.ts
│   │       └── spacing.ts
│   │
│   └── tests/
│
├── shared/                         # Shared between FE & BE
│   ├── types/                      # Common types
│   └── constants/                  # Common constants
│
├── docs/                           # Documentation
│   ├── api/                        # API docs
│   ├── architecture/               # Architecture docs
│   ├── development/                # Dev guides
│   └── deployment/                 # Deploy guides
│
└── tools/                          # Development tools
    ├── scripts/                    # Automation scripts
    └── generators/                 # Code generators
```

---

## 📋 PHASE 1: CRITICAL FIXES & FOUNDATION (Week 1-2)

### Week 1: Emergency Fixes

#### Day 1-2: Remove Debug Code & Security Fixes
**Priority:** CRITICAL ⚠️

**Tasks:**
1. Remove all debug code blocks
   ```bash
   # Find all debug code
   grep -r "#region agent log" backend/
   grep -r "console.log.*DEBUG" backend/
   ```

2. Remove hardcoded paths
   ```javascript
   // REMOVE THIS
   const logPath = '/home/behar/dating-app/.cursor/debug.log';
   fs.appendFileSync(logPath, logEntry);
   ```

3. Implement proper logging service
   ```typescript
   // src/shared/logging/logger.ts
   import winston from 'winston';
   import { LoggerService } from './LoggerService';

   export const logger = new LoggerService({
     level: process.env.LOG_LEVEL || 'info',
     format: winston.format.json(),
     transports: [
       new winston.transports.File({ filename: 'error.log', level: 'error' }),
       new winston.transports.File({ filename: 'combined.log' }),
     ],
   });
   ```

4. Add secret scanning
   ```yaml
   # .github/workflows/security.yml
   - name: Secret Scanning
     uses: trufflesecurity/trufflehog@main
   ```

**Files to Modify:**
- `backend/controllers/swipeController.js` (remove debug code)
- `backend/services/SwipeService.js` (remove console.logs)
- Create `backend/src/shared/logging/LoggerService.ts`
- Add pre-commit hooks for secret scanning

---

#### Day 3-4: Fix Race Conditions
**Priority:** CRITICAL ⚠️

**Problem:**
Current implementation uses timing detection which is unreliable:
```javascript
const timeDiff = Math.abs(beforeTime.getTime() - createdAt.getTime());
const isNew = timeDiff < 2000; // Unreliable!
```

**Solution:** Use MongoDB Transactions + Idempotency

```typescript
// backend/src/core/services/SwipeService.ts
import { ClientSession } from 'mongoose';

export class SwipeService {
  async processSwipe(
    swiperId: string,
    targetId: string,
    action: SwipeAction,
    idempotencyKey: string
  ): Promise<SwipeResult> {
    // Start transaction
    const session: ClientSession = await mongoose.startSession();
    
    try {
      session.startTransaction();

      // 1. Check idempotency
      const existing = await this.swipeRepository.findByIdempotencyKey(
        idempotencyKey,
        { session }
      );
      
      if (existing) {
        await session.abortTransaction();
        return { swipe: existing, isMatch: false, alreadyProcessed: true };
      }

      // 2. Create swipe atomically with unique index
      const swipe = await this.swipeRepository.create({
        swiperId,
        targetId,
        action,
        idempotencyKey,
      }, { session });

      // 3. Check for match
      const isMatch = await this.matchService.checkMatch(
        swiperId,
        targetId,
        { session }
      );

      // 4. Commit transaction
      await session.commitTransaction();

      return { swipe, isMatch, alreadyProcessed: false };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
```

**Implementation Steps:**
1. Add idempotency key to swipe requests
2. Implement transaction-based swipe processing
3. Add unique index on (swiperId, targetId, idempotencyKey)
4. Update client to send idempotency keys (UUID v4)
5. Add retry logic with same idempotency key

---

#### Day 5: Standardize Error Handling
**Priority:** HIGH

**Create Error Hierarchy:**
```typescript
// backend/src/shared/errors/AppError.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
  }
}

// ... more error classes
```

**Global Error Handler:**
```typescript
// backend/src/api/middleware/errorHandler.ts
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      },
      requestId: req.id,
    });
  }

  // Unexpected errors
  logger.error('Unexpected error:', err);
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
    requestId: req.id,
  });
};
```

---

### Week 2: Foundation Setup

#### Day 6-7: Project Structure Refactoring
**Priority:** HIGH

**Steps:**
1. Create new directory structure (see above)
2. Move files to new locations
3. Update all imports
4. Add path aliases
   ```typescript
   // tsconfig.json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@api/*": ["src/api/*"],
         "@core/*": ["src/core/*"],
         "@infrastructure/*": ["src/infrastructure/*"],
         "@shared/*": ["src/shared/*"]
       }
     }
   }
   ```

---

#### Day 8-10: Repository Pattern Implementation
**Priority:** HIGH

**Why Repository Pattern:**
- Abstracts database operations
- Makes code testable
- Allows switching databases
- Centralizes data access logic

**Example Implementation:**
```typescript
// backend/src/core/repositories/UserRepository.ts
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserDto): Promise<User>;
  update(id: string, data: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<void>;
}

export class MongoUserRepository implements IUserRepository {
  constructor(private userModel: Model<UserDocument>) {}

  async findById(id: string): Promise<User | null> {
    const doc = await this.userModel
      .findById(id)
      .lean()
      .exec();
    
    return doc ? this.toEntity(doc) : null;
  }

  async create(data: CreateUserDto): Promise<User> {
    const doc = await this.userModel.create(data);
    return this.toEntity(doc.toObject());
  }

  private toEntity(doc: any): User {
    return new User({
      id: doc._id.toString(),
      email: doc.email,
      name: doc.name,
      // ... map all fields
    });
  }
}
```

**Implement for:**
- UserRepository
- SwipeRepository
- MatchRepository
- MessageRepository
- SubscriptionRepository

---

#### Day 11-12: Service Layer Refactoring
**Priority:** HIGH

**Principle: Single Responsibility**

```typescript
// backend/src/core/services/MatchingService.ts
export class MatchingService {
  constructor(
    private swipeRepository: ISwipeRepository,
    private matchRepository: IMatchRepository,
    private notificationService: INotificationService,
    private eventBus: IEventBus
  ) {}

  async createMatch(
    userId1: string,
    userId2: string
  ): Promise<Match> {
    // Business logic only
    const match = await this.matchRepository.create({
      users: [userId1, userId2],
      matchedAt: new Date(),
    });

    // Emit event for notifications, analytics, etc.
    await this.eventBus.publish('match.created', {
      matchId: match.id,
      userId1,
      userId2,
    });

    return match;
  }
}
```

**Event-Driven Architecture:**
```typescript
// backend/src/core/events/EventBus.ts
export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  subscribe(event: string, handler: EventHandler): void {
    const handlers = this.handlers.get(event) || [];
    handlers.push(handler);
    this.handlers.set(event, handlers);
  }

  async publish(event: string, data: any): Promise<void> {
    const handlers = this.handlers.get(event) || [];
    
    // Execute handlers asynchronously
    await Promise.all(
      handlers.map(handler => handler(data))
    );
  }
}

// Usage in different services
eventBus.subscribe('match.created', async (data) => {
  await notificationService.sendMatchNotification(data);
});

eventBus.subscribe('match.created', async (data) => {
  await analyticsService.trackMatch(data);
});
```

---

#### Day 13-14: Add Database Indexes & Query Optimization
**Priority:** HIGH

**Analyze Slow Queries:**
```javascript
// Enable MongoDB profiling
db.setProfilingLevel(2);

// Find slow queries
db.system.profile.find({
  millis: { $gt: 100 }
}).sort({ ts: -1 }).limit(10);
```

**Add Missing Indexes:**
```typescript
// backend/src/infrastructure/database/indexes.ts
export const ensureIndexes = async () => {
  // User indexes
  await User.collection.createIndex({ email: 1 }, { unique: true });
  await User.collection.createIndex({ lastActive: -1, isOnline: 1 });
  await User.collection.createIndex(
    { location: '2dsphere' },
    { background: true }
  );

  // Swipe indexes (already exist, verify)
  await Swipe.collection.createIndex(
    { swiperId: 1, swipedId: 1 },
    { unique: true }
  );
  await Swipe.collection.createIndex(
    { swipedId: 1, action: 1, createdAt: -1 },
    { name: 'who_liked_me' }
  );

  // Match indexes
  await Match.collection.createIndex(
    { users: 1, status: 1, lastActivityAt: -1 },
    { background: true }
  );
  await Match.collection.createIndex(
    { user1: 1, user2: 1 },
    { unique: true }
  );

  // Message indexes
  await Message.collection.createIndex(
    { matchId: 1, createdAt: -1 },
    { background: true }
  );
  await Message.collection.createIndex(
    { matchId: 1, senderId: 1, createdAt: -1 }
  );
};
```

**Query Optimization Patterns:**
```typescript
// BAD: N+1 queries
const matches = await Match.find({ users: userId });
for (const match of matches) {
  const otherUser = await User.findById(match.getOtherUserId(userId));
  // ...
}

// GOOD: Single query with population
const matches = await Match.find({ users: userId })
  .populate({
    path: 'users',
    select: 'name photos age bio lastActive',
  })
  .lean()
  .exec();

// BETTER: Aggregation pipeline
const matches = await Match.aggregate([
  { $match: { users: new ObjectId(userId), status: 'active' } },
  {
    $lookup: {
      from: 'users',
      let: { userIds: '$users' },
      pipeline: [
        { $match: { $expr: { $in: ['$_id', '$$userIds'] } } },
        { $project: { name: 1, photos: 1, age: 1, bio: 1 } },
      ],
      as: 'userDetails',
    },
  },
  { $sort: { lastActivityAt: -1 } },
  { $limit: 50 },
]);
```

---

## 📋 PHASE 2: ARCHITECTURE REFACTORING (Week 3-5)

### Week 3: Clean Architecture Implementation

#### Day 15-17: Implement Use Cases
**Priority:** MEDIUM

**Use Case Pattern:**
```typescript
// backend/src/core/use-cases/swipe/ProcessSwipeUseCase.ts
export class ProcessSwipeUseCase {
  constructor(
    private swipeRepository: ISwipeRepository,
    private matchService: IMatchService,
    private notificationService: INotificationService,
    private analyticsService: IAnalyticsService
  ) {}

  async execute(request: ProcessSwipeRequest): Promise<ProcessSwipeResponse> {
    // 1. Validate input
    this.validateRequest(request);

    // 2. Check permissions
    await this.checkPermissions(request.swiperId);

    // 3. Process swipe
    const swipe = await this.swipeRepository.createAtomic({
      swiperId: request.swiperId,
      targetId: request.targetId,
      action: request.action,
    });

    // 4. Check for match
    let match = null;
    if (swipe.action === 'like') {
      match = await this.matchService.checkAndCreateMatch(
        request.swiperId,
        request.targetId
      );
    }

    // 5. Send notifications (async)
    if (match) {
      this.notificationService.sendMatchNotification(match).catch(err =>
        logger.error('Failed to send match notification', err)
      );
    }

    // 6. Track analytics (async)
    this.analyticsService.trackSwipe(swipe).catch(err =>
      logger.error('Failed to track swipe', err)
    );

    // 7. Return response
    return {
      swipe,
      match,
      isMatch: !!match,
    };
  }

  private validateRequest(request: ProcessSwipeRequest): void {
    if (!request.swiperId || !request.targetId) {
      throw new ValidationError('Missing required fields');
    }
    
    if (request.swiperId === request.targetId) {
      throw new ValidationError('Cannot swipe on yourself');
    }

    if (!['like', 'pass', 'superlike'].includes(request.action)) {
      throw new ValidationError('Invalid action');
    }
  }

  private async checkPermissions(userId: string): Promise<void> {
    const canSwipe = await this.swipeRepository.canSwipe(userId);
    if (!canSwipe) {
      throw new RateLimitError('Daily swipe limit reached');
    }
  }
}
```

**Implement Use Cases:**
- ProcessSwipeUseCase
- GetMatchesUseCase
- SendMessageUseCase
- UpdateProfileUseCase
- AuthenticateUserUseCase

---

#### Day 18-19: Dependency Injection Setup
**Priority:** MEDIUM

**Why DI:**
- Testability
- Loose coupling
- Easy to swap implementations
- Clear dependencies

**Implementation with InversifyJS:**
```typescript
// backend/src/infrastructure/di/container.ts
import { Container } from 'inversify';
import { TYPES } from './types';

const container = new Container();

// Repositories
container.bind<IUserRepository>(TYPES.UserRepository)
  .to(MongoUserRepository)
  .inSingletonScope();

container.bind<ISwipeRepository>(TYPES.SwipeRepository)
  .to(MongoSwipeRepository)
  .inSingletonScope();

// Services
container.bind<IMatchService>(TYPES.MatchService)
  .to(MatchService)
  .inSingletonScope();

container.bind<INotificationService>(TYPES.NotificationService)
  .to(NotificationService)
  .inSingletonScope();

// Use Cases
container.bind<ProcessSwipeUseCase>(TYPES.ProcessSwipeUseCase)
  .to(ProcessSwipeUseCase)
  .inTransientScope();

export { container };
```

**Controller with DI:**
```typescript
// backend/src/api/controllers/SwipeController.ts
import { inject } from 'inversify';
import { controller, httpPost } from 'inversify-express-utils';

@controller('/api/swipes')
export class SwipeController {
  constructor(
    @inject(TYPES.ProcessSwipeUseCase)
    private processSwipeUseCase: ProcessSwipeUseCase
  ) {}

  @httpPost('/')
  async createSwipe(req: Request, res: Response) {
    const result = await this.processSwipeUseCase.execute({
      swiperId: req.user.id,
      targetId: req.body.targetId,
      action: req.body.action,
    });

    return res.json({
      success: true,
      data: result,
    });
  }
}
```

---

#### Day 20-21: API Versioning & Documentation
**Priority:** MEDIUM

**API Versioning:**
```typescript
// backend/src/api/routes/v1/index.ts
import { Router } from 'express';

const v1Router = Router();

v1Router.use('/auth', authRoutes);
v1Router.use('/users', userRoutes);
v1Router.use('/swipes', swipeRoutes);
v1Router.use('/matches', matchRoutes);
v1Router.use('/messages', messageRoutes);

export { v1Router };

// backend/src/server.ts
app.use('/api/v1', v1Router);
```

**OpenAPI Documentation:**
```typescript
// backend/src/api/docs/swagger.ts
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dating App API',
      version: '1.0.0',
      description: 'RESTful API for dating application',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development' },
      { url: 'https://api.example.com', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/api/routes/**/*.ts', './src/api/controllers/**/*.ts'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
```

**Add JSDoc Comments:**
```typescript
/**
 * @swagger
 * /api/v1/swipes:
 *   post:
 *     summary: Create a new swipe
 *     tags: [Swipes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetId
 *               - action
 *             properties:
 *               targetId:
 *                 type: string
 *                 description: ID of the user being swiped on
 *               action:
 *                 type: string
 *                 enum: [like, pass, superlike]
 *     responses:
 *       200:
 *         description: Swipe created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SwipeResponse'
 *       400:
 *         description: Invalid request
 *       429:
 *         description: Rate limit exceeded
 */
```

---

### Week 4: Frontend Architecture

#### Day 22-24: HomeScreen Decomposition
**Priority:** HIGH

**Current:** 2,232 lines monolith  
**Target:** < 200 lines main component

**New Structure:**
```
src/features/discovery/
├── screens/
│   └── DiscoveryScreen.tsx              (200 lines)
├── components/
│   ├── SwipeStack/
│   │   ├── SwipeStack.tsx               (150 lines)
│   │   ├── SwipeCard.tsx                (200 lines)
│   │   └── CardGestures.tsx             (100 lines)
│   ├── EmptyState/
│   │   └── NoCardsEmpty.tsx             (80 lines)
│   ├── ActionButtons/
│   │   └── ActionButtons.tsx            (120 lines)
│   └── Filters/
│       └── FilterModal.tsx              (150 lines)
├── hooks/
│   ├── useCardStack.ts                  (100 lines)
│   ├── useSwipeActions.ts               (80 lines)
│   └── useDiscoveryFilters.ts           (60 lines)
├── services/
│   └── DiscoveryService.ts              (already exists)
└── store/
    └── discoverySlice.ts                (150 lines)
```

**Example Decomposition:**
```typescript
// src/features/discovery/screens/DiscoveryScreen.tsx
export const DiscoveryScreen: FC = () => {
  const { cards, loading, error, refreshCards } = useCardStack();
  const { filters, updateFilters } = useDiscoveryFilters();
  const { handleSwipe } = useSwipeActions();

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} onRetry={refreshCards} />;
  if (cards.length === 0) return <NoCardsEmpty />;

  return (
    <DiscoveryLayout>
      <FilterButton onPress={() => setShowFilters(true)} />
      
      <SwipeStack
        cards={cards}
        onSwipe={handleSwipe}
        onEndReached={refreshCards}
      />
      
      <ActionButtons onAction={handleSwipe} />
      
      <FilterModal
        visible={showFilters}
        filters={filters}
        onUpdate={updateFilters}
        onClose={() => setShowFilters(false)}
      />
    </DiscoveryLayout>
  );
};
```

---

#### Day 25-26: State Management with Redux Toolkit
**Priority:** HIGH

**Setup Redux Toolkit:**
```typescript
// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from '@features/auth/store/authSlice';
import discoveryReducer from '@features/discovery/store/discoverySlice';
import matchesReducer from '@features/matching/store/matchesSlice';
import { api } from './api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    discovery: discoveryReducer,
    matches: matchesReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**RTK Query for API:**
```typescript
// src/store/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: config.API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Swipes', 'Matches', 'Messages', 'User'],
  endpoints: (builder) => ({
    // Auto-generated hooks: useGetMatchesQuery, etc.
    getMatches: builder.query<Match[], void>({
      query: () => '/matches',
      providesTags: ['Matches'],
    }),
    createSwipe: builder.mutation<SwipeResponse, SwipeRequest>({
      query: (body) => ({
        url: '/swipes',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Matches'],
    }),
  }),
});
```

---

#### Day 27-28: Component Library & Design System
**Priority:** MEDIUM

**Setup Design Tokens:**
```typescript
// src/theme/tokens.ts
export const tokens = {
  colors: {
    primary: {
      50: '#FFF5F5',
      100: '#FFE3E3',
      500: '#FF6B6B',
      900: '#8B0000',
    },
    // ... more colors
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
    },
    weights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    // ... more shadows
  },
};
```

**Create Reusable Components:**
```typescript
// src/shared/components/Button/Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline';
  size: 'sm' | 'md' | 'lg';
  onPress: () => void;
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
}

export const Button: FC<ButtonProps> = ({
  variant,
  size,
  onPress,
  children,
  loading,
  disabled,
}) => {
  const styles = useButtonStyles(variant, size);
  
  return (
    <TouchableOpacity
      style={[styles.container, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={styles.text.color} />
      ) : (
        <Text style={styles.text}>{children}</Text>
      )}
    </TouchableOpacity>
  );
};
```

---

### Week 5: Testing Infrastructure

#### Day 29-30: Unit Testing Setup
**Priority:** HIGH

**Configure Jest:**
```typescript
// jest.config.ts
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapper: {
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },
};
```

**Example Unit Tests:**
```typescript
// tests/unit/services/SwipeService.test.ts
describe('SwipeService', () => {
  let swipeService: SwipeService;
  let mockSwipeRepo: jest.Mocked<ISwipeRepository>;
  let mockMatchService: jest.Mocked<IMatchService>;

  beforeEach(() => {
    mockSwipeRepo = {
      create: jest.fn(),
      findByIdempotencyKey: jest.fn(),
      canSwipe: jest.fn(),
    } as any;

    mockMatchService = {
      checkMatch: jest.fn(),
    } as any;

    swipeService = new SwipeService(mockSwipeRepo, mockMatchService);
  });

  describe('processSwipe', () => {
    it('should create a new swipe successfully', async () => {
      const swipeData = {
        swiperId: 'user1',
        targetId: 'user2',
        action: 'like' as SwipeAction,
        idempotencyKey: 'test-key',
      };

      mockSwipeRepo.findByIdempotencyKey.mockResolvedValue(null);
      mockSwipeRepo.create.mockResolvedValue({ id: 'swipe1', ...swipeData });
      mockMatchService.checkMatch.mockResolvedValue(null);

      const result = await swipeService.processSwipe(swipeData);

      expect(result.swipe).toBeDefined();
      expect(result.isMatch).toBe(false);
      expect(result.alreadyProcessed).toBe(false);
      expect(mockSwipeRepo.create).toHaveBeenCalledWith(swipeData);
    });

    it('should return existing swipe if idempotency key exists', async () => {
      const existingSwipe = { id: 'swipe1', /* ... */ };
      mockSwipeRepo.findByIdempotencyKey.mockResolvedValue(existingSwipe);

      const result = await swipeService.processSwipe({
        swiperId: 'user1',
        targetId: 'user2',
        action: 'like',
        idempotencyKey: 'test-key',
      });

      expect(result.alreadyProcessed).toBe(true);
      expect(mockSwipeRepo.create).not.toHaveBeenCalled();
    });

    it('should detect match when mutual like exists', async () => {
      mockSwipeRepo.findByIdempotencyKey.mockResolvedValue(null);
      mockSwipeRepo.create.mockResolvedValue({ id: 'swipe1', /* ... */ });
      mockMatchService.checkMatch.mockResolvedValue({ id: 'match1', /* ... */ });

      const result = await swipeService.processSwipe({
        swiperId: 'user1',
        targetId: 'user2',
        action: 'like',
        idempotencyKey: 'test-key',
      });

      expect(result.isMatch).toBe(true);
      expect(result.match).toBeDefined();
    });

    it('should throw validation error for invalid input', async () => {
      await expect(
        swipeService.processSwipe({
          swiperId: '',
          targetId: 'user2',
          action: 'like',
          idempotencyKey: 'test-key',
        })
      ).rejects.toThrow(ValidationError);
    });
  });
});
```

---

#### Day 31-32: Integration Testing
**Priority:** MEDIUM

**Setup Test Database:**
```typescript
// tests/setup/testDb.ts
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

export const connectTestDb = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
};

export const disconnectTestDb = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
};

export const clearTestDb = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};
```

**Integration Test Example:**
```typescript
// tests/integration/swipe.test.ts
describe('Swipe Integration Tests', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it('should create swipe and match when mutual like exists', async () => {
    // Arrange: Create users
    const user1 = await User.create({ email: 'user1@example.com', /* ... */ });
    const user2 = await User.create({ email: 'user2@example.com', /* ... */ });

    // Act: User1 likes User2
    await request(app)
      .post('/api/v1/swipes')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ targetId: user2.id, action: 'like' })
      .expect(200);

    // Act: User2 likes User1 (should create match)
    const response = await request(app)
      .post('/api/v1/swipes')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ targetId: user1.id, action: 'like' })
      .expect(200);

    // Assert
    expect(response.body.data.isMatch).toBe(true);
    expect(response.body.data.match).toBeDefined();

    // Verify match exists in database
    const match = await Match.findOne({
      users: { $all: [user1.id, user2.id] },
    });
    expect(match).toBeDefined();
    expect(match.status).toBe('active');
  });
});
```

---

#### Day 33-34: E2E Testing with Playwright
**Priority:** MEDIUM

**Setup Playwright:**
```typescript
// tests/e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**E2E Test Example:**
```typescript
// tests/e2e/swipe-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Swipe Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/discovery');
  });

  test('should swipe right and see match modal', async ({ page }) => {
    // Wait for cards to load
    await page.waitForSelector('[data-testid="swipe-card"]');

    // Swipe right
    await page.click('[data-testid="like-button"]');

    // If match occurs, modal should appear
    const matchModal = page.locator('[data-testid="match-modal"]');
    if (await matchModal.isVisible()) {
      expect(await matchModal.textContent()).toContain("It's a Match!");
      
      // Close modal
      await page.click('[data-testid="match-modal-close"]');
    }

    // Next card should be visible
    await expect(page.locator('[data-testid="swipe-card"]')).toBeVisible();
  });

  test('should handle swipe limit reached', async ({ page }) => {
    // Swipe 50 times (assuming free tier limit)
    for (let i = 0; i < 51; i++) {
      await page.click('[data-testid="like-button"]');
      await page.waitForTimeout(200);
    }

    // Should show limit reached message
    await expect(page.locator('[data-testid="limit-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="limit-modal"]'))
      .toContainText('Daily swipe limit reached');
  });
});
```

---

## 📋 PHASE 3: PERFORMANCE & OPTIMIZATION (Week 6-7)

### Week 6: Backend Performance

#### Day 35-37: Caching Strategy
**Priority:** HIGH

**Multi-Layer Caching:**
```typescript
// backend/src/infrastructure/cache/CacheService.ts
export class CacheService {
  private redis: Redis;
  private localCache: LRUCache;

  constructor(redisClient: Redis) {
    this.redis = redisClient;
    this.localCache = new LRUCache({ max: 100, ttl: 60000 }); // 1min
  }

  async get<T>(key: string): Promise<T | null> {
    // L1: Check local cache
    const localValue = this.localCache.get<T>(key);
    if (localValue) return localValue;

    // L2: Check Redis
    const redisValue = await this.redis.get(key);
    if (redisValue) {
      const parsed = JSON.parse(redisValue);
      this.localCache.set(key, parsed);
      return parsed;
    }

    return null;
  }

  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    // Set in both caches
    this.localCache.set(key, value);
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    // Clear local cache
    this.localCache.clear();

    // Clear Redis keys matching pattern
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

**Cache-Aside Pattern:**
```typescript
// Example: Cached user profile
async getUserProfile(userId: string): Promise<User> {
  const cacheKey = `user:${userId}`;

  // Try cache first
  let user = await this.cache.get<User>(cacheKey);
  if (user) {
    return user;
  }

  // Cache miss: fetch from database
  user = await this.userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError('User');
  }

  // Store in cache
  await this.cache.set(cacheKey, user, 300); // 5min TTL

  return user;
}
```

**Cache Invalidation:**
```typescript
// backend/src/core/services/UserService.ts
async updateProfile(userId: string, data: UpdateProfileDto): Promise<User> {
  const user = await this.userRepository.update(userId, data);

  // Invalidate caches
  await this.cache.invalidate(`user:${userId}`);
  await this.cache.invalidate(`discovery:*`); // Invalidate discovery cards

  return user;
}
```

---

#### Day 38-39: Database Optimization
**Priority:** HIGH

**Query Optimization:**
```typescript
// Before: Slow query (500ms+)
const matches = await Match.find({ users: userId })
  .populate('users')
  .sort({ lastActivityAt: -1 });

// After: Optimized query (<50ms)
const matches = await Match.aggregate([
  {
    $match: {
      users: new ObjectId(userId),
      status: 'active',
    },
  },
  {
    $lookup: {
      from: 'users',
      let: { userIds: '$users' },
      pipeline: [
        { $match: { $expr: { $in: ['$_id', '$$userIds'] } } },
        {
          $project: {
            name: 1,
            photos: { $slice: ['$photos', 1] }, // Only first photo
            age: 1,
            lastActive: 1,
          },
        },
      ],
      as: 'userDetails',
    },
  },
  { $sort: { lastActivityAt: -1 } },
  { $limit: 50 },
]);
```

**Add Read Replicas:**
```typescript
// backend/src/config/database.ts
export const connectWithReplicas = async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    readPreference: 'secondaryPreferred',
    replicaSet: 'rs0',
  });
};

// Use read replicas for heavy read operations
const users = await User.find(query)
  .read('secondary')
  .lean()
  .exec();
```

**Connection Pooling:**
```typescript
// backend/src/config/database.ts
mongoose.connect(mongoUri, {
  maxPoolSize: 50,
  minPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

---

#### Day 40-41: API Rate Limiting & Throttling
**Priority:** HIGH

**Advanced Rate Limiting:**
```typescript
// backend/src/api/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

export const createRateLimiter = (
  maxRequests: number,
  windowMs: number,
  keyGenerator?: (req: Request) => string
) => {
  return rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rate-limit:',
    }),
    windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGenerator || ((req) => req.user?.id || req.ip),
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later.',
        },
      });
    },
  });
};

// Different limits for different endpoints
export const authLimiter = createRateLimiter(5, 15 * 60 * 1000); // 5 per 15min
export const apiLimiter = createRateLimiter(100, 15 * 60 * 1000); // 100 per 15min
export const swipeLimiter = createRateLimiter(50, 60 * 1000); // 50 per min
```

---

#### Day 42: Response Compression & CDN
**Priority:** MEDIUM

**Setup Compression:**
```typescript
// backend/src/server.ts
import compression from 'compression';

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024, // Only compress responses > 1KB
  level: 6, // Compression level (0-9)
}));
```

**CDN for Static Assets:**
```typescript
// backend/src/services/CDNService.ts
export class CDNService {
  private cloudinary: Cloudinary;

  async uploadImage(
    file: Buffer,
    options: UploadOptions
  ): Promise<string> {
    const result = await this.cloudinary.uploader.upload(file, {
      folder: 'profile-photos',
      transformation: [
        { width: 800, height: 800, crop: 'fill' },
        { quality: 'auto' },
        { fetch_format: 'auto' }, // Auto WebP conversion
      ],
      ...options,
    });

    // Return CDN URL
    return result.secure_url;
  }

  generateOptimizedUrl(
    publicId: string,
    width: number,
    height: number
  ): string {
    return this.cloudinary.url(publicId, {
      width,
      height,
      crop: 'fill',
      quality: 'auto',
      fetch_format: 'auto',
    });
  }
}
```

---

### Week 7: Frontend Performance

#### Day 43-45: Bundle Optimization
**Priority:** HIGH

**Code Splitting:**
```typescript
// src/app/navigation/AppNavigator.tsx
import { lazy, Suspense } from 'react';

// Lazy load screens
const DiscoveryScreen = lazy(() => import('@features/discovery/screens/DiscoveryScreen'));
const MatchesScreen = lazy(() => import('@features/matching/screens/MatchesScreen'));
const ChatScreen = lazy(() => import('@features/chat/screens/ChatScreen'));

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Discovery">
          {() => (
            <Suspense fallback={<LoadingScreen />}>
              <DiscoveryScreen />
            </Suspense>
          )}
        </Stack.Screen>
        {/* More screens... */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

**Tree Shaking:**
```javascript
// babel.config.js
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
    ['transform-remove-console', { exclude: ['error', 'warn'] }],
  ],
  env: {
    production: {
      plugins: ['transform-remove-console'],
    },
  },
};
```

**Analyze Bundle:**
```bash
# Add to package.json
"scripts": {
  "analyze": "npx expo export --platform web && npx source-map-explorer web-build/static/js/*.js"
}
```

---

#### Day 46-47: Image Optimization
**Priority:** HIGH

**Lazy Loading Images:**
```typescript
// src/shared/components/OptimizedImage/OptimizedImage.tsx
export const OptimizedImage: FC<OptimizedImageProps> = ({
  source,
  width,
  height,
  placeholder,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Generate responsive image URLs
  const imageUrl = useMemo(() => {
    if (typeof source === 'string') {
      return generateResponsiveUrl(source, width, height);
    }
    return source;
  }, [source, width, height]);

  return (
    <View style={{ width, height }}>
      {isLoading && (
        <View style={styles.placeholder}>
          {placeholder || <ActivityIndicator />}
        </View>
      )}
      
      <Image
        source={{ uri: imageUrl }}
        style={{ width, height }}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setError(true);
        }}
        resizeMode="cover"
      />
      
      {error && <ErrorImage />}
    </View>
  );
};
```

**Implement Progressive Images:**
```typescript
// Show low-res placeholder while loading high-res
export const ProgressiveImage: FC<Props> = ({ uri, thumbnail }) => {
  const [imgLoading, setImgLoading] = useState(true);

  return (
    <View>
      {/* Low-res thumbnail */}
      <Image
        source={{ uri: thumbnail }}
        style={styles.thumbnail}
        blurRadius={imgLoading ? 1 : 0}
      />
      
      {/* High-res image */}
      <Image
        source={{ uri }}
        style={styles.image}
        onLoad={() => setImgLoading(false)}
      />
    </View>
  );
};
```

---

#### Day 48-49: React Performance Optimization
**Priority:** HIGH

**Memoization:**
```typescript
// Before: Re-renders on every parent update
const SwipeCard = ({ user, onSwipe }) => {
  return <Card user={user} onSwipe={onSwipe} />;
};

// After: Only re-renders when user changes
const SwipeCard = memo(({ user, onSwipe }) => {
  return <Card user={user} onSwipe={onSwipe} />;
}, (prevProps, nextProps) => {
  return prevProps.user.id === nextProps.user.id;
});

// Use useMemo for expensive calculations
const filteredUsers = useMemo(() => {
  return users.filter(user => 
    user.age >= minAge && 
    user.age <= maxAge &&
    user.distance <= maxDistance
  );
}, [users, minAge, maxAge, maxDistance]);

// Use useCallback for function references
const handleSwipe = useCallback((action: SwipeAction) => {
  // Swipe logic
}, [/* dependencies */]);
```

**List Virtualization:**
```typescript
// src/features/matching/components/MatchList/MatchList.tsx
import { FlashList } from '@shopify/flash-list';

export const MatchList: FC<MatchListProps> = ({ matches }) => {
  const renderItem = useCallback(({ item }: { item: Match }) => {
    return <MatchCard match={item} />;
  }, []);

  return (
    <FlashList
      data={matches}
      renderItem={renderItem}
      estimatedItemSize={100}
      keyExtractor={(item) => item.id}
      // Optimize performance
      removeClippedSubviews
      maxToRenderPerBatch={10}
      windowSize={5}
      initialNumToRender={10}
    />
  );
};
```

---

## 📋 PHASE 4: TESTING & DOCUMENTATION (Week 8-9)

### Week 8: Comprehensive Testing

#### Day 50-52: Increase Test Coverage to 80%+
**Priority:** HIGH

**Focus Areas:**
1. Critical user flows (auth, swipe, match, chat)
2. Payment processing
3. Edge cases and error scenarios
4. Race conditions
5. Security vulnerabilities

**Test Coverage Report:**
```bash
npm run test:coverage

# Add to CI/CD
# Fail build if coverage drops below 80%
```

---

#### Day 53-54: Load Testing
**Priority:** MEDIUM

**Setup k6:**
```javascript
// tests/load/swipe-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Error rate < 1%
  },
};

export default function () {
  const token = __ENV.AUTH_TOKEN;
  
  const payload = JSON.stringify({
    targetId: '507f1f77bcf86cd799439011',
    action: 'like',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  const res = http.post(
    'http://localhost:3000/api/v1/swipes',
    payload,
    params
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}
```

**Run Load Tests:**
```bash
k6 run tests/load/swipe-load.js
```

---

#### Day 55-56: Security Testing
**Priority:** HIGH

**OWASP ZAP Scanning:**
```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on: [push, pull_request]

jobs:
  zap-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Start Application
        run: |
          docker-compose up -d
          sleep 30 # Wait for app to start
      
      - name: ZAP Scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'http://localhost:3000'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'
```

**Penetration Testing Checklist:**
- [ ] SQL Injection
- [ ] XSS attacks
- [ ] CSRF protection
- [ ] Authentication bypass
- [ ] Authorization flaws
- [ ] Rate limiting
- [ ] File upload vulnerabilities
- [ ] API security
- [ ] Session management
- [ ] Sensitive data exposure

---

### Week 9: Documentation

#### Day 57-59: API Documentation
**Priority:** MEDIUM

**Generate OpenAPI Spec:**
```bash
npm run generate:api-docs
```

**Create Postman Collection:**
```json
{
  "info": {
    "name": "Dating App API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/v1/auth/register",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"user@example.com\",\n  \"password\": \"password123\",\n  \"name\": \"John Doe\"\n}"
            }
          }
        }
      ]
    }
  ]
}
```

---

#### Day 60-61: Architecture Documentation
**Priority:** MEDIUM

**Create Diagrams:**
```markdown
# docs/architecture/SYSTEM_OVERVIEW.md

## System Architecture

### High-Level Architecture
[Include diagram showing:]
- Client applications (iOS, Android, Web)
- API Gateway / Load Balancer
- Backend services
- Databases (MongoDB, Redis)
- Third-party services (Firebase, Cloudinary, Stripe)

### Component Diagram
[Diagram showing:]
- API Layer (Controllers, Routes, Middleware)
- Business Logic Layer (Services, Use Cases)
- Data Layer (Repositories, Models)
- Infrastructure (Cache, Queue, Storage)

### Data Flow Diagrams
[Diagram for each major flow:]
1. Authentication Flow
2. Swipe & Match Flow
3. Messaging Flow
4. Payment Flow
```

---

#### Day 62-63: Developer Documentation
**Priority:** MEDIUM

**Onboarding Guide:**
```markdown
# docs/development/GETTING_STARTED.md

## Prerequisites
- Node.js 20.x
- MongoDB 7.x
- Redis 7.x
- Docker (optional but recommended)

## Quick Start

### 1. Clone Repository
\`\`\`bash
git clone https://github.com/your-org/dating-app.git
cd dating-app
\`\`\`

### 2. Setup Environment
\`\`\`bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files with your credentials
\`\`\`

### 3. Install Dependencies
\`\`\`bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
\`\`\`

### 4. Start Services with Docker
\`\`\`bash
docker-compose up -d mongodb redis
\`\`\`

### 5. Run Migrations
\`\`\`bash
npm run migrate
npm run seed # Optional: seed test data
\`\`\`

### 6. Start Development Servers
\`\`\`bash
# Backend (terminal 1)
cd backend && npm run dev

# Frontend (terminal 2)
cd frontend && npm start
\`\`\`

## Development Workflow
- Create feature branch: `git checkout -b feature/your-feature`
- Make changes
- Write tests
- Run linter: `npm run lint`
- Run tests: `npm test`
- Commit with conventional commits: `feat: add new feature`
- Push and create PR

## Useful Commands
\`\`\`bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Type check
npm run type-check

# Format code
npm run format

# Build for production
npm run build
\`\`\`
```

---

## 📋 PHASE 5: TYPESCRIPT MIGRATION (Week 10-11)

### Week 10-11: Complete TypeScript Migration

Follow the existing `TYPESCRIPT_MIGRATION_EXECUTION_PLAN.md` but accelerated:

#### Day 64-68: Services Migration (Remaining 25 services)
- Batch convert 5 services per day
- Run type checker after each batch
- Update imports in consumers

#### Day 69-73: Controllers Migration (30 controllers)
- Convert 6 controllers per day
- Ensure all route handlers are typed
- Update route definitions

#### Day 74-77: Screens Migration (40+ screens)
- Start with simple screens
- Decompose complex screens simultaneously
- Convert 10 screens per day

---

## 📋 PHASE 6: FINAL POLISH & LAUNCH PREP (Week 12)

### Day 78-79: Performance Audit
- Run Lighthouse audits
- Check Core Web Vitals
- Optimize identified issues

### Day 80-81: Security Audit
- Run security scanners
- Penetration testing
- Fix vulnerabilities

### Day 82-83: Monitoring Setup
- Configure DataDog/New Relic
- Set up alerting
- Create dashboards

### Day 84: Final Review & Deployment
- Code review
- Documentation review
- Production deployment

---

## 🎓 PROFESSIONAL CODING STANDARDS

### Code Style Guide

**TypeScript Style:**
```typescript
// ✅ GOOD: Use interfaces for object types
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ GOOD: Use type for unions and primitives
type UserId = string;
type SwipeAction = 'like' | 'pass' | 'superlike';

// ✅ GOOD: Use enums for constants
enum UserRole {
  USER = 'user',
  PREMIUM = 'premium',
  ADMIN = 'admin',
}

// ✅ GOOD: Explicit return types
function processSwipe(data: SwipeData): Promise<SwipeResult> {
  // ...
}

// ❌ BAD: Implicit any
function processSwipe(data) { // No types!
  // ...
}

// ❌ BAD: Using 'any'
function processSwipe(data: any): any {
  // ...
}
```

**Naming Conventions:**
```typescript
// Files: PascalCase for classes/components, camelCase for utilities
UserService.ts
SwipeController.ts
apiClient.ts
formatDate.ts

// Classes: PascalCase
class UserService {}
class SwipeController {}

// Functions/methods: camelCase
function getUserById() {}
async function processSwipe() {}

// Constants: UPPER_SNAKE_CASE
const MAX_SWIPE_LIMIT = 50;
const API_BASE_URL = 'https://api.example.com';

// Interfaces: PascalCase, prefix with 'I' for abstract interfaces
interface User {}
interface IUserRepository {}

// Types: PascalCase
type UserId = string;
type SwipeAction = 'like' | 'pass';

// Enums: PascalCase
enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}
```

**Component Structure:**
```typescript
// 1. Imports (grouped)
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Button } from '@shared/components';
import { useAuth } from '@features/auth/hooks';
import { UserService } from '@features/user/services';

// 2. Types/Interfaces
interface ProfileScreenProps {
  userId: string;
  onUpdate: (user: User) => void;
}

// 3. Component
export const ProfileScreen: FC<ProfileScreenProps> = ({ userId, onUpdate }) => {
  // 3a. Hooks
  const navigation = useNavigation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // 3b. Effects
  useEffect(() => {
    loadProfile();
  }, [userId]);

  // 3c. Handlers
  const handleSave = async () => {
    // ...
  };

  // 3d. Render helpers
  const renderHeader = () => {
    // ...
  };

  // 3e. Main render
  return (
    <View>
      {renderHeader()}
      {/* ... */}
    </View>
  );
};

// 4. Styles (if using StyleSheet)
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

**Error Handling:**
```typescript
// ✅ GOOD: Specific error types
try {
  await userService.updateProfile(data);
} catch (error) {
  if (error instanceof ValidationError) {
    showToast(error.message);
  } else if (error instanceof NetworkError) {
    showNetworkError();
  } else {
    logger.error('Unexpected error', error);
    showGenericError();
  }
}

// ❌ BAD: Catching everything as generic Error
try {
  await userService.updateProfile(data);
} catch (error) {
  console.log('Error:', error);
}
```

**Async/Await:**
```typescript
// ✅ GOOD: Always use async/await, not .then()
async function getUser(id: string): Promise<User> {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new NotFoundError('User');
  }
  return user;
}

// ❌ BAD: Mixing async/await with .then()
async function getUser(id: string) {
  return userRepository.findById(id).then(user => {
    if (!user) throw new Error('Not found');
    return user;
  });
}
```

---

### Testing Standards

**Test Structure:**
```typescript
describe('SwipeService', () => {
  let swipeService: SwipeService;
  let mockRepo: jest.Mocked<ISwipeRepository>;

  beforeEach(() => {
    // Setup
    mockRepo = createMockRepository();
    swipeService = new SwipeService(mockRepo);
  });

  afterEach(() => {
    // Cleanup
    jest.clearAllMocks();
  });

  describe('processSwipe', () => {
    it('should create swipe successfully', async () => {
      // Arrange
      const input = { swiperId: 'user1', targetId: 'user2', action: 'like' };
      mockRepo.create.mockResolvedValue({ id: 'swipe1', ...input });

      // Act
      const result = await swipeService.processSwipe(input);

      // Assert
      expect(result.swipe).toBeDefined();
      expect(result.isMatch).toBe(false);
      expect(mockRepo.create).toHaveBeenCalledWith(input);
    });

    it('should throw ValidationError for invalid input', async () => {
      // Arrange
      const input = { swiperId: '', targetId: 'user2', action: 'like' };

      // Act & Assert
      await expect(swipeService.processSwipe(input))
        .rejects
        .toThrow(ValidationError);
    });

    it('should detect match when mutual like exists', async () => {
      // ... test implementation
    });
  });
});
```

**Test Coverage Goals:**
- Unit tests: 80%+ coverage
- Integration tests: Critical paths
- E2E tests: User journeys
- Load tests: Performance benchmarks

---

### Git Workflow

**Branch Naming:**
```
feature/user-profile-edit
bugfix/swipe-race-condition
hotfix/critical-security-patch
refactor/homescreen-decomposition
chore/update-dependencies
docs/api-documentation
```

**Commit Messages (Conventional Commits):**
```
feat: add user profile editing
fix: resolve swipe race condition
refactor: decompose HomeScreen component
perf: optimize database queries
docs: update API documentation
test: add integration tests for swipe flow
chore: update dependencies
style: format code with prettier
ci: add GitHub Actions workflow
```

**PR Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Added/updated tests
- [ ] Tests pass locally
- [ ] Updated documentation
- [ ] No new warnings

## Screenshots (if applicable)
Add screenshots here

## Related Issues
Closes #123
```

---

## 📊 SUCCESS METRICS

### Performance Metrics
- API response time: <200ms (p95)
- Database query time: <50ms (p95)
- Time to First Byte: <500ms
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Bundle size: <1MB (initial)

### Quality Metrics
- Test coverage: >80%
- TypeScript coverage: 100%
- Error rate: <0.1%
- Uptime: >99.9%
- Security vulnerabilities: 0 critical/high

### Code Quality
- ESLint violations: 0
- TypeScript errors: 0
- Cyclomatic complexity: <10 per function
- Code duplication: <5%

---

## 🎯 PRIORITY MATRIX

| Priority | Tasks | Timeline |
|----------|-------|----------|
| P0 (Critical) | Remove debug code, fix race conditions, security fixes | Week 1 |
| P1 (High) | Error handling, HomeScreen refactor, indexes | Week 1-2 |
| P2 (Medium) | Repository pattern, caching, testing | Week 3-9 |
| P3 (Low) | Documentation, TypeScript migration | Week 10-12 |

---

## ✅ COMPLETION CHECKLIST

### Week 1-2: Foundation
- [ ] Remove all debug code
- [ ] Fix race conditions
- [ ] Standardize error handling
- [ ] Add database indexes
- [ ] Security audit & fixes

### Week 3-5: Architecture
- [ ] Implement repository pattern
- [ ] Refactor service layer
- [ ] Add dependency injection
- [ ] API versioning
- [ ] HomeScreen decomposition

### Week 6-7: Performance
- [ ] Multi-layer caching
- [ ] Query optimization
- [ ] Bundle optimization
- [ ] Image optimization
- [ ] React performance

### Week 8-9: Testing
- [ ] Unit tests >80% coverage
- [ ] Integration tests
- [ ] E2E tests
- [ ] Load testing
- [ ] Security testing

### Week 10-11: TypeScript
- [ ] Complete service migration
- [ ] Complete controller migration
- [ ] Complete screen migration
- [ ] Enable strict mode

### Week 12: Launch
- [ ] Performance audit
- [ ] Security audit
- [ ] Monitoring setup
- [ ] Production deployment

---

## 🚀 GETTING STARTED

Ready to begin? Start with **Phase 1, Day 1**:

1. Create a new branch: `git checkout -b refactor/remove-debug-code`
2. Remove all `#region agent log` blocks
3. Remove console.log statements
4. Implement proper logging service
5. Run tests
6. Create PR

Good luck with the refactoring! 🎉
