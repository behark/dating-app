/**
 * Auth Controller Tests
 * Focused unit tests for authentication endpoints
 */

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue(true),
  })),
}));
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'jwt-token'),
  verify: jest.fn(() => ({ userId: 'user123' })),
}));
jest.mock('../src/core/domain/User', () => {
  const buildUser = (overrides = {}) => ({
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
    ...overrides,
  });

  const chainable = (valueFn) => {
    const query = {
      select: jest.fn().mockImplementation(() => query),
      lean: jest.fn().mockImplementation(() => query),
      then: (resolve, reject) => valueFn().then(resolve, reject),
    };
    return query;
  };

  let _findOneValue = null;
  let _findByIdValue = null;

  const User = jest.fn((doc = {}) => buildUser(doc));
  User.findOne = jest.fn(() => chainable(() => Promise.resolve(_findOneValue)));
  User.findById = jest.fn(() => chainable(() => Promise.resolve(_findByIdValue)));
  User.findOne.mockResolvedValue = (val) => { _findOneValue = val; };
  User.findOne.mockResolvedValueOnce = (val) => {
    const orig = _findOneValue;
    User.findOne.mockImplementationOnce(() => {
      _findOneValue = orig;
      return chainable(() => Promise.resolve(val));
    });
  };
  User.findById.mockResolvedValue = (val) => { _findByIdValue = val; };
  User.findById.mockResolvedValueOnce = (val) => {
    const orig = _findByIdValue;
    User.findById.mockImplementationOnce(() => {
      _findByIdValue = orig;
      return chainable(() => Promise.resolve(val));
    });
  };
  User.__buildUser = buildUser;
  return User;
});

const authController = require('../controllers/authController');
const User = require('../src/core/domain/User');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh';
process.env.EMAIL_USER = 'test@example.com';
process.env.EMAIL_PASSWORD = 'password';
process.env.FRONTEND_URL = 'http://localhost:3000';

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jwt.verify.mockReturnValue({ userId: 'user123' });
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

    test('returns 200 with tokens on successful login', async () => {
      const mockUser = User.__buildUser();
      mockUser.matchPassword.mockResolvedValueOnce(true);
      User.findOne.mockResolvedValueOnce(mockUser);

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

    test('returns 201 and creates user on success', async () => {
      User.findOne.mockResolvedValueOnce(null);
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

    test('returns 200 with new token on valid refresh token', async () => {
      User.findById.mockResolvedValueOnce(User.__buildUser());
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
      const verifyingUser = User.__buildUser({ isEmailVerified: true });
      User.findOne.mockResolvedValueOnce(verifyingUser);
      const req = { body: { token: 'valid-token' } };
      const res = mockResponse();

      await authController.verifyEmail(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
