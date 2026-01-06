/**
 * Swipe API Tests
 * Comprehensive test suite for /api/swipes endpoints
 */

const request = require('supertest');
const express = require('express');

const {
  generateTestToken,
  authHeader,
  assertUnauthorized,
  assertValidationError,
  assertRateLimited,
} = require('../utils/testHelpers');

const { swipes, users } = require('../utils/fixtures');

// Mock dependencies
jest.mock('../../models/User', () => ({
  findById: jest.fn(),
}));

jest.mock('../../models/Swipe', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  aggregate: jest.fn(),
  countDocuments: jest.fn(),
}));

jest.mock('../../models/Match', () => ({
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  const swipeRoutes = require('../../routes/swipe');
  app.use('/api/swipes', swipeRoutes);

  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  });

  return app;
};

describe('Swipe API Tests', () => {
  let app;
  const User = require('../../models/User');
  const Swipe = require('../../models/Swipe');
  const Match = require('../../models/Match');

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/swipes', () => {
    describe('Success Cases', () => {
      it('should create a like swipe', async () => {
        User.findById.mockResolvedValue({
          _id: 'target_user_id',
          name: 'Target User',
        });

        Swipe.findOne.mockResolvedValue(null);
        Swipe.create.mockResolvedValue({
          _id: 'swipe_id',
          userId: 'user_id',
          targetId: swipes.validLike.targetId,
          action: 'like',
        });

        const response = await request(app)
          .post('/api/swipes')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send(swipes.validLike);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      it('should create a pass swipe', async () => {
        User.findById.mockResolvedValue({
          _id: 'target_user_id',
          name: 'Target User',
        });

        Swipe.findOne.mockResolvedValue(null);
        Swipe.create.mockResolvedValue({
          _id: 'swipe_id',
          userId: 'user_id',
          targetId: swipes.validPass.targetId,
          action: 'pass',
        });

        const response = await request(app)
          .post('/api/swipes')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send(swipes.validPass);

        expect(response.status).toBe(201);
      });

      it('should detect and return match when both users like each other', async () => {
        User.findById.mockResolvedValue({
          _id: 'target_user_id',
          name: 'Target User',
        });

        // Target user already liked current user
        Swipe.findOne.mockImplementation((query) => {
          if (query.userId === 'target_user_id') {
            return Promise.resolve({
              userId: 'target_user_id',
              targetId: 'user_id',
              action: 'like',
            });
          }
          return Promise.resolve(null);
        });

        Swipe.create.mockResolvedValue({
          _id: 'swipe_id',
          userId: 'user_id',
          targetId: swipes.validLike.targetId,
          action: 'like',
        });

        Match.create.mockResolvedValue({
          _id: 'match_id',
          users: ['user_id', 'target_user_id'],
          status: 'active',
        });

        const response = await request(app)
          .post('/api/swipes')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send(swipes.validLike);

        expect(response.status).toBe(201);
        expect(response.body.isMatch).toBe(true);
      });

      it('should handle superlike swipe', async () => {
        User.findById.mockResolvedValue({
          _id: 'target_user_id',
          name: 'Target User',
        });

        Swipe.findOne.mockResolvedValue(null);
        Swipe.create.mockResolvedValue({
          _id: 'swipe_id',
          userId: 'user_id',
          targetId: swipes.validSuperLike.targetId,
          action: 'superlike',
        });

        const response = await request(app)
          .post('/api/swipes')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send(swipes.validSuperLike);

        expect(response.status).toBe(201);
      });

      it('should handle priority like for premium users', async () => {
        User.findById.mockImplementation((id) => {
          if (id === 'target_user_id') {
            return Promise.resolve({
              _id: 'target_user_id',
              name: 'Target User',
            });
          }
          return Promise.resolve({
            _id: 'user_id',
            subscription: { tier: 'gold' },
          });
        });

        Swipe.findOne.mockResolvedValue(null);
        Swipe.create.mockResolvedValue({
          _id: 'swipe_id',
          userId: 'user_id',
          targetId: swipes.priorityLike.targetId,
          action: 'like',
          isPriority: true,
        });

        const response = await request(app)
          .post('/api/swipes')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send(swipes.priorityLike);

        expect(response.status).toBe(201);
      });
    });

    describe('Validation Errors', () => {
      it('should reject swipe without targetId', async () => {
        const response = await request(app)
          .post('/api/swipes')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send(swipes.invalidNoTarget);

        expect(response.status).toBe(400);
      });

      it('should reject swipe without action', async () => {
        const response = await request(app)
          .post('/api/swipes')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send(swipes.invalidNoAction);

        expect(response.status).toBe(400);
      });

      it('should reject swipe with invalid action', async () => {
        const response = await request(app)
          .post('/api/swipes')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send(swipes.invalidAction);

        expect(response.status).toBe(400);
      });

      it('should reject self-swipe', async () => {
        const userId = 'self_user_id';

        const response = await request(app)
          .post('/api/swipes')
          .set('Authorization', `Bearer ${generateTestToken({ userId })}`)
          .send({
            targetId: userId,
            action: 'like',
          });

        expect(response.status).toBe(400);
      });
    });

    describe('Duplicate Swipe Prevention', () => {
      it('should reject duplicate swipe on same user', async () => {
        Swipe.findOne.mockResolvedValue({
          _id: 'existing_swipe',
          userId: 'user_id',
          targetId: swipes.validLike.targetId,
        });

        const response = await request(app)
          .post('/api/swipes')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send(swipes.validLike);

        expect(response.status).toBe(400);
      });
    });

    describe('Unauthorized Access', () => {
      it('should reject unauthenticated request', async () => {
        const response = await request(app).post('/api/swipes').send(swipes.validLike);

        assertUnauthorized(response);
      });
    });

    describe('Target User Validation', () => {
      it('should reject swipe on non-existent user', async () => {
        User.findById.mockResolvedValue(null);

        const response = await request(app)
          .post('/api/swipes')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send(swipes.validLike);

        expect(response.status).toBe(404);
      });
    });
  });

  describe('GET /api/swipes/count/today', () => {
    describe('Success Cases', () => {
      it('should return swipe count for today', async () => {
        Swipe.countDocuments.mockResolvedValue(25);

        const response = await request(app)
          .get('/api/swipes/count/today')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.count).toBeDefined();
      });

      it('should return 0 for user with no swipes today', async () => {
        Swipe.countDocuments.mockResolvedValue(0);

        const response = await request(app)
          .get('/api/swipes/count/today')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.count).toBe(0);
      });
    });

    describe('Unauthorized Access', () => {
      it('should reject unauthenticated request', async () => {
        const response = await request(app).get('/api/swipes/count/today');

        assertUnauthorized(response);
      });
    });
  });

  describe('POST /api/swipes/undo', () => {
    describe('Success Cases', () => {
      it('should undo most recent swipe', async () => {
        Swipe.findOne.mockResolvedValue({
          _id: 'swipe_id',
          userId: 'user_id',
          targetId: 'target_id',
          action: 'pass',
          deleteOne: jest.fn().mockResolvedValue(true),
        });

        const response = await request(app)
          .post('/api/swipes/undo')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ swipeId: 'swipe_id' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('Edge Cases', () => {
      it('should reject undo for non-existent swipe', async () => {
        Swipe.findOne.mockResolvedValue(null);

        const response = await request(app)
          .post('/api/swipes/undo')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ swipeId: 'nonexistent_swipe' });

        expect(response.status).toBe(404);
      });

      it("should reject undo for another user's swipe", async () => {
        Swipe.findOne.mockResolvedValue({
          _id: 'swipe_id',
          userId: 'other_user_id',
          targetId: 'target_id',
        });

        const response = await request(app)
          .post('/api/swipes/undo')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ swipeId: 'swipe_id' });

        expect(response.status).toBe(403);
      });
    });
  });

  describe('GET /api/swipes/user', () => {
    describe('Success Cases', () => {
      it("should return user's swipes", async () => {
        Swipe.find.mockReturnValue({
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([
            { _id: 'swipe_1', targetId: 'target_1', action: 'like' },
            { _id: 'swipe_2', targetId: 'target_2', action: 'pass' },
          ]),
        });

        const response = await request(app)
          .get('/api/swipes/user')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.swipes).toBeDefined();
        expect(Array.isArray(response.body.swipes)).toBe(true);
      });

      it('should return empty array for user with no swipes', async () => {
        Swipe.find.mockReturnValue({
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        });

        const response = await request(app)
          .get('/api/swipes/user')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.swipes).toEqual([]);
      });
    });
  });

  describe('GET /api/swipes/received', () => {
    describe('Success Cases', () => {
      it('should return received likes', async () => {
        Swipe.find.mockReturnValue({
          sort: jest.fn().mockReturnThis(),
          populate: jest.fn().mockReturnThis(),
          lean: jest
            .fn()
            .mockResolvedValue([{ _id: 'swipe_1', userId: 'liker_1', action: 'like' }]),
        });

        const response = await request(app)
          .get('/api/swipes/received')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });
    });
  });

  describe('GET /api/swipes/stats', () => {
    describe('Success Cases', () => {
      it('should return swipe statistics', async () => {
        Swipe.aggregate.mockResolvedValue([
          { _id: 'like', count: 50 },
          { _id: 'pass', count: 30 },
        ]);

        const response = await request(app)
          .get('/api/swipes/stats')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.stats).toBeDefined();
      });
    });
  });

  describe('GET /api/swipes/pending-likes', () => {
    describe('Success Cases', () => {
      it('should return pending likes for premium user', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          subscription: { tier: 'gold' },
        });

        Swipe.find.mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          lean: jest
            .fn()
            .mockResolvedValue([{ _id: 'like_1', userId: { _id: 'liker_1', name: 'Liker' } }]),
        });

        const response = await request(app)
          .get('/api/swipes/pending-likes')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });

      it('should return only count for free user', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          subscription: { tier: 'free' },
        });

        Swipe.countDocuments.mockResolvedValue(5);

        const response = await request(app)
          .get('/api/swipes/pending-likes')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.count).toBeDefined();
      });
    });
  });

  describe('GET /api/swipes/matches', () => {
    describe('Success Cases', () => {
      it('should return all matches', async () => {
        Match.find.mockReturnValue({
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([
            {
              _id: 'match_1',
              users: ['user_id', 'matched_user_1'],
              status: 'active',
            },
          ]),
        });

        const response = await request(app)
          .get('/api/swipes/matches')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.matches).toBeDefined();
      });

      it('should filter by status', async () => {
        Match.find.mockReturnValue({
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        });

        const response = await request(app)
          .get('/api/swipes/matches')
          .query({ status: 'active' })
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });
    });
  });

  describe('DELETE /api/swipes/matches/:matchId', () => {
    describe('Success Cases', () => {
      it('should unmatch successfully', async () => {
        Match.findById.mockResolvedValue({
          _id: 'match_id',
          users: ['user_id', 'other_user_id'],
          status: 'active',
        });

        Match.findByIdAndUpdate.mockResolvedValue({
          _id: 'match_id',
          status: 'unmatched',
        });

        const response = await request(app)
          .delete('/api/swipes/matches/match_id')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });
    });

    describe('Edge Cases', () => {
      it('should reject unmatch for non-existent match', async () => {
        Match.findById.mockResolvedValue(null);

        const response = await request(app)
          .delete('/api/swipes/matches/nonexistent_match')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(404);
      });

      it('should reject unmatch for match user is not part of', async () => {
        Match.findById.mockResolvedValue({
          _id: 'match_id',
          users: ['other_user_1', 'other_user_2'],
          status: 'active',
        });

        const response = await request(app)
          .delete('/api/swipes/matches/match_id')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(403);
      });
    });
  });
});
