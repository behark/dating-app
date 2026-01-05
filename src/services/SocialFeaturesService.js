import api from './api';

export const SocialFeaturesService = {
  /**
   * GROUP DATES
   */
  createGroupDate: async (data) => {
    try {
      const response = await api.post('/social/group-dates', data);
      return response.data;
    } catch (error) {
      console.error('Error creating group date:', error);
      throw error;
    }
  },

  joinGroupDate: async (groupDateId, userId) => {
    try {
      const response = await api.post(`/social/group-dates/${groupDateId}/join`, { userId });
      return response.data;
    } catch (error) {
      console.error('Error joining group date:', error);
      throw error;
    }
  },

  leaveGroupDate: async (groupDateId, userId) => {
    try {
      const response = await api.post(`/social/group-dates/${groupDateId}/leave`, { userId });
      return response.data;
    } catch (error) {
      console.error('Error leaving group date:', error);
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
      console.error('Error getting nearby group dates:', error);
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
      console.error('Error creating friend review:', error);
      throw error;
    }
  },

  getUserReviews: async (userId) => {
    try {
      const response = await api.get(`/social/reviews/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting user reviews:', error);
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
      console.error('Error creating event:', error);
      throw error;
    }
  },

  registerForEvent: async (eventId, userId) => {
    try {
      const response = await api.post(`/social/events/${eventId}/register`, { userId });
      return response.data;
    } catch (error) {
      console.error('Error registering for event:', error);
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
      console.error('Error getting nearby events:', error);
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
      console.error('Error creating share link:', error);
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
      console.error('Error sharing profile:', error);
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
      console.error('Error getting shared profile:', error);
      throw error;
    }
  },

  getUserSharedProfiles: async (userId) => {
    try {
      const response = await api.get(`/social/share-profile/${userId}/links`);
      return response.data;
    } catch (error) {
      console.error('Error getting shared profiles:', error);
      throw error;
    }
  },

  deactivateShareLink: async (shareToken) => {
    try {
      const response = await api.delete(`/social/share-profile/${shareToken}`);
      return response.data;
    } catch (error) {
      console.error('Error deactivating share link:', error);
      throw error;
    }
  },
};

export default SocialFeaturesService;
