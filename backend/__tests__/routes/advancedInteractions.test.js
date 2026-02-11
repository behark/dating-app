const express = require('express');
const request = require('supertest');

jest.mock('../../src/api/controllers/advancedInteractionsController', () => ({
  sendSuperLike: jest.fn((req, res) => res.status(200).json({ success: true })),
  getSuperLikeQuota: jest.fn((req, res) => res.status(200).json({ success: true })),
  rewindLastSwipe: jest.fn((req, res) => res.status(200).json({ success: true })),
  getRewindQuota: jest.fn((req, res) => res.status(200).json({ success: true })),
  boostProfile: jest.fn((req, res) => res.status(200).json({ success: true })),
  getBoostQuota: jest.fn((req, res) => res.status(200).json({ success: true })),
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

const controller = require('../../src/api/controllers/advancedInteractionsController');

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/interactions', require('../../routes/advancedInteractions'));
  return app;
};

describe('advanced interaction routes', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires auth', async () => {
    const res = await request(app).post('/api/interactions/super-like').send({});
    expect(res.status).toBe(401);
  });

  it('routes super-like endpoints', async () => {
    const auth = { Authorization: 'Bearer token' };
    const send = await request(app).post('/api/interactions/super-like').set(auth).send({});
    const quota = await request(app).get('/api/interactions/super-like-quota').set(auth);
    expect(send.status).toBe(200);
    expect(quota.status).toBe(200);
    expect(controller.sendSuperLike).toHaveBeenCalled();
    expect(controller.getSuperLikeQuota).toHaveBeenCalled();
  });

  it('routes rewind endpoints', async () => {
    const auth = { Authorization: 'Bearer token' };
    const rewind = await request(app).post('/api/interactions/rewind').set(auth).send({});
    const quota = await request(app).get('/api/interactions/rewind-quota').set(auth);
    expect(rewind.status).toBe(200);
    expect(quota.status).toBe(200);
  });

  it('routes boost endpoints', async () => {
    const auth = { Authorization: 'Bearer token' };
    const boost = await request(app).post('/api/interactions/boost').set(auth).send({});
    const quota = await request(app).get('/api/interactions/boost-quota').set(auth);
    expect(boost.status).toBe(200);
    expect(quota.status).toBe(200);
  });
});
