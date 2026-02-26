const express = require('express');
const request = require('supertest');

jest.mock('../../src/api/controllers/premiumController', () => ({
  getSubscriptionStatus: jest.fn((req, res) => res.status(200).json({ success: true })),
  startTrial: jest.fn((req, res) => res.status(200).json({ success: true })),
  upgradeToPremium: jest.fn((req, res) => res.status(200).json({ success: true })),
  cancelSubscription: jest.fn((req, res) => res.status(200).json({ success: true })),
  getReceivedLikes: jest.fn((req, res) => res.status(200).json({ success: true })),
  getPassportStatus: jest.fn((req, res) => res.status(200).json({ success: true })),
  setPassportLocation: jest.fn((req, res) => res.status(200).json({ success: true })),
  disablePassport: jest.fn((req, res) => res.status(200).json({ success: true })),
  getAdvancedFilterOptions: jest.fn((req, res) => res.status(200).json({ success: true })),
  updateAdvancedFilters: jest.fn((req, res) => res.status(200).json({ success: true })),
  sendPriorityLike: jest.fn((req, res) => res.status(200).json({ success: true })),
  updateAdsPreferences: jest.fn((req, res) => res.status(200).json({ success: true })),
  getBoostAnalytics: jest.fn((req, res) => res.status(200).json({ success: true })),
  recordBoostSession: jest.fn((req, res) => res.status(200).json({ success: true })),
}));

jest.mock('../../src/api/middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ success: false });
    }
    req.user = { _id: 'user_1' };
    next();
  }),
}));

const controller = require('../../src/api/controllers/premiumController');

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/premium', require('../../routes/premium'));
  return app;
};

describe('premium routes', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires auth for all endpoints', async () => {
    const res = await request(app).get('/api/premium/subscription/status');
    expect(res.status).toBe(401);
  });

  it('routes subscription endpoints', async () => {
    const auth = { Authorization: 'Bearer token' };
    const status = await request(app).get('/api/premium/subscription/status').set(auth);
    const trial = await request(app)
      .post('/api/premium/subscription/trial/start')
      .set(auth)
      .send({});
    const upgrade = await request(app).post('/api/premium/subscription/upgrade').set(auth).send({});
    const cancel = await request(app).post('/api/premium/subscription/cancel').set(auth).send({});

    expect(status.status).toBe(200);
    expect(trial.status).toBe(200);
    expect(upgrade.status).toBe(200);
    expect(cancel.status).toBe(200);
  });

  it('routes passport and filters endpoints', async () => {
    const auth = { Authorization: 'Bearer token' };
    const passportStatus = await request(app).get('/api/premium/passport/status').set(auth);
    const passportSet = await request(app)
      .post('/api/premium/passport/location')
      .set(auth)
      .send({});
    const passportDisable = await request(app)
      .post('/api/premium/passport/disable')
      .set(auth)
      .send({});
    const filterOptions = await request(app).get('/api/premium/filters/options').set(auth);
    const filterUpdate = await request(app).post('/api/premium/filters/update').set(auth).send({});

    expect(passportStatus.status).toBe(200);
    expect(passportSet.status).toBe(200);
    expect(passportDisable.status).toBe(200);
    expect(filterOptions.status).toBe(200);
    expect(filterUpdate.status).toBe(200);
  });

  it('routes likes/analytics endpoints', async () => {
    const auth = { Authorization: 'Bearer token' };
    const likes = await request(app).get('/api/premium/likes/received').set(auth);
    const priority = await request(app).post('/api/premium/likes/priority').set(auth).send({});
    const adPrefs = await request(app).post('/api/premium/ads/preferences').set(auth).send({});
    const analytics = await request(app).get('/api/premium/analytics/boosts').set(auth);
    const boostSession = await request(app)
      .post('/api/premium/analytics/boost-session')
      .set(auth)
      .send({});

    expect(likes.status).toBe(200);
    expect(priority.status).toBe(200);
    expect(adPrefs.status).toBe(200);
    expect(analytics.status).toBe(200);
    expect(boostSession.status).toBe(200);
    expect(controller.getBoostAnalytics).toHaveBeenCalled();
  });
});
