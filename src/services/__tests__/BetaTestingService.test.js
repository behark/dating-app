/**
 * Tests for Beta Testing Service
 */

import { BetaTestingService } from '../BetaTestingService';

describe('BetaTestingService', () => {
  let service;

  beforeEach(() => {
    service = new BetaTestingService();
  });

  describe('User Enrollment', () => {
    it('should enroll a new beta user', () => {
      const enrollment = service.enrollUser('user_123', {
        email: 'beta@test.com',
        name: 'Beta Tester',
        features: ['video_chat', 'ai_matching'],
      });

      expect(enrollment.userId).toBe('user_123');
      expect(enrollment.status).toBe('active');
      expect(enrollment.features).toContain('video_chat');
    });

    it('should set default values for enrollment', () => {
      const enrollment = service.enrollUser('user_456');

      expect(enrollment.tier).toBe('standard');
      expect(enrollment.features).toContain('all');
      expect(enrollment.consent.dataCollection).toBe(true);
    });

    it('should check if user is beta tester', () => {
      service.enrollUser('beta_user');

      expect(service.isBetaTester('beta_user')).toBe(true);
      expect(service.isBetaTester('regular_user')).toBeUndefined();
    });
  });

  describe('Feedback Submission', () => {
    it('should submit general feedback', () => {
      const feedback = service.submitFeedback('user_123', {
        type: 'general',
        title: 'Great app!',
        description: 'I love the new design',
        rating: 5,
        category: 'design',
      });

      expect(feedback.id).toBeDefined();
      expect(feedback.type).toBe('general');
      expect(feedback.status).toBe('new');
      expect(feedback.rating).toBe(5);
    });

    it('should auto-categorize bug reports', () => {
      const bug = service.submitFeedback('user_123', {
        type: 'bug',
        title: 'App crashes on startup',
        description: 'The app crashes when I open it',
      });

      expect(service.bugs).toContainEqual(expect.objectContaining({ id: bug.id }));
    });

    it('should auto-categorize feature requests', () => {
      const feature = service.submitFeedback('user_123', {
        type: 'feature',
        title: 'Add dark mode',
        description: 'Would be nice to have dark mode',
      });

      expect(service.featureRequests).toContainEqual(expect.objectContaining({ id: feature.id }));
    });

    it('should include device info and timestamp', () => {
      const feedback = service.submitFeedback('user_123', {
        title: 'Test feedback',
        deviceInfo: { platform: 'ios', version: '15.0' },
        appVersion: '1.0.0',
      });

      expect(feedback.deviceInfo.platform).toBe('ios');
      expect(feedback.appVersion).toBe('1.0.0');
      expect(feedback.timestamp).toBeDefined();
    });
  });

  describe('Bug Reports', () => {
    it('should submit detailed bug report', () => {
      const bug = service.submitBugReport('user_123', {
        title: 'Login button not working',
        description: 'Login button does not respond to taps',
        severity: 'high',
        reproducibility: 'always',
        stepsToReproduce: ['Open app', 'Enter credentials', 'Tap login button'],
        expectedBehavior: 'Should navigate to home screen',
        actualBehavior: 'Nothing happens',
      });

      expect(bug.severity).toBe('high');
      expect(bug.reproducibility).toBe('always');
      expect(bug.stepsToReproduce).toHaveLength(3);
    });

    it('should set default values for bug report', () => {
      const bug = service.submitBugReport('user_123', {
        title: 'Minor issue',
        description: 'Something is not quite right',
      });

      expect(bug.severity).toBe('medium');
      expect(bug.reproducibility).toBe('sometimes');
      expect(bug.status).toBe('new');
    });
  });

  describe('Session Analytics', () => {
    it('should record session data', () => {
      const session = service.recordSession('user_123', {
        startTime: new Date(),
        duration: 300000, // 5 minutes
        screens: ['home', 'discover', 'profile'],
        featuresUsed: ['swipe', 'like', 'message'],
        appVersion: '1.0.0',
      });

      expect(session.userId).toBe('user_123');
      expect(session.screens).toContain('discover');
      expect(session.features).toContain('swipe');
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      // Add some test data
      service.submitFeedback('user_1', { type: 'bug', title: 'Bug 1', rating: 2 });
      service.submitFeedback('user_2', { type: 'feature', title: 'Feature 1', rating: 4 });
      service.submitFeedback('user_3', { type: 'general', title: 'General 1', rating: 5 });
      service.submitBugReport('user_4', { title: 'Critical bug', severity: 'critical' });
      service.submitBugReport('user_5', { title: 'High bug', severity: 'high' });
    });

    it('should calculate feedback statistics', () => {
      const stats = service.getFeedbackStats();

      expect(stats.total).toBe(3);
      expect(stats.byType.bug).toBe(1);
      expect(stats.byType.feature).toBe(1);
      expect(stats.byType.general).toBe(1);
    });

    it('should calculate average rating', () => {
      const stats = service.getFeedbackStats();
      const avgRating = parseFloat(stats.averageRating);

      expect(avgRating).toBeGreaterThan(0);
      expect(avgRating).toBeLessThanOrEqual(5);
    });

    it('should calculate bug statistics', () => {
      const bugStats = service.getBugStats();

      expect(bugStats.total).toBe(3); // 1 from submitFeedback + 2 from submitBugReport
      expect(bugStats.critical).toBe(1);
      expect(bugStats.high).toBe(1);
    });
  });

  describe('Analytics', () => {
    it('should generate comprehensive analytics', () => {
      service.enrollUser('user_1');
      service.enrollUser('user_2');
      service.submitFeedback('user_1', { title: 'Test', rating: 4 });
      service.recordSession('user_1', { duration: 60000, features: ['swipe'] });

      const analytics = service.getAnalytics();

      expect(analytics.totalBetaUsers).toBe(2);
      expect(analytics.activeUsers).toBe(2);
      expect(analytics.totalSessions).toBe(1);
      expect(analytics.feedbackStats).toBeDefined();
      expect(analytics.bugStats).toBeDefined();
    });

    it('should track feature usage', () => {
      service.recordSession('user_1', { featuresUsed: ['swipe', 'like'] });
      service.recordSession('user_2', { featuresUsed: ['swipe', 'chat'] });

      const analytics = service.getAnalytics();

      expect(analytics.featureUsage.swipe).toBe(2);
      expect(analytics.featureUsage.like).toBe(1);
      expect(analytics.featureUsage.chat).toBe(1);
    });
  });

  describe('Feedback Management', () => {
    it('should filter feedback', () => {
      service.submitFeedback('user_1', { type: 'bug', title: 'Bug' });
      service.submitFeedback('user_1', { type: 'feature', title: 'Feature' });
      service.submitFeedback('user_2', { type: 'bug', title: 'Another bug' });

      const bugFeedback = service.getAllFeedback({ type: 'bug' });
      expect(bugFeedback).toHaveLength(2);

      const user1Feedback = service.getAllFeedback({ userId: 'user_1' });
      expect(user1Feedback).toHaveLength(2);
    });

    it('should update feedback status', () => {
      const feedback = service.submitFeedback('user_1', { title: 'Test' });

      service.updateFeedbackStatus(feedback.id, 'reviewing', 'admin_1', 'Looking into this');

      const updated = service.getAllFeedback().find((f) => f.id === feedback.id);
      expect(updated.status).toBe('reviewing');
      expect(updated.assignee).toBe('admin_1');
      expect(updated.notes).toBe('Looking into this');
    });
  });

  describe('Data Export', () => {
    it('should export feedback data as JSON', () => {
      service.submitFeedback('user_1', { title: 'Test feedback' });
      service.submitBugReport('user_1', { title: 'Test bug' });

      const exported = service.exportFeedback('json');
      const parsed = JSON.parse(exported);

      expect(parsed.feedback).toHaveLength(1);
      expect(parsed.bugs).toHaveLength(1);
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.analytics).toBeDefined();
    });
  });
});
