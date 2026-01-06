// Hooks exports
export { useResponsive, useBreakpoint, useResponsiveValue, BREAKPOINTS } from './useResponsive';
export { useOffline } from './useOffline';
export { useUpdate } from './useUpdate';

// Re-export default exports (imported separately to avoid no-named-as-default warning)
import useResponsiveDefault from './useResponsive';
import useOfflineDefault from './useOffline';
import useUpdateDefault from './useUpdate';

export default {
  useResponsive: useResponsiveDefault,
  useOffline: useOfflineDefault,
  useUpdate: useUpdateDefault,
};
