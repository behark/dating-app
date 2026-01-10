/**
 * Auth Controller Tests
 * Focused unit tests for authentication endpoints
 */
const authController = require('../controllers/authController');

// Mock external dependencies
jest.mock('nodemailer');
jest.mock('jsonwebtoken');
jest.mock('../src/core/domain/User');

const User = require('../src/core/domain/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Setup env
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh';
process.env.EMAIL_USER = 'test@example.com';
process.env.EMAIL_PASSWORD = 'password';
process.env.FRONTEND_URL = 'http://localhost:3000';

// Helper to create mock response
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Mock user instance
const mockUser = {
  _id: 'user123',
  email: 'test@example.com',
  name: 'Test User',
  age: 25,
  gender: 'other',
  isEmailVerified: false,
  location: { type: 'Point', coordinates: [-122.4194, 37.7749] },
  password: '$2a$10$hashed',
  save: jest.fn().mockResolvedValue(true),
  matchPassword: jest.fn().mockResolvedValue(true),
  generateAuthToken: jest.fn().mockReturnValue('auth-token'),
  generateRefreshToken: jest.fn().mockReturnValue('refresh-token'),
};

describe('authController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jwt.sign.mockReturnValue('jwt-token');
    jwt.verify.mockReturnValue({ userId: 'user123' });
    nodemailer.createTransport = jest.fn().mockReturnValue({
      sendMail: jest.fn().mockResolvedValue(true),
    });
  });

  describe('login', () => {
    test('returns 400 when email is missing', async () => {
      const req = { body: { password: 'test' } };
      const res = mockResponse();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 401 when user not found', async () => {
      User.findOne.mockResolvedValueOnce(null);
      const req = { body: { email: 'notfound@example.com', password: 'test' } };
      const res = mockResponse();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('returns 401 when password is incorrect', async () => {
      User.findOne.mockResolvedValueOnce(mockUser);
      mockUser.matchPassword.mockResolvedValueOnce(false);
      const req = { body: { email: 'test@example.com', password: 'wrong' } };
      const res = mockResponse();

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('returns 200 with tokens on successful login', async () => {
      User.findOne.mockResolvedValueOnce(mockUser);
      mockUser.matchPassword.mockResolvedValueOnce(true);
      const req = { body: { email: 'test@example.com', password: 'correct' } };
      const res = mockResponse();

      await authController.login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            authToken: 'auth-token',
            refreshToken: 'refresh-token',
          }),
        })
      );
    });
  });

  describe('register', () => {
    test('returns 400 when required fields are missing', async () => {
      const req = { body: { email: '', name: '' } };
      const res = mockResponse();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 400 when password is too short', async () => {
      const req = { body: { email: 'new@example.com', password: 'short', name: 'New' } };
      const res = mockResponse();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 400 when user already exists', async () => {
      User.findOne.mockResolvedValueOnce(mockUser);
      const req = { body: { email: 'test@example.com', password: 'password123', name: 'Test' } };
      const res = mockResponse();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 201 and creates user on success', async () => {
      User.findOne.mockResolvedValueOnce(null);
      const mockNewUser = jest.fn().mockReturnValue(mockUser);
      User.mockImplementation(mockNewUser);

      const req = {
        body: {
          email: 'new@example.com',
          password: 'password123',
          name: 'New User',
        },
      };
      const res = mockResponse();

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            authToken: 'auth-token',
            refreshToken: 'refresh-token',
          }),
        })
      );
    });
  });

  describe('refreshToken', () => {
    test('returns 400 when token is missing', async () => {
      const req = { body: {} };
      const res = mockResponse();

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 500 when JWT_REFRESH_SECRET is not configured', async () => {
      const oldSecret = process.env.JWT_REFRESH_SECRET;
      delete process.env.JWT_REFRESH_SECRET;

      const req = { body: { refreshToken: 'token' } };
      const res = mockResponse();

      await authController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(500);

      process.env.JWT_REFRESH_SECRET = oldSecret;
    });

    test('returns 200 with new token on valid refresh token', async () => {
      User.findById.mockResolvedValueOnce(mockUser);
      const req = { body: { refreshToken: 'valid-token' } };
      const res = mockResponse();

      await authController.refreshToken(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ authToken: 'auth-token' }),
        })
      );
    });
  });

  describe('verifyEmail', () => {
    test('returns 400 when token is missing', async () => {
      const req = { body: {} };
      const res = mockResponse();

      await authController.verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 200 and marks email as verified', async () => {
      const verifyingUser = { ...mockUser, isEmailVerified: true };
      User.findOne.mockResolvedValueOnce(verifyingUser);

      const req = { body: { token: 'valid-token' } };
      const res = mockResponse();

      await authController.verifyEmail(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
