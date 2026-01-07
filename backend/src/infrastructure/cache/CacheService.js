/**
 * Cache Service
 *
 * Simple in-memory caching service using node-cache
 * Provides cache-aside pattern implementation
 *
 * Features:
 * - TTL (Time To Live) support
 * - Pattern-based invalidation
 * - Statistics tracking
 * - Cache-aside pattern helper
 */

const NodeCache = require('node-cache');
const { logger } = require('../external/LoggingService');

class CacheService {
  constructor() {
    // Initialize cache with default settings
    this.cache = new NodeCache({
      stdTTL: 300, // Default TTL: 5 minutes
      checkperiod: 60, // Check for expired keys every 60 seconds
      useClones: false, // Don't clone objects (better performance)
      deleteOnExpire: true,
    });

    // Track cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };

    // Log cache events
    this.cache.on('expired', (key, value) => {
      logger.debug('Cache key expired', { key });
    });

    this.cache.on('del', (key, value) => {
      logger.debug('Cache key deleted', { key });
      this.stats.deletes++;
    });

    logger.info('CacheService initialized', {
      stdTTL: 300,
      checkperiod: 60,
    });
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {any|undefined} Cached value or undefined
   */
  get(key) {
    const value = this.cache.get(key);

    if (value !== undefined) {
      this.stats.hits++;
      logger.debug('Cache hit', { key });
    } else {
      this.stats.misses++;
      logger.debug('Cache miss', { key });
    }

    return value;
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} [ttl] - TTL in seconds (optional, uses default if not provided)
   * @returns {boolean} Success status
   */
  set(key, value, ttl = undefined) {
    const success = this.cache.set(key, value, ttl);

    if (success) {
      this.stats.sets++;
      logger.debug('Cache set', { key, ttl: ttl || 'default' });
    } else {
      logger.warn('Cache set failed', { key });
    }

    return success;
  }

  /**
   * Delete a specific key from cache
   * @param {string} key - Cache key to delete
   * @returns {number} Number of deleted entries
   */
  del(key) {
    const count = this.cache.del(key);
    logger.debug('Cache delete', { key, count });
    return count;
  }

  /**
   * Delete multiple keys from cache
   * @param {string[]} keys - Array of cache keys to delete
   * @returns {number} Number of deleted entries
   */
  delMultiple(keys) {
    const count = this.cache.del(keys);
    logger.debug('Cache delete multiple', { count, keys: keys.length });
    return count;
  }

  /**
   * Invalidate cache keys matching a pattern
   * @param {string} pattern - Pattern to match (supports wildcards)
   * @returns {number} Number of deleted entries
   */
  invalidate(pattern) {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter((key) => {
      // Convert pattern to regex
      // Example: "user:*" becomes /^user:.*$/
      const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(key);
    });

    if (matchingKeys.length > 0) {
      const count = this.cache.del(matchingKeys);
      logger.info('Cache invalidated', { pattern, count });
      return count;
    }

    return 0;
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {boolean} True if key exists
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Get TTL for a key
   * @param {string} key - Cache key
   * @returns {number|undefined} TTL in seconds or undefined
   */
  getTtl(key) {
    return this.cache.getTtl(key);
  }

  /**
   * Flush all cache entries
   */
  flush() {
    this.cache.flushAll();
    logger.info('Cache flushed');
  }

  /**
   * Get all cache keys
   * @returns {string[]} Array of cache keys
   */
  keys() {
    return this.cache.keys();
  }

  /**
   * Get cache statistics
   * @returns {object} Cache statistics
   */
  getStats() {
    const nodeStats = this.cache.getStats();
    return {
      ...this.stats,
      keys: nodeStats.keys,
      ksize: nodeStats.ksize,
      vsize: nodeStats.vsize,
      hitRate:
        this.stats.hits > 0
          ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2) + '%'
          : '0%',
    };
  }

  /**
   * Cache-aside pattern helper
   *
   * Tries to get value from cache first, if not found,
   * executes the fetchFunction and stores result in cache
   *
   * @param {string} key - Cache key
   * @param {Function} fetchFunction - Async function to fetch data if not in cache
   * @param {number} [ttl] - TTL in seconds (optional)
   * @returns {Promise<any>} Cached or fetched value
   *
   * @example
   * const user = await cache.getOrSet(
   *   `user:${userId}`,
   *   async () => await User.findById(userId),
   *   300 // 5 minutes
   * );
   */
  async getOrSet(key, fetchFunction, ttl = undefined) {
    // Try to get from cache
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // Cache miss - fetch the data
    logger.debug('Cache miss, fetching data', { key });
    const value = await fetchFunction();

    // Don't cache null or undefined
    if (value !== null && value !== undefined) {
      this.set(key, value, ttl);
    }

    return value;
  }

  /**
   * Warm up cache with predefined data
   * Useful for frequently accessed data on server start
   *
   * @param {Object} data - Object with key-value pairs to cache
   * @param {number} [ttl] - TTL in seconds (optional)
   */
  warmUp(data, ttl = undefined) {
    const keys = Object.keys(data);
    keys.forEach((key) => {
      this.set(key, data[key], ttl);
    });
    logger.info('Cache warmed up', { keys: keys.length });
  }

  /**
   * Create a namespaced cache helper
   * Useful for grouping related cache keys
   *
   * @param {string} namespace - Namespace prefix for keys
   * @returns {object} Namespaced cache methods
   *
   * @example
   * const userCache = cache.namespace('user');
   * await userCache.getOrSet(userId, fetchUser);
   * userCache.invalidate(); // Clears all user:* keys
   */
  namespace(namespace) {
    return {
      get: (key) => this.get(`${namespace}:${key}`),
      set: (key, value, ttl) => this.set(`${namespace}:${key}`, value, ttl),
      del: (key) => this.del(`${namespace}:${key}`),
      has: (key) => this.has(`${namespace}:${key}`),
      invalidate: () => this.invalidate(`${namespace}:*`),
      getOrSet: (key, fetchFunction, ttl) =>
        this.getOrSet(`${namespace}:${key}`, fetchFunction, ttl),
    };
  }
}

// Export singleton instance
module.exports = new CacheService();
