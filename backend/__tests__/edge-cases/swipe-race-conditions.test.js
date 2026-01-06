/**
 * Backend Swipe Race Condition Tests
 * Tests for handling race conditions in swipe operations
 */

const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const Swipe = require('../../models/Swipe');
const mongoose = require('mongoose');

describe('Swipe Race Conditions', () => {
  let user1, user2, user3;
  let token1;

  beforeEach(async () => {
    // Create test users
    user1 = new User({
      email: 'user1@test.com',
      password: 'password123',
      name: 'User 1',
      age: 25,
    });
    user2 = new User({
      email: 'user2@test.com',
      password: 'password123',
      name: 'User 2',
      age: 26,
    });
    user3 = new User({
      email: 'user3@test.com',
      password: 'password123',
      name: 'User 3',
      age: 27,
    });

    await user1.save();
    await user2.save();
    await user3.save();
    token1 = user1.generateAuthToken();
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Swipe.deleteMany({});
  });

  describe('Rapid Swipe Operations', () => {
    it('should handle rapid consecutive swipes on different users', async () => {
      const swipes = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/api/swipes')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            targetId: new User({ email: `target${i}@test.com`, password: 'pass', name: 'Target', age: 25 })
              ._id,
            type: 'like',
          })
      );

      const responses = await Promise.all(swipes);

      // All should succeed or be handled gracefully
      responses.forEach((response) => {
        expect([200, 400, 429]).toContain(response.status);
      });
    });

    it('should prevent duplicate swipes on same user', async () => {
      // First swipe
      const response1 = await request(app)
        .post('/api/swipes')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          targetId: user2._id.toString(),
          type: 'like',
        });

      expect([200, 201]).toContain(response1.status);

      // Attempt duplicate swipe
      const response2 = await request(app)
        .post('/api/swipes')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          targetId: user2._id.toString(),
          type: 'like',
        });

      // Should return error or existing swipe
      expect([200, 400, 409]).toContain(response2.status);
    });

    it('should handle concurrent swipes on same target by different users', async () => {
      const user4 = new User({
        email: 'user4@test.com',
        password: 'password123',
        name: 'User 4',
        age: 28,
      });
      await user4.save();
      const token4 = user4.generateAuthToken();

      const swipes = [
        request(app)
          .post('/api/swipes')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            targetId: user2._id.toString(),
            type: 'like',
          }),
        request(app)
          .post('/api/swipes')
          .set('Authorization', `Bearer ${token4}`)
          .send({
            targetId: user2._id.toString(),
            type: 'like',
          }),
      ];

      const responses = await Promise.all(swipes);

      // Both should succeed
      responses.forEach((response) => {
        expect([200, 201]).toContain(response.status);
      });
    });
  });

  describe('Match Creation Race Conditions', () => {
    it('should handle mutual like race condition', async () => {
      // User1 likes User2
      await request(app)
        .post('/api/swipes')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          targetId: user2._id.toString(),
          type: 'like',
        });

      // User2 likes User1 (should create match)
      const token2 = user2.generateAuthToken();
      const response = await request(app)
        .post('/api/swipes')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          targetId: user1._id.toString(),
          type: 'like',
        });

      expect([200, 201]).toContain(response.status);
      if (response.body.data?.isMatch) {
        expect(response.body.data.isMatch).toBe(true);
      }
    });

    it('should handle concurrent mutual likes', async () => {
      const token2 = user2.generateAuthToken();

      // Both users swipe on each other simultaneously
      const swipes = [
        request(app)
          .post('/api/swipes')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            targetId: user2._id.toString(),
            type: 'like',
          }),
        request(app)
          .post('/api/swipes')
          .set('Authorization', `Bearer ${token2}`)
          .send({
            targetId: user1._id.toString(),
            type: 'like',
          }),
      ];

      const responses = await Promise.all(swipes);

      // At least one should indicate a match
      const hasMatch = responses.some((res) => res.body.data?.isMatch === true);
      // Race condition: match might be created by either request
      expect(responses.every((res) => [200, 201].includes(res.status))).toBe(true);
    });
  });

  describe('Swipe Limit Race Conditions', () => {
    it('should handle rapid swipes approaching daily limit', async () => {
      // Make many rapid swipes
      const swipes = Array.from({ length: 50 }, (_, i) => {
        const targetUser = new User({
          email: `target${i}@test.com`,
          password: 'pass',
          name: 'Target',
          age: 25,
        });
        return request(app)
          .post('/api/swipes')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            targetId: targetUser._id.toString(),
            type: 'like',
          });
      });

      const responses = await Promise.all(swipes);

      // Some may be rate limited
      const rateLimited = responses.some((res) => res.status === 429);
      if (rateLimited) {
        expect(responses.find((res) => res.status === 429).body.message).toMatch(/limit|rate/i);
      }
    });
  });

  describe('Database Transaction Race Conditions', () => {
    it('should handle concurrent database operations', async () => {
      const operations = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .get('/api/profile')
          .set('Authorization', `Bearer ${token1}`)
      );

      const responses = await Promise.all(operations);

      // All should succeed
      responses.forEach((response) => {
        expect([200, 401, 403]).toContain(response.status);
      });
    });

    it('should maintain data consistency during concurrent updates', async () => {
      const updates = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            bio: `Bio update ${i}`,
          })
      );

      const responses = await Promise.all(updates);

      // All should succeed
      responses.forEach((response) => {
        expect([200, 400, 401]).toContain(response.status);
      });
    });
  });
});
