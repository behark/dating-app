import api from '../../services/api';
import {
  sanitizeInput,
  validateEmail,
  validateName,
  validatePassword,
} from '../../utils/validators';

global.fetch = jest.fn();

describe('Invalid Input Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
  });

  it('rejects invalid email formats', () => {
    const invalidEmails = ['invalid', 'test@', '@example.com', 'no-at-symbol.com', ''];

    invalidEmails.forEach((email) => {
      expect(validateEmail(email)).toBe(false);
    });
  });

  it('rejects weak passwords and accepts strong ones', () => {
    expect(validatePassword('short')).toBe(false);
    expect(validatePassword('12345678')).toBe(true);
  });

  it('rejects empty names', () => {
    expect(validateName('')).toBe(false);
    expect(validateName('   ')).toBe(false);
    expect(validateName('John')).toBe(true);
  });

  it('sanitizes angle brackets from user input', () => {
    const malicious = '<script>alert(1)</script>';
    const sanitized = sanitizeInput(malicious);

    expect(sanitized).not.toContain('<');
    expect(sanitized).not.toContain('>');
  });

  it('returns safe fallback error for invalid server-side input', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      json: () => Promise.resolve({ success: false, message: 'Validation failed' }),
    });

    await expect(api.post('/auth/signup', { email: 'invalid' }, { retry: false })).rejects.toThrow(
      /unexpected error/i
    );
  });
});
