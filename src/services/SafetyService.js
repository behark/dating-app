import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import logger from '../utils/logger';

export class SafetyService {
  // Block/Unblock users
  static async blockUser(userId, blockedUserId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const blockedUsers = userDoc.data()?.blockedUsers || [];

      if (!blockedUsers.includes(blockedUserId)) {
        await updateDoc(userRef, {
          blockedUsers: [...blockedUsers, blockedUserId],
          updatedAt: new Date(),
        });
        logger.info('User blocked', { userId, blockedUserId });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error blocking user', error, { userId, blockedUserId });
      return false;
    }
  }

  static async unblockUser(userId, blockedUserId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const blockedUsers = userDoc.data()?.blockedUsers || [];

      const filtered = blockedUsers.filter((id) => id !== blockedUserId);
      await updateDoc(userRef, {
        blockedUsers: filtered,
        updatedAt: new Date(),
      });
      logger.info('User unblocked', { userId, blockedUserId });
      return true;
    } catch (error) {
      logger.error('Error unblocking user', error, { userId, blockedUserId });
      return false;
    }
  }

  static async getBlockedUsers(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.data()?.blockedUsers || [];
    } catch (error) {
      logger.error('Error getting blocked users', error, { userId });
      return [];
    }
  }

  static async isUserBlocked(userId, otherUserId) {
    try {
      const blockedUsers = await this.getBlockedUsers(userId);
      return blockedUsers.includes(otherUserId);
    } catch (error) {
      logger.error('Error checking if user is blocked', error, { userId, otherUserId });
      return false;
    }
  }

  // Report users for abuse
  static async reportUser(reporterId, reportedUserId, category, description, evidence = []) {
    try {
      const report = {
        reporterId,
        reportedUserId,
        category, // 'inappropriate_photos', 'fake_profile', 'harassment', 'scam', 'offensive_behavior', 'other'
        description,
        evidence, // array of evidence object IDs or descriptions
        status: 'pending', // 'pending', 'reviewed', 'action_taken', 'dismissed'
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'reports'), report);
      logger.info('Report created', { reportId: docRef.id, reporterId, reportedUserId, category });

      // Increment report count on user
      await updateDoc(doc(db, 'users', reportedUserId), {
        reportCount: (await getDoc(doc(db, 'users', reportedUserId))).data()?.reportCount + 1 || 1,
      });

      return { success: true, reportId: docRef.id };
    } catch (error) {
      logger.error('Error creating report', error, { reporterId, reportedUserId, category });
      return { success: false, error: error.message };
    }
  }

  static async getReportCategories() {
    return [
      { id: 'inappropriate_photos', label: '📸 Inappropriate Photos', color: '#FF6B6B' },
      { id: 'fake_profile', label: '👤 Fake Profile', color: '#FFD93D' },
      { id: 'harassment', label: '💬 Harassment/Abuse', color: '#6BCB77' },
      { id: 'scam', label: '⚠️ Scam', color: '#4D96FF' },
      { id: 'offensive_behavior', label: '😠 Offensive Behavior', color: '#FF6B9D' },
      { id: 'other', label: '📋 Other', color: '#9D84B7' },
    ];
  }

  // Photo verification
  static async submitPhotoVerification(userId, photoUri, livenessCheck = {}) {
    try {
      const verification = {
        userId,
        photoUri,
        livenessCheck: {
          timestamp: new Date(),
          detectionMethod: livenessCheck.method || 'basic', // 'basic', 'advanced'
          passed: livenessCheck.passed || false,
          ...livenessCheck,
        },
        status: 'pending', // 'pending', 'approved', 'rejected'
        submittedAt: new Date(),
        reviewedAt: null,
      };

      const docRef = await addDoc(collection(db, 'verifications'), verification);
      logger.info('Verification submitted', { verificationId: docRef.id, userId, method });

      return { success: true, verificationId: docRef.id };
    } catch (error) {
      logger.error('Error submitting verification', error, { userId, method });
      return { success: false, error: error.message };
    }
  }

  static async getPhotoVerificationStatus(userId) {
    try {
      const q = query(collection(db, 'verifications'), where('userId', '==', userId));
      const docs = await getDocs(q);

      if (docs.empty) {
        return { verified: false, status: 'not_submitted' };
      }

      const sortedDocs = docs.docs.sort((a, b) => {
        const aData = a.data();
        const bData = b.data();
        if (!aData || !bData) return 0;
        return (bData.submittedAt?.getTime?.() || 0) - (aData.submittedAt?.getTime?.() || 0);
      });
      const latestDoc = sortedDocs[0];
      if (!latestDoc) {
        return { verified: false, status: 'not_submitted' };
      }
      const latest = latestDoc.data();
      if (!latest) {
        return { verified: false, status: 'not_submitted' };
      }

      return {
        verified: latest.status === 'approved',
        status: latest.status,
        submittedAt: latest.submittedAt,
        reviewedAt: latest.reviewedAt,
      };
    } catch (error) {
      logger.error('Error getting verification status', error, { userId });
      return { verified: false, status: 'error' };
    }
  }

  // Content moderation flagging
  static async flagContent(userId, contentType, contentId, reason, description = '') {
    try {
      // contentType: 'message', 'profile_photo', 'bio', 'profile'
      const flag = {
        userId, // user flagging
        contentType,
        contentId,
        reason, // 'explicit', 'hateful', 'violent', 'misleading', 'spam'
        description,
        status: 'pending', // 'pending', 'reviewed', 'action_taken'
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'flags'), flag);
      logger.info('Content flagged', { flagId: docRef.id, userId, contentType, contentId, reason });

      return { success: true, flagId: docRef.id };
    } catch (error) {
      logger.error('Error flagging content', error, { userId, contentType, contentId, reason });
      return { success: false, error: error.message };
    }
  }

  static async getContentFlags(contentId) {
    try {
      const q = query(collection(db, 'flags'), where('contentId', '==', contentId));
      const docs = await getDocs(q);
      return docs.docs.map((doc) => {
        const docData = doc.data();
        return { id: doc.id, ...(docData || {}) };
      });
    } catch (error) {
      logger.error('Error getting content flags', error, { contentId });
      return [];
    }
  }

  // Safety check before allowing interaction
  static async canInteractWith(userId, targetUserId) {
    try {
      // Check if target has blocked user
      const targetBlockedUsers = await this.getBlockedUsers(targetUserId);
      if (targetBlockedUsers.includes(userId)) {
        return { allowed: false, reason: 'blocked_by_user' };
      }

      // Check if user has blocked target
      const userBlockedUsers = await this.getBlockedUsers(userId);
      if (userBlockedUsers.includes(targetUserId)) {
        return { allowed: false, reason: 'user_blocked_target' };
      }

      // Check if target is reported/suspended
      const targetDoc = await getDoc(doc(db, 'users', targetUserId));
      if (targetDoc.data()?.suspended) {
        return { allowed: false, reason: 'user_suspended' };
      }

      return { allowed: true };
    } catch (error) {
      logger.error('Error checking interaction', error, { userId, targetUserId });
      return { allowed: false, reason: 'error' };
    }
  }

  // Get safety tips
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
      {
        id: 2,
        title: 'Verify Before Meeting',
        category: 'verification',
        tips: [
          'Video call before meeting in person for the first time',
          'Ask for and verify photo authenticity',
          'Check their social media profiles if available',
          'Ask clarifying questions about their background',
          'Trust your instincts - if something feels off, it probably is',
        ],
        icon: '✅',
      },
      {
        id: 3,
        title: 'Safe First Meeting',
        category: 'meeting',
        tips: [
          'Always meet in a public place with good lighting',
          'Tell a friend where you are and who you are meeting',
          'Have an exit plan and means of transportation',
          'Keep your phone charged and accessible',
          'Trust your gut - cancel if you feel unsafe',
          'Avoid excessive alcohol on first dates',
        ],
        icon: '📍',
      },
      {
        id: 4,
        title: 'Online Interaction Safety',
        category: 'online',
        tips: [
          'Use the app for messaging - avoid giving phone numbers quickly',
          'Report suspicious behavior immediately',
          'Block users who make you uncomfortable',
          'Never share intimate photos with unverified users',
          'Be aware of romance scams and catfishing',
          'Verify unusual requests or stories',
        ],
        icon: '💬',
      },
      {
        id: 5,
        title: 'Red Flags to Watch For',
        category: 'warning',
        tips: [
          'Inconsistent stories or photos that look altered',
          'Pressure to move conversations off the app quickly',
          'Requests for money, gifts, or financial help',
          'Love bombing or moving too fast emotionally',
          'Resistance to video calls or meeting in person',
          'Asking for intimate photos early on',
          'Excessive compliments or flattery',
        ],
        icon: '⚠️',
      },
      {
        id: 6,
        title: 'If Something Goes Wrong',
        category: 'emergency',
        tips: [
          'Report the user immediately through the app',
          'Block the user to prevent further contact',
          'Save evidence of inappropriate behavior',
          'Contact local authorities if threatened',
          'Reach out to trusted friends or family',
          'Consider counseling if you experience trauma',
          'File a police report for serious crimes',
        ],
        icon: '🚨',
      },
    ];
  }

  static getSafetyTipsByCategory(category) {
    const allTips = this.getSafetyTips();
    return allTips.filter((tip) => tip.category === category);
  }

  // User safety score (for moderation team)
  static async calculateSafetyScore(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        return null;
      }
      const user = userDoc.data();
      if (!user) {
        return null;
      }

      let score = 100; // Start with perfect score

      // Deduct points for various risk factors
      if (user?.suspended) score -= 100; // Suspended users
      if (user?.reportCount && user.reportCount > 0) score -= Math.min(10 * user.reportCount, 50);
      if (!user?.emailVerified) score -= 10;
      if (!user?.phoneVerified) score -= 5;
      if (!user?.photoVerified) score -= 15;
      if (user?.blockedCount && user.blockedCount > 0) score -= Math.min(5 * user.blockedCount, 20);

      return Math.max(0, Math.min(100, score));
    } catch (error) {
      logger.error('Error calculating safety score', error, { userId });
      return null;
    }
  }

  // ============================================================
  // ADVANCED SAFETY FEATURES (AI/ML & Safety Tier 2)
  // ============================================================

  /**
   * Share date plans with friends
   * User can share their date plans with selected friends for safety
   */
  static async shareDatePlan(userId, datePlanData, friendIds = []) {
    try {
      const datePlan = {
        userId,
        matchUserId: datePlanData.matchUserId,
        matchName: datePlanData.matchName,
        matchPhotoUrl: datePlanData.matchPhotoUrl,
        location: datePlanData.location,
        address: datePlanData.address,
        coordinates: datePlanData.coordinates, // { latitude, longitude }
        dateTime: datePlanData.dateTime, // ISO string
        notes: datePlanData.notes || '',
        sharedWith: friendIds,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        status: 'active', // 'active', 'completed', 'cancelled'
      };

      const docRef = await addDoc(collection(db, 'datePlans'), datePlan);
      logger.info('Date plan shared', { datePlanId: docRef.id, userId, matchUserId: datePlanData.matchUserId });

      // Notify friends that plan was shared
      for (const friendId of friendIds) {
        await this.createNotification(friendId, {
          type: 'date_plan_shared',
          title: 'Date Plan Shared',
          message: `${datePlan.matchName} shared their date plan at ${datePlan.location}`,
          data: {
            datePlanId: docRef.id,
            userId,
            matchUserId: datePlanData.matchUserId,
          },
        });
      }

      return { success: true, datePlanId: docRef.id };
    } catch (error) {
      logger.error('Error sharing date plan', error, { userId, matchUserId: datePlanData.matchUserId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's active date plans
   */
  static async getActiveDatePlans(userId) {
    try {
      const q = query(
        collection(db, 'datePlans'),
        where('userId', '==', userId),
        where('status', '==', 'active')
      );
      const docs = await getDocs(q);

      return docs.docs.map((doc) => {
        const docData = doc.data();
        if (!docData) {
          return null;
        }
        return {
          id: doc.id,
          ...docData,
          dateTime: docData.dateTime?.toDate?.() || new Date(docData.dateTime),
        };
      }).filter(Boolean);
    } catch (error) {
      logger.error('Error getting date plans', error, { userId });
      return [];
    }
  }

  /**
   * Get date plans shared with user
   */
  static async getSharedDatePlans(userId) {
    try {
      const q = query(collection(db, 'datePlans'), where('sharedWith', 'array-contains', userId));
      const docs = await getDocs(q);

      return docs.docs.map((doc) => {
        const docData = doc.data();
        if (!docData) {
          return null;
        }
        return {
          id: doc.id,
          ...docData,
          dateTime: docData.dateTime?.toDate?.() || new Date(docData.dateTime),
        };
      }).filter(Boolean);
    } catch (error) {
      logger.error('Error getting shared date plans', error, { userId });
      return [];
    }
  }

  /**
   * Update date plan status
   */
  static async updateDatePlanStatus(datePlanId, status) {
    try {
      await updateDoc(doc(db, 'datePlans', datePlanId), {
        status, // 'active', 'completed', 'cancelled'
        updatedAt: new Date(),
      });
      return { success: true };
    } catch (error) {
      logger.error('Error updating date plan', error, { datePlanId, status });
      return { success: false, error: error.message };
    }
  }

  /**
   * Check-in Timer & Notifications
   * User checks in when they arrive/leave, friends are notified
   */
  static async startCheckInTimer(userId, datePlanId, duration = 300000) {
    // Default 5 minutes
    try {
      const checkIn = {
        userId,
        datePlanId,
        status: 'active', // 'active', 'checked_in', 'expired'
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + duration),
        alertSent: false,
      };

      const docRef = await addDoc(collection(db, 'checkIns'), checkIn);
      logger.info('Check-in timer started', { checkInId: docRef.id, userId, datePlanId, duration });

      return { success: true, checkInId: docRef.id };
    } catch (error) {
      logger.error('Error starting check-in timer', error, { userId, datePlanId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Complete check-in (user confirms they're safe)
   */
  static async completeCheckIn(checkInId) {
    try {
      await updateDoc(doc(db, 'checkIns', checkInId), {
        status: 'checked_in',
        checkedInAt: new Date(),
      });

      // Get the check-in details to notify friends
      const checkInDoc = await getDoc(doc(db, 'checkIns', checkInId));
      if (!checkInDoc.exists()) {
        return { success: false, error: 'Check-in not found' };
      }
      const checkInData = checkInDoc.data();
      if (!checkInData) {
        return { success: false, error: 'Check-in data not found' };
      }

      // Get the date plan to find who to notify
      const datePlanDoc = await getDoc(doc(db, 'datePlans', checkInData.datePlanId));
      if (!datePlanDoc.exists()) {
        return { success: false, error: 'Date plan not found' };
      }
      const datePlanData = datePlanDoc.data();
      if (!datePlanData) {
        return { success: false, error: 'Date plan data not found' };
      }

      // Notify all friends that user checked in
      for (const friendId of datePlanData.sharedWith) {
        await this.createNotification(friendId, {
          type: 'check_in_complete',
          title: 'Safe Check-in Received',
          message: 'Your friend checked in and is safe',
          data: { userId: checkInData.userId },
        });
      }

      return { success: true };
    } catch (error) {
      logger.error('Error completing check-in', error, { checkInId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get active check-ins for user
   */
  static async getActiveCheckIns(userId) {
    try {
      const q = query(
        collection(db, 'checkIns'),
        where('userId', '==', userId),
        where('status', 'in', ['active', 'expired'])
      );
      const docs = await getDocs(q);
      return docs.docs.map((doc) => {
        const docData = doc.data();
        return { id: doc.id, ...(docData || {}) };
      });
    } catch (error) {
      logger.error('Error getting check-ins', error, { userId });
      return [];
    }
  }

  /**
   * Emergency SOS Button
   * User can send emergency alert to friends and emergency contacts
   */
  static async sendEmergencySOS(userId, location = {}, emergencyMessage = '') {
    try {
      const sosAlert = {
        userId,
        type: 'sos',
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address || '',
          timestamp: new Date(),
        },
        message: emergencyMessage,
        severity: 'critical',
        status: 'active', // 'active', 'resolved', 'false_alarm'
        respondedBy: [],
        responses: [],
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      const docRef = await addDoc(collection(db, 'emergencyAlerts'), sosAlert);
      logger.info('SOS alert created', { sosAlertId: docRef.id, userId, location });

      // Get user's emergency contacts
      const userDoc = await getDoc(doc(db, 'users', userId));
      const emergencyContacts = userDoc.data()?.emergencyContacts || [];
      const trustedFriends = userDoc.data()?.trustedFriends || [];

      // Combine all recipients
      const allRecipients = [...new Set([...emergencyContacts, ...trustedFriends])];

      // Send immediate notifications
      for (const recipientId of allRecipients) {
        await this.createNotification(recipientId, {
          type: 'emergency_sos',
          title: '🚨 EMERGENCY SOS',
          message: 'Your friend sent an emergency SOS',
          data: {
            sosAlertId: docRef.id,
            userId,
            location: sosAlert.location,
            message: sosAlert.message,
          },
          priority: 'high',
        });
      }

      // Log the emergency event
      await addDoc(collection(db, 'securityEvents'), {
        userId,
        type: 'sos_triggered',
        timestamp: new Date(),
        location: sosAlert.location,
        details: { sosAlertId: docRef.id },
      });

      return { success: true, sosAlertId: docRef.id };
    } catch (error) {
      logger.error('Error sending SOS', error, { userId, location });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get active SOS alerts
   */
  static async getActiveSOS(userId) {
    try {
      const q = query(
        collection(db, 'emergencyAlerts'),
        where('userId', '==', userId),
        where('status', '==', 'active')
      );
      const docs = await getDocs(q);
      return docs.docs.map((doc) => {
        const docData = doc.data();
        return { id: doc.id, ...(docData || {}) };
      });
    } catch (error) {
      logger.error('Error getting SOS alerts', error, { userId });
      return [];
    }
  }

  /**
   * Respond to SOS alert
   */
  static async respondToSOS(sosAlertId, responderId, response = {}) {
    try {
      const sosRef = doc(db, 'emergencyAlerts', sosAlertId);
      const sosDoc = await getDoc(sosRef);
      const currentResponses = sosDoc.data()?.responses || [];
      const respondedBy = sosDoc.data()?.respondedBy || [];

      const newResponse = {
        responderId,
        message: response.message || '',
        confirmedSafe: response.confirmedSafe || false,
        timestamp: new Date(),
        contactInfo: response.contactInfo || '',
      };

      await updateDoc(sosRef, {
        responses: [...currentResponses, newResponse],
        respondedBy: [...respondedBy, responderId],
      });

      // Notify the user who sent SOS
      const sosData = sosDoc.data();
      if (!sosData) {
        return { success: false, error: 'SOS data not found' };
      }
      await this.createNotification(sosData.userId, {
        type: 'sos_response',
        title: 'Emergency Response Received',
        message: `${responderId} has responded to your SOS`,
        data: { sosAlertId },
      });

      return { success: true };
    } catch (error) {
      logger.error('Error responding to SOS', error, { sosAlertId, responderId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Resolve SOS alert
   */
  static async resolveSOS(sosAlertId, status = 'resolved') {
    try {
      await updateDoc(doc(db, 'emergencyAlerts', sosAlertId), {
        status, // 'resolved' or 'false_alarm'
        resolvedAt: new Date(),
      });
      return { success: true };
    } catch (error) {
      logger.error('Error resolving SOS', error, { sosAlertId, status });
      return { success: false, error: error.message };
    }
  }

  /**
   * Background Check Integration
   * Initiate background check for user (premium feature)
   * This would integrate with third-party service like Checkr or Instamotor
   */
  static async initiateBackgroundCheck(userId, userInfo = {}) {
    try {
      const backgroundCheckRequest = {
        userId,
        status: 'pending', // 'pending', 'in_progress', 'completed', 'failed'
        userInfo: {
          firstName: userInfo.firstName || '',
          lastName: userInfo.lastName || '',
          dateOfBirth: userInfo.dateOfBirth || '',
          email: userInfo.email || '',
          phone: userInfo.phone || '',
          address: userInfo.address || '',
          ...userInfo,
        },
        checks: {
          criminalRecord: false,
          sexOffenderRegistry: false,
          addressHistory: false,
          identityVerification: false,
        },
        results: {},
        requestedAt: new Date(),
        completedAt: null,
        externalServiceId: null,
        externalStatus: null,
      };

      const docRef = await addDoc(collection(db, 'backgroundChecks'), backgroundCheckRequest);
      logger.info('Background check requested', { backgroundCheckId: docRef.id, userId });

      return { success: true, backgroundCheckId: docRef.id };
    } catch (error) {
      logger.error('Error initiating background check', error, { userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get background check status
   */
  static async getBackgroundCheckStatus(userId) {
    try {
      const q = query(collection(db, 'backgroundChecks'), where('userId', '==', userId));
      const docs = await getDocs(q);

      if (docs.empty) {
        return { completed: false, status: 'not_initiated' };
      }

      const sortedDocs = docs.docs.sort((a, b) => {
        const aData = a.data();
        const bData = b.data();
        if (!aData || !bData) return 0;
        return (bData.requestedAt?.getTime?.() || 0) - (aData.requestedAt?.getTime?.() || 0);
      });
      const latestDoc = sortedDocs[0];
      if (!latestDoc) {
        return { completed: false, status: 'not_initiated' };
      }
      const latest = latestDoc.data();
      if (!latest) {
        return { completed: false, status: 'not_initiated' };
      }

      return {
        completed: latest.status === 'completed',
        status: latest.status,
        results: latest.results,
        requestedAt: latest.requestedAt,
        completedAt: latest.completedAt,
      };
    } catch (error) {
      logger.error('Error getting background check status', error, { userId });
      return { completed: false, status: 'error' };
    }
  }

  /**
   * Update background check with external service results
   */
  static async updateBackgroundCheckResults(backgroundCheckId, results = {}) {
    try {
      await updateDoc(doc(db, 'backgroundChecks', backgroundCheckId), {
        status: 'completed',
        results,
        completedAt: new Date(),
      });
      return { success: true };
    } catch (error) {
      logger.error('Error updating background check', error, { backgroundCheckId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Advanced Photo Verification with Liveness Detection
   */
  static async submitAdvancedPhotoVerification(userId, photoUri, livenessData = {}) {
    try {
      const verification = {
        userId,
        type: 'liveness_detection',
        photoUri,
        livenessChecks: {
          method: livenessData.method || 'advanced', // 'basic', 'advanced', 'ai_powered'
          timestamp: new Date(),
          faceDetected: livenessData.faceDetected || false,
          livenessPassed: livenessData.livenessPassed || false,
          confidence: livenessData.confidence || 0,
          challenges: livenessData.challenges || [], // e.g., ['blink', 'smile', 'turn_head']
          completedChallenges: livenessData.completedChallenges || [],
        },
        status: 'pending', // 'pending', 'approved', 'rejected'
        submittedAt: new Date(),
        reviewedAt: null,
        aiAnalysis: {
          faceQuality: livenessData.faceQuality || 0,
          imageQuality: livenessData.imageQuality || 0,
          spoofingRisk: livenessData.spoofingRisk || 'low', // 'low', 'medium', 'high'
          matchWithProfilePhoto: livenessData.matchWithProfilePhoto || 0,
        },
      };

      const docRef = await addDoc(collection(db, 'advancedVerifications'), verification);
      logger.info('Advanced verification submitted', { verificationId: docRef.id, userId, type: verification.type });

      return { success: true, verificationId: docRef.id };
    } catch (error) {
      logger.error('Error submitting advanced verification', error, { userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get emergency contacts list
   */
  static async getEmergencyContacts(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.data()?.emergencyContacts || [];
    } catch (error) {
      logger.error('Error getting emergency contacts', error, { userId });
      return [];
    }
  }

  /**
   * Add emergency contact
   */
  static async addEmergencyContact(userId, contactInfo) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const emergencyContacts = userDoc.data()?.emergencyContacts || [];

      const newContact = {
        id: Date.now(),
        name: contactInfo.name,
        phone: contactInfo.phone,
        relationship: contactInfo.relationship,
        addedAt: new Date(),
      };

      await updateDoc(userRef, {
        emergencyContacts: [...emergencyContacts, newContact],
      });

      return { success: true, contact: newContact };
    } catch (error) {
      logger.error('Error adding emergency contact', error, { userId, contactInfo });
      return { success: false, error: error.message };
    }
  }

  /**
   * Helper function to create notifications
   */
  static async createNotification(userId, notificationData) {
    try {
      const notification = {
        userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || {},
        priority: notificationData.priority || 'normal',
        read: false,
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'notifications'), notification);
    } catch (error) {
      logger.error('Error creating notification', error, { userId, type: notificationData.type });
    }
  }

  // Validation
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

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateDatePlan(datePlan) {
    const errors = [];

    if (!datePlan.location || datePlan.location.trim() === '') {
      errors.push('Location is required');
    }

    if (!datePlan.dateTime) {
      errors.push('Date and time are required');
    }

    if (new Date(datePlan.dateTime) < new Date()) {
      errors.push('Date must be in the future');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateEmergencyContact(contact) {
    const errors = [];

    if (!contact.name || contact.name.trim() === '') {
      errors.push('Contact name is required');
    }

    if (!contact.phone || !/^\d{10}/.test(contact.phone.replace(/\D/g, ''))) {
      errors.push('Valid phone number is required');
    }

    if (!contact.relationship || contact.relationship.trim() === '') {
      errors.push('Relationship is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
