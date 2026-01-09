// Hooks exports
export { useResponsive, useBreakpoint, useResponsiveValue, BREAKPOINTS } from './useResponsive';
export { useOffline } from './useOffline';
export { useUpdate } from './useUpdate';
export { default as useLocation } from './useLocation';
export { default as useCardDeck } from './useCardDeck';
export { default as useFilters } from './useFilters';
export { useSwipeActions } from './useSwipeActions';
export { useDebounce } from './useDebounce';
export { useNetworkStatus } from './useNetworkStatus';
export { useSocket } from './useSocket';
export { useBetaTesting } from './useBetaTesting';
export { useInAppPurchase } from './useInAppPurchase';
export { useBehaviorAnalytics } from './useBehaviorAnalytics';
export { useAuthState } from './useAuthState';

// Re-export default exports (imported separately to avoid no-named-as-default warning)
import useResponsiveDefault from './useResponsive';
import useOfflineDefault from './useOffline';
import useUpdateDefault from './useUpdate';
import useLocationDefault from './useLocation';
import useCardDeckDefault from './useCardDeck';
import useFiltersDefault from './useFilters';

export default {
  useResponsive: useResponsiveDefault,
  useOffline: useOfflineDefault,
  useUpdate: useUpdateDefault,
  useLocation: useLocationDefault,
  useCardDeck: useCardDeckDefault,
  useFilters: useFiltersDefault,
};
