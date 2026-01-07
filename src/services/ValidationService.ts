/**
 * ValidationService (TypeScript) - Validation utilities for forms and user input
 *
 * Note: For new code, prefer importing directly from '../utils/validators.ts'
 * which provides standalone functions that are easier to test and tree-shake.
 * This service is maintained for backward compatibility.
 */

/**
 * Profile validation result
 */
export interface ProfileValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Image file validation result
 */
export interface ImageFileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * User profile for validation
 */
export interface UserProfileForValidation {
  name?: string;
  age?: number | null;
  bio?: string | null;
  email?: string;
  [key: string]: unknown;
}

export class ValidationService {
  /**
   * Validate email address
   */
  static validateEmail(email: string | null | undefined): boolean {
    if (!email || typeof email !== 'string') return false;

    // More strict email regex that doesn't allow consecutive dots or dots at start/end of domain parts
    const emailRegex = /^[^\s@]+@[^\s@]+(\.[^\s@]+)+$/;
    const trimmed = email.trim();

    // Additional check: no consecutive dots, no dot immediately after @
    if (trimmed.includes('..') || trimmed.match(/@\./)) {
      return false;
    }

    return emailRegex.test(trimmed);
  }

  /**
   * Validate password
   */
  static validatePassword(password: string | null | undefined): boolean {
    if (!password || typeof password !== 'string') return false;
    return password.length >= 8;
  }

  /**
   * Validate age
   */
  static validateAge(age: number | null | undefined): boolean {
    if (typeof age !== 'number' || isNaN(age)) return false;
    return age >= 18 && age <= 100;
  }

  /**
   * Validate name
   */
  static validateName(name: string | null | undefined): boolean {
    if (!name || typeof name !== 'string') return false;
    const trimmed = name.trim();
    return trimmed.length >= 2 && trimmed.length <= 50;
  }

  /**
   * Validate bio
   */
  static validateBio(bio: string | null | undefined): boolean {
    if (bio === null || bio === undefined) return true; // Bio is optional
    if (typeof bio !== 'string') return false;
    return bio.length <= 500;
  }

  /**
   * Validate user profile
   */
  static validateUserProfile(profile: UserProfileForValidation): ProfileValidationResult {
    const errors: string[] = [];

    // Validate name
    if (!this.validateName(profile.name)) {
      if (!profile.name || profile.name.trim().length === 0) {
        errors.push('Name is required');
      } else if (profile.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
      } else {
        errors.push('Name must be less than 50 characters');
      }
    }

    // Validate age
    if (!this.validateAge(profile.age)) {
      if (profile.age === null || profile.age === undefined) {
        errors.push('Age is required');
      } else if (typeof profile.age !== 'number' || isNaN(profile.age)) {
        errors.push('Age must be a valid number');
      } else if (profile.age < 18) {
        errors.push('Age must be between 18 and 100');
      } else {
        errors.push('Age must be between 18 and 100');
      }
    }

    // Validate bio
    if (!this.validateBio(profile.bio)) {
      errors.push('Bio must be less than 500 characters');
    }

    // Validate email
    if (!this.validateEmail(profile.email)) {
      errors.push('Invalid email format');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitize input string
   */
  static sanitizeInput(input: unknown): unknown {
    if (typeof input !== 'string') return input;

    // Remove potentially harmful characters and patterns
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/\.\./g, '') // Remove path traversal sequences
      .replace(/\bon\w+\s*=/gi, '') // Remove event handlers (onclick=, onerror=, etc.)
      .trim();
  }

  /**
   * Validate image file
   */
  static validateImageFile(file: { type?: string; size?: number }): ImageFileValidationResult {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!file.type || !allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
      };
    }

    if (file.size && file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 10MB.' };
    }

    return { valid: true };
  }

  /**
   * Validate location coordinates
   */
  static validateLocation(latitude: number | null | undefined, longitude: number | null | undefined): boolean {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return false;
    }

    return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
  }

  /**
   * Validate distance in kilometers
   */
  static validateDistance(distanceKm: number | null | undefined): boolean {
    return typeof distanceKm === 'number' && distanceKm >= 1 && distanceKm <= 500;
  }
}
