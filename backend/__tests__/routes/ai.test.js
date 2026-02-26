const express = require('express');
const request = require('supertest');

const aiController = {
  generateIcebreakers: jest.fn((req, res) =>
    res.status(200).json({ success: true, data: { type: 'legacy' } })
  ),
  generateMatchIcebreakers: jest.fn((req, res) =>
    res.status(200).json({ success: true, data: { type: 'match' } })
  ),
  getSmartPhotoSelection: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
  generateBioSuggestions: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
  calculateCompatibilityScore: jest.fn((req, res) =>
    res.status(200).json({ success: true, data: {} })
  ),
  getConversationStarters: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
  analyzePhotoQuality: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
  getPersonalizedMatches: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
  getProfileImprovementSuggestions: jest.fn((req, res) =>
    res.status(200).json({ success: true, data: {} })
  ),
  getConversationInsights: jest.fn((req, res) => res.status(200).json({ success: true, data: {} })),
};

jest.mock('../../src/api/controllers/aiController', () => aiController);

jest.mock('../../src/api/middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    req.user = { _id: req.headers['x-user-id'] || 'user_1' };
    next();
  }),
  authorizeOwner: jest.fn(() => (req, res, next) => {
    if (req.params.userId && req.params.userId !== req.user?._id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  }),
  authorizeMatchedUsers: jest.fn((req, res, next) => next()),
}));

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/ai', require('../../routes/ai'));
  return app;
};

describe('ai routes', () => {
  let app;
  const auth = { Authorization: 'Bearer token' };

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires authentication', async () => {
    const res = await request(app).post('/api/ai/bio-suggestions').send({});
    expect(res.status).toBe(401);
  });

  it('routes icebreaker requests based on payload', async () => {
    const legacy = await request(app)
      .post('/api/ai/icebreaker')
      .set(auth)
      .send({ targetUserId: 'u2' });
    const match = await request(app).post('/api/ai/icebreaker').set(auth).send({ matchId: 'm1' });

    expect(legacy.status).toBe(200);
    expect(match.status).toBe(200);
    expect(aiController.generateIcebreakers).toHaveBeenCalled();
    expect(aiController.generateMatchIcebreakers).toHaveBeenCalled();
  });

  it('serves post-based AI endpoints', async () => {
    const bio = await request(app)
      .post('/api/ai/bio-suggestions')
      .set(auth)
      .send({ style: 'witty' });
    const starters = await request(app)
      .post('/api/ai/conversation-starters')
      .set(auth)
      .send({ targetUserId: 'u2' });
    const analyze = await request(app)
      .post('/api/ai/analyze-photo')
      .set(auth)
      .send({ photoUrl: 'x' });

    expect(bio.status).toBe(200);
    expect(starters.status).toBe(200);
    expect(analyze.status).toBe(200);
  });

  it('enforces owner authorization on owner routes', async () => {
    const ownPhotos = await request(app).get('/api/ai/smart-photos/user_1').set(auth);
    const otherPhotos = await request(app).get('/api/ai/smart-photos/user_2').set(auth);

    expect(ownPhotos.status).toBe(200);
    expect(otherPhotos.status).toBe(403);
  });

  it('serves owner-only insights and suggestion endpoints', async () => {
    const headers = { ...auth, 'x-user-id': 'user_1' };

    const compatibility = await request(app)
      .get('/api/ai/compatibility/user_1/user_2')
      .set(headers);
    const matches = await request(app).get('/api/ai/personalized-matches/user_1').set(headers);
    const profile = await request(app).get('/api/ai/profile-suggestions/user_1').set(headers);
    const insights = await request(app).get('/api/ai/conversation-insights/user_1').set(headers);

    expect(compatibility.status).toBe(200);
    expect(matches.status).toBe(200);
    expect(profile.status).toBe(200);
    expect(insights.status).toBe(200);
  });
});
