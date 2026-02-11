const express = require('express');
const request = require('supertest');

const activityController = {
  updateOnlineStatus: jest.fn((req, res) => res.status(200).json({ success: true })),
  getOnlineStatus: jest.fn((req, res) => res.status(200).json({ success: true, data: { isOnline: true } })),
  viewProfile: jest.fn((req, res) => res.status(200).json({ success: true })),
  getProfileViews: jest.fn((req, res) => res.status(200).json({ success: true, data: { views: [] } })),
  getMultipleStatus: jest.fn((req, res) => res.status(200).json({ success: true, data: { statuses: [] } })),
  heartbeat: jest.fn((req, res) => res.status(200).json({ success: true })),
};

jest.mock('../../src/api/controllers/activityController', () => activityController);

jest.mock('../../src/api/middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    req.user = { _id: 'user_1' };
    next();
  }),
  authorizeMatchedUsers: jest.fn((req, res, next) => next()),
}));

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/activity', require('../../routes/activity'));
  return app;
};

describe('activity routes', () => {
  let app;
  const auth = { Authorization: 'Bearer token' };

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires authentication', async () => {
    const res = await request(app).post('/api/activity/update-online-status').send({ isOnline: true });
    expect(res.status).toBe(401);
  });

  it('validates and updates online status', async () => {
    const invalid = await request(app)
      .post('/api/activity/update-online-status')
      .set(auth)
      .send({ isOnline: 'yes' });
    const valid = await request(app)
      .post('/api/activity/update-online-status')
      .set(auth)
      .send({ isOnline: true });

    expect(invalid.status).toBe(400);
    expect(valid.status).toBe(200);
    expect(activityController.updateOnlineStatus).toHaveBeenCalled();
  });

  it('serves status and profile activity endpoints', async () => {
    const online = await request(app).get('/api/activity/online-status/u2').set(auth);
    const view = await request(app).post('/api/activity/view-profile/u2').set(auth).send({});
    const views = await request(app).get('/api/activity/profile-views').set(auth);
    const heartbeat = await request(app).post('/api/activity/heartbeat').set(auth).send({});

    expect(online.status).toBe(200);
    expect(view.status).toBe(200);
    expect(views.status).toBe(200);
    expect(heartbeat.status).toBe(200);
  });

  it('validates bulk status payload', async () => {
    const invalid = await request(app).post('/api/activity/status').set(auth).send({ userIds: 'u2' });
    const valid = await request(app)
      .post('/api/activity/status')
      .set(auth)
      .send({ userIds: ['u2', 'u3'] });

    expect(invalid.status).toBe(400);
    expect(valid.status).toBe(200);
    expect(activityController.getMultipleStatus).toHaveBeenCalled();
  });
});
