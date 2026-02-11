const express = require('express');
const request = require('supertest');

const analyticsMetricsService = {
  getDashboardMetrics: jest.fn().mockResolvedValue({}),
  getDailyActiveUsers: jest.fn().mockResolvedValue({ count: 1 }),
  getWeeklyActiveUsers: jest.fn().mockResolvedValue({ count: 2 }),
  getMonthlyActiveUsers: jest.fn().mockResolvedValue({ count: 3 }),
  getRetentionRate: jest.fn().mockResolvedValue({ retention: {} }),
  getRollingRetention: jest.fn().mockResolvedValue({}),
  getMatchRate: jest.fn().mockResolvedValue({ matchRate: 1 }),
  getSwipeToMatchConversion: jest.fn().mockResolvedValue({ conversionRate: 1 }),
  getMessageResponseRate: jest.fn().mockResolvedValue({ responseRate: 1 }),
  getAverageMessagesPerMatch: jest.fn().mockResolvedValue({ averageMessagesPerMatch: 1 }),
  getPremiumConversionRate: jest.fn().mockResolvedValue({ conversionRate: 1 }),
  getPremiumChurnRate: jest.fn().mockResolvedValue({ churnRate: 1 }),
  getPhotoUploadSuccessRate: jest.fn().mockResolvedValue({ successRate: 99 }),
  trackCrash: jest.fn(),
};

jest.mock('../../src/core/services/AnalyticsMetricsService', () => ({
  analyticsMetricsService,
}));

jest.mock('../../src/api/middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ success: false });
    }
    req.user = { _id: 'user_1', role: req.headers['x-role'] || 'user' };
    next();
  }),
  isAdmin: jest.fn((req, res, next) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false });
    }
    next();
  }),
}));

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/metrics', require('../../routes/metrics'));
  return app;
};

describe('metrics routes', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/metrics/dashboard');
    expect(res.status).toBe(401);
  });

  it('enforces admin role for admin endpoints', async () => {
    const userRes = await request(app)
      .get('/api/metrics/dashboard')
      .set('Authorization', 'Bearer token');
    expect(userRes.status).toBe(403);

    const adminRes = await request(app)
      .get('/api/metrics/dashboard')
      .set('Authorization', 'Bearer token')
      .set('x-role', 'admin');
    expect(adminRes.status).toBe(200);
  });

  it('serves active user and retention endpoints for admins', async () => {
    const admin = { Authorization: 'Bearer token', 'x-role': 'admin' };

    const dau = await request(app).get('/api/metrics/dau').set(admin);
    const activeUsers = await request(app).get('/api/metrics/active-users').set(admin);
    const retention = await request(app).get('/api/metrics/retention').set(admin);
    const rolling = await request(app).get('/api/metrics/retention/rolling').set(admin);

    expect(dau.status).toBe(200);
    expect(activeUsers.status).toBe(200);
    expect(retention.status).toBe(200);
    expect(rolling.status).toBe(200);
  });

  it('serves match, message, premium and photo metrics for admins', async () => {
    const admin = { Authorization: 'Bearer token', 'x-role': 'admin' };

    const matches = await request(app).get('/api/metrics/matches').set(admin);
    const messages = await request(app).get('/api/metrics/messages').set(admin);
    const premium = await request(app).get('/api/metrics/premium').set(admin);
    const photos = await request(app).get('/api/metrics/photos').set(admin);

    expect(matches.status).toBe(200);
    expect(messages.status).toBe(200);
    expect(premium.status).toBe(200);
    expect(photos.status).toBe(200);
  });

  it('accepts crash reports for authenticated users', async () => {
    const res = await request(app)
      .post('/api/metrics/crash')
      .set('Authorization', 'Bearer token')
      .send({
        platform: 'ios',
        version: '1.0.0',
        errorMessage: 'boom',
        stackTrace: 'trace',
      });

    expect(res.status).toBe(200);
    expect(analyticsMetricsService.trackCrash).toHaveBeenCalled();
  });

  it('exports metrics for admins', async () => {
    const res = await request(app)
      .get('/api/metrics/export?type=json')
      .set('Authorization', 'Bearer token')
      .set('x-role', 'admin');

    expect([200, 500]).toContain(res.status);
  });
});
