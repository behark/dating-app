/**
 * Authentication API Tests
 * Comprehensive test suite for /api/auth endpoints
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// Test utilities
const {
  generateTestToken,
  generateExpiredToken,
  generateInvalidToken,
  authHeader,
  assertUnauthorized,
  assertValidationError,
  randomEmail,
} = require('../utils/testHelpers');

const { users, oauth } = require('../utils/fixtures');

// Mock dependencies
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue({}),
    connection: {
      on: jest.fn(),
      once: jest.fn(),
      readyState: 1,
    },
  };
});

jest.mock('../../src/core/domain/User', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  prototype: {
    save: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('test_token'),
  verify: jest.fn().mockReturnValue({ userId: 'test_user_id' }),
}));

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Import routes (they will use mocked dependencies)
  const authRoutes = require('../../routes/auth');
  app.use('/api/auth', authRoutes);

  // Error handler
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  });

  return app;
};

describe('Auth API Tests', () => {
  let app;
  const User = require('../../src/core/domain/User');
  const bcrypt = require('bcryptjs');
  const jwt = require('jsonwebtoken');

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    describe('Success Cases', () => {
      it('should register a new user with valid data', async () => {
        User.findOne.mockResolvedValue(null);
        User.create.mockResolvedValue({
          _id: 'new_user_id',
          email: users.validUser.email,
          name: users.validUser.name,
          age: users.validUser.age,
          toObject: () => ({
            _id: 'new_user_id',
            email: users.validUser.email,
            name: users.validUser.name,
          }),
        });

        const response = await request(app).post('/api/auth/register').send(users.validUser);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      it('should register user with minimum required fields', async () => {
        User.findOne.mockResolvedValue(null);
        User.create.mockResolvedValue({
          _id: 'new_user_id',
          email: 'min@example.com',
          name: 'Min User',
          toObject: () => ({ _id: 'new_user_id' }),
        });

        const response = await request(app).post('/api/auth/register').send({
          email: 'min@example.com',
          password: 'Password123!',
          name: 'Min User',
        });

        expect(response.status).toBe(201);
      });

      it('should hash password before saving', async () => {
        User.findOne.mockResolvedValue(null);
        User.create.mockResolvedValue({
          _id: 'new_user_id',
          toObject: () => ({ _id: 'new_user_id' }),
        });

        await request(app).post('/api/auth/register').send(users.validUser);

        expect(bcrypt.hash).toHaveBeenCalled();
      });
    });

    describe('Validation Errors', () => {
      it('should reject registration without email', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send(users.invalidUserNoEmail);

        assertValidationError(response);
      });

      it('should reject registration without password', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send(users.invalidUserNoPassword);

        assertValidationError(response);
      });

      it('should reject registration with short password', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send(users.invalidUserShortPassword);

        assertValidationError(response);
        expect(response.body.errors).toBeDefined();
      });

      it('should reject registration with invalid email format', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send(users.invalidUserBadEmail);

        assertValidationError(response);
      });

      it('should reject registration without name', async () => {
        const response = await request(app).post('/api/auth/register').send({
          email: 'test@example.com',
          password: 'Password123!',
        });

        assertValidationError(response);
      });

      it('should reject underage users (age < 18)', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send(users.invalidUserUnderage);

        assertValidationError(response);
      });

      it('should reject users with invalid age (> 100)', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send(users.invalidUserOverage);

        assertValidationError(response);
      });

      it('should reject invalid gender values', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            ...users.validUser,
            email: randomEmail(),
            gender: 'invalid',
          });

        assertValidationError(response);
      });
    });

    describe('Duplicate Email', () => {
      it('should reject registration with existing email', async () => {
        User.findOne.mockResolvedValue({ _id: 'existing_user' });

        const response = await request(app).post('/api/auth/register').send(users.validUser);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('POST /api/auth/login', () => {
    describe('Success Cases', () => {
      it('should login with valid credentials', async () => {
        User.findOne.mockResolvedValue({
          _id: 'user_id',
          email: users.validUser.email,
          password: 'hashed_password',
          isEmailVerified: true,
          toObject: () => ({ _id: 'user_id', email: users.validUser.email }),
        });
        bcrypt.compare.mockResolvedValue(true);

        const response = await request(app).post('/api/auth/login').send({
          email: users.validUser.email,
          password: users.validUser.password,
        });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.token).toBeDefined();
      });

      it('should return user data on successful login', async () => {
        User.findOne.mockResolvedValue({
          _id: 'user_id',
          email: users.validUser.email,
          name: users.validUser.name,
          password: 'hashed_password',
          isEmailVerified: true,
          toObject: () => ({
            _id: 'user_id',
            email: users.validUser.email,
            name: users.validUser.name,
          }),
        });
        bcrypt.compare.mockResolvedValue(true);

        const response = await request(app).post('/api/auth/login').send({
          email: users.validUser.email,
          password: users.validUser.password,
        });

        expect(response.body.user).toBeDefined();
      });
    });

    describe('Validation Errors', () => {
      it('should reject login without email', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ password: 'Password123!' });

        assertValidationError(response);
      });

      it('should reject login without password', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com' });

        assertValidationError(response);
      });

      it('should reject login with invalid email format', async () => {
        const response = await request(app).post('/api/auth/login').send({
          email: 'notanemail',
          password: 'Password123!',
        });

        assertValidationError(response);
      });
    });

    describe('Invalid Credentials', () => {
      it('should reject login with wrong password', async () => {
        User.findOne.mockResolvedValue({
          _id: 'user_id',
          email: users.validUser.email,
          password: 'hashed_password',
        });
        bcrypt.compare.mockResolvedValue(false);

        const response = await request(app).post('/api/auth/login').send({
          email: users.validUser.email,
          password: 'wrongpassword',
        });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      });

      it('should reject login with non-existent email', async () => {
        User.findOne.mockResolvedValue(null);

        const response = await request(app).post('/api/auth/login').send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

        expect(response.status).toBe(401);
      });
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      User.findOne.mockResolvedValue({
        _id: 'user_id',
        emailVerificationToken: 'valid_token',
        save: jest.fn().mockResolvedValue(true),
      });

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'valid_token' });

      expect(response.status).toBe(200);
    });

    it('should reject verification without token', async () => {
      const response = await request(app).post('/api/auth/verify-email').send({});

      assertValidationError(response);
    });

    it('should reject verification with invalid token', async () => {
      User.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'invalid_token' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send reset email for existing user', async () => {
      User.findOne.mockResolvedValue({
        _id: 'user_id',
        email: 'test@example.com',
        save: jest.fn().mockResolvedValue(true),
      });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
    });

    it('should reject without email', async () => {
      const response = await request(app).post('/api/auth/forgot-password').send({});

      assertValidationError(response);
    });

    it('should handle non-existent email gracefully', async () => {
      User.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      // Should return success to prevent email enumeration
      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      User.findOne.mockResolvedValue({
        _id: 'user_id',
        passwordResetToken: 'valid_token',
        passwordResetExpires: new Date(Date.now() + 3600000),
        save: jest.fn().mockResolvedValue(true),
      });

      const response = await request(app).post('/api/auth/reset-password').send({
        token: 'valid_token',
        newPassword: 'NewPassword123!',
      });

      expect(response.status).toBe(200);
    });

    it('should reject without token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ newPassword: 'NewPassword123!' });

      assertValidationError(response);
    });

    it('should reject without new password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'valid_token' });

      assertValidationError(response);
    });

    it('should reject short new password', async () => {
      const response = await request(app).post('/api/auth/reset-password').send({
        token: 'valid_token',
        newPassword: 'short',
      });

      assertValidationError(response);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should refresh token with valid refresh token', async () => {
      User.findOne.mockResolvedValue({
        _id: 'user_id',
        refreshToken: 'valid_refresh_token',
      });
      jwt.verify.mockReturnValue({ userId: 'user_id' });

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'valid_refresh_token' });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
    });

    it('should reject without refresh token', async () => {
      const response = await request(app).post('/api/auth/refresh-token').send({});

      assertValidationError(response);
    });
  });

  describe('DELETE /api/auth/delete-account', () => {
    it('should delete account for authenticated user', async () => {
      User.findById.mockResolvedValue({
        _id: 'user_id',
        deleteOne: jest.fn().mockResolvedValue(true),
      });

      const response = await request(app)
        .delete('/api/auth/delete-account')
        .set('Authorization', `Bearer ${generateTestToken()}`);

      expect(response.status).toBe(200);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app).delete('/api/auth/delete-account');

      assertUnauthorized(response);
    });
  });

  describe('OAuth Routes', () => {
    describe('POST /api/auth/google', () => {
      it('should authenticate with valid Google credentials', async () => {
        User.findOne.mockResolvedValue(null);
        User.create.mockResolvedValue({
          _id: 'new_user_id',
          ...oauth.google,
          toObject: () => ({ _id: 'new_user_id', ...oauth.google }),
        });

        const response = await request(app).post('/api/auth/google').send(oauth.google);

        expect(response.status).toBe(200);
      });

      it('should reject without googleId', async () => {
        const response = await request(app)
          .post('/api/auth/google')
          .send({ email: 'test@example.com' });

        assertValidationError(response);
      });

      it('should reject without email', async () => {
        const response = await request(app)
          .post('/api/auth/google')
          .send({ googleId: 'google_123' });

        assertValidationError(response);
      });
    });

    describe('POST /api/auth/facebook', () => {
      it('should authenticate with valid Facebook credentials', async () => {
        User.findOne.mockResolvedValue(null);
        User.create.mockResolvedValue({
          _id: 'new_user_id',
          ...oauth.facebook,
          toObject: () => ({ _id: 'new_user_id', ...oauth.facebook }),
        });

        const response = await request(app).post('/api/auth/facebook').send(oauth.facebook);

        expect(response.status).toBe(200);
      });

      it('should reject without facebookId', async () => {
        const response = await request(app)
          .post('/api/auth/facebook')
          .send({ email: 'test@example.com' });

        assertValidationError(response);
      });
    });

    describe('POST /api/auth/apple', () => {
      it('should authenticate with valid Apple credentials', async () => {
        User.findOne.mockResolvedValue(null);
        User.create.mockResolvedValue({
          _id: 'new_user_id',
          ...oauth.apple,
          toObject: () => ({ _id: 'new_user_id', ...oauth.apple }),
        });

        const response = await request(app).post('/api/auth/apple').send(oauth.apple);

        expect(response.status).toBe(200);
      });

      it('should reject without appleId', async () => {
        const response = await request(app).post('/api/auth/apple').send({});

        assertValidationError(response);
      });
    });

    describe('GET /api/auth/oauth-status', () => {
      it('should return OAuth configuration status', async () => {
        const response = await request(app).get('/api/auth/oauth-status');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('google');
        expect(response.body.data).toHaveProperty('facebook');
        expect(response.body.data).toHaveProperty('apple');
      });
    });
  });

  describe('Phone Verification', () => {
    describe('POST /api/auth/send-phone-verification', () => {
      it('should send verification code for authenticated user', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          save: jest.fn().mockResolvedValue(true),
        });

        const response = await request(app)
          .post('/api/auth/send-phone-verification')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ phoneNumber: '+1234567890' });

        expect(response.status).toBe(200);
      });

      it('should reject without phone number', async () => {
        const response = await request(app)
          .post('/api/auth/send-phone-verification')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({});

        assertValidationError(response);
      });

      it('should reject unauthenticated request', async () => {
        const response = await request(app)
          .post('/api/auth/send-phone-verification')
          .send({ phoneNumber: '+1234567890' });

        assertUnauthorized(response);
      });
    });

    describe('POST /api/auth/verify-phone', () => {
      it('should verify phone with valid code', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          phoneVerificationCode: '123456',
          phoneVerificationExpires: new Date(Date.now() + 600000),
          save: jest.fn().mockResolvedValue(true),
        });

        const response = await request(app)
          .post('/api/auth/verify-phone')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ code: '123456' });

        expect(response.status).toBe(200);
      });

      it('should reject without code', async () => {
        const response = await request(app)
          .post('/api/auth/verify-phone')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({});

        assertValidationError(response);
      });
    });
  });
});
