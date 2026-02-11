/**
 * Unit Tests for Error Messages
 */

import {
  getHttpErrorMessage,
  getUserFriendlyMessage,
  extractErrorMessage,
} from '../../utils/errorMessages';

// Constants to avoid duplicate strings
const UNEXPECTED_ERROR_TEXT = 'unexpected error';
const DEFAULT_ERROR_MESSAGE = 'An unexpected error occurred. Please try again.';

describe('Error Messages', () => {
  describe('getHttpErrorMessage', () => {
    it('should return user-friendly message for known status codes', () => {
      expect(getHttpErrorMessage(400)).toContain('check your input');
      expect(getHttpErrorMessage(401)).toContain('sign in');
      expect(getHttpErrorMessage(403)).toContain('permission');
      expect(getHttpErrorMessage(404)).toContain('found');
      expect(getHttpErrorMessage(500)).toContain('our end');
      expect(getHttpErrorMessage(503)).toContain('unavailable');
    });

    it('should return default message for unknown status codes', () => {
      const result = getHttpErrorMessage(999, 'Custom default');
      expect(result).toBe('Custom default');
    });

    it('should use default message when no custom default provided', () => {
      const result = getHttpErrorMessage(999);
      expect(result).toBe(DEFAULT_ERROR_MESSAGE);
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should map network errors', () => {
      expect(getUserFriendlyMessage('network error')).toContain('internet connection');
      expect(getUserFriendlyMessage('Network failed')).toContain('internet connection');
    });

    it('should map timeout errors', () => {
      expect(getUserFriendlyMessage('timeout')).toContain('timed out');
      expect(getUserFriendlyMessage('Request timeout')).toContain('timed out');
    });

    it('should map authentication errors', () => {
      expect(getUserFriendlyMessage('unauthorized')).toContain('sign in');
      expect(getUserFriendlyMessage('Unauthorized access')).toContain('sign in');
    });

    it('should extract HTTP status from error message', () => {
      const result = getUserFriendlyMessage('HTTP 401: Unauthorized');
      expect(result).toContain('sign in');
    });

    it('should clean up technical error messages', () => {
      const result = getUserFriendlyMessage('Error: Failed to connect');
      expect(result).toContain(UNEXPECTED_ERROR_TEXT);
      expect(result).not.toContain('Error:');
    });

    it('should handle empty/null errors', () => {
      expect(getUserFriendlyMessage(null)).toContain(UNEXPECTED_ERROR_TEXT);
      expect(getUserFriendlyMessage('')).toContain(UNEXPECTED_ERROR_TEXT);
      expect(getUserFriendlyMessage(undefined)).toContain(UNEXPECTED_ERROR_TEXT);
    });
  });

  describe('extractErrorMessage', () => {
    it('should extract message from string', () => {
      expect(extractErrorMessage('Simple error')).toBe('Simple error');
    });

    it('should extract message from Error object', () => {
      const error = new Error('Error message');
      expect(extractErrorMessage(error)).toBe('Error message');
    });

    it('should extract message from error object with error property', () => {
      const error = { error: 'Error text' };
      expect(extractErrorMessage(error)).toBe('Error text');
    });

    it('should extract message from nested data', () => {
      const error = { data: { message: 'Nested message' } };
      expect(extractErrorMessage(error)).toBe('Nested message');
    });

    it('should return default for invalid inputs', () => {
      expect(extractErrorMessage(null)).toBe(DEFAULT_ERROR_MESSAGE);
      expect(extractErrorMessage(undefined)).toBe(DEFAULT_ERROR_MESSAGE);
      expect(extractErrorMessage({})).toBe(DEFAULT_ERROR_MESSAGE);
    });
  });
});
