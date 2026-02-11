import api from '../../services/api';

global.fetch = jest.fn();

describe('Race Conditions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data: { ok: true } }),
    });
  });

  it('rate limits rapid repeated writes by default', async () => {
    const requests = Array.from({ length: 20 }, () => api.post('/swipes', { targetId: 'u1' }));
    const results = await Promise.allSettled(requests);

    const fulfilledCount = results.filter((r) => r.status === 'fulfilled').length;
    expect(fulfilledCount).toBeGreaterThan(0);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('allows high-throughput writes when rate limiting is explicitly bypassed', async () => {
    const requests = Array.from({ length: 20 }, (_, i) =>
      api.post(
        '/swipes',
        { targetId: `u${i}` },
        { bypassRateLimit: true, bypassDeduplication: true, retry: false }
      )
    );

    const results = await Promise.allSettled(requests);
    const rejectedCount = results.filter((r) => r.status === 'rejected').length;

    expect(rejectedCount).toBe(0);
  });

  it('deduplicates identical in-flight requests', async () => {
    const first = api.get('/discovery/explore?lat=1&lng=1', {
      bypassRateLimit: true,
      retry: false,
    });
    const second = api.get('/discovery/explore?lat=1&lng=1', {
      bypassRateLimit: true,
      retry: false,
    });

    const [a, b] = await Promise.all([first, second]);
    expect(a.success).toBe(true);
    expect(b.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
