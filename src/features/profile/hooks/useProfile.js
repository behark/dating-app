import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProfileService } from '../../../services/ProfileService';
import logger from '../../../utils/logger';
import HapticFeedback from '../../../utils/haptics';

// ─── Query Keys ──────────────────────────────────────────────────────────────
export const profileQueryKeys = {
  myProfile: ['profile', 'me'],
  badges: (userId) => ['profile', 'badges', userId],
};

// ─── useProfile ──────────────────────────────────────────────────────────────
/**
 * Encapsulates all TanStack Query v5 logic for the current user's profile.
 *
 * NOTE: TanStack Query v5 removed onSuccess/onError from useQuery.
 * Side-effects on query data changes are handled via useEffect.
 *
 * @param {object} options
 * @param {string|null} options.userId       - Firebase UID of the current user
 * @param {Function}    options.onSaveSuccess - Called after a successful profile save
 */
export const useProfile = ({ userId, onSaveSuccess } = {}) => {
  const queryClient = useQueryClient();

  // ── Fetch: my profile ─────────────────────────────────────────────────────
  const {
    data: profileData,
    isLoading: profileLoading,
    isError: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: profileQueryKeys.myProfile,
    queryFn: () => ProfileService.getMyProfile(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Log errors via useEffect (onError removed in TanStack Query v5)
  useEffect(() => {
    if (profileError) {
      logger.error('Error loading profile (query failed)');
    }
  }, [profileError]);

  // ── Fetch: user badges ────────────────────────────────────────────────────
  const { data: userBadges = [] } = useQuery({
    queryKey: profileQueryKeys.badges(userId),
    queryFn: async () => {
      const { GamificationService } = await import('../../../services/GamificationService');
      const badges = await GamificationService.getUserBadges(userId);
      return badges || [];
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });

  // ── Mutation: save profile ────────────────────────────────────────────────
  const saveProfileMutation = useMutation({
    mutationFn: (profileUpdate) => ProfileService.updateProfile(profileUpdate),
    onMutate: () => {
      HapticFeedback.mediumImpact();
    },
    onSuccess: () => {
      HapticFeedback.successNotification();
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.myProfile });
      Alert.alert('Success', 'Profile updated successfully!');
      onSaveSuccess?.();
    },
    onError: (error) => {
      logger.error('Error saving profile:', error);
      HapticFeedback.errorNotification();
      Alert.alert('Error', 'Failed to save profile');
    },
  });

  return {
    profileData,
    profileLoading,
    profileError,
    refetchProfile,
    userBadges,
    saveProfile: saveProfileMutation.mutate,
    isSaving: saveProfileMutation.isPending,
  };
};

export default useProfile;
