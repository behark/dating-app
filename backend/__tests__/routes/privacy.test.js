/**
 * Privacy API Tests
 * Comprehensive test suite for /api/privacy endpoints
 */

const request = require('supertest');
const express = require('express');

const {
  generateTestToken,
  authHeader,
  assertUnauthorized,
  assertRateLimited,
} = require('../utils/testHelpers');

const { privacy } = require('../utils/fixtures');

// Mock dependencies
jest.mock('../../src/core/domain/User', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  const privacyRoutes = require('../../routes/privacy');
  app.use('/api/privacy', privacyRoutes);

  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  });

  return app;
};

describe('Privacy API Tests', () => {
  let app;
  const User = require('../../src/core/domain/User');

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/privacy/export (GDPR Data Portability)', () => {
    describe('Success Cases', () => {
      it('should export all user data', async () => {
        User.findById.mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            _id: 'user_id',
            email: 'test@example.com',
            name: 'Test User',
            photos: [],
            matches: [],
            messages: [],
          }),
        });

        const response = await request(app)
          .get('/api/privacy/export')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      });

      it('should include all user-related data in export', async () => {
        User.findById.mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            _id: 'user_id',
            email: 'test@example.com',
            name: 'Test User',
            photos: [{ url: 'photo.jpg' }],
            preferences: { ageRange: { min: 20, max: 30 } },
            blockedUsers: [],
          }),
        });

        const response = await request(app)
          .get('/api/privacy/export')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });
    });

    describe('Unauthorized Access', () => {
      it('should reject unauthenticated request', async () => {
        const response = await request(app).get('/api/privacy/export');

        assertUnauthorized(response);
      });
    });
  });

  describe('GET /api/privacy/settings', () => {
    describe('Success Cases', () => {
      it('should return privacy settings', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          privacySettings: {
            showOnlineStatus: true,
            showLastActive: true,
            showDistance: false,
            shareReadReceipts: true,
          },
        });

        const response = await request(app)
          .get('/api/privacy/settings')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should return default settings for user without custom settings', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          // No privacySettings
        });

        const response = await request(app)
          .get('/api/privacy/settings')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });
    });
  });

  describe('PUT /api/privacy/settings', () => {
    describe('Success Cases', () => {
      it('should update privacy settings', async () => {
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          privacySettings: privacy.validSettings,
        });

        const response = await request(app)
          .put('/api/privacy/settings')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send(privacy.validSettings);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should update individual privacy settings', async () => {
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          privacySettings: { showOnlineStatus: false },
        });

        const response = await request(app)
          .put('/api/privacy/settings')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ showOnlineStatus: false });

        expect(response.status).toBe(200);
      });
    });
  });

  describe('POST /api/privacy/do-not-sell (CCPA)', () => {
    describe('Success Cases', () => {
      it('should opt out of data selling', async () => {
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          doNotSell: true,
          doNotSellRequestedAt: new Date(),
        });

        const response = await request(app)
          .post('/api/privacy/do-not-sell')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('DELETE /api/privacy/delete-account (GDPR Right to be Forgotten)', () => {
    describe('Success Cases', () => {
      it('should delete account and all data', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          email: 'test@example.com',
        });

        User.findByIdAndDelete.mockResolvedValue({
          _id: 'user_id',
        });

        const response = await request(app)
          .delete('/api/privacy/delete-account')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should confirm deletion with confirmation phrase', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          email: 'test@example.com',
        });

        User.findByIdAndDelete.mockResolvedValue({
          _id: 'user_id',
        });

        const response = await request(app)
          .delete('/api/privacy/delete-account')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ confirm: 'DELETE MY ACCOUNT' });

        expect(response.status).toBe(200);
      });
    });

    describe('Unauthorized Access', () => {
      it('should reject unauthenticated request', async () => {
        const response = await request(app).delete('/api/privacy/delete-account');

        assertUnauthorized(response);
      });
    });
  });

  describe('PUT /api/privacy/rectify (GDPR Right to Rectification)', () => {
    describe('Success Cases', () => {
      it('should update personal data', async () => {
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          name: 'Corrected Name',
        });

        const response = await request(app)
          .put('/api/privacy/rectify')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send(privacy.rectifyData);

        expect(response.status).toBe(200);
      });
    });

    describe('Validation', () => {
      it('should reject invalid email format', async () => {
        const response = await request(app)
          .put('/api/privacy/rectify')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            fields: { email: 'not-an-email' },
          });

        expect(response.status).toBe(400);
      });
    });
  });

  describe('Consent Management', () => {
    describe('GET /api/privacy/consent', () => {
      it('should return consent status', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          consents: {
            marketing: { granted: true, timestamp: new Date() },
            analytics: { granted: true, timestamp: new Date() },
            thirdParty: { granted: false, timestamp: new Date() },
          },
        });

        const response = await request(app)
          .get('/api/privacy/consent')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('POST /api/privacy/consent', () => {
      it('should record consent', async () => {
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          consents: {
            marketing: { granted: true, timestamp: new Date() },
          },
        });

        const response = await request(app)
          .post('/api/privacy/consent')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send(privacy.consentUpdate);

        expect(response.status).toBe(200);
      });

      it('should record different consent types', async () => {
        const consentTypes = ['marketing', 'analytics', 'thirdParty', 'notifications'];

        for (const consentType of consentTypes) {
          User.findByIdAndUpdate.mockResolvedValue({
            _id: 'user_id',
            consents: { [consentType]: { granted: true } },
          });

          const response = await request(app)
            .post('/api/privacy/consent')
            .set('Authorization', `Bearer ${generateTestToken()}`)
            .send({ consentType, granted: true });

          expect(response.status).toBe(200);
        }
      });
    });

    describe('DELETE /api/privacy/consent', () => {
      it('should withdraw consent', async () => {
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          consents: {
            marketing: { granted: false, withdrawnAt: new Date() },
          },
        });

        const response = await request(app)
          .delete('/api/privacy/consent')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ consentType: 'marketing' });

        expect(response.status).toBe(200);
      });
    });
  });
});
