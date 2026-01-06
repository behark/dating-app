/**
 * Social Features API Tests
 * Comprehensive test suite for /api/social endpoints
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
jest.mock('../../models/User', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  find: jest.fn(),
}));

jest.mock('../../models/Event', () => {
  const mockEvent = {
    save: jest.fn().mockResolvedValue(true),
  };
  const EventConstructor = jest.fn(() => mockEvent);
  EventConstructor.find = jest.fn();
  EventConstructor.findById = jest.fn();
  EventConstructor.findByIdAndUpdate = jest.fn();
  EventConstructor.findByIdAndDelete = jest.fn();
  return EventConstructor;
});

jest.mock('../../models/Group', () => {
  const mockGroup = {
    save: jest.fn().mockResolvedValue(true),
  };
  const GroupConstructor = jest.fn(() => mockGroup);
  GroupConstructor.find = jest.fn();
  GroupConstructor.findById = jest.fn();
  GroupConstructor.findByIdAndUpdate = jest.fn();
  GroupConstructor.findByIdAndDelete = jest.fn();
  return GroupConstructor;
});

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  const socialRoutes = require('../../routes/socialFeatures');
  app.use('/api/social', socialRoutes);

  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  });

  return app;
};

describe('Social Features API Tests', () => {
  let app;
  const User = require('../../models/User');
  const Event = require('../../models/Event');
  const Group = require('../../models/Group');

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Events', () => {
    describe('GET /api/social/events', () => {
      it('should return list of events', async () => {
        Event.find.mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue([
                    {
                      _id: 'event_1',
                      title: 'Speed Dating Night',
                      description: 'Meet new people!',
                      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                      location: { city: 'New York' },
                      attendees: [],
                      maxAttendees: 50,
                    },
                  ]),
                }),
              }),
            }),
          }),
        });

        const response = await request(app)
          .get('/api/social/events')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.events)).toBe(true);
      });

      it('should filter events by location', async () => {
        Event.find.mockReturnValue({
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

        const response = await request(app)
          .get('/api/social/events?city=New%20York&radius=50')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });

      it('should filter events by date range', async () => {
        Event.find.mockReturnValue({
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

        const response = await request(app)
          .get('/api/social/events?startDate=2024-01-01&endDate=2024-12-31')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });

      it('should filter events by category', async () => {
        Event.find.mockReturnValue({
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

        const response = await request(app)
          .get('/api/social/events?category=speed-dating')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });
    });

    describe('POST /api/social/events', () => {
      it('should create a new event', async () => {
        const response = await request(app)
          .post('/api/social/events')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            title: 'Singles Mixer',
            description: 'A fun evening for singles',
            date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            location: {
              name: 'Downtown Bar',
              address: '123 Main St',
              city: 'Los Angeles',
              coordinates: { latitude: 34.05, longitude: -118.25 },
            },
            category: 'mixer',
            maxAttendees: 30,
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });

    describe('GET /api/social/events/:id', () => {
      it('should return event details', async () => {
        Event.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue({
              _id: 'event_1',
              title: 'Speed Dating',
              attendees: [{ _id: 'user_1' }],
            }),
          }),
        });

        const response = await request(app)
          .get('/api/social/events/event_1')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });

      it('should return 404 for non-existent event', async () => {
        Event.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(null),
          }),
        });

        const response = await request(app)
          .get('/api/social/events/nonexistent')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(404);
      });
    });

    describe('POST /api/social/events/:id/join', () => {
      it('should join an event', async () => {
        Event.findById.mockResolvedValue({
          _id: 'event_1',
          attendees: [],
          maxAttendees: 50,
        });

        Event.findByIdAndUpdate.mockResolvedValue({
          _id: 'event_1',
          attendees: ['user_id'],
        });

        const response = await request(app)
          .post('/api/social/events/event_1/join')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should reject joining full event', async () => {
        Event.findById.mockResolvedValue({
          _id: 'event_1',
          attendees: new Array(50).fill('user'),
          maxAttendees: 50,
        });

        const response = await request(app)
          .post('/api/social/events/event_1/join')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(400);
      });
    });

    describe('POST /api/social/events/:id/leave', () => {
      it('should leave an event', async () => {
        Event.findByIdAndUpdate.mockResolvedValue({
          _id: 'event_1',
          attendees: [],
        });

        const response = await request(app)
          .post('/api/social/events/event_1/leave')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });
    });
  });

  describe('Groups', () => {
    describe('GET /api/social/groups', () => {
      it('should return list of groups', async () => {
        Group.find.mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue([
                    {
                      _id: 'group_1',
                      name: 'Hiking Singles',
                      description: 'For singles who love hiking',
                      members: [],
                      category: 'outdoor',
                    },
                  ]),
                }),
              }),
            }),
          }),
        });

        const response = await request(app)
          .get('/api/social/groups')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should filter groups by interest', async () => {
        Group.find.mockReturnValue({
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

        const response = await request(app)
          .get('/api/social/groups?interest=hiking')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });
    });

    describe('POST /api/social/groups', () => {
      it('should create a new group', async () => {
        const response = await request(app)
          .post('/api/social/groups')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            name: 'Coffee Lovers',
            description: 'Group for people who love coffee',
            category: 'lifestyle',
            isPrivate: false,
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });

    describe('POST /api/social/groups/:id/join', () => {
      it('should join a public group', async () => {
        Group.findById.mockResolvedValue({
          _id: 'group_1',
          isPrivate: false,
          members: [],
        });

        Group.findByIdAndUpdate.mockResolvedValue({
          _id: 'group_1',
          members: ['user_id'],
        });

        const response = await request(app)
          .post('/api/social/groups/group_1/join')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });

      it('should require approval for private group', async () => {
        Group.findById.mockResolvedValue({
          _id: 'group_1',
          isPrivate: true,
          members: [],
          pendingRequests: [],
        });

        Group.findByIdAndUpdate.mockResolvedValue({
          _id: 'group_1',
          pendingRequests: ['user_id'],
        });

        const response = await request(app)
          .post('/api/social/groups/group_1/join')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.data.pendingApproval).toBe(true);
      });
    });

    describe('POST /api/social/groups/:id/leave', () => {
      it('should leave a group', async () => {
        Group.findByIdAndUpdate.mockResolvedValue({
          _id: 'group_1',
          members: [],
        });

        const response = await request(app)
          .post('/api/social/groups/group_1/leave')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });
    });
  });

  describe('Friend Suggestions', () => {
    describe('GET /api/social/suggestions', () => {
      it('should return friend suggestions based on interests', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          interests: ['hiking', 'photography'],
          friends: [],
        });

        User.find.mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              lean: jest
                .fn()
                .mockResolvedValue([
                  { _id: 'suggested_1', name: 'Jane', interests: ['hiking', 'travel'] },
                ]),
            }),
          }),
        });

        const response = await request(app)
          .get('/api/social/suggestions')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Activity Feed', () => {
    describe('GET /api/social/feed', () => {
      it('should return social activity feed', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          friends: ['friend_1', 'friend_2'],
        });

        const response = await request(app)
          .get('/api/social/feed')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Shared Interests', () => {
    describe('GET /api/social/shared-interests/:userId', () => {
      it('should return shared interests with another user', async () => {
        User.findById
          .mockResolvedValueOnce({
            _id: 'user_id',
            interests: ['hiking', 'photography', 'travel'],
          })
          .mockResolvedValueOnce({
            _id: 'other_user_id',
            interests: ['hiking', 'cooking', 'travel'],
          });

        const response = await request(app)
          .get('/api/social/shared-interests/other_user_id')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Unauthorized Access', () => {
    it('should reject unauthenticated requests', async () => {
      const endpoints = [
        '/api/social/events',
        '/api/social/groups',
        '/api/social/suggestions',
        '/api/social/feed',
      ];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        assertUnauthorized(response);
      }
    });
  });
});
