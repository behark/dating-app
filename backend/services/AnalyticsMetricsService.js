/**
 * Analytics Metrics Service
 * Comprehensive tracking for key business and technical metrics
 *
 * Metrics Tracked:
 * - Daily Active Users (DAU)
 * - Match rate
 * - Message response rate
 * - Swipe-to-match conversion
 * - Premium conversion rate
 * - Retention (D1, D7, D30)
 * - App crash rate
 * - API response times
 * - Photo upload success rate
 *
 * TD-002: Redis caching implemented for improved performance
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Swipe = require('../models/Swipe');
const Message = require('../models/Message');
const UserActivity = require('../models/UserActivity');
const Subscription = require('../models/Subscription');
const { datadogService } = require('./MonitoringService');
const { cache, CACHE_TTL } = require('../config/redis');

// Cache key prefix for analytics metrics
const METRICS_CACHE_PREFIX = 'analytics:';

// Cache TTL for different metric types (in seconds)
const METRICS_CACHE_TTL = {
  DAU: 300, // 5 minutes - frequently accessed
  WAU: 600, // 10 minutes
  MAU: 900, // 15 minutes
  MATCH_RATE: 300, // 5 minutes
  RETENTION: 1800, // 30 minutes - expensive query
  PREMIUM: 600, // 10 minutes
  MESSAGES: 300, // 5 minutes
  DASHBOARD: 300, // 5 minutes
};

class AnalyticsMetricsService {
  constructor() {
    // In-memory cache as fallback when Redis is unavailable
    this.metricsCache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes cache
    this.useRedis = true; // Toggle Redis caching
  }

  /**
   * Get from Redis cache with fallback to in-memory
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} Cached value or null
   */
  async getFromCache(key) {
    if (this.useRedis) {
      try {
        const redisValue = await cache.get(`${METRICS_CACHE_PREFIX}${key}`);
        if (redisValue) {
          return redisValue;
        }
      } catch (error) {
        console.warn('Redis cache get error, falling back to memory:', error.message);
      }
    }

    // Fallback to in-memory cache
    if (this.isCacheValid(key)) {
      return this.metricsCache.get(key).value;
    }
    return null;
  }

  /**
   * Set to Redis cache with fallback to in-memory
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - TTL in seconds
   */
  async setToCache(key, value, ttl = 300) {
    // Always set in-memory as fallback
    this.setCache(key, value);

    if (this.useRedis) {
      try {
        await cache.set(`${METRICS_CACHE_PREFIX}${key}`, value, ttl);
      } catch (error) {
        console.warn('Redis cache set error:', error.message);
      }
    }
  }

  /**
   * Invalidate cache key in both Redis and memory
   * @param {string} key - Cache key to invalidate
   */
  async invalidateCache(key) {
    this.metricsCache.delete(key);

    if (this.useRedis) {
      try {
        await cache.del(`${METRICS_CACHE_PREFIX}${key}`);
      } catch (error) {
        console.warn('Redis cache delete error:', error.message);
      }
    }
  }

  /**
   * Invalidate all metrics cache by pattern
   * @param {string} pattern - Pattern to match (e.g., 'dau_*')
   */
  async invalidateCachePattern(pattern) {
    // Clear matching in-memory keys
    for (const key of this.metricsCache.keys()) {
      if (key.includes(pattern.replace('*', ''))) {
        this.metricsCache.delete(key);
      }
    }

    if (this.useRedis) {
      try {
        await cache.delByPattern(`${METRICS_CACHE_PREFIX}${pattern}`);
      } catch (error) {
        console.warn('Redis cache pattern delete error:', error.message);
      }
    }
  }

  // =============================================
  // User Engagement Metrics
  // =============================================

  /**
   * Get Daily Active Users (DAU)
   * Users who performed any activity in the last 24 hours
   * TD-002: Now uses Redis caching for improved performance
   */
  async getDailyActiveUsers(date = new Date()) {
    const cacheKey = `dau_${date.toDateString()}`;

    // Check Redis cache first
    const cachedResult = await this.getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dau = await UserActivity.distinct('userId', {
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    const result = {
      count: dau.length,
      date: date.toISOString().split('T')[0],
      userIds: dau,
    };

    // Cache in Redis
    await this.setToCache(cacheKey, result, METRICS_CACHE_TTL.DAU);

    // Send to Datadog
    datadogService.gauge('users.daily_active', result.count, [`date:${result.date}`]);

    return result;
  }

  /**
   * Get Weekly Active Users (WAU)
   * TD-002: Now uses Redis caching
   */
  async getWeeklyActiveUsers(date = new Date()) {
    const endDate = new Date(date);
    const startDate = new Date(date);
    startDate.setDate(startDate.getDate() - 7);

    const cacheKey = `wau_${startDate.toDateString()}_${endDate.toDateString()}`;

    // Check Redis cache first
    const cachedResult = await this.getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const wau = await UserActivity.distinct('userId', {
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const result = {
      count: wau.length,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };

    await this.setToCache(cacheKey, result, METRICS_CACHE_TTL.WAU);
    datadogService.gauge('users.weekly_active', result.count);

    return result;
  }

  /**
   * Get Monthly Active Users (MAU)
   * TD-002: Now uses Redis caching
   */
  async getMonthlyActiveUsers(date = new Date()) {
    const endDate = new Date(date);
    const startDate = new Date(date);
    startDate.setDate(startDate.getDate() - 30);

    const cacheKey = `mau_${startDate.toDateString()}_${endDate.toDateString()}`;

    // Check Redis cache first
    const cachedResult = await this.getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const mau = await UserActivity.distinct('userId', {
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const result = {
      count: mau.length,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };

    await this.setToCache(cacheKey, result, METRICS_CACHE_TTL.MAU);
    datadogService.gauge('users.monthly_active', result.count);

    return result;
  }

  // =============================================
  // Match & Conversion Metrics
  // =============================================

  /**
   * Get Match Rate
   * Percentage of mutual likes resulting in matches
   * TD-002: Now uses Redis caching
   */
  async getMatchRate(startDate, endDate = new Date()) {
    const cacheKey = `match_rate_${startDate.toISOString()}_${endDate.toISOString()}`;

    // Check Redis cache first
    const cachedResult = await this.getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const totalLikes = await Swipe.countDocuments({
      action: { $in: ['like', 'superlike'] },
      createdAt: { $gte: startDate, $lte: endDate },
    });

    // Count matches (mutual likes)
    const matches = await Swipe.aggregate([
      {
        $match: {
          action: { $in: ['like', 'superlike'] },
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $lookup: {
          from: 'swipes',
          let: { swiperId: '$swiperId', swipedId: '$swipedId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$swiperId', '$$swipedId'] },
                    { $eq: ['$swipedId', '$$swiperId'] },
                    { $in: ['$action', ['like', 'superlike']] },
                  ],
                },
              },
            },
          ],
          as: 'mutualLike',
        },
      },
      {
        $match: { 'mutualLike.0': { $exists: true } },
      },
      {
        $count: 'matches',
      },
    ]);

    const matchCount = matches[0]?.matches || 0;
    // Divide by 2 since each match is counted from both sides
    const actualMatches = Math.floor(matchCount / 2);
    const rate = totalLikes > 0 ? (actualMatches / totalLikes) * 100 : 0;

    const result = {
      matchRate: parseFloat(rate.toFixed(2)),
      totalLikes,
      totalMatches: actualMatches,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };

    await this.setToCache(cacheKey, result, METRICS_CACHE_TTL.MATCH_RATE);
    datadogService.gauge('matches.rate', result.matchRate);
    datadogService.gauge('matches.total', result.totalMatches);

    return result;
  }

  /**
   * Get Swipe-to-Match Conversion Rate
   * Percentage of swipes that result in matches
   * TD-002: Now uses Redis caching
   */
  async getSwipeToMatchConversion(startDate, endDate = new Date()) {
    const cacheKey = `swipe_conv_${startDate.toISOString()}_${endDate.toISOString()}`;

    // Check Redis cache first
    const cachedResult = await this.getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const totalSwipes = await Swipe.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const { totalMatches } = await this.getMatchRate(startDate, endDate);

    const conversionRate = totalSwipes > 0 ? (totalMatches / totalSwipes) * 100 : 0;

    const result = {
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      totalSwipes,
      totalMatches,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };

    await this.setToCache(cacheKey, result, METRICS_CACHE_TTL.MATCH_RATE);
    datadogService.gauge('swipes.to_match_conversion', result.conversionRate);

    return result;
  }

  // =============================================
  // Message Metrics
  // =============================================

  /**
   * Get Message Response Rate
   * Percentage of first messages that receive a response
   * TD-002: Now uses Redis caching
   */
  async getMessageResponseRate(startDate, endDate = new Date()) {
    const cacheKey = `msg_response_${startDate.toISOString()}_${endDate.toISOString()}`;

    // Check Redis cache first
    const cachedResult = await this.getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Get first messages in conversations
    const firstMessages = await Message.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $sort: { matchId: 1, createdAt: 1 },
      },
      {
        $group: {
          _id: '$matchId',
          firstMessage: { $first: '$$ROOT' },
          messageCount: { $sum: 1 },
          uniqueSenders: { $addToSet: '$senderId' },
        },
      },
      {
        $project: {
          firstMessage: 1,
          messageCount: 1,
          hasResponse: { $gt: [{ $size: '$uniqueSenders' }, 1] },
        },
      },
    ]);

    const totalFirstMessages = firstMessages.length;
    const respondedMessages = firstMessages.filter((m) => m.hasResponse).length;

    const responseRate =
      totalFirstMessages > 0 ? (respondedMessages / totalFirstMessages) * 100 : 0;

    const result = {
      responseRate: parseFloat(responseRate.toFixed(2)),
      totalConversationsStarted: totalFirstMessages,
      conversationsWithResponse: respondedMessages,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };

    await this.setToCache(cacheKey, result, METRICS_CACHE_TTL.MESSAGES);
    datadogService.gauge('messages.response_rate', result.responseRate);

    return result;
  }

  /**
   * Get Average Messages Per Match
   * TD-002: Now uses Redis caching
   */
  async getAverageMessagesPerMatch(startDate, endDate = new Date()) {
    const cacheKey = `avg_msg_${startDate.toISOString()}_${endDate.toISOString()}`;

    // Check Redis cache first
    const cachedResult = await this.getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const messageCounts = await Message.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$matchId',
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          avgMessages: { $avg: '$count' },
          totalMatches: { $sum: 1 },
          totalMessages: { $sum: '$count' },
        },
      },
    ]);

    const result = {
      averageMessagesPerMatch: parseFloat((messageCounts[0]?.avgMessages || 0).toFixed(2)),
      totalMatches: messageCounts[0]?.totalMatches || 0,
      totalMessages: messageCounts[0]?.totalMessages || 0,
    };

    await this.setToCache(cacheKey, result, METRICS_CACHE_TTL.MESSAGES);
    datadogService.gauge('messages.avg_per_match', result.averageMessagesPerMatch);

    return result;
  }

  // =============================================
  // Premium Conversion Metrics
  // =============================================

  /**
   * Get Premium Conversion Rate
   * Percentage of users who converted to premium
   * TD-002: Now uses Redis caching
   */
  async getPremiumConversionRate(startDate, endDate = new Date()) {
    const cacheKey = `premium_conv_${startDate.toISOString()}_${endDate.toISOString()}`;

    // Check Redis cache first
    const cachedResult = await this.getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Total users registered in period
    const totalUsers = await User.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    // Users who subscribed to premium in period
    const premiumUsers = await Subscription.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['active', 'trialing'] },
    });

    const conversionRate = totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0;

    const result = {
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      totalNewUsers: totalUsers,
      premiumConversions: premiumUsers,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };

    await this.setToCache(cacheKey, result, METRICS_CACHE_TTL.PREMIUM);
    datadogService.gauge('premium.conversion_rate', result.conversionRate);
    datadogService.gauge('premium.total_conversions', result.premiumConversions);

    return result;
  }

  /**
   * Get Premium Churn Rate
   * TD-002: Now uses Redis caching
   */
  async getPremiumChurnRate(startDate, endDate = new Date()) {
    const cacheKey = `premium_churn_${startDate.toISOString()}_${endDate.toISOString()}`;

    // Check Redis cache first
    const cachedResult = await this.getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const startPremium = await Subscription.countDocuments({
      createdAt: { $lt: startDate },
      status: 'active',
    });

    const cancelledInPeriod = await Subscription.countDocuments({
      cancelledAt: { $gte: startDate, $lte: endDate },
      status: 'cancelled',
    });

    const churnRate = startPremium > 0 ? (cancelledInPeriod / startPremium) * 100 : 0;

    const result = {
      churnRate: parseFloat(churnRate.toFixed(2)),
      premiumAtPeriodStart: startPremium,
      cancelled: cancelledInPeriod,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };

    await this.setToCache(cacheKey, result, METRICS_CACHE_TTL.PREMIUM);
    datadogService.gauge('premium.churn_rate', result.churnRate);

    return result;
  }

  // =============================================
  // Retention Metrics
  // =============================================

  /**
   * Get Retention Rate (D1, D7, D30)
   * Percentage of users who return after N days
   * TD-002: Now uses Redis caching for expensive retention queries
   */
  async getRetentionRate(cohortDate, retentionDays = [1, 7, 30]) {
    const cohortStart = new Date(cohortDate);
    cohortStart.setHours(0, 0, 0, 0);

    const cacheKey = `retention_${cohortStart.toISOString()}_${retentionDays.join('_')}`;

    // Check Redis cache first (retention queries are expensive)
    const cachedResult = await this.getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const cohortEnd = new Date(cohortStart);
    cohortEnd.setHours(23, 59, 59, 999);

    // Get users who registered on cohort date
    const cohortUsers = await User.find({
      createdAt: { $gte: cohortStart, $lte: cohortEnd },
    }).select('_id');

    const cohortUserIds = cohortUsers.map((u) => u._id);
    const cohortSize = cohortUserIds.length;

    if (cohortSize === 0) {
      return {
        cohortDate: cohortStart.toISOString().split('T')[0],
        cohortSize: 0,
        retention: {},
      };
    }

    const retention = {};

    for (const days of retentionDays) {
      const targetDate = new Date(cohortStart);
      targetDate.setDate(targetDate.getDate() + days);

      const targetStart = new Date(targetDate);
      targetStart.setHours(0, 0, 0, 0);

      const targetEnd = new Date(targetDate);
      targetEnd.setHours(23, 59, 59, 999);

      // Count users from cohort who were active on target day
      const activeOnDay = await UserActivity.distinct('userId', {
        userId: { $in: cohortUserIds },
        createdAt: { $gte: targetStart, $lte: targetEnd },
      });

      const rate = (activeOnDay.length / cohortSize) * 100;
      retention[`D${days}`] = {
        rate: parseFloat(rate.toFixed(2)),
        retained: activeOnDay.length,
        date: targetDate.toISOString().split('T')[0],
      };

      datadogService.gauge(`retention.D${days}`, rate, [
        `cohort:${cohortStart.toISOString().split('T')[0]}`,
      ]);
    }

    const result = {
      cohortDate: cohortStart.toISOString().split('T')[0],
      cohortSize,
      retention,
    };

    // Cache retention results (expensive query, cache longer)
    await this.setToCache(cacheKey, result, METRICS_CACHE_TTL.RETENTION);

    return result;
  }

  /**
   * Get Rolling Retention (users active in last N days who registered before that)
   * TD-002: Now uses Redis caching
   */
  async getRollingRetention(lookbackDays = 30) {
    const cacheKey = `rolling_retention_${lookbackDays}`;

    // Check Redis cache first
    const cachedResult = await this.getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackDays);

    // Users registered before the lookback period
    const eligibleUsers = await User.countDocuments({
      createdAt: { $lt: startDate },
    });

    // Of those, how many were active in the lookback period
    const activeUsers = await UserActivity.distinct('userId', {
      createdAt: { $gte: startDate, $lte: endDate },
    });

    // Filter to only count eligible users
    const eligibleActiveCount = await User.countDocuments({
      _id: { $in: activeUsers },
      createdAt: { $lt: startDate },
    });

    const retentionRate = eligibleUsers > 0 ? (eligibleActiveCount / eligibleUsers) * 100 : 0;

    const result = {
      rollingRetentionRate: parseFloat(retentionRate.toFixed(2)),
      eligibleUsers,
      retainedUsers: eligibleActiveCount,
      lookbackDays,
    };

    await this.setToCache(cacheKey, result, METRICS_CACHE_TTL.RETENTION);
    return result;
  }

  // =============================================
  // Technical Metrics
  // =============================================

  /**
   * Track API Response Time
   * Call this from middleware
   */
  trackApiResponseTime(endpoint, method, statusCode, durationMs) {
    const tags = [
      `endpoint:${endpoint}`,
      `method:${method}`,
      `status:${statusCode}`,
      `status_class:${Math.floor(statusCode / 100)}xx`,
    ];

    datadogService.histogram('api.response_time', durationMs, tags);
    datadogService.increment('api.requests', 1, tags);

    if (statusCode >= 500) {
      datadogService.increment('api.errors.5xx', 1, tags);
    } else if (statusCode >= 400) {
      datadogService.increment('api.errors.4xx', 1, tags);
    }
  }

  /**
   * Track Photo Upload Metrics
   */
  trackPhotoUpload(success, sizeBytes, durationMs, errorType = null) {
    const tags = [`success:${success}`];

    if (errorType) {
      tags.push(`error_type:${errorType}`);
    }

    datadogService.increment('photos.upload.attempts', 1, tags);

    if (success) {
      datadogService.increment('photos.upload.success', 1);
      datadogService.histogram('photos.upload.duration', durationMs);
      datadogService.histogram('photos.upload.size', sizeBytes);
    } else {
      datadogService.increment('photos.upload.failures', 1, tags);
    }
  }

  /**
   * Get Photo Upload Success Rate
   */
  async getPhotoUploadSuccessRate(startDate, endDate = new Date()) {
    // This would typically come from a logs/metrics store
    // For now, we'll track it in memory or Redis
    // Placeholder for actual implementation
    return {
      successRate: 98.5, // Placeholder
      totalAttempts: 0,
      successful: 0,
      failed: 0,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };
  }

  /**
   * Track App Crash
   */
  trackCrash(platform, version, errorMessage, stackTrace) {
    const tags = [`platform:${platform}`, `version:${version}`];

    datadogService.increment('app.crashes', 1, tags);

    // Log detailed crash info
    console.error('App Crash:', {
      platform,
      version,
      errorMessage,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get App Crash Rate (crashes per 1000 sessions)
   */
  async getCrashRate(startDate, endDate = new Date()) {
    // This would integrate with Sentry/Firebase Crashlytics
    // Placeholder for actual implementation
    return {
      crashRate: 0.5, // per 1000 sessions
      totalSessions: 0,
      totalCrashes: 0,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };
  }

  // =============================================
  // Dashboard Summary
  // =============================================

  /**
   * Get comprehensive metrics dashboard
   * TD-002: Now uses Redis caching - individual metrics also cached
   */
  async getDashboardMetrics(startDate = null, endDate = new Date()) {
    if (!startDate) {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }

    // Cache key based on date range
    const cacheKey = `dashboard_${startDate.toISOString()}_${endDate.toISOString()}`;

    // Check Redis cache for full dashboard
    const cachedResult = await this.getFromCache(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const [
      dau,
      wau,
      mau,
      matchRate,
      swipeConversion,
      messageResponse,
      premiumConversion,
      retention,
    ] = await Promise.all([
      this.getDailyActiveUsers(),
      this.getWeeklyActiveUsers(),
      this.getMonthlyActiveUsers(),
      this.getMatchRate(startDate, endDate),
      this.getSwipeToMatchConversion(startDate, endDate),
      this.getMessageResponseRate(startDate, endDate),
      this.getPremiumConversionRate(startDate, endDate),
      this.getRetentionRate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    ]);

    const result = {
      generatedAt: new Date().toISOString(),
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      engagement: {
        dau: dau.count,
        wau: wau.count,
        mau: mau.count,
        dauMauRatio: mau.count > 0 ? parseFloat(((dau.count / mau.count) * 100).toFixed(2)) : 0,
      },
      matching: {
        matchRate: matchRate.matchRate,
        swipeToMatchConversion: swipeConversion.conversionRate,
        totalMatches: matchRate.totalMatches,
      },
      messaging: {
        responseRate: messageResponse.responseRate,
        conversationsStarted: messageResponse.totalConversationsStarted,
      },
      monetization: {
        premiumConversionRate: premiumConversion.conversionRate,
        totalPremiumUsers: premiumConversion.premiumConversions,
      },
      retention: {
        D1: retention.retention.D1?.rate || 0,
        D7: retention.retention.D7?.rate || 0,
        D30: retention.retention.D30?.rate || 0,
      },
    };

    // Cache the full dashboard
    await this.setToCache(cacheKey, result, METRICS_CACHE_TTL.DASHBOARD);

    return result;
  }

  // =============================================
  // Utility Methods
  // =============================================

  isCacheValid(key) {
    const cached = this.metricsCache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.cacheTTL;
  }

  setCache(key, value) {
    this.metricsCache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  clearCache() {
    this.metricsCache.clear();
  }

  /**
   * Clear all analytics cache (both Redis and in-memory)
   * Useful when metrics need to be refreshed immediately
   */
  async clearAllCache() {
    this.metricsCache.clear();
    if (this.useRedis) {
      try {
        await cache.delByPattern(`${METRICS_CACHE_PREFIX}*`);
      } catch (error) {
        console.warn('Redis cache clear error:', error.message);
      }
    }
  }

  /**
   * Toggle Redis caching on/off (useful for testing or fallback)
   */
  setUseRedis(enabled) {
    this.useRedis = enabled;
  }
}

// Export singleton instance
const analyticsMetricsService = new AnalyticsMetricsService();

module.exports = {
  AnalyticsMetricsService,
  analyticsMetricsService,
  METRICS_CACHE_TTL,
  METRICS_CACHE_PREFIX,
};
