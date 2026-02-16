import logger from '../../utils/logger';
import api from '../api';

/**
 * Service for emergency features (SOS, contacts, check-ins)
 */
export class EmergencyService {
  static async sendEmergencySOS(location = {}, emergencyMessage = '') {
    try {
      const response = await api.post('/safety/sos', {
        location,
        message: emergencyMessage,
        timestamp: new Date().toISOString(),
      });

      if (!response.success) {
        logger.error('Error sending SOS', new Error(response.message));
        return { success: false, error: response.message || 'Failed to send SOS' };
      }

      logger.info('SOS sent', { sosId: response.data?.sosId });
      return response.data || { success: true };
    } catch (error) {
      logger.error('Error sending SOS', error);
      return { success: false, error: error.message };
    }
  }

  static async getActiveSOS() {
    try {
      const response = await api.get('/safety/sos/active');

      if (!response.success) {
        return [];
      }

      return response.data?.alerts || [];
    } catch (error) {
      logger.error('Error getting active SOS alerts', error);
      return [];
    }
  }

  static async respondToSOS(sosAlertId, response = {}) {
    try {
      const apiResponse = await api.post(`/safety/sos/${sosAlertId}/respond`, response);

      if (!apiResponse.success) {
        logger.error('Error responding to SOS', new Error(apiResponse.message));
        return { success: false, error: apiResponse.message };
      }

      return apiResponse.data || { success: true };
    } catch (error) {
      logger.error('Error responding to SOS', error);
      return { success: false, error: error.message };
    }
  }

  static async resolveSOS(sosAlertId, status = 'resolved') {
    try {
      const response = await api.put(`/safety/sos/${sosAlertId}`, { status });

      if (!response.success) {
        logger.error('Error resolving SOS', new Error(response.message));
        return { success: false, error: response.message };
      }

      return response.data || { success: true };
    } catch (error) {
      logger.error('Error resolving SOS', error);
      return { success: false, error: error.message };
    }
  }

  static async getEmergencyContacts() {
    try {
      const response = await api.get('/safety/emergency-contacts');

      if (!response.success) {
        return [];
      }

      return response.data?.contacts || [];
    } catch (error) {
      logger.error('Error getting emergency contacts', error);
      return [];
    }
  }

  static async addEmergencyContact(contactInfo) {
    try {
      const validation = this.validateEmergencyContact(contactInfo);
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      const response = await api.post('/safety/emergency-contacts', contactInfo);

      if (!response.success) {
        logger.error('Error adding emergency contact', new Error(response.message));
        return { success: false, error: response.message };
      }

      return response.data || { success: true };
    } catch (error) {
      logger.error('Error adding emergency contact', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteEmergencyContact(contactId) {
    try {
      const response = await api.delete(`/safety/emergency-contacts/${contactId}`);

      if (!response.success) {
        logger.error('Error deleting emergency contact', new Error(response.message));
        return { success: false, error: response.message };
      }

      return { success: true };
    } catch (error) {
      logger.error('Error deleting emergency contact', error);
      return { success: false, error: error.message };
    }
  }

  static async startCheckInTimer(datePlanId, duration = 300) {
    try {
      const response = await api.post('/safety/check-in/start', {
        datePlanId,
        duration,
      });

      if (!response.success) {
        logger.error('Error starting check-in timer', new Error(response.message));
        return { success: false, error: response.message };
      }

      return response.data || { success: true };
    } catch (error) {
      logger.error('Error starting check-in timer', error);
      return { success: false, error: error.message };
    }
  }

  static async completeCheckIn(checkInId) {
    try {
      const response = await api.post(`/safety/check-in/${checkInId}/complete`);

      if (!response.success) {
        logger.error('Error completing check-in', new Error(response.message));
        return { success: false, error: response.message };
      }

      return response.data || { success: true };
    } catch (error) {
      logger.error('Error completing check-in', error);
      return { success: false, error: error.message };
    }
  }

  static async getActiveCheckIns() {
    try {
      const response = await api.get('/safety/check-in/active');

      if (!response.success) {
        return [];
      }

      return response.data?.checkIns || [];
    } catch (error) {
      logger.error('Error getting active check-ins', error);
      return [];
    }
  }

  static validateEmergencyContact(contact) {
    const errors = [];

    if (!contact.name || contact.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    if (!contact.phone || !/^\+?[\d\s-()]{10,}$/.test(contact.phone)) {
      errors.push('Please provide a valid phone number');
    }

    if (!contact.relationship) {
      errors.push('Please specify the relationship');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default EmergencyService;
