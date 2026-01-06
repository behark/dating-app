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

    describe('POST /api/social/events/:eventId/register', () => {
      const mockUserId = '507f1f77bcf86cd799439011';
      const mockEventId = '507f1f77bcf86cd799439012';

      beforeEach(() => {
        jest.clearAllMocks();
      });

      it('should successfully register for an event', async () => {
        const mockEvent = {
          _id: mockEventId,
          organizerId: '507f1f77bcf86cd799439013',
          title: 'Test Event',
          status: 'published',
          attendees: [],
          maxAttendees: 50,
          registrationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          save: jest.fn().mockResolvedValue(true),
          populate: jest.fn().mockResolvedValue({
            _id: mockEventId,
            attendees: [{ userId: mockUserId, status: 'registered' }],
            currentAttendeeCount: 1,
          }),
        };

        Event.findById = jest.fn().mockResolvedValue(mockEvent);
        User.findById = jest.fn().mockResolvedValue({
          _id: mockUserId,
          name: 'Test User',
          photos: [],
        });

        const SocialFeaturesService = require('../../services/SocialFeaturesService');
        jest.spyOn(SocialFeaturesService, 'registerForEvent').mockResolvedValue({
          event: mockEvent,
          attendeeCount: 1,
          isFull: false,
        });

        const response = await request(app)
          .post(`/api/social/events/${mockEventId}/register`)
          .set('Authorization', `Bearer ${generateTestToken({ userId: mockUserId })}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('event');
        expect(response.body.data).toHaveProperty('attendeeCount');
      });

      it('should reject invalid event ID format', async () => {
        const response = await request(app)
          .post('/api/social/events/invalid-id/register')
          .set('Authorization', `Bearer ${generateTestToken({ userId: mockUserId })}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined();
      });

      it('should reject joining event with status other than published/ongoing', async () => {
        const mockEvent = {
          _id: mockEventId,
          status: 'draft',
          attendees: [],
        };

        Event.findById = jest.fn().mockResolvedValue(mockEvent);

        const SocialFeaturesService = require('../../services/SocialFeaturesService');
        jest.spyOn(SocialFeaturesService, 'registerForEvent').mockRejectedValue(
          new Error('Cannot join event with status: draft')
        );

        const response = await request(app)
          .post(`/api/social/events/${mockEventId}/register`)
          .set('Authorization', `Bearer ${generateTestToken({ userId: mockUserId })}`);

        expect(response.status).toBe(500);
      });

      it('should reject joining event after registration deadline', async () => {
        const mockEvent = {
          _id: mockEventId,
          status: 'published',
          registrationDeadline: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          attendees: [],
        };

        Event.findById = jest.fn().mockResolvedValue(mockEvent);

        const SocialFeaturesService = require('../../services/SocialFeaturesService');
        jest.spyOn(SocialFeaturesService, 'registerForEvent').mockRejectedValue(
          new Error('Registration deadline has passed')
        );

        const response = await request(app)
          .post(`/api/social/events/${mockEventId}/register`)
          .set('Authorization', `Bearer ${generateTestToken({ userId: mockUserId })}`);

        expect(response.status).toBe(500);
      });

      it('should reject joining event that is at capacity', async () => {
        const mockEvent = {
          _id: mockEventId,
          status: 'published',
          attendees: new Array(50).fill({ userId: 'some_user' }),
          maxAttendees: 50,
        };

        Event.findById = jest.fn().mockResolvedValue(mockEvent);

        const SocialFeaturesService = require('../../services/SocialFeaturesService');
        jest.spyOn(SocialFeaturesService, 'registerForEvent').mockRejectedValue(
          new Error('Event is at maximum capacity')
        );

        const response = await request(app)
          .post(`/api/social/events/${mockEventId}/register`)
          .set('Authorization', `Bearer ${generateTestToken({ userId: mockUserId })}`);

        expect(response.status).toBe(500);
      });
    });

    describe('POST /api/social/events/:eventId/leave', () => {
      const mockUserId = '507f1f77bcf86cd799439011';
      const mockEventId = '507f1f77bcf86cd799439012';

      it('should successfully leave an event', async () => {
        const mockEvent = {
          _id: mockEventId,
          attendees: [{ userId: mockUserId, status: 'registered' }],
          currentAttendeeCount: 1,
          save: jest.fn().mockResolvedValue(true),
          populate: jest.fn().mockResolvedValue({
            _id: mockEventId,
            attendees: [],
            currentAttendeeCount: 0,
          }),
        };

        Event.findById = jest.fn().mockResolvedValue(mockEvent);

        const SocialFeaturesService = require('../../services/SocialFeaturesService');
        jest.spyOn(SocialFeaturesService, 'leaveEvent').mockResolvedValue({
          event: mockEvent,
          attendeeCount: 0,
        });

        const response = await request(app)
          .post(`/api/social/events/${mockEventId}/leave`)
          .set('Authorization', `Bearer ${generateTestToken({ userId: mockUserId })}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('event');
        expect(response.body.data).toHaveProperty('attendeeCount');
      });

      it('should reject leaving event when not registered', async () => {
        const SocialFeaturesService = require('../../services/SocialFeaturesService');
        jest.spyOn(SocialFeaturesService, 'leaveEvent').mockRejectedValue(
          new Error('User is not registered for this event')
        );

        const response = await request(app)
          .post(`/api/social/events/${mockEventId}/leave`)
          .set('Authorization', `Bearer ${generateTestToken({ userId: mockUserId })}`);

        expect(response.status).toBe(500);
      });

      it('should reject organizer leaving their own event', async () => {
        const SocialFeaturesService = require('../../services/SocialFeaturesService');
        jest.spyOn(SocialFeaturesService, 'leaveEvent').mockRejectedValue(
          new Error('Organizer cannot leave their own event')
        );

        const response = await request(app)
          .post(`/api/social/events/${mockEventId}/leave`)
          .set('Authorization', `Bearer ${generateTestToken({ userId: mockUserId })}`);

        expect(response.status).toBe(500);
      });
    });

    describe('GET /api/social/events/nearby', () => {
      const mockUserId = '507f1f77bcf86cd799439011';

      it('should return nearby events with valid coordinates', async () => {
        const mockEvents = [
          {
            _id: 'event1',
            title: 'Event 1',
            location: { type: 'Point', coordinates: [-122.4, 37.8] },
            startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
          {
            _id: 'event2',
            title: 'Event 2',
            location: { type: 'Point', coordinates: [-122.5, 37.9] },
            startTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        ];

        const SocialFeaturesService = require('../../services/SocialFeaturesService');
        jest.spyOn(SocialFeaturesService, 'getNearbyEvents').mockResolvedValue({
          events: mockEvents,
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        });

        const response = await request(app)
          .get('/api/social/events/nearby?longitude=-122.4&latitude=37.8&maxDistance=10000')
          .set('Authorization', `Bearer ${generateTestToken({ userId: mockUserId })}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.pagination).toBeDefined();
      });

      it('should require longitude and latitude', async () => {
        const response = await request(app)
          .get('/api/social/events/nearby')
          .set('Authorization', `Bearer ${generateTestToken({ userId: mockUserId })}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined();
      });

      it('should validate longitude range', async () => {
        const response = await request(app)
          .get('/api/social/events/nearby?longitude=200&latitude=37.8')
          .set('Authorization', `Bearer ${generateTestToken({ userId: mockUserId })}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should validate latitude range', async () => {
        const response = await request(app)
          .get('/api/social/events/nearby?longitude=-122.4&latitude=100')
          .set('Authorization', `Bearer ${generateTestToken({ userId: mockUserId })}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should validate maxDistance range', async () => {
        const response = await request(app)
          .get('/api/social/events/nearby?longitude=-122.4&latitude=37.8&maxDistance=100000')
          .set('Authorization', `Bearer ${generateTestToken({ userId: mockUserId })}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should filter by category when provided', async () => {
        const SocialFeaturesService = require('../../services/SocialFeaturesService');
        jest.spyOn(SocialFeaturesService, 'getNearbyEvents').mockResolvedValue({
          events: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        });

        const response = await request(app)
          .get('/api/social/events/nearby?longitude=-122.4&latitude=37.8&category=singles_mixer')
          .set('Authorization', `Bearer ${generateTestToken({ userId: mockUserId })}`);

        expect(response.status).toBe(200);
        expect(SocialFeaturesService.getNearbyEvents).toHaveBeenCalledWith(
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          'singles_mixer',
          expect.any(String),
          expect.any(Object)
        );
      });

      it('should support pagination', async () => {
        const SocialFeaturesService = require('../../services/SocialFeaturesService');
        jest.spyOn(SocialFeaturesService, 'getNearbyEvents').mockResolvedValue({
          events: [],
          pagination: {
            page: 2,
            limit: 10,
            total: 25,
            totalPages: 3,
            hasNext: true,
            hasPrev: true,
          },
        });

        const response = await request(app)
          .get('/api/social/events/nearby?longitude=-122.4&latitude=37.8&page=2&limit=10')
          .set('Authorization', `Bearer ${generateTestToken({ userId: mockUserId })}`);

        expect(response.status).toBe(200);
        expect(response.body.pagination.page).toBe(2);
        expect(response.body.pagination.limit).toBe(10);
        expect(response.body.pagination.hasNext).toBe(true);
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
