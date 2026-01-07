/**
 * Validation Utility Functions (TypeScript)
 * Consolidated validators to eliminate duplication across screens and services
 */

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validation options for password
 */
export interface PasswordValidationOptions {
  minLength?: number;
}

/**
 * Validation options for age
 */
export interface AgeValidationOptions {
  minAge?: number;
  maxAge?: number;
}

/**
 * Validation options for name
 */
export interface NameValidationOptions {
  minLength?: number;
  maxLength?: number;
}

/**
 * Validation options for bio
 */
export interface BioValidationOptions {
  maxLength?: number;
}

/**
 * Validation result for API responses
 */
export interface ApiResponseValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate email format
 */
export const validateEmail = (email: string | null | undefined): boolean => {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string | null | undefined, options: PasswordValidationOptions = {}): boolean => {
  const { minLength = 8 } = options;
  if (!password || typeof password !== 'string') return false;
  return password.length >= minLength;
};

/**
 * Validate age is within acceptable range
 */
export const validateAge = (age: number | null | undefined, options: AgeValidationOptions = {}): boolean => {
  const { minAge = 18, maxAge = 100 } = options;
  if (typeof age !== 'number' || isNaN(age)) return false;
  return age >= minAge && age <= maxAge;
};

/**
 * Validate name format and length
 */
export const validateName = (name: string | null | undefined, options: NameValidationOptions = {}): boolean => {
  const { minLength = 2, maxLength = 50 } = options;
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength;
};

/**
 * Validate bio/description text
 */
export const validateBio = (bio: string | null | undefined, options: BioValidationOptions = {}): boolean => {
  const { maxLength = 500 } = options;
  if (bio === null || bio === undefined) return true; // Bio is optional
  if (typeof bio !== 'string') return false;
  return bio.length <= maxLength;
};

/**
 * Validate latitude
 */
export const validateLatitude = (lat: number | null | undefined): boolean => {
  if (typeof lat !== 'number' || isNaN(lat)) return false;
  return lat >= -90 && lat <= 90;
};

/**
 * Validate longitude
 */
export const validateLongitude = (lng: number | null | undefined): boolean => {
  if (typeof lng !== 'number' || isNaN(lng)) return false;
  return lng >= -180 && lng <= 180;
};

/**
 * Validate coordinates (lat, lng)
 */
export const validateCoordinates = (lat: number | null | undefined, lng: number | null | undefined): boolean => {
  return validateLatitude(lat) && validateLongitude(lng);
};

/**
 * Validate user ID format
 */
export const validateUserId = (userId: string | null | undefined): boolean => {
  if (!userId || typeof userId !== 'string') return false;
  // MongoDB ObjectId format or UUID format
  return (
    /^[a-f\d]{24}$/i.test(userId) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
  );
};

/**
 * Validate number is within range
 */
export const validateNumberRange = (value: number | null | undefined, min: number, max: number): boolean => {
  if (typeof value !== 'number' || isNaN(value)) return false;
  return value >= min && value <= max;
};

/**
 * Validate string is not empty
 */
export const validateNotEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

/**
 * Validate array is not empty
 */
export const validateArrayNotEmpty = (array: unknown): boolean => {
  return Array.isArray(array) && array.length > 0;
};

/**
 * Sanitize user input by removing potentially harmful characters
 */
export const sanitizeInput = (input: unknown): string => {
  if (typeof input !== 'string') return String(input);
  return input.replace(/[<>]/g, '').trim();
};

/**
 * Check if a string is empty or whitespace only
 */
export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  return false;
};

/**
 * Validation options for API response
 */
export interface ApiResponseValidationOptions {
  requireSuccess?: boolean;
  requireData?: boolean;
}

/**
 * Validate API response structure
 */
export const validateApiResponse = (
  data: unknown,
  options: ApiResponseValidationOptions = {}
): ApiResponseValidationResult => {
  const { requireSuccess = true, requireData = false } = options;

  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid response format' };
  }

  const response = data as { success?: boolean; message?: string; data?: unknown };

  if (requireSuccess && response.success === false) {
    return { valid: false, error: response.message || 'Request failed' };
  }

  if (requireData && response.data === undefined) {
    return { valid: false, error: 'Response data is missing' };
  }

  return { valid: true };
};

// Default export for backward compatibility
export default {
  validateEmail,
  validatePassword,
  validateAge,
  validateName,
  validateBio,
  validateLatitude,
  validateLongitude,
  validateCoordinates,
  validateUserId,
  validateNumberRange,
  validateNotEmpty,
  validateArrayNotEmpty,
  sanitizeInput,
  isEmpty,
  validateApiResponse,
};
