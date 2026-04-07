import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PremiumService } from '../../../services/PremiumService';
import { SwipeController } from '../../../services/SwipeController';
import logger from '../../../utils/logger';

// ─── Query Keys ──────────────────────────────────────────────────────────────
export const matchQueryKeys = {
  premiumStatus: (userId) => ['matches', 'premiumStatus', userId],
  receivedLikes: (userId) => ['matches', 'receivedLikes', userId],
};

// ─── useMatches ───────────────────────────────────────────────────────────────
/**
 * TanStack Query v5 hook for the MatchesScreen.
 * NOTE: onSuccess/onError removed from useQuery in v5 — errors are surfaced
 * via isError/error return values and handled in callers as needed.
 */
export const useMatches = ({ userId, authToken, conversations = [] }) => {
  const queryClient = useQueryClient();

  // ── Fetch: premium status ─────────────────────────────────────────────────
  const {
    data: premiumStatus,
    isLoading: premiumLoading,
  } = useQuery({
    queryKey: matchQueryKeys.premiumStatus(userId),
    queryFn: async () => {
      try {
        return await PremiumService.checkPremiumStatus(userId, authToken);
      } catch (error) {
        // Silently fail — premium status not critical for the matches list
        logger.error('Error loading premium status:', error);
        return null;
      }
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });

  const isPremium = premiumStatus?.isPremium ?? false;

  // ── Fetch: received likes ─────────────────────────────────────────────────
  const {
    data: rawReceivedLikes = [],
    isLoading: likesLoading,
    isError: likesError,
    refetch: refetchLikes,
  } = useQuery({
    queryKey: matchQueryKeys.receivedLikes(userId),
    queryFn: async () => {
      const swipes = await SwipeController.getReceivedSwipes(userId);
      return swipes || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Filter out users who are already matched (conversations tab)
  const receivedLikes = useMemo(() => {
    const matchedUserIds = new Set(
      conversations.map((conv) => conv.otherUser?._id || conv.otherUser?.id)
    );

    return rawReceivedLikes
      .filter((swipe) => {
        const swiperId = swipe.swiper || swipe.userId;
        return !matchedUserIds.has(swiperId);
      })
      .map((swipe) => ({
        _id: swipe.id || swipe._id,
        user: {
          id: swipe.swiper || swipe.userId,
          name: swipe.swiperInfo?.name || 'Unknown',
          photoURL: swipe.swiperInfo?.photoURL || swipe.swiperInfo?.photos?.[0]?.url,
          age: swipe.swiperInfo?.age,
        },
        timestamp: swipe.createdAt,
        type: swipe.type || 'like',
      }));
  }, [rawReceivedLikes, conversations]);

  // ── Mutation: unmatch ─────────────────────────────────────────────────────
  const unmatchMutation = useMutation({
    mutationFn: ({ currentUserId, targetUserId }) =>
      SwipeController.unmatch(currentUserId, targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchQueryKeys.receivedLikes(userId) });
    },
    onError: (error) => logger.error('Error unmatching:', error),
  });

  // ── Refresh both queries ──────────────────────────────────────────────────
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: matchQueryKeys.premiumStatus(userId) });
    queryClient.invalidateQueries({ queryKey: matchQueryKeys.receivedLikes(userId) });
  };

  return {
    isPremium,
    premiumLoading,
    receivedLikes,
    likesLoading,
    likesError,
    refetchLikes,
    unmatch: unmatchMutation.mutate,
    isUnmatching: unmatchMutation.isPending,
    isLoading: premiumLoading || likesLoading,
    refresh,
  };
};

export default useMatches;
