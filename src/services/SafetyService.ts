/**
 * Safety Service - TypeScript
 * Comprehensive safety features including blocking, reporting, verification, and emergency features
 */

import { Colors } from '../constants/colors';
import loggerModule from '../utils/logger';
import api from './api';

// Type assertion for logger to fix type inference from JavaScript module
const logger = loggerModule as {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, error?: Error | null, ...args: any[]) => void;
  apiError: (endpoint: string, method: string, status: number, error?: Error | null) => void;
  apiRequest: (endpoint: string, method: string) => void;
};

// ==================== TYPES ====================

export type ReportCategory =
  | 'inappropriate_photos'
  | 'fake_profile'
  | 'harassment'
  | 'scam'
  | 'offensive_behavior'
  | 'other';

export type ContentType = 'message' | 'profile_photo' | 'bio' | 'profile';

export type FlagReason = 'explicit' | 'hateful' | 'violent' | 'misleading' | 'spam';

export type SpoofingRisk = 'low' | 'medium' | 'high';

export type VerificationMethod = 'basic' | 'advanced' | 'ai_powered';

export type DatePlanStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

export type SOSStatus = 'active' | 'resolved' | 'false_alarm';

export type BackgroundCheckStatus = 'not_initiated' | 'pending' | 'in_progress' | 'completed' | 'error';

export interface BlockedUser {
  id: string;
  userId: string;
  blockedUserId: string;
  blockedAt: string;
  user?: {
    name: string;
    photoUrl?: string;
  };
}

export interface ReportData {
  reportedUserId: string;
  category: ReportCategory;
  description: string;
  evidence?: string[];
}

export interface ReportResponse {
  success: boolean;
  reportId?: string;
  error?: string;
}

export interface ReportCategoryItem {
  id: ReportCategory;
  label: string;
  color: string;
}

export interface InteractionCheck {
  allowed: boolean;
  reason?: 'user_blocked_target' | 'blocked_by_user' | 'error' | 'unknown';
}

export interface SafetyTip {
  id: number;
  title: string;
  category: 'privacy' | 'verification' | 'meeting' | 'online' | 'warning' | 'emergency';
  tips: string[];
  icon: string;
}

export interface SafetyScore {
  score: number;
  riskFactors: string[];
  lastCalculated: string;
}

export interface DatePlanData {
  matchUserId: string;
  matchName: string;
  matchPhotoUrl?: string;
  location: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  dateTime: string;
  notes?: string;
}

export interface DatePlan extends DatePlanData {
  id: string;
  userId: string;
  status: DatePlanStatus;
  friendIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CheckInData {
  id: string;
  datePlanId: string;
  userId: string;
  startTime: string;
  duration: number;
  completed: boolean;
  completedAt?: string;
}

export interface EmergencyLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface SOSAlert {
  id: string;
  userId: string;
  location: EmergencyLocation;
  message: string;
  status: SOSStatus;
  createdAt: string;
  resolvedAt?: string;
}

export interface SOSResponse {
  message?: string;
  confirmedSafe?: boolean;
  contactInfo?: string;
}

export interface BackgroundCheckInfo {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  address?: string;
  [key: string]: any;
}

export interface BackgroundCheck {
  id: string;
  userId: string;
  status: BackgroundCheckStatus;
  results?: Record<string, any>;
  checks?: Record<string, any>;
  requestedAt: string;
  completedAt?: string;
  estimatedCompletion?: string;
}

export interface LivenessData {
  method?: VerificationMethod;
  faceDetected?: boolean;
  livenessPassed?: boolean;
  confidence?: number;
  challenges?: string[];
  completedChallenges?: string[];
  faceQuality?: number;
  imageQuality?: number;
  spoofingRisk?: SpoofingRisk;
  matchWithProfilePhoto?: number;
}

export interface PhotoVerificationStatus {
  verified: boolean;
  status: 'not_submitted' | 'pending' | 'approved' | 'rejected' | 'error';
  submittedAt?: string;
  reviewedAt?: string;
}

export interface EmergencyContact {
  id?: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface NotificationData {
  title: string;
  message: string;
  type: string;
  data?: Record<string, any>;
}

// ==================== SAFETY SERVICE ====================

export class SafetyService {
  // ==================== BLOCK/UNBLOCK ====================

  static async blockUser(blockedUserId: string): Promise<boolean> {
    try {
      const response = await api.post('/safety/block', { blockedUserId });

      if (!response.success) {
        logger.error('Error blocking user', new Error(response.message), { blockedUserId });
        return false;
      }

      logger.info('User blocked', { blockedUserId });
      return (response.data as boolean) || false;
    } catch (error) {
      logger.error('Error blocking user', error as Error, { blockedUserId });
      return false;
    }
  }

  static async unblockUser(blockedUserId: string): Promise<boolean> {
    try {
      const response = await api.delete(`/safety/block/${blockedUserId}`);

      if (!response.success) {
        logger.error('Error unblocking user', new Error(response.message), { blockedUserId });
        return false;
      }

      logger.info('User unblocked', { blockedUserId });
      return true;
    } catch (error) {
      logger.error('Error unblocking user', error as Error, { blockedUserId });
      return false;
    }
  }

  static async getBlockedUsers(): Promise<BlockedUser[]> {
    try {
      const response = await api.get('/safety/blocked');

      if (!response.success) {
        logger.error('Error getting blocked users', new Error(response.message));
        return [];
      }

      return (response as any).blockedUsers || (response.data as any)?.blockedUsers || [];
    } catch (error) {
      logger.error('Error getting blocked users', error as Error);
      return [];
    }
  }

  static async isUserBlocked(otherUserId: string): Promise<boolean> {
    try {
      const response = await api.get(`/safety/blocked/${otherUserId}`);

      if (!response.success) {
        logger.error('Error checking if user is blocked', new Error(response.message));
        return false;
      }

      return (response as any).userHasBlocked || (response.data as any)?.userHasBlocked || false;
    } catch (error) {
      logger.error('Error checking if user is blocked', error as Error, { otherUserId });
      return false;
    }
  }

  // ==================== REPORTING ====================

  static async reportUser(
    reportedUserId: string,
    category: ReportCategory,
    description: string,
    evidence: string[] = []
  ): Promise<ReportResponse> {
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
        reportId: (response.data as any)?.reportId,
        reportedUserId,
        category,
      });

      return { success: true, reportId: (response.data as any)?.reportId };
    } catch (error) {
      logger.error('Error creating report', error as Error, { reportedUserId, category });
      return { success: false, error: (error as Error).message };
    }
  }

  static getReportCategories(): ReportCategoryItem[] {
    return [
      { id: 'inappropriate_photos', label: '📸 Inappropriate Photos', color: Colors.accent.red },
      { id: 'fake_profile', label: '👤 Fake Profile', color: '#FFD93D' },
      { id: 'harassment', label: '💬 Harassment/Abuse', color: '#6BCB77' },
      { id: 'scam', label: '⚠️ Scam', color: '#4D96FF' },
      { id: 'offensive_behavior', label: '😠 Offensive Behavior', color: Colors.accent.pink },
      { id: 'other', label: '📋 Other', color: '#9D84B7' },
    ];
  }

  // ==================== PHOTO VERIFICATION ====================

  static async submitPhotoVerification(photoUri: string, livenessCheck: Partial<LivenessData> = {}): Promise<ReportResponse> {
    try {
      return await this.submitAdvancedPhotoVerification(photoUri, {
        method: livenessCheck.method || 'basic',
        faceDetected: livenessCheck.livenessPassed || false,
        livenessPassed: livenessCheck.livenessPassed || false,
        confidence: livenessCheck.confidence || 0,
        ...livenessCheck,
      });
    } catch (error) {
      logger.error('Error submitting photo verification', error as Error);
      return { success: false, error: (error as Error).message || 'Failed to submit verification' };
    }
  }

  static async getPhotoVerificationStatus(): Promise<PhotoVerificationStatus> {
    try {
      const response = await api.get('/safety/photo-verification/status');

      if (!response.success) {
        logger.error('Error getting verification status', new Error(response.message));
        return { verified: false, status: 'error' };
      }

      return (response.data as PhotoVerificationStatus) || { verified: false, status: 'not_submitted' };
    } catch (error) {
      logger.error('Error getting verification status', error as Error);
      return { verified: false, status: 'error' };
    }
  }

  static async submitAdvancedPhotoVerification(photoUri: string, livenessData: Partial<LivenessData> = {}): Promise<ReportResponse> {
    try {
      const response = await api.post('/safety/photo-verification/advanced', {
        photoUri,
        livenessData: {
          method: livenessData.method || 'advanced',
          faceDetected: livenessData.faceDetected || false,
          livenessPassed: livenessData.livenessPassed || false,
          confidence: livenessData.confidence || 0,
          challenges: livenessData.challenges || [],
          completedChallenges: livenessData.completedChallenges || [],
          faceQuality: livenessData.faceQuality || 0,
          imageQuality: livenessData.imageQuality || 0,
          spoofingRisk: livenessData.spoofingRisk || 'low',
          matchWithProfilePhoto: livenessData.matchWithProfilePhoto || 0,
        },
      });

      if (!response.success) {
        logger.error('Error submitting advanced verification', new Error(response.message));
        return { success: false, error: response.message || 'Failed to submit verification' };
      }

      const verificationId = (response.data as any)?.verificationId || (response.data as any)?.verification?.id;
      logger.info('Advanced verification submitted', {
        verificationId,
        type: 'liveness_detection',
      });

      return { success: true, reportId: verificationId };
    } catch (error) {
      logger.error('Error submitting advanced verification', error as Error);
      return { success: false, error: (error as Error).message || 'Failed to submit verification' };
    }
  }

  // ==================== CONTENT MODERATION ====================

  static async flagContent(
    contentType: ContentType,
    contentId: string,
    reason: FlagReason,
    description: string = ''
  ): Promise<ReportResponse> {
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

      logger.info('Content flagged', {
        flagId: (response.data as any)?.flagId || (response as any).flag?.id,
        contentType,
        contentId,
        reason,
      });

      return {
        success: true,
        reportId: (response.data as any)?.flagId || (response as any).flag?.id,
      };
    } catch (error) {
      logger.error('Error flagging content', error as Error, { contentType, contentId, reason });
      return { success: false, error: (error as Error).message || 'Failed to flag content' };
    }
  }

  static async getContentFlags(contentId: string): Promise<any[]> {
    try {
      logger.warn('getContentFlags: Backend endpoint not available, returning empty array');
      return [];
    } catch (error) {
      logger.error('Error getting content flags', error as Error, { contentId });
      return [];
    }
  }

  // ==================== INTERACTION SAFETY ====================

  static async canInteractWith(targetUserId: string): Promise<InteractionCheck> {
    try {
      const response = await api.get(`/safety/blocked/${targetUserId}`);

      if (!response.success) {
        logger.error('Error checking interaction', new Error(response.message), { targetUserId });
        return { allowed: false, reason: 'error' };
      }

      const canInteract = (response as any).canInteract || (response.data as any)?.canInteract || false;

      if (!canInteract) {
        let reason: InteractionCheck['reason'] = 'unknown';
        if ((response as any).userHasBlocked || (response.data as any)?.userHasBlocked) {
          reason = 'user_blocked_target';
        } else if ((response as any).blockedByOther || (response.data as any)?.blockedByOther) {
          reason = 'blocked_by_user';
        }
        return { allowed: false, reason };
      }

      return { allowed: true };
    } catch (error) {
      logger.error('Error checking interaction', error as Error, { targetUserId });
      return { allowed: false, reason: 'error' };
    }
  }

  // ==================== SAFETY TIPS ====================

  static async getSafetyTips(): Promise<SafetyTip[]> {
    try {
      const response = await api.get('/safety/tips');

      if (!response.success) {
        logger.error('Error getting safety tips', new Error(response.message));
        return this.getFallbackSafetyTips();
      }

      return (response.data as SafetyTip[]) || (response as any).tips || [];
    } catch (error) {
      logger.error('Error getting safety tips', error as Error);
      return this.getFallbackSafetyTips();
    }
  }

  static getFallbackSafetyTips(): SafetyTip[] {
    return [
      {
        id: 1,
        title: 'Protect Your Personal Information',
        category: 'privacy',
        tips: [
          "Don't share your home address or phone number in your profile",
          'Avoid mentioning your workplace or routine schedule',
          'Never send money or financial information to someone you just met',
          'Be cautious about location-based personal details',
        ],
        icon: '🔐',
      },
      {
        id: 2,
        title: 'Verify Before Meeting',
        category: 'verification',
        tips: [
          'Video call before meeting in person for the first time',
          'Ask for and verify photo authenticity',
          'Check their social media profiles if available',
          'Ask clarifying questions about their background',
          'Trust your instincts - if something feels off, it probably is',
        ],
        icon: '✅',
      },
      {
        id: 3,
        title: 'Safe First Meeting',
        category: 'meeting',
        tips: [
          'Always meet in a public place with good lighting',
          'Tell a friend where you are and who you are meeting',
          'Have an exit plan and means of transportation',
          'Keep your phone charged and accessible',
          'Trust your gut - cancel if you feel unsafe',
          'Avoid excessive alcohol on first dates',
        ],
        icon: '📍',
      },
      {
        id: 4,
        title: 'Online Interaction Safety',
        category: 'online',
        tips: [
          'Use the app for messaging - avoid giving phone numbers quickly',
          'Report suspicious behavior immediately',
          'Block users who make you uncomfortable',
          'Never share intimate photos with unverified users',
          'Be aware of romance scams and catfishing',
          'Verify unusual requests or stories',
        ],
        icon: '💬',
      },
      {
        id: 5,
        title: 'Red Flags to Watch For',
        category: 'warning',
        tips: [
          'Inconsistent stories or photos that look altered',
          'Pressure to move conversations off the app quickly',
          'Requests for money, gifts, or financial help',
          'Love bombing or moving too fast emotionally',
          'Resistance to video calls or meeting in person',
          'Asking for intimate photos early on',
          'Excessive compliments or flattery',
        ],
        icon: '⚠️',
      },
      {
        id: 6,
        title: 'If Something Goes Wrong',
        category: 'emergency',
        tips: [
          'Report the user immediately through the app',
          'Block the user to prevent further contact',
          'Save evidence of inappropriate behavior',
          'Contact local authorities if threatened',
          'Reach out to trusted friends or family',
          'Consider counseling if you experience trauma',
          'File a police report for serious crimes',
        ],
        icon: '🚨',
      },
    ];
  }

  static async getSafetyTipsByCategory(category: SafetyTip['category']): Promise<SafetyTip[]> {
    try {
      const allTips = await this.getSafetyTips();
      return allTips.filter((tip) => tip.category === category);
    } catch (error) {
      logger.error('Error getting safety tips by category', error as Error, { category });
      return [];
    }
  }

  // ==================== SAFETY SCORE ====================

  static async calculateSafetyScore(userId: string): Promise<SafetyScore | null> {
    try {
      const response = await api.get(`/safety/safety-score/${userId}`);

      if (!response.success) {
        logger.error('Error getting safety score', new Error(response.message), { userId });
        return null;
      }

      return (response as any).safetyScore || (response.data as SafetyScore) || null;
    } catch (error) {
      logger.error('Error calculating safety score', error as Error, { userId });
      return null;
    }
  }

  // ==================== DATE PLANS ====================

  static async shareDatePlan(datePlanData: DatePlanData, friendIds: string[] = []): Promise<ReportResponse> {
    try {
      const response = await api.post('/safety/date-plan', {
        matchUserId: datePlanData.matchUserId,
        matchName: datePlanData.matchName,
        matchPhotoUrl: datePlanData.matchPhotoUrl,
        location: datePlanData.location,
        address: datePlanData.address,
        coordinates: datePlanData.coordinates,
        dateTime: datePlanData.dateTime,
        notes: datePlanData.notes || '',
        friendIds,
      });

      if (!response.success) {
        logger.error('Error sharing date plan', new Error(response.message), {
          matchUserId: datePlanData.matchUserId,
        });
        return { success: false, error: response.message || 'Failed to share date plan' };
      }

      const datePlanId = (response.data as any)?.datePlanId || (response.data as any)?.datePlan?.id;
      logger.info('Date plan shared', {
        datePlanId,
        matchUserId: datePlanData.matchUserId,
      });

      return { success: true, reportId: datePlanId };
    } catch (error) {
      logger.error('Error sharing date plan', error as Error, {
        matchUserId: datePlanData.matchUserId,
      });
      return { success: false, error: (error as Error).message || 'Failed to share date plan' };
    }
  }

  static async getActiveDatePlans(): Promise<DatePlan[]> {
    try {
      const response = await api.get('/safety/date-plans/active');

      if (!response.success) {
        logger.error('Error getting active date plans', new Error(response.message));
        return [];
      }

      return (response.data as DatePlan[]) || [];
    } catch (error) {
      logger.error('Error getting date plans', error as Error);
      return [];
    }
  }

  static async getSharedDatePlans(): Promise<DatePlan[]> {
    try {
      const response = await api.get('/safety/date-plans/shared');

      if (!response.success) {
        logger.error('Error getting shared date plans', new Error(response.message));
        return [];
      }

      return (response.data as DatePlan[]) || [];
    } catch (error) {
      logger.error('Error getting shared date plans', error as Error);
      return [];
    }
  }

  static async updateDatePlanStatus(datePlanId: string, status: DatePlanStatus): Promise<ReportResponse> {
    try {
      const response = await api.put(`/safety/date-plan/${datePlanId}`, { status });

      if (!response.success) {
        logger.error('Error updating date plan', new Error(response.message), {
          datePlanId,
          status,
        });
        return { success: false, error: response.message || 'Failed to update date plan' };
      }

      logger.info('Date plan updated', { datePlanId, status });
      return { success: true };
    } catch (error) {
      logger.error('Error updating date plan', error as Error, { datePlanId, status });
      return { success: false, error: (error as Error).message };
    }
  }

  // ==================== CHECK-IN TIMER ====================

  static async startCheckInTimer(datePlanId: string, duration: number = 300): Promise<ReportResponse> {
    try {
      const response = await api.post('/safety/checkin/start', {
        datePlanId,
        duration,
      });

      if (!response.success) {
        logger.error('Error starting check-in timer', new Error(response.message), { datePlanId });
        return { success: false, error: response.message || 'Failed to start check-in' };
      }

      const checkInId = (response.data as any)?.checkInId || (response.data as any)?.checkIn?.id;
      logger.info('Check-in timer started', { checkInId, datePlanId, duration });

      return { success: true, reportId: checkInId };
    } catch (error) {
      logger.error('Error starting check-in timer', error as Error, { datePlanId });
      return { success: false, error: (error as Error).message || 'Failed to start check-in' };
    }
  }

  static async completeCheckIn(checkInId: string): Promise<ReportResponse> {
    try {
      const response = await api.post(`/safety/checkin/${checkInId}/complete`);

      if (!response.success) {
        logger.error('Error completing check-in', new Error(response.message), { checkInId });
        return { success: false, error: response.message || 'Failed to complete check-in' };
      }

      logger.info('Check-in completed', { checkInId });
      return { success: true };
    } catch (error) {
      logger.error('Error completing check-in', error as Error, { checkInId });
      return { success: false, error: (error as Error).message || 'Failed to complete check-in' };
    }
  }

  static async getActiveCheckIns(): Promise<CheckInData[]> {
    try {
      const response = await api.get('/safety/checkin/active');

      if (!response.success) {
        logger.error('Error getting active check-ins', new Error(response.message));
        return [];
      }

      return (response.data as CheckInData[]) || [];
    } catch (error) {
      logger.error('Error getting check-ins', error as Error);
      return [];
    }
  }

  // ==================== EMERGENCY SOS ====================

  static async sendEmergencySOS(location: Partial<EmergencyLocation> = {}, emergencyMessage: string = ''): Promise<ReportResponse> {
    try {
      const response = await api.post('/safety/sos', {
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address || '',
        },
        message: emergencyMessage,
      });

      if (!response.success) {
        logger.error('Error sending SOS', new Error(response.message), { location });
        return { success: false, error: response.message || 'Failed to send SOS' };
      }

      const sosAlertId = (response.data as any)?.sosAlertId || (response.data as any)?.sosAlert?.id;
      logger.info('SOS alert created', { sosAlertId, location });

      return { success: true, reportId: sosAlertId };
    } catch (error) {
      logger.error('Error sending SOS', error as Error, { location });
      return { success: false, error: (error as Error).message || 'Failed to send SOS' };
    }
  }

  static async getActiveSOS(): Promise<SOSAlert[]> {
    try {
      const response = await api.get('/safety/sos/active');

      if (!response.success) {
        logger.error('Error getting active SOS', new Error(response.message));
        return [];
      }

      return (response.data as SOSAlert[]) || [];
    } catch (error) {
      logger.error('Error getting SOS alerts', error as Error);
      return [];
    }
  }

  static async respondToSOS(sosAlertId: string, sosResponse: SOSResponse = {}): Promise<ReportResponse> {
    try {
      const apiResponse = await api.post(`/safety/sos/${sosAlertId}/respond`, {
        message: sosResponse.message || '',
        confirmedSafe: sosResponse.confirmedSafe || false,
        contactInfo: sosResponse.contactInfo || '',
      });

      if (!apiResponse.success) {
        logger.error('Error responding to SOS', new Error(apiResponse.message), { sosAlertId });
        return { success: false, error: apiResponse.message || 'Failed to respond to SOS' };
      }

      logger.info('SOS response recorded', { sosAlertId });
      return { success: true };
    } catch (error) {
      logger.error('Error responding to SOS', error as Error, { sosAlertId });
      return { success: false, error: (error as Error).message || 'Failed to respond to SOS' };
    }
  }

  static async resolveSOS(sosAlertId: string, status: SOSStatus = 'resolved'): Promise<ReportResponse> {
    try {
      const response = await api.post(`/safety/sos/${sosAlertId}/resolve`, {
        status,
      });

      if (!response.success) {
        logger.error('Error resolving SOS', new Error(response.message), { sosAlertId, status });
        return { success: false, error: response.message || 'Failed to resolve SOS' };
      }

      logger.info('SOS alert resolved', { sosAlertId, status });
      return { success: true };
    } catch (error) {
      logger.error('Error resolving SOS', error as Error, { sosAlertId, status });
      return { success: false, error: (error as Error).message || 'Failed to resolve SOS' };
    }
  }

  // ==================== BACKGROUND CHECK ====================

  static async initiateBackgroundCheck(userInfo: BackgroundCheckInfo = {}): Promise<ReportResponse> {
    try {
      const response = await api.post('/safety/background-check', {
        userInfo: {
          firstName: userInfo.firstName || '',
          lastName: userInfo.lastName || '',
          dateOfBirth: userInfo.dateOfBirth || '',
          email: userInfo.email || '',
          phone: userInfo.phone || '',
          address: userInfo.address || '',
          ...userInfo,
        },
      });

      if (!response.success) {
        logger.error('Error initiating background check', new Error(response.message), {
          userInfo,
        });
        return { success: false, error: response.message || 'Failed to initiate background check' };
      }

      const backgroundCheckId =
        (response.data as any)?.backgroundCheckId || (response.data as any)?.backgroundCheck?.id;
      logger.info('Background check requested', { backgroundCheckId });

      return { success: true, reportId: backgroundCheckId };
    } catch (error) {
      logger.error('Error initiating background check', error as Error, { userInfo });
      return { success: false, error: (error as Error).message || 'Failed to initiate background check' };
    }
  }

  static async getBackgroundCheckStatus(backgroundCheckId: string): Promise<BackgroundCheck> {
    try {
      const response = await api.get(`/safety/background-check/${backgroundCheckId}`);

      if (!response.success) {
        logger.error('Error getting background check status', new Error(response.message), {
          backgroundCheckId,
        });
        return {
          id: backgroundCheckId,
          userId: '',
          status: 'error',
          requestedAt: new Date().toISOString(),
        };
      }

      const statusData = (response.data || response) as Partial<BackgroundCheck>;
      return {
        id: backgroundCheckId,
        userId: statusData.userId || '',
        status: statusData.status || 'not_initiated',
        results: statusData.results || {},
        checks: statusData.checks || {},
        requestedAt: statusData.requestedAt || new Date().toISOString(),
        completedAt: statusData.completedAt,
        estimatedCompletion: statusData.estimatedCompletion,
      };
    } catch (error) {
      logger.error('Error getting background check status', error as Error, { backgroundCheckId });
      return {
        id: backgroundCheckId,
        userId: '',
        status: 'error',
        requestedAt: new Date().toISOString(),
      };
    }
  }

  static async updateBackgroundCheckResults(backgroundCheckId: string, results: Record<string, any> = {}): Promise<ReportResponse> {
    try {
      const response = await api.put(`/safety/background-check/${backgroundCheckId}`, {
        results,
        status: results.status || 'in_progress',
      });

      if (!response.success) {
        logger.error('Error updating background check', new Error(response.message), {
          backgroundCheckId,
        });
        return { success: false, error: response.message || 'Failed to update background check' };
      }

      logger.info('Background check updated', { backgroundCheckId });
      return { success: true };
    } catch (error) {
      logger.error('Error updating background check', error as Error, { backgroundCheckId });
      return { success: false, error: (error as Error).message };
    }
  }

  // ==================== EMERGENCY CONTACTS ====================

  static async getEmergencyContacts(): Promise<EmergencyContact[]> {
    try {
      const response = await api.get('/safety/emergency-contacts');

      if (!response.success) {
        logger.error('Error getting emergency contacts', new Error(response.message));
        return [];
      }

      return (response.data as EmergencyContact[]) || [];
    } catch (error) {
      logger.error('Error getting emergency contacts', error as Error);
      return [];
    }
  }

  static async addEmergencyContact(contactInfo: EmergencyContact): Promise<ReportResponse & { contact?: EmergencyContact }> {
    try {
      const response = await api.post('/safety/emergency-contact', {
        name: contactInfo.name,
        phone: contactInfo.phone,
        relationship: contactInfo.relationship,
      });

      if (!response.success) {
        logger.error('Error adding emergency contact', new Error(response.message), {
          contactInfo,
        });
        return { success: false, error: response.message || 'Failed to add emergency contact' };
      }

      const contact = (response.data as EmergencyContact) || (response.data as any)?.contact;
      logger.info('Emergency contact added', { contactId: contact?.id });

      return { success: true, contact };
    } catch (error) {
      logger.error('Error adding emergency contact', error as Error, { contactInfo });
      return { success: false, error: (error as Error).message || 'Failed to add emergency contact' };
    }
  }

  static async deleteEmergencyContact(contactId: string): Promise<ReportResponse> {
    try {
      const response = await api.delete(`/safety/emergency-contact/${contactId}`);

      if (!response.success) {
        logger.error('Error deleting emergency contact', new Error(response.message), {
          contactId,
        });
        return { success: false, error: response.message || 'Failed to delete emergency contact' };
      }

      logger.info('Emergency contact deleted', { contactId });
      return { success: true };
    } catch (error) {
      logger.error('Error deleting emergency contact', error as Error, { contactId });
      return { success: false, error: (error as Error).message || 'Failed to delete emergency contact' };
    }
  }

  // ==================== NOTIFICATIONS ====================

  static async createNotification(userId: string, notificationData: NotificationData): Promise<boolean> {
    try {
      const response = await api.post('/notifications/send', {
        userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        data: notificationData.data || {},
      });

      if (!response.success) {
        logger.error('Error creating notification', new Error(response.message), { userId, type: notificationData.type });
        return false;
      }

      logger.info('Notification created successfully', { userId, type: notificationData.type });
      return true;
    } catch (error) {
      logger.error('Error creating notification', error as Error, { userId, type: notificationData.type });
      return false;
    }
  }

  // ==================== VALIDATION ====================

  static validateReport(category: string, description: string): ValidationResult {
    const errors: string[] = [];

    if (!category || category.trim() === '') {
      errors.push('Please select a report category');
    }

    if (!description || description.trim().length < 10) {
      errors.push('Please provide at least 10 characters of detail');
    }

    if (description && description.length > 500) {
      errors.push('Description cannot exceed 500 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateDatePlan(datePlan: Partial<DatePlanData>): ValidationResult {
    const errors: string[] = [];

    if (!datePlan.location || datePlan.location.trim() === '') {
      errors.push('Location is required');
    }

    if (!datePlan.dateTime) {
      errors.push('Date and time are required');
    }

    if (datePlan.dateTime && new Date(datePlan.dateTime) < new Date()) {
      errors.push('Date must be in the future');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateEmergencyContact(contact: Partial<EmergencyContact>): ValidationResult {
    const errors: string[] = [];

    if (!contact.name || contact.name.trim() === '') {
      errors.push('Contact name is required');
    }

    if (!contact.phone || !/^\d{10}/.test(contact.phone.replace(/\D/g, ''))) {
      errors.push('Valid phone number is required');
    }

    if (!contact.relationship || contact.relationship.trim() === '') {
      errors.push('Relationship is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default SafetyService;
