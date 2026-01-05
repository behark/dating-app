/**
 * Unit Tests for API Helpers
 */

import { handleApiResponse, createAuthHeaders, authenticatedFetch } from '../../utils/apiHelpers';

// Mock fetch
global.fetch = jest.fn();

// Mock logger
jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: {
    apiError: jest.fn(),
    apiRequest: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock errorMessages
jest.mock('../../utils/errorMessages', () => ({
  getUserFriendlyMessage: jest.fn((msg) => `Friendly: ${msg}`),
  extractErrorMessage: jest.fn((error) => {
    if (typeof error === 'string') return error;
    return error?.message || 'Error';
  }),
}));

describe('API Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleApiResponse', () => {
    it('should handle successful response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().resolvedValue({ success: true, data: { user: { id: '123' } } }),
      };

      const result = await handleApiResponse(mockResponse);
      expect(result).toEqual({ user: { id: '123' } });
    });

    it('should handle failed response with error message', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        url: '/api/test',
        json: jest.fn().resolvedValue({ message: 'Authentication failed' }),
      };

      await expect(handleApiResponse(mockResponse)).rejects.toThrow();
    });

    it('should handle non-JSON error response', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        url: '/api/test',
        json: jest.fn().rejectedValue(new Error('Not JSON')),
      };

      await expect(handleApiResponse(mockResponse)).rejects.toThrow();
    });

    it('should validate response structure', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().resolvedValue({ success: false, message: 'Request failed' }),
      };

      await expect(handleApiResponse(mockResponse)).rejects.toThrow();
    });

    it('should return safe default for null data', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().resolvedValue({ success: true, data: null }),
      };

      const result = await handleApiResponse(mockResponse, { requireData: false });
      expect(result).toBeNull();
    });
  });

  describe('createAuthHeaders', () => {
    it('should create headers with auth token', () => {
      const token = 'test-token';
      const result = createAuthHeaders(token);

      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      });
    });

    it('should merge with existing headers', () => {
      const token = 'test-token';
      const result = createAuthHeaders(token, {
        headers: { 'Custom-Header': 'value' },
      });

      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'Custom-Header': 'value',
      });
    });
  });

  describe('authenticatedFetch', () => {
    it('should make authenticated request', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().resolvedValue({ success: true, data: { result: 'success' } }),
      };

      global.fetch.mockResolvedValue(mockResponse);

      const result = await authenticatedFetch('/api/test', 'token');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token',
          }),
        })
      );

      expect(result).toEqual({ result: 'success' });
    });
  });
});
