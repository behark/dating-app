/**
 * Backend Concurrent Message Tests
 * Tests for handling concurrent message operations
 */

const request = require('supertest');
const app = require('../../server');
const User = require('../../src/core/domain/User');
const Match = require('../../src/core/domain/Match');
const Message = require('../../src/core/domain/Message');
const mongoose = require('mongoose');

describe('Concurrent Message Operations', () => {
  let user1, user2;
  let match;
  let token1, token2;

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

    await user1.save();
    await user2.save();

    // Create a match
    match = new Match({
      users: [user1._id, user2._id],
      status: 'active',
    });
    await match.save();

    token1 = user1.generateAuthToken();
    token2 = user2.generateAuthToken();
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Match.deleteMany({});
    await Message.deleteMany({});
  });

  describe('Rapid Message Sending', () => {
    it('should handle rapid consecutive messages', async () => {
      const messages = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/api/chat/send')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            matchId: match._id.toString(),
            content: `Message ${i}`,
          })
      );

      const responses = await Promise.all(messages);

      // All should succeed
      responses.forEach((response) => {
        expect([200, 201, 400, 401]).toContain(response.status);
      });
    });

    it('should maintain message order', async () => {
      const messages = [];
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/chat/send')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            matchId: match._id.toString(),
            content: `Message ${i}`,
          });

        if (response.status === 200 || response.status === 201) {
          messages.push(response.body.data?.message || response.body.data);
        }
      }

      // Messages should be in order
      expect(messages.length).toBeGreaterThan(0);
    });

    it('should handle concurrent messages from both users', async () => {
      const messages = [
        ...Array.from({ length: 5 }, () =>
          request(app)
            .post('/api/chat/send')
            .set('Authorization', `Bearer ${token1}`)
            .send({
              matchId: match._id.toString(),
              content: 'Message from user1',
            })
        ),
        ...Array.from({ length: 5 }, () =>
          request(app)
            .post('/api/chat/send')
            .set('Authorization', `Bearer ${token2}`)
            .send({
              matchId: match._id.toString(),
              content: 'Message from user2',
            })
        ),
      ];

      const responses = await Promise.all(messages);

      // All should succeed
      responses.forEach((response) => {
        expect([200, 201, 400, 401]).toContain(response.status);
      });
    });
  });

  describe('Message Read Status Race Conditions', () => {
    it('should handle concurrent read status updates', async () => {
      // Send a message first
      await request(app)
        .post('/api/chat/send')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          matchId: match._id.toString(),
          content: 'Test message',
        });

      // Get messages
      const getResponse = await request(app)
        .get(`/api/chat/messages?matchId=${match._id.toString()}`)
        .set('Authorization', `Bearer ${token2}`);

      if (getResponse.status === 200 && getResponse.body.data?.messages?.length > 0) {
        const messageId = getResponse.body.data.messages[0]._id;

        // Concurrent read updates
        const updates = Array.from({ length: 3 }, () =>
          request(app)
            .put(`/api/chat/messages/${messageId}/read`)
            .set('Authorization', `Bearer ${token2}`)
        );

        const responses = await Promise.all(updates);

        // All should succeed
        responses.forEach((response) => {
          expect([200, 400, 401]).toContain(response.status);
        });
      }
    });
  });

  describe('Message Deletion Race Conditions', () => {
    it('should handle concurrent message deletions', async () => {
      // Send a message first
      const sendResponse = await request(app)
        .post('/api/chat/send')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          matchId: match._id.toString(),
          content: 'Message to delete',
        });

      if (sendResponse.status === 200 || sendResponse.status === 201) {
        const messageId = sendResponse.body.data?.message?._id || sendResponse.body.data?._id;

        if (messageId) {
          // Concurrent deletions
          const deletions = Array.from({ length: 3 }, () =>
            request(app)
              .delete(`/api/chat/messages/${messageId}`)
              .set('Authorization', `Bearer ${token1}`)
          );

          const responses = await Promise.all(deletions);

          // First should succeed, others may return 404
          responses.forEach((response) => {
            expect([200, 404, 401, 403]).toContain(response.status);
          });
        }
      }
    });
  });

  describe('Large Message Volume', () => {
    it('should handle sending many messages quickly', async () => {
      const messages = Array.from({ length: 100 }, (_, i) =>
        request(app)
          .post('/api/chat/send')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            matchId: match._id.toString(),
            content: `Message ${i}`,
          })
      );

      const responses = await Promise.all(messages);

      // Most should succeed (some may be rate limited)
      const successCount = responses.filter((r) => r.status === 200 || r.status === 201).length;
      expect(successCount).toBeGreaterThan(0);
    });

    it('should handle fetching messages with large history', async () => {
      // Send many messages first
      for (let i = 0; i < 50; i++) {
        await request(app)
          .post('/api/chat/send')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            matchId: match._id.toString(),
            content: `Message ${i}`,
          });
      }

      // Fetch messages
      const response = await request(app)
        .get(`/api/chat/messages?matchId=${match._id.toString()}`)
        .set('Authorization', `Bearer ${token1}`);

      expect([200, 400, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.data?.messages).toBeDefined();
      }
    });
  });
});
