/**
 * Standardized Error Handler
 * Provides consistent error handling and user feedback across the app
 */

import { Alert } from 'react-native';
import { getUserFriendlyMessage, STANDARD_ERROR_MESSAGES } from './errorMessages';
import logger from './logger';

/**
 * Show standardized error alert with consistent messaging
 * @param {Error|string} error - Error object or message
 * @param {string} context - Context for the error (e.g., 'login', 'signup', 'profile')
 * @param {string} customTitle - Custom alert title (default: 'Error')
 */
export const showStandardError = (error, context = '', customTitle = 'Error') => {
  const message = getUserFriendlyMessage(error, context);
  Alert.alert(customTitle, message, [{ text: 'OK', style: 'cancel' }]);
  
  // Log error for debugging (but don't expose to user)
  logger.error(`Error in ${context || 'unknown context'}:`, error);
};

/**
 * Show success alert
 * @param {string} message - Success message
 * @param {string} title - Alert title (default: 'Success')
 */
export const showSuccess = (message, title = 'Success') => {
  Alert.alert(title, message, [{ text: 'OK', style: 'default' }]);
};

/**
 * Show confirmation alert
 * @param {string} message - Confirmation message
 * @param {string} title - Alert title
 * @param {Function} onConfirm - Callback when confirmed
 * @param {Function} onCancel - Optional callback when cancelled
 */
export const showConfirmation = (message, title, onConfirm, onCancel) => {
  Alert.alert(
    title,
    message,
    [
      { text: 'Cancel', style: 'cancel', onPress: onCancel },
      { text: 'Confirm', style: 'default', onPress: onConfirm },
    ],
    { cancelable: true }
  );
};

/**
 * Handle API errors consistently
 * @param {Error} error - Error object
 * @param {string} context - Context for the error
 * @param {Function} onError - Optional callback for custom error handling
 */
export const handleApiError = (error, context = '', onError = null) => {
  if (onError) {
    onError(error);
    return;
  }

  showStandardError(error, context);
};

export default {
  showStandardError,
  showSuccess,
  showConfirmation,
  handleApiError,
  STANDARD_ERROR_MESSAGES,
};
