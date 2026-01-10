/**
 * Safety Service Integration Tests
 * Tests blocking, reporting, and safety features
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../server');
const User = require('../../src/core/domain/User');
const Block = require('../../src/core/domain/Block');
const Report = require('../../src/core/domain/Report');

let mongoServer;
let user1Token, user2Token, adminToken;
let user1Id, user2Id, adminId;

describe('Safety API', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Block.deleteMany({});
    await Report.deleteMany({});

    // Create test users
    const user1Res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user1@test.com',
        password: 'Password123!',
        name: 'User One',
        age: 25,
        gender: 'male',
        genderPreference: ['female'],
      });
    user1Token = user1Res.body.data.token;
    user1Id = user1Res.body.data.user._id;

    const user2Res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user2@test.com',
        password: 'Password123!',
        name: 'User Two',
        age: 25,
        gender: 'female',
        genderPreference: ['male'],
      });
    user2Token = user2Res.body.data.token;
    user2Id = user2Res.body.data.user._id;

    // Create admin user
    const adminUser = new User({
      email: 'admin@test.com',
      password: 'AdminPassword123!',
      name: 'Admin User',
      age: 30,
      gender: 'other',
      genderPreference: ['male', 'female', 'other'],
      role: 'admin',
    });
    await adminUser.save();
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'AdminPassword123!' });
    adminToken = adminLoginRes.body.data.token;
    adminId = adminUser._id;
  });

  describe('POST /api/safety/block', () => {
    it('should block a user successfully', async () => {
      const res = await request(app)
        .post('/api/safety/block')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ blockedUserId: user2Id })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should not allow blocking yourself', async () => {
      const res = await request(app)
        .post('/api/safety/block')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ blockedUserId: user1Id })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should prevent duplicate blocks', async () => {
      // First block
      await request(app)
        .post('/api/safety/block')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ blockedUserId: user2Id });

      // Second block attempt
      const res = await request(app)
        .post('/api/safety/block')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ blockedUserId: user2Id })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/safety/block/:blockedUserId', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/safety/block')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ blockedUserId: user2Id });
    });

    it('should unblock a user successfully', async () => {
      const res = await request(app)
        .delete(`/api/safety/block/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should return error when unblocking non-blocked user', async () => {
      // First unblock
      await request(app)
        .delete(`/api/safety/block/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      // Second unblock attempt
      const res = await request(app)
        .delete(`/api/safety/block/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/safety/blocked', () => {
    it('should return list of blocked users', async () => {
      // Block user2
      await request(app)
        .post('/api/safety/block')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ blockedUserId: user2Id });

      const res = await request(app)
        .get('/api/safety/blocked')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.blockedUsers).toHaveLength(1);
    });
  });

  describe('POST /api/safety/report', () => {
    it('should create a report successfully', async () => {
      const res = await request(app)
        .post('/api/safety/report')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reportedUserId: user2Id,
          category: 'harassment',
          description: 'This user sent inappropriate messages',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('reportId');
    });

    it('should require description minimum length', async () => {
      const res = await request(app)
        .post('/api/safety/report')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reportedUserId: user2Id,
          category: 'harassment',
          description: 'Short',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should not allow reporting yourself', async () => {
      const res = await request(app)
        .post('/api/safety/report')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          reportedUserId: user1Id,
          category: 'harassment',
          description: 'This is a test report description',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Admin-only Safety Routes', () => {
    describe('GET /api/safety/reports', () => {
      it('should allow admin to get reports', async () => {
        const res = await request(app)
          .get('/api/safety/reports')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
      });

      it('should reject non-admin access', async () => {
        const res = await request(app)
          .get('/api/safety/reports')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(403);

        expect(res.body.success).toBe(false);
      });
    });

    describe('PUT /api/safety/suspend/:userId', () => {
      it('should allow admin to suspend user', async () => {
        const res = await request(app)
          .put(`/api/safety/suspend/${user2Id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ reason: 'Violation of terms' })
          .expect(200);

        expect(res.body.success).toBe(true);
      });

      it('should reject non-admin access', async () => {
        const res = await request(app)
          .put(`/api/safety/suspend/${user2Id}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .send({ reason: 'Violation of terms' })
          .expect(403);

        expect(res.body.success).toBe(false);
      });
    });
  });

  describe('GET /api/safety/tips', () => {
    it('should return safety tips without authentication', async () => {
      const res = await request(app).get('/api/safety/tips').expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });
});
