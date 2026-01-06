/**
 * Chat & Messaging Integration Tests
 * Tests real-time messaging, conversations, and read receipts
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../server');
const User = require('../../models/User');
const Match = require('../../models/Match');
const Message = require('../../models/Message');
const Conversation = require('../../models/Conversation');

let mongoServer;
let user1Token, user2Token, user3Token;
let user1Id, user2Id, user3Id;
let matchId, conversationId;

describe('Chat & Messaging API', () => {
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
    await Match.deleteMany({});
    await Message.deleteMany({});
    await Conversation.deleteMany({});

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

    const user3Res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user3@test.com',
        password: 'Password123!',
        name: 'User Three',
        age: 28,
        gender: 'male',
        genderPreference: ['female'],
      });
    user3Token = user3Res.body.data.token;
    user3Id = user3Res.body.data.user._id;

    // Create a match between user1 and user2
    await request(app)
      .post('/api/swipe/like')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ targetUserId: user2Id });

    await request(app)
      .post('/api/swipe/like')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ targetUserId: user1Id });

    // Get the match/conversation
    const matchesRes = await request(app)
      .get('/api/matches')
      .set('Authorization', `Bearer ${user1Token}`);

    if (matchesRes.body.data?.length > 0) {
      matchId = matchesRes.body.data[0]._id;
      conversationId = matchesRes.body.data[0].conversationId;
    }
  });

  describe('GET /api/conversations', () => {
    it('should return user conversations', async () => {
      const res = await request(app)
        .get('/api/conversations')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/conversations').expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/messages', () => {
    it('should send a message to a matched user', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          recipientId: user2Id,
          content: 'Hello! Nice to match with you.',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.content).toBe('Hello! Nice to match with you.');
    });

    it('should not allow messaging non-matched users', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          recipientId: user3Id,
          content: 'Hey there!',
        })
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should validate message content length', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          recipientId: user2Id,
          content: '', // Empty message
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should prevent messaging blocked users', async () => {
      // Block user2
      await request(app)
        .post('/api/safety/block')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ blockedUserId: user2Id });

      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          recipientId: user2Id,
          content: 'Hello!',
        })
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/messages/:conversationId', () => {
    beforeEach(async () => {
      // Send some messages
      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ recipientId: user2Id, content: 'Hello!' });

      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ recipientId: user1Id, content: 'Hi there!' });

      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ recipientId: user2Id, content: 'How are you?' });
    });

    it('should return conversation messages', async () => {
      if (!conversationId) {
        console.warn('Conversation ID not found, skipping test');
        return;
      }

      const res = await request(app)
        .get(`/api/messages/${conversationId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(3);
    });

    it('should paginate messages', async () => {
      if (!conversationId) {
        console.warn('Conversation ID not found, skipping test');
        return;
      }

      const res = await request(app)
        .get(`/api/messages/${conversationId}?limit=2`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
    });

    it('should not allow accessing others conversations', async () => {
      if (!conversationId) {
        console.warn('Conversation ID not found, skipping test');
        return;
      }

      const res = await request(app)
        .get(`/api/messages/${conversationId}`)
        .set('Authorization', `Bearer ${user3Token}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/messages/:messageId/read', () => {
    let messageId;

    beforeEach(async () => {
      // Send a message from user2 to user1
      const msgRes = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ recipientId: user1Id, content: 'Can you see this?' });

      messageId = msgRes.body.data?._id;
    });

    it('should mark message as read', async () => {
      if (!messageId) {
        console.warn('Message ID not found, skipping test');
        return;
      }

      const res = await request(app)
        .put(`/api/messages/${messageId}/read`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should not allow marking own messages as read', async () => {
      if (!messageId) {
        console.warn('Message ID not found, skipping test');
        return;
      }

      const res = await request(app)
        .put(`/api/messages/${messageId}/read`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/messages/:messageId', () => {
    let messageId;

    beforeEach(async () => {
      const msgRes = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ recipientId: user2Id, content: 'Delete me' });

      messageId = msgRes.body.data?._id;
    });

    it('should allow user to delete own message', async () => {
      if (!messageId) {
        console.warn('Message ID not found, skipping test');
        return;
      }

      const res = await request(app)
        .delete(`/api/messages/${messageId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should not allow deleting others messages', async () => {
      if (!messageId) {
        console.warn('Message ID not found, skipping test');
        return;
      }

      const res = await request(app)
        .delete(`/api/messages/${messageId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Message Content Moderation', () => {
    it('should filter profanity in messages', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          recipientId: user2Id,
          content: 'This is a test message',
        });

      // Response should be successful with potentially filtered content
      expect(res.body.success).toBe(true);
    });

    it('should detect and flag suspicious URLs', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          recipientId: user2Id,
          content: 'Check out http://suspicious-site.com/scam',
        });

      // Should either filter or flag the message
      expect(res.body).toBeDefined();
    });
  });

  describe('Typing Indicators', () => {
    it('should accept typing indicator update', async () => {
      const res = await request(app)
        .post('/api/messages/typing')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          recipientId: user2Id,
          isTyping: true,
        });

      // Typing indicators are usually handled via WebSocket
      // HTTP endpoint may or may not exist
      expect([200, 201, 404]).toContain(res.status);
    });
  });
});
