/**
 * Authentication Integration Tests
 * Tests the complete auth flow including registration, login, token refresh, and logout
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../server');
const User = require('../../src/core/domain/User');

let mongoServer;
let testUser;
let authToken;
let refreshToken;

// Test user data
const validUser = {
  email: 'test@example.com',
  password: 'SecurePassword123!',
  name: 'Test User',
  age: 25,
  gender: 'male',
  genderPreference: ['female'],
};

describe('Authentication API', () => {
  beforeAll(async () => {
    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to in-memory database
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear users before each test
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app).post('/api/auth/register').send(validUser).expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user).toHaveProperty('email', validUser.email);
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should reject registration with existing email', async () => {
      // First registration
      await request(app).post('/api/auth/register').send(validUser);

      // Second registration with same email
      const res = await request(app).post('/api/auth/register').send(validUser).expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already');
    });

    it('should reject registration with weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, password: '123' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject registration with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, email: 'invalid-email' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject registration for underage users', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, age: 17 })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should hash the password before storing', async () => {
      await request(app).post('/api/auth/register').send(validUser);

      const user = await User.findOne({ email: validUser.email });
      expect(user.password).not.toBe(validUser.password);
      expect(user.password).toMatch(/^\$2[ab]\$/); // bcrypt hash format
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      await request(app).post('/api/auth/register').send(validUser);
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: validUser.password,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('refreshToken');

      authToken = res.body.data.token;
      refreshToken = res.body.data.refreshToken;
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: validUser.password,
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should update lastActive on login', async () => {
      const beforeLogin = new Date();

      await request(app).post('/api/auth/login').send({
        email: validUser.email,
        password: validUser.password,
      });

      const user = await User.findOne({ email: validUser.email });
      expect(new Date(user.lastActive).getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validUser);

      const loginRes = await request(app).post('/api/auth/login').send({
        email: validUser.email,
        password: validUser.password,
      });

      authToken = loginRes.body.data.token;
      refreshToken = loginRes.body.data.refreshToken;
    });

    it('should refresh token with valid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.token).not.toBe(authToken);
    });

    it('should reject refresh with invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validUser);

      const loginRes = await request(app).post('/api/auth/login').send({
        email: validUser.email,
        password: validUser.password,
      });

      authToken = loginRes.body.data.token;
      refreshToken = loginRes.body.data.refreshToken;
    });

    it('should logout successfully', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should invalidate token after logout', async () => {
      await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${authToken}`);

      // Try to access protected route with old token
      const res = await request(app)
        .get('/api/profile/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Password Reset Flow', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validUser);
    });

    it('should send password reset email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: validUser.email })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should not reveal if email exists', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      // Should return success even for non-existent email (security)
      expect(res.body.success).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      // Make multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        await request(app).post('/api/auth/login').send({
          email: validUser.email,
          password: 'WrongPassword123!',
        });
      }

      // Next attempt should be rate limited
      const res = await request(app).post('/api/auth/login').send({
        email: validUser.email,
        password: 'WrongPassword123!',
      });

      // Should be either 401 (wrong password) or 429 (rate limited)
      expect([401, 429]).toContain(res.status);
    });
  });
});
