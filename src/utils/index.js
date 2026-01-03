/**
 * Utility Functions Index
 * Re-exports all utility functions for convenient importing
 * 
 * Usage:
 *   import { validateEmail, formatRelativeTime, calculateDistance } from '../utils';
 */

// Validation utilities
export {
    isEmpty, sanitizeInput, validateAge, validateBio, validateEmail, validateName, validatePassword
} from './validators';

// Date and time formatters
export {
    formatDate,
    formatDateTime, formatRelativeTime, formatTime, getDaysDifference, isToday
} from './formatters';

// Distance calculations
export {
    calculateDistance,
    formatDistance,
    getDistanceCategory,
    getFormattedDistance
} from './distanceCalculator';

// Performance utilities are exported from performanceUtils.js directly
// due to their React-specific nature (hooks, components)
