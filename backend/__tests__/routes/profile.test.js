const express = require('express');
const request = require('supertest');

const profileController = {
  updateProfile: jest.fn((req, res) => res.status(200).json({ success: true })),
  getProfile: jest.fn((req, res) => res.status(200).json({ success: true, data: { userId: req.params.userId } })),
  getMyProfile: jest.fn((req, res) => res.status(200).json({ success: true, data: { userId: req.user._id } })),
  uploadPhotos: jest.fn((req, res) => res.status(200).json({ success: true })),
  reorderPhotos: jest.fn((req, res) => res.status(200).json({ success: true })),
  deletePhoto: jest.fn((req, res) => res.status(200).json({ success: true })),
  approvePhoto: jest.fn((req, res) => res.status(200).json({ success: true })),
  rejectPhoto: jest.fn((req, res) => res.status(200).json({ success: true })),
  getPendingPhotos: jest.fn((req, res) => res.status(200).json({ success: true, data: { items: [] } })),
};

jest.mock('../../src/api/controllers/profileController', () => profileController);

const invalidateUserCache = jest.fn().mockResolvedValue(undefined);
jest.mock('../../src/api/middleware/apiCache', () => ({
  apiCache: jest.fn(() => (req, res, next) => next()),
  invalidateUserCache,
}));

jest.mock('../../src/api/middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    req.user = { _id: 'user_1', id: 'user_1', role: req.headers['x-role'] || 'user' };
    next();
  }),
  authorizeMatchedUsers: jest.fn((req, res, next) => next()),
  isAdmin: jest.fn((req, res, next) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
  }),
}));

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/profile', require('../../routes/profile'));
  return app;
};

describe('profile routes', () => {
  let app;
  const auth = { Authorization: 'Bearer token' };

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires authentication for private endpoints', async () => {
    const res = await request(app).get('/api/profile/me');
    expect(res.status).toBe(401);
  });

  it('serves authenticated profile endpoints', async () => {
    const me = await request(app).get('/api/profile/me').set(auth);
    const other = await request(app).get('/api/profile/target_user').set(auth);

    expect(me.status).toBe(200);
    expect(other.status).toBe(200);
    expect(profileController.getMyProfile).toHaveBeenCalled();
    expect(profileController.getProfile).toHaveBeenCalled();
  });

  it('validates update payload and accepts valid updates', async () => {
    const invalid = await request(app)
      .put('/api/profile/update')
      .set(auth)
      .send({ age: 15 });

    const valid = await request(app)
      .put('/api/profile/update')
      .set(auth)
      .send({ name: 'Updated', age: 25 });

    expect(invalid.status).toBe(400);
    expect(valid.status).toBe(200);
  });

  it('validates photo upload input and handles photo operations', async () => {
    const invalid = await request(app)
      .post('/api/profile/photos/upload')
      .set(auth)
      .send({ photos: [{ url: 'not-a-url' }] });

    const validUpload = await request(app)
      .post('/api/profile/photos/upload')
      .set(auth)
      .send({ photos: [{ url: 'https://example.com/1.jpg' }] });

    const reorder = await request(app)
      .put('/api/profile/photos/reorder')
      .set(auth)
      .send({ photoIds: ['p1', 'p2'] });

    const del = await request(app).delete('/api/profile/photos/p1').set(auth);

    expect(invalid.status).toBe(400);
    expect(validUpload.status).toBe(200);
    expect(reorder.status).toBe(200);
    expect(del.status).toBe(200);
  });

  it('enforces admin-only photo moderation endpoints', async () => {
    const userApprove = await request(app).put('/api/profile/photos/p1/approve').set(auth);
    const adminApprove = await request(app)
      .put('/api/profile/photos/p1/approve')
      .set(auth)
      .set('x-role', 'admin');
    const adminReject = await request(app)
      .put('/api/profile/photos/p1/reject')
      .set(auth)
      .set('x-role', 'admin')
      .send({ reason: 'bad image' });

    expect(userApprove.status).toBe(403);
    expect(adminApprove.status).toBe(200);
    expect(adminReject.status).toBe(200);
  });

  it('enforces admin role on pending photos endpoint', async () => {
    const userRes = await request(app).get('/api/profile/admin/photos/pending').set(auth);
    const adminRes = await request(app)
      .get('/api/profile/admin/photos/pending')
      .set(auth)
      .set('x-role', 'admin');

    expect(userRes.status).toBe(403);
    expect(adminRes.status).toBe(200);
    expect(profileController.getPendingPhotos).toHaveBeenCalledTimes(1);
  });
});
