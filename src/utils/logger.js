/* eslint-disable sonarjs/cognitive-complexity */
/**
 * Logger Utility
 * Centralized logging service to replace console.log/error/warn
 * Supports different log levels and environment-based filtering
 * Integrates with Sentry for error tracking in production
 */

import { captureException, captureMessage } from './sentry';

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
};

class Logger {
  constructor() {
    // Determine log level based on environment
    this.logLevel = this.getLogLevel();
  }

  getLogLevel() {
    // In production, only show WARN and ERROR
    if (process.env.NODE_ENV === 'production') {
      return LOG_LEVELS.WARN;
    }
    // In development, show all logs
    // eslint-disable-next-line no-undef
    if (process.env.NODE_ENV === 'development' || (typeof __DEV__ !== 'undefined' && __DEV__)) {
      return LOG_LEVELS.DEBUG;
    }
    // Default to INFO level
    return LOG_LEVELS.INFO;
  }

  shouldLog(level) {
    return level >= this.logLevel;
  }

  debug(message, ...args) {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message, ...args) {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  warn(message, ...args) {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      console.warn(`[WARN] ${message}`, ...args);
      // Send warnings to Sentry in production for monitoring
      if (process.env.NODE_ENV === 'production') {
        try {
          captureMessage(message, 'warning', {
            context: args.length > 0 ? args : undefined,
          });
        } catch (sentryError) {
          // Don't let Sentry errors break logging
        }
      }
    }
  }

  error(message, error = null, ...args) {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      if (error) {
        console.error(`[ERROR] ${message}`, error, ...args);
        // CRITICAL FIX: Send errors to Sentry for monitoring
        try {
          const errorObj = error instanceof Error ? error : new Error(String(error));
          captureException(errorObj, {
            message,
            context: args.length > 0 ? args : undefined,
          });
        } catch (sentryError) {
          // Don't let Sentry errors break logging
          console.warn('Failed to send error to Sentry:', sentryError);
        }
      } else {
        console.error(`[ERROR] ${message}`, ...args);
        // Send error message to Sentry
        try {
          captureMessage(message, 'error', {
            context: args.length > 0 ? args : undefined,
          });
        } catch (sentryError) {
          console.warn('Failed to send error message to Sentry:', sentryError);
        }
      }
    }
  }

  // Log API errors with context
  apiError(endpoint, method, status, error) {
    this.error(`API ${method} ${endpoint} failed with status ${status}`, error);
  }

  // Log API requests (only in development)
  apiRequest(endpoint, method) {
    this.debug(`API ${method} ${endpoint}`);
  }
}

// Export singleton instance
const logger = new Logger();

export default logger;
export { Logger, LOG_LEVELS };
