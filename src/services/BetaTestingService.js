/**
 * Beta Testing Service
 * Manages beta user enrollment, feedback collection, and analytics
 */

class BetaTestingService {
  constructor() {
    this.betaUsers = new Map();
    this.feedback = [];
    this.bugs = [];
    this.featureRequests = [];
    this.sessions = [];
  }

  // Enroll user in beta program
  enrollUser(userId, userData = {}) {
    const enrollment = {
      userId,
      email: userData.email,
      name: userData.name,
      enrolledAt: new Date(),
      features: userData.features || ['all'],
      tier: userData.tier || 'standard', // 'standard', 'premium', 'vip'
      deviceInfo: userData.deviceInfo || {},
      consent: {
        dataCollection: true,
        crashReporting: true,
        analytics: true,
        screenshots: userData.screenshotConsent || false,
      },
      status: 'active',
    };

    this.betaUsers.set(userId, enrollment);
    return enrollment;
  }

  // Check if user is beta tester
  isBetaTester(userId) {
    const user = this.betaUsers.get(userId);
    return user && user.status === 'active';
  }

  // Submit feedback
  submitFeedback(userId, feedbackData) {
    const feedback = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: feedbackData.type || 'general', // 'general', 'feature', 'bug', 'suggestion'
      category: feedbackData.category,
      title: feedbackData.title,
      description: feedbackData.description,
      rating: feedbackData.rating, // 1-5 stars
      screenshot: feedbackData.screenshot || null,
      screenName: feedbackData.screenName,
      deviceInfo: feedbackData.deviceInfo,
      appVersion: feedbackData.appVersion,
      timestamp: new Date(),
      status: 'new', // 'new', 'reviewing', 'acknowledged', 'implemented', 'wont-fix'
      priority: null,
      assignee: null,
      tags: feedbackData.tags || [],
    };

    this.feedback.push(feedback);

    // Auto-categorize
    if (feedbackData.type === 'bug') {
      this.bugs.push(feedback);
    } else if (feedbackData.type === 'feature') {
      this.featureRequests.push(feedback);
    }

    return feedback;
  }

  // Submit bug report
  submitBugReport(userId, bugData) {
    const bug = {
      id: `bug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      title: bugData.title,
      description: bugData.description,
      severity: bugData.severity || 'medium', // 'low', 'medium', 'high', 'critical'
      reproducibility: bugData.reproducibility || 'sometimes', // 'always', 'sometimes', 'rarely'
      stepsToReproduce: bugData.stepsToReproduce || [],
      expectedBehavior: bugData.expectedBehavior,
      actualBehavior: bugData.actualBehavior,
      screenshot: bugData.screenshot,
      screenRecording: bugData.screenRecording,
      logs: bugData.logs || [],
      deviceInfo: bugData.deviceInfo,
      appVersion: bugData.appVersion,
      osVersion: bugData.osVersion,
      timestamp: new Date(),
      status: 'new',
      assignee: null,
    };

    this.bugs.push(bug);
    return bug;
  }

  // Record session analytics
  recordSession(userId, sessionData) {
    const session = {
      id: `session_${Date.now()}`,
      userId,
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
    };

    this.sessions.push(session);
    return session;
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
}

// Export singleton
const betaTestingService = new BetaTestingService();

module.exports = {
  BetaTestingService,
  betaTestingService,
};
