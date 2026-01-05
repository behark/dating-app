import { API_BASE_URL } from '../config/api';
import logger from '../utils/logger';
import { validateUserId, validateNotEmpty, validateNumberRange } from '../utils/validators';
import { getUserFriendlyMessage } from '../utils/errorMessages';

class MediaMessagesService {
  constructor(authToken) {
    this.authToken = authToken;
  }

  /**
   * Send a GIF message
   */
  async sendGif(matchId, gifUrl, gifId, gifMetadata = {}) {
    try {
      if (!validateUserId(matchId) || !validateNotEmpty(gifUrl) || !validateNotEmpty(gifId)) {
        throw new Error('Invalid match ID, GIF URL, or GIF ID provided');
      }

      const response = await fetch(`${API_BASE_URL}/chat/media/gif`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          matchId,
          gifUrl,
          gifId,
          gifMetadata,
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
        throw new Error(getUserFriendlyMessage(data.message || 'Request failed'));
      }
      return data.data || {};
    } catch (error) {
      logger.error('Error sending GIF:', error);
      throw error;
    }
  }

  /**
   * Send a sticker message
   */
  async sendSticker(matchId, stickerUrl, stickerPackId, stickerId) {
    try {
      if (!validateUserId(matchId) || !validateNotEmpty(stickerUrl)) {
        throw new Error('Invalid match ID or sticker URL provided');
      }

      const response = await fetch(`${API_BASE_URL}/chat/media/sticker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          matchId,
          stickerUrl,
          stickerPackId,
          stickerId,
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
        throw new Error(getUserFriendlyMessage(data.message || 'Request failed'));
      }
      return data.data || {};
    } catch (error) {
      logger.error('Error sending sticker:', error);
      throw error;
    }
  }

  /**
   * Send a voice message
   */
  async sendVoiceMessage(matchId, voiceUrl, duration, language = 'en') {
    try {
      if (!validateUserId(matchId) || !validateNotEmpty(voiceUrl)) {
        throw new Error('Invalid match ID or voice URL provided');
      }

      const response = await fetch(`${API_BASE_URL}/chat/media/voice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          matchId,
          voiceUrl,
          duration,
          language,
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
        throw new Error(getUserFriendlyMessage(data.message || 'Request failed'));
      }
      return data.data || {};
    } catch (error) {
      logger.error('Error sending voice message:', error);
      throw error;
    }
  }

  /**
   * Transcribe a voice message
   */
  async transcribeVoiceMessage(messageId) {
    try {
      if (!validateUserId(messageId)) {
        throw new Error('Invalid message ID provided');
      }

      const response = await fetch(`${API_BASE_URL}/chat/media/voice/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({ messageId }),
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
        throw new Error(getUserFriendlyMessage(data.message || 'Request failed'));
      }
      return data.data || {};
    } catch (error) {
      logger.error('Error transcribing voice message:', error);
      throw error;
    }
  }

  /**
   * Get popular GIFs
   */
  async getPopularGifs(limit = 20, offset = 0) {
    try {
      // Validate inputs
      if (!validateNumberRange(limit, 1, 100)) {
        throw new Error('Limit must be between 1 and 100');
      }
      if (offset < 0 || !Number.isInteger(offset)) {
        throw new Error('Offset must be a non-negative integer');
      }

      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(`${API_BASE_URL}/chat/media/gifs/popular?${queryParams}`, {
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
        throw new Error(getUserFriendlyMessage(data.message || 'Request failed'));
      }
      return data.data || {};
    } catch (error) {
      logger.error('Error getting popular GIFs:', error);
      throw error;
    }
  }

  /**
   * Search GIFs
   */
  async searchGifs(query, limit = 20, offset = 0) {
    try {
      if (!validateNotEmpty(query)) {
        throw new Error('Search query is required');
      }
      if (!validateNumberRange(limit, 1, 100)) {
        throw new Error('Limit must be between 1 and 100');
      }
      if (offset < 0 || !Number.isInteger(offset)) {
        throw new Error('Offset must be a non-negative integer');
      }

      const queryParams = new URLSearchParams({
        query: query.trim(),
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(`${API_BASE_URL}/chat/media/gifs/search?${queryParams}`, {
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
        throw new Error(getUserFriendlyMessage(data.message || 'Request failed'));
      }
      return data.data || {};
    } catch (error) {
      logger.error('Error searching GIFs:', error);
      throw error;
    }
  }

  /**
   * Get sticker packs
   */
  async getStickerPacks() {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/media/sticker-packs`, {
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
        throw new Error(getUserFriendlyMessage(data.message || 'Request failed'));
      }
      return data.data || {};
    } catch (error) {
      logger.error('Error getting sticker packs:', error);
      throw error;
    }
  }

  /**
   * Initiate video call
   */
  async initiateVideoCall(matchId, callId) {
    try {
      if (!validateUserId(matchId) || !validateNotEmpty(callId)) {
        throw new Error('Invalid match ID or call ID provided');
      }

      const response = await fetch(`${API_BASE_URL}/chat/media/video-call/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          matchId,
          callId,
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
        throw new Error(getUserFriendlyMessage(data.message || 'Request failed'));
      }
      return data.data || {};
    } catch (error) {
      logger.error('Error initiating video call:', error);
      throw error;
    }
  }

  /**
   * Update video call status
   */
  async updateVideoCallStatus(messageId, status, duration = null) {
    try {
      if (!validateUserId(messageId) || !validateNotEmpty(status)) {
        throw new Error('Invalid message ID or status provided');
      }

      const response = await fetch(`${API_BASE_URL}/chat/media/video-call/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          messageId,
          status,
          duration,
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
        throw new Error(getUserFriendlyMessage(data.message || 'Request failed'));
      }
      return data.data || {};
    } catch (error) {
      logger.error('Error updating video call status:', error);
      throw error;
    }
  }
}

export default MediaMessagesService;
