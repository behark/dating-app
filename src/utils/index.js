/**
 * Utility Functions Index
 * Re-exports all utility functions for convenient importing
 *
 * Usage:
 *   import { validateEmail, formatRelativeTime, calculateDistance } from '../utils';
 */

// Validation utilities
export {
  isEmpty,
  sanitizeInput,
  validateAge,
  validateBio,
  validateEmail,
  validateName,
  validatePassword,
} from './validators';

// Date and time formatters
export {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatTime,
  getDaysDifference,
  isToday,
} from './formatters';

// Distance calculations
export {
  calculateDistance,
  formatDistance,
  getDistanceCategory,
  getFormattedDistance,
} from './distanceCalculator';

// Error handling
export { showStandardError, handleApiError } from './errorHandler';
export { getUserFriendlyMessage, STANDARD_ERROR_MESSAGES } from './errorMessages';

// API utilities
export { handleApiResponse } from './apiResponseHandler';

// Logging
export { default as logger } from './logger';

// Haptics
export { default as HapticFeedback } from './haptics';

// Secure storage
export {
  storeTokenSecurely,
  getTokenSecurely,
  removeTokenSecurely,
  storeAuthToken,
  storeRefreshToken,
  getAuthToken,
  getRefreshToken,
  clearAllTokens,
} from './secureStorage';

// Sanitization
export { sanitizeInput as sanitizeFormInput, escapeHtml } from './sanitize';

// Rate limiting
export { default as rateLimiter } from './rateLimiter';

// User ID utilities
export { getUserId } from './userIdUtils';
