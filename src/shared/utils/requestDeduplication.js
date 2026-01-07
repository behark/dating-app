/**
 * Request Deduplication Utility
 * Prevents duplicate API calls from rapid clicks or multiple components
 */

class RequestDeduplicator {
  constructor() {
    // Track pending requests by key
    this.pendingRequests = new Map();
  }

  /**
   * Generate a unique key for a request
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request data (optional)
   * @returns {string} Unique request key
   */
  generateKey(method, endpoint, data = null) {
    const dataStr = data ? JSON.stringify(data) : '';
    return `${method}:${endpoint}:${dataStr}`;
  }

  /**
   * Execute a request with deduplication
   * If a request with the same key is already pending, return the existing promise
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {Function} requestFn - Function that makes the API request
   * @param {object} data - Request data (optional, for key generation)
   * @returns {Promise} Request promise
   */
  async deduplicate(method, endpoint, requestFn, data = null) {
    const key = this.generateKey(method, endpoint, data);

    // If request is already pending, return the existing promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Create new request promise
    const requestPromise = requestFn()
      .then((result) => {
        // Remove from pending after success
        this.pendingRequests.delete(key);
        return result;
      })
      .catch((error) => {
        // Remove from pending after error
        this.pendingRequests.delete(key);
        throw error;
      });

    // Store pending request
    this.pendingRequests.set(key, requestPromise);

    return requestPromise;
  }

  /**
   * Clear a specific pending request
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request data (optional)
   */
  clear(method, endpoint, data = null) {
    const key = this.generateKey(method, endpoint, data);
    this.pendingRequests.delete(key);
  }

  /**
   * Clear all pending requests
   */
  clearAll() {
    this.pendingRequests.clear();
  }

  /**
   * Get count of pending requests
   * @returns {number} Number of pending requests
   */
  getPendingCount() {
    return this.pendingRequests.size;
  }
}

// Export singleton instance
export default new RequestDeduplicator();
