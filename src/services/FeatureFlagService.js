/**
 * Feature Flag Service
 * Manages feature flags for beta testing and gradual rollouts
 */

class FeatureFlagService {
  constructor() {
    this.flags = new Map();
    this.userOverrides = new Map();
    this.rolloutPercentages = new Map();
  }

  // Initialize default flags
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

  // Check if feature is enabled for user
  isEnabled(flagName, userId = null, userGroups = []) {
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
    if (!flag.allowedGroups.includes('all')) {
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
        enabled: this.isEnabled(name, userId, userGroups),
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
}

// Export singleton instance
const featureFlagService = new FeatureFlagService();
featureFlagService.initializeFlags();

module.exports = {
  FeatureFlagService,
  featureFlagService,
};
