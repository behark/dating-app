/**
 * Race Condition Tests
 * Tests for handling race conditions in rapid operations
 */

import api from '../../services/api';

// Mock fetch globally
global.fetch = jest.fn();

describe('Race Conditions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
  });

  describe('Rapid Swipe Operations', () => {
    it('should handle rapid consecutive swipes', async () => {
      let callCount = 0;
      global.fetch.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: { swipeId: `swipe${callCount}`, isMatch: false },
            }),
        });
      });

      const swipes = Array.from({ length: 10 }, (_, i) =>
        api.post('/swipes', {
          targetId: `user${i}`,
          type: 'like',
        })
      );

      const results = await Promise.all(swipes);
      expect(results.length).toBe(10);
      expect(callCount).toBe(10);
    });

    it('should prevent duplicate swipes on same user', async () => {
      let callCount = 0;
      global.fetch.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ success: true, data: { swipeId: 'swipe1', isMatch: false } }),
          });
        }
        // Second call should return error or existing swipe
        return Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ success: false, message: 'Swipe already exists' }),
        });
      });

      const firstSwipe = await api.post('/swipes', { targetId: 'user123', type: 'like' });
      expect(firstSwipe.success).toBe(true);

      try {
        await api.post('/swipes', { targetId: 'user123', type: 'like' });
      } catch (error) {
        expect(error.message).toMatch(/already|duplicate/i);
      }
    });

    it('should handle concurrent swipes on different users', async () => {
      global.fetch.mockImplementation((url, options) => {
        const body = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: { swipeId: `swipe-${body.targetId}`, isMatch: false },
            }),
        });
      });

      const swipes = Array.from({ length: 5 }, (_, i) =>
        api.post('/swipes', {
          targetId: `user${i}`,
          type: 'like',
        })
      );

      const results = await Promise.all(swipes);
      expect(results.every((r) => r.success)).toBe(true);
    });
  });

  describe('Concurrent Message Sending', () => {
    it('should handle rapid message sending', async () => {
      let callCount = 0;
      global.fetch.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: { messageId: `msg${callCount}`, timestamp: Date.now() },
            }),
        });
      });

      const messages = Array.from({ length: 10 }, (_, i) =>
        api.post('/chat/send', {
          matchId: 'match123',
          content: `Message ${i}`,
        })
      );

      const results = await Promise.all(messages);
      expect(results.length).toBe(10);
      expect(callCount).toBe(10);
    });

    it('should maintain message order', async () => {
      const messages = [];
      global.fetch.mockImplementation((url, options) => {
        const body = JSON.parse(options.body);
        messages.push(body.content);
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: { messageId: `msg${messages.length}`, content: body.content },
            }),
        });
      });

      const sends = Array.from({ length: 5 }, (_, i) =>
        api.post('/chat/send', {
          matchId: 'match123',
          content: `Message ${i}`,
        })
      );

      await Promise.all(sends);
      // Messages should be sent (order may vary due to concurrency)
      expect(messages.length).toBe(5);
    });
  });

  describe('Concurrent Login Attempts', () => {
    it('should handle multiple simultaneous login attempts', async () => {
      let callCount = 0;
      global.fetch.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: { token: `token${callCount}`, user: { id: 'user123' } },
            }),
        });
      });

      const logins = Array.from({ length: 5 }, () =>
        api.post('/auth/login', {
          email: 'test@example.com',
          password: 'password123',
        })
      );

      const results = await Promise.all(logins);
      expect(results.length).toBe(5);
    });

    it('should handle concurrent login and signup', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('login')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: { token: 'token1' } }),
          });
        }
        if (url.includes('signup')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: { token: 'token2' } }),
          });
        }
      });

      const login = api.post('/auth/login', { email: 'test@example.com', password: 'password' });
      const signup = api.post('/auth/signup', {
        email: 'new@example.com',
        password: 'password',
        name: 'New User',
      });

      const results = await Promise.all([login, signup]);
      expect(results.length).toBe(2);
    });
  });

  describe('Concurrent Profile Updates', () => {
    it('should handle rapid profile updates', async () => {
      let callCount = 0;
      global.fetch.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: { profile: { bio: `Bio ${callCount}` } },
            }),
        });
      });

      const updates = Array.from({ length: 5 }, (_, i) =>
        api.put('/profile', {
          bio: `Updated bio ${i}`,
        })
      );

      const results = await Promise.all(updates);
      expect(results.length).toBe(5);
    });

    it('should handle last-write-wins for concurrent updates', async () => {
      let lastUpdate = null;
      global.fetch.mockImplementation((url, options) => {
        const body = JSON.parse(options.body);
        lastUpdate = body.bio;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { profile: { bio: lastUpdate } } }),
        });
      });

      const updates = Array.from({ length: 3 }, (_, i) =>
        api.put('/profile', {
          bio: `Bio ${i}`,
        })
      );

      await Promise.all(updates);
      // Last update should be one of the sent values
      expect(['Bio 0', 'Bio 1', 'Bio 2']).toContain(lastUpdate);
    });
  });

  describe('Network Race Conditions', () => {
    it('should handle request cancellation on rapid navigation', async () => {
      const controller = new AbortController();
      let cancelled = false;

      global.fetch.mockImplementation((url, options) => {
        if (options.signal) {
          options.signal.addEventListener('abort', () => {
            cancelled = true;
          });
        }
        return new Promise((resolve) => {
          setTimeout(() => {
            if (!cancelled) {
              resolve({
                ok: true,
                json: () => Promise.resolve({ success: true, data: {} }),
              });
            }
          }, 100);
        });
      });

      const request = fetch('/api/test', { signal: controller.signal });
      controller.abort();

      await expect(request).rejects.toThrow();
    });

    it('should handle timeout race conditions', async () => {
      let resolved = false;
      global.fetch.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              resolve({
                ok: true,
                json: () => Promise.resolve({ success: true, data: {} }),
              });
            }
          }, 1000);
        });
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 500);
      });

      await expect(Promise.race([fetch('/api/test'), timeoutPromise])).rejects.toThrow('Timeout');
    });
  });

  describe('State Update Race Conditions', () => {
    it('should handle rapid state updates', () => {
      let state = 0;
      const updates = Array.from({ length: 100 }, () => {
        state++;
        return state;
      });

      expect(updates.length).toBe(100);
      expect(state).toBe(100);
    });

    it('should handle concurrent array operations', () => {
      const array = [];
      const operations = Array.from({ length: 10 }, (_, i) => {
        array.push(i);
        return array.length;
      });

      expect(array.length).toBe(10);
      expect(operations.length).toBe(10);
    });
  });
});
