const crypto = require('crypto');

jest.mock('../src/core/domain/User', () => ({
  findById: jest.fn(),
}));

const User = require('../src/core/domain/User');
const phoneController = require('../src/api/controllers/phoneController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('phoneController.verifyPhone', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const makeUser = (overrides = {}) => ({
    _id: 'u1',
    phoneVerificationCode: undefined,
    phoneVerificationCodeExpiry: undefined,
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
  });

  it('returns 400 when no active code exists', async () => {
    const user = makeUser();
    User.findById.mockResolvedValue(user);

    const req = { user: { _id: 'u1' }, body: { code: '123456' } };
    const res = mockRes();

    await phoneController.verifyPhone(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('returns 400 and clears expired code', async () => {
    const code = '123456';
    const hashed = crypto.createHash('sha256').update(code).digest('hex');
    const user = makeUser({
      phoneVerificationCode: hashed,
      phoneVerificationCodeExpiry: new Date(Date.now() - 1000),
    });
    User.findById.mockResolvedValue(user);

    const req = { user: { _id: 'u1' }, body: { code } };
    const res = mockRes();

    await phoneController.verifyPhone(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(user.phoneVerificationCode).toBeUndefined();
    expect(user.phoneVerificationCodeExpiry).toBeUndefined();
    expect(user.save).toHaveBeenCalled();
  });

  it('verifies valid code and marks phone verified', async () => {
    const code = '654321';
    const hashed = crypto.createHash('sha256').update(code).digest('hex');
    const user = makeUser({
      phoneVerificationCode: hashed,
      phoneVerificationCodeExpiry: new Date(Date.now() + 1000 * 60),
      isPhoneVerified: false,
    });
    User.findById.mockResolvedValue(user);

    const req = { user: { _id: 'u1' }, body: { code } };
    const res = mockRes();

    await phoneController.verifyPhone(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    expect(user.isPhoneVerified).toBe(true);
    expect(user.phoneVerificationCode).toBeUndefined();
    expect(user.phoneVerificationCodeExpiry).toBeUndefined();
  });
});
