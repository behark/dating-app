/**
 * Date and Time Formatting Utilities
 * Consolidated date formatters to eliminate duplication across screens
 */

/**
 * Time constants in milliseconds
 */
const MS_PER_MINUTE = 60000;
const MS_PER_HOUR = 3600000;
const MS_PER_DAY = 86400000;

/**
 * Format a date as relative time (e.g., "5m ago", "2h ago", "3d ago")
 * @param {string|Date} dateInput - Date to format
 * @returns {string} Formatted relative time string
 */
export const formatRelativeTime = (dateInput) => {
  if (!dateInput) return '';
  
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / MS_PER_MINUTE);
  const diffHours = Math.floor(diffMs / MS_PER_HOUR);
  const diffDays = Math.floor(diffMs / MS_PER_DAY);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
};

/**
 * Format a date for display (locale-aware)
 * @param {string|Date} dateInput - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateInput, options = {}) => {
  if (!dateInput) return '';
  
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  
  return date.toLocaleDateString(undefined, defaultOptions);
};

/**
 * Format a date and time for display (locale-aware)
 * @param {string|Date} dateInput - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted datetime string
 */
export const formatDateTime = (dateInput, options = {}) => {
  if (!dateInput) return '';
  
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };
  
  return date.toLocaleString(undefined, defaultOptions);
};

/**
 * Format time only (locale-aware)
 * @param {string|Date} dateInput - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted time string
 */
export const formatTime = (dateInput, options = {}) => {
  if (!dateInput) return '';
  
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };
  
  return date.toLocaleTimeString(undefined, defaultOptions);
};

/**
 * Check if a date is today
 * @param {string|Date} dateInput - Date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (dateInput) => {
  if (!dateInput) return false;
  
  const date = new Date(dateInput);
  const today = new Date();
  
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Get the difference between two dates in days
 * @param {string|Date} date1 - First date
 * @param {string|Date} date2 - Second date (defaults to now)
 * @returns {number} Difference in days
 */
export const getDaysDifference = (date1, date2 = new Date()) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.floor(diffTime / MS_PER_DAY);
};

export default {
  formatRelativeTime,
  formatDate,
  formatDateTime,
  formatTime,
  isToday,
  getDaysDifference,
};
