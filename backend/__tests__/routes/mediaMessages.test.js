const express = require('express');
const request = require('supertest');

jest.mock('../../src/api/controllers/mediaMessagesController', () => ({
  sendGifMessage: jest.fn((req, res) => res.status(200).json({ success: true })),
  getPopularGifs: jest.fn((req, res) => res.status(200).json({ success: true })),
  searchGifs: jest.fn((req, res) => res.status(200).json({ success: true })),
  sendStickerMessage: jest.fn((req, res) => res.status(200).json({ success: true })),
  getStickerPacks: jest.fn((req, res) => res.status(200).json({ success: true })),
  sendVoiceMessage: jest.fn((req, res) => res.status(200).json({ success: true })),
  transcribeVoiceMessage: jest.fn((req, res) => res.status(200).json({ success: true })),
  initiateVideoCall: jest.fn((req, res) => res.status(200).json({ success: true })),
  updateVideoCallStatus: jest.fn((req, res) => res.status(200).json({ success: true })),
}));

jest.mock('../../src/api/middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ success: false });
    }
    req.user = { _id: 'user_1' };
    next();
  }),
}));

const controller = require('../../src/api/controllers/mediaMessagesController');

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/media', require('../../routes/mediaMessages'));
  return app;
};

describe('media message routes', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires auth', async () => {
    const res = await request(app).get('/api/media/gifs/popular');
    expect(res.status).toBe(401);
  });

  it('routes gif and sticker endpoints', async () => {
    const auth = { Authorization: 'Bearer token' };
    const gif = await request(app).post('/api/media/gif').set(auth).send({});
    const popular = await request(app).get('/api/media/gifs/popular').set(auth);
    const search = await request(app).get('/api/media/gifs/search?q=fun').set(auth);
    const sticker = await request(app).post('/api/media/sticker').set(auth).send({});
    const packs = await request(app).get('/api/media/sticker-packs').set(auth);

    expect(gif.status).toBe(200);
    expect(popular.status).toBe(200);
    expect(search.status).toBe(200);
    expect(sticker.status).toBe(200);
    expect(packs.status).toBe(200);
    expect(controller.sendGifMessage).toHaveBeenCalled();
  });

  it('routes voice and video endpoints', async () => {
    const auth = { Authorization: 'Bearer token' };
    const voice = await request(app).post('/api/media/voice').set(auth).send({});
    const transcribe = await request(app).post('/api/media/voice/transcribe').set(auth).send({});
    const call = await request(app).post('/api/media/video-call/initiate').set(auth).send({});
    const status = await request(app).put('/api/media/video-call/status').set(auth).send({});

    expect(voice.status).toBe(200);
    expect(transcribe.status).toBe(200);
    expect(call.status).toBe(200);
    expect(status.status).toBe(200);
  });
});
