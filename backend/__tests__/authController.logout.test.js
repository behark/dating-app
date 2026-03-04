const jwt = require('jsonwebtoken');

jest.mock('../src/config/redis', () => ({
  getRedis: jest.fn(),
}));
jest.mock('../src/core/domain/BlacklistedToken', () => ({
  findOneAndUpdate: jest.fn(),
}));

const { getRedis } = require('../src/config/redis');
const BlacklistedToken = require('../src/core/domain/BlacklistedToken');
const authController = require('../src/api/controllers/authController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authController.logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'secret';
  });

  it('returns 401 for invalid token', async () => {
    jwt.verify = jest.fn(() => {
      throw new Error('Invalid token');
    });

    const req = { headers: { authorization: 'Bearer bad-token' } };
    const res = mockRes();

    await authController.logout(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(getRedis).not.toHaveBeenCalled();
  });

  it('blacklists verified token with clamped TTL', async () => {
    const futureExp = Math.floor(Date.now() / 1000) + 864000; // 10 days
    jwt.verify = jest.fn(() => ({ userId: 'user123', exp: futureExp }));

    const setex = jest.fn();
    getRedis.mockResolvedValue({ setex });

    const req = { headers: { authorization: 'Bearer good-token' } };
    const res = mockRes();

    await authController.logout(req, res);

    expect(setex).toHaveBeenCalled();
    const ttlArg = Number(setex.mock.calls[0][2]);
    expect(Number.isNaN(ttlArg)).toBe(false);
    expect(ttlArg).toBeLessThanOrEqual(604800); // default clamp of 7 days
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    expect(BlacklistedToken.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
