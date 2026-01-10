import { Colors } from '../../constants/colors';
import logger from '../../utils/logger';
import api from '../api';

/**
 * Service for reporting users and content
 */
export class ReportService {
  static async reportUser(reportedUserId, category, description, evidence = []) {
    try {
      const response = await api.post('/safety/report', {
        reportedUserId,
        category,
        description,
        evidence,
      });

      if (!response.success) {
        logger.error('Error creating report', new Error(response.message), {
          reportedUserId,
          category,
        });
        return { success: false, error: response.message || 'Failed to create report' };
      }

      logger.info('Report created', {
        reportId: response.data?.reportId,
        reportedUserId,
        category,
      });

      return response.data || { success: true, reportId: response.data?.reportId };
    } catch (error) {
      logger.error('Error creating report', error, { reportedUserId, category });
      return { success: false, error: error.message };
    }
  }

  static getReportCategories() {
    return [
      { id: 'inappropriate_photos', label: '📸 Inappropriate Photos', color: Colors.accent.red },
      { id: 'fake_profile', label: '👤 Fake Profile', color: '#FFD93D' },
      { id: 'harassment', label: '💬 Harassment/Abuse', color: '#6BCB77' },
      { id: 'scam', label: '⚠️ Scam', color: '#4D96FF' },
      { id: 'offensive_behavior', label: '😠 Offensive Behavior', color: Colors.accent.pink },
      { id: 'other', label: '📋 Other', color: '#9D84B7' },
    ];
  }

  static async flagContent(contentType, contentId, reason, description = '') {
    try {
      const response = await api.post('/safety/flag', {
        contentType,
        contentId,
        reason,
        description,
      });

      if (!response.success) {
        logger.error('Error flagging content', new Error(response.message), {
          contentType,
          contentId,
          reason,
        });
        return { success: false, error: response.message || 'Failed to flag content' };
      }

      logger.info('Content flagged', { contentType, contentId, reason });
      return response.data || { success: true };
    } catch (error) {
      logger.error('Error flagging content', error, { contentType, contentId });
      return { success: false, error: error.message };
    }
  }

  static async getContentFlags(contentId) {
    try {
      const response = await api.get(`/safety/flags/${contentId}`);

      if (!response.success) {
        return [];
      }

      return response.data?.flags || [];
    } catch (error) {
      logger.error('Error getting content flags', error, { contentId });
      return [];
    }
  }

  static validateReport(category, description) {
    const errors = [];

    if (!category) {
      errors.push('Please select a category');
    }

    if (!description || description.trim().length < 10) {
      errors.push('Please provide a description (minimum 10 characters)');
    }

    if (description && description.length > 1000) {
      errors.push('Description must be less than 1000 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default ReportService;
