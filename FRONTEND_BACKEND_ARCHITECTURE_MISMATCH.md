# 🔧 FRONTEND-BACKEND ARCHITECTURE MISMATCH - CRITICAL ISSUES

**Dating App - Frontend Services Bypassing Backend API**

---

## EXECUTIVE SUMMARY

The frontend has implemented multiple services that **directly access Firebase Firestore** instead of using the backend API endpoints that have been fully implemented. This creates:

- ❌ **Data Inconsistency** - Frontend and backend have different data
- ❌ **Security Bypass** - Server-side validation is skipped
- ❌ **Race Conditions** - No atomic operations or transactions
- ❌ **Audit Trail Loss** - Backend logging/monitoring bypassed
- ❌ **Scalability Issues** - Direct Firestore access doesn't scale
- ❌ **Compliance Issues** - No server-side data governance

---

## CRITICAL ISSUES IDENTIFIED

### 1. SafetyService - Hybrid Implementation

**Location:** `src/services/SafetyService.js`

**Problem:**

- Some methods use backend API (`blockUser`, `reportUser`, `getBlockedUsers`)
- Other methods use direct Firestore (`unblockUser`, `submitPhotoVerification`, `flagContent`, `shareDatePlan`, `sendEmergencySOS`)
- Inconsistent data storage and validation

**Backend API Available (Unused):**

```
POST   /api/safety/report              - Report user
POST   /api/safety/block               - Block user
DELETE /api/safety/block/:blockedUserId - Unblock user
GET    /api/safety/blocked             - Get blocked users
POST   /api/safety/date-plan           - Share date plans
POST   /api/safety/sos                 - Emergency SOS
POST   /api/safety/checkin/*           - Check-in features
```

**Current Implementation Issues:**

```javascript
// ❌ INCONSISTENT: blockUser uses API
static async blockUser(blockedUserId) {
  const response = await api.post('/safety/block', { blockedUserId });
  // Uses backend
}

// ❌ INCONSISTENT: unblockUser uses Firestore directly
static async unblockUser(userId, blockedUserId) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { blockedUsers: filtered });
  // Bypasses backend - no server-side validation!
}

// ❌ INCONSISTENT: shareDatePlan uses Firestore directly
static async shareDatePlan(userId, datePlanData, friendIds = []) {
  const docRef = await addDoc(collection(db, 'datePlans'), datePlan);
  // Bypasses backend - no server-side validation!
}

// ❌ INCONSISTENT: sendEmergencySOS uses Firestore directly
static async sendEmergencySOS(userId, location = {}, emergencyMessage = '') {
  const docRef = await addDoc(collection(db, 'emergencyAlerts'), sosAlert);
  // Bypasses backend - CRITICAL SECURITY ISSUE!
}
```

**Impact:**

- User can unblock themselves without server validation
- Date plans not validated on server
- Emergency SOS not logged on server
- No audit trail for safety operations
- Race conditions in concurrent operations

---

### 2. SwipeController - Direct Firestore Access

**Location:** `src/services/SwipeController.js`

**Problem:**

- Uses direct Firestore for all swipe operations
- Backend has fully implemented swipe API at `/api/swipes/*`
- No server-side swipe limit enforcement
- Race conditions in match creation

**Backend API Available (Unused):**

```
POST   /api/swipes                 - Create swipe
GET    /api/swipes/matches         - Get matches
POST   /api/swipes/undo            - Undo swipe
GET    /api/swipes/pending-likes   - Who liked you
GET    /api/swipes/count/today     - Daily swipe count
```

**Current Implementation Issues:**

```javascript
// ❌ PROBLEM: Direct Firestore write, no server validation
static async saveSwipe(swiperId, targetId, type, isPremium = false) {
  const swipeData = {
    ...swipe.toFirestore(),
    createdAt: serverTimestamp(),
  };
  const swipeRef = await addDoc(collection(db, 'swipes'), swipeData);
  // No server-side validation!
  // No swipe limit enforcement!
  // No audit logging!
}

// ❌ PROBLEM: Race condition in match creation
static async checkAndCreateMatch(swiperId, targetId) {
  const targetSwipe = await this.getSwipe(targetId, swiperId);
  if (targetSwipe && targetSwipe.type === 'like') {
    const matchId = await this.createMatch(swiperId, targetId);
    // Two simultaneous swipes could create duplicate matches!
  }
}

// ❌ PROBLEM: Duplicate match IDs possible
static async createMatch(userId1, userId2) {
  const sortedIds = [userId1, userId2].sort();
  const matchId = `${sortedIds[0]}_${sortedIds[1]}`;
  // No atomic check-and-set operation!
  // Race condition: both users could create match simultaneously!
}

// ❌ PROBLEM: Swipe limit not enforced
static async checkSwipeLimit(userId, isPremium = false) {
  if (isPremium) {
    return { canSwipe: true, remaining: -1 };
  }
  const swipesCount = await this.getSwipesCountToday(userId);
  // Client-side check only - user can bypass by modifying code!
}
```

**Impact:**

- Free users can swipe unlimited times (revenue loss)
- Duplicate matches possible
- No server-side validation
- No audit trail
- Swipe counts not accurate

---

### 3. NotificationService - Firebase Direct Access

**Location:** `src/services/NotificationService.js`

**Problem:**

- Writes directly to Firestore for notification preferences
- Backend has `/api/notifications/*` routes
- No server-side preference sync
- Preferences can be modified without backend knowledge

**Backend API Available (Unused):**

```
GET    /api/notifications/preferences    - Get preferences
POST   /api/notifications/preferences    - Update preferences
GET    /api/notifications                - Get notifications
POST   /api/notifications/read           - Mark as read
```

**Current Implementation Issues:**

```javascript
// ❌ PROBLEM: Direct Firestore write
static async updateNotificationPreferences(userId, preferences) {
  await updateDoc(doc(db, 'users', userId), {
    preferences: {
      matchNotifications: preferences.matchNotifications !== false,
      messageNotifications: preferences.messageNotifications !== false,
      // ...
    },
  });
  // No server-side validation!
  // Backend doesn't know about preference changes!
}

// ❌ PROBLEM: Direct Firestore read
static async getNotificationPreferences(userId) {
  const userDoc = await getDoc(doc(db, 'users', userId));
  return userDoc.data()?.preferences || { /* defaults */ };
  // Bypasses backend - could be stale!
}

// ❌ PROBLEM: Push token stored in Firestore
static async registerForPushNotifications(userId) {
  await updateDoc(doc(db, 'users', userId), {
    pushToken: tokenData,
    notificationsEnabled: true,
  });
  // Should be stored on backend for security!
}
```

**Impact:**

- Preferences not synced with backend
- Push tokens stored in Firestore (security risk)
- No server-side validation
- Preferences could be inconsistent across devices

---

## ROOT CAUSE ANALYSIS

### Why This Happened

1. **Firebase Firestore Convenience** - Direct access is easier than API calls
2. **Rapid Development** - Frontend developed in parallel with backend
3. **Lack of Architecture Review** - No enforcement of API-first pattern
4. **Missing Integration Tests** - No tests verifying frontend uses backend API
5. **Incomplete Backend Integration** - Backend APIs exist but frontend doesn't use them

### Why This Is Critical

1. **Security** - Server-side validation bypassed
2. **Data Integrity** - Race conditions and inconsistencies
3. **Scalability** - Direct Firestore access doesn't scale
4. **Compliance** - No audit trail for sensitive operations
5. **Maintainability** - Two sources of truth for data

---

## SOLUTION ARCHITECTURE

### Principle: API-First Frontend

**All frontend data operations must go through backend API:**

```
Frontend Service
    ↓
Backend API Endpoint
    ↓
Backend Controller
    ↓
Backend Service/Model
    ↓
Database (MongoDB/Firestore)
```

**Never:**

```
Frontend Service
    ↓
Database (Firestore) ❌ WRONG!
```

---

## DETAILED FIXES

### FIX 1: SafetyService - Migrate to Backend API

**Current State:**

- Hybrid implementation (some API, some Firestore)
- Inconsistent data storage

**Target State:**

- All operations use backend API
- Consistent server-side validation
- Audit trail for all operations

**Implementation:**

#### Step 1: Create Unified SafetyService

```javascript
// src/services/SafetyService.js
import api from './api';
import logger from '../utils/logger';

export class SafetyService {
  // ✅ Block user via API
  static async blockUser(blockedUserId) {
    try {
      const response = await api.post('/safety/block', { blockedUserId });
      if (!response.success) {
        throw new Error(response.message);
      }
      logger.info('User blocked', { blockedUserId });
      return response.data || true;
    } catch (error) {
      logger.error('Error blocking user', error, { blockedUserId });
      throw error;
    }
  }

  // ✅ Unblock user via API (was using Firestore)
  static async unblockUser(blockedUserId) {
    try {
      const response = await api.delete(`/safety/block/${blockedUserId}`);
      if (!response.success) {
        throw new Error(response.message);
      }
      logger.info('User unblocked', { blockedUserId });
      return true;
    } catch (error) {
      logger.error('Error unblocking user', error, { blockedUserId });
      throw error;
    }
  }

  // ✅ Get blocked users via API
  static async getBlockedUsers() {
    try {
      const response = await api.get('/safety/blocked');
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data?.blockedUsers || [];
    } catch (error) {
      logger.error('Error getting blocked users', error);
      return [];
    }
  }

  // ✅ Report user via API
  static async reportUser(reportedUserId, category, description, evidence = []) {
    try {
      const response = await api.post('/safety/report', {
        reportedUserId,
        category,
        description,
        evidence,
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      logger.info('Report created', {
        reportId: response.data?.reportId,
        reportedUserId,
        category,
      });
      return response.data;
    } catch (error) {
      logger.error('Error creating report', error, { reportedUserId, category });
      throw error;
    }
  }

  // ✅ Share date plan via API (was using Firestore)
  static async shareDatePlan(datePlanData, friendIds = []) {
    try {
      const response = await api.post('/safety/date-plan', {
        matchUserId: datePlanData.matchUserId,
        matchName: datePlanData.matchName,
        matchPhotoUrl: datePlanData.matchPhotoUrl,
        location: datePlanData.location,
        address: datePlanData.address,
        coordinates: datePlanData.coordinates,
        dateTime: datePlanData.dateTime,
        notes: datePlanData.notes,
        sharedWith: friendIds,
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      logger.info('Date plan shared', {
        datePlanId: response.data?.datePlanId,
        matchUserId: datePlanData.matchUserId,
      });
      return response.data;
    } catch (error) {
      logger.error('Error sharing date plan', error, {
        matchUserId: datePlanData.matchUserId,
      });
      throw error;
    }
  }

  // ✅ Send emergency SOS via API (was using Firestore)
  static async sendEmergencySOS(location = {}, emergencyMessage = '') {
    try {
      const response = await api.post('/safety/sos', {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        message: emergencyMessage,
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      logger.info('SOS alert created', {
        sosAlertId: response.data?.sosAlertId,
        location,
      });
      return response.data;
    } catch (error) {
      logger.error('Error sending SOS', error, { location });
      throw error;
    }
  }

  // ✅ Start check-in timer via API
  static async startCheckInTimer(datePlanId, duration = 300000) {
    try {
      const response = await api.post('/safety/checkin/start', {
        datePlanId,
        duration,
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      logger.info('Check-in timer started', {
        checkInId: response.data?.checkInId,
        datePlanId,
        duration,
      });
      return response.data;
    } catch (error) {
      logger.error('Error starting check-in timer', error, { datePlanId });
      throw error;
    }
  }

  // ✅ Complete check-in via API
  static async completeCheckIn(checkInId) {
    try {
      const response = await api.post(`/safety/checkin/${checkInId}/complete`);
      if (!response.success) {
        throw new Error(response.message);
      }
      logger.info('Check-in completed', { checkInId });
      return true;
    } catch (error) {
      logger.error('Error completing check-in', error, { checkInId });
      throw error;
    }
  }

  // ✅ Get active check-ins via API
  static async getActiveCheckIns() {
    try {
      const response = await api.get('/safety/checkin/active');
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data?.checkIns || [];
    } catch (error) {
      logger.error('Error getting check-ins', error);
      return [];
    }
  }

  // ✅ Get active SOS alerts via API
  static async getActiveSOS() {
    try {
      const response = await api.get('/safety/sos/active');
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data?.sosAlerts || [];
    } catch (error) {
      logger.error('Error getting SOS alerts', error);
      return [];
    }
  }

  // ✅ Respond to SOS via API
  static async respondToSOS(sosAlertId, response) {
    try {
      const apiResponse = await api.post(`/safety/sos/${sosAlertId}/respond`, {
        message: response.message,
        confirmedSafe: response.confirmedSafe,
        contactInfo: response.contactInfo,
      });
      if (!apiResponse.success) {
        throw new Error(apiResponse.message);
      }
      logger.info('SOS response sent', { sosAlertId });
      return true;
    } catch (error) {
      logger.error('Error responding to SOS', error, { sosAlertId });
      throw error;
    }
  }

  // ✅ Resolve SOS via API
  static async resolveSOS(sosAlertId, status = 'resolved') {
    try {
      const response = await api.post(`/safety/sos/${sosAlertId}/resolve`, { status });
      if (!response.success) {
        throw new Error(response.message);
      }
      logger.info('SOS resolved', { sosAlertId, status });
      return true;
    } catch (error) {
      logger.error('Error resolving SOS', error, { sosAlertId });
      throw error;
    }
  }

  // ✅ Get active date plans via API
  static async getActiveDatePlans() {
    try {
      const response = await api.get('/safety/date-plan/active');
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data?.datePlans || [];
    } catch (error) {
      logger.error('Error getting date plans', error);
      return [];
    }
  }

  // ✅ Get shared date plans via API
  static async getSharedDatePlans() {
    try {
      const response = await api.get('/safety/date-plan/shared');
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data?.datePlans || [];
    } catch (error) {
      logger.error('Error getting shared date plans', error);
      return [];
    }
  }

  // ✅ Update date plan status via API
  static async updateDatePlanStatus(datePlanId, status) {
    try {
      const response = await api.put(`/safety/date-plan/${datePlanId}`, { status });
      if (!response.success) {
        throw new Error(response.message);
      }
      logger.info('Date plan updated', { datePlanId, status });
      return true;
    } catch (error) {
      logger.error('Error updating date plan', error, { datePlanId });
      throw error;
    }
  }

  // ✅ Submit photo verification via API
  static async submitPhotoVerification(photoUri, livenessCheck = {}) {
    try {
      const response = await api.post('/safety/verify-photo', {
        photoUri,
        method: livenessCheck.method || 'basic',
        passed: livenessCheck.passed || false,
        ...livenessCheck,
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      logger.info('Verification submitted', {
        verificationId: response.data?.verificationId,
        method: livenessCheck.method || 'basic',
      });
      return response.data;
    } catch (error) {
      logger.error('Error submitting verification', error);
      throw error;
    }
  }

  // ✅ Get photo verification status via API
  static async getPhotoVerificationStatus() {
    try {
      const response = await api.get('/safety/verify-photo/status');
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data || { verified: false, status: 'not_submitted' };
    } catch (error) {
      logger.error('Error getting verification status', error);
      return { verified: false, status: 'error' };
    }
  }

  // ✅ Flag content via API
  static async flagContent(contentType, contentId, reason, description = '') {
    try {
      const response = await api.post('/safety/flag-content', {
        contentType,
        contentId,
        reason,
        description,
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      logger.info('Content flagged', {
        flagId: response.data?.flagId,
        contentType,
        contentId,
        reason,
      });
      return response.data;
    } catch (error) {
      logger.error('Error flagging content', error, { contentType, contentId });
      throw error;
    }
  }

  // ✅ Check if can interact via API
  static async canInteractWith(targetUserId) {
    try {
      const response = await api.get(`/safety/can-interact/${targetUserId}`);
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data || { allowed: true };
    } catch (error) {
      logger.error('Error checking interaction', error, { targetUserId });
      return { allowed: false, reason: 'error' };
    }
  }

  // ✅ Get safety tips (local, no API needed)
  static getSafetyTips() {
    return [
      {
        id: 1,
        title: 'Protect Your Personal Information',
        category: 'privacy',
        tips: [
          "Don't share your home address or phone number in your profile",
          'Avoid mentioning your workplace or routine schedule',
          'Never send money or financial information to someone you just met',
          'Be cautious about location-based personal details',
        ],
        icon: '🔐',
      },
      // ... rest of tips
    ];
  }

  // ✅ Validation (local, no API needed)
  static validateReport(category, description) {
    const errors = [];
    if (!category || category.trim() === '') {
      errors.push('Please select a report category');
    }
    if (!description || description.trim().length < 10) {
      errors.push('Please provide at least 10 characters of detail');
    }
    if (description && description.length > 500) {
      errors.push('Description cannot exceed 500 characters');
    }
    return { isValid: errors.length === 0, errors };
  }
}
```

**Benefits:**

- ✅ All operations go through backend API
- ✅ Server-side validation enforced
- ✅ Audit trail for all operations
- ✅ Consistent data storage
- ✅ No race conditions
- ✅ Scalable architecture

---

### FIX 2: SwipeController - Migrate to Backend API

**Current State:**

- All operations use direct Firestore
- No server-side validation
- Race conditions in match creation

**Target State:**

- All operations use backend API
- Server-side swipe limit enforcement
- Atomic match creation

**Implementation:**

```javascript
// src/services/SwipeService.js (renamed from SwipeController)
import api from './api';
import logger from '../utils/logger';

export class SwipeService {
  // ✅ Create swipe via API (was using Firestore)
  static async createSwipe(targetId, action, isPriority = false) {
    try {
      const response = await api.post('/swipes', {
        targetId,
        action, // 'like' or 'pass'
        isPriority,
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      logger.info('Swipe created', {
        swipeId: response.data?.swipeId,
        targetId,
        action,
        isMatch: response.data?.isMatch,
      });
      return response.data;
    } catch (error) {
      logger.error('Error creating swipe', error, { targetId, action });
      throw error;
    }
  }

  // ✅ Get swipe count for today via API
  static async getSwipeCountToday() {
    try {
      const response = await api.get('/swipes/count/today');
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data?.count || 0;
    } catch (error) {
      logger.error('Error getting swipe count', error);
      return 0;
    }
  }

  // ✅ Check swipe limit via API
  static async checkSwipeLimit() {
    try {
      const response = await api.get('/swipes/limit');
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data || { canSwipe: true, remaining: -1 };
    } catch (error) {
      logger.error('Error checking swipe limit', error);
      return { canSwipe: true, remaining: -1 };
    }
  }

  // ✅ Undo swipe via API (was using Firestore)
  static async undoSwipe(swipeId) {
    try {
      const response = await api.post('/swipes/undo', { swipeId });
      if (!response.success) {
        throw new Error(response.message);
      }
      logger.info('Swipe undone', { swipeId });
      return true;
    } catch (error) {
      logger.error('Error undoing swipe', error, { swipeId });
      throw error;
    }
  }

  // ✅ Get user swipes via API
  static async getUserSwipes(limit = 50, skip = 0) {
    try {
      const response = await api.get('/swipes/user', {
        params: { limit, skip },
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data?.swipes || [];
    } catch (error) {
      logger.error('Error getting user swipes', error);
      return [];
    }
  }

  // ✅ Get received swipes via API
  static async getReceivedSwipes(limit = 50, skip = 0) {
    try {
      const response = await api.get('/swipes/received', {
        params: { limit, skip },
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data?.swipes || [];
    } catch (error) {
      logger.error('Error getting received swipes', error);
      return [];
    }
  }

  // ✅ Get matches via API (was using Firestore)
  static async getMatches(status = 'active', limit = 50, skip = 0) {
    try {
      const response = await api.get('/swipes/matches', {
        params: { status, limit, skip },
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data?.matches || [];
    } catch (error) {
      logger.error('Error getting matches', error);
      return [];
    }
  }

  // ✅ Unmatch via API (was using Firestore)
  static async unmatch(matchId) {
    try {
      const response = await api.delete(`/swipes/matches/${matchId}`);
      if (!response.success) {
        throw new Error(response.message);
      }
      logger.info('Match deleted', { matchId });
      return true;
    } catch (error) {
      logger.error('Error unmatching', error, { matchId });
      throw error;
    }
  }

  // ✅ Get pending likes via API
  static async getPendingLikes(limit = 50, skip = 0) {
    try {
      const response = await api.get('/swipes/pending-likes', {
        params: { limit, skip },
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data?.likes || [];
    } catch (error) {
      logger.error('Error getting pending likes', error);
      return [];
    }
  }

  // ✅ Get swipe stats via API
  static async getSwipeStats() {
    try {
      const response = await api.get('/swipes/stats');
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data || {};
    } catch (error) {
      logger.error('Error getting swipe stats', error);
      return {};
    }
  }
}
```

**Benefits:**

- ✅ All operations go through backend API
- ✅ Server-side swipe limit enforcement
- ✅ Atomic match creation (no race conditions)
- ✅ Audit trail for all swipes
- ✅ Consistent data storage
- ✅ Scalable architecture

---

### FIX 3: NotificationService - Migrate to Backend API

**Current State:**

- Preferences stored in Firestore
- Push tokens stored in Firestore
- No server-side sync

**Target State:**

- All preferences managed via backend API
- Push tokens stored on backend
- Server-side preference sync

**Implementation:**

```javascript
// src/services/NotificationService.js
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from './api';
import logger from '../utils/logger';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export class NotificationService {
  // ✅ Register for push notifications via API
  static async registerForPushNotifications(userId) {
    try {
      if (Platform.OS === 'web') {
        logger.debug('Push notifications on web require VAPIR key setup, skipping');
        return null;
      }

      if (!Device.isDevice) {
        logger.warn('Push notifications only work on physical devices');
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        logger.warn('Failed to get push notification permissions', { userId });
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync();
      const tokenData = token.data;

      // ✅ Save token to backend API (not Firestore)
      try {
        const response = await api.post('/notifications/register-token', {
          pushToken: tokenData,
        });
        if (!response.success) {
          throw new Error(response.message);
        }
        logger.info('Push notification token saved', { userId, tokenData });
        return tokenData;
      } catch (apiError) {
        logger.error('Error saving push token to backend', apiError, { userId });
        // Don't fail - token can still be used
        return tokenData;
      }
    } catch (error) {
      logger.error('Error registering for push notifications', error, { userId });
      return null;
    }
  }

  // ✅ Send notification via backend API
  static async sendNotification(toUserId, title, body, data = {}) {
    try {
      const response = await api.post('/notifications/send', {
        toUserId,
        title,
        body,
        data,
      });
      if (!response.success) {
        logger.warn('Failed to send notification', { toUserId, title });
      }
    } catch (error) {
      logger.error('Error sending notification', error, { toUserId, title });
    }
  }

  // ✅ Send match notification via API
  static async sendMatchNotification(matchedUserId, matcherName) {
    await this.sendNotification(
      matchedUserId,
      "🎉 It's a Match!",
      `You and ${matcherName} liked each other!`,
      { type: 'match', matcherName }
    );
  }

  // ✅ Send like notification via API
  static async sendLikeNotification(likedUserId, likerName) {
    await this.sendNotification(likedUserId, '💗 New Like!', `${likerName} liked your profile!`, {
      type: 'like',
      likerName,
    });
  }

  // ✅ Send message notification via API
  static async sendMessageNotification(toUserId, fromName, message) {
    await this.sendNotification(
      toUserId,
      `💬 ${fromName}`,
      message.length > 50 ? `${message.substring(0, 50)}...` : message,
      { type: 'message', fromName, message }
    );
  }

  // ✅ Send system notification via API
  static async sendSystemNotification(toUserId, title, message, data = {}) {
    await this.sendNotification(toUserId, title, message, { type: 'system', ...data });
  }

  // ✅ Send bulk notification via API
  static async sendBulkNotification(userIds, title, body, data = {}) {
    try {
      const response = await api.post('/notifications/bulk', {
        userIds,
        title,
        body,
        data,
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      logger.info('Bulk notification sent', { count: userIds.length, title });
    } catch (error) {
      logger.error('Error sending bulk notification', error, { count: userIds.length });
    }
  }

  // ✅ Disable notifications via API (was using Firestore)
  static async disableNotifications() {
    try {
      const response = await api.post('/notifications/disable');
      if (!response.success) {
        throw new Error(response.message);
      }
      logger.info('Notifications disabled');
      return true;
    } catch (error) {
      logger.error('Error disabling notifications', error);
      throw error;
    }
  }

  // ✅ Enable notifications via API (was using Firestore)
  static async enableNotifications() {
    try {
      const response = await api.post('/notifications/enable');
      if (!response.success) {
        throw new Error(response.message);
      }
      logger.info('Notifications enabled');
      return true;
    } catch (error) {
      logger.error('Error enabling notifications', error);
      throw error;
    }
  }

  // ✅ Update notification preferences via API (was using Firestore)
  static async updateNotificationPreferences(preferences) {
    try {
      const response = await api.post('/notifications/preferences', {
        matchNotifications: preferences.matchNotifications !== false,
        messageNotifications: preferences.messageNotifications !== false,
        likeNotifications: preferences.likeNotifications !== false,
        systemNotifications: preferences.systemNotifications !== false,
        notificationFrequency: preferences.notificationFrequency || 'instant',
        quietHours: preferences.quietHours || { enabled: false, start: '22:00', end: '08:00' },
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      logger.debug('Notification preferences updated');
      return response.data;
    } catch (error) {
      logger.error('Error updating notification preferences', error);
      throw error;
    }
  }

  // ✅ Get notification preferences via API (was using Firestore)
  static async getNotificationPreferences() {
    try {
      const response = await api.get('/notifications/preferences');
      if (!response.success) {
        throw new Error(response.message);
      }
      return (
        response.data || {
          matchNotifications: true,
          messageNotifications: true,
          likeNotifications: true,
          systemNotifications: true,
          notificationFrequency: 'instant',
          quietHours: { enabled: false, start: '22:00', end: '08:00' },
        }
      );
    } catch (error) {
      logger.error('Error getting notification preferences', error);
      return {
        matchNotifications: true,
        messageNotifications: true,
        likeNotifications: true,
        systemNotifications: true,
        notificationFrequency: 'instant',
        quietHours: { enabled: false, start: '22:00', end: '08:00' },
      };
    }
  }

  // ✅ Get notifications via API
  static async getNotifications(limit = 50, skip = 0) {
    try {
      const response = await api.get('/notifications', {
        params: { limit, skip },
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data?.notifications || [];
    } catch (error) {
      logger.error('Error getting notifications', error);
      return [];
    }
  }

  // ✅ Mark notification as read via API
  static async markAsRead(notificationId) {
    try {
      const response = await api.post(`/notifications/${notificationId}/read`);
      if (!response.success) {
        throw new Error(response.message);
      }
      return true;
    } catch (error) {
      logger.error('Error marking notification as read', error, { notificationId });
      throw error;
    }
  }

  // ✅ Mark all notifications as read via API
  static async markAllAsRead() {
    try {
      const response = await api.post('/notifications/read-all');
      if (!response.success) {
        throw new Error(response.message);
      }
      return true;
    } catch (error) {
      logger.error('Error marking all notifications as read', error);
      throw error;
    }
  }

  // ✅ Delete notification via API
  static async deleteNotification(notificationId) {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      if (!response.success) {
        throw new Error(response.message);
      }
      return true;
    } catch (error) {
      logger.error('Error deleting notification', error, { notificationId });
      throw error;
    }
  }

  // Local helper (no API needed)
  static isWithinQuietHours(quietHours) {
    if (!quietHours?.enabled) return false;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const [startHour, startMin] = quietHours.start.split(':').map(Number);
    const [endHour, endMin] = quietHours.end.split(':').map(Number);
    const [currentHour, currentMin] = currentTime.split(':').map(Number);

    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;
    const currentTotalMin = currentHour * 60 + currentMin;

    if (startTotalMin <= endTotalMin) {
      return currentTotalMin >= startTotalMin && currentTotalMin < endTotalMin;
    } else {
      return currentTotalMin >= startTotalMin || currentTotalMin < endTotalMin;
    }
  }
}
```

**Benefits:**

- ✅ All preferences managed via backend API
- ✅ Push tokens stored securely on backend
- ✅ Server-side preference sync
- ✅ Consistent data across devices
- ✅ Audit trail for preference changes
- ✅ Scalable architecture

---

## MIGRATION CHECKLIST

### Phase 1: SafetyService (Week 1)

- [ ] Create new SafetyService using backend API
- [ ] Update all components using SafetyService
- [ ] Add unit tests for SafetyService
- [ ] Add integration tests with backend
- [ ] Deploy and monitor

### Phase 2: SwipeService (Week 2)

- [ ] Rename SwipeController to SwipeService
- [ ] Migrate all operations to backend API
- [ ] Update all components using SwipeService
- [ ] Add unit tests for SwipeService
- [ ] Add integration tests with backend
- [ ] Deploy and monitor

### Phase 3: NotificationService (Week 3)

- [ ] Update NotificationService to use backend API
- [ ] Migrate all preference operations
- [ ] Update all components using NotificationService
- [ ] Add unit tests for NotificationService
- [ ] Add integration tests with backend
- [ ] Deploy and monitor

### Phase 4: Verification (Week 4)

- [ ] Audit all frontend services for Firestore access
- [ ] Verify all operations use backend API
- [ ] Add integration tests for all services
- [ ] Performance testing
- [ ] Security audit

---

## TESTING STRATEGY

### Unit Tests

```javascript
// src/services/__tests__/SafetyService.test.js
describe('SafetyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('blockUser', () => {
    test('should call backend API', async () => {
      const mockResponse = { success: true, data: true };
      api.post = jest.fn().mockResolvedValue(mockResponse);

      const result = await SafetyService.blockUser('user123');

      expect(api.post).toHaveBeenCalledWith('/safety/block', { blockedUserId: 'user123' });
      expect(result).toBe(true);
    });

    test('should throw error on API failure', async () => {
      api.post = jest.fn().mockResolvedValue({ success: false, message: 'Error' });

      await expect(SafetyService.blockUser('user123')).rejects.toThrow();
    });
  });

  describe('shareDatePlan', () => {
    test('should call backend API with correct data', async () => {
      const mockResponse = { success: true, data: { datePlanId: 'plan123' } };
      api.post = jest.fn().mockResolvedValue(mockResponse);

      const datePlanData = {
        matchUserId: 'match123',
        matchName: 'John',
        location: 'Coffee Shop',
        dateTime: '2024-01-01T10:00:00Z',
      };

      const result = await SafetyService.shareDatePlan(datePlanData, ['friend1', 'friend2']);

      expect(api.post).toHaveBeenCalledWith(
        '/safety/date-plan',
        expect.objectContaining({
          matchUserId: 'match123',
          location: 'Coffee Shop',
          sharedWith: ['friend1', 'friend2'],
        })
      );
      expect(result.datePlanId).toBe('plan123');
    });
  });

  describe('sendEmergencySOS', () => {
    test('should call backend API with location', async () => {
      const mockResponse = { success: true, data: { sosAlertId: 'sos123' } };
      api.post = jest.fn().mockResolvedValue(mockResponse);

      const location = { latitude: 37.7749, longitude: -122.4194 };
      const result = await SafetyService.sendEmergencySOS(location, 'Help!');

      expect(api.post).toHaveBeenCalledWith(
        '/safety/sos',
        expect.objectContaining({
          latitude: 37.7749,
          longitude: -122.4194,
          message: 'Help!',
        })
      );
      expect(result.sosAlertId).toBe('sos123');
    });
  });
});
```

### Integration Tests

```javascript
// src/services/__tests__/SafetyService.integration.test.js
describe('SafetyService Integration', () => {
  test('should block user and verify on backend', async () => {
    // Create test user
    const user = await createTestUser();
    const blockedUser = await createTestUser();

    // Block user via frontend
    await SafetyService.blockUser(blockedUser.id);

    // Verify on backend
    const response = await api.get('/safety/blocked');
    expect(response.data.blockedUsers).toContain(blockedUser.id);
  });

  test('should share date plan and notify friends', async () => {
    const user = await createTestUser();
    const friend = await createTestUser();

    const datePlanData = {
      matchUserId: 'match123',
      matchName: 'John',
      location: 'Coffee Shop',
      dateTime: new Date().toISOString(),
    };

    await SafetyService.shareDatePlan(datePlanData, [friend.id]);

    // Verify friend received notification
    const notifications = await api.get('/notifications');
    expect(notifications.data.notifications).toContainEqual(
      expect.objectContaining({
        type: 'date_plan_shared',
        userId: friend.id,
      })
    );
  });
});
```

---

## DEPLOYMENT STRATEGY

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Code review completed
- [ ] Backend API endpoints verified
- [ ] Database migrations completed
- [ ] Monitoring configured
- [ ] Rollback plan prepared

### Deployment Steps

1. Deploy backend API changes first
2. Deploy frontend service changes
3. Monitor error rates and performance
4. Verify data consistency
5. Gradual rollout (5% → 25% → 50% → 100%)

### Rollback Plan

- If errors detected, revert to previous frontend version
- Verify data consistency
- Investigate root cause
- Deploy fix

---

## SUMMARY

| Service             | Current    | Target       | Effort     | Timeline    |
| ------------------- | ---------- | ------------ | ---------- | ----------- |
| SafetyService       | Hybrid     | API-only     | Medium     | 1 week      |
| SwipeService        | Firestore  | API-only     | Medium     | 1 week      |
| NotificationService | Firestore  | API-only     | Low        | 1 week      |
| **Total**           | **Hybrid** | **API-only** | **Medium** | **3 weeks** |

**Benefits:**

- ✅ Consistent data storage
- ✅ Server-side validation
- ✅ Audit trail for all operations
- ✅ No race conditions
- ✅ Scalable architecture
- ✅ Better security
- ✅ Compliance ready
