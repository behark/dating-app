/**
 * Client-Side Rate Limiter
 * Prevents rapid API calls and accidental double-clicks
 */

class RateLimiter {
  constructor() {
    // Track request timestamps by endpoint
    this.requestHistory = new Map();
    // Track debounce timers
    this.debounceTimers = new Map();
  }

  /**
   * Check if a request can be made based on rate limits
   * @param {string} key - Unique key for the rate limit (e.g., endpoint + userId)
   * @param {number} maxRequests - Maximum requests allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {boolean} True if request is allowed
   */
  canMakeRequest(key, maxRequests = 10, windowMs = 1000) {
    const now = Date.now();
    const history = this.requestHistory.get(key) || [];

    // Remove old entries outside the window
    const recentHistory = history.filter((timestamp) => now - timestamp < windowMs);

    if (recentHistory.length >= maxRequests) {
      return false;
    }

    // Add current request timestamp
    recentHistory.push(now);
    this.requestHistory.set(key, recentHistory);

    return true;
  }

  /**
   * Get time until next request is allowed
   * @param {string} key - Unique key for the rate limit
   * @param {number} windowMs - Time window in milliseconds
   * @returns {number} Milliseconds until next request allowed (0 if allowed now)
   */
  getTimeUntilNextRequest(key, windowMs = 1000) {
    const history = this.requestHistory.get(key) || [];
    if (history.length === 0) return 0;

    const oldestRequest = history[0];
    const timeSinceOldest = Date.now() - oldestRequest;
    const timeRemaining = windowMs - timeSinceOldest;

    return Math.max(0, timeRemaining);
  }

  /**
   * Debounce a function call
   * @param {string} key - Unique key for debouncing
   * @param {Function} fn - Function to debounce
   * @param {number} delayMs - Delay in milliseconds
   * @returns {Promise} Result of the function call
   */
  debounce(key, fn, delayMs = 300) {
    return new Promise((resolve, reject) => {
      // Clear existing timer
      const existingTimer = this.debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer
      const timer = setTimeout(async () => {
        this.debounceTimers.delete(key);
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delayMs);

      this.debounceTimers.set(key, timer);
    });
  }

  /**
   * Clear rate limit history for a key
   * @param {string} key - Key to clear
   */
  clear(key) {
    this.requestHistory.delete(key);
    const timer = this.debounceTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(key);
    }
  }

  /**
   * Clear all rate limit history
   */
  clearAll() {
    this.requestHistory.clear();
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}

// Export singleton instance
export default new RateLimiter();
