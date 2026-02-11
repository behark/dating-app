import api from '../../services/api';
import { getUserFriendlyMessage } from '../../utils/errorMessages';

global.fetch = jest.fn();

describe('API Error Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
  });

  it('returns a safe fallback error for 400 responses', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: () => Promise.resolve({ success: false, message: 'Invalid request parameters' }),
    });

    await expect(api.post('/auth/login', { email: 'invalid' }, { retry: false })).rejects.toThrow(
      /unexpected error/i
    );
  });

  it('returns a safe fallback error for network failures', async () => {
    global.fetch.mockRejectedValue(new Error('ECONNREFUSED 127.0.0.1:3000'));

    await expect(api.get('/api/test', { retry: false })).rejects.toThrow(/unexpected error/i);
  });

  it('does not retry when retry is disabled', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: () => Promise.resolve({ success: false, message: 'Bad request' }),
    });

    await expect(api.post('/api/test', {}, { retry: false })).rejects.toThrow();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('returns a safe message for technical text', () => {
    const message = getUserFriendlyMessage('ECONNREFUSED 127.0.0.1:3000');

    expect(message).toMatch(/unexpected error/i);
  });

  it('handles null and undefined errors', () => {
    expect(getUserFriendlyMessage(null)).toBeTruthy();
    expect(getUserFriendlyMessage(undefined)).toBeTruthy();
  });
});
