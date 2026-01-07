import { useCallback, useEffect, useRef } from 'react';
import { UserBehaviorAnalytics } from '../../services/UserBehaviorAnalytics';

/**
 * Hook to track swipe behavior with pattern analysis
 *
 * @example
 * const { trackSwipe, getAnalytics, patterns } = useSwipeAnalytics();
 *
 * // When user swipes
 * trackSwipe('right', { age: 25, distance: 5, verified: true });
 */
export function useSwipeAnalytics() {
  const getAnalytics = useCallback(() => {
    return UserBehaviorAnalytics.getSwipeAnalytics();
  }, []);

  const trackSwipe = useCallback((direction, profileData = {}) => {
    return UserBehaviorAnalytics.trackSwipe(direction, profileData);
  }, []);

  const startNewSession = useCallback(() => {
    UserBehaviorAnalytics.startNewSwipeSession();
  }, []);

  return {
    trackSwipe,
    getAnalytics,
    startNewSession,
  };
}

/**
 * Hook to track screen time and feature usage
 *
 * @example
 * const { trackFeature } = useTimeTracking('HomeScreen');
 *
 * // When user uses a feature
 * trackFeature('photo_zoom', { photoIndex: 2 });
 */
export function useTimeTracking(screenName) {
  useEffect(() => {
    if (screenName) {
      UserBehaviorAnalytics.startScreenTracking(screenName);
    }

    return () => {
      UserBehaviorAnalytics.endScreenTracking();
    };
  }, [screenName]);

  const trackFeature = useCallback(
    (featureName, metadata = {}) => {
      UserBehaviorAnalytics.trackFeatureUsage(featureName, {
        screen: screenName,
        ...metadata,
      });
    },
    [screenName]
  );

  const getTimeAnalytics = useCallback(() => {
    return UserBehaviorAnalytics.getTimeAnalytics();
  }, []);

  return {
    trackFeature,
    getTimeAnalytics,
  };
}

/**
 * Hook to track conversion funnel progress
 *
 * @example
 * const { trackStep, getFunnelData } = useFunnelTracking('premium');
 *
 * // When user completes a step
 * trackStep('plan_selected');
 */
export function useFunnelTracking(funnelName, userId) {
  const trackStep = useCallback(
    (stepName) => {
      UserBehaviorAnalytics.trackFunnelStep(funnelName, stepName, userId);
    },
    [funnelName, userId]
  );

  const getFunnelData = useCallback(() => {
    return UserBehaviorAnalytics.getFunnelAnalytics(funnelName);
  }, [funnelName]);

  return {
    trackStep,
    getFunnelData,
  };
}

/**
 * Hook for A/B testing with automatic variant tracking
 *
 * @example
 * const { variant, trackConversion } = useABTest('onboarding_flow');
 *
 * // Render based on variant
 * if (variant === 'simplified') {
 *   return <SimplifiedOnboarding />;
 * }
 *
 * // Track conversion
 * trackConversion('signup_completed', 1);
 */
export function useABTest(testId, userId) {
  const variantRef = useRef(null);

  // Get variant only once per component lifecycle
  if (variantRef.current === null) {
    variantRef.current = UserBehaviorAnalytics.getVariant(testId, userId);
  }

  const trackConversion = useCallback(
    (eventName = 'conversion', value = 1) => {
      UserBehaviorAnalytics.trackABConversion(testId, userId, eventName, value);
    },
    [testId, userId]
  );

  const getTestResults = useCallback(() => {
    return UserBehaviorAnalytics.getABTestResults(testId);
  }, [testId]);

  return {
    variant: variantRef.current,
    trackConversion,
    getTestResults,
  };
}

/**
 * Hook to get comprehensive analytics summary
 *
 * @example
 * const { summary, exportData } = useAnalyticsSummary();
 */
export function useAnalyticsSummary() {
  const getSummary = useCallback(() => {
    return UserBehaviorAnalytics.getAnalyticsSummary();
  }, []);

  const exportData = useCallback(() => {
    return UserBehaviorAnalytics.exportAnalyticsData();
  }, []);

  return {
    getSummary,
    exportData,
  };
}

/**
 * Combined hook for common analytics needs
 *
 * @example
 * const analytics = useBehaviorAnalytics({
 *   screenName: 'HomeScreen',
 *   funnelName: 'engagement',
 *   userId: user.id,
 * });
 */
export function useBehaviorAnalytics({ screenName, funnelName, userId, abTests = [] }) {
  const timeTracking = useTimeTracking(screenName);
  const swipeAnalytics = useSwipeAnalytics();
  // Always call hooks unconditionally - React hooks rules
  const funnelTracking = useFunnelTracking(funnelName || '', userId);

  // Get variants for all specified A/B tests
  // Note: Hooks cannot be called conditionally per React rules
  // Always call the hook, but use a dummy test ID if no tests provided
  const firstTestId = abTests.length > 0 ? abTests[0] : '__dummy__';
  const firstTestVariant = useABTest(firstTestId, userId);

  const variants = {};
  if (abTests.length > 0) {
    // Use the hook result for the first test
    variants[abTests[0]] = {
      variant: firstTestVariant.variant,
      trackConversion: firstTestVariant.trackConversion,
    };

    // For additional tests, get variants without hooks (synchronous API calls)
    for (let i = 1; i < abTests.length; i++) {
      const testId = abTests[i];
      const variant = UserBehaviorAnalytics.getVariant(testId, userId);
      const trackConversion = (eventName = 'conversion', value = 1) => {
        UserBehaviorAnalytics.trackABConversion(testId, userId, eventName, value);
      };
      variants[testId] = { variant, trackConversion };
    }
  }

  return {
    // Time tracking
    trackFeature: timeTracking.trackFeature,
    getTimeAnalytics: timeTracking.getTimeAnalytics,

    // Swipe analytics
    trackSwipe: swipeAnalytics.trackSwipe,
    getSwipeAnalytics: swipeAnalytics.getAnalytics,
    startNewSwipeSession: swipeAnalytics.startNewSession,

    // Funnel tracking (only if funnelName was provided)
    trackFunnelStep: funnelName ? funnelTracking.trackStep : undefined,
    getFunnelData: funnelName ? funnelTracking.getFunnelData : undefined,

    // A/B test variants
    variants,

    // Summary
    getSummary: () => UserBehaviorAnalytics.getAnalyticsSummary(),
    exportData: () => UserBehaviorAnalytics.exportAnalyticsData(),
  };
}

export default {
  useSwipeAnalytics,
  useTimeTracking,
  useFunnelTracking,
  useABTest,
  useAnalyticsSummary,
  useBehaviorAnalytics,
};
