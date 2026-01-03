/**
 * Tests for useBetaTesting hook
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-hooks';
import { betaTestingService } from '../../services/BetaTestingService';
import { featureFlagService } from '../../services/FeatureFlagService';
import { useBetaTesting } from '../useBetaTesting';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../services/BetaTestingService', () => ({
  betaTestingService: {
    enrollUser: jest.fn(),
    submitFeedback: jest.fn(),
    submitBugReport: jest.fn(),
    recordSession: jest.fn(),
  },
}));
jest.mock('../../services/FeatureFlagService', () => ({
  featureFlagService: {
    getUserFlags: jest.fn(),
  },
}));

describe('useBetaTesting', () => {
  const mockUserId = 'user_123';
  const mockUserGroups = ['free'];

  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
    AsyncStorage.removeItem.mockResolvedValue();
    featureFlagService.getUserFlags.mockReturnValue({
      beta_video_chat: { enabled: false },
      beta_ai_matching: { enabled: true },
    });
  });

  describe('Initialization', () => {
    it('should initialize with default values', async () => {
      const { result, waitForNextUpdate } = renderHook(() =>
        useBetaTesting(mockUserId, mockUserGroups)
      );

      expect(result.current.isLoading).toBe(true);

      await waitForNextUpdate();

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isBetaUser).toBe(false);
    });

    it('should load enrollment status from storage', async () => {
      AsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({ isEnrolled: true })
      );

      const { result, waitForNextUpdate } = renderHook(() =>
        useBetaTesting(mockUserId, mockUserGroups)
      );

      await waitForNextUpdate();

      expect(result.current.isBetaUser).toBe(true);
    });

    it('should fetch feature flags for user', async () => {
      const { result, waitForNextUpdate } = renderHook(() =>
        useBetaTesting(mockUserId, mockUserGroups)
      );

      await waitForNextUpdate();

      expect(featureFlagService.getUserFlags).toHaveBeenCalledWith(
        mockUserId,
        mockUserGroups
      );
      expect(result.current.featureFlags).toEqual({
        beta_video_chat: { enabled: false },
        beta_ai_matching: { enabled: true },
      });
    });
  });

  describe('Beta Enrollment', () => {
    it('should enroll user in beta program', async () => {
      const mockEnrollment = {
        userId: mockUserId,
        status: 'active',
      };
      betaTestingService.enrollUser.mockReturnValue(mockEnrollment);

      const { result, waitForNextUpdate } = renderHook(() =>
        useBetaTesting(mockUserId, mockUserGroups)
      );

      await waitForNextUpdate();

      await act(async () => {
        const enrollment = await result.current.enrollInBeta({
          email: 'test@test.com',
        });
        expect(enrollment).toEqual(mockEnrollment);
      });

      expect(result.current.isBetaUser).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should allow user to leave beta program', async () => {
      AsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({ isEnrolled: true })
      );

      const { result, waitForNextUpdate } = renderHook(() =>
        useBetaTesting(mockUserId, mockUserGroups)
      );

      await waitForNextUpdate();
      expect(result.current.isBetaUser).toBe(true);

      await act(async () => {
        await result.current.leaveBeta();
      });

      expect(result.current.isBetaUser).toBe(false);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@beta_enrollment');
    });
  });

  describe('Feature Flags', () => {
    it('should check if feature is enabled', async () => {
      const { result, waitForNextUpdate } = renderHook(() =>
        useBetaTesting(mockUserId, mockUserGroups)
      );

      await waitForNextUpdate();

      expect(result.current.isFeatureEnabled('beta_video_chat')).toBe(false);
      expect(result.current.isFeatureEnabled('beta_ai_matching')).toBe(true);
    });

    it('should return false for unknown features', async () => {
      const { result, waitForNextUpdate } = renderHook(() =>
        useBetaTesting(mockUserId, mockUserGroups)
      );

      await waitForNextUpdate();

      expect(result.current.isFeatureEnabled('unknown_feature')).toBe(false);
    });
  });

  describe('Feedback Submission', () => {
    it('should submit feedback', async () => {
      const mockFeedback = { id: 'feedback_1', title: 'Test' };
      betaTestingService.submitFeedback.mockReturnValue(mockFeedback);
      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@pending_feedback') return Promise.resolve('[]');
        return Promise.resolve(null);
      });

      const { result, waitForNextUpdate } = renderHook(() =>
        useBetaTesting(mockUserId, mockUserGroups)
      );

      await waitForNextUpdate();

      await act(async () => {
        const feedback = await result.current.submitFeedback({
          title: 'Test feedback',
          type: 'general',
        });
        expect(feedback).toEqual(mockFeedback);
      });

      expect(betaTestingService.submitFeedback).toHaveBeenCalled();
    });

    it('should submit bug report', async () => {
      const mockBug = { id: 'bug_1', title: 'Bug' };
      betaTestingService.submitBugReport.mockReturnValue(mockBug);

      const { result, waitForNextUpdate } = renderHook(() =>
        useBetaTesting(mockUserId, mockUserGroups)
      );

      await waitForNextUpdate();

      await act(async () => {
        const bug = await result.current.submitBugReport({
          title: 'Test bug',
          severity: 'high',
        });
        expect(bug).toEqual(mockBug);
      });

      expect(betaTestingService.submitBugReport).toHaveBeenCalled();
    });
  });

  describe('Session Tracking', () => {
    it('should start a session', async () => {
      const { result, waitForNextUpdate } = renderHook(() =>
        useBetaTesting(mockUserId, mockUserGroups)
      );

      await waitForNextUpdate();

      await act(async () => {
        await result.current.startSession({ platform: 'ios' });
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@beta_session',
        expect.any(String)
      );
    });

    it('should track screen views', async () => {
      const { result, waitForNextUpdate } = renderHook(() =>
        useBetaTesting(mockUserId, mockUserGroups)
      );

      await waitForNextUpdate();

      await act(async () => {
        await result.current.startSession({});
        result.current.trackScreen('HomeScreen');
        result.current.trackScreen('DiscoveryScreen');
      });

      // The screens should be tracked internally
      // They would be included in the session data when endSession is called
    });

    it('should track actions', async () => {
      const { result, waitForNextUpdate } = renderHook(() =>
        useBetaTesting(mockUserId, mockUserGroups)
      );

      await waitForNextUpdate();

      await act(async () => {
        await result.current.startSession({});
        result.current.trackAction('swipe_right', 'discovery', { profileId: '123' });
      });

      // Actions tracked internally
    });

    it('should end session and record analytics', async () => {
      betaTestingService.recordSession.mockReturnValue({ id: 'session_1' });

      const { result, waitForNextUpdate } = renderHook(() =>
        useBetaTesting(mockUserId, mockUserGroups)
      );

      await waitForNextUpdate();

      await act(async () => {
        await result.current.startSession({ platform: 'ios' });
        result.current.trackScreen('HomeScreen');
        result.current.trackAction('swipe', 'discovery');
      });

      await act(async () => {
        await result.current.endSession('1.0.0');
      });

      expect(betaTestingService.recordSession).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          appVersion: '1.0.0',
        })
      );
    });
  });

  describe('Pending Feedback', () => {
    it('should get pending feedback', async () => {
      const pendingFeedback = [{ id: '1' }, { id: '2' }];
      AsyncStorage.getItem.mockImplementation((key) => {
        if (key === '@pending_feedback') {
          return Promise.resolve(JSON.stringify(pendingFeedback));
        }
        return Promise.resolve(null);
      });

      const { result, waitForNextUpdate } = renderHook(() =>
        useBetaTesting(mockUserId, mockUserGroups)
      );

      await waitForNextUpdate();

      let pending;
      await act(async () => {
        pending = await result.current.getPendingFeedback();
      });

      expect(pending).toEqual(pendingFeedback);
    });

    it('should clear pending feedback', async () => {
      const { result, waitForNextUpdate } = renderHook(() =>
        useBetaTesting(mockUserId, mockUserGroups)
      );

      await waitForNextUpdate();

      await act(async () => {
        await result.current.clearPendingFeedback();
      });

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@pending_feedback');
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const { result, waitForNextUpdate } = renderHook(() =>
        useBetaTesting(mockUserId, mockUserGroups)
      );

      await waitForNextUpdate();

      // Should complete without crashing
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isBetaUser).toBe(false);
    });

    it('should handle enrollment errors', async () => {
      betaTestingService.enrollUser.mockImplementation(() => {
        throw new Error('Enrollment failed');
      });

      const { result, waitForNextUpdate } = renderHook(() =>
        useBetaTesting(mockUserId, mockUserGroups)
      );

      await waitForNextUpdate();

      await expect(
        act(async () => {
          await result.current.enrollInBeta({});
        })
      ).rejects.toThrow('Enrollment failed');
    });
  });
});
