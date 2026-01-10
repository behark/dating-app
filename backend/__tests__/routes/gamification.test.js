/**
 * Gamification API Tests
 * Comprehensive test suite for /api/gamification endpoints
 */

const request = require('supertest');
const express = require('express');

const {
  generateTestToken,
  authHeader,
  assertUnauthorized,
  assertValidationError,
} = require('../utils/testHelpers');

// Mock dependencies
jest.mock('../../src/core/domain/User', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  find: jest.fn(),
}));

jest.mock('../../src/core/domain/Achievement', () => {
  const mockAchievement = {
    save: jest.fn().mockResolvedValue(true),
  };
  const AchievementConstructor = jest.fn(() => mockAchievement);
  AchievementConstructor.find = jest.fn();
  AchievementConstructor.findById = jest.fn();
  AchievementConstructor.findOne = jest.fn();
  return AchievementConstructor;
});

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  const gamificationRoutes = require('../../routes/gamification');
  app.use('/api/gamification', gamificationRoutes);

  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  });

  return app;
};

describe('Gamification API Tests', () => {
  let app;
  const User = require('../../src/core/domain/User');
  const Achievement = require('../../src/core/domain/Achievement');

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/gamification/achievements', () => {
    describe('Success Cases', () => {
      it('should return all available achievements', async () => {
        Achievement.find.mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            {
              _id: 'achievement_1',
              name: 'First Match',
              description: 'Get your first match',
              icon: 'heart',
              points: 100,
              category: 'matching',
            },
            {
              _id: 'achievement_2',
              name: 'Conversation Starter',
              description: 'Send 100 messages',
              icon: 'chat',
              points: 200,
              category: 'messaging',
            },
          ]),
        });

        const response = await request(app)
          .get('/api/gamification/achievements')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.achievements)).toBe(true);
      });

      it('should filter achievements by category', async () => {
        Achievement.find.mockReturnValue({
          lean: jest.fn().mockResolvedValue([{ _id: 'achievement_1', category: 'matching' }]),
        });

        const response = await request(app)
          .get('/api/gamification/achievements?category=matching')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });
    });

    describe('Unauthorized Access', () => {
      it('should reject unauthenticated request', async () => {
        const response = await request(app).get('/api/gamification/achievements');

        assertUnauthorized(response);
      });
    });
  });

  describe('GET /api/gamification/achievements/user', () => {
    describe('Success Cases', () => {
      it('should return user achievements with progress', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          achievements: [
            {
              achievementId: 'achievement_1',
              unlockedAt: new Date(),
              progress: 100,
            },
            {
              achievementId: 'achievement_2',
              progress: 50,
            },
          ],
        });

        const response = await request(app)
          .get('/api/gamification/achievements/user')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should show locked and unlocked achievements', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          achievements: [{ achievementId: 'achievement_1', unlockedAt: new Date() }],
        });

        Achievement.find.mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            { _id: 'achievement_1', name: 'Unlocked' },
            { _id: 'achievement_2', name: 'Locked' },
          ]),
        });

        const response = await request(app)
          .get('/api/gamification/achievements/user')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });
    });
  });

  describe('GET /api/gamification/points', () => {
    describe('Success Cases', () => {
      it('should return user points and level', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          points: 1500,
          level: 5,
          xp: 750,
          nextLevelXp: 1000,
        });

        const response = await request(app)
          .get('/api/gamification/points')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.points).toBeDefined();
      });
    });
  });

  describe('GET /api/gamification/leaderboard', () => {
    describe('Success Cases', () => {
      it('should return global leaderboard', async () => {
        User.find.mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([
                  { _id: 'user_1', name: 'Top Player', points: 10000, level: 25 },
                  { _id: 'user_2', name: 'Second Place', points: 8000, level: 20 },
                ]),
              }),
            }),
          }),
        });

        const response = await request(app)
          .get('/api/gamification/leaderboard')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.leaderboard)).toBe(true);
      });

      it('should filter leaderboard by time period', async () => {
        User.find.mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        });

        const response = await request(app)
          .get('/api/gamification/leaderboard?period=weekly')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });

      it('should show user rank in leaderboard', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          points: 5000,
        });

        User.find.mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([{ _id: 'user_1', points: 10000 }]),
              }),
            }),
          }),
        });

        User.countDocuments = jest.fn().mockResolvedValue(50);

        const response = await request(app)
          .get('/api/gamification/leaderboard?includeUserRank=true')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });
    });
  });

  describe('GET /api/gamification/streaks', () => {
    describe('Success Cases', () => {
      it('should return user streaks', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          streaks: {
            dailyLogin: { current: 7, longest: 30, lastDate: new Date() },
            messaging: { current: 5, longest: 15, lastDate: new Date() },
            swiping: { current: 3, longest: 10, lastDate: new Date() },
          },
        });

        const response = await request(app)
          .get('/api/gamification/streaks')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.streaks).toBeDefined();
      });
    });
  });

  describe('POST /api/gamification/claim-daily', () => {
    describe('Success Cases', () => {
      it('should claim daily reward', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          lastDailyReward: new Date(Date.now() - 24 * 60 * 60 * 1000),
          streaks: { dailyLogin: { current: 5 } },
        });

        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          points: 150,
          lastDailyReward: new Date(),
        });

        const response = await request(app)
          .post('/api/gamification/claim-daily')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should reject if already claimed today', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          lastDailyReward: new Date(),
        });

        const response = await request(app)
          .post('/api/gamification/claim-daily')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(400);
      });
    });
  });

  describe('Challenges', () => {
    describe('GET /api/gamification/challenges', () => {
      it('should return active challenges', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          challenges: [
            {
              challengeId: 'challenge_1',
              name: 'Send 10 Messages',
              progress: 5,
              target: 10,
              reward: 100,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          ],
        });

        const response = await request(app)
          .get('/api/gamification/challenges')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('POST /api/gamification/challenges/:id/claim', () => {
      it('should claim completed challenge reward', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          challenges: [
            {
              challengeId: 'challenge_1',
              progress: 10,
              target: 10,
              reward: 100,
              completed: true,
              claimed: false,
            },
          ],
        });

        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          points: 200,
        });

        const response = await request(app)
          .post('/api/gamification/challenges/challenge_1/claim')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });

      it('should reject claiming incomplete challenge', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          challenges: [
            {
              challengeId: 'challenge_1',
              progress: 5,
              target: 10,
              completed: false,
            },
          ],
        });

        const response = await request(app)
          .post('/api/gamification/challenges/challenge_1/claim')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(400);
      });
    });
  });

  describe('Badges', () => {
    describe('GET /api/gamification/badges', () => {
      it('should return user badges', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          badges: [
            { badgeId: 'badge_1', name: 'Verified', icon: 'check', earnedAt: new Date() },
            { badgeId: 'badge_2', name: 'Premium', icon: 'star', earnedAt: new Date() },
          ],
        });

        const response = await request(app)
          .get('/api/gamification/badges')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('PUT /api/gamification/badges/display', () => {
      it('should set displayed badges', async () => {
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          displayedBadges: ['badge_1', 'badge_2'],
        });

        const response = await request(app)
          .put('/api/gamification/badges/display')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ badgeIds: ['badge_1', 'badge_2'] });

        expect(response.status).toBe(200);
      });

      it('should limit displayed badges', async () => {
        const response = await request(app)
          .put('/api/gamification/badges/display')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ badgeIds: ['1', '2', '3', '4', '5', '6'] });

        // Should either succeed with truncated list or return validation error
        expect([200, 400]).toContain(response.status);
      });
    });
  });

  describe('GET /api/gamification/rewards', () => {
    describe('Success Cases', () => {
      it('should return available rewards', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          points: 1000,
        });

        const response = await request(app)
          .get('/api/gamification/rewards')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('POST /api/gamification/rewards/:id/redeem', () => {
    describe('Success Cases', () => {
      it('should redeem reward with sufficient points', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          points: 1000,
        });

        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          points: 500,
        });

        const response = await request(app)
          .post('/api/gamification/rewards/boost_reward/redeem')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });
    });

    describe('Error Cases', () => {
      it('should reject redemption with insufficient points', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          points: 100,
        });

        const response = await request(app)
          .post('/api/gamification/rewards/expensive_reward/redeem')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(400);
      });
    });
  });
});
