# Frontend Services - Backend Support Gap Analysis

## Overview

This document identifies frontend services that lack backend support and provides implementation recommendations.

---

## 1. PWAService ✅

**Status:** Client-only (acceptable)  
**Location:** `src/services/PWAService.js`

### Current Implementation

- Manages Progressive Web App features client-side
- Handles service worker registration
- Manages install prompts
- Handles push notification subscriptions
- Background sync registration

### Backend Support Required

**None** - This service correctly operates client-only. PWA features are browser/platform specific and don't require backend coordination.

### Notes

- Push notification subscriptions may need to be sent to backend for server-side push notifications
- Consider adding endpoint: `POST /api/notifications/push-subscription` to register push tokens

---

## 2. OfflineService ❌

**Status:** **CRITICAL** - Needs backend sync mechanism  
**Location:** `src/services/OfflineService.js`

### Current Implementation

- Queues actions when offline: `SEND_MESSAGE`, `SWIPE`, `UPDATE_PROFILE`
- Stores pending actions in AsyncStorage
- Attempts to sync when back online
- **Problem:** No backend API to handle bulk sync or conflict resolution

### Missing Backend APIs

#### 1. Bulk Action Execution

```
POST /api/sync/execute
Body: {
  actions: [
    {
      id: "action_123",
      type: "SEND_MESSAGE" | "SWIPE" | "UPDATE_PROFILE",
      timestamp: "2024-01-01T00:00:00Z",
      data: { ... }
    }
  ]
}
Response: {
  success: true,
  results: [
    { id: "action_123", status: "success" | "conflict" | "error", ... }
  ],
  conflicts: [ ... ]
}
```

#### 2. Conflict Detection & Resolution

```
GET /api/sync/conflicts
Response: {
  conflicts: [
    {
      actionId: "action_123",
      type: "UPDATE_PROFILE",
      localData: { ... },
      serverData: { ... },
      conflictReason: "timestamp_mismatch" | "data_changed"
    }
  ]
}

POST /api/sync/resolve
Body: {
  actionId: "action_123",
  resolution: "use_local" | "use_server" | "merge",
  mergedData?: { ... }
}
```

#### 3. Sync Status

```
GET /api/sync/status
Response: {
  lastSyncTimestamp: "2024-01-01T00:00:00Z",
  pendingActionsCount: 5,
  conflictsCount: 2,
  syncInProgress: false
}
```

### Implementation Requirements

1. **Action Queue Model**
   - Store pending actions with timestamps
   - Track retry attempts
   - Handle action deduplication

2. **Conflict Detection**
   - Compare timestamps
   - Detect data changes on server
   - Handle concurrent modifications

3. **Bulk Processing**
   - Process multiple actions atomically
   - Handle partial failures
   - Return detailed results per action

4. **Business Rules**
   - Validate actions are still valid (e.g., match still exists)
   - Check user permissions haven't changed
   - Verify data hasn't been deleted

### Priority: **HIGH**

Affects user experience when offline. Users expect actions to sync when back online.

---

## 3. BetaTestingService ❌

**Status:** Should use backend for persistence and admin visibility  
**Location:** `src/services/BetaTestingService.js`

### Current Implementation

- All data stored client-side only (in-memory)
- No persistence across devices
- No admin visibility
- No centralized control

### Missing Backend APIs

#### 1. Beta Enrollment

```
POST /api/beta/enroll
Body: {
  email: "user@example.com",
  name: "User Name",
  features: ["all"] | ["feature1", "feature2"],
  tier: "standard" | "premium" | "vip",
  deviceInfo: { ... },
  consent: {
    dataCollection: true,
    crashReporting: true,
    analytics: true,
    screenshots: false
  }
}
Response: {
  success: true,
  enrollment: { ... }
}

GET /api/beta/status
Response: {
  isBetaTester: true,
  tier: "premium",
  enrolledAt: "2024-01-01T00:00:00Z",
  features: ["all"]
}
```

#### 2. Feedback Submission

```
POST /api/beta/feedback
Body: {
  type: "general" | "feature" | "bug" | "suggestion",
  category: "ui" | "performance" | "feature_request",
  title: "Feedback title",
  description: "Detailed description",
  rating: 1-5,
  screenshot?: "base64...",
  screenName: "HomeScreen",
  deviceInfo: { ... },
  appVersion: "1.0.0",
  tags: ["tag1", "tag2"]
}
Response: {
  success: true,
  feedbackId: "feedback_123",
  status: "new"
}

GET /api/beta/feedback
Query: ?type=&status=&fromDate=
Response: {
  feedback: [ ... ]
}
```

#### 3. Bug Reports

```
POST /api/beta/bug
Body: {
  title: "Bug title",
  description: "Bug description",
  severity: "low" | "medium" | "high" | "critical",
  reproducibility: "always" | "sometimes" | "rarely",
  stepsToReproduce: ["step1", "step2"],
  expectedBehavior: "...",
  actualBehavior: "...",
  screenshot?: "base64...",
  screenRecording?: "url...",
  logs: ["log1", "log2"],
  deviceInfo: { ... },
  appVersion: "1.0.0",
  osVersion: "iOS 17.0"
}
Response: {
  success: true,
  bugId: "bug_123"
}
```

#### 4. Session Analytics

```
POST /api/beta/session
Body: {
  startTime: "2024-01-01T00:00:00Z",
  endTime: "2024-01-01T01:00:00Z",
  duration: 3600000,
  screens: ["HomeScreen", "ProfileScreen"],
  actions: ["swipe", "like", "message"],
  errors: [ ... ],
  performance: {
    loadTimes: { ... },
    crashes: 0,
    networkErrors: 0
  },
  featuresUsed: ["feature1", "feature2"],
  deviceInfo: { ... },
  appVersion: "1.0.0"
}
Response: {
  success: true,
  sessionId: "session_123"
}
```

#### 5. Admin Analytics

```
GET /api/beta/analytics
Response: {
  totalBetaUsers: 150,
  activeUsers: 120,
  totalSessions: 5000,
  averageSessionDuration: 25, // minutes
  feedbackStats: {
    total: 200,
    byType: { ... },
    byStatus: { ... },
    averageRating: 4.2
  },
  bugStats: {
    total: 50,
    bySeverity: { ... },
    critical: 5
  },
  featureUsage: { ... }
}
```

### Implementation Requirements

1. **Beta User Model**
   - Store enrollment data
   - Track beta tier and features
   - Manage consent preferences

2. **Feedback Model**
   - Store feedback submissions
   - Track status (new, reviewing, acknowledged, implemented, wont-fix)
   - Support attachments (screenshots)

3. **Bug Report Model**
   - Store bug reports with severity
   - Track assignees and status
   - Support logs and recordings

4. **Session Analytics Model**
   - Store session data
   - Aggregate analytics
   - Performance metrics

5. **Admin Dashboard**
   - View all feedback/bugs
   - Update status
   - Assign to team members
   - Export data

### Priority: **MEDIUM**

Improves beta testing workflow but not critical for core functionality.

---

## 4. FeatureFlagService ❌

**Status:** **CRITICAL** - Should use backend for centralized control  
**Location:** `src/services/FeatureFlagService.js`

### Current Implementation

- Flags hardcoded in frontend
- No centralized control
- No user-specific overrides from backend
- No dynamic rollout management
- No A/B test coordination

### Missing Backend APIs

#### 1. Get User Flags

```
GET /api/feature-flags
Response: {
  flags: {
    "beta_video_chat": {
      enabled: true,
      description: "Enable video chat feature"
    },
    "beta_ai_matchmaking": {
      enabled: false,
      description: "AI-powered matchmaking"
    },
    ...
  }
}

GET /api/feature-flags/:flagName
Response: {
  enabled: true,
  description: "...",
  rolloutPercentage: 50,
  userOverride: null
}
```

#### 2. Admin Flag Management

```
GET /api/feature-flags/admin
Response: {
  flags: [
    {
      name: "beta_video_chat",
      enabled: true,
      description: "...",
      rolloutPercentage: 50,
      allowedGroups: ["beta_testers", "premium"],
      isABTest: false,
      createdAt: "2024-01-01T00:00:00Z"
    },
    ...
  ]
}

POST /api/feature-flags/admin
Body: {
  name: "new_feature",
  enabled: true,
  description: "New feature description",
  rolloutPercentage: 0,
  allowedGroups: ["beta_testers"],
  isABTest: false
}
Response: {
  success: true,
  flag: { ... }
}

PUT /api/feature-flags/admin/:flagName
Body: {
  enabled: true,
  rolloutPercentage: 75,
  allowedGroups: ["all"]
}
Response: {
  success: true,
  flag: { ... }
}
```

#### 3. Rollout Management

```
PUT /api/feature-flags/admin/:flagName/rollout
Body: {
  percentage: 50 // 0-100
}
Response: {
  success: true,
  flag: { ... }
}
```

#### 4. User Overrides

```
POST /api/feature-flags/admin/:flagName/override
Body: {
  userId: "user_123",
  enabled: true
}
Response: {
  success: true
}

DELETE /api/feature-flags/admin/:flagName/override/:userId
Response: {
  success: true
}
```

### Implementation Requirements

1. **Feature Flag Model**

   ```javascript
   {
     name: String (unique),
     enabled: Boolean,
     description: String,
     rolloutPercentage: Number (0-100),
     allowedGroups: [String],
     isABTest: Boolean,
     createdAt: Date,
     updatedAt: Date
   }
   ```

2. **User Override Model**

   ```javascript
   {
     userId: ObjectId,
     flagName: String,
     enabled: Boolean,
     setBy: ObjectId (admin),
     setAt: Date
   }
   ```

3. **Flag Evaluation Logic**
   - Check user-specific override first
   - Check if flag is globally enabled
   - Check user groups (beta_testers, premium, etc.)
   - Check rollout percentage (hash-based consistent assignment)
   - Return final enabled status

4. **Caching Strategy**
   - Cache flags per user (5-10 minutes)
   - Invalidate on flag updates
   - Support real-time updates via WebSocket

5. **A/B Testing Support**
   - Consistent assignment (hash-based)
   - Track variant assignments
   - Support analytics integration

### Priority: **HIGH**

Critical for:

- Beta testing coordination
- Gradual feature rollouts
- A/B testing
- Emergency feature toggles

---

## Implementation Priority

### Phase 1 (Critical - Week 1)

1. ✅ Feature Flag Backend
   - Flag model and CRUD endpoints
   - User flag evaluation
   - Admin management

### Phase 2 (High Priority - Week 2)

2. ✅ Offline Sync Backend
   - Bulk action execution
   - Conflict detection
   - Sync status tracking

### Phase 3 (Medium Priority - Week 3-4)

3. ✅ Beta Testing Backend
   - Enrollment system
   - Feedback/bug submission
   - Session analytics
   - Admin dashboard

---

## Database Models Needed

### FeatureFlag

```javascript
{
  name: String (unique, indexed),
  enabled: Boolean,
  description: String,
  rolloutPercentage: Number,
  allowedGroups: [String],
  isABTest: Boolean,
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}
```

### FeatureFlagOverride

```javascript
{
  userId: ObjectId (indexed),
  flagName: String (indexed),
  enabled: Boolean,
  setBy: ObjectId,
  setAt: Date
}
```

### OfflineAction

```javascript
{
  userId: ObjectId (indexed),
  actionId: String (unique),
  type: String, // SEND_MESSAGE, SWIPE, UPDATE_PROFILE
  data: Object,
  timestamp: Date,
  retryCount: Number,
  status: String, // pending, synced, conflict, failed
  syncedAt: Date,
  conflicts: [Object]
}
```

### BetaEnrollment

```javascript
{
  userId: ObjectId (unique, indexed),
  email: String,
  name: String,
  features: [String],
  tier: String,
  deviceInfo: Object,
  consent: Object,
  status: String, // active, inactive
  enrolledAt: Date
}
```

### BetaFeedback

```javascript
{
  userId: ObjectId (indexed),
  type: String,
  category: String,
  title: String,
  description: String,
  rating: Number,
  screenshot: String,
  screenName: String,
  deviceInfo: Object,
  appVersion: String,
  tags: [String],
  status: String,
  priority: String,
  assignee: ObjectId,
  notes: String,
  timestamp: Date,
  updatedAt: Date
}
```

### BetaSession

```javascript
{
  userId: ObjectId (indexed),
  startTime: Date,
  endTime: Date,
  duration: Number,
  screens: [String],
  actions: [String],
  errors: [Object],
  performance: Object,
  featuresUsed: [String],
  device: Object,
  appVersion: String
}
```

---

## Testing Requirements

### Feature Flags

- [ ] Test flag evaluation logic
- [ ] Test user overrides
- [ ] Test rollout percentages
- [ ] Test group-based access
- [ ] Test caching and invalidation

### Offline Sync

- [ ] Test bulk action execution
- [ ] Test conflict detection
- [ ] Test conflict resolution
- [ ] Test retry logic
- [ ] Test action deduplication

### Beta Testing

- [ ] Test enrollment flow
- [ ] Test feedback submission
- [ ] Test bug report submission
- [ ] Test session recording
- [ ] Test admin analytics

---

## Security Considerations

1. **Feature Flags**
   - Admin-only endpoints require admin role
   - Rate limit flag evaluation endpoints
   - Audit log flag changes

2. **Offline Sync**
   - Validate action types
   - Verify user ownership of actions
   - Prevent action replay attacks
   - Rate limit sync endpoints

3. **Beta Testing**
   - Verify beta tester status
   - Sanitize feedback/bug submissions
   - Limit file upload sizes (screenshots)
   - Rate limit submissions

---

## Conclusion

Three frontend services require backend support:

1. **OfflineService** - Critical for offline functionality
2. **FeatureFlagService** - Critical for feature management
3. **BetaTestingService** - Important for beta program

PWAService correctly operates client-only and doesn't need backend changes (except optional push subscription registration).

All missing endpoints have been added to the main feature map document.
