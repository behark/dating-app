/**
 * Viewport Configuration
 * Centralized viewport configurations for testing
 */

export const VIEWPORT_CONFIGS = {
  // Mobile devices
  mobile: {
    iPhoneSE: { width: 320, height: 568 },
    iPhone8: { width: 375, height: 667 },
    iPhoneX: { width: 375, height: 812 },
    iPhone11Pro: { width: 390, height: 844 },
    iPhone11ProMax: { width: 414, height: 896 },
    iPhone12Pro: { width: 390, height: 844 },
    iPhone12ProMax: { width: 428, height: 926 },
    GalaxyS20: { width: 360, height: 800 },
    Pixel5: { width: 393, height: 851 },
  },

  // Tablet devices
  tablet: {
    iPad: { width: 768, height: 1024 },
    iPadPro11: { width: 834, height: 1194 },
    iPadPro12: { width: 1024, height: 1366 },
    GalaxyTab: { width: 800, height: 1280 },
  },

  // Desktop/Laptop
  desktop: {
    HD: { width: 1280, height: 720 },
    MacBook: { width: 1440, height: 900 },
    MacBookPro: { width: 1680, height: 1050 },
    FullHD: { width: 1920, height: 1080 },
    QHD: { width: 2560, height: 1440 },
    UHD: { width: 3840, height: 2160 },
  },
};

export const BREAKPOINTS = {
  mobile: { max: 767 },
  tablet: { min: 768, max: 1023 },
  desktop: { min: 1024 },
};

export function getViewportsForBreakpoint(breakpoint: 'mobile' | 'tablet' | 'desktop') {
  switch (breakpoint) {
    case 'mobile':
      return Object.values(VIEWPORT_CONFIGS.mobile);
    case 'tablet':
      return Object.values(VIEWPORT_CONFIGS.tablet);
    case 'desktop':
      return Object.values(VIEWPORT_CONFIGS.desktop);
    default:
      return [];
  }
}

export function isViewportInBreakpoint(
  width: number,
  breakpoint: 'mobile' | 'tablet' | 'desktop'
): boolean {
  switch (breakpoint) {
    case 'mobile':
      return width <= BREAKPOINTS.mobile.max;
    case 'tablet':
      return width >= BREAKPOINTS.tablet.min && width <= BREAKPOINTS.tablet.max;
    case 'desktop':
      return width >= BREAKPOINTS.desktop.min;
    default:
      return false;
  }
}
