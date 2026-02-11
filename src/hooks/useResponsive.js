import { useEffect, useState } from 'react';
import { Dimensions, PixelRatio, Platform } from 'react-native';

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
  if (width <= BREAKPOINTS.lg) return 'tablet';
  return 'desktop';
};

const getBreakpoint = (width) => {
  if (width < BREAKPOINTS.sm) return 'xs';
  if (width < BREAKPOINTS.md) return 'sm';
  if (width < BREAKPOINTS.lg) return 'md';
  if (width < BREAKPOINTS.xl) return 'lg';
  return 'xl';
};

const getWindowDimensions = () => Dimensions.get('window');

const createResponsiveState = ({ width, height }) => {
  const deviceType = getDeviceType(width);
  const isLandscape = width > height;

  return {
    width,
    height,
    screenWidth: width,
    screenHeight: height,
    isLandscape,
    isPortrait: !isLandscape,
    deviceType,
    breakpoint: getBreakpoint(width),
    platform: Platform.OS,
    isWeb: Platform.OS === 'web',
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
    responsive: (values) => {
      if (deviceType === 'desktop') return values.desktop ?? values.tablet ?? values.mobile;
      if (deviceType === 'tablet') return values.tablet ?? values.mobile ?? values.desktop;
      return values.mobile ?? values.tablet ?? values.desktop;
    },
    scale: (value) => (width / 375) * value,
    fontScale: (size) => {
      const scaled = (width / 375) * size;
      const roundToNearestPixel =
        typeof PixelRatio.roundToNearestPixel === 'function'
          ? PixelRatio.roundToNearestPixel
          : (value) => value;
      const rounded = roundToNearestPixel(scaled);
      const normalized = Number.isFinite(rounded) ? rounded : scaled;
      return Math.round(normalized);
    },
  };
};

/**
 * Hook to get responsive dimensions and device info
 */
export const useResponsive = () => {
  const [dimensions, setDimensions] = useState(() => createResponsiveState(getWindowDimensions()));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(createResponsiveState(window));
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
  return (getWindowDimensions().width / baseWidth) * value;
};

export const responsiveHeight = (value) => {
  return (getWindowDimensions().height / baseHeight) * value;
};

export const responsiveFontSize = (size) => {
  const { width } = getWindowDimensions();
  const scale = width / baseWidth;
  const newSize = size * scale;
  const roundToNearestPixel =
    typeof PixelRatio.roundToNearestPixel === 'function'
      ? PixelRatio.roundToNearestPixel
      : (value) => value;
  const rounded = roundToNearestPixel(newSize);
  const normalized = Number.isFinite(rounded) ? rounded : newSize;

  if (Platform.OS === 'ios') {
    return Math.round(normalized);
  }
  return Math.round(normalized) - 2;
};

/**
 * Get responsive value based on breakpoint
 * @param {Object} values - { xs: value, sm: value, md: value, lg: value, xl: value }
 * @param {number} currentWidth - Current screen width
 */
export const getResponsiveValue = (values, currentWidth = getWindowDimensions().width) => {
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
  const { width, height } = getWindowDimensions();
  const isLandscape = width > height;
  const deviceType = getDeviceType(width);

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
