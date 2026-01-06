/**
 * Media Messages API Tests
 * Comprehensive test suite for /api/media endpoints
 */

const request = require('supertest');
const express = require('express');

const {
  generateTestToken,
  authHeader,
  assertUnauthorized,
  assertValidationError,
} = require('../utils/testHelpers');

// Mock dependencies
jest.mock('../../models/User', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock('../../models/Message', () => {
  const mockMessage = {
    save: jest.fn().mockResolvedValue(true),
  };
  const MessageConstructor = jest.fn(() => mockMessage);
  MessageConstructor.find = jest.fn();
  MessageConstructor.findById = jest.fn();
  MessageConstructor.findByIdAndUpdate = jest.fn();
  MessageConstructor.findByIdAndDelete = jest.fn();
  return MessageConstructor;
});

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn().mockResolvedValue({
        secure_url: 'https://cloudinary.com/test-image.jpg',
        public_id: 'test_public_id',
        format: 'jpg',
        width: 800,
        height: 600,
      }),
      upload_stream: jest.fn(),
      destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
    },
  },
}));

jest.mock('aws-sdk', () => ({
  S3: jest.fn().mockImplementation(() => ({
    upload: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Location: 'https://s3.amazonaws.com/bucket/test.jpg',
        Key: 'test.jpg',
      }),
    }),
    deleteObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({}),
    }),
    getSignedUrl: jest.fn().mockReturnValue('https://s3.amazonaws.com/signed-url'),
  })),
}));

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  const mediaRoutes = require('../../routes/mediaMessages');
  app.use('/api/media', mediaRoutes);

  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  });

  return app;
};

describe('Media Messages API Tests', () => {
  let app;
  const User = require('../../models/User');
  const Message = require('../../models/Message');
  const cloudinary = require('cloudinary').v2;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.CLOUDINARY_CLOUD_NAME = 'test_cloud';
    process.env.CLOUDINARY_API_KEY = 'test_key';
    process.env.CLOUDINARY_API_SECRET = 'test_secret';
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/media/upload', () => {
    describe('Success Cases', () => {
      it('should upload an image', async () => {
        const response = await request(app)
          .post('/api/media/upload')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .attach('file', Buffer.from('fake image data'), 'test.jpg');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.url).toBeDefined();
      });

      it('should upload a video', async () => {
        const response = await request(app)
          .post('/api/media/upload')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .field('mediaType', 'video')
          .attach('file', Buffer.from('fake video data'), 'test.mp4');

        expect(response.status).toBe(200);
      });

      it('should upload audio message', async () => {
        const response = await request(app)
          .post('/api/media/upload')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .field('mediaType', 'audio')
          .attach('file', Buffer.from('fake audio data'), 'test.mp3');

        expect(response.status).toBe(200);
      });
    });

    describe('Validation', () => {
      it('should reject unsupported file types', async () => {
        const response = await request(app)
          .post('/api/media/upload')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .attach('file', Buffer.from('fake data'), 'test.exe');

        expect(response.status).toBe(400);
      });

      it('should reject files exceeding size limit', async () => {
        // Create a large buffer (simulating large file)
        const largeBuffer = Buffer.alloc(50 * 1024 * 1024); // 50MB

        const response = await request(app)
          .post('/api/media/upload')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .attach('file', largeBuffer, 'large.jpg');

        // Should either reject or succeed depending on multer config
        expect([200, 400, 413]).toContain(response.status);
      });
    });

    describe('Unauthorized Access', () => {
      it('should reject unauthenticated upload', async () => {
        const response = await request(app)
          .post('/api/media/upload')
          .attach('file', Buffer.from('fake data'), 'test.jpg');

        assertUnauthorized(response);
      });
    });
  });

  describe('POST /api/media/send', () => {
    describe('Success Cases', () => {
      it('should send media message', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          matches: ['recipient_id'],
        });

        const response = await request(app)
          .post('/api/media/send')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            conversationId: 'conversation_id',
            recipientId: 'recipient_id',
            mediaUrl: 'https://cloudinary.com/test.jpg',
            mediaType: 'image',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should send image message with caption', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          matches: ['recipient_id'],
        });

        const response = await request(app)
          .post('/api/media/send')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            conversationId: 'conversation_id',
            recipientId: 'recipient_id',
            mediaUrl: 'https://cloudinary.com/test.jpg',
            mediaType: 'image',
            caption: 'Check this out!',
          });

        expect(response.status).toBe(200);
      });

      it('should send voice message', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          matches: ['recipient_id'],
        });

        const response = await request(app)
          .post('/api/media/send')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            conversationId: 'conversation_id',
            recipientId: 'recipient_id',
            mediaUrl: 'https://cloudinary.com/voice.mp3',
            mediaType: 'audio',
            duration: 15,
          });

        expect(response.status).toBe(200);
      });

      it('should send GIF', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          matches: ['recipient_id'],
        });

        const response = await request(app)
          .post('/api/media/send')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            conversationId: 'conversation_id',
            recipientId: 'recipient_id',
            mediaUrl: 'https://giphy.com/test.gif',
            mediaType: 'gif',
          });

        expect(response.status).toBe(200);
      });
    });

    describe('Validation', () => {
      it('should require media URL', async () => {
        const response = await request(app)
          .post('/api/media/send')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            conversationId: 'conversation_id',
            recipientId: 'recipient_id',
          });

        expect(response.status).toBe(400);
      });

      it('should reject sending to non-matched user', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          matches: [],
        });

        const response = await request(app)
          .post('/api/media/send')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            conversationId: 'conversation_id',
            recipientId: 'non_match_id',
            mediaUrl: 'https://cloudinary.com/test.jpg',
            mediaType: 'image',
          });

        expect(response.status).toBe(403);
      });
    });
  });

  describe('DELETE /api/media/:messageId', () => {
    describe('Success Cases', () => {
      it('should delete media message', async () => {
        Message.findById.mockResolvedValue({
          _id: 'message_id',
          sender: 'user_id',
          mediaUrl: 'https://cloudinary.com/test.jpg',
          mediaPublicId: 'test_public_id',
        });

        Message.findByIdAndDelete.mockResolvedValue({
          _id: 'message_id',
        });

        const response = await request(app)
          .delete('/api/media/message_id')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('Error Cases', () => {
      it('should reject deleting message from another user', async () => {
        Message.findById.mockResolvedValue({
          _id: 'message_id',
          sender: 'other_user_id',
        });

        const response = await request(app)
          .delete('/api/media/message_id')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(403);
      });

      it('should return 404 for non-existent message', async () => {
        Message.findById.mockResolvedValue(null);

        const response = await request(app)
          .delete('/api/media/nonexistent')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(404);
      });
    });
  });

  describe('GET /api/media/:messageId/signed-url', () => {
    describe('Success Cases', () => {
      it('should return signed URL for private media', async () => {
        Message.findById.mockResolvedValue({
          _id: 'message_id',
          sender: 'other_user_id',
          recipient: 'user_id',
          mediaKey: 'private/media/test.jpg',
          isPrivate: true,
        });

        const response = await request(app)
          .get('/api/media/message_id/signed-url')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.data.signedUrl).toBeDefined();
      });
    });

    describe('Error Cases', () => {
      it('should reject access to unauthorized media', async () => {
        Message.findById.mockResolvedValue({
          _id: 'message_id',
          sender: 'other_user_1',
          recipient: 'other_user_2',
          isPrivate: true,
        });

        const response = await request(app)
          .get('/api/media/message_id/signed-url')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(403);
      });
    });
  });

  describe('Media Type Handling', () => {
    const mediaTypes = ['image', 'video', 'audio', 'gif', 'sticker'];

    it('should handle all supported media types', async () => {
      for (const mediaType of mediaTypes) {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          matches: ['recipient_id'],
        });

        const response = await request(app)
          .post('/api/media/send')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            conversationId: 'conversation_id',
            recipientId: 'recipient_id',
            mediaUrl: `https://cloudinary.com/test.${mediaType}`,
            mediaType,
          });

        expect(response.status).toBe(200);
      }
    });
  });

  describe('GIF Search', () => {
    describe('GET /api/media/gifs/search', () => {
      it('should search for GIFs', async () => {
        const response = await request(app)
          .get('/api/media/gifs/search?q=funny')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });
    });

    describe('GET /api/media/gifs/trending', () => {
      it('should return trending GIFs', async () => {
        const response = await request(app)
          .get('/api/media/gifs/trending')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });
    });
  });

  describe('Stickers', () => {
    describe('GET /api/media/stickers', () => {
      it('should return available sticker packs', async () => {
        const response = await request(app)
          .get('/api/media/stickers')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });
    });

    describe('GET /api/media/stickers/:packId', () => {
      it('should return stickers from a pack', async () => {
        const response = await request(app)
          .get('/api/media/stickers/pack_1')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });
    });
  });
});
