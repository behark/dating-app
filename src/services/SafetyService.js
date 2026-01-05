import { Colors } from '../constants/colors';
import logger from '../utils/logger';
import api from './api';

export class SafetyService {
  // Block/Unblock users
  static async blockUser(blockedUserId) {
    try {
      const response = await api.post('/safety/block', { blockedUserId });
      
      if (!response.success) {
        logger.error('Error blocking user', new Error(response.message), { blockedUserId });
        return false;
      }
      
      logger.info('User blocked', { blockedUserId });
      return response.data || false;
    } catch (error) {
      logger.error('Error blocking user', error, { blockedUserId });
      return false;
    }
  }

  static async unblockUser(blockedUserId) {
    try {
      const response = await api.delete(`/safety/block/${blockedUserId}`);
      
      if (!response.success) {
        logger.error('Error unblocking user', new Error(response.message), { blockedUserId });
        return false;
      }
      
      logger.info('User unblocked', { blockedUserId });
      return true;
    } catch (error) {
      logger.error('Error unblocking user', error, { blockedUserId });
      return false;
    }
  }

  static async getBlockedUsers() {
    try {
      const response = await api.get('/safety/blocked');
      
      if (!response.success) {
        logger.error('Error getting blocked users', new Error(response.message));
        return [];
      }
      
      // Backend returns { success: true, blockedUsers: [...], count: number }
      return response.blockedUsers || response.data?.blockedUsers || [];
    } catch (error) {
      logger.error('Error getting blocked users', error);
      return [];
    }
  }

  static async isUserBlocked(otherUserId) {
    try {
      const response = await api.get(`/safety/blocked/${otherUserId}`);
      
      if (!response.success) {
        logger.error('Error checking if user is blocked', new Error(response.message));
        return false;
      }
      
      // Backend returns { success: true, userHasBlocked: boolean, blockedByOther: boolean, canInteract: boolean }
      return response.userHasBlocked || response.data?.userHasBlocked || false;
    } catch (error) {
      logger.error('Error checking if user is blocked', error, { otherUserId });
      return false;
    }
  }

  // Report users for abuse
  static async reportUser(reportedUserId, category, description, evidence = []) {
    try {
      const response = await api.post('/safety/report', {
        reportedUserId,
        category, // 'inappropriate_photos', 'fake_profile', 'harassment', 'scam', 'offensive_behavior', 'other'
        description,
        evidence, // array of evidence object IDs or descriptions
      });

      if (!response.success) {
        logger.error('Error creating report', new Error(response.message), { reportedUserId, category });
        return { success: false, error: response.message || 'Failed to create report' };
      }

      logger.info('Report created', { 
        reportId: response.data?.reportId, 
        reportedUserId, 
        category 
      });

      return response.data || { success: true, reportId: response.data?.reportId };
    } catch (error) {
      logger.error('Error creating report', error, { reportedUserId, category });
      return { success: false, error: error.message };
    }
  }

  static async getReportCategories() {
    return [
      { id: 'inappropriate_photos', label: '📸 Inappropriate Photos', color: Colors.accent.red },
      { id: 'fake_profile', label: '👤 Fake Profile', color: '#FFD93D' },
      { id: 'harassment', label: '💬 Harassment/Abuse', color: '#6BCB77' },
      { id: 'scam', label: '⚠️ Scam', color: '#4D96FF' },
      { id: 'offensive_behavior', label: '😠 Offensive Behavior', color: Colors.accent.pink },
      { id: 'other', label: '📋 Other', color: '#9D84B7' },
    ];
  }

  // Photo verification
  // Note: Basic photo verification should use the advanced endpoint or profile verification endpoint
  // For now, redirecting to advanced verification
  static async submitPhotoVerification(photoUri, livenessCheck = {}) {
    try {
      // Use advanced photo verification endpoint for all verification types
      return await this.submitAdvancedPhotoVerification(photoUri, {
        method: livenessCheck.method || 'basic',
        faceDetected: livenessCheck.passed || false,
        livenessPassed: livenessCheck.passed || false,
        confidence: livenessCheck.confidence || 0,
        ...livenessCheck,
      });
    } catch (error) {
      logger.error('Error submitting photo verification', error);
      return { success: false, error: error.message || 'Failed to submit verification' };
    }
  }

  static async getPhotoVerificationStatus() {
    try {
      // TODO: Add backend endpoint GET /api/safety/photo-verification/status
      // For now, return not_submitted since we can't query without backend endpoint
      logger.warn('getPhotoVerificationStatus: Backend endpoint not available');
      return { verified: false, status: 'not_submitted' };
    } catch (error) {
      logger.error('Error getting verification status', error);
      return { verified: false, status: 'error' };
    }
  }

  // Content moderation flagging
  static async flagContent(contentType, contentId, reason, description = '') {
    try {
      // contentType: 'message', 'profile_photo', 'bio', 'profile'
      // reason: 'explicit', 'hateful', 'violent', 'misleading', 'spam'
      const response = await api.post('/safety/flag', {
        contentType,
        contentId,
        reason,
        description,
      });

      if (!response.success) {
        logger.error('Error flagging content', new Error(response.message), {
          contentType,
          contentId,
          reason,
        });
        return { success: false, error: response.message || 'Failed to flag content' };
      }

      logger.info('Content flagged', {
        flagId: response.data?.flagId || response.flag?.id,
        contentType,
        contentId,
        reason,
      });

      return {
        success: true,
        flagId: response.data?.flagId || response.flag?.id,
      };
    } catch (error) {
      logger.error('Error flagging content', error, { contentType, contentId, reason });
      return { success: false, error: error.message || 'Failed to flag content' };
    }
  }

  static async getContentFlags(contentId) {
    try {
      // Note: Backend doesn't have a GET endpoint for content flags yet
      // This would need to be added to the backend or handled differently
      logger.warn('getContentFlags: Backend endpoint not available, returning empty array');
      return [];
    } catch (error) {
      logger.error('Error getting content flags', error, { contentId });
      return [];
    }
  }

  // Safety check before allowing interaction
  static async canInteractWith(targetUserId) {
    try {
      // Use the backend endpoint to check block status
      const response = await api.get(`/safety/blocked/${targetUserId}`);
      
      if (!response.success) {
        logger.error('Error checking interaction', new Error(response.message), { targetUserId });
        return { allowed: false, reason: 'error' };
      }

      // Backend returns: { success: true, userHasBlocked: boolean, blockedByOther: boolean, canInteract: boolean }
      const canInteract = response.canInteract || response.data?.canInteract || false;
      
      if (!canInteract) {
        let reason = 'unknown';
        if (response.userHasBlocked || response.data?.userHasBlocked) {
          reason = 'user_blocked_target';
        } else if (response.blockedByOther || response.data?.blockedByOther) {
          reason = 'blocked_by_user';
        }
        return { allowed: false, reason };
      }

      return { allowed: true };
    } catch (error) {
      logger.error('Error checking interaction', error, { targetUserId });
      return { allowed: false, reason: 'error' };
    }
  }

  // Get safety tips
  static async getSafetyTips() {
    try {
      const response = await api.get('/safety/tips');
      
      if (!response.success) {
        logger.error('Error getting safety tips', new Error(response.message));
        // Return fallback tips if API fails
        return this.getFallbackSafetyTips();
      }
      
      // Backend returns: { success: true, count: number, data: [...] }
      return response.data || response.tips || [];
    } catch (error) {
      logger.error('Error getting safety tips', error);
      // Return fallback tips on error
      return this.getFallbackSafetyTips();
    }
  }

  // Fallback safety tips (used if API fails)
  static getFallbackSafetyTips() {
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

  static async getSafetyTipsByCategory(category) {
    try {
      const allTips = await this.getSafetyTips();
      return allTips.filter((tip) => tip.category === category);
    } catch (error) {
      logger.error('Error getting safety tips by category', error, { category });
      return [];
    }
  }

  // User safety score (for moderation team - admin only)
  static async calculateSafetyScore(userId) {
    try {
      const response = await api.get(`/safety/safety-score/${userId}`);
      
      if (!response.success) {
        logger.error('Error getting safety score', new Error(response.message), { userId });
        return null;
      }
      
      // Backend returns: { success: true, userId, safetyScore, riskFactors }
      return response.safetyScore || response.data?.safetyScore || null;
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
  static async shareDatePlan(datePlanData, friendIds = []) {
    try {
      const response = await api.post('/safety/date-plan', {
        matchUserId: datePlanData.matchUserId,
        matchName: datePlanData.matchName,
        matchPhotoUrl: datePlanData.matchPhotoUrl,
        location: datePlanData.location,
        address: datePlanData.address,
        coordinates: datePlanData.coordinates, // { latitude, longitude }
        dateTime: datePlanData.dateTime, // ISO string
        notes: datePlanData.notes || '',
        friendIds,
      });

      if (!response.success) {
        logger.error('Error sharing date plan', new Error(response.message), {
          matchUserId: datePlanData.matchUserId,
        });
        return { success: false, error: response.message || 'Failed to share date plan' };
      }

      const datePlanId = response.data?.datePlanId || response.data?.datePlan?.id;
      logger.info('Date plan shared', {
        datePlanId,
        matchUserId: datePlanData.matchUserId,
      });

      return { success: true, datePlanId };
    } catch (error) {
      logger.error('Error sharing date plan', error, {
        matchUserId: datePlanData.matchUserId,
      });
      return { success: false, error: error.message || 'Failed to share date plan' };
    }
  }

  /**
   * Get user's active date plans
   */
  static async getActiveDatePlans() {
    try {
      const response = await api.get('/safety/date-plans/active');
      
      if (!response.success) {
        logger.error('Error getting active date plans', new Error(response.message));
        return [];
      }
      
      // Backend returns: { success: true, data: [...] }
      return response.data || [];
    } catch (error) {
      logger.error('Error getting date plans', error);
      return [];
    }
  }

  /**
   * Get date plans shared with user
   * Note: Backend doesn't have this endpoint yet - would need to be added
   */
  static async getSharedDatePlans() {
    try {
      // TODO: Add backend endpoint GET /api/safety/date-plans/shared
      logger.warn('getSharedDatePlans: Backend endpoint not available, returning empty array');
      return [];
    } catch (error) {
      logger.error('Error getting shared date plans', error);
      return [];
    }
  }

  /**
   * Update date plan status
   * Note: Backend doesn't have this endpoint yet - would need to be added
   */
  static async updateDatePlanStatus(datePlanId, status) {
    try {
      // TODO: Add backend endpoint PUT /api/safety/date-plan/:datePlanId
      logger.warn('updateDatePlanStatus: Backend endpoint not available');
      return { success: false, error: 'Backend endpoint not implemented' };
    } catch (error) {
      logger.error('Error updating date plan', error, { datePlanId, status });
      return { success: false, error: error.message };
    }
  }

  /**
   * Check-in Timer & Notifications
   * User checks in when they arrive/leave, friends are notified
   */
  static async startCheckInTimer(datePlanId, duration = 300) {
    // Duration in minutes (default 5 minutes = 300)
    try {
      const response = await api.post('/safety/checkin/start', {
        datePlanId,
        duration, // Duration in minutes
      });

      if (!response.success) {
        logger.error('Error starting check-in timer', new Error(response.message), { datePlanId });
        return { success: false, error: response.message || 'Failed to start check-in' };
      }

      const checkInId = response.data?.checkInId || response.data?.checkIn?.id;
      logger.info('Check-in timer started', { checkInId, datePlanId, duration });

      return { success: true, checkInId };
    } catch (error) {
      logger.error('Error starting check-in timer', error, { datePlanId });
      return { success: false, error: error.message || 'Failed to start check-in' };
    }
  }

  /**
   * Complete check-in (user confirms they're safe)
   */
  static async completeCheckIn(checkInId) {
    try {
      const response = await api.post(`/safety/checkin/${checkInId}/complete`);

      if (!response.success) {
        logger.error('Error completing check-in', new Error(response.message), { checkInId });
        return { success: false, error: response.message || 'Failed to complete check-in' };
      }

      logger.info('Check-in completed', { checkInId });
      return { success: true };
    } catch (error) {
      logger.error('Error completing check-in', error, { checkInId });
      return { success: false, error: error.message || 'Failed to complete check-in' };
    }
  }

  /**
   * Get active check-ins for user
   * Note: Backend doesn't have this endpoint yet - would need to be added
   */
  static async getActiveCheckIns() {
    try {
      // TODO: Add backend endpoint GET /api/safety/checkin/active
      logger.warn('getActiveCheckIns: Backend endpoint not available, returning empty array');
      return [];
    } catch (error) {
      logger.error('Error getting check-ins', error);
      return [];
    }
  }

  /**
   * Emergency SOS Button
   * User can send emergency alert to friends and emergency contacts
   */
  static async sendEmergencySOS(location = {}, emergencyMessage = '') {
    try {
      const response = await api.post('/safety/sos', {
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address || '',
        },
        message: emergencyMessage,
      });

      if (!response.success) {
        logger.error('Error sending SOS', new Error(response.message), { location });
        return { success: false, error: response.message || 'Failed to send SOS' };
      }

      const sosAlertId = response.data?.sosAlertId || response.data?.sosAlert?.id;
      logger.info('SOS alert created', { sosAlertId, location });

      return { success: true, sosAlertId };
    } catch (error) {
      logger.error('Error sending SOS', error, { location });
      return { success: false, error: error.message || 'Failed to send SOS' };
    }
  }

  /**
   * Get active SOS alerts
   */
  static async getActiveSOS() {
    try {
      const response = await api.get('/safety/sos/active');
      
      if (!response.success) {
        logger.error('Error getting active SOS', new Error(response.message));
        return [];
      }
      
      // Backend returns: { success: true, data: [...] }
      return response.data || [];
    } catch (error) {
      logger.error('Error getting SOS alerts', error);
      return [];
    }
  }

  /**
   * Respond to SOS alert
   */
  static async respondToSOS(sosAlertId, response = {}) {
    try {
      const apiResponse = await api.post(`/safety/sos/${sosAlertId}/respond`, {
        message: response.message || '',
        confirmedSafe: response.confirmedSafe || false,
        contactInfo: response.contactInfo || '',
      });

      if (!apiResponse.success) {
        logger.error('Error responding to SOS', new Error(apiResponse.message), { sosAlertId });
        return { success: false, error: apiResponse.message || 'Failed to respond to SOS' };
      }

      logger.info('SOS response recorded', { sosAlertId });
      return { success: true };
    } catch (error) {
      logger.error('Error responding to SOS', error, { sosAlertId });
      return { success: false, error: error.message || 'Failed to respond to SOS' };
    }
  }

  /**
   * Resolve SOS alert
   */
  static async resolveSOS(sosAlertId, status = 'resolved') {
    try {
      const response = await api.put(`/safety/sos/${sosAlertId}/resolve`, {
        status, // 'resolved' or 'false_alarm'
      });

      if (!response.success) {
        logger.error('Error resolving SOS', new Error(response.message), { sosAlertId, status });
        return { success: false, error: response.message || 'Failed to resolve SOS' };
      }

      logger.info('SOS alert resolved', { sosAlertId, status });
      return { success: true };
    } catch (error) {
      logger.error('Error resolving SOS', error, { sosAlertId, status });
      return { success: false, error: error.message || 'Failed to resolve SOS' };
    }
  }

  /**
   * Background Check Integration
   * Initiate background check for user (premium feature)
   * This would integrate with third-party service like Checkr or Instamotor
   */
  static async initiateBackgroundCheck(userInfo = {}) {
    try {
      const response = await api.post('/safety/background-check', {
        userInfo: {
          firstName: userInfo.firstName || '',
          lastName: userInfo.lastName || '',
          dateOfBirth: userInfo.dateOfBirth || '',
          email: userInfo.email || '',
          phone: userInfo.phone || '',
          address: userInfo.address || '',
          ...userInfo,
        },
      });

      if (!response.success) {
        logger.error('Error initiating background check', new Error(response.message), { userInfo });
        return { success: false, error: response.message || 'Failed to initiate background check' };
      }

      const backgroundCheckId = response.data?.backgroundCheckId || response.data?.backgroundCheck?.id;
      logger.info('Background check requested', { backgroundCheckId });

      return { success: true, backgroundCheckId };
    } catch (error) {
      logger.error('Error initiating background check', error, { userInfo });
      return { success: false, error: error.message || 'Failed to initiate background check' };
    }
  }

  /**
   * Get background check status
   */
  static async getBackgroundCheckStatus(backgroundCheckId) {
    try {
      const response = await api.get(`/safety/background-check/${backgroundCheckId}`);
      
      if (!response.success) {
        logger.error('Error getting background check status', new Error(response.message), {
          backgroundCheckId,
        });
        return { completed: false, status: 'error' };
      }

      const statusData = response.data || response;
      return {
        completed: statusData.status === 'completed',
        status: statusData.status || 'not_initiated',
        results: statusData.results || {},
        checks: statusData.checks || {},
        requestedAt: statusData.requestedAt,
        completedAt: statusData.completedAt,
        estimatedCompletion: statusData.estimatedCompletion,
      };
    } catch (error) {
      logger.error('Error getting background check status', error, { backgroundCheckId });
      return { completed: false, status: 'error' };
    }
  }

  /**
   * Update background check with external service results
   * Note: This is typically an admin/internal operation, backend may not expose this endpoint
   */
  static async updateBackgroundCheckResults(backgroundCheckId, results = {}) {
    try {
      // TODO: Add backend endpoint PUT /api/safety/background-check/:backgroundCheckId
      // This is typically an admin operation, may not be exposed to frontend
      logger.warn('updateBackgroundCheckResults: Backend endpoint not available for frontend');
      return { success: false, error: 'This operation is not available from the frontend' };
    } catch (error) {
      logger.error('Error updating background check', error, { backgroundCheckId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Advanced Photo Verification with Liveness Detection
   */
  static async submitAdvancedPhotoVerification(photoUri, livenessData = {}) {
    try {
      const response = await api.post('/safety/photo-verification/advanced', {
        photoUri,
        livenessData: {
          method: livenessData.method || 'advanced', // 'basic', 'advanced', 'ai_powered'
          faceDetected: livenessData.faceDetected || false,
          livenessPassed: livenessData.livenessPassed || false,
          confidence: livenessData.confidence || 0,
          challenges: livenessData.challenges || [], // e.g., ['blink', 'smile', 'turn_head']
          completedChallenges: livenessData.completedChallenges || [],
          faceQuality: livenessData.faceQuality || 0,
          imageQuality: livenessData.imageQuality || 0,
          spoofingRisk: livenessData.spoofingRisk || 'low', // 'low', 'medium', 'high'
          matchWithProfilePhoto: livenessData.matchWithProfilePhoto || 0,
        },
      });

      if (!response.success) {
        logger.error('Error submitting advanced verification', new Error(response.message));
        return { success: false, error: response.message || 'Failed to submit verification' };
      }

      const verificationId = response.data?.verificationId || response.data?.verification?.id;
      logger.info('Advanced verification submitted', {
        verificationId,
        type: 'liveness_detection',
      });

      return { success: true, verificationId };
    } catch (error) {
      logger.error('Error submitting advanced verification', error);
      return { success: false, error: error.message || 'Failed to submit verification' };
    }
  }

  /**
   * Get emergency contacts list
   */
  static async getEmergencyContacts() {
    try {
      const response = await api.get('/safety/emergency-contacts');
      
      if (!response.success) {
        logger.error('Error getting emergency contacts', new Error(response.message));
        return [];
      }
      
      // Backend returns: { success: true, data: [...] }
      return response.data || [];
    } catch (error) {
      logger.error('Error getting emergency contacts', error);
      return [];
    }
  }

  /**
   * Add emergency contact
   */
  static async addEmergencyContact(contactInfo) {
    try {
      const response = await api.post('/safety/emergency-contact', {
        name: contactInfo.name,
        phone: contactInfo.phone,
        relationship: contactInfo.relationship,
      });

      if (!response.success) {
        logger.error('Error adding emergency contact', new Error(response.message), { contactInfo });
        return { success: false, error: response.message || 'Failed to add emergency contact' };
      }

      const contact = response.data || response.data?.contact;
      logger.info('Emergency contact added', { contactId: contact?.id });

      return { success: true, contact };
    } catch (error) {
      logger.error('Error adding emergency contact', error, { contactInfo });
      return { success: false, error: error.message || 'Failed to add emergency contact' };
    }
  }

  /**
   * Delete emergency contact
   */
  static async deleteEmergencyContact(contactId) {
    try {
      const response = await api.delete(`/safety/emergency-contact/${contactId}`);

      if (!response.success) {
        logger.error('Error deleting emergency contact', new Error(response.message), { contactId });
        return { success: false, error: response.message || 'Failed to delete emergency contact' };
      }

      logger.info('Emergency contact deleted', { contactId });
      return { success: true };
    } catch (error) {
      logger.error('Error deleting emergency contact', error, { contactId });
      return { success: false, error: error.message || 'Failed to delete emergency contact' };
    }
  }

  /**
   * Helper function to create notifications
   * Note: Notifications should be created through the backend notification service
   * This method is kept for backward compatibility but should be removed
   * Use NotificationService instead
   */
  static async createNotification(userId, notificationData) {
    try {
      // TODO: Use NotificationService instead of direct Firestore access
      logger.warn('createNotification: Should use NotificationService instead of direct Firestore');
      // For now, this is a no-op - notifications should be sent via backend
      // The backend handles notifications when date plans, SOS, etc. are created
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
