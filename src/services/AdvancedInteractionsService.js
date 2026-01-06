import { ERROR_MESSAGES } from '../constants/constants';
import { handleApiResponse } from '../utils/apiResponseHandler';
import logger from '../utils/logger';
import { validateUserId } from '../utils/validators';
import api from './api';

class AdvancedInteractionsService {
  constructor(_authToken) {}

  /**
   * Send a super like
   */
  async sendSuperLike(recipientId, message = null) {
    try {
      if (!validateUserId(recipientId)) {
        throw new Error('Invalid recipient ID provided');
      }

      const response = await api.post('/interactions/super-like', {
        recipientId,
        message,
      });
      const handled = handleApiResponse(response, 'Send super like');
      return handled.data || {};
    } catch (error) {
      logger.error('Error sending super like:', error);
      throw error;
    }
  }

  /**
   * Get super like quota
   */
  async getSuperLikeQuota() {
    try {
      const response = await api.get('/interactions/super-like-quota');
      const handled = handleApiResponse(response, 'Get super like quota');
      return handled.data || {};
    } catch (error) {
      logger.error('Error getting super like quota:', error);
      throw error;
    }
  }

  /**
   * Rewind last swipe
   */
  async rewindLastSwipe() {
    try {
      const response = await api.post('/interactions/rewind', {});
      const handled = handleApiResponse(response, 'Rewind swipe');
      return handled.data || {};
    } catch (error) {
      logger.error('Error rewinding swipe:', error);
      throw error;
    }
  }

  /**
   * Get rewind quota
   */
  async getRewindQuota() {
    try {
      const response = await api.get('/interactions/rewind-quota');
      const handled = handleApiResponse(response, 'Get rewind quota');
      return handled.data || {};
    } catch (error) {
      logger.error('Error getting rewind quota:', error);
      throw error;
    }
  }

  /**
   * Boost profile
   */
  async boostProfile(durationMinutes = 30) {
    try {
      const response = await api.post('/interactions/boost', {
        durationMinutes,
      });
      const handled = handleApiResponse(response, 'Boost profile');
      return handled.data || {};
    } catch (error) {
      logger.error('Error boosting profile:', error);
      throw error;
    }
  }

  /**
   * Get boost quota
   */
  async getBoostQuota() {
    try {
      const response = await api.get('/interactions/boost-quota');
      const handled = handleApiResponse(response, 'Get boost quota');
      return handled.data || {};
    } catch (error) {
      logger.error('Error getting boost quota:', error);
      throw error;
    }
  }
}

export default AdvancedInteractionsService;
