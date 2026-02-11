const crypto = require('crypto');
const { closeRedis } = require('../config/redis');

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue(true),
  })),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'jwt-token'),
  verify: jest.fn((token) => {
    if (token === 'invalid' || token === 'abc') {
      throw new Error('Invalid token');
    }
    return { userId: 'u1' };
  }),
}));

jest.mock('../src/core/domain/User', () => {
  const buildUser = (overrides = {}) => ({
    _id: 'u1',
    email: 'test@example.com',
    name: 'Test',
    age: 25,
    gender: 'other',
    isEmailVerified: false,
    password: '$2a$10$hashed',
    save: jest.fn().mockResolvedValue(true),
    matchPassword: jest.fn(async (pwd) => pwd === 'correct-password'),
    generateAuthToken: jest.fn(() => 'auth-token'),
    generateRefreshToken: jest.fn(() => 'refresh-token'),
    ...overrides,
  });

  const User = jest.fn((doc = {}) => buildUser(doc));
  User.findOne = jest.fn(async () => null);
  User.findById = jest.fn(async () => null);
  User.__buildUser = buildUser;

  return User;
});

const authController = require('../controllers/authController');
const User = require('../src/core/domain/User');

const setEnv = () => {
  process.env.JWT_SECRET = 'secret';
  process.env.JWT_REFRESH_SECRET = 'refresh';
  process.env.EMAIL_USER = 'sender@example.com';
  process.env.EMAIL_PASSWORD = 'pass';
  process.env.FRONTEND_URL = 'https://app.example.com';
};

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authController.login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setEnv();
    User.findOne.mockResolvedValue(null);
  });

  test('Should return 400 when email or password is missing', async () => {
    const req = { body: { email: '', password: '' } };
    const res = createRes();

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test('Should return 401 when user not found', async () => {
    User.findOne.mockResolvedValueOnce(null);
    const req = { body: { email: 'nouser@example.com', password: 'x' } };
    const res = createRes();

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid email or password' })
    );
  });

  test('Should return 401 when password is incorrect', async () => {
    const user = User.__buildUser();
    user.matchPassword.mockResolvedValueOnce(false);
    User.findOne.mockResolvedValueOnce(user);

    const req = { body: { email: 'exists@example.com', password: 'wrong' } };
    const res = createRes();

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid email or password' })
    );
  });

  test('Should return 200 with tokens and user on success', async () => {
    const user = User.__buildUser();
    user.matchPassword.mockResolvedValueOnce(true);
    User.findOne.mockResolvedValueOnce(user);

    const req = { body: { email: 'exists@example.com', password: 'correct-password' } };
    const res = createRes();

    await authController.login(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          authToken: 'auth-token',
          refreshToken: 'refresh-token',
          user: expect.any(Object),
        }),
      })
    );
  });
});

describe('authController.register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setEnv();
    User.findOne.mockResolvedValue(null);
  });

  test('Should return 400 when required fields are missing', async () => {
    const req = { body: { email: '', password: '', name: '' } };
    const res = createRes();

    await authController.register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('Should return 400 when password is too short', async () => {
    const req = { body: { email: 'a@b.com', password: 'short', name: 'A' } };
    const res = createRes();

    await authController.register(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('Should return 400 when user already exists', async () => {
    User.findOne.mockResolvedValueOnce(User.__buildUser());
    const req = {
      body: { email: 'exists@example.com', password: 'correct-password', name: 'Test' },
    };
    const res = createRes();

    await authController.register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'User with this email already exists' })
    );
  });

  test('Should create user and return tokens', async () => {
    User.findOne.mockResolvedValueOnce(null);
    const newUser = User.__buildUser({ email: 'new@example.com', name: 'New' });
    User.mockImplementationOnce(() => newUser);

    const req = {
      body: {
        email: 'new@example.com',
        password: 'longpassword',
        name: 'New',
        location: { type: 'Point', coordinates: [0, 0] },
      },
    };
    const res = createRes();

    await authController.register(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ authToken: 'auth-token', refreshToken: 'refresh-token' }),
      })
    );
  });
});

describe('authController.refreshToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setEnv();
  });

  test('Should return 400 when refresh token missing', async () => {
    const req = { body: {} };
    const res = createRes();

    await authController.refreshToken(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('Should return 500 if JWT_REFRESH_SECRET not set', async () => {
    const oldRefreshSecret = process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_REFRESH_SECRET;

    const req = { body: { refreshToken: 'abc' } };
    const res = createRes();

    await authController.refreshToken(req, res);
    expect(res.status).toHaveBeenCalledWith(500);

    process.env.JWT_REFRESH_SECRET = oldRefreshSecret;
  });

  test('Should return new auth token when valid', async () => {
    User.findById.mockResolvedValueOnce(User.__buildUser());
    const req = { body: { refreshToken: 'valid' } };
    const res = createRes();

    await authController.refreshToken(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ authToken: 'auth-token', refreshToken: 'refresh-token' }),
      })
    );
  });

  test('Should return 401 when refresh token is invalid', async () => {
    const req = { body: { refreshToken: 'invalid' } };
    const res = createRes();

    await authController.refreshToken(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('authController.resetPassword and forgotPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setEnv();
    User.findOne.mockResolvedValue(null);
  });

  test('forgotPassword should succeed even if user not found', async () => {
    User.findOne.mockResolvedValueOnce(null);
    const req = { body: { email: 'nouser@example.com' } };
    const res = createRes();

    await authController.forgotPassword(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('resetPassword should return 400 on invalid inputs', async () => {
    const req = { body: { token: '', newPassword: '' } };
    const res = createRes();

    await authController.resetPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('resetPassword should reset password successfully', async () => {
    const token = crypto.randomBytes(32).toString('hex');
    const user = User.__buildUser({
      passwordResetToken: crypto.createHash('sha256').update(token).digest('hex'),
      passwordResetTokenExpiry: new Date(Date.now() + 60_000),
    });
    User.findOne.mockResolvedValueOnce(user);

    const req = {
      body: {
        token,
        newPassword: 'newPassword123',
      },
    };
    const res = createRes();

    await authController.resetPassword(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

afterAll(async () => {
  await closeRedis();
});
