const express = require('express');
const request = require('supertest');

jest.mock('../../src/api/controllers/swipeController', () => ({
  createSwipe: jest.fn(async (req, res) => res.status(201).json({ success: true })),
  getSwipeCountToday: jest.fn((req, res) => res.status(200).json({ success: true })),
  undoSwipe: jest.fn((req, res) => res.status(200).json({ success: true })),
  getUserSwipes: jest.fn((req, res) => res.status(200).json({ success: true })),
  getReceivedSwipes: jest.fn((req, res) => res.status(200).json({ success: true })),
  getSwipeStats: jest.fn((req, res) => res.status(200).json({ success: true })),
  getPendingLikes: jest.fn((req, res) => res.status(200).json({ success: true })),
  getMatches: jest.fn((req, res) => res.status(200).json({ success: true })),
  unmatch: jest.fn((req, res) => res.status(200).json({ success: true })),
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

const swipeController = require('../../src/api/controllers/swipeController');

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/swipes', require('../../routes/swipe'));
  return app;
};

describe('swipe routes', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires auth', async () => {
    const res = await request(app).get('/api/swipes/count/today');
    expect(res.status).toBe(401);
  });

  it('routes create/undo actions', async () => {
    const create = await request(app)
      .post('/api/swipes')
      .set('Authorization', 'Bearer token')
      .send({ targetId: 'u2', action: 'like' });
    const undo = await request(app)
      .post('/api/swipes/undo')
      .set('Authorization', 'Bearer token')
      .send({ swipeId: 's1' });

    expect(create.status).toBe(201);
    expect(undo.status).toBe(200);
    expect(swipeController.createSwipe).toHaveBeenCalled();
    expect(swipeController.undoSwipe).toHaveBeenCalled();
  });

  it('routes stats/list endpoints', async () => {
    const auth = { Authorization: 'Bearer token' };
    const endpoints = [
      '/api/swipes/count/today',
      '/api/swipes/user',
      '/api/swipes/received',
      '/api/swipes/stats',
      '/api/swipes/pending-likes',
      '/api/swipes/matches',
    ];

    for (const endpoint of endpoints) {
      const res = await request(app).get(endpoint).set(auth);
      expect(res.status).toBe(200);
    }

    const unmatch = await request(app).delete('/api/swipes/matches/m1').set(auth);
    expect(unmatch.status).toBe(200);
    expect(swipeController.unmatch).toHaveBeenCalled();
  });
});
