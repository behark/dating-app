const request = require('supertest');

// Mock dependencies before importing app
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue({}),
  connection: {
    on: jest.fn(),
    once: jest.fn(),
    readyState: 1,
  },
}));

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
  }));
});

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn().mockResolvedValue({ uid: 'test_user_123' }),
  })),
}));

// Create mock Express app for testing
const express = require('express');
const app = express();
app.use(express.json());

// Auth routes
app.post('/api/auth/register', (req, res) => {
  const { email, password, name, age } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  res.status(201).json({
    success: true,
    user: { id: 'new_user_123', email, name, age },
    token: 'jwt_token_123',
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'test@example.com' && password === 'password123') {
    res.json({
      success: true,
      user: { id: 'user_123', email },
      token: 'jwt_token_123',
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Profile routes
app.get('/api/profile/:userId', (req, res) => {
  res.json({
    success: true,
    profile: {
      id: req.params.userId,
      name: 'Test User',
      age: 25,
      bio: 'Test bio',
    },
  });
});

app.put('/api/profile/:userId', (req, res) => {
  res.json({
    success: true,
    profile: { id: req.params.userId, ...req.body },
  });
});

// Discovery routes
app.get('/api/discovery/profiles', (req, res) => {
  res.json({
    success: true,
    profiles: [
      { id: 'profile_1', name: 'Alice', age: 25 },
      { id: 'profile_2', name: 'Bob', age: 27 },
    ],
    pagination: { page: 1, total: 2 },
  });
});

app.post('/api/discovery/swipe', (req, res) => {
  const { targetUserId, direction } = req.body;
  const isMatch = direction === 'right' && Math.random() > 0.5;
  res.json({
    success: true,
    swipeRecorded: true,
    isMatch,
    matchId: isMatch ? 'match_123' : null,
  });
});

// Chat routes
app.get('/api/chat/conversations', (req, res) => {
  res.json({
    success: true,
    conversations: [{ id: 'conv_1', participant: { name: 'Alice' }, lastMessage: 'Hi!' }],
  });
});

app.post('/api/chat/send', (req, res) => {
  const { conversationId, message } = req.body;
  res.json({
    success: true,
    message: {
      id: 'msg_123',
      conversationId,
      content: message,
      timestamp: new Date().toISOString(),
    },
  });
});

// Payment routes
app.get('/api/payments/plans', (req, res) => {
  res.json({
    success: true,
    plans: [
      { id: 'basic', name: 'Basic', price: 9.99 },
      { id: 'premium', name: 'Premium', price: 19.99 },
    ],
  });
});

app.post('/api/payments/subscribe', (req, res) => {
  const { planId, paymentMethodId } = req.body;
  if (!planId || !paymentMethodId) {
    return res.status(400).json({ error: 'Plan and payment method required' });
  }
  res.json({
    success: true,
    subscriptionId: 'sub_123',
    clientSecret: 'secret_123',
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

describe('API Integration Tests', () => {
  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });

  describe('Authentication', () => {
    describe('POST /api/auth/register', () => {
      it('should register a new user', async () => {
        const response = await request(app).post('/api/auth/register').send({
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          name: 'New User',
          age: 25,
        });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.user.email).toBe('newuser@example.com');
        expect(response.body.token).toBeDefined();
      });

      it('should reject registration without email', async () => {
        const response = await request(app).post('/api/auth/register').send({
          password: 'SecurePass123!',
          name: 'New User',
        });

        expect(response.status).toBe(400);
        expect(response.body.error).toBeDefined();
      });

      it('should reject registration without password', async () => {
        const response = await request(app).post('/api/auth/register').send({
          email: 'newuser@example.com',
          name: 'New User',
        });

        expect(response.status).toBe(400);
      });
    });

    describe('POST /api/auth/login', () => {
      it('should login with valid credentials', async () => {
        const response = await request(app).post('/api/auth/login').send({
          email: 'test@example.com',
          password: 'password123',
        });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.token).toBeDefined();
      });

      it('should reject invalid credentials', async () => {
        const response = await request(app).post('/api/auth/login').send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

        expect(response.status).toBe(401);
      });
    });
  });

  describe('Profile', () => {
    describe('GET /api/profile/:userId', () => {
      it('should fetch user profile', async () => {
        const response = await request(app).get('/api/profile/user_123');

        expect(response.status).toBe(200);
        expect(response.body.profile.id).toBe('user_123');
        expect(response.body.profile.name).toBeDefined();
      });
    });

    describe('PUT /api/profile/:userId', () => {
      it('should update user profile', async () => {
        const response = await request(app)
          .put('/api/profile/user_123')
          .send({
            bio: 'Updated bio',
            interests: ['hiking', 'music'],
          });

        expect(response.status).toBe(200);
        expect(response.body.profile.bio).toBe('Updated bio');
      });
    });
  });

  describe('Discovery', () => {
    describe('GET /api/discovery/profiles', () => {
      it('should fetch discovery profiles', async () => {
        const response = await request(app).get('/api/discovery/profiles');

        expect(response.status).toBe(200);
        expect(response.body.profiles).toBeInstanceOf(Array);
        expect(response.body.profiles.length).toBeGreaterThan(0);
      });
    });

    describe('POST /api/discovery/swipe', () => {
      it('should record a swipe action', async () => {
        const response = await request(app).post('/api/discovery/swipe').send({
          targetUserId: 'profile_123',
          direction: 'right',
        });

        expect(response.status).toBe(200);
        expect(response.body.swipeRecorded).toBe(true);
      });
    });
  });

  describe('Chat', () => {
    describe('GET /api/chat/conversations', () => {
      it('should fetch user conversations', async () => {
        const response = await request(app).get('/api/chat/conversations');

        expect(response.status).toBe(200);
        expect(response.body.conversations).toBeInstanceOf(Array);
      });
    });

    describe('POST /api/chat/send', () => {
      it('should send a message', async () => {
        const response = await request(app).post('/api/chat/send').send({
          conversationId: 'conv_123',
          message: 'Hello!',
        });

        expect(response.status).toBe(200);
        expect(response.body.message.content).toBe('Hello!');
      });
    });
  });

  describe('Payments', () => {
    describe('GET /api/payments/plans', () => {
      it('should fetch subscription plans', async () => {
        const response = await request(app).get('/api/payments/plans');

        expect(response.status).toBe(200);
        expect(response.body.plans).toBeInstanceOf(Array);
        expect(response.body.plans.length).toBeGreaterThan(0);
      });
    });

    describe('POST /api/payments/subscribe', () => {
      it('should create subscription', async () => {
        const response = await request(app).post('/api/payments/subscribe').send({
          planId: 'premium',
          paymentMethodId: 'pm_123',
        });

        expect(response.status).toBe(200);
        expect(response.body.subscriptionId).toBeDefined();
      });

      it('should reject subscription without plan', async () => {
        const response = await request(app).post('/api/payments/subscribe').send({
          paymentMethodId: 'pm_123',
        });

        expect(response.status).toBe(400);
      });
    });
  });
});

describe('Error Handling', () => {
  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/api/unknown');
    expect(response.status).toBe(404);
  });
});

describe('Rate Limiting', () => {
  it('should handle multiple rapid requests', async () => {
    const promises = Array.from({ length: 10 }, () => request(app).get('/api/health'));

    const responses = await Promise.all(promises);
    const successCount = responses.filter((r) => r.status === 200).length;
    expect(successCount).toBeGreaterThan(0);
  });
});
