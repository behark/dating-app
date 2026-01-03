import api from './api';

export const GamificationService = {
  /**
   * Track a swipe
   */
  trackSwipe: async (userId) => {
    try {
      const response = await api.post('/gamification/streaks/track', { userId });
      return response.data;
    } catch (error) {
      console.error('Error tracking swipe:', error);
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
      console.error('Error getting swipe streak:', error);
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
      console.error('Error getting badges:', error);
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
        points
      });
      return response.data;
    } catch (error) {
      console.error('Error awarding badge:', error);
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
      console.error('Error getting daily rewards:', error);
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
      console.error('Error claiming reward:', error);
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
      console.error('Error getting gamification stats:', error);
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
      console.error('Error getting streak leaderboard:', error);
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
      console.error('Error getting longest streak leaderboard:', error);
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
      console.error('Error updating badges:', error);
      throw error;
    }
  }
};

export default GamificationService;
