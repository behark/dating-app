/**
 * Centralized Error Notification Utility
 * Provides consistent error handling and user feedback across the app
 */

import { Alert, Platform } from 'react-native';
import { getUserFriendlyMessage } from './errorMessages';
import logger from './logger';

/**
 * Show an error alert to the user
 * @param {Error|string} error - The error object or error message
 * @param {string} title - Optional custom title (default: 'Error')
 * @param {Object} options - Additional options
 * @param {Function} options.onDismiss - Callback when alert is dismissed
 * @param {boolean} options.logError - Whether to log the error (default: true)
 */
export const showErrorAlert = (error, title = 'Error', options = {}) => {
  const { onDismiss, logError = true } = options;
  
  if (logError) {
    logger.error(`Error alert shown: ${title}`, error);
  }

  const message = getUserFriendlyMessage(
    typeof error === 'string' ? error : error?.message || error
  );

  Alert.alert(
    title,
    message,
    [
      {
        text: 'OK',
        onPress: onDismiss,
      },
    ],
    { cancelable: true }
  );
};

/**
 * Show a success alert to the user
 * @param {string} message - Success message
 * @param {string} title - Optional custom title (default: 'Success')
 * @param {Function} onDismiss - Callback when alert is dismissed
 */
export const showSuccessAlert = (message, title = 'Success', onDismiss) => {
  Alert.alert(
    title,
    message,
    [
      {
        text: 'OK',
        onPress: onDismiss,
      },
    ],
    { cancelable: true }
  );
};

/**
 * Show a warning alert to the user
 * @param {string} message - Warning message
 * @param {string} title - Optional custom title (default: 'Warning')
 * @param {Function} onDismiss - Callback when alert is dismissed
 */
export const showWarningAlert = (message, title = 'Warning', onDismiss) => {
  Alert.alert(
    title,
    message,
    [
      {
        text: 'OK',
        onPress: onDismiss,
      },
    ],
    { cancelable: true }
  );
};

/**
 * Show a confirmation alert
 * @param {string} message - Confirmation message
 * @param {string} title - Optional custom title (default: 'Confirm')
 * @param {Function} onConfirm - Callback when user confirms
 * @param {Function} onCancel - Callback when user cancels
 * @param {string} confirmText - Text for confirm button (default: 'OK')
 * @param {string} cancelText - Text for cancel button (default: 'Cancel')
 */
export const showConfirmationAlert = (
  message,
  title = 'Confirm',
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancel'
) => {
  Alert.alert(
    title,
    message,
    [
      {
        text: cancelText,
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: confirmText,
        onPress: onConfirm,
        style: 'default',
      },
    ],
    { cancelable: true }
  );
};

/**
 * Handle API errors with consistent user feedback
 * @param {Error} error - The error object
 * @param {Object} options - Options
 * @param {string} options.context - Context where error occurred (e.g., 'loading conversations')
 * @param {boolean} options.showAlert - Whether to show alert (default: true)
 * @param {boolean} options.logError - Whether to log error (default: true)
 * @param {Function} options.onError - Custom error handler
 * @returns {string} - User-friendly error message
 */
export const handleApiError = (error, options = {}) => {
  const {
    context = '',
    showAlert = true,
    logError = true,
    onError,
  } = options;

  const errorMessage = getUserFriendlyMessage(
    typeof error === 'string' ? error : error?.message || error
  );

  if (logError) {
    logger.error(`API Error${context ? ` in ${context}` : ''}:`, error);
  }

  if (onError) {
    onError(errorMessage);
  } else if (showAlert) {
    showErrorAlert(error, 'Error');
  }

  return errorMessage;
};

/**
 * Wrap an async function with error handling
 * @param {Function} asyncFn - The async function to wrap
 * @param {Object} options - Error handling options
 * @returns {Function} - Wrapped function
 */
export const withErrorHandling = (asyncFn, options = {}) => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      handleApiError(error, options);
      throw error; // Re-throw so caller can handle if needed
    }
  };
};

export default {
  showErrorAlert,
  showSuccessAlert,
  showWarningAlert,
  showConfirmationAlert,
  handleApiError,
  withErrorHandling,
};
