import { Colors } from '../constants/colors';
import logger from '../utils/logger';
import { API_URL } from '../config/api';
import api from './api';

export class VerificationService {
  static async submitVerificationRequest(userId, verificationData) {
    try {
      // Use backend API for verification submission
      const response = await api.post('/safety/photo-verification/advanced', {
        type: verificationData.type, // 'photo', 'government_id', 'social_media'
        documents: verificationData.documents || [],
        notes: verificationData.notes || '',
        livenessCheck: verificationData.livenessCheck || {
          method: 'basic',
          passed: false,
        },
      });

      if (!response.success) {
        logger.error('Error submitting verification request via API', new Error(response.message), {
          userId,
          type: verificationData.type,
        });
        return { success: false, error: response.message || 'Failed to submit verification' };
      }

      logger.info('Verification request submitted via API', {
        userId,
        requestId: response.data?.verificationId,
        type: verificationData.type,
      });
      return { success: true, requestId: response.data?.verificationId };
    } catch (error) {
      logger.error('Error submitting verification request', error, {
        userId,
        type: verificationData.type,
      });
      return { success: false, error: error.message };
    }
  }

  static async uploadVerificationDocument(userId, fileUri, fileName, documentType) {
    try {
      const fileExtension = fileName.split('.').pop().toLowerCase();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];

      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error('File must be JPG, PNG, or PDF');
      }

      const mimeType =
        fileExtension === 'pdf'
          ? 'application/pdf'
          : `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;

      const formData = new FormData();
      formData.append('photos', {
        uri: fileUri,
        name: fileName,
        type: mimeType,
      });

      const token = await api.getAuthToken();
      const uploadResponse = await fetch(`${API_URL}/upload/verification`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      const result = await uploadResponse.json();
      const uploadResults = result?.data?.uploadResults || result?.uploadResults || [];
      const firstSuccess = uploadResults.find((r) => r.success) || uploadResults[0] || {};
      const downloadURL = firstSuccess.url || result?.data?.url || result?.url || '';

      return {
        success: true,
        url: downloadURL,
        fileName,
        documentType,
      };
    } catch (error) {
      logger.error('Error uploading verification document', error, { userId, documentType });
      return { success: false, error: error.message };
    }
  }

  static async getVerificationStatus(userId) {
    try {
      // Use backend API to get verification status
      const response = await api.get('/safety/account-status');

      if (!response.success) {
        return {
          status: 'unverified',
          verifiedAt: null,
          rejectionReason: null,
          requests: [],
        };
      }

      const data = response.data || response;

      return {
        status: data.verificationStatus || 'unverified', // 'unverified', 'pending', 'verified', 'rejected'
        verifiedAt: data.verifiedAt || null,
        rejectionReason: data.verificationRejectionReason || null,
        requests: data.verificationRequests || [],
      };
    } catch (error) {
      logger.error('Error getting verification status', error, { userId });
      return {
        status: 'unverified',
        verifiedAt: null,
        rejectionReason: null,
        requests: [],
      };
    }
  }

  static async cancelVerificationRequest(requestId, userId) {
    try {
      // Note: This would need a backend endpoint like DELETE /safety/verification/:requestId
      // For now, log a warning and return success to not break existing flows
      logger.warn('cancelVerificationRequest: Backend endpoint not available', {
        requestId,
        userId,
      });
      return { success: true };
    } catch (error) {
      logger.error('Error cancelling verification request', error, { requestId, userId });
      return { success: false, error: error.message };
    }
  }

  // Admin functions (for verification review) - would need admin API endpoints
  static async getPendingVerifications() {
    try {
      // This would need an admin endpoint like GET /admin/verifications/pending
      logger.warn('getPendingVerifications: Admin endpoint not available');
      return [];
    } catch (error) {
      logger.error('Error getting pending verifications', error);
      return [];
    }
  }

  static async reviewVerification(requestId, reviewerId, approved, reviewNotes = '') {
    try {
      // This would need an admin endpoint like PUT /admin/verifications/:requestId/review
      logger.warn('reviewVerification: Admin endpoint not available', {
        requestId,
        reviewerId,
        approved,
      });
      return { success: false, error: 'Admin endpoint not available' };
    } catch (error) {
      logger.error('Error reviewing verification', error, { requestId, reviewerId, approved });
      return { success: false, error: error.message };
    }
  }

  // Verification badge display logic
  static getVerificationBadgeInfo(userData) {
    const status = userData?.verificationStatus || 'unverified';

    switch (status) {
      case 'verified':
        return {
          showBadge: true,
          badgeColor: Colors.accent.teal,
          badgeText: 'Verified',
          iconName: 'checkmark-circle',
        };
      case 'pending':
        return {
          showBadge: true,
          badgeColor: '#FFA500',
          badgeText: 'Pending',
          iconName: 'time',
        };
      case 'rejected':
        return {
          showBadge: false,
          badgeText: '',
        };
      default:
        return {
          showBadge: false,
          badgeText: '',
        };
    }
  }
}
