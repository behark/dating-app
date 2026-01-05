/**
 * Sentry Error Tracking Setup
 * Initialize Sentry for React Native/Expo
 */

let Sentry = null;

// Try to import Sentry (may not be available in all environments)
try {
  if (typeof require !== 'undefined') {
    Sentry = require('@sentry/react-native');
  }
} catch (error) {
  // Sentry not available - will use fallback logging
  console.warn('Sentry not available:', error.message);
}

/**
 * Initialize Sentry error tracking
 * @param {Object} options - Configuration options
 * @param {string} options.dsn - Sentry DSN
 * @param {string} options.environment - Environment (development, staging, production)
 * @param {string} options.release - App release version
 * @param {Object} options.user - User information
 */
export const initSentry = (options = {}) => {
  if (!Sentry) {
    console.warn('Sentry not available - error tracking disabled');
    return false;
  }

  const { dsn, environment = 'development', release, user } = options;

  if (!dsn) {
    console.warn('Sentry DSN not provided - error tracking disabled');
    return false;
  }

  try {
    Sentry.init({
      dsn,
      environment,
      release,
      enableAutoSessionTracking: true,
      // Capture 100% of transactions for performance monitoring
      tracesSampleRate: 1.0,
      // Capture unhandled promise rejections
      enableCaptureFailedRequests: true,
      // Attach stack traces to messages
      attachStacktrace: true,
      // Send default PII (personally identifiable information) - adjust based on privacy requirements
      sendDefaultPii: false,
      // Integrations
      integrations: [
        // Automatically instrument React Native
        Sentry.reactNativeTracing(),
      ],
      // Before send hook - filter sensitive data
      beforeSend(event, hint) {
        // Remove sensitive data from error events
        if (event.request) {
          // Remove passwords from request data
          if (event.request.data) {
            if (typeof event.request.data === 'string') {
              try {
                const data = JSON.parse(event.request.data);
                if (data.password) {
                  data.password = '[REDACTED]';
                }
                if (data.newPassword) {
                  data.newPassword = '[REDACTED]';
                }
                event.request.data = JSON.stringify(data);
              } catch (e) {
                // Not JSON, skip
              }
            }
          }
        }
        return event;
      },
    });

    // Set user context if provided
    if (user) {
      Sentry.setUser({
        id: user.id || user._id || user.uid,
        email: user.email,
        username: user.name || user.username,
        // Don't send sensitive data
      });
    }

    console.log('✅ Sentry initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
    return false;
  }
};

/**
 * Capture an exception
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
export const captureException = (error, context = {}) => {
  if (!Sentry) {
    console.error('Sentry not available - error not tracked:', error, context);
    return;
  }

  try {
    Sentry.captureException(error, {
      extra: context,
      tags: {
        platform: 'react-native',
      },
    });
  } catch (e) {
    console.error('Failed to capture exception in Sentry:', e);
  }
};

/**
 * Capture a message
 * @param {string} message - Message to capture
 * @param {string} level - Severity level (info, warning, error, fatal)
 * @param {Object} context - Additional context
 */
export const captureMessage = (message, level = 'info', context = {}) => {
  if (!Sentry) {
    console.log(`[${level.toUpperCase()}] ${message}`, context);
    return;
  }

  try {
    Sentry.captureMessage(message, {
      level,
      extra: context,
      tags: {
        platform: 'react-native',
      },
    });
  } catch (e) {
    console.error('Failed to capture message in Sentry:', e);
  }
};

/**
 * Set user context for error tracking
 * @param {Object} user - User information
 */
export const setUser = (user) => {
  if (!Sentry) return;

  try {
    Sentry.setUser({
      id: user.id || user._id || user.uid,
      email: user.email,
      username: user.name || user.username,
    });
  } catch (e) {
    console.error('Failed to set user in Sentry:', e);
  }
};

/**
 * Clear user context (on logout)
 */
export const clearUser = () => {
  if (!Sentry) return;

  try {
    Sentry.setUser(null);
  } catch (e) {
    console.error('Failed to clear user in Sentry:', e);
  }
};

/**
 * Add breadcrumb for debugging
 * @param {Object} breadcrumb - Breadcrumb data
 */
export const addBreadcrumb = (breadcrumb) => {
  if (!Sentry) return;

  try {
    Sentry.addBreadcrumb(breadcrumb);
  } catch (e) {
    console.error('Failed to add breadcrumb in Sentry:', e);
  }
};

export default {
  initSentry,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
};
