/**
 * Unit Tests for Validators
 */

import {
  validateEmail,
  validatePassword,
  validateAge,
  validateName,
  validateLatitude,
  validateLongitude,
  validateCoordinates,
  validateUserId,
  validateNumberRange,
  validateNotEmpty,
  validateArrayNotEmpty,
  validateApiResponse,
} from '../../utils/validators';

describe('Validators', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('')).toBe(false);
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail(undefined)).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate passwords with minimum length', () => {
      expect(validatePassword('password123')).toBe(true);
      expect(validatePassword('12345678')).toBe(true);
      expect(validatePassword('short')).toBe(false);
      expect(validatePassword('12345')).toBe(false);
    });

    it('should accept custom minLength', () => {
      expect(validatePassword('123456', { minLength: 6 })).toBe(true);
      expect(validatePassword('12345', { minLength: 6 })).toBe(false);
    });

    it('should reject invalid inputs', () => {
      const invalidInputs = ['', null, undefined];
      invalidInputs.forEach((input) => {
        expect(validatePassword(input)).toBe(false);
      });
    });
  });

  describe('validateAge', () => {
    it('should validate age within range', () => {
      expect(validateAge(18)).toBe(true);
      expect(validateAge(25)).toBe(true);
      expect(validateAge(100)).toBe(true);
      expect(validateAge(17)).toBe(false);
      expect(validateAge(101)).toBe(false);
    });

    it('should accept custom age range', () => {
      expect(validateAge(21, { minAge: 21, maxAge: 65 })).toBe(true);
      expect(validateAge(20, { minAge: 21, maxAge: 65 })).toBe(false);
    });

    it('should reject invalid inputs', () => {
      expect(validateAge(NaN)).toBe(false);
      expect(validateAge('25')).toBe(false);
      expect(validateAge(null)).toBe(false);
    });
  });

  describe('validateName', () => {
    it('should validate name length', () => {
      expect(validateName('John')).toBe(true);
      expect(validateName('A')).toBe(false);
      expect(validateName('A'.repeat(51))).toBe(false);
    });

    it('should accept custom length range', () => {
      expect(validateName('AB', { minLength: 2, maxLength: 10 })).toBe(true);
      expect(validateName('A', { minLength: 2, maxLength: 10 })).toBe(false);
    });

    it('should reject invalid inputs', () => {
      expect(validateName('')).toBe(false);
      expect(validateName(null)).toBe(false);
      expect(validateName(undefined)).toBe(false);
    });
  });

  describe('validateLatitude', () => {
    it('should validate latitude range', () => {
      expect(validateLatitude(0)).toBe(true);
      expect(validateLatitude(90)).toBe(true);
      expect(validateLatitude(-90)).toBe(true);
      expect(validateLatitude(91)).toBe(false);
      expect(validateLatitude(-91)).toBe(false);
    });

    it('should reject invalid inputs', () => {
      expect(validateLatitude(NaN)).toBe(false);
      expect(validateLatitude('45')).toBe(false);
      expect(validateLatitude(null)).toBe(false);
    });
  });

  describe('validateLongitude', () => {
    it('should validate longitude range', () => {
      expect(validateLongitude(0)).toBe(true);
      expect(validateLongitude(180)).toBe(true);
      expect(validateLongitude(-180)).toBe(true);
      expect(validateLongitude(181)).toBe(false);
      expect(validateLongitude(-181)).toBe(false);
    });
  });

  describe('validateCoordinates', () => {
    it('should validate coordinate pairs', () => {
      expect(validateCoordinates(37.7749, -122.4194)).toBe(true);
      expect(validateCoordinates(0, 0)).toBe(true);
      expect(validateCoordinates(91, 0)).toBe(false);
      expect(validateCoordinates(0, 181)).toBe(false);
    });
  });

  describe('validateUserId', () => {
    it('should validate MongoDB ObjectId format', () => {
      expect(validateUserId('507f1f77bcf86cd799439011')).toBe(true);
      expect(validateUserId('507f191e810c19729de860ea')).toBe(true);
    });

    it('should validate UUID format', () => {
      expect(validateUserId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(validateUserId('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    });

    it('should reject invalid user IDs', () => {
      expect(validateUserId('invalid')).toBe(false);
      expect(validateUserId('123')).toBe(false);
      expect(validateUserId('')).toBe(false);
      expect(validateUserId(null)).toBe(false);
    });
  });

  describe('validateNumberRange', () => {
    it('should validate numbers within range', () => {
      expect(validateNumberRange(5, 1, 10)).toBe(true);
      expect(validateNumberRange(1, 1, 10)).toBe(true);
      expect(validateNumberRange(10, 1, 10)).toBe(true);
      expect(validateNumberRange(0, 1, 10)).toBe(false);
      expect(validateNumberRange(11, 1, 10)).toBe(false);
    });

    it('should reject invalid inputs', () => {
      expect(validateNumberRange(NaN, 1, 10)).toBe(false);
      expect(validateNumberRange('5', 1, 10)).toBe(false);
      expect(validateNumberRange(null, 1, 10)).toBe(false);
    });
  });

  describe('validateNotEmpty', () => {
    it('should validate non-empty strings', () => {
      expect(validateNotEmpty('text')).toBe(true);
      expect(validateNotEmpty(' ')).toBe(false);
      expect(validateNotEmpty('')).toBe(false);
    });

    it('should reject null/undefined', () => {
      expect(validateNotEmpty(null)).toBe(false);
      expect(validateNotEmpty(undefined)).toBe(false);
    });
  });

  describe('validateArrayNotEmpty', () => {
    it('should validate non-empty arrays', () => {
      expect(validateArrayNotEmpty([1, 2, 3])).toBe(true);
      expect(validateArrayNotEmpty(['a'])).toBe(true);
      expect(validateArrayNotEmpty([])).toBe(false);
    });

    it('should reject non-arrays', () => {
      expect(validateArrayNotEmpty({})).toBe(false);
      expect(validateArrayNotEmpty('string')).toBe(false);
      expect(validateArrayNotEmpty(null)).toBe(false);
    });
  });

  describe('validateApiResponse', () => {
    it('should validate successful API response', () => {
      const response = { success: true, data: { user: {} } };
      const result = validateApiResponse(response);
      expect(result.valid).toBe(true);
    });

    it('should reject failed API response', () => {
      const response = { success: false, message: 'Error' };
      const result = validateApiResponse(response);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Error');
    });

    it('should validate response with required data', () => {
      const response = { success: true, data: { users: [] } };
      const result = validateApiResponse(response, { requireData: true });
      expect(result.valid).toBe(true);
    });

    it('should reject response without required data', () => {
      const response = { success: true };
      const result = validateApiResponse(response, { requireData: true });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Response data is missing');
    });

    it('should reject invalid response format', () => {
      expect(validateApiResponse(null).valid).toBe(false);
      expect(validateApiResponse(undefined).valid).toBe(false);
      expect(validateApiResponse('string').valid).toBe(false);
    });
  });
});
