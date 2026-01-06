/**
 * Advanced Interactions API Tests
 * Comprehensive test suite for /api/interactions endpoints
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
  find: jest.fn(),
}));

jest.mock('../../models/Interaction', () => {
  const mockInteraction = {
    save: jest.fn().mockResolvedValue(true),
  };
  const InteractionConstructor = jest.fn(() => mockInteraction);
  InteractionConstructor.find = jest.fn();
  InteractionConstructor.findById = jest.fn();
  InteractionConstructor.findOne = jest.fn();
  InteractionConstructor.findByIdAndUpdate = jest.fn();
  InteractionConstructor.findByIdAndDelete = jest.fn();
  return InteractionConstructor;
});

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  const interactionsRoutes = require('../../routes/advancedInteractions');
  app.use('/api/interactions', interactionsRoutes);

  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  });

  return app;
};

describe('Advanced Interactions API Tests', () => {
  let app;
  const User = require('../../models/User');
  const Interaction = require('../../models/Interaction');

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Roses', () => {
    describe('POST /api/interactions/rose', () => {
      it('should send a rose to a user', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          roses: { available: 5 },
        });

        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          roses: { available: 4 },
        });

        const response = await request(app)
          .post('/api/interactions/rose')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            targetUserId: 'target_user_id',
            message: 'I think we would be a great match!',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should reject sending rose without available roses', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          roses: { available: 0 },
        });

        const response = await request(app)
          .post('/api/interactions/rose')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            targetUserId: 'target_user_id',
          });

        expect(response.status).toBe(400);
      });

      it('should reject sending rose to self', async () => {
        const response = await request(app)
          .post('/api/interactions/rose')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            targetUserId: 'user_id', // Same as token user
          });

        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/interactions/roses/received', () => {
      it('should return received roses', async () => {
        Interaction.find.mockReturnValue({
          sort: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([
                {
                  _id: 'rose_1',
                  type: 'rose',
                  sender: { _id: 'sender_1', name: 'Sarah' },
                  message: 'Hello!',
                  createdAt: new Date(),
                },
              ]),
            }),
          }),
        });

        const response = await request(app)
          .get('/api/interactions/roses/received')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Profile Prompts', () => {
    describe('GET /api/interactions/prompts', () => {
      it('should return available prompts', async () => {
        const response = await request(app)
          .get('/api/interactions/prompts')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('POST /api/interactions/prompts/answer', () => {
      it('should answer a profile prompt', async () => {
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          prompts: [{ promptId: 'prompt_1', answer: 'My answer' }],
        });

        const response = await request(app)
          .post('/api/interactions/prompts/answer')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            promptId: 'prompt_1',
            answer: 'My answer to the prompt',
          });

        expect(response.status).toBe(200);
      });

      it('should validate answer length', async () => {
        const response = await request(app)
          .post('/api/interactions/prompts/answer')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            promptId: 'prompt_1',
            answer: 'A', // Too short
          });

        expect(response.status).toBe(400);
      });
    });

    describe('POST /api/interactions/prompts/like', () => {
      it('should like a prompt answer', async () => {
        User.findById.mockResolvedValue({
          _id: 'target_user_id',
          prompts: [{ promptId: 'prompt_1', answer: 'Their answer' }],
        });

        const response = await request(app)
          .post('/api/interactions/prompts/like')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            targetUserId: 'target_user_id',
            promptId: 'prompt_1',
          });

        expect(response.status).toBe(200);
      });
    });

    describe('POST /api/interactions/prompts/comment', () => {
      it('should comment on a prompt answer', async () => {
        User.findById.mockResolvedValue({
          _id: 'target_user_id',
          prompts: [{ promptId: 'prompt_1', answer: 'Their answer' }],
        });

        const response = await request(app)
          .post('/api/interactions/prompts/comment')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            targetUserId: 'target_user_id',
            promptId: 'prompt_1',
            comment: 'That is so interesting!',
          });

        expect(response.status).toBe(200);
      });
    });
  });

  describe('Photo Interactions', () => {
    describe('POST /api/interactions/photo/like', () => {
      it('should like a specific photo', async () => {
        User.findById.mockResolvedValue({
          _id: 'target_user_id',
          photos: [{ _id: 'photo_1', url: 'photo.jpg' }],
        });

        const response = await request(app)
          .post('/api/interactions/photo/like')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            targetUserId: 'target_user_id',
            photoId: 'photo_1',
          });

        expect(response.status).toBe(200);
      });
    });

    describe('POST /api/interactions/photo/comment', () => {
      it('should comment on a photo', async () => {
        User.findById.mockResolvedValue({
          _id: 'target_user_id',
          photos: [{ _id: 'photo_1', url: 'photo.jpg' }],
        });

        const response = await request(app)
          .post('/api/interactions/photo/comment')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            targetUserId: 'target_user_id',
            photoId: 'photo_1',
            comment: 'Great photo! Where was this taken?',
          });

        expect(response.status).toBe(200);
      });
    });
  });

  describe('Video Prompts', () => {
    describe('POST /api/interactions/video-prompt', () => {
      it('should upload a video prompt response', async () => {
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          videoPrompts: [{ promptId: 'video_prompt_1', videoUrl: 'video.mp4' }],
        });

        const response = await request(app)
          .post('/api/interactions/video-prompt')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            promptId: 'video_prompt_1',
            videoUrl: 'https://cloudinary.com/video.mp4',
            thumbnailUrl: 'https://cloudinary.com/thumb.jpg',
          });

        expect(response.status).toBe(200);
      });
    });

    describe('GET /api/interactions/video-prompts', () => {
      it('should return available video prompts', async () => {
        const response = await request(app)
          .get('/api/interactions/video-prompts')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });
    });
  });

  describe('Voice Intros', () => {
    describe('POST /api/interactions/voice-intro', () => {
      it('should save voice introduction', async () => {
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          voiceIntro: {
            url: 'https://cloudinary.com/voice.mp3',
            duration: 15,
          },
        });

        const response = await request(app)
          .post('/api/interactions/voice-intro')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            audioUrl: 'https://cloudinary.com/voice.mp3',
            duration: 15,
          });

        expect(response.status).toBe(200);
      });

      it('should validate voice intro duration', async () => {
        const response = await request(app)
          .post('/api/interactions/voice-intro')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            audioUrl: 'https://cloudinary.com/voice.mp3',
            duration: 120, // Too long
          });

        expect(response.status).toBe(400);
      });
    });

    describe('DELETE /api/interactions/voice-intro', () => {
      it('should delete voice introduction', async () => {
        User.findByIdAndUpdate.mockResolvedValue({
          _id: 'user_id',
          voiceIntro: null,
        });

        const response = await request(app)
          .delete('/api/interactions/voice-intro')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
      });
    });
  });

  describe('Standouts', () => {
    describe('GET /api/interactions/standouts', () => {
      it('should return standout profiles', async () => {
        User.find.mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              lean: jest
                .fn()
                .mockResolvedValue([{ _id: 'standout_1', name: 'Premium User', isStandout: true }]),
            }),
          }),
        });

        const response = await request(app)
          .get('/api/interactions/standouts')
          .set('Authorization', `Bearer ${generateTestToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Virtual Date Features', () => {
    describe('POST /api/interactions/virtual-date/request', () => {
      it('should request a virtual date', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          matches: ['match_user_id'],
        });

        const response = await request(app)
          .post('/api/interactions/virtual-date/request')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            matchUserId: 'match_user_id',
            proposedTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            activity: 'video-chat',
          });

        expect(response.status).toBe(200);
      });

      it('should reject virtual date with non-match', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          matches: [],
        });

        const response = await request(app)
          .post('/api/interactions/virtual-date/request')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            matchUserId: 'non_match_id',
            proposedTime: new Date().toISOString(),
          });

        expect(response.status).toBe(403);
      });
    });

    describe('POST /api/interactions/virtual-date/:id/respond', () => {
      it('should accept virtual date request', async () => {
        Interaction.findById.mockResolvedValue({
          _id: 'date_request_id',
          recipient: 'user_id',
          status: 'pending',
        });

        Interaction.findByIdAndUpdate.mockResolvedValue({
          _id: 'date_request_id',
          status: 'accepted',
        });

        const response = await request(app)
          .post('/api/interactions/virtual-date/date_request_id/respond')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ response: 'accept' });

        expect(response.status).toBe(200);
      });

      it('should decline virtual date request', async () => {
        Interaction.findById.mockResolvedValue({
          _id: 'date_request_id',
          recipient: 'user_id',
          status: 'pending',
        });

        Interaction.findByIdAndUpdate.mockResolvedValue({
          _id: 'date_request_id',
          status: 'declined',
        });

        const response = await request(app)
          .post('/api/interactions/virtual-date/date_request_id/respond')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({ response: 'decline' });

        expect(response.status).toBe(200);
      });
    });
  });

  describe('Icebreakers Games', () => {
    describe('POST /api/interactions/icebreaker-game/start', () => {
      it('should start an icebreaker game', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          matches: ['match_user_id'],
        });

        const response = await request(app)
          .post('/api/interactions/icebreaker-game/start')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            matchUserId: 'match_user_id',
            gameType: '20-questions',
          });

        expect(response.status).toBe(200);
      });
    });

    describe('POST /api/interactions/icebreaker-game/:id/answer', () => {
      it('should submit game answer', async () => {
        Interaction.findById.mockResolvedValue({
          _id: 'game_id',
          type: 'icebreaker-game',
          participants: ['user_id', 'match_user_id'],
        });

        const response = await request(app)
          .post('/api/interactions/icebreaker-game/game_id/answer')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            questionIndex: 0,
            answer: 'My answer',
          });

        expect(response.status).toBe(200);
      });
    });
  });

  describe('Unauthorized Access', () => {
    const endpoints = [
      { method: 'post', path: '/api/interactions/rose' },
      { method: 'get', path: '/api/interactions/roses/received' },
      { method: 'post', path: '/api/interactions/prompts/answer' },
      { method: 'post', path: '/api/interactions/photo/like' },
      { method: 'get', path: '/api/interactions/standouts' },
    ];

    it.each(endpoints)('should reject unauthenticated $method $path', async ({ method, path }) => {
      const response = await request(app)[method](path);
      assertUnauthorized(response);
    });
  });
});
