import api from '../../services/api';

global.fetch = jest.fn();

describe('Network Failure Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
  });

  it('returns safe error when network is disconnected', async () => {
    global.fetch.mockRejectedValue(new Error('Network request failed'));

    await expect(api.post('/auth/login', { email: 'a@b.com' }, { retry: false })).rejects.toThrow(
      /unable to connect|network|internet/i
    );
  });

  it('maps timeout-style failures to safe message', async () => {
    global.fetch.mockRejectedValue(new Error('Request timeout'));

    await expect(api.get('/api/test', { retry: false })).rejects.toThrow(/timed out|unexpected/i);
  });

  it('can recover after temporary network failure', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network request failed')).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data: { ok: true } }),
    });

    await expect(api.get('/api/recover', { retry: false })).rejects.toThrow();

    const result = await api.get('/api/recover', { retry: false });
    expect(result.success).toBe(true);
  });

  it('does not hang on malformed JSON responses', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new Error('Unexpected end of JSON input')),
    });

    await expect(api.get('/api/malformed', { retry: false })).rejects.toThrow();
  });
});
