const express = require('express');
const request = require('supertest');

jest.mock('../../src/api/controllers/privacyController', () => ({
  exportUserData: jest.fn((req, res) => res.status(200).json({ success: true })),
  getPrivacySettings: jest.fn((req, res) => res.status(200).json({ success: true })),
  updatePrivacySettings: jest.fn((req, res) => res.status(200).json({ success: true })),
  doNotSell: jest.fn((req, res) => res.status(200).json({ success: true })),
  deleteAccount: jest.fn((req, res) => res.status(200).json({ success: true })),
  rectifyData: jest.fn((req, res) => res.status(200).json({ success: true })),
  getConsentStatus: jest.fn((req, res) => res.status(200).json({ success: true })),
  recordConsent: jest.fn((req, res) => res.status(200).json({ success: true })),
  withdrawConsent: jest.fn((req, res) => res.status(200).json({ success: true })),
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

const controller = require('../../src/api/controllers/privacyController');

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/privacy', require('../../routes/privacy'));
  return app;
};

describe('privacy routes', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires auth', async () => {
    const res = await request(app).get('/api/privacy/settings');
    expect(res.status).toBe(401);
  });

  it('routes settings and export endpoints', async () => {
    const auth = { Authorization: 'Bearer token' };
    const exportData = await request(app).get('/api/privacy/export').set(auth);
    const settings = await request(app).get('/api/privacy/settings').set(auth);
    const update = await request(app).put('/api/privacy/settings').set(auth).send({});

    expect(exportData.status).toBe(200);
    expect(settings.status).toBe(200);
    expect(update.status).toBe(200);
    expect(controller.updatePrivacySettings).toHaveBeenCalled();
  });

  it('routes do-not-sell, delete, rectify and consent endpoints', async () => {
    const auth = { Authorization: 'Bearer token' };
    const doNotSell = await request(app).post('/api/privacy/do-not-sell').set(auth).send({});
    const del = await request(app).delete('/api/privacy/delete-account').set(auth);
    const rectify = await request(app).put('/api/privacy/rectify').set(auth).send({});
    const consentGet = await request(app).get('/api/privacy/consent').set(auth);
    const consentSet = await request(app).post('/api/privacy/consent').set(auth).send({});
    const consentDel = await request(app).delete('/api/privacy/consent').set(auth);

    expect(doNotSell.status).toBe(200);
    expect(del.status).toBe(200);
    expect(rectify.status).toBe(200);
    expect(consentGet.status).toBe(200);
    expect(consentSet.status).toBe(200);
    expect(consentDel.status).toBe(200);
  });
});
