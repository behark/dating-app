/**
 * Retry Utility with Circuit Breaker Pattern
 * Provides robust retry logic with exponential backoff and circuit breaker protection
 */

const { logger } = require('../../infrastructure/external/LoggingService');

// Circuit breaker states
const CIRCUIT_BREAKER_STATES = {
  CLOSED: 'CLOSED', // Normal operation
  OPEN: 'OPEN', // Failing - reject all requests
  HALF_OPEN: 'HALF_OPEN', // Testing if service recovered
};

/**
 * Circuit Breaker class
 * Prevents cascading failures by stopping requests to failing services
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5; // Failures before opening
    this.successThreshold = options.successThreshold || 2; // Successes before closing
    this.timeout = options.timeout || 30000; // Time before trying again (30s)

    this.state = CIRCUIT_BREAKER_STATES.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttempt = null;
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute(fn, context = 'default') {
    if (this.state === CIRCUIT_BREAKER_STATES.OPEN) {
      if (Date.now() >= this.nextAttempt) {
        this.state = CIRCUIT_BREAKER_STATES.HALF_OPEN;
        logger.info(`[CIRCUIT_BREAKER] Entering HALF_OPEN state for ${context}`);
      } else {
        throw new Error(
          `Circuit breaker is OPEN for ${context}. Retry after ${new Date(this.nextAttempt).toISOString()}`
        );
      }
    }

    try {
      const result = await fn();

      if (this.state === CIRCUIT_BREAKER_STATES.HALF_OPEN) {
        this.successCount++;
        if (this.successCount >= this.successThreshold) {
          this.close(context);
        }
      }

      return result;
    } catch (error) {
      this.recordFailure(context);
      throw error;
    }
  }

  /**
   * Record a failure and potentially open the circuit
   */
  recordFailure(context) {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CIRCUIT_BREAKER_STATES.HALF_OPEN) {
      this.open(context);
    } else if (this.failureCount >= this.failureThreshold) {
      this.open(context);
    }
  }

  /**
   * Open the circuit (start rejecting requests)
   */
  open(context) {
    this.state = CIRCUIT_BREAKER_STATES.OPEN;
    this.nextAttempt = Date.now() + this.timeout;
    this.successCount = 0;

    logger.warn(
      `[CIRCUIT_BREAKER] OPEN state for ${context}. Failure count: ${this.failureCount}. Will retry after ${new Date(this.nextAttempt).toISOString()}`
    );
  }

  /**
   * Close the circuit (恢复正常操作)
   */
  close(context) {
    this.state = CIRCUIT_BREAKER_STATES.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttempt = null;

    logger.info(`[CIRCUIT_BREAKER] CLOSED state for ${context}. Service recovered.`);
  }

  /**
   * Get current circuit breaker status
   */
  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttempt: this.nextAttempt ? new Date(this.nextAttempt).toISOString() : null,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
    };
  }
}

// Singleton circuit breakers for different services
const circuitBreakers = {};

/**
 * Get or create a circuit breaker for a specific service
 */
const getCircuitBreaker = (serviceName, options = {}) => {
  if (!circuitBreakers[serviceName]) {
    circuitBreakers[serviceName] = new CircuitBreaker(options);
  }
  return circuitBreakers[serviceName];
};

/**
 * Retry function with exponential backoff and circuit breaker
 */
const retryWithBackoff = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    jitter = true,
    circuitBreaker = null,
    context = 'default',
    onRetry = null,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // If circuit breaker is provided, use it
      if (circuitBreaker) {
        return await circuitBreaker.execute(fn, context);
      }

      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`[RETRY] All ${maxRetries + 1} attempts failed for ${context}:`, errorMessage);
        throw error;
      }

      // Calculate delay with exponential backoff
      let delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

      // Add jitter to prevent thundering herd
      if (jitter) {
        delay = delay * (0.5 + Math.random() * 0.5);
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(
        `[RETRY] Attempt ${attempt + 1}/${maxRetries + 1} failed for ${context}. Retrying in ${Math.round(delay)}ms:`,
        errorMessage
      );

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry({
          attempt: attempt + 1,
          maxRetries,
          error,
          delay,
          context,
        });
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

/**
 * Retry decorator for functions
 */
const retryable = (fn, options = {}) => {
  return async (...args) => {
    return retryWithBackoff(() => fn(...args), options);
  };
};

/**
 * Create a retryable fetch request
 */
const retryableFetch = async (url, options = {}) => {
  const { retries = 3, timeout = 10000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Retry on network errors or 5xx status codes
    if (!response.ok && response.status >= 500) {
      throw new Error(`Server error: ${response.status}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }

    return retryWithBackoff(() => retryableFetch(url, { ...options, retries: retries - 1 }), {
      maxRetries: retries,
      context: `fetch:${url}`,
    });
  }
};

/**
 * Get status of all circuit breakers
 */
const getAllCircuitBreakersStatus = () => {
  const status = {};
  for (const [name, breaker] of Object.entries(circuitBreakers)) {
    status[name] = breaker.getStatus();
  }
  return status;
};

/**
 * Reset all circuit breakers
 */
const resetAllCircuitBreakers = () => {
  for (const breaker of Object.values(circuitBreakers)) {
    breaker.failureCount = 0;
    breaker.successCount = 0;
    breaker.state = CIRCUIT_BREAKER_STATES.CLOSED;
  }
  logger.error('[CIRCUIT_BREAKER] All circuit breakers reset');
};

module.exports = {
  CircuitBreaker,
  getCircuitBreaker,
  retryWithBackoff,
  retryable,
  retryableFetch,
  getAllCircuitBreakersStatus,
  resetAllCircuitBreakers,
  CIRCUIT_BREAKER_STATES,
};
