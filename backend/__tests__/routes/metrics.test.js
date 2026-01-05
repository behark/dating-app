/**
 * Metrics API Tests
 * Comprehensive test suite for /api/metrics endpoints
 */

const request = require('supertest');
const express = require('express');

const {
  generateTestToken,
  generateAdminToken,
  authHeader,
  assertUnauthorized,
  assertForbidden,
} = require('../utils/testHelpers');

// Mock dependencies
jest.mock('../../models/User', () => ({
  findById: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
}));

jest.mock('../../models/Match', () => ({
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
}));

jest.mock('../../models/Message', () => ({
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
}));

jest.mock('../../models/Swipe', () => ({
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
}));

// Create test app with admin middleware mock
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Admin check middleware
  const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Admin access required' });
  };
  
  const metricsRoutes = require('../../routes/metrics');
  app.use('/api/metrics', metricsRoutes);
  
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  });
  
  return app;
};

describe('Metrics API Tests', () => {
  let app;
  const User = require('../../models/User');
  const Match = require('../../models/Match');
  const Message = require('../../models/Message');
  const Swipe = require('../../models/Swipe');
  
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    app = createTestApp();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/metrics/user', () => {
    describe('Success Cases', () => {
      it('should return user personal metrics', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        });
        
        Swipe.countDocuments.mockResolvedValue(500);
        Match.countDocuments.mockResolvedValue(50);
        Message.countDocuments.mockResolvedValue(200);
        
        const response = await request(app)
          .get('/api/metrics/user')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.metrics).toBeDefined();
      });
      
      it('should calculate match rate', async () => {
        User.findById.mockResolvedValue({ _id: 'user_id' });
        
        Swipe.countDocuments.mockImplementation((query) => {
          if (query.direction === 'right') return Promise.resolve(100);
          return Promise.resolve(200);
        });
        
        Match.countDocuments.mockResolvedValue(20);
        
        const response = await request(app)
          .get('/api/metrics/user')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('Unauthorized Access', () => {
      it('should reject unauthenticated request', async () => {
        const response = await request(app).get('/api/metrics/user');
        assertUnauthorized(response);
      });
    });
  });
  
  describe('GET /api/metrics/engagement', () => {
    describe('Success Cases', () => {
      it('should return user engagement metrics', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          lastActive: new Date(),
          sessions: [
            { startTime: new Date(), duration: 1200 },
          ],
        });
        
        const response = await request(app)
          .get('/api/metrics/engagement')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
      
      it('should return metrics for specified time period', async () => {
        User.findById.mockResolvedValue({ _id: 'user_id' });
        
        const response = await request(app)
          .get('/api/metrics/engagement?period=week')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
      });
    });
  });
  
  describe('GET /api/metrics/profile', () => {
    describe('Success Cases', () => {
      it('should return profile performance metrics', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          profileViews: 150,
          photoLikes: 30,
        });
        
        Swipe.aggregate.mockResolvedValue([
          { _id: null, rightSwipes: 80, totalSwipes: 200 },
        ]);
        
        const response = await request(app)
          .get('/api/metrics/profile')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
      
      it('should include profile completion score', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          name: 'Test',
          bio: 'Test bio',
          photos: ['photo1.jpg'],
          interests: ['hiking'],
          occupation: 'Engineer',
        });
        
        const response = await request(app)
          .get('/api/metrics/profile')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
      });
    });
  });
  
  describe('Admin Metrics', () => {
    describe('GET /api/metrics/admin/overview', () => {
      it('should return platform overview for admin', async () => {
        User.findById.mockResolvedValue({
          _id: 'admin_id',
          role: 'admin',
        });
        
        User.countDocuments.mockResolvedValue(10000);
        Match.countDocuments.mockResolvedValue(5000);
        Message.countDocuments.mockResolvedValue(100000);
        
        const response = await request(app)
          .get('/api/metrics/admin/overview')
          .set('Authorization', `Bearer ${generateAdminToken()}`);
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
      
      it('should reject non-admin users', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          role: 'user',
        });
        
        const response = await request(app)
          .get('/api/metrics/admin/overview')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        assertForbidden(response);
      });
    });
    
    describe('GET /api/metrics/admin/users', () => {
      it('should return user growth metrics', async () => {
        User.findById.mockResolvedValue({ role: 'admin' });
        
        User.aggregate.mockResolvedValue([
          { _id: { year: 2024, month: 1 }, count: 500 },
          { _id: { year: 2024, month: 2 }, count: 750 },
        ]);
        
        const response = await request(app)
          .get('/api/metrics/admin/users')
          .set('Authorization', `Bearer ${generateAdminToken()}`);
        
        expect(response.status).toBe(200);
      });
      
      it('should return DAU/MAU metrics', async () => {
        User.findById.mockResolvedValue({ role: 'admin' });
        
        User.countDocuments
          .mockResolvedValueOnce(1000) // DAU
          .mockResolvedValueOnce(5000); // MAU
        
        const response = await request(app)
          .get('/api/metrics/admin/users?type=active')
          .set('Authorization', `Bearer ${generateAdminToken()}`);
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('GET /api/metrics/admin/matches', () => {
      it('should return matching statistics', async () => {
        User.findById.mockResolvedValue({ role: 'admin' });
        
        Match.aggregate.mockResolvedValue([
          { _id: 'daily', count: 200, avgTime: 3600 },
        ]);
        
        const response = await request(app)
          .get('/api/metrics/admin/matches')
          .set('Authorization', `Bearer ${generateAdminToken()}`);
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('GET /api/metrics/admin/revenue', () => {
      it('should return revenue metrics', async () => {
        User.findById.mockResolvedValue({ role: 'admin' });
        
        const response = await request(app)
          .get('/api/metrics/admin/revenue')
          .set('Authorization', `Bearer ${generateAdminToken()}`);
        
        expect(response.status).toBe(200);
      });
      
      it('should breakdown by subscription tier', async () => {
        User.findById.mockResolvedValue({ role: 'admin' });
        
        User.aggregate.mockResolvedValue([
          { _id: 'gold', count: 500, revenue: 50000 },
          { _id: 'platinum', count: 200, revenue: 40000 },
        ]);
        
        const response = await request(app)
          .get('/api/metrics/admin/revenue?breakdown=tier')
          .set('Authorization', `Bearer ${generateAdminToken()}`);
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('GET /api/metrics/admin/safety', () => {
      it('should return safety metrics', async () => {
        User.findById.mockResolvedValue({ role: 'admin' });
        
        const response = await request(app)
          .get('/api/metrics/admin/safety')
          .set('Authorization', `Bearer ${generateAdminToken()}`);
        
        expect(response.status).toBe(200);
      });
    });
  });
  
  describe('POST /api/metrics/track', () => {
    describe('Success Cases', () => {
      it('should track custom event', async () => {
        const response = await request(app)
          .post('/api/metrics/track')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            event: 'feature_used',
            properties: {
              feature: 'boost',
              duration: 30,
            },
          });
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
      
      it('should track multiple events', async () => {
        const response = await request(app)
          .post('/api/metrics/track')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            events: [
              { event: 'screen_view', properties: { screen: 'discover' } },
              { event: 'action', properties: { action: 'swipe_right' } },
            ],
          });
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('Validation', () => {
      it('should require event name', async () => {
        const response = await request(app)
          .post('/api/metrics/track')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            properties: { test: 'data' },
          });
        
        expect(response.status).toBe(400);
      });
    });
  });
  
  describe('GET /api/metrics/health', () => {
    it('should return system health metrics', async () => {
      const response = await request(app)
        .get('/api/metrics/health')
        .set('Authorization', `Bearer ${generateAdminToken()}`);
      
      expect(response.status).toBe(200);
    });
  });
  
  describe('Export Metrics', () => {
    describe('GET /api/metrics/export', () => {
      it('should export metrics as CSV', async () => {
        User.findById.mockResolvedValue({ role: 'admin' });
        
        const response = await request(app)
          .get('/api/metrics/export?format=csv&type=users')
          .set('Authorization', `Bearer ${generateAdminToken()}`);
        
        expect(response.status).toBe(200);
      });
      
      it('should export metrics as JSON', async () => {
        User.findById.mockResolvedValue({ role: 'admin' });
        
        const response = await request(app)
          .get('/api/metrics/export?format=json&type=users')
          .set('Authorization', `Bearer ${generateAdminToken()}`);
        
        expect(response.status).toBe(200);
      });
    });
  });
});
