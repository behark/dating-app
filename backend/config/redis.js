/**
 * Redis Configuration
 * Caching layer for improved performance
 */

const Redis = require('ioredis');

let redisClient = null;
let isConnected = false;

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB) || 0,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  lazyConnect: true,
  // Connection pool settings
  family: 4,
  connectTimeout: 10000,
  keepAlive: 30000,
};

// Cache TTL settings (in seconds)
const CACHE_TTL = {
  USER_PROFILE: 300,        // 5 minutes
  USER_PREFERENCES: 600,    // 10 minutes
  DISCOVERY_PROFILES: 60,   // 1 minute
  MATCHES: 120,             // 2 minutes
  CONVERSATIONS: 180,       // 3 minutes
  SESSION: 86400,           // 24 hours
  RATE_LIMIT: 60,           // 1 minute
  ONLINE_STATUS: 30,        // 30 seconds
  LEADERBOARD: 300,         // 5 minutes
};

// Cache key prefixes
const CACHE_KEYS = {
  USER: 'user:',
  PROFILE: 'profile:',
  PREFERENCES: 'prefs:',
  DISCOVERY: 'discovery:',
  MATCHES: 'matches:',
  CONVERSATION: 'conv:',
  SESSION: 'session:',
  RATE_LIMIT: 'ratelimit:',
  ONLINE: 'online:',
  TYPING: 'typing:',
  LEADERBOARD: 'leaderboard:',
  SWIPE_COUNT: 'swipecount:',
};

/**
 * Initialize Redis connection
 */
const initRedis = async () => {
  if (redisClient && isConnected) {
    return redisClient;
  }

  // Check if Redis URL is provided (for cloud services like Upstash, Railway)
  const redisUrl = process.env.REDIS_URL;
  
  try {
    if (redisUrl) {
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        enableReadyCheck: true,
        tls: redisUrl.startsWith('rediss://') ? {} : undefined,
      });
    } else {
      redisClient = new Redis(redisConfig);
    }

    // Event handlers
    redisClient.on('connect', () => {
      console.log('Redis connecting...');
    });

    redisClient.on('ready', () => {
      console.log('Redis connected and ready');
      isConnected = true;
    });

    redisClient.on('error', (error) => {
      console.error('Redis error:', error.message);
      isConnected = false;
    });

    redisClient.on('close', () => {
      console.log('Redis connection closed');
      isConnected = false;
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis reconnecting...');
    });

    // Connect
    await redisClient.connect();
    
    return redisClient;
  } catch (error) {
    console.error('Failed to initialize Redis:', error.message);
    isConnected = false;
    return null;
  }
};

/**
 * Get Redis client (lazy initialization)
 */
const getRedis = async () => {
  if (!redisClient || !isConnected) {
    await initRedis();
  }
  return redisClient;
};

/**
 * Cache wrapper with automatic JSON serialization
 */
const cache = {
  /**
   * Get cached value
   */
  async get(key) {
    try {
      const client = await getRedis();
      if (!client) return null;
      
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error.message);
      return null;
    }
  },

  /**
   * Set cached value with TTL
   */
  async set(key, value, ttl = 300) {
    try {
      const client = await getRedis();
      if (!client) return false;
      
      await client.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error.message);
      return false;
    }
  },

  /**
   * Delete cached value
   */
  async del(key) {
    try {
      const client = await getRedis();
      if (!client) return false;
      
      await client.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error.message);
      return false;
    }
  },

  /**
   * Delete multiple keys by pattern
   */
  async delByPattern(pattern) {
    try {
      const client = await getRedis();
      if (!client) return false;
      
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Cache delete pattern error:', error.message);
      return false;
    }
  },

  /**
   * Check if key exists
   */
  async exists(key) {
    try {
      const client = await getRedis();
      if (!client) return false;
      
      return await client.exists(key);
    } catch (error) {
      console.error('Cache exists error:', error.message);
      return false;
    }
  },

  /**
   * Increment a counter
   */
  async incr(key, ttl = 3600) {
    try {
      const client = await getRedis();
      if (!client) return null;
      
      const value = await client.incr(key);
      if (value === 1) {
        await client.expire(key, ttl);
      }
      return value;
    } catch (error) {
      console.error('Cache incr error:', error.message);
      return null;
    }
  },

  /**
   * Get counter value
   */
  async getCounter(key) {
    try {
      const client = await getRedis();
      if (!client) return 0;
      
      const value = await client.get(key);
      return parseInt(value) || 0;
    } catch (error) {
      console.error('Cache getCounter error:', error.message);
      return 0;
    }
  },

  /**
   * Add to sorted set (for leaderboards)
   */
  async zadd(key, score, member) {
    try {
      const client = await getRedis();
      if (!client) return false;
      
      await client.zadd(key, score, member);
      return true;
    } catch (error) {
      console.error('Cache zadd error:', error.message);
      return false;
    }
  },

  /**
   * Get top N from sorted set
   */
  async zrevrange(key, start = 0, stop = 9, withScores = false) {
    try {
      const client = await getRedis();
      if (!client) return [];
      
      if (withScores) {
        return await client.zrevrange(key, start, stop, 'WITHSCORES');
      }
      return await client.zrevrange(key, start, stop);
    } catch (error) {
      console.error('Cache zrevrange error:', error.message);
      return [];
    }
  },

  /**
   * Set hash field
   */
  async hset(key, field, value) {
    try {
      const client = await getRedis();
      if (!client) return false;
      
      await client.hset(key, field, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache hset error:', error.message);
      return false;
    }
  },

  /**
   * Get hash field
   */
  async hget(key, field) {
    try {
      const client = await getRedis();
      if (!client) return null;
      
      const data = await client.hget(key, field);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache hget error:', error.message);
      return null;
    }
  },

  /**
   * Get all hash fields
   */
  async hgetall(key) {
    try {
      const client = await getRedis();
      if (!client) return null;
      
      const data = await client.hgetall(key);
      if (!data) return null;
      
      // Parse JSON values
      const result = {};
      for (const [field, value] of Object.entries(data)) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value;
        }
      }
      return result;
    } catch (error) {
      console.error('Cache hgetall error:', error.message);
      return null;
    }
  },

  /**
   * Set expire on key
   */
  async expire(key, seconds) {
    try {
      const client = await getRedis();
      if (!client) return false;
      
      await client.expire(key, seconds);
      return true;
    } catch (error) {
      console.error('Cache expire error:', error.message);
      return false;
    }
  },
};

/**
 * Online status management
 */
const onlineStatus = {
  async setOnline(userId) {
    await cache.set(`${CACHE_KEYS.ONLINE}${userId}`, { online: true, lastSeen: new Date() }, CACHE_TTL.ONLINE_STATUS);
  },

  async setOffline(userId) {
    await cache.set(`${CACHE_KEYS.ONLINE}${userId}`, { online: false, lastSeen: new Date() }, CACHE_TTL.SESSION);
  },

  async isOnline(userId) {
    const status = await cache.get(`${CACHE_KEYS.ONLINE}${userId}`);
    return status?.online || false;
  },

  async getLastSeen(userId) {
    const status = await cache.get(`${CACHE_KEYS.ONLINE}${userId}`);
    return status?.lastSeen || null;
  },

  async getBulkOnlineStatus(userIds) {
    const result = {};
    for (const userId of userIds) {
      result[userId] = await this.isOnline(userId);
    }
    return result;
  },
};

/**
 * Rate limiting
 */
const rateLimiter = {
  async checkLimit(key, maxRequests, windowSeconds) {
    const fullKey = `${CACHE_KEYS.RATE_LIMIT}${key}`;
    const count = await cache.incr(fullKey, windowSeconds);
    
    return {
      allowed: count <= maxRequests,
      remaining: Math.max(0, maxRequests - count),
      resetIn: windowSeconds,
    };
  },
};

/**
 * Graceful shutdown
 */
const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    console.log('Redis connection closed');
  }
};

module.exports = {
  initRedis,
  getRedis,
  cache,
  onlineStatus,
  rateLimiter,
  closeRedis,
  CACHE_TTL,
  CACHE_KEYS,
};
