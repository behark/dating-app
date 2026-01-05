import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import logger from '../utils/logger';

// XP amounts for different actions
export const XP_ACTIONS = {
  DAILY_LOGIN: 10,
  COMPLETE_PROFILE: 50,
  SEND_MESSAGE: 5,
  RECEIVE_MATCH: 25,
  FIRST_DATE: 100,
  VERIFY_PHOTO: 30,
  VERIFY_ID: 50,
  SEND_SUPER_LIKE: 15,
  COMPLETE_CHALLENGE: 20,
  STREAK_BONUS: 5,
  REFER_FRIEND: 75,
};

// Level definitions
export const LEVELS = [
  { level: 1, name: 'Newcomer', minXP: 0, maxXP: 100, icon: '🌱', color: '#78909C' },
  { level: 2, name: 'Explorer', minXP: 100, maxXP: 300, icon: '🧭', color: '#4CAF50' },
  { level: 3, name: 'Connector', minXP: 300, maxXP: 600, icon: '🤝', color: '#2196F3' },
  { level: 4, name: 'Social Butterfly', minXP: 600, maxXP: 1000, icon: '🦋', color: '#9C27B0' },
  { level: 5, name: 'Charmer', minXP: 1000, maxXP: 1500, icon: '✨', color: '#FF9800' },
  { level: 6, name: 'Heartbreaker', minXP: 1500, maxXP: 2200, icon: '💔', color: '#E91E63' },
  { level: 7, name: 'Love Expert', minXP: 2200, maxXP: 3000, icon: '💝', color: '#F44336' },
  { level: 8, name: 'Matchmaker', minXP: 3000, maxXP: 4000, icon: '💘', color: '#E040FB' },
  { level: 9, name: 'Cupid', minXP: 4000, maxXP: 5500, icon: '🏹', color: '#FF4081' },
  { level: 10, name: 'Cupid Elite', minXP: 5500, maxXP: Infinity, icon: '👑', color: '#FFD700' },
];

// Achievement definitions
export const ACHIEVEMENTS = {
  FIRST_MATCH: {
    id: 'first_match',
    name: 'First Spark',
    description: 'Get your first match',
    icon: '💫',
    xpReward: 50,
    rarity: 'common',
    category: 'matching',
  },
  TEN_MATCHES: {
    id: 'ten_matches',
    name: 'Popular',
    description: 'Get 10 matches',
    icon: '🌟',
    xpReward: 100,
    rarity: 'uncommon',
    category: 'matching',
  },
  HUNDRED_MATCHES: {
    id: 'hundred_matches',
    name: 'Magnetic',
    description: 'Get 100 matches',
    icon: '🧲',
    xpReward: 500,
    rarity: 'rare',
    category: 'matching',
  },
  FIRST_MESSAGE: {
    id: 'first_message',
    name: 'Ice Breaker',
    description: 'Send your first message',
    icon: '💬',
    xpReward: 25,
    rarity: 'common',
    category: 'conversation',
  },
  CONVERSATION_STARTER: {
    id: 'conversation_starter',
    name: 'Conversation Starter',
    description: 'Start 10 conversations',
    icon: '🎯',
    xpReward: 75,
    rarity: 'uncommon',
    category: 'conversation',
  },
  SEVEN_DAY_STREAK: {
    id: 'seven_day_streak',
    name: 'Weekly Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    xpReward: 100,
    rarity: 'uncommon',
    category: 'engagement',
  },
  THIRTY_DAY_STREAK: {
    id: 'thirty_day_streak',
    name: 'Dedication',
    description: 'Maintain a 30-day streak',
    icon: '💎',
    xpReward: 300,
    rarity: 'rare',
    category: 'engagement',
  },
  PROFILE_COMPLETE: {
    id: 'profile_complete',
    name: 'Perfect Profile',
    description: 'Complete your profile 100%',
    icon: '✅',
    xpReward: 100,
    rarity: 'uncommon',
    category: 'profile',
  },
  VERIFIED: {
    id: 'verified',
    name: 'Verified',
    description: 'Get photo verified',
    icon: '✓',
    xpReward: 50,
    rarity: 'common',
    category: 'profile',
  },
  SUPER_LIKER: {
    id: 'super_liker',
    name: 'Super Liker',
    description: 'Send 10 Super Likes',
    icon: '⭐',
    xpReward: 75,
    rarity: 'uncommon',
    category: 'interaction',
  },
  SOCIAL_BUTTERFLY: {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Have 5 active conversations',
    icon: '🦋',
    xpReward: 100,
    rarity: 'uncommon',
    category: 'conversation',
  },
  FIRST_DATE: {
    id: 'first_date',
    name: 'First Date',
    description: 'Schedule your first date',
    icon: '🌹',
    xpReward: 150,
    rarity: 'rare',
    category: 'dating',
  },
};

// Daily challenge templates
export const CHALLENGE_TEMPLATES = [
  {
    id: 'send_messages',
    type: 'messages',
    title: 'Chat Champion',
    description: 'Send messages to matches',
    icon: '💬',
    targetCount: 5,
    xpReward: 30,
    difficulty: 'easy',
  },
  {
    id: 'swipe_right',
    type: 'swipes',
    title: 'Spread the Love',
    description: 'Like profiles',
    icon: '❤️',
    targetCount: 20,
    xpReward: 25,
    difficulty: 'easy',
  },
  {
    id: 'update_profile',
    type: 'profile',
    title: 'Fresh Look',
    description: 'Update your profile',
    icon: '✨',
    targetCount: 1,
    xpReward: 20,
    difficulty: 'easy',
  },
  {
    id: 'super_like',
    type: 'super_like',
    title: 'Super Star',
    description: 'Send a Super Like',
    icon: '⭐',
    targetCount: 1,
    xpReward: 35,
    difficulty: 'medium',
  },
  {
    id: 'start_conversations',
    type: 'conversation_start',
    title: 'Ice Breaker',
    description: 'Start new conversations',
    icon: '🎯',
    targetCount: 3,
    xpReward: 40,
    difficulty: 'medium',
  },
  {
    id: 'view_profiles',
    type: 'profile_views',
    title: 'Explorer',
    description: 'View profiles',
    icon: '👀',
    targetCount: 30,
    xpReward: 20,
    difficulty: 'easy',
  },
];

export const GamificationService = {
  /**
   * Track a swipe
   */
  trackSwipe: async (userId) => {
    try {
      const response = await api.post('/gamification/streaks/track', { userId });
      return response.data;
    } catch (error) {
      logger.error('Error tracking swipe', error, { userId });
      throw error;
    }
  },

  /**
   * Get swipe streak
   */
  getSwipeStreak: async (userId) => {
    try {
      const response = await api.get(`/gamification/streaks/${userId}`);
      return response.data;
    } catch (error) {
      logger.error('Error getting swipe streak', error, { userId });
      throw error;
    }
  },

  /**
   * Get user badges
   */
  getUserBadges: async (userId) => {
    try {
      const response = await api.get(`/gamification/badges/${userId}`);
      return response.data;
    } catch (error) {
      logger.error('Error getting badges', error, { userId });
      throw error;
    }
  },

  /**
   * Award a badge
   */
  awardBadge: async (userId, badgeType, badgeName, badgeDescription, points) => {
    try {
      const response = await api.post('/gamification/badges/award', {
        userId,
        badgeType,
        badgeName,
        badgeDescription,
        points,
      });
      return response.data;
    } catch (error) {
      logger.error('Error awarding badge', error, { userId, badgeType });
      throw error;
    }
  },

  /**
   * Get daily rewards
   */
  getDailyRewards: async (userId) => {
    try {
      const response = await api.get(`/gamification/rewards/${userId}`);
      return response.data;
    } catch (error) {
      logger.error('Error getting daily rewards', error, { userId });
      throw error;
    }
  },

  /**
   * Claim a reward
   */
  claimReward: async (rewardId) => {
    try {
      const response = await api.post(`/gamification/rewards/${rewardId}/claim`);
      return response.data;
    } catch (error) {
      logger.error('Error claiming reward', error, { rewardId });
      throw error;
    }
  },

  /**
   * Get gamification stats
   */
  getStats: async (userId) => {
    try {
      const response = await api.get(`/gamification/stats/${userId}`);
      return response.data;
    } catch (error) {
      logger.error('Error getting gamification stats', error, { userId });
      throw error;
    }
  },

  /**
   * Get streak leaderboard
   */
  getStreakLeaderboard: async (limit = 10) => {
    try {
      const response = await api.get(`/gamification/leaderboards/streaks?limit=${limit}`);
      return response.data;
    } catch (error) {
      logger.error('Error getting streak leaderboard', error, { limit });
      throw error;
    }
  },

  /**
   * Get longest streak leaderboard
   */
  getLongestStreakLeaderboard: async (limit = 10) => {
    try {
      const response = await api.get(`/gamification/leaderboards/longest-streaks?limit=${limit}`);
      return response.data;
    } catch (error) {
      logger.error('Error getting longest streak leaderboard', error, { limit });
      throw error;
    }
  },

  /**
   * Update badges
   */
  updateBadges: async (userId) => {
    try {
      const response = await api.post(`/gamification/badges/${userId}/update`);
      return response.data;
    } catch (error) {
      logger.error('Error updating badges', error, { userId });
      throw error;
    }
  },

  // =============================================
  // LEVEL PROGRESSION METHODS
  // =============================================

  /**
   * Get user's current level and XP
   */
  getUserLevel: async (userId) => {
    try {
      const response = await api.get(`/gamification/levels/${userId}`);
      return response.data;
    } catch (error) {
      logger.error('Error getting user level', error, { userId });
      // Fallback to local storage
      const stored = await AsyncStorage.getItem(`user_level_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
      return { currentXP: 0, level: 1, totalXPEarned: 0 };
    }
  },

  /**
   * Add XP to user
   */
  addXP: async (userId, amount, action) => {
    try {
      const response = await api.post('/gamification/levels/add-xp', {
        userId,
        amount,
        action,
      });
      
      // Check for level up
      const userData = response.data;
      const previousLevel = GamificationService.calculateLevel(userData.previousXP);
      const currentLevel = GamificationService.calculateLevel(userData.currentXP);
      
      if (currentLevel > previousLevel) {
        userData.leveledUp = true;
        const newLevelData = LEVELS.find(l => l.level === currentLevel);
        if (newLevelData) {
          userData.newLevel = newLevelData;
        }
      }
      
      return userData;
    } catch (error) {
      logger.error('Error adding XP', error, { userId, amount, action });
      throw error;
    }
  },

  /**
   * Calculate level from XP
   */
  calculateLevel: (xp) => {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (xp >= LEVELS[i].minXP) {
        return LEVELS[i].level;
      }
    }
    return 1;
  },

  /**
   * Get level details
   */
  getLevelDetails: (level) => {
    const found = LEVELS.find(l => l.level === level);
    return found || (LEVELS[0] || null);
  },

  /**
   * Get XP progress to next level
   */
  getXPProgress: (currentXP) => {
    const currentLevel = GamificationService.calculateLevel(currentXP);
    const levelData = LEVELS.find(l => l.level === currentLevel);
    const nextLevel = LEVELS.find(l => l.level === currentLevel + 1);
    
    if (!nextLevel || !levelData) {
      return { progress: 100, xpInLevel: 0, xpNeeded: 0, isMaxLevel: true };
    }
    
    const xpInLevel = currentXP - levelData.minXP;
    const xpNeeded = nextLevel.minXP - levelData.minXP;
    const progress = (xpInLevel / xpNeeded) * 100;
    
    return { progress, xpInLevel, xpNeeded, isMaxLevel: false };
  },

  /**
   * Get level rewards
   */
  getLevelRewards: async (level) => {
    try {
      const response = await api.get(`/gamification/levels/${level}/rewards`);
      return response.data;
    } catch (error) {
      logger.error('Error getting level rewards', error, { level });
      // Return default rewards
      return {
        superLikes: level,
        boosts: Math.floor(level / 2),
        badge: level >= 5 ? `Level ${level} Badge` : null,
      };
    }
  },

  // =============================================
  // DAILY CHALLENGES METHODS
  // =============================================

  /**
   * Get daily challenges for user
   */
  getDailyChallenges: async (userId) => {
    try {
      const response = await api.get(`/gamification/challenges/daily/${userId}`);
      return response.data;
    } catch (error) {
      logger.error('Error getting daily challenges', error, { userId });
      // Generate local challenges as fallback
      return GamificationService.generateLocalChallenges();
    }
  },

  /**
   * Generate local daily challenges
   */
  generateLocalChallenges: () => {
    const today = new Date().toDateString();
    const seed = today.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    
    // Shuffle and pick 3 challenges based on date seed
    const shuffled = [...CHALLENGE_TEMPLATES].sort((a, b) => {
      return ((seed * a.id.charCodeAt(0)) % 100) - ((seed * b.id.charCodeAt(0)) % 100);
    });
    
    return shuffled.slice(0, 3).map((template, index) => ({
      ...template,
      challengeId: `${template.id}_${today}`,
      currentProgress: 0,
      completed: false,
      claimed: false,
      expiresAt: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
      order: index,
    }));
  },

  /**
   * Update challenge progress
   */
  updateChallengeProgress: async (userId, challengeId, progress) => {
    try {
      const response = await api.post('/gamification/challenges/progress', {
        userId,
        challengeId,
        progress,
      });
      return response.data;
    } catch (error) {
      logger.error('Error updating challenge progress', error, { userId, challengeId, progress });
      throw error;
    }
  },

  /**
   * Track action for challenges
   */
  trackChallengeAction: async (userId, actionType, count = 1) => {
    try {
      const response = await api.post('/gamification/challenges/track', {
        userId,
        actionType,
        count,
      });
      return response.data;
    } catch (error) {
      logger.error('Error tracking challenge action', error, { userId, actionType, count });
      throw error;
    }
  },

  /**
   * Claim challenge reward
   */
  claimChallengeReward: async (userId, challengeId) => {
    try {
      const response = await api.post('/gamification/challenges/claim', {
        userId,
        challengeId,
      });
      
      // Also add XP
      const challenge = CHALLENGE_TEMPLATES.find(c => challengeId.startsWith(c.id));
      if (challenge?.xpReward) {
        await GamificationService.addXP(userId, challenge.xpReward, 'challenge_complete');
      }
      
      return response.data;
    } catch (error) {
      logger.error('Error claiming challenge reward', error, { userId, challengeId });
      throw error;
    }
  },

  /**
   * Get challenge completion bonus
   */
  getCompletionBonus: async (userId) => {
    try {
      const response = await api.get(`/gamification/challenges/bonus/${userId}`);
      return response.data;
    } catch (error) {
      logger.error('Error getting completion bonus', error, { userId });
      return { available: false, bonusXP: 50 };
    }
  },

  /**
   * Claim all challenges bonus
   */
  claimCompletionBonus: async (userId) => {
    try {
      const response = await api.post(`/gamification/challenges/bonus/${userId}/claim`);
      await GamificationService.addXP(userId, 50, 'daily_bonus');
      return response.data;
    } catch (error) {
      logger.error('Error claiming completion bonus', error, { userId });
      throw error;
    }
  },

  // =============================================
  // ACHIEVEMENT METHODS
  // =============================================

  /**
   * Get user achievements
   */
  getUserAchievements: async (userId) => {
    try {
      const response = await api.get(`/gamification/achievements/${userId}`);
      return response.data;
    } catch (error) {
      logger.error('Error getting user achievements', error, { userId });
      // Return empty achievements
      return { unlocked: [], progress: {} };
    }
  },

  /**
   * Check and unlock achievements
   */
  checkAchievements: async (userId, stats) => {
    try {
      const response = await api.post('/gamification/achievements/check', {
        userId,
        stats,
      });
      return response.data;
    } catch (error) {
      logger.error('Error checking achievements', error, { userId, stats });
      throw error;
    }
  },

  /**
   * Unlock an achievement
   */
  unlockAchievement: async (userId, achievementId) => {
    try {
      const achievement = ACHIEVEMENTS[achievementId] || Object.values(ACHIEVEMENTS).find(a => a.id === achievementId);
      
      const response = await api.post('/gamification/achievements/unlock', {
        userId,
        achievementId: achievement?.id || achievementId,
      });
      
      // Award XP for achievement
      if (achievement?.xpReward) {
        await GamificationService.addXP(userId, achievement.xpReward, 'achievement_unlock');
      }
      
      return {
        ...response.data,
        achievement: achievement || null,
      };
    } catch (error) {
      logger.error('Error unlocking achievement', error, { userId, achievementId });
      throw error;
    }
  },

  /**
   * Get achievement progress
   */
  getAchievementProgress: async (userId, achievementId) => {
    try {
      const response = await api.get(`/gamification/achievements/${userId}/${achievementId}/progress`);
      return response.data;
    } catch (error) {
      logger.error('Error getting achievement progress', error, { userId, achievementId });
      return { current: 0, target: 1, percentage: 0 };
    }
  },

  /**
   * Get recent achievements
   */
  getRecentAchievements: async (userId, limit = 5) => {
    try {
      const response = await api.get(`/gamification/achievements/${userId}/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      logger.error('Error getting recent achievements', error, { userId, limit });
      return [];
    }
  },

  /**
   * Get achievement categories
   */
  getAchievementsByCategory: () => {
    const categories = {};
    Object.values(ACHIEVEMENTS).forEach(achievement => {
      if (!categories[achievement.category]) {
        categories[achievement.category] = [];
      }
      categories[achievement.category].push(achievement);
    });
    return categories;
  },

  /**
   * Get rarity color
   */
  getRarityColor: (rarity) => {
    const colors = {
      common: '#78909C',
      uncommon: '#4CAF50',
      rare: '#2196F3',
      legendary: '#FFD700',
    };
    return colors[rarity] || colors.common;
  },

  // =============================================
  // UTILITY METHODS
  // =============================================

  /**
   * Get all gamification data for user
   */
  getAllGamificationData: async (userId) => {
    try {
      const [level, challenges, achievements, streaks, badges] = await Promise.all([
        GamificationService.getUserLevel(userId),
        GamificationService.getDailyChallenges(userId),
        GamificationService.getUserAchievements(userId),
        GamificationService.getSwipeStreak(userId),
        GamificationService.getUserBadges(userId),
      ]);
      
      return {
        level,
        challenges,
        achievements,
        streaks,
        badges,
      };
    } catch (error) {
      logger.error('Error getting all gamification data', error, { userId });
      throw error;
    }
  },

  /**
   * Track general user action (updates challenges, achievements, XP)
   */
  trackAction: async (userId, actionType, metadata = {}) => {
    try {
      // Track for challenges
      await GamificationService.trackChallengeAction(userId, actionType, metadata.count || 1);
      
      // Add XP if applicable
      const xpAmount = XP_ACTIONS[actionType.toUpperCase()];
      if (xpAmount) {
        await GamificationService.addXP(userId, xpAmount, actionType);
      }
      
      // Check achievements
      await GamificationService.checkAchievements(userId, { actionType, ...metadata });
      
      return { success: true };
    } catch (error) {
      logger.error('Error tracking action', error, { userId, actionType, metadata });
      throw error;
    }
  },
};

export default GamificationService;
