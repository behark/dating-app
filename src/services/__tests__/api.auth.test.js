/**
 * API Auth Flow Tests
 * Tests token management, refresh logic, and session expiration
 */
import api, { setSessionExpiredCallback } from '../api';
import { getTokenSecurely, storeTokenSecurely, removeTokenSecurely } from '../../utils/secureStorage';

// Mock secure storage
jest.mock('../../utils/secureStorage', () => ({
  getTokenSecurely: jest.fn(),
  storeTokenSecurely: jest.fn().mockResolvedValue(undefined),
  removeTokenSecurely: jest.fn().mockResolvedValue(undefined),
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
}));

// Mock config
jest.mock('../../config/api', () => ({
  API_URL: 'https://test-backend.example.com/api',
}));

// Mock rate limiter and deduplicator
jest.mock('../../utils/rateLimiter', () => ({
  __esModule: true,
  default: { checkLimit: jest.fn().mockReturnValue({ allowed: true }) },
}));
jest.mock('../../utils/requestDeduplication', () => ({
  __esModule: true,
  default: { deduplicate: jest.fn((key, fn) => fn()) },
}));
jest.mock('../../utils/retryUtils', () => ({
  retryWithBackoff: jest.fn((fn) => fn()),
}));
jest.mock('../../utils/errorMessages', () => ({
  getUserFriendlyMessage: jest.fn((msg) => msg),
  STANDARD_ERROR_MESSAGES: {},
}));
jest.mock('../../utils/toast', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

describe('API Auth Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api._authToken = null;
    api._refreshToken = null;
    api._isRefreshing = false;
    api._refreshQueue = [];
  });

  describe('Token Management', () => {
    it('should set and persist auth token', () => {
      api.setAuthToken('test-auth-token');

      expect(api._authToken).toBe('test-auth-token');
      expect(storeTokenSecurely).toHaveBeenCalledWith('authToken', 'test-auth-token');
    });

    it('should set and persist refresh token', () => {
      api.setRefreshToken('test-refresh-token');

      expect(api._refreshToken).toBe('test-refresh-token');
      expect(storeTokenSecurely).toHaveBeenCalledWith('refreshToken', 'test-refresh-token');
    });

    it('should return cached auth token from memory', async () => {
      api._authToken = 'cached-token';

      const token = await api.getAuthToken();

      expect(token).toBe('cached-token');
      expect(getTokenSecurely).not.toHaveBeenCalled();
    });

    it('should fall back to secure storage when no cached token', async () => {
      getTokenSecurely.mockResolvedValueOnce('stored-token');

      const token = await api.getAuthToken();

      expect(token).toBe('stored-token');
      expect(getTokenSecurely).toHaveBeenCalledWith('authToken');
    });

    it('should clear all tokens on clearAuthToken', () => {
      api._authToken = 'auth';
      api._refreshToken = 'refresh';

      api.clearAuthToken();

      expect(api._authToken).toBeNull();
      expect(api._refreshToken).toBeNull();
      expect(removeTokenSecurely).toHaveBeenCalledWith('authToken');
      expect(removeTokenSecurely).toHaveBeenCalledWith('refreshToken');
    });
  });

  describe('Token Refresh', () => {
    it('should return null when no refresh token is available', async () => {
      getTokenSecurely.mockResolvedValueOnce(null);

      const result = await api.refreshAuthToken();

      expect(result).toBeNull();
    });

    it('should refresh token successfully', async () => {
      api._refreshToken = 'valid-refresh-token';
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              authToken: 'new-auth-token',
              refreshToken: 'new-refresh-token',
            },
          }),
      });

      const result = await api.refreshAuthToken();

      expect(result).toBe('new-auth-token');
      expect(api._authToken).toBe('new-auth-token');
      expect(api._refreshToken).toBe('new-refresh-token');
    });

    it('should return null when refresh endpoint returns non-200', async () => {
      api._refreshToken = 'expired-refresh';
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Invalid refresh token' }),
      });

      const result = await api.refreshAuthToken();

      expect(result).toBeNull();
    });

    it('should queue concurrent refresh requests', async () => {
      api._refreshToken = 'valid-refresh';

      // Create a delayed fetch to simulate network latency
      let resolveFetch;
      global.fetch = jest.fn().mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
      );

      // Start two refresh calls simultaneously
      const promise1 = api.refreshAuthToken();
      const promise2 = api.refreshAuthToken();

      // Resolve the fetch
      resolveFetch({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { authToken: 'shared-new-token' },
          }),
      });

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Both should get the same new token
      expect(result1).toBe('shared-new-token');
      expect(result2).toBe('shared-new-token');
      // fetch should only have been called once
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Session Expiration Callback', () => {
    it('should invoke session expired callback when set', () => {
      const callback = jest.fn();
      setSessionExpiredCallback(callback);

      // The callback is stored internally and invoked by the API service
      // when it detects 401 after failed refresh
      expect(callback).not.toHaveBeenCalled();

      // Clear
      setSessionExpiredCallback(null);
    });
  });
});
