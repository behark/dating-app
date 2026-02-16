/**
 * Privacy Service
 * Handles GDPR and CCPA compliance features
 */

import logger from '../utils/logger';
import api from './api';

const PRIVACY_CONSENT_ENDPOINT = '/privacy/consent';

class PrivacyService {
  /**
   * Export all user data (GDPR Data Portability)
   * @returns {Promise<Object>} User data export
   */
  async exportUserData() {
    try {
      const response = await api.get('/privacy/export');
      return response.data;
    } catch (error) {
      logger.error('Error exporting user data:', error);
      throw error;
    }
  }

  /**
   * Get privacy settings
   * @returns {Promise<Object>} Privacy settings
   */
  async getPrivacySettings() {
    try {
      const response = await api.get('/privacy/settings');
      return response.data;
    } catch (error) {
      logger.error('Error fetching privacy settings:', error);
      throw error;
    }
  }

  /**
   * Update privacy settings
   * @param {Object} settings - Privacy settings to update
   * @returns {Promise<Object>} Updated settings
   */
  async updatePrivacySettings(settings) {
    try {
      const response = await api.put('/privacy/settings', settings);
      return response.data;
    } catch (error) {
      logger.error('Error updating privacy settings:', error);
      throw error;
    }
  }

  /**
   * Opt out of data selling (CCPA)
   * @returns {Promise<Object>} Confirmation
   */
  async doNotSell() {
    try {
      const response = await api.post('/privacy/do-not-sell');
      return response.data;
    } catch (error) {
      logger.error('Error opting out of data selling:', error);
      throw error;
    }
  }

  /**
   * Delete account and all data (GDPR Right to be Forgotten)
   * @param {string} password - User password for confirmation
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteAccount(password) {
    try {
      const response = await api.delete('/privacy/delete-account', {
        data: { password },
      });
      return response.data;
    } catch (error) {
      logger.error('Error deleting account:', error);
      throw error;
    }
  }

  /**
   * Rectify personal data (GDPR Right to Rectification)
   * @param {Object} data - Data corrections
   * @returns {Promise<Object>} Updated data
   */
  async rectifyData(data) {
    try {
      const response = await api.put('/privacy/rectify', data);
      return response.data;
    } catch (error) {
      logger.error('Error rectifying data:', error);
      throw error;
    }
  }

  /**
   * Get consent status
   * @returns {Promise<Object>} Consent status
   */
  async getConsentStatus() {
    try {
      const response = await api.get(PRIVACY_CONSENT_ENDPOINT);
      return response.data;
    } catch (error) {
      logger.error('Error fetching consent status:', error);
      throw error;
    }
  }

  /**
   * Record consent
   * @param {Object} consent - Consent data
   * @returns {Promise<Object>} Confirmation
   */
  async recordConsent(consent) {
    try {
      const response = await api.post(PRIVACY_CONSENT_ENDPOINT, consent);
      return response.data;
    } catch (error) {
      logger.error('Error recording consent:', error);
      throw error;
    }
  }

  /**
   * Withdraw consent
   * @param {string} consentType - Type of consent to withdraw
   * @returns {Promise<Object>} Confirmation
   */
  async withdrawConsent(consentType) {
    try {
      const response = await api.delete(PRIVACY_CONSENT_ENDPOINT, {
        data: { consentType },
      });
      return response.data;
    } catch (error) {
      logger.error('Error withdrawing consent:', error);
      throw error;
    }
  }
}

export default new PrivacyService();
