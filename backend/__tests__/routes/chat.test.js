const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');

jest.mock('../../src/api/controllers/chatController', () => ({
  getMessages: jest.fn((req, res) => res.status(200).json({ success: true })),
  getConversations: jest.fn((req, res) => res.status(200).json({ success: true })),
  markAsRead: jest.fn((req, res) => res.status(200).json({ success: true })),
  getUnreadCount: jest.fn((req, res) => res.status(200).json({ success: true })),
  deleteMessage: jest.fn((req, res) => res.status(200).json({ success: true })),
  markMessageAsRead: jest.fn((req, res) => res.status(200).json({ success: true })),
  getReadReceipts: jest.fn((req, res) => res.status(200).json({ success: true })),
  sendEncryptedMessage: jest.fn((req, res) => res.status(201).json({ success: true })),
  addReaction: jest.fn((req, res) => res.status(200).json({ success: true })),
  removeReaction: jest.fn((req, res) => res.status(200).json({ success: true })),
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

const controller = require('../../src/api/controllers/chatController');

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/chat', require('../../routes/chat'));
  return app;
};

describe('chat routes', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires auth', async () => {
    const res = await request(app).get('/api/chat/conversations');
    expect(res.status).toBe(401);
  });

  it('routes conversation and unread endpoints', async () => {
    const auth = { Authorization: 'Bearer token' };
    const conversations = await request(app).get('/api/chat/conversations').set(auth);
    const unread = await request(app).get('/api/chat/unread').set(auth);
    expect(conversations.status).toBe(200);
    expect(unread.status).toBe(200);
  });

  it('validates message route matchId and encrypted payload', async () => {
    const auth = { Authorization: 'Bearer token' };
    const invalid = await request(app).get('/api/chat/messages/bad-id').set(auth);
    expect(invalid.status).toBe(400);

    const validMatchId = new mongoose.Types.ObjectId().toString();
    const valid = await request(app).get(`/api/chat/messages/${validMatchId}`).set(auth);
    expect(valid.status).toBe(200);

    const encryptedBad = await request(app)
      .post('/api/chat/messages/encrypted')
      .set(auth)
      .send({ matchId: 'bad', content: '' });
    expect(encryptedBad.status).toBe(400);

    const encryptedOk = await request(app)
      .post('/api/chat/messages/encrypted')
      .set(auth)
      .send({ matchId: validMatchId, content: 'hello', type: 'text' });
    expect(encryptedOk.status).toBe(201);
  });

  it('routes read/delete/receipt endpoints', async () => {
    const auth = { Authorization: 'Bearer token' };
    const id = new mongoose.Types.ObjectId().toString();

    const readAll = await request(app).put(`/api/chat/messages/${id}/read`).set(auth);
    const readOne = await request(app).put(`/api/chat/messages/${id}/read-single`).set(auth);
    const receipts = await request(app).get(`/api/chat/receipts/${id}`).set(auth);
    const del = await request(app).delete(`/api/chat/messages/${id}`).set(auth);

    expect(readAll.status).toBe(200);
    expect(readOne.status).toBe(200);
    expect(receipts.status).toBe(200);
    expect(del.status).toBe(200);
  });

  it('validates reactions endpoints', async () => {
    const auth = { Authorization: 'Bearer token' };
    const id = new mongoose.Types.ObjectId().toString();

    const bad = await request(app).post('/api/chat/messages/reactions').set(auth).send({});
    expect(bad.status).toBe(400);

    const add = await request(app)
      .post('/api/chat/messages/reactions')
      .set(auth)
      .send({ messageId: id, reactionId: 'like' });
    const remove = await request(app)
      .delete('/api/chat/messages/reactions')
      .set(auth)
      .send({ messageId: id, reactionId: 'like' });

    expect(add.status).toBe(200);
    expect(remove.status).toBe(200);
    expect(controller.addReaction).toHaveBeenCalled();
  });
});
