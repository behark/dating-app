/**
 * API Cache Middleware
 * Redis-based caching for API responses
 */

const { cache, CACHE_TTL, CACHE_KEYS } = require('../config/redis');

/**
 * Cache key generator for different resource types
 */
const generateCacheKey = (type, params = {}) => {
  switch (type) {
    case 'discovery':
      return `${CACHE_KEYS.DISCOVERY}${params.userId}:${params.lat}:${params.lng}:${params.radius}:${params.page || 1}`;
    case 'profile':
      return `${CACHE_KEYS.PROFILE}${params.userId}`;
    case 'matches':
      return `${CACHE_KEYS.MATCHES}${params.userId}:${params.page || 1}`;
    case 'conversations':
      return `${CACHE_KEYS.CONVERSATION}${params.userId}`;
    case 'preferences':
      return `${CACHE_KEYS.PREFERENCES}${params.userId}`;
    case 'leaderboard':
      return `${CACHE_KEYS.LEADERBOARD}${params.type}:${params.page || 1}`;
    default:
      return `api:${type}:${JSON.stringify(params)}`;
  }
};

/**
 * API Response Cache Middleware
 * Caches GET responses with configurable TTL
 * @param {string} type - Cache type
 * @param {number|null} ttlOverride - Override TTL in seconds
 */
const apiCache = (type, ttlOverride = null) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const userId = req.user?.id || req.user?._id || 'anonymous';
      const cacheKey = generateCacheKey(type, {
        userId,
        ...req.query,
        ...req.params,
      });

      // Try to get cached response
      const cachedResponse = await cache.get(cacheKey);

      if (cachedResponse) {
        // Add cache headers
        if (!res.headersSent) {
          try {
            res.set({
              'X-Cache': 'HIT',
              'X-Cache-Key': cacheKey,
              'Cache-Control': 'private, max-age=60',
            });
          } catch (error) {
            // Headers already sent, ignore
          }
        }

        return res.json(cachedResponse);
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = async (data) => {
        // Check if headers already sent
        if (res.headersSent) {
          return originalJson(data);
        }

        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300 && data?.success !== false) {
          const ttl = ttlOverride || getTTLForType(type);
          // Cache asynchronously to avoid blocking response
          cache.set(cacheKey, data, ttl).catch((err) => {
            console.error('Cache set error:', err);
          });
        }

        // Add cache headers (only if headers not sent)
        if (!res.headersSent) {
          try {
            res.set({
              'X-Cache': 'MISS',
              'X-Cache-Key': cacheKey,
            });
          } catch (error) {
            // Headers already sent, ignore
          }
        }

        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next(); // Continue without caching on error
    }
  };
};

/**
 * Get TTL based on resource type
 */
const getTTLForType = (type) => {
  const ttlMap = {
    discovery: CACHE_TTL.DISCOVERY_PROFILES,
    profile: CACHE_TTL.USER_PROFILE,
    matches: CACHE_TTL.MATCHES,
    conversations: CACHE_TTL.CONVERSATIONS,
    preferences: CACHE_TTL.USER_PREFERENCES,
    leaderboard: CACHE_TTL.LEADERBOARD,
  };

  return ttlMap[type] || 300; // Default 5 minutes
};

/**
 * Invalidate cache for specific resources
 */
const invalidateCache = async (type, params = {}) => {
  try {
    const cacheKey = generateCacheKey(type, params);
    await cache.del(cacheKey);
    return true;
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return false;
  }
};

/**
 * Invalidate all cache for a user
 */
const invalidateUserCache = async (userId) => {
  try {
    const patterns = [
      `${CACHE_KEYS.USER}${userId}*`,
      `${CACHE_KEYS.PROFILE}${userId}*`,
      `${CACHE_KEYS.PREFERENCES}${userId}*`,
      `${CACHE_KEYS.DISCOVERY}${userId}*`,
      `${CACHE_KEYS.MATCHES}${userId}*`,
      `${CACHE_KEYS.CONVERSATION}${userId}*`,
    ];

    await Promise.all(patterns.map((pattern) => cache.delByPattern(pattern)));
    return true;
  } catch (error) {
    console.error('User cache invalidation error:', error);
    return false;
  }
};

/**
 * Conditional caching based on request parameters
 */
const conditionalCache = (condition, type, ttl = null) => {
  return async (req, res, next) => {
    if (typeof condition === 'function' && !condition(req)) {
      return next();
    }

    return apiCache(type, ttl)(req, res, next);
  };
};

/**
 * Cache warmer - preload frequently accessed data
 */
const warmCache = async (type, data, params = {}) => {
  try {
    const cacheKey = generateCacheKey(type, params);
    const ttl = getTTLForType(type);
    await cache.set(cacheKey, data, ttl);
    return true;
  } catch (error) {
    console.error('Cache warm error:', error);
    return false;
  }
};

/**
 * Stale-While-Revalidate pattern
 * Returns stale data while fetching fresh data in background
 */
const staleWhileRevalidate = (type, fetchFn, staleTime = 60) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const userId = req.user?.id || req.user?._id || 'anonymous';
      const params = { userId, ...req.query, ...req.params };
      const cacheKey = generateCacheKey(type, params);
      const metaKey = `${cacheKey}:meta`;

      const [cachedResponse, meta] = await Promise.all([cache.get(cacheKey), cache.get(metaKey)]);

      const now = Date.now();
      const isStale = meta && now - meta.timestamp > staleTime * 1000;

      // Return cached data immediately
      if (cachedResponse) {
        if (!res.headersSent) {
          try {
            res.set({
              'X-Cache': isStale ? 'STALE' : 'HIT',
              'X-Cache-Age': meta ? Math.round((now - meta.timestamp) / 1000) : 0,
            });
          } catch (error) {
            // Headers already sent, ignore
          }
        }

        // If stale, trigger background refresh
        if (isStale) {
          setImmediate(async () => {
            try {
              const freshData = await fetchFn(req);
              const ttl = getTTLForType(type);
              await Promise.all([
                cache.set(cacheKey, freshData, ttl),
                cache.set(metaKey, { timestamp: Date.now() }, ttl),
              ]);
            } catch (error) {
              console.error('Background refresh error:', error);
            }
          });
        }

        return res.json(cachedResponse);
      }

      // No cache, proceed normally
      const originalJson = res.json.bind(res);
      res.json = async (data) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const ttl = getTTLForType(type);
          // Cache asynchronously to avoid blocking response
          Promise.all([
            cache.set(cacheKey, data, ttl),
            cache.set(metaKey, { timestamp: Date.now() }, ttl),
          ]).catch((err) => console.error('Cache error:', err));
        }

        if (!res.headersSent) {
          try {
            res.set({ 'X-Cache': 'MISS' });
          } catch (error) {
            // Headers already sent, ignore
          }
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('SWR cache error:', error);
      next();
    }
  };
};

/**
 * ETag-based caching
 */
const etagCache = (type) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const userId = req.user?.id || req.user?._id || 'anonymous';
      const cacheKey = generateCacheKey(type, { userId, ...req.query, ...req.params });
      const etagKey = `${cacheKey}:etag`;

      const clientEtag = req.headers['if-none-match'];
      const serverEtag = await cache.get(etagKey);

      // Check if client has current version
      if (clientEtag && serverEtag && clientEtag === serverEtag) {
        return res.status(304).end();
      }

      // Generate new ETag
      const originalJson = res.json.bind(res);
      res.json = async (data) => {
        if (res.statusCode >= 200 && res.statusCode < 300 && !res.headersSent) {
          try {
            const crypto = require('crypto');
            const etag = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');

            res.set('ETag', etag);
            // Cache asynchronously to avoid blocking response
            cache.set(etagKey, etag, getTTLForType(type)).catch((err) => {
              console.error('Cache error:', err);
            });
          } catch (error) {
            // Headers already sent or error, continue with response
            console.error('ETag error:', error);
          }
        }

        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('ETag cache error:', error);
      next();
    }
  };
};

module.exports = {
  apiCache,
  generateCacheKey,
  invalidateCache,
  invalidateUserCache,
  conditionalCache,
  warmCache,
  staleWhileRevalidate,
  etagCache,
  getTTLForType,
};
