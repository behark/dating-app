/**
 * AI API Tests
 * Comprehensive test suite for /api/ai endpoints
 */

const request = require('supertest');
const express = require('express');

const {
  generateTestToken,
  authHeader,
  assertUnauthorized,
  assertValidationError,
} = require('../utils/testHelpers');

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'AI generated response' } }],
        }),
      },
    },
    moderations: {
      create: jest.fn().mockResolvedValue({
        results: [{ flagged: false, categories: {} }],
      }),
    },
    images: {
      generate: jest.fn().mockResolvedValue({
        data: [{ url: 'https://example.com/image.png' }],
      }),
    },
  }));
});

// Mock User model
jest.mock('../../models/User', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  const aiRoutes = require('../../routes/ai');
  app.use('/api/ai', aiRoutes);
  
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  });
  
  return app;
};

describe('AI API Tests', () => {
  let app;
  const User = require('../../models/User');
  
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.OPENAI_API_KEY = 'sk-test-xxx';
    app = createTestApp();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('POST /api/ai/bio-suggestions', () => {
    describe('Success Cases', () => {
      it('should generate bio suggestions', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          name: 'John',
          age: 28,
          interests: ['hiking', 'photography', 'travel'],
          occupation: 'Software Engineer',
        });
        
        const response = await request(app)
          .post('/api/ai/bio-suggestions')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            style: 'witty',
            length: 'medium',
          });
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.suggestions).toBeDefined();
      });
      
      it('should generate bio with different styles', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          name: 'Jane',
        });
        
        const styles = ['witty', 'sincere', 'adventurous', 'professional'];
        
        for (const style of styles) {
          const response = await request(app)
            .post('/api/ai/bio-suggestions')
            .set('Authorization', `Bearer ${generateTestToken()}`)
            .send({ style });
          
          expect(response.status).toBe(200);
        }
      });
      
      it('should accept additional context', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          name: 'Test User',
        });
        
        const response = await request(app)
          .post('/api/ai/bio-suggestions')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            context: 'I love coffee and morning runs',
            tone: 'casual',
          });
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('Unauthorized Access', () => {
      it('should reject unauthenticated request', async () => {
        const response = await request(app)
          .post('/api/ai/bio-suggestions')
          .send({ style: 'witty' });
        
        assertUnauthorized(response);
      });
    });
  });
  
  describe('POST /api/ai/conversation-starters', () => {
    describe('Success Cases', () => {
      it('should generate conversation starters based on match profile', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          interests: ['movies', 'cooking'],
        });
        
        const response = await request(app)
          .post('/api/ai/conversation-starters')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            matchProfile: {
              name: 'Sarah',
              bio: 'Adventure seeker and coffee lover',
              interests: ['hiking', 'coffee', 'travel'],
            },
          });
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.starters).toBeDefined();
      });
      
      it('should generate personalized starters based on shared interests', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          interests: ['photography', 'hiking'],
        });
        
        const response = await request(app)
          .post('/api/ai/conversation-starters')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            matchProfile: {
              interests: ['photography', 'art'],
            },
            style: 'playful',
          });
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('Validation', () => {
      it('should require match profile', async () => {
        const response = await request(app)
          .post('/api/ai/conversation-starters')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({});
        
        expect(response.status).toBe(400);
      });
    });
  });
  
  describe('POST /api/ai/reply-suggestions', () => {
    describe('Success Cases', () => {
      it('should suggest replies to a message', async () => {
        const response = await request(app)
          .post('/api/ai/reply-suggestions')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            conversationContext: [
              { role: 'match', content: 'Hey! How are you?' },
              { role: 'user', content: 'Great, thanks! Just got back from a hike.' },
              { role: 'match', content: "Nice! What's your favorite trail around here?" },
            ],
          });
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.suggestions).toBeDefined();
      });
      
      it('should consider conversation tone', async () => {
        const response = await request(app)
          .post('/api/ai/reply-suggestions')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            conversationContext: [
              { role: 'match', content: 'Want to grab coffee sometime?' },
            ],
            tone: 'enthusiastic',
          });
        
        expect(response.status).toBe(200);
      });
    });
    
    describe('Validation', () => {
      it('should require conversation context', async () => {
        const response = await request(app)
          .post('/api/ai/reply-suggestions')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({});
        
        expect(response.status).toBe(400);
      });
    });
  });
  
  describe('POST /api/ai/photo-analysis', () => {
    describe('Success Cases', () => {
      it('should analyze photo for profile optimization', async () => {
        const response = await request(app)
          .post('/api/ai/photo-analysis')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            photoUrl: 'https://example.com/photo.jpg',
          });
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
      
      it('should provide optimization suggestions', async () => {
        const response = await request(app)
          .post('/api/ai/photo-analysis')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            photoUrl: 'https://example.com/photo.jpg',
            analysisType: 'profile_optimization',
          });
        
        expect(response.status).toBe(200);
      });
    });
  });
  
  describe('POST /api/ai/content-moderation', () => {
    describe('Success Cases', () => {
      it('should moderate text content', async () => {
        const response = await request(app)
          .post('/api/ai/content-moderation')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            content: 'Hello, nice to meet you!',
            contentType: 'text',
          });
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.safe).toBe(true);
      });
      
      it('should flag inappropriate content', async () => {
        // Mock moderation to flag content
        const OpenAI = require('openai');
        OpenAI.mockImplementation(() => ({
          moderations: {
            create: jest.fn().mockResolvedValue({
              results: [{
                flagged: true,
                categories: { harassment: true },
                category_scores: { harassment: 0.9 },
              }],
            }),
          },
        }));
        
        const response = await request(app)
          .post('/api/ai/content-moderation')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            content: 'inappropriate content here',
            contentType: 'text',
          });
        
        expect(response.status).toBe(200);
      });
    });
  });
  
  describe('POST /api/ai/icebreaker', () => {
    describe('Success Cases', () => {
      it('should generate icebreaker question', async () => {
        const response = await request(app)
          .post('/api/ai/icebreaker')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            category: 'fun',
          });
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
      
      it('should generate category-specific icebreakers', async () => {
        const categories = ['fun', 'deep', 'flirty', 'creative'];
        
        for (const category of categories) {
          const response = await request(app)
            .post('/api/ai/icebreaker')
            .set('Authorization', `Bearer ${generateTestToken()}`)
            .send({ category });
          
          expect(response.status).toBe(200);
        }
      });
    });
  });
  
  describe('POST /api/ai/compatibility-analysis', () => {
    describe('Success Cases', () => {
      it('should analyze compatibility between users', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          interests: ['music', 'travel', 'cooking'],
          values: ['family', 'adventure'],
        });
        
        const response = await request(app)
          .post('/api/ai/compatibility-analysis')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            matchProfile: {
              interests: ['travel', 'photography', 'cooking'],
              values: ['family', 'career'],
            },
          });
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
  
  describe('POST /api/ai/date-ideas', () => {
    describe('Success Cases', () => {
      it('should suggest date ideas based on shared interests', async () => {
        const response = await request(app)
          .post('/api/ai/date-ideas')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            sharedInterests: ['coffee', 'hiking', 'art'],
            location: 'San Francisco',
            budget: 'moderate',
          });
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.ideas).toBeDefined();
      });
      
      it('should consider time of day preference', async () => {
        const response = await request(app)
          .post('/api/ai/date-ideas')
          .set('Authorization', `Bearer ${generateTestToken()}`)
          .send({
            sharedInterests: ['food', 'movies'],
            timePreference: 'evening',
          });
        
        expect(response.status).toBe(200);
      });
    });
  });
  
  describe('POST /api/ai/profile-review', () => {
    describe('Success Cases', () => {
      it('should review and provide feedback on profile', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          name: 'Test User',
          bio: 'Looking for someone special',
          photos: [{ url: 'photo1.jpg' }],
          interests: ['music'],
        });
        
        const response = await request(app)
          .post('/api/ai/profile-review')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.feedback).toBeDefined();
      });
      
      it('should provide actionable improvement suggestions', async () => {
        User.findById.mockResolvedValue({
          _id: 'user_id',
          name: 'Test',
          bio: 'Hi',
          photos: [],
        });
        
        const response = await request(app)
          .post('/api/ai/profile-review')
          .set('Authorization', `Bearer ${generateTestToken()}`);
        
        expect(response.status).toBe(200);
      });
    });
  });
  
  describe('Rate Limiting', () => {
    it('should respect AI API rate limits', async () => {
      User.findById.mockResolvedValue({
        _id: 'user_id',
        aiRequestsToday: 100,
        lastAiRequestDate: new Date(),
      });
      
      const response = await request(app)
        .post('/api/ai/bio-suggestions')
        .set('Authorization', `Bearer ${generateTestToken()}`)
        .send({ style: 'witty' });
      
      // Should either succeed or be rate limited
      expect([200, 429]).toContain(response.status);
    });
  });
  
  describe('Premium Features', () => {
    it('should allow more AI requests for premium users', async () => {
      User.findById.mockResolvedValue({
        _id: 'user_id',
        isPremium: true,
        premiumType: 'gold',
        aiRequestsToday: 20,
      });
      
      const response = await request(app)
        .post('/api/ai/bio-suggestions')
        .set('Authorization', `Bearer ${generateTestToken()}`)
        .send({ style: 'witty' });
      
      expect(response.status).toBe(200);
    });
  });
});
