/**
 * Beta Testing Service
 * Manages beta user enrollment, feedback collection, and analytics
 * Now integrates with backend API for server-side management
 */

import logger from '../utils/logger';
import api from './api';

class BetaTestingService {
  constructor() {
    this.betaUsers = new Map();
    this.feedback = [];
    this.bugs = [];
    this.featureRequests = [];
    this.sessions = [];
    this.cachedStatus = null;
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.lastStatusFetch = 0;
  }

  /**
   * Enroll user in beta program via API
   * @param {string} userId - User ID
   * @param {Object} userData - Additional user data
   * @returns {Promise<Object>} Enrollment result
   */
  async enrollUser(userId, userData = {}) {
    try {
      const response = await api.post('/beta/enroll', {
        userId,
        email: userData.email,
        name: userData.name,
        features: userData.features || ['all'],
        tier: userData.tier || 'standard',
        deviceInfo: userData.deviceInfo || {},
        consent: {
          dataCollection: true,
          crashReporting: true,
          analytics: true,
          screenshots: userData.screenshotConsent || false,
        },
      });

      if (response.success && response.data) {
        // Update local cache
        this.betaUsers.set(userId, response.data);
        this.cachedStatus = response.data;
        this.lastStatusFetch = Date.now();
        logger.info('User enrolled in beta program', { userId });
        return response.data;
      }

      throw new Error(response.message || 'Failed to enroll in beta');
    } catch (error) {
      logger.error('Error enrolling user in beta:', error);
      
      // Fall back to local enrollment if API fails
      const enrollment = {
        userId,
        email: userData.email,
        name: userData.name,
        enrolledAt: new Date(),
        features: userData.features || ['all'],
        tier: userData.tier || 'standard',
        deviceInfo: userData.deviceInfo || {},
        consent: {
          dataCollection: true,
          crashReporting: true,
          analytics: true,
          screenshots: userData.screenshotConsent || false,
        },
        status: 'pending', // Mark as pending since API failed
      };
      this.betaUsers.set(userId, enrollment);
      return enrollment;
    }
  }

  /**
   * Check if user is beta tester via API
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Whether user is a beta tester
   */
  async isBetaTester(userId) {
    try {
      const status = await this.getBetaStatus(userId);
      return status && status.isEnrolled && status.status === 'active';
    } catch (error) {
      // Fall back to local cache
      const user = this.betaUsers.get(userId);
      return user && user.status === 'active';
    }
  }

  /**
   * Get beta status from API
   * @param {string} userId - User ID (optional, uses current user if not provided)
   * @returns {Promise<Object>} Beta status
   */
  async getBetaStatus(userId = null) {
    // Check cache
    if (this.cachedStatus && Date.now() - this.lastStatusFetch < this.cacheExpiry) {
      return this.cachedStatus;
    }

    try {
      const response = await api.get('/beta/status');
      if (response.success && response.data) {
        this.cachedStatus = response.data;
        this.lastStatusFetch = Date.now();
        return response.data;
      }
      return { isEnrolled: false, status: null };
    } catch (error) {
      logger.warn('Error fetching beta status:', error.message);
      return { isEnrolled: false, status: null };
    }
  }

  /**
   * Submit feedback via API
   * @param {string} userId - User ID
   * @param {Object} feedbackData - Feedback data
   * @returns {Promise<Object>} Submitted feedback
   */
  async submitFeedback(userId, feedbackData) {
    try {
      const response = await api.post('/beta/feedback', {
        type: feedbackData.type || 'general',
        category: feedbackData.category,
        title: feedbackData.title,
        description: feedbackData.description,
        rating: feedbackData.rating,
        screenshot: feedbackData.screenshot || null,
        screenName: feedbackData.screenName,
        deviceInfo: feedbackData.deviceInfo,
        appVersion: feedbackData.appVersion,
        tags: feedbackData.tags || [],
      });

      if (response.success && response.data) {
        // Add to local cache
        this.feedback.push(response.data);
        if (feedbackData.type === 'bug') {
          this.bugs.push(response.data);
        } else if (feedbackData.type === 'feature') {
          this.featureRequests.push(response.data);
        }
        logger.info('Feedback submitted successfully', { feedbackId: response.data.id });
        return response.data;
      }

      throw new Error(response.message || 'Failed to submit feedback');
    } catch (error) {
      logger.error('Error submitting feedback:', error);
      
      // Store locally if API fails (will sync later)
      const feedback = {
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        ...feedbackData,
        timestamp: new Date(),
        status: 'pending_sync',
        priority: null,
        assignee: null,
      };
      this.feedback.push(feedback);
      return feedback;
    }
  }

  /**
   * Submit bug report (convenience method)
   * @param {string} userId - User ID
   * @param {Object} bugData - Bug report data
   * @returns {Promise<Object>} Submitted bug report
   */
  async submitBugReport(userId, bugData) {
    return this.submitFeedback(userId, {
      ...bugData,
      type: 'bug',
    });
  }

  /**
   * Record session via API
   * @param {string} userId - User ID
   * @param {Object} sessionData - Session data
   * @returns {Promise<Object>} Recorded session
   */
  async recordSession(userId, sessionData) {
    try {
      const response = await api.post('/beta/session', {
        startTime: sessionData.startTime || new Date(),
        endTime: sessionData.endTime,
        duration: sessionData.duration,
        screens: sessionData.screens || [],
        actions: sessionData.actions || [],
        errors: sessionData.errors || [],
        performance: {
          loadTimes: sessionData.loadTimes || {},
          crashes: sessionData.crashes || 0,
          networkErrors: sessionData.networkErrors || 0,
        },
        features: sessionData.featuresUsed || [],
        device: sessionData.deviceInfo,
        appVersion: sessionData.appVersion,
      });

      if (response.success && response.data) {
        this.sessions.push(response.data);
        return response.data;
      }

      throw new Error(response.message || 'Failed to record session');
    } catch (error) {
      logger.warn('Error recording beta session:', error.message);
      
      // Store locally if API fails
      const session = {
        id: `session_${Date.now()}`,
        userId,
        ...sessionData,
        status: 'pending_sync',
      };
      this.sessions.push(session);
      return session;
    }
  }

  /**
   * Get user's feedback history from API
   * @returns {Promise<Array>} User's feedback
   */
  async getUserFeedback() {
    try {
      const response = await api.get('/beta/feedback');
      if (response.success && response.data) {
        return response.data;
      }
      return this.feedback;
    } catch (error) {
      logger.warn('Error fetching user feedback:', error.message);
      return this.feedback;
    }
  }

  // Get feedback statistics
  getFeedbackStats() {
    const totalFeedback = this.feedback.length;
    const byType = this.feedback.reduce((acc, f) => {
      acc[f.type] = (acc[f.type] || 0) + 1;
      return acc;
    }, {});
    const byStatus = this.feedback.reduce((acc, f) => {
      acc[f.status] = (acc[f.status] || 0) + 1;
      return acc;
    }, {});
    const avgRating =
      this.feedback.filter((f) => f.rating).reduce((sum, f) => sum + f.rating, 0) /
      (this.feedback.filter((f) => f.rating).length || 1);

    return {
      total: totalFeedback,
      byType,
      byStatus,
      averageRating: avgRating.toFixed(2),
      bugCount: this.bugs.length,
      featureRequestCount: this.featureRequests.length,
    };
  }

  // Get bug statistics
  getBugStats() {
    const bySeverity = this.bugs.reduce((acc, b) => {
      acc[b.severity] = (acc[b.severity] || 0) + 1;
      return acc;
    }, {});
    const byStatus = this.bugs.reduce((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {});

    return {
      total: this.bugs.length,
      bySeverity,
      byStatus,
      critical: bySeverity.critical || 0,
      high: bySeverity.high || 0,
    };
  }

  // Get beta program analytics
  getAnalytics() {
    const activeUsers = Array.from(this.betaUsers.values()).filter(
      (u) => u.status === 'active'
    ).length;

    const avgSessionDuration =
      this.sessions.length > 0
        ? this.sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / this.sessions.length
        : 0;

    const featureUsage = this.sessions.reduce((acc, s) => {
      s.features.forEach((f) => {
        acc[f] = (acc[f] || 0) + 1;
      });
      return acc;
    }, {});

    return {
      totalBetaUsers: this.betaUsers.size,
      activeUsers,
      totalSessions: this.sessions.length,
      averageSessionDuration: Math.round(avgSessionDuration / 1000 / 60), // minutes
      feedbackStats: this.getFeedbackStats(),
      bugStats: this.getBugStats(),
      featureUsage,
    };
  }

  // Export feedback data
  exportFeedback(format = 'json') {
    if (format === 'json') {
      return JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          feedback: this.feedback,
          bugs: this.bugs,
          featureRequests: this.featureRequests,
          analytics: this.getAnalytics(),
        },
        null,
        2
      );
    }
    // CSV export could be added here
    return null;
  }

  // Get all feedback for admin review
  getAllFeedback(filters = {}) {
    let results = [...this.feedback];

    if (filters.type) {
      results = results.filter((f) => f.type === filters.type);
    }
    if (filters.status) {
      results = results.filter((f) => f.status === filters.status);
    }
    if (filters.userId) {
      results = results.filter((f) => f.userId === filters.userId);
    }
    if (filters.fromDate) {
      results = results.filter((f) => new Date(f.timestamp) >= new Date(filters.fromDate));
    }

    // Sort by timestamp descending
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return results;
  }

  // Update feedback status
  updateFeedbackStatus(feedbackId, status, assignee = null, notes = null) {
    const feedback = this.feedback.find((f) => f.id === feedbackId);
    if (feedback) {
      feedback.status = status;
      if (assignee) feedback.assignee = assignee;
      if (notes) feedback.notes = notes;
      feedback.updatedAt = new Date();
    }
    return feedback;
  }

  // Sync pending feedback to API (call this when coming online)
  async syncPendingFeedback() {
    const pendingFeedback = this.feedback.filter(f => f.status === 'pending_sync');
    
    for (const feedback of pendingFeedback) {
      try {
        const response = await api.post('/beta/feedback', feedback);
        if (response.success) {
          feedback.status = 'new';
          feedback.id = response.data?.id || feedback.id;
          logger.info('Synced pending feedback', { feedbackId: feedback.id });
        }
      } catch (error) {
        logger.warn('Failed to sync feedback:', error.message);
      }
    }
  }
}

// Export singleton
const betaTestingService = new BetaTestingService();

export { BetaTestingService, betaTestingService };
export default betaTestingService;
