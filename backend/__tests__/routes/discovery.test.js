/**
 * Discovery API Tests
 * Comprehensive test suite for /api/discovery and /api/users endpoints
 */

const request = require('supertest');
const express = require('express');

const {
  generateTestToken,
  authHeader,
  assertUnauthorized,
  assertValidationError,
} = require('../utils/testHelpers');

const { discovery, users } = require('../utils/fixtures');

// Mock dependencies
jest.mock('../../models/User', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  aggregate: jest.fn(),
}));

jest.mock('../../models/Swipe', () => ({
  find: jest.fn(),
  distinct: jest.fn(),
}));

jest.mock('../../models/Match', () => ({
  findOne: jest.fn(),
}));

// Create test app for discovery routes
const createDiscoveryTestApp = () => {
  const app = express();
  app.use(express.json());

  const discoveryRoutes = require('../../routes/discovery');
  app.use('/api/discovery', discoveryRoutes);

  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  });

  return app;
};

// Create test app for users routes
const createUsersTestApp = () => {
  const app = express();
  app.use(express.json());

  const usersRoutes = require('../../routes/users');
  app.use('/api/users', usersRoutes);

  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  });

  return app;
};

describe('Discovery API Tests', () => {
  let app;
  const User = require('../../models/User');
  const Swipe = require('../../models/Swipe');

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    app = createDiscoveryTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/discovery/discover', () => {
    describe('Success Cases', () => {
      it('should return nearby users with valid location params', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          preferences: {
            ageRange: { min: 18, max: 50 },
            genderPreference: ['female', 'male'],
            maxDistance: 50,
          },
        });

        Swipe.distinct.mockResolvedValue(['already_swiped_user']);

        User.find.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([
            {
              _id: 'nearby_user_1',
              name: 'Nearby User 1',
              age: 25,
              location: { coordinates: [-73.935, 40.73] },
            },
            {
              _id: 'nearby_user_2',
              name: 'Nearby User 2',
              age: 28,
              location: { coordinates: [-73.936, 40.731] },
            },
          ]),
        });

        const response = await request(app)
          .get('/api/discovery/discover')
          .query(discovery.validLocationQuery)
          .set('x-user-id', 'user_id');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should exclude already swiped users', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          preferences: {},
        });

        Swipe.distinct.mockResolvedValue(['swiped_1', 'swiped_2']);

        User.find.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        });

        const response = await request(app)
          .get('/api/discovery/discover')
          .query(discovery.validLocationQuery)
          .set('x-user-id', 'user_id');

        expect(response.status).toBe(200);
      });

      it('should return empty array when no users in range', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          preferences: {},
        });

        Swipe.distinct.mockResolvedValue([]);

        User.find.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        });

        const response = await request(app)
          .get('/api/discovery/discover')
          .query(discovery.validLocationQuery)
          .set('x-user-id', 'user_id');

        expect(response.status).toBe(200);
        expect(response.body.data?.users || []).toEqual([]);
      });
    });

    describe('Validation Errors', () => {
      it('should reject invalid latitude (> 90)', async () => {
        const response = await request(app)
          .get('/api/discovery/discover')
          .query(discovery.invalidLatitude)
          .set('x-user-id', 'user_id');

        assertValidationError(response);
      });

      it('should reject invalid latitude (< -90)', async () => {
        const response = await request(app)
          .get('/api/discovery/discover')
          .query({ lat: -100, lng: -73.935, radius: 10000 })
          .set('x-user-id', 'user_id');

        assertValidationError(response);
      });

      it('should reject invalid longitude (> 180)', async () => {
        const response = await request(app)
          .get('/api/discovery/discover')
          .query(discovery.invalidLongitude)
          .set('x-user-id', 'user_id');

        assertValidationError(response);
      });

      it('should reject invalid longitude (< -180)', async () => {
        const response = await request(app)
          .get('/api/discovery/discover')
          .query({ lat: 40.73, lng: -200, radius: 10000 })
          .set('x-user-id', 'user_id');

        assertValidationError(response);
      });

      it('should reject invalid radius (> 50000)', async () => {
        const response = await request(app)
          .get('/api/discovery/discover')
          .query(discovery.invalidRadius)
          .set('x-user-id', 'user_id');

        assertValidationError(response);
      });

      it('should reject invalid radius (< 1)', async () => {
        const response = await request(app)
          .get('/api/discovery/discover')
          .query({ lat: 40.73, lng: -73.935, radius: 0 })
          .set('x-user-id', 'user_id');

        assertValidationError(response);
      });

      it('should reject missing latitude', async () => {
        const response = await request(app)
          .get('/api/discovery/discover')
          .query({ lng: -73.935, radius: 10000 })
          .set('x-user-id', 'user_id');

        assertValidationError(response);
      });

      it('should reject missing longitude', async () => {
        const response = await request(app)
          .get('/api/discovery/discover')
          .query({ lat: 40.73, radius: 10000 })
          .set('x-user-id', 'user_id');

        assertValidationError(response);
      });

      it('should reject missing radius', async () => {
        const response = await request(app)
          .get('/api/discovery/discover')
          .query({ lat: 40.73, lng: -73.935 })
          .set('x-user-id', 'user_id');

        assertValidationError(response);
      });

      it('should reject non-numeric latitude', async () => {
        const response = await request(app)
          .get('/api/discovery/discover')
          .query({ lat: 'not-a-number', lng: -73.935, radius: 10000 })
          .set('x-user-id', 'user_id');

        assertValidationError(response);
      });
    });
  });

  describe('GET /api/discovery/discover/settings', () => {
    describe('Success Cases', () => {
      it('should return user discovery settings', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          preferences: {
            ageRange: { min: 22, max: 35 },
            genderPreference: ['female'],
            maxDistance: 30,
          },
        });

        const response = await request(app)
          .get('/api/discovery/discover/settings')
          .set('x-user-id', 'user_id');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should return default settings for user without preferences', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
        });

        const response = await request(app)
          .get('/api/discovery/discover/settings')
          .set('x-user-id', 'user_id');

        expect(response.status).toBe(200);
      });
    });
  });

  describe('PUT /api/discovery/discover/location', () => {
    describe('Success Cases', () => {
      it('should update user location', async () => {
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          location: {
            type: 'Point',
            coordinates: [discovery.locationUpdate.longitude, discovery.locationUpdate.latitude],
          },
        });

        const response = await request(app)
          .put('/api/discovery/discover/location')
          .set('x-user-id', 'user_id')
          .send(discovery.locationUpdate);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('Validation Errors', () => {
      it('should reject invalid latitude', async () => {
        const response = await request(app)
          .put('/api/discovery/discover/location')
          .set('x-user-id', 'user_id')
          .send({ latitude: 100, longitude: -73.935 });

        assertValidationError(response);
      });

      it('should reject invalid longitude', async () => {
        const response = await request(app)
          .put('/api/discovery/discover/location')
          .set('x-user-id', 'user_id')
          .send({ latitude: 40.73, longitude: 200 });

        assertValidationError(response);
      });

      it('should reject missing coordinates', async () => {
        const response = await request(app)
          .put('/api/discovery/discover/location')
          .set('x-user-id', 'user_id')
          .send({});

        assertValidationError(response);
      });
    });
  });
});

describe('Users API Tests', () => {
  let app;
  const User = require('../../models/User');
  const Match = require('../../models/Match');
  const Swipe = require('../../models/Swipe');

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    app = createUsersTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users/discover', () => {
    describe('Success Cases', () => {
      it('should discover users with valid query params', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          preferences: {},
          blockedUsers: [],
        });

        Swipe.distinct.mockResolvedValue([]);

        User.find.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([{ _id: 'user_1', name: 'User 1', age: 25 }]),
        });

        const response = await request(app)
          .get('/api/users/discover')
          .query(discovery.validLocationQuery)
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });
    });

    describe('Unauthorized Access', () => {
      it('should reject unauthenticated request', async () => {
        const response = await request(app)
          .get('/api/users/discover')
          .query(discovery.validLocationQuery);

        assertUnauthorized(response);
      });
    });
  });

  describe('GET /api/users/:id', () => {
    describe('Success Cases', () => {
      it('should return user profile by ID', async () => {
        User.findById.mockImplementation((id) => {
          const result = {
            select: jest.fn().mockReturnThis(),
            maxTimeMS: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue({
              _id: id,
              name: 'Test User',
              age: 25,
              blockedUsers: [],
            }),
          };
          return result;
        });

        const response = await request(app)
          .get('/api/users/target_user_id')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('Not Found', () => {
      it('should return 404 for non-existent user', async () => {
        User.findById.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          maxTimeMS: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(null),
        });

        const response = await request(app)
          .get('/api/users/nonexistent_user')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(404);
      });
    });

    describe('Blocked Users', () => {
      it('should return 404 for blocked user', async () => {
        User.findById.mockImplementation((id) => {
          if (id === 'target_user_id') {
            return {
              select: jest.fn().mockReturnThis(),
              maxTimeMS: jest.fn().mockReturnThis(),
              lean: jest.fn().mockResolvedValue({
                _id: 'target_user_id',
                blockedUsers: ['current_user_id'],
              }),
            };
          }
          return {
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue({
              _id: 'current_user_id',
              blockedUsers: [],
            }),
          };
        });

        const response = await request(app)
          .get('/api/users/target_user_id')
          .set('Authorization', `Bearer ${generateTestToken({ userId: 'current_user_id' })}`);

        expect(response.status).toBe(404);
      });
    });

    describe('Unauthorized Access', () => {
      it('should reject unauthenticated request', async () => {
        const response = await request(app).get('/api/users/some_user_id');

        assertUnauthorized(response);
      });
    });
  });
});
