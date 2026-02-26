const express = require('express');
const request = require('supertest');

jest.mock('../../src/api/controllers/authController', () => ({
  register: jest.fn((req, res) => res.status(201).json({ success: true })),
  login: jest.fn((req, res) => res.status(200).json({ success: true })),
  verifyEmail: jest.fn((req, res) => res.status(200).json({ success: true })),
  forgotPassword: jest.fn((req, res) => res.status(200).json({ success: true })),
  resetPassword: jest.fn((req, res) => res.status(200).json({ success: true })),
  logout: jest.fn((req, res) => res.status(200).json({ success: true })),
  deleteAccount: jest.fn((req, res) => res.status(200).json({ success: true })),
  refreshToken: jest.fn((req, res) => res.status(200).json({ success: true })),
  googleAuth: jest.fn((req, res) => res.status(200).json({ success: true })),
  facebookAuth: jest.fn((req, res) => res.status(200).json({ success: true })),
  appleAuth: jest.fn((req, res) => res.status(200).json({ success: true })),
}));

jest.mock('../../src/api/controllers/phoneController', () => ({
  sendPhoneVerification: jest.fn((req, res) => res.status(200).json({ success: true })),
  verifyPhone: jest.fn((req, res) => res.status(200).json({ success: true })),
  resendPhoneVerification: jest.fn((req, res) => res.status(200).json({ success: true })),
}));

jest.mock('../../src/api/middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    req.user = { _id: 'user_1', role: 'user' };
    next();
  }),
}));

const authController = require('../../src/api/controllers/authController');
const phoneController = require('../../src/api/controllers/phoneController');

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', require('../../routes/auth'));
  return app;
};

describe('auth routes', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates register payload and forwards valid request', async () => {
    const bad = await request(app).post('/api/auth/register').send({
      email: 'bad-email',
      password: '123',
      name: '',
    });
    expect(bad.status).toBe(400);
    expect(authController.register).not.toHaveBeenCalled();

    const ok = await request(app).post('/api/auth/register').send({
      email: 'user@example.com',
      password: 'Password123',
      name: 'User',
      age: 25,
      gender: 'male',
    });
    expect(ok.status).toBe(201);
    expect(authController.register).toHaveBeenCalled();
  });

  it('validates login payload', async () => {
    const bad = await request(app).post('/api/auth/login').send({
      email: 'user@example.com',
      password: '',
    });
    expect(bad.status).toBe(400);

    const ok = await request(app).post('/api/auth/login').send({
      email: 'user@example.com',
      password: 'Password123',
    });
    expect(ok.status).toBe(200);
    expect(authController.login).toHaveBeenCalled();
  });

  it('validates verify-email and refresh-token payloads', async () => {
    const verifyBad = await request(app).post('/api/auth/verify-email').send({});
    expect(verifyBad.status).toBe(400);

    const refreshBad = await request(app).post('/api/auth/refresh-token').send({});
    expect(refreshBad.status).toBe(400);

    const verifyOk = await request(app).post('/api/auth/verify-email').send({ token: 't' });
    const refreshOk = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: 'r' });
    expect(verifyOk.status).toBe(200);
    expect(refreshOk.status).toBe(200);
  });

  it('validates OAuth payloads', async () => {
    const googleBad = await request(app).post('/api/auth/google').send({ email: 'x@example.com' });
    const facebookBad = await request(app)
      .post('/api/auth/facebook')
      .send({ email: 'x@example.com' });
    const appleBad = await request(app).post('/api/auth/apple').send({});
    expect(googleBad.status).toBe(400);
    expect(facebookBad.status).toBe(400);
    expect(appleBad.status).toBe(400);

    const googleOk = await request(app)
      .post('/api/auth/google')
      .send({ googleId: 'g1', email: 'x@example.com' });
    const facebookOk = await request(app)
      .post('/api/auth/facebook')
      .send({ facebookId: 'f1', email: 'x@example.com' });
    const appleOk = await request(app).post('/api/auth/apple').send({ appleId: 'a1' });
    expect(googleOk.status).toBe(200);
    expect(facebookOk.status).toBe(200);
    expect(appleOk.status).toBe(200);
  });

  it('protects authenticated endpoints', async () => {
    const noAuth = await request(app).post('/api/auth/logout');
    expect(noAuth.status).toBe(401);

    const logout = await request(app).post('/api/auth/logout').set('Authorization', 'Bearer token');
    const del = await request(app)
      .delete('/api/auth/delete-account')
      .set('Authorization', 'Bearer token');
    expect(logout.status).toBe(200);
    expect(del.status).toBe(200);
    expect(authController.logout).toHaveBeenCalled();
    expect(authController.deleteAccount).toHaveBeenCalled();
  });

  it('routes phone verification endpoints through auth', async () => {
    const noAuth = await request(app).post('/api/auth/send-phone-verification').send({
      phoneNumber: '+15555550123',
    });
    expect(noAuth.status).toBe(401);

    const send = await request(app)
      .post('/api/auth/send-phone-verification')
      .set('Authorization', 'Bearer token')
      .send({ phoneNumber: '+15555550123' });
    const verify = await request(app)
      .post('/api/auth/verify-phone')
      .set('Authorization', 'Bearer token')
      .send({ code: '123456' });
    const resend = await request(app)
      .post('/api/auth/resend-phone-verification')
      .set('Authorization', 'Bearer token');

    expect(send.status).toBe(200);
    expect(verify.status).toBe(200);
    expect(resend.status).toBe(200);
    expect(phoneController.sendPhoneVerification).toHaveBeenCalled();
    expect(phoneController.verifyPhone).toHaveBeenCalled();
    expect(phoneController.resendPhoneVerification).toHaveBeenCalled();
  });
});
