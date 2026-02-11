/**
 * Feature Flag Service
 * Manages feature flags for beta testing and gradual rollouts
 * Now integrates with backend API for server-managed flags
 */

import logger from '../utils/logger';
import api from './api';

class FeatureFlagService {
  constructor() {
    this.flags = new Map();
    this.userOverrides = new Map();
    this.rolloutPercentages = new Map();
    this.lastFetch = 0;
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.isFetching = false;
  }

  /**
   * Fetch feature flags from backend API
   * @returns {Promise<Array>} Array of feature flags
   */
  async fetchFlagsFromAPI() {
    if (this.isFetching) return;

    this.isFetching = true;
    try {
      const response = await api.get('/feature-flags');
      if (response.success && response.data) {
        // Merge API flags with local flags (API takes precedence)
        if (Array.isArray(response.data)) {
          response.data.forEach((flag) => {
            this.flags.set(flag.name, {
              ...this.flags.get(flag.name),
              ...flag,
              fromAPI: true,
            });
          });
        }
        this.lastFetch = Date.now();
        logger.debug('Feature flags fetched from API', { count: response.data.length });
      }
      return response.data || [];
    } catch (error) {
      // Don't throw - fall back to local flags
      logger.warn('Error fetching feature flags from API, using local defaults:', error.message);
      return [];
    } finally {
      this.isFetching = false;
    }
  }

  /**
   * Check if cache needs refresh and fetch if needed
   */
  async ensureFreshFlags() {
    if (Date.now() - this.lastFetch > this.cacheExpiry) {
      await this.fetchFlagsFromAPI();
    }
  }

  // Initialize default flags (used as fallbacks if API unavailable)
  initializeFlags() {
    // Beta features
    this.registerFlag('beta_video_chat', {
      enabled: false,
      description: 'Enable video chat feature',
      rolloutPercentage: 0,
      allowedGroups: ['beta_testers', 'premium'],
    });

    this.registerFlag('beta_ai_matchmaking', {
      enabled: false,
      description: 'AI-powered matchmaking algorithm',
      rolloutPercentage: 10,
      allowedGroups: ['beta_testers'],
    });

    this.registerFlag('beta_voice_notes', {
      enabled: false,
      description: 'Send voice notes in chat',
      rolloutPercentage: 25,
      allowedGroups: ['beta_testers', 'premium'],
    });

    this.registerFlag('beta_profile_prompts', {
      enabled: false,
      description: 'Interactive profile prompts',
      rolloutPercentage: 50,
      allowedGroups: ['all'],
    });

    this.registerFlag('beta_date_spots', {
      enabled: false,
      description: 'Suggested date spots feature',
      rolloutPercentage: 0,
      allowedGroups: ['beta_testers'],
    });

    this.registerFlag('beta_icebreakers', {
      enabled: true,
      description: 'AI-generated conversation starters',
      rolloutPercentage: 75,
      allowedGroups: ['all'],
    });

    // Experimental features
    this.registerFlag('exp_swipe_animations', {
      enabled: false,
      description: 'New swipe card animations',
      rolloutPercentage: 5,
      allowedGroups: ['beta_testers'],
    });

    this.registerFlag('exp_dark_mode', {
      enabled: true,
      description: 'Dark mode theme',
      rolloutPercentage: 100,
      allowedGroups: ['all'],
    });

    // A/B test features
    this.registerFlag('ab_profile_layout_v2', {
      enabled: false,
      description: 'New profile layout design',
      rolloutPercentage: 50,
      allowedGroups: ['all'],
      isABTest: true,
    });

    this.registerFlag('ab_discovery_algorithm_v3', {
      enabled: false,
      description: 'Updated discovery algorithm',
      rolloutPercentage: 30,
      allowedGroups: ['all'],
      isABTest: true,
    });
  }

  registerFlag(name, config) {
    this.flags.set(name, {
      name,
      enabled: config.enabled || false,
      description: config.description || '',
      rolloutPercentage: config.rolloutPercentage || 0,
      allowedGroups: config.allowedGroups || ['all'],
      isABTest: config.isABTest || false,
      createdAt: new Date(),
    });
  }

  /**
   * Check if feature is enabled for user
   * Now checks API flags first, then falls back to local
   * @param {string} flagName - Name of the feature flag
   * @param {string} userId - User ID for rollout calculation
   * @param {Array} userGroups - User groups for access control
   * @returns {Promise<boolean>} Whether feature is enabled
   */
  async isEnabled(flagName, userId = null, userGroups = []) {
    // Ensure we have fresh flags from API
    await this.ensureFreshFlags();

    return this.isEnabledSync(flagName, userId, userGroups);
  }

  /**
   * Synchronous version of isEnabled (uses cached flags)
   * Use this when you can't await (e.g., in render methods)
   */
  isEnabledSync(flagName, userId = null, userGroups = []) {
    const flag = this.flags.get(flagName);
    if (!flag) return false;

    // Check user-specific override
    const userKey = `${userId}_${flagName}`;
    if (this.userOverrides.has(userKey)) {
      return this.userOverrides.get(userKey);
    }

    // If flag is globally disabled
    if (!flag.enabled) return false;

    // Check user groups
    if (flag.allowedGroups && !flag.allowedGroups.includes('all')) {
      const hasAllowedGroup = userGroups.some((group) => flag.allowedGroups.includes(group));
      if (!hasAllowedGroup) return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100 && userId) {
      const userHash = this.hashUserId(userId);
      const userPercentile = userHash % 100;
      return userPercentile < flag.rolloutPercentage;
    }

    return flag.enabled;
  }

  // Simple hash function for user ID
  hashUserId(userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // Override flag for specific user (for beta testers)
  setUserOverride(userId, flagName, enabled) {
    const userKey = `${userId}_${flagName}`;
    this.userOverrides.set(userKey, enabled);
  }

  // Get all flags status for user
  getUserFlags(userId, userGroups = []) {
    const userFlags = {};
    this.flags.forEach((flag, name) => {
      userFlags[name] = {
        enabled: this.isEnabledSync(name, userId, userGroups),
        description: flag.description,
      };
    });
    return userFlags;
  }

  // Update rollout percentage
  updateRollout(flagName, percentage) {
    const flag = this.flags.get(flagName);
    if (flag) {
      flag.rolloutPercentage = Math.min(100, Math.max(0, percentage));
    }
  }

  // Get all flags (admin view)
  getAllFlags() {
    return Array.from(this.flags.values());
  }

  /**
   * Get a specific flag from the API
   * @param {string} flagName - Name of the flag
   * @returns {Promise<Object|null>} Flag object or null
   */
  async getFlag(flagName) {
    try {
      const response = await api.get(`/feature-flags/${flagName}`);
      if (response.success && response.data) {
        // Update local cache
        this.flags.set(flagName, {
          ...this.flags.get(flagName),
          ...response.data,
          fromAPI: true,
        });
        return response.data;
      }
      return this.flags.get(flagName) || null;
    } catch (error) {
      logger.warn(`Error fetching flag ${flagName}:`, error.message);
      return this.flags.get(flagName) || null;
    }
  }

  /**
   * Get all flags for a user (calls API)
   * @param {string} userId - User ID
   * @param {Array} userGroups - User groups
   * @returns {Promise<Object>} Object with flag states
   */
  async getUserFlagsAsync(userId, userGroups = []) {
    await this.ensureFreshFlags();
    return this.getUserFlags(userId, userGroups);
  }
}

// Export singleton instance
const featureFlagService = new FeatureFlagService();
featureFlagService.initializeFlags();

// Fetch flags from API on initialization (async, non-blocking)
featureFlagService.fetchFlagsFromAPI().catch((err) => {
  logger.warn('Initial feature flag fetch failed:', err.message);
});

export { FeatureFlagService, featureFlagService };
export default featureFlagService;
