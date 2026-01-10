/**
 * Notifications API Tests
 * Comprehensive test suite for /api/notifications endpoints
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

jest.mock('../../src/core/domain/Notification', () => {
  const mockNotification = {
    save: jest.fn().mockResolvedValue(true),
  };
  const NotificationConstructor = jest.fn(() => mockNotification);
  NotificationConstructor.find = jest.fn();
  NotificationConstructor.findById = jest.fn();
  NotificationConstructor.findByIdAndUpdate = jest.fn();
  NotificationConstructor.findByIdAndDelete = jest.fn();
  NotificationConstructor.deleteMany = jest.fn();
  NotificationConstructor.countDocuments = jest.fn();
  NotificationConstructor.updateMany = jest.fn();
  return NotificationConstructor;
});

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  const notificationRoutes = require('../../routes/notifications');
  app.use('/api/notifications', notificationRoutes);

  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  });

  return app;
};

describe('Notifications API Tests', () => {
  let app;
  const Notification = require('../../src/core/domain/Notification');
  const User = require('../../src/core/domain/User');

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/notifications', () => {
    describe('Success Cases', () => {
      it('should return list of notifications', async () => {
        Notification.find.mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue([
                    {
                      _id: 'notif_1',
                      type: 'match',
                      title: 'New Match!',
                      body: 'You matched with Sarah',
                      read: false,
                      createdAt: new Date(),
                    },
                    {
                      _id: 'notif_2',
                      type: 'message',
                      title: 'New Message',
                      body: 'Sarah sent you a message',
                      read: true,
                      createdAt: new Date(),
                    },
                  ]),
                }),
              }),
            }),
          }),
        });

        Notification.countDocuments.mockResolvedValue(2);

        const response = await request(app)
          .get('/api/notifications')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.notifications)).toBe(true);
      });

      it('should support pagination', async () => {
        Notification.find.mockReturnValue({
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

        Notification.countDocuments.mockResolvedValue(100);

        const response = await request(app)
          .get('/api/notifications?page=2&limit=10')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });

      it('should filter by notification type', async () => {
        Notification.find.mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue([{ _id: 'notif_1', type: 'match' }]),
                }),
              }),
            }),
          }),
        });

        Notification.countDocuments.mockResolvedValue(1);

        const response = await request(app)
          .get('/api/notifications?type=match')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(Notification.find).toHaveBeenCalled();
      });

      it('should filter by read status', async () => {
        Notification.find.mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue([{ _id: 'notif_1', read: false }]),
                }),
              }),
            }),
          }),
        });

        Notification.countDocuments.mockResolvedValue(1);

        const response = await request(app)
          .get('/api/notifications?read=false')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });
    });

    describe('Unauthorized Access', () => {
      it('should reject unauthenticated request', async () => {
        const response = await request(app).get('/api/notifications');
        assertUnauthorized(response);
      });
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    describe('Success Cases', () => {
      it('should return unread notification count', async () => {
        Notification.countDocuments.mockResolvedValue(5);

        const response = await request(app)
          .get('/api/notifications/unread-count')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.count).toBe(5);
      });

      it('should return zero for no unread notifications', async () => {
        Notification.countDocuments.mockResolvedValue(0);

        const response = await request(app)
          .get('/api/notifications/unread-count')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.data.count).toBe(0);
      });
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    describe('Success Cases', () => {
      it('should mark notification as read', async () => {
        Notification.findByIdAndUpdate.mockResolvedValue({
          _id: 'notif_id',
          user: 'user_id',
          read: true,
          readAt: new Date(),
        });

        const response = await request(app)
          .put('/api/notifications/notif_id/read')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('Error Cases', () => {
      it('should return 404 for non-existent notification', async () => {
        Notification.findByIdAndUpdate.mockResolvedValue(null);

        const response = await request(app)
          .put('/api/notifications/nonexistent/read')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(404);
      });
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    describe('Success Cases', () => {
      it('should mark all notifications as read', async () => {
        Notification.updateMany.mockResolvedValue({
          modifiedCount: 10,
        });

        const response = await request(app)
          .put('/api/notifications/read-all')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    describe('Success Cases', () => {
      it('should delete a notification', async () => {
        Notification.findByIdAndDelete.mockResolvedValue({
          _id: 'notif_id',
          user: 'user_id',
        });

        const response = await request(app)
          .delete('/api/notifications/notif_id')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('Error Cases', () => {
      it('should return 404 for non-existent notification', async () => {
        Notification.findByIdAndDelete.mockResolvedValue(null);

        const response = await request(app)
          .delete('/api/notifications/nonexistent')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(404);
      });
    });
  });

  describe('DELETE /api/notifications', () => {
    describe('Success Cases', () => {
      it('should delete all notifications', async () => {
        Notification.deleteMany.mockResolvedValue({
          deletedCount: 25,
        });

        const response = await request(app)
          .delete('/api/notifications')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Notification Settings', () => {
    describe('GET /api/notifications/settings', () => {
      it('should return notification settings', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          notificationSettings: {
            matches: true,
            messages: true,
            likes: true,
            superLikes: true,
            promotions: false,
            reminders: true,
            sound: true,
            vibration: true,
          },
        });

        const response = await request(app)
          .get('/api/notifications/settings')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('PUT /api/notifications/settings', () => {
      it('should update notification settings', async () => {
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          notificationSettings: {
            matches: true,
            messages: false,
            promotions: false,
          },
        });

        const response = await request(app)
          .put('/api/notifications/settings')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            matches: true,
            messages: false,
            promotions: false,
          });

        expect(response.status).toBe(200);
      });

      it('should update individual settings', async () => {
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          notificationSettings: {
            sound: false,
          },
        });

        const response = await request(app)
          .put('/api/notifications/settings')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ sound: false });

        expect(response.status).toBe(200);
      });
    });
  });

  describe('Push Token Management', () => {
    describe('POST /api/notifications/push-token', () => {
      it('should register push token', async () => {
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          pushTokens: ['ExponentPushToken[xxx]'],
        });

        const response = await request(app)
          .post('/api/notifications/push-token')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            token: 'ExponentPushToken[xxx]',
            platform: 'ios',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should support FCM tokens', async () => {
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
        });

        const response = await request(app)
          .post('/api/notifications/push-token')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            token: 'fcm-token-xxx',
            platform: 'android',
          });

        expect(response.status).toBe(200);
      });
    });

    describe('DELETE /api/notifications/push-token', () => {
      it('should remove push token', async () => {
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          pushTokens: [],
        });

        const response = await request(app)
          .delete('/api/notifications/push-token')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ token: 'ExponentPushToken[xxx]' });

        expect(response.status).toBe(200);
      });
    });
  });

  describe('Notification Types', () => {
    const notificationTypes = [
      'match',
      'message',
      'like',
      'superLike',
      'boost',
      'profileView',
      'reminder',
      'promotion',
      'safety',
      'system',
    ];

    it('should handle all notification types', async () => {
      for (const type of notificationTypes) {
        Notification.find.mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue([{ _id: `notif_${type}`, type }]),
                }),
              }),
            }),
          }),
        });

        Notification.countDocuments.mockResolvedValue(1);

        const response = await request(app)
          .get(`/api/notifications?type=${type}`)
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      }
    });
  });
});
