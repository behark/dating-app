import { BetaTestingService } from '../BetaTestingService';
import api from '../api';

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('BetaTestingService', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BetaTestingService();
  });

  it('enrolls user via API and caches enrollment', async () => {
    api.post.mockResolvedValue({
      success: true,
      data: {
        userId: 'user_123',
        status: 'active',
        tier: 'standard',
        features: ['all'],
      },
    });

    const enrollment = await service.enrollUser('user_123', {
      email: 'beta@test.com',
      name: 'Beta Tester',
    });

    expect(enrollment.userId).toBe('user_123');
    expect(enrollment.status).toBe('active');
    expect(service.betaUsers.get('user_123')).toBeDefined();
  });

  it('falls back to local pending enrollment when API fails', async () => {
    api.post.mockRejectedValue(new Error('network error'));

    const enrollment = await service.enrollUser('user_456');

    expect(enrollment.userId).toBe('user_456');
    expect(enrollment.status).toBe('pending');
    expect(enrollment.features).toContain('all');
  });

  it('returns beta status from API', async () => {
    api.get.mockResolvedValue({ success: true, data: { isEnrolled: true, status: 'active' } });

    const status = await service.getBetaStatus('user_123');
    const isTester = await service.isBetaTester('user_123');

    expect(status.isEnrolled).toBe(true);
    expect(isTester).toBe(true);
  });

  it('submits feedback and updates local lists', async () => {
    api.post.mockResolvedValueOnce({
      success: true,
      data: { id: 'f1', userId: 'user_123', type: 'general', status: 'new', rating: 5 },
    });
    api.post.mockResolvedValueOnce({
      success: true,
      data: { id: 'b1', userId: 'user_123', type: 'bug', status: 'new', severity: 'high' },
    });

    const feedback = await service.submitFeedback('user_123', {
      type: 'general',
      title: 'Great app',
      rating: 5,
    });
    const bug = await service.submitBugReport('user_123', {
      title: 'Crash on launch',
      severity: 'high',
    });

    expect(feedback.id).toBe('f1');
    expect(bug.type).toBe('bug');
    expect(service.feedback).toHaveLength(2);
    expect(service.bugs).toHaveLength(1);
  });

  it('records session and computes analytics', async () => {
    api.post.mockResolvedValue({
      success: true,
      data: { id: 's1', status: 'recorded', duration: 60000, features: ['swipe', 'like'] },
    });

    await service.recordSession('user_123', {
      duration: 60000,
      featuresUsed: ['swipe', 'like'],
    });

    service.betaUsers.set('user_123', { status: 'active' });

    const analytics = service.getAnalytics();

    expect(analytics.totalSessions).toBe(1);
    expect(analytics.totalBetaUsers).toBe(1);
    expect(analytics.featureUsage.swipe).toBe(1);
  });

  it('exports feedback payload as JSON', async () => {
    api.post.mockResolvedValue({
      success: true,
      data: { id: 'f1', userId: 'user_1', type: 'general', status: 'new' },
    });

    await service.submitFeedback('user_1', { type: 'general', title: 'Test feedback' });

    const exported = service.exportFeedback('json');
    const parsed = JSON.parse(exported);

    expect(parsed.feedback).toHaveLength(1);
    expect(parsed.exportedAt).toBeDefined();
    expect(parsed.analytics).toBeDefined();
  });
});
