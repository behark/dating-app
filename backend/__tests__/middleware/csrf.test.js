const { csrfProtection } = require('../../src/api/middleware/csrf');

describe('csrfProtection middleware (unit)', () => {
  const buildRes = () => {
    const res = {
      statusCode: 200,
      headers: {},
      cookiesSet: {},
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.payload = payload;
        return this;
      },
      setHeader(key, value) {
        this.headers[key.toLowerCase()] = value;
      },
      cookie(name, value, options) {
        this.cookiesSet[name] = { value, options };
      },
    };
    return res;
  };

  const buildReq = (overrides = {}) => ({
    method: 'POST',
    path: '/test',
    headers: {},
    cookies: {},
    ...overrides,
  });

  test('first request issues token and allows through', async () => {
    const req = buildReq();
    const res = buildRes();
    const next = jest.fn();

    await csrfProtection()(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.cookiesSet['csrf-token']).toBeDefined();
    expect(res.headers['x-csrf-token']).toBeDefined();
  });

  test('cookie without header is rejected', async () => {
    const req = buildReq({ cookies: { 'csrf-token': 'abc' } });
    const res = buildRes();
    const next = jest.fn();

    await csrfProtection()(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.payload).toEqual(expect.objectContaining({ success: false }));
  });

  test('matching header passes validation', async () => {
    const token = 'securetoken';
    const req = buildReq({
      cookies: { 'csrf-token': token },
      headers: { 'x-csrf-token': token },
    });
    const res = buildRes();
    const next = jest.fn();

    await csrfProtection()(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });
});
