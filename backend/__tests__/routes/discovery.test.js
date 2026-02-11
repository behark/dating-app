const express = require('express');
const request = require('supertest');

const discoveryController = {
  discoverUsers: jest.fn((req, res) => res.status(200).json({ success: true, data: { users: [] } })),
  getDiscoverySettings: jest.fn((req, res) => res.status(200).json({ success: true, data: { radius: 5000 } })),
  updateLocation: jest.fn((req, res) => res.status(200).json({ success: true })),
};

jest.mock('../../src/api/controllers/discoveryController', () => discoveryController);

jest.mock('../../src/api/middleware/apiCache', () => ({
  apiCache: jest.fn(() => (req, res, next) => next()),
  staleWhileRevalidate: jest.fn(() => (req, res, next) => next()),
}));

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
  app.use('/api/discovery', require('../../routes/discovery'));
  return app;
};

describe('discovery routes', () => {
  let app;
  const auth = { Authorization: 'Bearer token' };

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/discovery/discover?lat=1&lng=2&radius=1000');
    expect(res.status).toBe(401);
  });

  it('validates discover query params', async () => {
    const invalidLat = await request(app)
      .get('/api/discovery/discover?lat=100&lng=2&radius=1000')
      .set(auth);
    const missingRadius = await request(app).get('/api/discovery/discover?lat=1&lng=2').set(auth);

    expect(invalidLat.status).toBe(400);
    expect(missingRadius.status).toBe(400);
  });

  it('serves discover and settings endpoints', async () => {
    const discover = await request(app)
      .get('/api/discovery/discover?lat=37.7&lng=-122.4&radius=5000')
      .set(auth);
    const settings = await request(app).get('/api/discovery/discover/settings').set(auth);

    expect(discover.status).toBe(200);
    expect(settings.status).toBe(200);
    expect(discoveryController.discoverUsers).toHaveBeenCalled();
    expect(discoveryController.getDiscoverySettings).toHaveBeenCalled();
  });

  it('validates and updates location', async () => {
    const invalid = await request(app)
      .put('/api/discovery/discover/location')
      .set(auth)
      .send({ latitude: 200, longitude: 0 });
    const valid = await request(app)
      .put('/api/discovery/discover/location')
      .set(auth)
      .send({ latitude: 37.7, longitude: -122.4 });

    expect(invalid.status).toBe(400);
    expect(valid.status).toBe(200);
    expect(discoveryController.updateLocation).toHaveBeenCalled();
  });
});
