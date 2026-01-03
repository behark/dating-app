import { ValidationService } from '../ValidationService';

describe('ValidationService', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(ValidationService.validateEmail('test@example.com')).toBe(true);
      expect(ValidationService.validateEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(ValidationService.validateEmail('invalid')).toBe(false);
      expect(ValidationService.validateEmail('test@')).toBe(false);
      expect(ValidationService.validateEmail('@example.com')).toBe(false);
      expect(ValidationService.validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate passwords with minimum length', () => {
      expect(ValidationService.validatePassword('password123')).toBe(true);
      expect(ValidationService.validatePassword('123456')).toBe(true);
    });

    it('should reject passwords that are too short', () => {
      expect(ValidationService.validatePassword('12345')).toBe(false);
      expect(ValidationService.validatePassword('')).toBe(false);
      expect(ValidationService.validatePassword(null)).toBe(false);
    });
  });

  describe('validateAge', () => {
    it('should validate ages within acceptable range', () => {
      expect(ValidationService.validateAge(25)).toBe(true);
      expect(ValidationService.validateAge(18)).toBe(true);
      expect(ValidationService.validateAge(65)).toBe(true);
    });

    it('should reject ages outside acceptable range', () => {
      expect(ValidationService.validateAge(17)).toBe(false);
      expect(ValidationService.validateAge(101)).toBe(false);
      expect(ValidationService.validateAge(-5)).toBe(false);
      expect(ValidationService.validateAge('25')).toBe(false);
    });
  });

  describe('validateName', () => {
    it('should validate proper names', () => {
      expect(ValidationService.validateName('John Doe')).toBe(true);
      expect(ValidationService.validateName('Jane')).toBe(true);
      expect(ValidationService.validateName('José María')).toBe(true);
    });

    it('should reject invalid names', () => {
      expect(ValidationService.validateName('')).toBe(false);
      expect(ValidationService.validateName('A')).toBe(false);
      expect(ValidationService.validateName('   ')).toBe(false);
      expect(ValidationService.validateName(null)).toBe(false);
    });
  });

  describe('validateBio', () => {
    it('should validate bios within length limits', () => {
      expect(ValidationService.validateBio('This is a short bio')).toBe(true);
      expect(ValidationService.validateBio('')).toBe(true); // Empty bio is allowed
    });

    it('should reject bios that are too long', () => {
      const longBio = 'A'.repeat(501);
      expect(ValidationService.validateBio(longBio)).toBe(false);
    });
  });

  describe('validateUserProfile', () => {
    it('should validate complete user profiles', () => {
      const validProfile = {
        name: 'John Doe',
        age: 25,
        bio: 'Hello, I am John!',
        email: 'john@example.com',
      };

      const result = ValidationService.validateUserProfile(validProfile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should identify validation errors in user profiles', () => {
      const invalidProfile = {
        name: 'A', // Too short
        age: 15, // Too young
        bio: 'A'.repeat(600), // Too long
        email: 'invalid-email', // Invalid email
      };

      const result = ValidationService.validateUserProfile(invalidProfile);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('Name must be at least 2 characters long');
      expect(result.errors).toContain('Age must be between 18 and 100');
      expect(result.errors).toContain('Bio must be less than 500 characters');
      expect(result.errors).toContain('Invalid email format');
    });
  });
});