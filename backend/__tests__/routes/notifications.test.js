const express = require('express');
const request = require('supertest');

const notificationController = {
  getNotificationPreferences: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
  updateNotificationPreferences: jest.fn((req, res) => res.status(200).json({ success: true })),
  sendNotification: jest.fn((req, res) => res.status(200).json({ success: true })),
  sendBulkNotification: jest.fn((req, res) => res.status(200).json({ success: true })),
  enableNotifications: jest.fn((req, res) => res.status(200).json({ success: true })),
  disableNotifications: jest.fn((req, res) => res.status(200).json({ success: true })),
  getNotifications: jest.fn((req, res) =>
    res.status(200).json({ success: true, data: { notifications: [] } })
  ),
  markNotificationAsRead: jest.fn((req, res) => res.status(200).json({ success: true })),
  markAllAsRead: jest.fn((req, res) => res.status(200).json({ success: true })),
};

jest.mock('../../src/api/controllers/notificationController', () => notificationController);

jest.mock('../../src/api/middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    req.user = { _id: 'user_1' };
    next();
  }),
}));

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/notifications', require('../../routes/notifications'));
  return app;
};

describe('notifications routes', () => {
  let app;
  const auth = { Authorization: 'Bearer token' };

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });

  it('serves preferences endpoints', async () => {
    const getRes = await request(app).get('/api/notifications/preferences').set(auth);
    const putRes = await request(app)
      .put('/api/notifications/preferences')
      .set(auth)
      .send({ pushEnabled: true });

    expect(getRes.status).toBe(200);
    expect(putRes.status).toBe(200);
  });

  it('serves notification listing and read operations', async () => {
    const list = await request(app).get('/api/notifications').set(auth);
    const readOne = await request(app).put('/api/notifications/n1/read').set(auth);
    const readAll = await request(app).put('/api/notifications/read-all').set(auth);

    expect(list.status).toBe(200);
    expect(readOne.status).toBe(200);
    expect(readAll.status).toBe(200);
  });

  it('serves send/enable/disable endpoints', async () => {
    const send = await request(app)
      .post('/api/notifications/send')
      .set(auth)
      .send({ userId: 'u2', title: 'hello' });
    const bulk = await request(app)
      .post('/api/notifications/send-bulk')
      .set(auth)
      .send({ userIds: ['u2', 'u3'], title: 'hello' });
    const enable = await request(app).put('/api/notifications/enable').set(auth);
    const disable = await request(app).put('/api/notifications/disable').set(auth);

    expect(send.status).toBe(200);
    expect(bulk.status).toBe(200);
    expect(enable.status).toBe(200);
    expect(disable.status).toBe(200);
  });
});
