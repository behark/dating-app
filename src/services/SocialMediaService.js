import { handleApiResponse } from '../utils/apiResponseHandler';
import logger from '../utils/logger';
import api from './api';

export class SocialMediaService {
  // Connect Spotify account
  static async connectSpotify(spotifyData) {
    try {
      const response = await api.post('/social-media/connect-spotify', spotifyData);
      const handled = handleApiResponse(response, 'Connect Spotify');
      return handled.data;
    } catch (error) {
      logger.error('Error connecting Spotify:', error);
      throw error;
    }
  }

  // Connect Instagram account
  static async connectInstagram(instagramData) {
    try {
      const response = await api.post('/social-media/connect-instagram', instagramData);
      const handled = handleApiResponse(response, 'Connect Instagram');
      return handled.data;
    } catch (error) {
      logger.error('Error connecting Instagram:', error);
      throw error;
    }
  }

  // Disconnect Spotify
  static async disconnectSpotify() {
    try {
      const response = await api.delete('/social-media/disconnect-spotify');
      const handled = handleApiResponse(response, 'Disconnect Spotify');
      return handled.data;
    } catch (error) {
      logger.error('Error disconnecting Spotify:', error);
      throw error;
    }
  }

  // Disconnect Instagram
  static async disconnectInstagram() {
    try {
      const response = await api.delete('/social-media/disconnect-instagram');
      const handled = handleApiResponse(response, 'Disconnect Instagram');
      return handled.data;
    } catch (error) {
      logger.error('Error disconnecting Instagram:', error);
      throw error;
    }
  }

  // Get social media profiles for a user (public view)
  static async getSocialMedia(userId) {
    try {
      const response = await api.get(`/social-media/${userId}/social-media`);
      const handled = handleApiResponse(response, 'Get social media');
      return handled.data;
    } catch (error) {
      logger.error('Error fetching social media:', error);
      throw error;
    }
  }
}

export default SocialMediaService;
