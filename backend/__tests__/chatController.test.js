/**
 * Chat Controller Tests
 * Tests message retrieval and send operations
 */

jest.mock('../src/core/domain/Message', () => {
  const Message = jest.fn(function (data) {
    Object.assign(this, data);
    this._id = 'msg123';
    this.createdAt = new Date();
    this.save = jest.fn().mockResolvedValue(this);
  });
  Message.getMessagesForMatch = jest.fn();
  Message.countDocuments = jest.fn();
  Message.markMatchAsRead = jest.fn();
  return Message;
});

jest.mock('../src/core/domain/Match', () => {
  const Match = jest.fn();
  Match.findOne = jest.fn();
  Match.findById = jest.fn();
  return Match;
});

jest.mock('../src/infrastructure/external/LoggingService', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../src/shared/utils/encryption', () => ({
  encryptMessage: jest.fn((msg) => `encrypted:${msg}`),
  decryptMessage: jest.fn((msg) => msg.replace('encrypted:', '')),
  generateConversationKey: jest.fn(() => 'conv-key-123'),
}));

jest.mock('../src/shared/constants/messages', () => ({
  ERROR_MESSAGES: {
    ACCESS_DENIED_CONVERSATION: 'Access denied to this conversation',
  },
}));

jest.mock('mongoose', () => ({
  Types: {
    ObjectId: {
      isValid: jest.fn((id) => /^[a-f0-9]{24}$/.test(id)),
    },
  },
}));

const chatController = require('../src/api/controllers/chatController');
const Message = require('../src/core/domain/Message');
const Match = require('../src/core/domain/Match');

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const validUserId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const validMatchId = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const validOtherUserId = 'cccccccccccccccccccccccc';

describe('chatController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMessages', () => {
    it('should return 400 for invalid matchId', async () => {
      const req = {
        params: { matchId: 'invalid' },
        query: {},
        user: { id: validUserId },
      };
      const res = mockResponse();

      await chatController.getMessages(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 403 when user is not part of the match', async () => {
      Match.findOne.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue(null),
      });

      const req = {
        params: { matchId: validMatchId },
        query: {},
        user: { id: validUserId },
      };
      const res = mockResponse();

      await chatController.getMessages(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return messages for a valid match', async () => {
      Match.findOne.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue({
          _id: validMatchId,
          users: [validUserId, validOtherUserId],
        }),
      });
      Match.findById.mockResolvedValueOnce({
        users: [validUserId, validOtherUserId],
      });
      Message.getMessagesForMatch.mockResolvedValueOnce([
        {
          _id: 'msg1',
          content: 'Hello',
          senderId: validUserId,
          matchId: validMatchId,
          isEncrypted: false,
        },
      ]);
      Message.countDocuments.mockResolvedValueOnce(1);
      Message.markMatchAsRead.mockResolvedValueOnce(true);

      const req = {
        params: { matchId: validMatchId },
        query: { page: '1', limit: '50', decrypt: 'true' },
        user: { id: validUserId },
      };
      const res = mockResponse();

      await chatController.getMessages(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            messages: expect.any(Array),
          }),
        })
      );
    });
  });

  describe('sendEncryptedMessage', () => {
    it('should return 401 when user is not authenticated', async () => {
      const req = {
        body: { matchId: validMatchId, content: 'test' },
        user: {},
      };
      const res = mockResponse();

      await chatController.sendEncryptedMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 400 when matchId or content is missing', async () => {
      const req = {
        body: { content: 'test' },
        user: { id: validUserId },
      };
      const res = mockResponse();

      await chatController.sendEncryptedMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 403 when user is not part of the match', async () => {
      Match.findOne.mockResolvedValueOnce(null);

      const req = {
        body: { matchId: validMatchId, content: 'Hello!' },
        user: { id: validUserId },
      };
      const res = mockResponse();

      await chatController.sendEncryptedMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should send an encrypted message successfully', async () => {
      Match.findOne.mockResolvedValueOnce({
        _id: validMatchId,
        users: [
          { toString: () => validUserId },
          { toString: () => validOtherUserId },
        ],
      });

      const req = {
        body: { matchId: validMatchId, content: 'Hello!' },
        user: { id: validUserId },
      };
      const res = mockResponse();

      await chatController.sendEncryptedMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            message: expect.objectContaining({
              isEncrypted: true,
            }),
          }),
        })
      );
    });
  });
});
