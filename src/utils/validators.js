/**
 * Validation Utility Functions
 * Consolidated validators to eliminate duplication across screens and services
 */

/**
 * Email validation regex
 * @type {RegExp}
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email is valid
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @param {number} options.minLength - Minimum password length (default: 8)
 * @returns {boolean} True if password meets requirements
 */
export const validatePassword = (password, options = {}) => {
  const { minLength = 8 } = options;
  if (!password || typeof password !== 'string') return false;
  return password.length >= minLength;
};

/**
 * Validate age is within acceptable range
 * @param {number} age - Age to validate
 * @param {Object} options - Validation options
 * @param {number} options.minAge - Minimum age (default: 18)
 * @param {number} options.maxAge - Maximum age (default: 100)
 * @returns {boolean} True if age is valid
 */
export const validateAge = (age, options = {}) => {
  const { minAge = 18, maxAge = 120 } = options;
  const parsedAge =
    typeof age === 'string' && age.trim().length > 0
      ? Number(age)
      : typeof age === 'number'
        ? age
        : NaN;

  if (!Number.isInteger(parsedAge)) return false;
  return parsedAge >= minAge && parsedAge <= maxAge;
};

/**
 * Validate name format and length
 * @param {string} name - Name to validate
 * @param {Object} options - Validation options
 * @param {number} options.minLength - Minimum name length (default: 2)
 * @param {number} options.maxLength - Maximum name length (default: 50)
 * @returns {boolean} True if name is valid
 */
export const validateName = (name, options = {}) => {
  const { minLength = 2, maxLength = 50 } = options;
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength;
};

/**
 * Validate bio/description text
 * @param {string} bio - Bio text to validate
 * @param {Object} options - Validation options
 * @param {number} options.maxLength - Maximum bio length (default: 500)
 * @returns {boolean} True if bio is valid
 */
export const validateBio = (bio, options = {}) => {
  const { maxLength = 500 } = options;
  if (bio === null || bio === undefined) return true; // Bio is optional
  if (typeof bio !== 'string') return false;
  return bio.length <= maxLength;
};

/**
 * Validate latitude
 * @param {number} lat - Latitude to validate
 * @returns {boolean} True if latitude is valid
 */
export const validateLatitude = (lat) => {
  if (typeof lat !== 'number' || isNaN(lat)) return false;
  return lat >= -90 && lat <= 90;
};

/**
 * Validate longitude
 * @param {number} lng - Longitude to validate
 * @returns {boolean} True if longitude is valid
 */
export const validateLongitude = (lng) => {
  if (typeof lng !== 'number' || isNaN(lng)) return false;
  return lng >= -180 && lng <= 180;
};

/**
 * Validate coordinates (lat, lng)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if coordinates are valid
 */
export const validateCoordinates = (lat, lng) => {
  return validateLatitude(lat) && validateLongitude(lng);
};

/**
 * Validate user ID format
 * @param {string} userId - User ID to validate
 * @returns {boolean} True if user ID is valid
 */
export const validateUserId = (userId) => {
  if (!userId || typeof userId !== 'string') return false;
  const normalizedUserId = userId.trim();
  // MongoDB ObjectId format, UUID format, or Firebase/custom alphanumeric IDs
  return (
    /^[a-f\d]{24}$/i.test(normalizedUserId) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalizedUserId) ||
    /^[A-Za-z0-9_-]{6,128}$/.test(normalizedUserId)
  );
};

/**
 * Validate number is within range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} True if value is in range
 */
export const validateNumberRange = (value, min, max) => {
  if (typeof value !== 'number' || isNaN(value)) return false;
  return value >= min && value <= max;
};

/**
 * Validate string is not empty
 * @param {string} value - String to validate
 * @returns {boolean} True if string is not empty
 */
export const validateNotEmpty = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

/**
 * Validate array is not empty
 * @param {Array} array - Array to validate
 * @returns {boolean} True if array is not empty
 */
export const validateArrayNotEmpty = (array) => {
  return Array.isArray(array) && array.length > 0;
};

/**
 * Sanitize user input by removing potentially harmful characters
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/[<>]/g, '').trim();
};

/**
 * Check if a string is empty or whitespace only
 * @param {string} value - Value to check
 * @returns {boolean} True if value is empty or whitespace
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  return false;
};

/**
 * Validate API response structure
 * @param {Object} data - Response data to validate
 * @param {Object} options - Validation options
 * @param {boolean} options.requireSuccess - Require success property (default: true)
 * @param {boolean} options.requireData - Require data property (default: false)
 * @returns {Object} { valid: boolean, error?: string }
 */
export const validateApiResponse = (data, options = {}) => {
  const { requireSuccess = true, requireData = false } = options;

  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid response format' };
  }

  if (requireSuccess && data.success === false) {
    return { valid: false, error: data.message || 'Request failed' };
  }

  if (requireData && data.data === undefined) {
    return { valid: false, error: 'Response data is missing' };
  }

  return { valid: true };
};

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
