/**
 * Activity API Tests
 * Comprehensive test suite for /api/activity endpoints
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
}));

jest.mock('../../src/core/domain/Activity', () => {
  const mockActivity = {
    save: jest.fn().mockResolvedValue(true),
  };
  const ActivityConstructor = jest.fn(() => mockActivity);
  ActivityConstructor.find = jest.fn();
  ActivityConstructor.findById = jest.fn();
  ActivityConstructor.aggregate = jest.fn();
  ActivityConstructor.countDocuments = jest.fn();
  return ActivityConstructor;
});

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  const activityRoutes = require('../../routes/activity');
  app.use('/api/activity', activityRoutes);

  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  });

  return app;
};

describe('Activity API Tests', () => {
  let app;
  const User = require('../../src/core/domain/User');
  const Activity = require('../../src/core/domain/Activity');

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/activity', () => {
    describe('Success Cases', () => {
      it('should return user activity feed', async () => {
        Activity.find.mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue([
                    {
                      _id: 'activity_1',
                      type: 'profile_view',
                      user: { _id: 'viewer_id', name: 'Viewer' },
                      createdAt: new Date(),
                    },
                    {
                      _id: 'activity_2',
                      type: 'like_received',
                      user: { _id: 'liker_id', name: 'Liker' },
                      createdAt: new Date(),
                    },
                  ]),
                }),
              }),
            }),
          }),
        });

        Activity.countDocuments.mockResolvedValue(2);

        const response = await request(app)
          .get('/api/activity')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.activities)).toBe(true);
      });

      it('should support pagination', async () => {
        Activity.find.mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        });

        Activity.countDocuments.mockResolvedValue(50);

        const response = await request(app)
          .get('/api/activity?page=2&limit=10')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });

      it('should filter by activity type', async () => {
        Activity.find.mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue([{ _id: 'activity_1', type: 'like_received' }]),
                }),
              }),
            }),
          }),
        });

        Activity.countDocuments.mockResolvedValue(1);

        const response = await request(app)
          .get('/api/activity?type=like_received')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });

      it('should filter by date range', async () => {
        Activity.find.mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        });

        Activity.countDocuments.mockResolvedValue(0);

        const response = await request(app)
          .get('/api/activity?startDate=2024-01-01&endDate=2024-12-31')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });
    });

    describe('Unauthorized Access', () => {
      it('should reject unauthenticated request', async () => {
        const response = await request(app).get('/api/activity');
        assertUnauthorized(response);
      });
    });
  });

  describe('GET /api/activity/profile-views', () => {
    describe('Success Cases', () => {
      it('should return profile views', async () => {
        Activity.find.mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue([
                    {
                      _id: 'view_1',
                      type: 'profile_view',
                      viewedBy: { _id: 'viewer_1', name: 'Sarah', photos: [] },
                      viewedAt: new Date(),
                    },
                  ]),
                }),
              }),
            }),
          }),
        });

        const response = await request(app)
          .get('/api/activity/profile-views')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should return profile views with premium user details', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          isPremium: true,
          premiumFeatures: { seeWhoViewsYou: true },
        });

        Activity.find.mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue([
                    {
                      _id: 'view_1',
                      viewedBy: { _id: 'viewer_1', name: 'Sarah' },
                    },
                  ]),
                }),
              }),
            }),
          }),
        });

        const response = await request(app)
          .get('/api/activity/profile-views')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });
    });
  });

  describe('GET /api/activity/stats', () => {
    describe('Success Cases', () => {
      it('should return activity statistics', async () => {
        Activity.aggregate.mockResolvedValue([
          { _id: 'profile_view', count: 50 },
          { _id: 'like_received', count: 25 },
          { _id: 'match', count: 10 },
          { _id: 'message_sent', count: 100 },
        ]);

        const response = await request(app)
          .get('/api/activity/stats')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.stats).toBeDefined();
      });

      it('should return stats for specific time period', async () => {
        Activity.aggregate.mockResolvedValue([{ _id: 'profile_view', count: 10 }]);

        const response = await request(app)
          .get('/api/activity/stats?period=week')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });

      it('should support different stat periods', async () => {
        const periods = ['day', 'week', 'month', 'year', 'all'];

        for (const period of periods) {
          Activity.aggregate.mockResolvedValue([]);

          const response = await request(app)
            .get(`/api/activity/stats?period=${period}`)
            .set('Authorization', `Bearer ${generateTestToken()}`);

          expect(response.status).toBe(200);
        }
      });
    });
  });

  describe('GET /api/activity/insights', () => {
    describe('Success Cases', () => {
      it('should return user insights', async () => {
        Activity.aggregate.mockResolvedValue([
          {
            mostActiveDay: 'Friday',
            mostActiveHour: 20,
            avgDailySwipes: 25,
            matchRate: 0.15,
            responseRate: 0.8,
          },
        ]);

        const response = await request(app)
          .get('/api/activity/insights')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('POST /api/activity/log', () => {
    describe('Success Cases', () => {
      it('should log app activity', async () => {
        const response = await request(app)
          .post('/api/activity/log')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            type: 'screen_view',
            data: { screen: 'discover' },
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should log different activity types', async () => {
        const activityTypes = [
          'screen_view',
          'profile_interaction',
          'search_performed',
          'filter_applied',
          'feature_used',
        ];

        for (const type of activityTypes) {
          const response = await request(app)
            .post('/api/activity/log')
            .set('Authorization', `Bearer ${generateTestToken()}`)
            .send({ type, data: {} });

          expect(response.status).toBe(200);
        }
      });
    });

    describe('Validation', () => {
      it('should require activity type', async () => {
        const response = await request(app)
          .post('/api/activity/log')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({});

        expect(response.status).toBe(400);
      });
    });
  });

  describe('PUT /api/activity/online-status', () => {
    describe('Success Cases', () => {
      it('should update online status', async () => {
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          isOnline: true,
          lastActive: new Date(),
        });

        const response = await request(app)
          .put('/api/activity/online-status')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ isOnline: true });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should set user as offline', async () => {
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          isOnline: false,
          lastActive: new Date(),
        });

        const response = await request(app)
          .put('/api/activity/online-status')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ isOnline: false });

        expect(response.status).toBe(200);
      });
    });
  });

  describe('GET /api/activity/timeline', () => {
    describe('Success Cases', () => {
      it('should return activity timeline', async () => {
        Activity.find.mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([
                {
                  _id: 'activity_1',
                  type: 'match',
                  createdAt: new Date(),
                  relatedUser: { name: 'Sarah' },
                },
                {
                  _id: 'activity_2',
                  type: 'message_sent',
                  createdAt: new Date(Date.now() - 3600000),
                },
              ]),
            }),
          }),
        });

        const response = await request(app)
          .get('/api/activity/timeline')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('DELETE /api/activity', () => {
    describe('Success Cases', () => {
      it('should clear activity history', async () => {
        Activity.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 100 });

        const response = await request(app)
          .delete('/api/activity')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Activity Types', () => {
    const activityTypes = [
      'profile_view',
      'like_received',
      'like_sent',
      'match',
      'unmatch',
      'message_sent',
      'message_received',
      'super_like_received',
      'boost_activated',
      'profile_updated',
    ];

    it('should handle all activity types', async () => {
      for (const type of activityTypes) {
        Activity.find.mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue([{ _id: `activity_${type}`, type }]),
                }),
              }),
            }),
          }),
        });

        Activity.countDocuments.mockResolvedValue(1);

        const response = await request(app)
          .get(`/api/activity?type=${type}`)
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      }
    });
  });
});
