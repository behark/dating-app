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
 * @param {number} options.minLength - Minimum password length (default: 6)
 * @returns {boolean} True if password meets requirements
 */
export const validatePassword = (password, options = {}) => {
  const { minLength = 6 } = options;
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
  const { minAge = 18, maxAge = 100 } = options;
  if (typeof age !== 'number' || isNaN(age)) return false;
  return age >= minAge && age <= maxAge;
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

export default {
  validateEmail,
  validatePassword,
  validateAge,
  validateName,
  validateBio,
  sanitizeInput,
  isEmpty,
};
