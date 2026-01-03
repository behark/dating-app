import { API_BASE_URL } from '../config/api';

class MediaMessagesService {
  constructor(authToken) {
    this.authToken = authToken;
  }

  /**
   * Send a GIF message
   */
  async sendGif(matchId, gifUrl, gifId, gifMetadata = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/media/gif`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          matchId,
          gifUrl,
          gifId,
          gifMetadata
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      return data.data;
    } catch (error) {
      console.error('Error sending GIF:', error);
      throw error;
    }
  }

  /**
   * Send a sticker message
   */
  async sendSticker(matchId, stickerUrl, stickerPackId, stickerId) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/media/sticker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          matchId,
          stickerUrl,
          stickerPackId,
          stickerId
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      return data.data;
    } catch (error) {
      console.error('Error sending sticker:', error);
      throw error;
    }
  }

  /**
   * Send a voice message
   */
  async sendVoiceMessage(matchId, voiceUrl, duration, language = 'en') {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/media/voice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          matchId,
          voiceUrl,
          duration,
          language
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      return data.data;
    } catch (error) {
      console.error('Error sending voice message:', error);
      throw error;
    }
  }

  /**
   * Transcribe a voice message
   */
  async transcribeVoiceMessage(messageId) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/media/voice/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`
        },
        body: JSON.stringify({ messageId })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      return data.data;
    } catch (error) {
      console.error('Error transcribing voice message:', error);
      throw error;
    }
  }

  /**
   * Get popular GIFs
   */
  async getPopularGifs(limit = 20, offset = 0) {
    try {
      const queryParams = new URLSearchParams({
        limit,
        offset
      });

      const response = await fetch(
        `${API_BASE_URL}/chat/media/gifs/popular?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${this.authToken}` }
        }
      );

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      return data.data;
    } catch (error) {
      console.error('Error getting popular GIFs:', error);
      throw error;
    }
  }

  /**
   * Search GIFs
   */
  async searchGifs(query, limit = 20, offset = 0) {
    try {
      if (!query) {
        throw new Error('Search query is required');
      }

      const queryParams = new URLSearchParams({
        query,
        limit,
        offset
      });

      const response = await fetch(
        `${API_BASE_URL}/chat/media/gifs/search?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${this.authToken}` }
        }
      );

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      return data.data;
    } catch (error) {
      console.error('Error searching GIFs:', error);
      throw error;
    }
  }

  /**
   * Get sticker packs
   */
  async getStickerPacks() {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/media/sticker-packs`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      return data.data;
    } catch (error) {
      console.error('Error getting sticker packs:', error);
      throw error;
    }
  }

  /**
   * Initiate video call
   */
  async initiateVideoCall(matchId, callId) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/media/video-call/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          matchId,
          callId
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      return data.data;
    } catch (error) {
      console.error('Error initiating video call:', error);
      throw error;
    }
  }

  /**
   * Update video call status
   */
  async updateVideoCallStatus(messageId, status, duration = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/media/video-call/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          messageId,
          status,
          duration
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      return data.data;
    } catch (error) {
      console.error('Error updating video call status:', error);
      throw error;
    }
  }
}

export default MediaMessagesService;
