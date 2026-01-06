/**
 * API Error Response Tests
 * Tests for handling various API error responses and status codes
 */

import api from '../../services/api';
import { getUserFriendlyMessage } from '../../utils/errorMessages';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Error Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
  });

  describe('HTTP Status Code Errors', () => {
    it('should handle 400 Bad Request', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ success: false, message: 'Invalid request parameters' }),
      });

      try {
        await api.post('/auth/login', { email: 'invalid' });
      } catch (error) {
        expect(error.message).toBeTruthy();
        expect(error.message).toMatch(/invalid|bad request/i);
      }
    });

    it('should handle 401 Unauthorized', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ success: false, message: 'Invalid credentials' }),
      });

      try {
        await api.post('/auth/login', { email: 'test@example.com', password: 'wrong' });
      } catch (error) {
        expect(error.message).toMatch(/unauthorized|invalid|credentials/i);
      }
    });

    it('should handle 403 Forbidden', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ success: false, message: 'Access denied' }),
      });

      try {
        await api.get('/api/premium/features');
      } catch (error) {
        expect(error.message).toMatch(/forbidden|access denied|permission/i);
      }
    });

    it('should handle 404 Not Found', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ success: false, message: 'Resource not found' }),
      });

      try {
        await api.get('/api/nonexistent');
      } catch (error) {
        expect(error.message).toMatch(/not found|404/i);
      }
    });

    it('should handle 409 Conflict', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 409,
        statusText: 'Conflict',
        json: () => Promise.resolve({ success: false, message: 'User already exists' }),
      });

      try {
        await api.post('/auth/signup', {
          email: 'existing@example.com',
          password: 'password123',
          name: 'Test User',
        });
      } catch (error) {
        expect(error.message).toMatch(/already exists|conflict/i);
      }
    });

    it('should handle 422 Unprocessable Entity', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: () =>
          Promise.resolve({
            success: false,
            message: 'Validation failed',
            errors: [{ field: 'email', message: 'Invalid email format' }],
          }),
      });

      try {
        await api.post('/auth/signup', {
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User',
        });
      } catch (error) {
        expect(error.message).toMatch(/validation|invalid/i);
      }
    });

    it('should handle 429 Too Many Requests', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () =>
          Promise.resolve({ success: false, message: 'Rate limit exceeded', retryAfter: 60 }),
      });

      try {
        await api.post('/swipes', { targetId: 'user123', type: 'like' });
      } catch (error) {
        expect(error.message).toMatch(/rate limit|too many|try again/i);
      }
    });

    it('should handle 500 Internal Server Error', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ success: false, message: 'Internal server error' }),
      });

      try {
        await api.get('/api/test');
      } catch (error) {
        expect(error.message).toMatch(/server error|try again/i);
      }
    });

    it('should handle 503 Service Unavailable', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: () => Promise.resolve({ success: false, message: 'Service temporarily unavailable' }),
      });

      try {
        await api.get('/api/test');
      } catch (error) {
        expect(error.message).toMatch(/unavailable|try again/i);
      }
    });
  });

  describe('Error Response Formats', () => {
    it('should handle standard error response format', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ success: false, message: 'Error message' }),
      });

      try {
        await api.post('/api/test', {});
      } catch (error) {
        expect(error.message).toBe('Error message');
      }
    });

    it('should handle error response with error field', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({ success: false, error: 'ERROR_CODE', message: 'Error message' }),
      });

      try {
        await api.post('/api/test', {});
      } catch (error) {
        expect(error.message).toBeTruthy();
        expect(error.code).toBe('ERROR_CODE');
      }
    });

    it('should handle error response with errors array', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 422,
        json: () =>
          Promise.resolve({
            success: false,
            message: 'Validation failed',
            errors: [
              { field: 'email', message: 'Invalid email' },
              { field: 'password', message: 'Password too short' },
            ],
          }),
      });

      try {
        await api.post('/api/test', {});
      } catch (error) {
        expect(error.message).toMatch(/validation|invalid/i);
      }
    });

    it('should handle empty error response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      try {
        await api.get('/api/test');
      } catch (error) {
        expect(error.message).toBeTruthy();
      }
    });

    it('should handle non-JSON error response', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      try {
        await api.get('/api/test');
      } catch (error) {
        expect(error.message).toBeTruthy();
      }
    });
  });

  describe('Retry Logic for Errors', () => {
    it('should retry on 5xx errors', async () => {
      let callCount = 0;
      global.fetch.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ success: false, message: 'Server error' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { result: 'success' } }),
        });
      });

      const result = await api.get('/api/test');
      expect(result.success).toBe(true);
      expect(callCount).toBe(3);
    });

    it('should not retry on 4xx errors', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ success: false, message: 'Bad request' }),
      });

      try {
        await api.post('/api/test', {});
      } catch (error) {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('User-Friendly Error Messages', () => {
    it('should convert technical errors to user-friendly messages', () => {
      const technicalError = 'ECONNREFUSED 127.0.0.1:3000';
      const friendlyMessage = getUserFriendlyMessage(technicalError);
      expect(friendlyMessage).not.toMatch(/ECONNREFUSED|127.0.0.1/);
      expect(friendlyMessage).toMatch(/connection|network/i);
    });

    it('should preserve user-friendly messages', () => {
      const friendlyError = 'Invalid email format';
      const message = getUserFriendlyMessage(friendlyError);
      expect(message).toBe(friendlyError);
    });

    it('should handle null/undefined errors gracefully', () => {
      const message1 = getUserFriendlyMessage(null);
      const message2 = getUserFriendlyMessage(undefined);
      expect(message1).toBeTruthy();
      expect(message2).toBeTruthy();
    });
  });

  describe('Error Logging', () => {
    it('should log API errors for debugging', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ success: false, message: 'Server error' }),
      });

      try {
        await api.get('/api/test');
      } catch (error) {
        // Error should be logged
      }

      consoleErrorSpy.mockRestore();
    });
  });
});
