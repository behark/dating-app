import { ERROR_MESSAGES } from '../constants/constants';
import { handleApiResponse } from '../utils/apiResponseHandler';
import logger from '../utils/logger';
import { validateNotEmpty, validateNumberRange, validateUserId } from '../utils/validators';
import api from './api';

class MediaMessagesService {
  constructor(_authToken) {}

  /**
   * Send a GIF message
   */
  async sendGif(matchId, gifUrl, gifId, gifMetadata = {}) {
    try {
      if (!validateUserId(matchId) || !validateNotEmpty(gifUrl) || !validateNotEmpty(gifId)) {
        throw new Error('Invalid match ID, GIF URL, or GIF ID provided');
      }

      const response = await api.post('/chat/media/gif', {
        matchId,
        gifUrl,
        gifId,
        gifMetadata,
      });
      const handled = handleApiResponse(response, 'Send GIF');
      return handled.data || {};
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

      const response = await api.post('/chat/media/sticker', {
        matchId,
        stickerUrl,
        stickerPackId,
        stickerId,
      });
      const handled = handleApiResponse(response, 'Send sticker');
      return handled.data || {};
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

      const response = await api.post('/chat/media/voice', {
        matchId,
        voiceUrl,
        duration,
        language,
      });
      const handled = handleApiResponse(response, 'Send voice message');
      return handled.data || {};
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

      const response = await api.post('/chat/media/voice/transcribe', { messageId });
      const handled = handleApiResponse(response, 'Transcribe voice message');
      return handled.data || {};
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
      const response = await api.get(`/chat/media/gifs/popular?${queryParams}`);
      const handled = handleApiResponse(response, 'Get popular GIFs');
      return handled.data || {};
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
      const response = await api.get(`/chat/media/gifs/search?${queryParams}`);
      const handled = handleApiResponse(response, 'Search GIFs');
      return handled.data || {};
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
      const response = await api.get('/chat/media/sticker-packs');
      const handled = handleApiResponse(response, 'Get sticker packs');
      return handled.data || {};
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
      const response = await api.post('/chat/media/video-call/initiate', {
        matchId,
        callId,
      });
      const handled = handleApiResponse(response, 'Initiate video call');
      return handled.data || {};
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
      const response = await api.put('/chat/media/video-call/status', {
        messageId,
        status,
        duration,
      });
      const handled = handleApiResponse(response, 'Update video call status');
      return handled.data || {};
    } catch (error) {
      logger.error('Error updating video call status:', error);
      throw error;
    }
  }
}

export default MediaMessagesService;
