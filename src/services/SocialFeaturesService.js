import api from './api';
import logger from '../utils/logger';

export const SocialFeaturesService = {
  /**
   * GROUP DATES
   */
  createGroupDate: async (data) => {
    try {
      const response = await api.post('/social/group-dates', data);
      return response.data;
    } catch (error) {
      logger.error('Error creating group date', error, { data });
      throw error;
    }
  },

  joinGroupDate: async (groupDateId, userId) => {
    try {
      const response = await api.post(`/social/group-dates/${groupDateId}/join`, { userId });
      return response.data;
    } catch (error) {
      logger.error('Error joining group date', error, { groupDateId, userId });
      throw error;
    }
  },

  leaveGroupDate: async (groupDateId, userId) => {
    try {
      const response = await api.post(`/social/group-dates/${groupDateId}/leave`, { userId });
      return response.data;
    } catch (error) {
      logger.error('Error leaving group date', error, { groupDateId, userId });
      throw error;
    }
  },

  getNearbyGroupDates: async (longitude, latitude, maxDistance = 5000) => {
    try {
      const response = await api.get(
        `/social/group-dates/nearby?longitude=${longitude}&latitude=${latitude}&maxDistance=${maxDistance}`
      );
      return response.data;
    } catch (error) {
      logger.error('Error getting nearby group dates', error, { longitude, latitude, maxDistance });
      throw error;
    }
  },

  /**
   * FRIEND REVIEWS
   */
  createFriendReview: async (data) => {
    try {
      const response = await api.post('/social/reviews', data);
      return response.data;
    } catch (error) {
      logger.error('Error creating friend review', error, { data });
      throw error;
    }
  },

  getUserReviews: async (userId) => {
    try {
      const response = await api.get(`/social/reviews/${userId}`);
      return response.data;
    } catch (error) {
      logger.error('Error getting user reviews', error, { userId });
      throw error;
    }
  },

  /**
   * IN-APP EVENTS
   */
  createEvent: async (data) => {
    try {
      const response = await api.post('/social/events', data);
      return response.data;
    } catch (error) {
      logger.error('Error creating event', error, { data });
      throw error;
    }
  },

  registerForEvent: async (eventId, userId) => {
    try {
      const response = await api.post(`/social/events/${eventId}/register`, { userId });
      return response.data;
    } catch (error) {
      logger.error('Error registering for event', error, { eventId, userId });
      throw error;
    }
  },

  getNearbyEvents: async (longitude, latitude, maxDistance = 10000, category = null) => {
    try {
      let url = `/social/events/nearby?longitude=${longitude}&latitude=${latitude}&maxDistance=${maxDistance}`;
      if (category) {
        url += `&category=${category}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      logger.error('Error getting nearby events', error, { longitude, latitude, maxDistance, category });
      throw error;
    }
  },

  /**
   * PROFILE SHARING
   */
  createShareableProfileLink: async (userId, shareMethod = 'link', customMessage = '') => {
    try {
      const response = await api.post(`/social/share-profile/${userId}`, {
        shareMethod,
        customMessage,
      });
      return response.data;
    } catch (error) {
      logger.error('Error creating share link', error, { userId, shareMethod });
      throw error;
    }
  },

  shareProfileWith: async (userId, sharedByUserId, method = 'link') => {
    try {
      const response = await api.post(`/social/share-profile/${userId}/with`, {
        sharedByUserId,
        method,
      });
      return response.data;
    } catch (error) {
      logger.error('Error sharing profile', error, { userId, sharedByUserId, method });
      throw error;
    }
  },

  getSharedProfile: async (shareToken) => {
    try {
      // This endpoint doesn't require auth
      const response = await api.get(`/social/shared-profile/${shareToken}`, {
        headers: {
          Authorization: undefined,
        },
      });
      return response.data;
    } catch (error) {
      logger.error('Error getting shared profile', error, { shareToken });
      throw error;
    }
  },

  getUserSharedProfiles: async (userId) => {
    try {
      const response = await api.get(`/social/share-profile/${userId}/links`);
      return response.data;
    } catch (error) {
      logger.error('Error getting shared profiles', error, { userId });
      throw error;
    }
  },

  deactivateShareLink: async (shareToken) => {
    try {
      const response = await api.delete(`/social/share-profile/${shareToken}`);
      return response.data;
    } catch (error) {
      logger.error('Error deactivating share link', error, { shareToken });
      throw error;
    }
  },
};

export default SocialFeaturesService;
