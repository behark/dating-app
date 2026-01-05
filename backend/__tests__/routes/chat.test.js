/**
 * Chat API Tests
 * Comprehensive test suite for /api/chat endpoints
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

const { messages } = require('../utils/fixtures');

// Mock dependencies
jest.mock('../../models/Message', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  updateMany: jest.fn(),
  aggregate: jest.fn(),
  countDocuments: jest.fn(),
}));

jest.mock('../../models/Match', () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
}));

jest.mock('../../models/User', () => ({
  findById: jest.fn(),
}));

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  const chatRoutes = require('../../routes/chat');
  app.use('/api/chat', chatRoutes);
  
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  });
  
  return app;
};

describe('Chat API Tests', () => {
  let app;
  const Message = require('../../models/Message');
  const Match = require('../../models/Match');
  const User = require('../../models/User');
  
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    app = createTestApp();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/chat/conversations', () => {
    describe('Success Cases', () => {
      it('should return all conversations for user', async () => {
        Match.find = jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([
            {
              _id: 'match_1',
              users: [
                { _id: 'user_id', name: 'Current User' },
                { _id: 'other_user', name: 'Other User' },
              ],
            },
          ]),
        });
        
        Message.findOne = jest.fn().mockResolvedValue({
          _id: 'message_1',
          content: 'Last message',
          createdAt: new Date(),
        });
        
        const response = await request(app)
          .get('/api/chat/conversations')
          .set('x-user-id', 'user_id');
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
      
      it('should return empty array for user with no conversations', async () => {
        Match.find = jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        });
        
        const response = await request(app)
          .get('/api/chat/conversations')
          .set('x-user-id', 'user_id');
        
        expect(response.status).toBe(200);
        expect(response.body.conversations || []).toEqual([]);
      });
      
      it('should include last message in conversation', async () => {
        Match.find = jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([
            {
              _id: 'match_1',
              users: [
                { _id: 'user_id', name: 'Current User' },
                { _id: 'other_user', name: 'Other User' },
              ],
            },
          ]),
        });
        
        Message.findOne = jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue({
            _id: 'message_1',
            content: 'Last message',
            createdAt: new Date(),
          }),
        });
        
        const response = await request(app)
          .get('/api/chat/conversations')
          .set('x-user-id', 'user_id');
        
        expect(response.status).toBe(200);
      });
    });
  });
  
  describe('GET /api/chat/unread', () => {
    describe('Success Cases', () => {
      it('should return unread message count', async () => {
        Message.countDocuments.mockResolvedValue(5);
        
        const response = await request(app)
          .get('/api/chat/unread')
          .set('x-user-id', 'user_id');
        
        expect(response.status).toBe(200);
        expect(response.body.count).toBeDefined();
      });
      
      it('should return 0 for user with no unread messages', async () => {
        Message.countDocuments.mockResolvedValue(0);
        
        const response = await request(app)
          .get('/api/chat/unread')
          .set('x-user-id', 'user_id');
        
        expect(response.status).toBe(200);
        expect(response.body.count).toBe(0);
      });
    });
  });
  
  describe('GET /api/chat/messages/:matchId', () => {
    describe('Success Cases', () => {
      it('should return messages for a match', async () => {
        Match.findById.mockResolvedValue({
          _id: 'match_id',
          users: ['user_id', 'other_user'],
          status: 'active',
        });
        
        Message.find.mockReturnValue({
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([
            {
              _id: 'message_1',
              senderId: 'user_id',
              content: 'Hello',
              createdAt: new Date(),
            },
            {
              _id: 'message_2',
              senderId: 'other_user',
              content: 'Hi there',
              createdAt: new Date(),
            },
          ]),
        });
        
        const response = await request(app)
          .get('/api/chat/messages/match_id')
          .set('x-user-id', 'user_id');
        
        expect(response.status).toBe(200);
        expect(response.body.messages).toBeDefined();
      });
      
      it('should return paginated messages', async () => {
        Match.findById.mockResolvedValue({
          _id: 'match_id',
          users: ['user_id', 'other_user'],
          status: 'active',
        });
        
        Message.find.mockReturnValue({
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([]),
        });
        
        const response = await request(app)
          .get('/api/chat/messages/match_id')
          .query({ page: 2, limit: 20 })
          .set('x-user-id', 'user_id');
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('Not Found', () => {
      it('should return 404 for non-existent match', async () => {
        Match.findById.mockResolvedValue(null);
        
        const response = await request(app)
          .get('/api/chat/messages/nonexistent_match')
          .set('x-user-id', 'user_id');
        
        expect(response.status).toBe(404);
      });
    });
    
    describe('Forbidden', () => {
      it('should reject access to match user is not part of', async () => {
        Match.findById.mockResolvedValue({
          _id: 'match_id',
          users: ['other_user_1', 'other_user_2'],
          status: 'active',
        });
        
        const response = await request(app)
          .get('/api/chat/messages/match_id')
          .set('x-user-id', 'user_id');
        
        expect(response.status).toBe(403);
      });
    });
  });
  
  describe('PUT /api/chat/messages/:matchId/read', () => {
    describe('Success Cases', () => {
      it('should mark all messages as read', async () => {
        Match.findById.mockResolvedValue({
          _id: 'match_id',
          users: ['user_id', 'other_user'],
          status: 'active',
        });
        
        Message.updateMany.mockResolvedValue({
          modifiedCount: 5,
        });
        
        const response = await request(app)
          .put('/api/chat/messages/match_id/read')
          .set('x-user-id', 'user_id');
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
    
    describe('Not Found', () => {
      it('should return 404 for non-existent match', async () => {
        Match.findById.mockResolvedValue(null);
        
        const response = await request(app)
          .put('/api/chat/messages/nonexistent_match/read')
          .set('x-user-id', 'user_id');
        
        expect(response.status).toBe(404);
      });
    });
  });
  
  describe('PUT /api/chat/messages/:messageId/read-single', () => {
    describe('Success Cases', () => {
      it('should mark single message as read', async () => {
        Message.findById.mockResolvedValue({
          _id: 'message_id',
          matchId: 'match_id',
          senderId: 'other_user',
          recipientId: 'user_id',
        });
        
        Message.findByIdAndUpdate.mockResolvedValue({
          _id: 'message_id',
          readAt: new Date(),
        });
        
        const response = await request(app)
          .put('/api/chat/messages/message_id/read-single')
          .set('x-user-id', 'user_id');
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('Not Found', () => {
      it('should return 404 for non-existent message', async () => {
        Message.findById.mockResolvedValue(null);
        
        const response = await request(app)
          .put('/api/chat/messages/nonexistent/read-single')
          .set('x-user-id', 'user_id');
        
        expect(response.status).toBe(404);
      });
    });
  });
  
  describe('GET /api/chat/receipts/:matchId', () => {
    describe('Success Cases', () => {
      it('should return read receipts for conversation', async () => {
        Match.findById.mockResolvedValue({
          _id: 'match_id',
          users: ['user_id', 'other_user'],
          status: 'active',
        });
        
        Message.find.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([
            { _id: 'msg_1', readAt: new Date() },
            { _id: 'msg_2', readAt: null },
          ]),
        });
        
        const response = await request(app)
          .get('/api/chat/receipts/match_id')
          .set('x-user-id', 'user_id');
        
        expect(response.status).toBe(200);
      });
    });
  });
  
  describe('POST /api/chat/messages/encrypted', () => {
    describe('Success Cases', () => {
      it('should send encrypted message', async () => {
        Match.findById.mockResolvedValue({
          _id: messages.encryptedMessage.matchId,
          users: ['user_id', 'other_user'],
          status: 'active',
        });
        
        Message.create.mockResolvedValue({
          _id: 'message_id',
          matchId: messages.encryptedMessage.matchId,
          senderId: 'user_id',
          content: messages.encryptedMessage.content,
          isEncrypted: true,
          createdAt: new Date(),
        });
        
        const response = await request(app)
          .post('/api/chat/messages/encrypted')
          .set('x-user-id', 'user_id')
          .send(messages.encryptedMessage);
        
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });
    
    describe('Validation Errors', () => {
      it('should reject message without matchId', async () => {
        const response = await request(app)
          .post('/api/chat/messages/encrypted')
          .set('x-user-id', 'user_id')
          .send({ content: 'Hello' });
        
        expect(response.status).toBe(400);
      });
      
      it('should reject message without content', async () => {
        const response = await request(app)
          .post('/api/chat/messages/encrypted')
          .set('x-user-id', 'user_id')
          .send({ matchId: 'match_id' });
        
        expect(response.status).toBe(400);
      });
    });
    
    describe('Match Validation', () => {
      it('should reject message to non-existent match', async () => {
        Match.findById.mockResolvedValue(null);
        
        const response = await request(app)
          .post('/api/chat/messages/encrypted')
          .set('x-user-id', 'user_id')
          .send(messages.validMessage);
        
        expect(response.status).toBe(404);
      });
      
      it('should reject message to match user is not part of', async () => {
        Match.findById.mockResolvedValue({
          _id: 'match_id',
          users: ['other_user_1', 'other_user_2'],
          status: 'active',
        });
        
        const response = await request(app)
          .post('/api/chat/messages/encrypted')
          .set('x-user-id', 'user_id')
          .send(messages.validMessage);
        
        expect(response.status).toBe(403);
      });
    });
  });
  
  describe('DELETE /api/chat/messages/:messageId', () => {
    describe('Success Cases', () => {
      it('should delete own message', async () => {
        Message.findById.mockResolvedValue({
          _id: 'message_id',
          senderId: 'user_id',
          deleteOne: jest.fn().mockResolvedValue(true),
        });
        
        const response = await request(app)
          .delete('/api/chat/messages/message_id')
          .set('x-user-id', 'user_id');
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('Not Found', () => {
      it('should return 404 for non-existent message', async () => {
        Message.findById.mockResolvedValue(null);
        
        const response = await request(app)
          .delete('/api/chat/messages/nonexistent')
          .set('x-user-id', 'user_id');
        
        expect(response.status).toBe(404);
      });
    });
    
    describe('Forbidden', () => {
      it('should reject deletion of other user\'s message', async () => {
        Message.findById.mockResolvedValue({
          _id: 'message_id',
          senderId: 'other_user',
        });
        
        const response = await request(app)
          .delete('/api/chat/messages/message_id')
          .set('x-user-id', 'user_id');
        
        expect(response.status).toBe(403);
      });
    });
  });
});
