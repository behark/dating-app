/**
 * Caching Service
 * High-level caching abstraction for common use cases
 */

const { cache, CACHE_KEYS, CACHE_TTL } = require('../config/redis');

/**
 * User Cache Service
 */
const UserCache = {
  /**
   * Get cached user profile
   */
  async getProfile(userId) {
    return cache.get(`${CACHE_KEYS.PROFILE}${userId}`);
  },

  /**
   * Cache user profile
   */
  async setProfile(userId, profile) {
    return cache.set(`${CACHE_KEYS.PROFILE}${userId}`, profile, CACHE_TTL.USER_PROFILE);
  },

  /**
   * Invalidate user profile cache
   */
  async invalidateProfile(userId) {
    return cache.del(`${CACHE_KEYS.PROFILE}${userId}`);
  },

  /**
   * Get cached user preferences
   */
  async getPreferences(userId) {
    return cache.get(`${CACHE_KEYS.PREFERENCES}${userId}`);
  },

  /**
   * Cache user preferences
   */
  async setPreferences(userId, preferences) {
    return cache.set(`${CACHE_KEYS.PREFERENCES}${userId}`, preferences, CACHE_TTL.USER_PREFERENCES);
  },

  /**
   * Get user with cache-through pattern
   */
  async getOrFetch(userId, fetchFn) {
    let user = await this.getProfile(userId);

    if (!user) {
      user = await fetchFn(userId);
      if (user) {
        await this.setProfile(userId, user);
      }
    }

    return user;
  },
};

/**
 * Discovery Cache Service
 */
const DiscoveryCache = {
  /**
   * Get cached discovery profiles
   */
  async getProfiles(userId, page = 1) {
    return cache.get(`${CACHE_KEYS.DISCOVERY}${userId}:${page}`);
  },

  /**
   * Cache discovery profiles
   */
  async setProfiles(userId, profiles, page = 1) {
    return cache.set(
      `${CACHE_KEYS.DISCOVERY}${userId}:${page}`,
      profiles,
      CACHE_TTL.DISCOVERY_PROFILES
    );
  },

  /**
   * Invalidate all discovery cache for user
   */
  async invalidate(userId) {
    return cache.delByPattern(`${CACHE_KEYS.DISCOVERY}${userId}:*`);
  },

  /**
   * Get excluded user IDs (already swiped)
   */
  async getExcludedIds(userId) {
    return cache.get(`${CACHE_KEYS.DISCOVERY}${userId}:excluded`);
  },

  /**
   * Set excluded user IDs
   */
  async setExcludedIds(userId, excludedIds) {
    return cache.set(
      `${CACHE_KEYS.DISCOVERY}${userId}:excluded`,
      excludedIds,
      CACHE_TTL.DISCOVERY_PROFILES * 10
    );
  },

  /**
   * Add to excluded IDs
   */
  async addExcludedId(userId, excludedId) {
    const excluded = (await this.getExcludedIds(userId)) || [];
    if (!excluded.includes(excludedId)) {
      excluded.push(excludedId);
      await this.setExcludedIds(userId, excluded);
    }
  },
};

/**
 * Match Cache Service
 */
const MatchCache = {
  /**
   * Get cached matches
   */
  async getMatches(userId) {
    return cache.get(`${CACHE_KEYS.MATCHES}${userId}`);
  },

  /**
   * Cache matches
   */
  async setMatches(userId, matches) {
    return cache.set(`${CACHE_KEYS.MATCHES}${userId}`, matches, CACHE_TTL.MATCHES);
  },

  /**
   * Invalidate matches cache
   */
  async invalidate(userId) {
    return cache.del(`${CACHE_KEYS.MATCHES}${userId}`);
  },

  /**
   * Get matches with cache-through
   */
  async getOrFetch(userId, fetchFn) {
    let matches = await this.getMatches(userId);

    if (!matches) {
      matches = await fetchFn(userId);
      if (matches) {
        await this.setMatches(userId, matches);
      }
    }

    return matches || [];
  },
};

/**
 * Conversation Cache Service
 */
const ConversationCache = {
  /**
   * Get cached conversation
   */
  async getConversation(matchId) {
    return cache.get(`${CACHE_KEYS.CONVERSATION}${matchId}`);
  },

  /**
   * Cache conversation messages
   */
  async setConversation(matchId, messages) {
    return cache.set(`${CACHE_KEYS.CONVERSATION}${matchId}`, messages, CACHE_TTL.CONVERSATIONS);
  },

  /**
   * Invalidate conversation cache
   */
  async invalidate(matchId) {
    return cache.del(`${CACHE_KEYS.CONVERSATION}${matchId}`);
  },

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId) {
    return cache.getCounter(`${CACHE_KEYS.CONVERSATION}unread:${userId}`);
  },

  /**
   * Set unread count
   */
  async setUnreadCount(userId, count) {
    const key = `${CACHE_KEYS.CONVERSATION}unread:${userId}`;
    return cache.set(key, count, CACHE_TTL.CONVERSATIONS);
  },
};

/**
 * Rate Limit Cache Service
 */
const RateLimitCache = {
  /**
   * Check and increment rate limit
   */
  async checkLimit(key, maxRequests, windowSeconds) {
    const fullKey = `${CACHE_KEYS.RATE_LIMIT}${key}`;
    const count = await cache.incr(fullKey, windowSeconds);

    return {
      allowed: count <= maxRequests,
      remaining: Math.max(0, maxRequests - count),
      count,
      limit: maxRequests,
    };
  },

  /**
   * Get swipe count for user
   */
  async getSwipeCount(userId) {
    return cache.getCounter(`${CACHE_KEYS.SWIPE_COUNT}${userId}`);
  },

  /**
   * Increment swipe count
   */
  async incrementSwipeCount(userId, dailyLimit = 100) {
    const key = `${CACHE_KEYS.SWIPE_COUNT}${userId}`;
    const count = await cache.incr(key, 86400); // 24 hours

    return {
      count,
      remaining: Math.max(0, dailyLimit - count),
      limitReached: count > dailyLimit,
    };
  },

  /**
   * Reset swipe count (e.g., for premium users)
   */
  async resetSwipeCount(userId) {
    return cache.del(`${CACHE_KEYS.SWIPE_COUNT}${userId}`);
  },
};

/**
 * Leaderboard Cache Service
 */
const LeaderboardCache = {
  /**
   * Update user score on leaderboard
   */
  async updateScore(leaderboardName, userId, score) {
    return cache.zadd(`${CACHE_KEYS.LEADERBOARD}${leaderboardName}`, score, userId);
  },

  /**
   * Get top users from leaderboard
   */
  async getTopUsers(leaderboardName, limit = 10) {
    const results = await cache.zrevrange(
      `${CACHE_KEYS.LEADERBOARD}${leaderboardName}`,
      0,
      limit - 1,
      true
    );

    // Parse results into array of { userId, score }
    const leaderboard = [];
    for (let i = 0; i < results.length; i += 2) {
      leaderboard.push({
        userId: results[i],
        score: parseInt(results[i + 1]),
        rank: i / 2 + 1,
      });
    }

    return leaderboard;
  },

  /**
   * Get user's rank
   */
  async getUserRank(leaderboardName, userId) {
    const client = await require('../config/redis').getRedis();
    if (!client) return null;

    const rank = await client.zrevrank(`${CACHE_KEYS.LEADERBOARD}${leaderboardName}`, userId);
    return rank !== null ? rank + 1 : null;
  },
};

/**
 * Session Cache Service
 */
const SessionCache = {
  /**
   * Set session data
   */
  async setSession(sessionId, data) {
    return cache.set(`${CACHE_KEYS.SESSION}${sessionId}`, data, CACHE_TTL.SESSION);
  },

  /**
   * Get session data
   */
  async getSession(sessionId) {
    return cache.get(`${CACHE_KEYS.SESSION}${sessionId}`);
  },

  /**
   * Delete session
   */
  async deleteSession(sessionId) {
    return cache.del(`${CACHE_KEYS.SESSION}${sessionId}`);
  },

  /**
   * Extend session TTL
   */
  async extendSession(sessionId) {
    return cache.expire(`${CACHE_KEYS.SESSION}${sessionId}`, CACHE_TTL.SESSION);
  },

  /**
   * Delete all sessions for user
   */
  async deleteUserSessions(userId) {
    return cache.delByPattern(`${CACHE_KEYS.SESSION}*:${userId}`);
  },
};

/**
 * Cache warming utility
 */
const warmCache = async (userId) => {
  const User = require('../models/User');
  const Swipe = require('../models/Swipe');

  try {
    // Warm user profile
    const user = await User.findById(userId).lean();
    if (user) {
      await UserCache.setProfile(userId, user);
    }

    // Warm matches
    const matches = await Swipe.find({
      $or: [
        { swiperId: userId, isMatch: true },
        { swipedId: userId, isMatch: true },
      ],
    })
      .populate('swiperId swipedId', 'name photos')
      .lean();

    if (matches.length > 0) {
      await MatchCache.setMatches(userId, matches);
    }

    console.log(`Cache warmed for user ${userId}`);
  } catch (error) {
    console.error('Cache warming error:', error);
  }
};

module.exports = {
  UserCache,
  DiscoveryCache,
  MatchCache,
  ConversationCache,
  RateLimitCache,
  LeaderboardCache,
  SessionCache,
  warmCache,
};
