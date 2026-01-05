/**
 * Premium API Tests
 * Comprehensive test suite for /api/premium endpoints
 */

const request = require('supertest');
const express = require('express');

const {
  generateTestToken,
  authHeader,
  assertUnauthorized,
  assertValidationError,
  assertForbidden,
} = require('../utils/testHelpers');

// Mock dependencies
jest.mock('../../models/User', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn().mockResolvedValue({ id: 'cus_test' }),
      retrieve: jest.fn().mockResolvedValue({ id: 'cus_test' }),
    },
    subscriptions: {
      create: jest.fn().mockResolvedValue({ id: 'sub_test', status: 'active' }),
      retrieve: jest.fn().mockResolvedValue({ id: 'sub_test', status: 'active' }),
      update: jest.fn().mockResolvedValue({ id: 'sub_test', status: 'active' }),
      cancel: jest.fn().mockResolvedValue({ id: 'sub_test', status: 'canceled' }),
    },
    prices: {
      list: jest.fn().mockResolvedValue({ data: [] }),
    },
  }));
});

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  const premiumRoutes = require('../../routes/premium');
  app.use('/api/premium', premiumRoutes);
  
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  });
  
  return app;
};

describe('Premium API Tests', () => {
  let app;
  const User = require('../../models/User');
  
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.STRIPE_SECRET_KEY = 'sk_test_xxx';
    app = createTestApp();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/premium/features', () => {
    describe('Success Cases', () => {
      it('should return list of premium features', async () => {
        const response = await request(app)
          .get('/api/premium/features')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      });
      
      it('should list all available features', async () => {
        const response = await request(app)
          .get('/api/premium/features')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
      });
    });
  });
  
  describe('GET /api/premium/status', () => {
    describe('Success Cases', () => {
      it('should return premium status for non-premium user', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          isPremium: false,
          premiumType: null,
          premiumExpiry: null,
        });
        
        const response = await request(app)
          .get('/api/premium/status')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.isPremium).toBe(false);
      });
      
      it('should return premium status for premium user', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          isPremium: true,
          premiumType: 'gold',
          premiumExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        
        const response = await request(app)
          .get('/api/premium/status')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
        expect(response.body.data.isPremium).toBe(true);
        expect(response.body.data.premiumType).toBe('gold');
      });
      
      it('should include feature access for premium users', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          isPremium: true,
          premiumType: 'platinum',
          premiumFeatures: {
            unlimitedLikes: true,
            seeWhoLikesYou: true,
            rewind: true,
            boost: { count: 5 },
            superLikes: { count: 5 },
            passport: true,
            topPicks: true,
            incognitoMode: true,
          },
        });
        
        const response = await request(app)
          .get('/api/premium/status')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('Unauthorized Access', () => {
      it('should reject unauthenticated request', async () => {
        const response = await request(app).get('/api/premium/status');
        assertUnauthorized(response);
      });
    });
  });
  
  describe('GET /api/premium/plans', () => {
    describe('Success Cases', () => {
      it('should return available premium plans', async () => {
        const response = await request(app)
          .get('/api/premium/plans')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
      
      it('should include pricing information', async () => {
        const response = await request(app)
          .get('/api/premium/plans')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
      });
    });
  });
  
  describe('Feature-Specific Endpoints', () => {
    describe('POST /api/premium/boost', () => {
      it('should activate boost for premium user', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          isPremium: true,
          premiumFeatures: { boost: { count: 5 } },
        });
        
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          boostedUntil: new Date(Date.now() + 30 * 60 * 1000),
        });
        
        const response = await request(app)
          .post('/api/premium/boost')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
      
      it('should reject boost for non-premium user without boosts', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          isPremium: false,
          premiumFeatures: { boost: { count: 0 } },
        });
        
        const response = await request(app)
          .post('/api/premium/boost')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(403);
      });
    });
    
    describe('POST /api/premium/super-like', () => {
      it('should send super like for premium user', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          isPremium: true,
          premiumFeatures: { superLikes: { count: 5 } },
        });
        
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
        });
        
        const response = await request(app)
          .post('/api/premium/super-like')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ targetUserId: 'target_user_id' });
        
        expect(response.status).toBe(200);
      });
      
      it('should reject super like without remaining super likes', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          isPremium: false,
          premiumFeatures: { superLikes: { count: 0 } },
        });
        
        const response = await request(app)
          .post('/api/premium/super-like')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ targetUserId: 'target_user_id' });
        
        expect(response.status).toBe(403);
      });
    });
    
    describe('POST /api/premium/rewind', () => {
      it('should rewind last swipe for premium user', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          isPremium: true,
          premiumFeatures: { rewind: true },
          lastSwipe: { userId: 'last_swiped_user', action: 'pass' },
        });
        
        const response = await request(app)
          .post('/api/premium/rewind')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
      });
      
      it('should reject rewind for non-premium user', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          isPremium: false,
        });
        
        const response = await request(app)
          .post('/api/premium/rewind')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(403);
      });
    });
    
    describe('GET /api/premium/likes', () => {
      it('should return users who liked you for premium user', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          isPremium: true,
          premiumFeatures: { seeWhoLikesYou: true },
        });
        
        const response = await request(app)
          .get('/api/premium/likes')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
      });
      
      it('should reject access for non-premium user', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          isPremium: false,
        });
        
        const response = await request(app)
          .get('/api/premium/likes')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(403);
      });
    });
    
    describe('POST /api/premium/passport', () => {
      it('should set virtual location for premium user', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          isPremium: true,
          premiumType: 'platinum',
          premiumFeatures: { passport: true },
        });
        
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          virtualLocation: { type: 'Point', coordinates: [-122.4, 37.7] },
        });
        
        const response = await request(app)
          .post('/api/premium/passport')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            location: { latitude: 37.7, longitude: -122.4 },
            city: 'San Francisco',
          });
        
        expect(response.status).toBe(200);
      });
      
      it('should reject passport for non-platinum user', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          isPremium: true,
          premiumType: 'gold',
          premiumFeatures: { passport: false },
        });
        
        const response = await request(app)
          .post('/api/premium/passport')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            location: { latitude: 37.7, longitude: -122.4 },
          });
        
        expect(response.status).toBe(403);
      });
    });
    
    describe('DELETE /api/premium/passport', () => {
      it('should reset to actual location', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          isPremium: true,
          virtualLocation: { type: 'Point', coordinates: [-122.4, 37.7] },
        });
        
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          virtualLocation: null,
        });
        
        const response = await request(app)
          .delete('/api/premium/passport')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('PUT /api/premium/incognito', () => {
      it('should enable incognito mode for premium user', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          isPremium: true,
          premiumType: 'platinum',
          premiumFeatures: { incognitoMode: true },
        });
        
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          incognitoMode: true,
        });
        
        const response = await request(app)
          .put('/api/premium/incognito')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ enabled: true });
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('GET /api/premium/top-picks', () => {
      it('should return top picks for premium user', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          isPremium: true,
          premiumFeatures: { topPicks: true },
        });
        
        const response = await request(app)
          .get('/api/premium/top-picks')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
      });
    });
  });
  
  describe('Subscription Management', () => {
    describe('POST /api/premium/subscribe', () => {
      it('should create subscription', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          email: 'test@example.com',
          stripeCustomerId: 'cus_test',
        });
        
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          isPremium: true,
          premiumType: 'gold',
        });
        
        const response = await request(app)
          .post('/api/premium/subscribe')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            planId: 'gold',
            paymentMethodId: 'pm_test',
          });
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('PUT /api/premium/subscribe', () => {
      it('should upgrade subscription', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          isPremium: true,
          premiumType: 'gold',
          stripeSubscriptionId: 'sub_test',
        });
        
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          premiumType: 'platinum',
        });
        
        const response = await request(app)
          .put('/api/premium/subscribe')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ planId: 'platinum' });
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('DELETE /api/premium/subscribe', () => {
      it('should cancel subscription', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          isPremium: true,
          stripeSubscriptionId: 'sub_test',
        });
        
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          isPremium: false,
        });
        
        const response = await request(app)
          .delete('/api/premium/subscribe')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
      });
    });
  });
  
  describe('Premium Tier Comparison', () => {
    const tiers = ['plus', 'gold', 'platinum'];
    
    it('should return different features for each tier', async () => {
      for (const tier of tiers) {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          isPremium: true,
          premiumType: tier,
        });
        
        const response = await request(app)
          .get('/api/premium/status')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
        expect(response.body.data.premiumType).toBe(tier);
      }
    });
  });
});
