// Hooks exports
export { useResponsive, useBreakpoint, useResponsiveValue, BREAKPOINTS } from './useResponsive';
export { useOffline } from './useOffline';

// Re-export default as well
import useResponsive from './useResponsive';
import useOffline from './useOffline';

export default {
  useResponsive,
  useOffline,
};
