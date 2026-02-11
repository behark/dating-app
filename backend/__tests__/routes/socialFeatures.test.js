const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

jest.mock('../../src/api/controllers/socialFeaturesController', () => ({
  createGroupDate: jest.fn((req, res) => res.status(201).json({ success: true })),
  joinGroupDate: jest.fn((req, res) => res.status(200).json({ success: true })),
  leaveGroupDate: jest.fn((req, res) => res.status(200).json({ success: true })),
  getNearbyGroupDates: jest.fn((req, res) => res.status(200).json({ success: true, data: [] })),
  createFriendReview: jest.fn((req, res) => res.status(201).json({ success: true })),
  getUserReviews: jest.fn((req, res) => res.status(200).json({ success: true, data: [] })),
  createEvent: jest.fn((req, res) => res.status(201).json({ success: true, data: { id: 'event_1' } })),
  registerForEvent: jest.fn((req, res) => res.status(200).json({ success: true })),
  leaveEvent: jest.fn((req, res) => res.status(200).json({ success: true })),
  getNearbyEvents: jest.fn((req, res) => res.status(200).json({ success: true, data: [] })),
  createShareableProfileLink: jest.fn((req, res) => res.status(201).json({ success: true })),
  shareProfileWith: jest.fn((req, res) => res.status(200).json({ success: true })),
  getSharedProfile: jest.fn((req, res) => res.status(200).json({ success: true })),
  getUserSharedProfiles: jest.fn((req, res) => res.status(200).json({ success: true, data: [] })),
  deactivateShareLink: jest.fn((req, res) => res.status(200).json({ success: true })),
}));
const controller = require('../../src/api/controllers/socialFeaturesController');

const buildToken = () =>
  jwt.sign(
    { userId: new mongoose.Types.ObjectId().toString(), role: 'user' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

const auth = () => ({ Authorization: `Bearer ${buildToken()}` });

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/social', require('../../routes/socialFeatures'));
  return app;
};

describe('socialFeatures routes', () => {
  let app;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only';
    process.env.JWT_REFRESH_SECRET =
      process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-for-testing-only';
    process.env.HASH_SALT = process.env.HASH_SALT || 'test-hash-salt';
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires auth for protected routes', async () => {
    const res = await request(app).get('/api/social/events/nearby');
    expect(res.status).toBe(401);
  });

  it('creates an event', async () => {
    const res = await request(app)
      .post('/api/social/events')
      .set(auth())
      .send({ title: 'Mixer', category: 'social_party' });

    expect(res.status).toBe(201);
    expect(controller.createEvent).toHaveBeenCalled();
  });

  it('validates invalid event id for register endpoint', async () => {
    const res = await request(app).post('/api/social/events/bad-id/register').set(auth()).send({});

    expect(res.status).toBe(400);
    expect(controller.registerForEvent).not.toHaveBeenCalled();
  });

  it('registers for event with valid id', async () => {
    const eventId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).post(`/api/social/events/${eventId}/register`).set(auth()).send({});

    expect(res.status).toBe(200);
    expect(controller.registerForEvent).toHaveBeenCalled();
  });

  it('leaves event with valid id', async () => {
    const eventId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).post(`/api/social/events/${eventId}/leave`).set(auth()).send({});

    expect(res.status).toBe(200);
    expect(controller.leaveEvent).toHaveBeenCalled();
  });

  it('validates nearby events query params', async () => {
    const invalid = await request(app).get('/api/social/events/nearby?longitude=999').set(auth());
    expect(invalid.status).toBe(400);

    const valid = await request(app)
      .get('/api/social/events/nearby?longitude=-73.98&latitude=40.76&maxDistance=5000&page=1&limit=10')
      .set(auth());

    expect(valid.status).toBe(200);
    expect(controller.getNearbyEvents).toHaveBeenCalled();
  });

  it('routes group-date and review handlers', async () => {
    const gd = await request(app).post('/api/social/group-dates').set(auth()).send({});
    const review = await request(app).get('/api/social/reviews/507f1f77bcf86cd799439011').set(auth());

    expect(gd.status).toBe(201);
    expect(review.status).toBe(200);
    expect(controller.createGroupDate).toHaveBeenCalled();
    expect(controller.getUserReviews).toHaveBeenCalled();
  });

  it('routes shared-profile handlers', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const share = await request(app).post(`/api/social/share-profile/${userId}`).set(auth()).send({});
    const getShared = await request(app).get('/api/social/shared-profile/share-token-1').set(auth());

    expect(share.status).toBe(201);
    expect(getShared.status).toBe(200);
    expect(controller.createShareableProfileLink).toHaveBeenCalled();
    expect(controller.getSharedProfile).toHaveBeenCalled();
  });
});
