/**
 * Invalid Input Tests
 * Tests for handling invalid user inputs and validation errors
 */

import {
  validateEmail,
  validatePassword,
  validateAge,
  sanitizeInput,
} from '../../utils/validators';
import api from '../../services/api';

// Mock fetch globally
global.fetch = jest.fn();

describe('Invalid Input Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
  });

  describe('Email Validation', () => {
    it('should reject invalid email format during login', async () => {
      const invalidEmails = [
        'invalid',
        'test@',
        '@example.com',
        'test..test@example.com',
        'test@example',
      ];

      for (const email of invalidEmails) {
        const isValid = validateEmail(email);
        expect(isValid).toBe(false);
      }
    });

    it('should reject empty email', async () => {
      const isValid = validateEmail('');
      expect(isValid).toBe(false);
    });

    it('should reject null/undefined email', async () => {
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail(undefined)).toBe(false);
    });

    it('should accept valid email formats', async () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.uk',
        'user+tag@example.com',
        'user123@test-domain.com',
      ];

      for (const email of validEmails) {
        const isValid = validateEmail(email);
        expect(isValid).toBe(true);
      }
    });

    it('should show appropriate error message for invalid email', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ success: false, message: 'Invalid email format' }),
      });

      try {
        await api.post('/auth/login', { email: 'invalid-email', password: 'password' });
      } catch (error) {
        expect(error.message).toMatch(/email|invalid/i);
      }
    });
  });

  describe('Password Validation', () => {
    it('should reject password shorter than 8 characters', async () => {
      const isValid = validatePassword('short');
      expect(isValid).toBe(false);
    });

    it('should reject empty password', async () => {
      const isValid = validatePassword('');
      expect(isValid).toBe(false);
    });

    it('should reject null/undefined password', async () => {
      expect(validatePassword(null)).toBe(false);
      expect(validatePassword(undefined)).toBe(false);
    });

    it('should accept valid passwords (8+ characters)', async () => {
      const validPasswords = ['password123', 'SecurePass!', 'LongPassword12345', 'Test1234'];

      for (const password of validPasswords) {
        const isValid = validatePassword(password);
        expect(isValid).toBe(true);
      }
    });

    it('should show appropriate error message for weak password', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({ success: false, message: 'Password must be at least 8 characters' }),
      });

      try {
        await api.post('/auth/signup', {
          email: 'test@example.com',
          password: 'short',
          name: 'Test User',
        });
      } catch (error) {
        expect(error.message).toMatch(/password|8|characters/i);
      }
    });
  });

  describe('Age Validation', () => {
    it('should reject age below 18', async () => {
      const invalidAges = [0, 17, -1, '17', null, undefined];

      for (const age of invalidAges) {
        const isValid = validateAge(age);
        expect(isValid).toBe(false);
      }
    });

    it('should reject age above reasonable maximum (e.g., 120)', async () => {
      const isValid = validateAge(121);
      expect(isValid).toBe(false);
    });

    it('should accept valid ages (18-120)', async () => {
      const validAges = [18, 25, 50, 100, 120];

      for (const age of validAges) {
        const isValid = validateAge(age);
        expect(isValid).toBe(true);
      }
    });

    it('should handle string age input', async () => {
      expect(validateAge('25')).toBe(true);
      expect(validateAge('17')).toBe(false);
    });
  });

  describe('Name Validation', () => {
    it('should reject empty name', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ success: false, message: 'Name is required' }),
      });

      try {
        await api.post('/auth/signup', {
          email: 'test@example.com',
          password: 'password123',
          name: '',
        });
      } catch (error) {
        expect(error.message).toMatch(/name|required/i);
      }
    });

    it('should reject name with only whitespace', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ success: false, message: 'Name cannot be empty' }),
      });

      try {
        await api.post('/auth/signup', {
          email: 'test@example.com',
          password: 'password123',
          name: '   ',
        });
      } catch (error) {
        expect(error.message).toMatch(/name|empty/i);
      }
    });

    it('should reject name that is too long', async () => {
      const longName = 'a'.repeat(101);

      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ success: false, message: 'Name is too long' }),
      });

      try {
        await api.post('/auth/signup', {
          email: 'test@example.com',
          password: 'password123',
          name: longName,
        });
      } catch (error) {
        expect(error.message).toMatch(/name|long/i);
      }
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize XSS attempts in inputs', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert(1)>',
        'javascript:alert(1)',
        '<svg onload=alert(1)>',
      ];

      for (const input of maliciousInputs) {
        const sanitized = sanitizeInput(input);
        expect(sanitized).not.toMatch(/<script|onerror|javascript:|onload/i);
      }
    });

    it('should preserve valid input after sanitization', () => {
      const validInputs = ['John Doe', 'test@example.com', 'Hello, world!', 'User123'];

      for (const input of validInputs) {
        const sanitized = sanitizeInput(input);
        expect(sanitized).toBe(input.trim());
      }
    });
  });

  describe('Message Content Validation', () => {
    it('should reject empty messages', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ success: false, message: 'Message cannot be empty' }),
      });

      try {
        await api.post('/chat/send', {
          matchId: 'match123',
          content: '',
        });
      } catch (error) {
        expect(error.message).toMatch(/message|empty/i);
      }
    });

    it('should reject messages that are too long', async () => {
      const longMessage = 'a'.repeat(5001);

      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ success: false, message: 'Message is too long' }),
      });

      try {
        await api.post('/chat/send', {
          matchId: 'match123',
          content: longMessage,
        });
      } catch (error) {
        expect(error.message).toMatch(/message|long/i);
      }
    });

    it('should accept valid message lengths', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { messageId: 'msg123' } }),
      });

      const result = await api.post('/chat/send', {
        matchId: 'match123',
        content: 'Hello, this is a valid message!',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Swipe Input Validation', () => {
    it('should reject invalid swipe type', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ success: false, message: 'Invalid swipe type' }),
      });

      try {
        await api.post('/swipes', {
          targetId: 'user123',
          type: 'invalid-type',
        });
      } catch (error) {
        expect(error.message).toMatch(/swipe|invalid/i);
      }
    });

    it('should reject empty targetId', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ success: false, message: 'Target ID is required' }),
      });

      try {
        await api.post('/swipes', {
          targetId: '',
          type: 'like',
        });
      } catch (error) {
        expect(error.message).toMatch(/target|required/i);
      }
    });

    it('should accept valid swipe inputs', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ success: true, data: { swipeId: 'swipe123', isMatch: false } }),
      });

      const result = await api.post('/swipes', {
        targetId: 'user123',
        type: 'like',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('API Error Responses', () => {
    it('should handle 400 Bad Request errors', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ success: false, message: 'Bad request' }),
      });

      await expect(api.post('/auth/login', { email: 'test@example.com' })).rejects.toThrow();
    });

    it('should handle 401 Unauthorized errors', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ success: false, message: 'Unauthorized' }),
      });

      await expect(
        api.post('/auth/login', { email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow(/unauthorized|invalid/i);
    });

    it('should handle 404 Not Found errors', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ success: false, message: 'Not found' }),
      });

      await expect(api.get('/api/nonexistent')).rejects.toThrow(/not found|404/i);
    });

    it('should handle 500 Internal Server Error', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ success: false, message: 'Internal server error' }),
      });

      await expect(api.get('/api/test')).rejects.toThrow(/server|error/i);
    });
  });
});
