import { API_BASE_URL } from '../config/api';
import { ERROR_MESSAGES } from '../constants/constants';
import { getUserFriendlyMessage } from '../utils/errorMessages';
import logger from '../utils/logger';
import { validateUserId } from '../utils/validators';

class AdvancedInteractionsService {
  constructor(authToken) {
    this.authToken = authToken;
  }

  /**
   * Send a super like
   */
  async sendSuperLike(recipientId, message = null) {
    try {
      if (!validateUserId(recipientId)) {
        throw new Error('Invalid recipient ID provided');
      }

      const response = await fetch(`${API_BASE_URL}/interactions/super-like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          recipientId,
          message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || ERROR_MESSAGES.REQUEST_FAILED));
      }
      return data.data || {};
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
      const response = await fetch(`${API_BASE_URL}/interactions/super-like-quota`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || ERROR_MESSAGES.REQUEST_FAILED));
      }
      return data.data || {};
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
      const response = await fetch(`${API_BASE_URL}/interactions/rewind`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || ERROR_MESSAGES.REQUEST_FAILED));
      }
      return data.data || {};
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
      const response = await fetch(`${API_BASE_URL}/interactions/rewind-quota`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || ERROR_MESSAGES.REQUEST_FAILED));
      }
      return data.data || {};
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
      const response = await fetch(`${API_BASE_URL}/interactions/boost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          durationMinutes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || ERROR_MESSAGES.REQUEST_FAILED));
      }
      return data.data || {};
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
      const response = await fetch(`${API_BASE_URL}/interactions/boost-quota`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getUserFriendlyMessage(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          )
        );
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(getUserFriendlyMessage(data.message || ERROR_MESSAGES.REQUEST_FAILED));
      }
      return data.data || {};
    } catch (error) {
      logger.error('Error getting boost quota:', error);
      throw error;
    }
  }
}

export default AdvancedInteractionsService;
