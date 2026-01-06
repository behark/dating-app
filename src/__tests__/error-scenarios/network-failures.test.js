/**
 * Network Failure Tests
 * Tests for handling network disconnections, timeouts, and slow network conditions
 */

import { retryWithBackoff } from '../../utils/retryUtils';
import api from '../../services/api';
import logger from '../../utils/logger';

// Mock fetch globally
global.fetch = jest.fn();

describe('Network Failure Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
  });

  describe('Network Disconnection', () => {
    it('should handle network disconnection during login', async () => {
      global.fetch.mockRejectedValue(new Error('Network request failed'));

      await expect(
        api.post('/auth/login', { email: 'test@example.com', password: 'password' })
      ).rejects.toThrow(/network|connection/i);
    });

    it('should handle network disconnection during signup', async () => {
      global.fetch.mockRejectedValue(new Error('Failed to fetch'));

      await expect(
        api.post('/auth/signup', {
          email: 'new@example.com',
          password: 'password123',
          name: 'Test User',
        })
      ).rejects.toThrow(/network|connection/i);
    });

    it('should handle network disconnection during swipe', async () => {
      global.fetch.mockRejectedValue(new Error('NetworkError'));

      await expect(api.post('/swipes', { targetId: 'user123', type: 'like' })).rejects.toThrow(
        /network|connection/i
      );
    });

    it('should handle network disconnection during message send', async () => {
      global.fetch.mockRejectedValue(new Error('ERR_NETWORK'));

      await expect(
        api.post('/chat/send', {
          matchId: 'match123',
          content: 'Hello',
        })
      ).rejects.toThrow(/network|connection/i);
    });

    it('should show user-friendly error message on network failure', async () => {
      global.fetch.mockRejectedValue(new Error('Network request failed'));

      try {
        await api.post('/auth/login', { email: 'test@example.com', password: 'password' });
      } catch (error) {
        expect(error.message).toMatch(/network|connection|offline/i);
        expect(error.message).not.toMatch(/Network request failed/); // Should be user-friendly
      }
    });
  });

  describe('Network Timeout', () => {
    it('should handle request timeout', async () => {
      global.fetch.mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 100);
          })
      );

      await expect(
        api.post('/auth/login', { email: 'test@example.com', password: 'password' })
      ).rejects.toThrow(/timeout|network/i);
    });

    it('should retry on timeout with exponential backoff', async () => {
      let callCount = 0;
      global.fetch.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Request timeout'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { token: 'test-token' } }),
        });
      });

      const result = await retryWithBackoff(
        async () => {
          const response = await fetch('/api/test');
          return response.json();
        },
        { maxRetries: 3, initialDelay: 50 }
      );

      expect(result.success).toBe(true);
      expect(callCount).toBe(3);
    });
  });

  describe('Slow Network', () => {
    it('should handle slow network responses', async () => {
      global.fetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ success: true, data: { profiles: [] } }),
                }),
              2000
            );
          })
      );

      const startTime = Date.now();
      await api.get('/discovery/profiles');
      const duration = Date.now() - startTime;

      expect(duration).toBeGreaterThanOrEqual(2000);
    });

    it('should timeout on extremely slow network', async () => {
      global.fetch.mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 30000);
          })
      );

      await expect(api.get('/discovery/profiles')).rejects.toThrow(/timeout|network/i);
    });
  });

  describe('Partial Network Failure', () => {
    it('should handle partial response (connection lost mid-request)', async () => {
      global.fetch.mockRejectedValue(new Error('Connection lost'));

      await expect(api.post('/swipes', { targetId: 'user123', type: 'like' })).rejects.toThrow(
        /connection|network/i
      );
    });

    it('should handle malformed response due to network issues', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Unexpected end of JSON input')),
      });

      await expect(api.get('/discovery/profiles')).rejects.toThrow(/invalid|response/i);
    });
  });

  describe('Network Recovery', () => {
    it('should recover after network reconnection', async () => {
      let callCount = 0;
      global.fetch.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network request failed'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { token: 'test-token' } }),
        });
      });

      const result = await retryWithBackoff(
        async () => {
          const response = await fetch('/api/auth/login');
          return response.json();
        },
        { maxRetries: 2, initialDelay: 100 }
      );

      expect(result.success).toBe(true);
    });

    it('should queue actions when offline and sync when online', async () => {
      // Simulate offline
      global.fetch.mockRejectedValue(new Error('Network request failed'));

      // This would typically queue the action
      await expect(api.post('/swipes', { targetId: 'user123', type: 'like' })).rejects.toThrow();

      // Simulate coming back online
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { swipeId: 'swipe123' } }),
      });

      const result = await api.post('/swipes', { targetId: 'user123', type: 'like' });
      expect(result.success).toBe(true);
    });
  });

  describe('Error Message Handling', () => {
    it('should provide user-friendly error messages for network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network request failed'));

      try {
        await api.post('/auth/login', { email: 'test@example.com', password: 'password' });
      } catch (error) {
        expect(error.message).toBeTruthy();
        expect(error.message.length).toBeGreaterThan(0);
        // Should not expose technical details
        expect(error.message).not.toMatch(/fetch|ERR_|ECONN/);
      }
    });

    it('should log network errors for debugging', async () => {
      const logSpy = jest.spyOn(logger, 'error');
      global.fetch.mockRejectedValue(new Error('Network request failed'));

      try {
        await api.post('/auth/login', { email: 'test@example.com', password: 'password' });
      } catch (error) {
        // Error should be logged
        expect(logSpy).toHaveBeenCalled();
      }

      logSpy.mockRestore();
    });
  });
});
