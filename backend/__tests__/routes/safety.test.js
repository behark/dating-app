/**
 * Safety API Tests
 * Comprehensive test suite for /api/safety endpoints
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

const { safety, users } = require('../utils/fixtures');

// Mock dependencies
jest.mock('../../models/User', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock('../../models/Report', () => ({
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}), { virtual: true });

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  const safetyRoutes = require('../../routes/safety');
  app.use('/api/safety', safetyRoutes);
  
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  });
  
  return app;
};

describe('Safety API Tests', () => {
  let app;
  const User = require('../../models/User');
  
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    app = createTestApp();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('POST /api/safety/report', () => {
    describe('Success Cases', () => {
      it('should create user report', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          name: 'Reporter',
        });
        
        const response = await request(app)
          .post('/api/safety/report')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send(safety.validReport);
        
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
      
      it('should accept report with different reasons', async () => {
        User.findById.mockResolvedValue({ _id: 'user_id' });
        
        const reasons = ['inappropriate', 'spam', 'harassment', 'fake_profile', 'other'];
        
        for (const reason of reasons) {
          const response = await request(app)
            .post('/api/safety/report')
            .set('Authorization', `Bearer ${generateTestToken()}`)
            .send({
              targetUserId: 'target_id',
              reason,
              description: 'Report description',
            });
          
          expect(response.status).toBe(201);
        }
      });
    });
    
    describe('Validation Errors', () => {
      it('should reject report without targetUserId', async () => {
        const response = await request(app)
          .post('/api/safety/report')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ reason: 'inappropriate' });
        
        expect(response.status).toBe(400);
      });
      
      it('should reject report without reason', async () => {
        const response = await request(app)
          .post('/api/safety/report')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ targetUserId: 'target_id' });
        
        expect(response.status).toBe(400);
      });
      
      it('should reject self-report', async () => {
        const userId = 'user_id';
        
        const response = await request(app)
          .post('/api/safety/report')
          .set('Authorization', `Bearer ${generateTestToken({ userId })}`)
          .send({
            targetUserId: userId,
            reason: 'inappropriate',
          });
        
        expect(response.status).toBe(400);
      });
    });
    
    describe('Unauthorized Access', () => {
      it('should reject unauthenticated request', async () => {
        const response = await request(app)
          .post('/api/safety/report')
          .send(safety.validReport);
        
        assertUnauthorized(response);
      });
    });
  });
  
  describe('GET /api/safety/reports (Admin)', () => {
    describe('Success Cases', () => {
      it('should return all reports for admin', async () => {
        User.findById.mockResolvedValue({
          _id: 'admin_id',
          role: 'admin',
        });
        
        const Report = require('../../models/Report');
        Report.find.mockReturnValue({
          sort: jest.fn().mockReturnThis(),
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([
            { _id: 'report_1', reason: 'inappropriate' },
            { _id: 'report_2', reason: 'spam' },
          ]),
        });
        
        const response = await request(app)
          .get('/api/safety/reports')
          .set('Authorization', `Bearer ${generateAdminToken()}`);
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('Forbidden', () => {
      it('should reject non-admin request', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          role: 'user',
        });
        
        const response = await request(app)
          .get('/api/safety/reports')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        assertForbidden(response);
      });
    });
  });
  
  describe('PUT /api/safety/reports/:reportId/review (Admin)', () => {
    describe('Success Cases', () => {
      it('should review report', async () => {
        User.findById.mockResolvedValue({
          _id: 'admin_id',
          role: 'admin',
        });
        
        const Report = require('../../models/Report');
        Report.findByIdAndUpdate.mockResolvedValue({
          _id: 'report_id',
          status: 'reviewed',
        });
        
        const response = await request(app)
          .put('/api/safety/reports/report_id/review')
          .set('Authorization', `Bearer ${generateAdminToken()}`)
          .send({
            status: 'resolved',
            action: 'warning_issued',
          });
        
        expect(response.status).toBe(200);
      });
    });
  });
  
  describe('POST /api/safety/block', () => {
    describe('Success Cases', () => {
      it('should block user', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          blockedUsers: [],
        });
        
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          blockedUsers: [safety.blockUser.blockedUserId],
        });
        
        const response = await request(app)
          .post('/api/safety/block')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send(safety.blockUser);
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
    
    describe('Validation Errors', () => {
      it('should reject self-block', async () => {
        const userId = 'user_id';
        
        const response = await request(app)
          .post('/api/safety/block')
          .set('Authorization', `Bearer ${generateTestToken({ userId })}`)
          .send({ blockedUserId: userId });
        
        expect(response.status).toBe(400);
      });
      
      it('should reject blocking already blocked user', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          blockedUsers: ['already_blocked_id'],
        });
        
        const response = await request(app)
          .post('/api/safety/block')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ blockedUserId: 'already_blocked_id' });
        
        expect(response.status).toBe(400);
      });
    });
  });
  
  describe('DELETE /api/safety/block/:blockedUserId', () => {
    describe('Success Cases', () => {
      it('should unblock user', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          blockedUsers: ['blocked_user_id'],
        });
        
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          blockedUsers: [],
        });
        
        const response = await request(app)
          .delete('/api/safety/block/blocked_user_id')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('Edge Cases', () => {
      it('should return 404 for unblocking non-blocked user', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          blockedUsers: [],
        });
        
        const response = await request(app)
          .delete('/api/safety/block/not_blocked_user')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(404);
      });
    });
  });
  
  describe('GET /api/safety/blocked', () => {
    describe('Success Cases', () => {
      it('should return blocked users list', async () => {
        User.findById.mockReturnValue({
          populate: jest.fn().mockResolvedValue({
            _id: 'user_id',
            blockedUsers: [
              { _id: 'blocked_1', name: 'Blocked User 1' },
              { _id: 'blocked_2', name: 'Blocked User 2' },
            ],
          }),
        });
        
        const response = await request(app)
          .get('/api/safety/blocked')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
      });
      
      it('should return empty array for user with no blocks', async () => {
        User.findById.mockReturnValue({
          populate: jest.fn().mockResolvedValue({
            _id: 'user_id',
            blockedUsers: [],
          }),
        });
        
        const response = await request(app)
          .get('/api/safety/blocked')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
        expect(response.body.blockedUsers || []).toEqual([]);
      });
    });
  });
  
  describe('GET /api/safety/blocked/:otherUserId', () => {
    describe('Success Cases', () => {
      it('should return true if user is blocked', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          blockedUsers: ['blocked_user_id'],
        });
        
        const response = await request(app)
          .get('/api/safety/blocked/blocked_user_id')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
        expect(response.body.isBlocked).toBe(true);
      });
      
      it('should return false if user is not blocked', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          blockedUsers: [],
        });
        
        const response = await request(app)
          .get('/api/safety/blocked/not_blocked_user')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
        expect(response.body.isBlocked).toBe(false);
      });
    });
  });
  
  describe('POST /api/safety/flag', () => {
    describe('Success Cases', () => {
      it('should flag content', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
        });
        
        const response = await request(app)
          .post('/api/safety/flag')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send(safety.flagContent);
        
        expect(response.status).toBe(201);
      });
    });
  });
  
  describe('GET /api/safety/safety-score/:userId (Admin)', () => {
    describe('Success Cases', () => {
      it('should return safety score for admin', async () => {
        User.findById.mockImplementation((id) => {
          if (id === 'admin_id') {
            return Promise.resolve({ _id: 'admin_id', role: 'admin' });
          }
          return Promise.resolve({
            _id: id,
            safetyScore: 85,
            reports: [],
          });
        });
        
        const response = await request(app)
          .get('/api/safety/safety-score/target_user')
          .set('Authorization', `Bearer ${generateAdminToken()}`);
        
        expect(response.status).toBe(200);
      });
    });
  });
  
  describe('GET /api/safety/tips', () => {
    describe('Success Cases', () => {
      it('should return safety tips (public endpoint)', async () => {
        const response = await request(app)
          .get('/api/safety/tips');
        
        expect(response.status).toBe(200);
        expect(response.body.tips).toBeDefined();
      });
    });
  });
  
  describe('PUT /api/safety/suspend/:userId (Admin)', () => {
    describe('Success Cases', () => {
      it('should suspend user', async () => {
        User.findById.mockResolvedValue({
          _id: 'admin_id',
          role: 'admin',
        });
        
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'target_user',
          isSuspended: true,
        });
        
        const response = await request(app)
          .put('/api/safety/suspend/target_user')
          .set('Authorization', `Bearer ${generateAdminToken()}`)
          .send({ reason: 'Policy violation' });
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('Forbidden', () => {
      it('should reject non-admin request', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          role: 'user',
        });
        
        const response = await request(app)
          .put('/api/safety/suspend/target_user')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        assertForbidden(response);
      });
    });
  });
  
  describe('PUT /api/safety/unsuspend/:userId (Admin)', () => {
    describe('Success Cases', () => {
      it('should unsuspend user', async () => {
        User.findById.mockResolvedValue({
          _id: 'admin_id',
          role: 'admin',
        });
        
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'target_user',
          isSuspended: false,
        });
        
        const response = await request(app)
          .put('/api/safety/unsuspend/target_user')
          .set('Authorization', `Bearer ${generateAdminToken()}`);
        
        expect(response.status).toBe(200);
      });
    });
  });
  
  describe('GET /api/safety/account-status', () => {
    describe('Success Cases', () => {
      it('should return account status', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          isSuspended: false,
          accountStatus: 'active',
        });
        
        const response = await request(app)
          .get('/api/safety/account-status')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
      });
    });
  });
  
  describe('POST /api/safety/appeal', () => {
    describe('Success Cases', () => {
      it('should submit suspension appeal', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          isSuspended: true,
        });
        
        const response = await request(app)
          .post('/api/safety/appeal')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ reason: 'I believe this was a mistake' });
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('Edge Cases', () => {
      it('should reject appeal for non-suspended user', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          isSuspended: false,
        });
        
        const response = await request(app)
          .post('/api/safety/appeal')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ reason: 'Appeal reason' });
        
        expect(response.status).toBe(400);
      });
    });
  });
  
  describe('Advanced Safety Features', () => {
    describe('POST /api/safety/date-plan', () => {
      it('should share date plan', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
        });
        
        const response = await request(app)
          .post('/api/safety/date-plan')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send(safety.datePlan);
        
        expect(response.status).toBe(201);
      });
    });
    
    describe('POST /api/safety/checkin/start', () => {
      it('should start check-in', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
        });
        
        const response = await request(app)
          .post('/api/safety/checkin/start')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ duration: 60 });
        
        expect(response.status).toBe(201);
      });
    });
    
    describe('POST /api/safety/sos', () => {
      it('should send emergency SOS', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          emergencyContacts: ['+1234567890'],
        });
        
        const response = await request(app)
          .post('/api/safety/sos')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send(safety.sosAlert);
        
        expect(response.status).toBe(201);
      });
    });
    
    describe('POST /api/safety/emergency-contact', () => {
      it('should add emergency contact', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          emergencyContacts: [],
        });
        
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          emergencyContacts: [safety.emergencyContact],
        });
        
        const response = await request(app)
          .post('/api/safety/emergency-contact')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send(safety.emergencyContact);
        
        expect(response.status).toBe(201);
      });
    });
    
    describe('GET /api/safety/emergency-contacts', () => {
      it('should return emergency contacts', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          emergencyContacts: [safety.emergencyContact],
        });
        
        const response = await request(app)
          .get('/api/safety/emergency-contacts')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('POST /api/safety/background-check', () => {
      it('should initiate background check for premium user', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          subscription: { tier: 'gold' },
        });
        
        const response = await request(app)
          .post('/api/safety/background-check')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ targetUserId: 'target_user' });
        
        expect(response.status).toBe(201);
      });
    });
  });
});
