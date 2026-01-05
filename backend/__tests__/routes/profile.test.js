/**
 * Profile API Tests
 * Comprehensive test suite for /api/profile endpoints
 */

const request = require('supertest');
const express = require('express');

const {
  generateTestToken,
  generateAdminToken,
  authHeader,
  assertUnauthorized,
  assertValidationError,
  assertForbidden,
} = require('../utils/testHelpers');

const { profiles, users } = require('../utils/fixtures');

// Mock dependencies
jest.mock('../../models/User', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock('../../models/Match', () => ({
  findOne: jest.fn(),
}));

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  const profileRoutes = require('../../routes/profile');
  app.use('/api/profile', profileRoutes);
  
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  });
  
  return app;
};

describe('Profile API Tests', () => {
  let app;
  const User = require('../../models/User');
  const Match = require('../../models/Match');
  
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    app = createTestApp();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/profile/me', () => {
    describe('Success Cases', () => {
      it('should return authenticated user profile', async () => {
        User.findById.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue({
            _id: 'user_id',
            email: 'test@example.com',
            name: 'Test User',
            age: 25,
            photos: [],
          }),
        });
        
        const response = await request(app)
          .get('/api/profile/me')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      });
      
      it('should exclude sensitive fields from response', async () => {
        User.findById.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue({
            _id: 'user_id',
            email: 'test@example.com',
            name: 'Test User',
            // password should be excluded via select
          }),
        });
        
        const response = await request(app)
          .get('/api/profile/me')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.body.data?.password).toBeUndefined();
        expect(response.body.data?.refreshToken).toBeUndefined();
      });
    });
    
    describe('Unauthorized Access', () => {
      it('should reject request without token', async () => {
        const response = await request(app)
          .get('/api/profile/me');
        
        assertUnauthorized(response);
      });
      
      it('should reject request with invalid token', async () => {
        const response = await request(app)
          .get('/api/profile/me')
          .set('Authorization', 'Bearer invalid_token');
        
        assertUnauthorized(response);
      });
      
      it('should reject request with expired token', async () => {
        const jwt = require('jsonwebtoken');
        const expiredToken = jwt.sign(
          { userId: 'user_id' },
          process.env.JWT_SECRET,
          { expiresIn: -1 }
        );
        
        const response = await request(app)
          .get('/api/profile/me')
          .set('Authorization', `Bearer ${expiredToken}`);
        
        assertUnauthorized(response);
      });
    });
  });
  
  describe('GET /api/profile/:userId', () => {
    describe('Success Cases', () => {
      it('should return user profile for matched users', async () => {
        User.findById.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue({
            _id: 'target_user_id',
            name: 'Target User',
            age: 25,
          }),
        });
        
        Match.findOne.mockResolvedValue({
          _id: 'match_id',
          users: ['user_id', 'target_user_id'],
          status: 'active',
        });
        
        const response = await request(app)
          .get('/api/profile/target_user_id')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
      });
      
      it('should allow user to view own profile', async () => {
        const userId = 'user_id';
        User.findById.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue({
            _id: userId,
            name: 'Test User',
          }),
        });
        
        const response = await request(app)
          .get(`/api/profile/${userId}`)
          .set('Authorization', `Bearer ${generateTestToken({ userId })}`);
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('Unauthorized Access', () => {
      it('should reject access to non-matched user profile', async () => {
        User.findById.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue({
            _id: 'other_user_id',
            name: 'Other User',
          }),
        });
        
        Match.findOne.mockResolvedValue(null);
        
        const response = await request(app)
          .get('/api/profile/other_user_id')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        assertForbidden(response);
      });
      
      it('should reject request without authentication', async () => {
        const response = await request(app)
          .get('/api/profile/some_user_id');
        
        assertUnauthorized(response);
      });
    });
    
    describe('Not Found', () => {
      it('should return 404 for non-existent user', async () => {
        User.findById.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(null),
        });
        
        Match.findOne.mockResolvedValue({
          _id: 'match_id',
          users: ['user_id', 'nonexistent_user'],
          status: 'active',
        });
        
        const response = await request(app)
          .get('/api/profile/nonexistent_user')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(404);
      });
    });
  });
  
  describe('PUT /api/profile/update', () => {
    describe('Success Cases', () => {
      it('should update profile with valid data', async () => {
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          ...profiles.validProfileUpdate,
        });
        
        const response = await request(app)
          .put('/api/profile/update')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send(profiles.validProfileUpdate);
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
      
      it('should update individual fields', async () => {
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          name: 'Updated Name',
        });
        
        const response = await request(app)
          .put('/api/profile/update')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ name: 'Updated Name' });
        
        expect(response.status).toBe(200);
      });
      
      it('should update bio', async () => {
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          bio: 'New bio text',
        });
        
        const response = await request(app)
          .put('/api/profile/update')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ bio: 'New bio text' });
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('Validation Errors', () => {
      it('should reject empty name', async () => {
        const response = await request(app)
          .put('/api/profile/update')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ name: '' });
        
        assertValidationError(response);
      });
      
      it('should reject invalid age (< 18)', async () => {
        const response = await request(app)
          .put('/api/profile/update')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ age: 17 });
        
        assertValidationError(response);
      });
      
      it('should reject invalid age (> 100)', async () => {
        const response = await request(app)
          .put('/api/profile/update')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ age: 101 });
        
        assertValidationError(response);
      });
      
      it('should reject invalid gender', async () => {
        const response = await request(app)
          .put('/api/profile/update')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ gender: 'invalid' });
        
        assertValidationError(response);
      });
      
      it('should reject bio exceeding max length', async () => {
        const response = await request(app)
          .put('/api/profile/update')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ bio: 'a'.repeat(501) });
        
        assertValidationError(response);
      });
    });
    
    describe('Unauthorized Access', () => {
      it('should reject unauthenticated request', async () => {
        const response = await request(app)
          .put('/api/profile/update')
          .send(profiles.validProfileUpdate);
        
        assertUnauthorized(response);
      });
    });
  });
  
  describe('POST /api/profile/photos/upload', () => {
    describe('Success Cases', () => {
      it('should upload photos with valid data', async () => {
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          photos: profiles.photoUpload.photos,
        });
        
        const response = await request(app)
          .post('/api/profile/photos/upload')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send(profiles.photoUpload);
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('Validation Errors', () => {
      it('should reject empty photos array', async () => {
        const response = await request(app)
          .post('/api/profile/photos/upload')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ photos: [] });
        
        assertValidationError(response);
      });
      
      it('should reject more than 6 photos', async () => {
        const response = await request(app)
          .post('/api/profile/photos/upload')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            photos: Array(7).fill({ url: 'https://example.com/photo.jpg' }),
          });
        
        assertValidationError(response);
      });
      
      it('should reject invalid photo URL', async () => {
        const response = await request(app)
          .post('/api/profile/photos/upload')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            photos: [{ url: 'not-a-url' }],
          });
        
        assertValidationError(response);
      });
      
      it('should reject non-array photos', async () => {
        const response = await request(app)
          .post('/api/profile/photos/upload')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ photos: 'not-an-array' });
        
        assertValidationError(response);
      });
    });
    
    describe('Unauthorized Access', () => {
      it('should reject unauthenticated request', async () => {
        const response = await request(app)
          .post('/api/profile/photos/upload')
          .send(profiles.photoUpload);
        
        assertUnauthorized(response);
      });
    });
  });
  
  describe('PUT /api/profile/photos/reorder', () => {
    describe('Success Cases', () => {
      it('should reorder photos with valid data', async () => {
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          photos: [],
        });
        
        const response = await request(app)
          .put('/api/profile/photos/reorder')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send(profiles.photoReorder);
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('Validation Errors', () => {
      it('should reject non-array photoIds', async () => {
        const response = await request(app)
          .put('/api/profile/photos/reorder')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ photoIds: 'not-an-array' });
        
        assertValidationError(response);
      });
    });
  });
  
  describe('DELETE /api/profile/photos/:photoId', () => {
    describe('Success Cases', () => {
      it('should delete photo by ID', async () => {
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          photos: [],
        });
        
        const response = await request(app)
          .delete('/api/profile/photos/photo_123')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('Unauthorized Access', () => {
      it('should reject unauthenticated request', async () => {
        const response = await request(app)
          .delete('/api/profile/photos/photo_123');
        
        assertUnauthorized(response);
      });
    });
  });
  
  describe('Photo Moderation (Admin)', () => {
    describe('PUT /api/profile/photos/:photoId/approve', () => {
      it('should approve photo for admin', async () => {
        User.findOneAndUpdate = jest.fn().mockResolvedValue({
          _id: 'user_id',
          photos: [{ _id: 'photo_123', moderationStatus: 'approved' }],
        });
        
        const response = await request(app)
          .put('/api/profile/photos/photo_123/approve')
          .set('Authorization', `Bearer ${generateAdminToken()}`);
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('PUT /api/profile/photos/:photoId/reject', () => {
      it('should reject photo with reason', async () => {
        User.findOneAndUpdate = jest.fn().mockResolvedValue({
          _id: 'user_id',
          photos: [{ _id: 'photo_123', moderationStatus: 'rejected' }],
        });
        
        const response = await request(app)
          .put('/api/profile/photos/photo_123/reject')
          .set('Authorization', `Bearer ${generateAdminToken()}`)
          .send({ reason: 'Inappropriate content' });
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('GET /api/profile/admin/photos/pending', () => {
      it('should return pending photos for admin', async () => {
        User.find = jest.fn().mockResolvedValue([
          {
            _id: 'user_id',
            photos: [{ _id: 'photo_123', moderationStatus: 'pending' }],
          },
        ]);
        
        const response = await request(app)
          .get('/api/profile/admin/photos/pending')
          .set('Authorization', `Bearer ${generateAdminToken()}`);
        
        expect(response.status).toBe(200);
      });
    });
  });
});
