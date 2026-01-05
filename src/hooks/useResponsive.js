import { useEffect, useState } from 'react';
import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Breakpoints for responsive design
export const BREAKPOINTS = {
  xs: 0,
  sm: 360,
  md: 768,
  lg: 1024,
  xl: 1280,
};

// Device type detection
export const getDeviceType = (width) => {
  if (width < BREAKPOINTS.md) return 'mobile';
  if (width < BREAKPOINTS.lg) return 'tablet';
  return 'desktop';
};

/**
 * Hook to get responsive dimensions and device info
 */
export const useResponsive = () => {
  const [dimensions, setDimensions] = useState({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    isLandscape: SCREEN_WIDTH > SCREEN_HEIGHT,
    deviceType: getDeviceType(SCREEN_WIDTH),
    platform: Platform.OS,
    isWeb: Platform.OS === 'web',
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({
        width: window.width,
        height: window.height,
        isLandscape: window.width > window.height,
        deviceType: getDeviceType(window.width),
        platform: Platform.OS,
        isWeb: Platform.OS === 'web',
        isIOS: Platform.OS === 'ios',
        isAndroid: Platform.OS === 'android',
      });
    });

    return () => subscription?.remove();
  }, []);

  return dimensions;
};

/**
 * Hook to check if current width matches a breakpoint
 */
export const useBreakpoint = () => {
  const { width } = useResponsive();

  return {
    isXs: width >= BREAKPOINTS.xs && width < BREAKPOINTS.sm,
    isSm: width >= BREAKPOINTS.sm && width < BREAKPOINTS.md,
    isMd: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isLg: width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl,
    isXl: width >= BREAKPOINTS.xl,
    // Utility helpers
    isMobile: width < BREAKPOINTS.md,
    isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isDesktop: width >= BREAKPOINTS.lg,
  };
};

/**
 * Responsive scaling utilities
 * Based on standard screen width of 375 (iPhone X)
 */
const baseWidth = 375;
const baseHeight = 812;

export const responsiveWidth = (value) => {
  return (SCREEN_WIDTH / baseWidth) * value;
};

export const responsiveHeight = (value) => {
  return (SCREEN_HEIGHT / baseHeight) * value;
};

export const responsiveFontSize = (size) => {
  const scale = SCREEN_WIDTH / baseWidth;
  const newSize = size * scale;

  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
};

/**
 * Get responsive value based on breakpoint
 * @param {Object} values - { xs: value, sm: value, md: value, lg: value, xl: value }
 * @param {number} currentWidth - Current screen width
 */
export const getResponsiveValue = (values, currentWidth = SCREEN_WIDTH) => {
  if (currentWidth >= BREAKPOINTS.xl && values.xl !== undefined) return values.xl;
  if (currentWidth >= BREAKPOINTS.lg && values.lg !== undefined) return values.lg;
  if (currentWidth >= BREAKPOINTS.md && values.md !== undefined) return values.md;
  if (currentWidth >= BREAKPOINTS.sm && values.sm !== undefined) return values.sm;
  return values.xs !== undefined ? values.xs : values.sm || values.md || values.lg || values.xl;
};

/**
 * Hook to get responsive value based on current screen size
 */
export const useResponsiveValue = (values) => {
  const { width } = useResponsive();
  return getResponsiveValue(values, width);
};

/**
 * Create responsive styles object
 */
export const createResponsiveStyles = (stylesCreator) => {
  const { width, height, isLandscape, deviceType } = {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    isLandscape: SCREEN_WIDTH > SCREEN_HEIGHT,
    deviceType: getDeviceType(SCREEN_WIDTH),
  };

  return stylesCreator({
    width,
    height,
    isLandscape,
    deviceType,
    rw: responsiveWidth,
    rh: responsiveHeight,
    rf: responsiveFontSize,
    rv: (values) => getResponsiveValue(values, width),
  });
};

export default {
  useResponsive,
  useBreakpoint,
  useResponsiveValue,
  responsiveWidth,
  responsiveHeight,
  responsiveFontSize,
  getResponsiveValue,
  createResponsiveStyles,
  BREAKPOINTS,
};
