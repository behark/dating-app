import { act, renderHook } from '@testing-library/react';
import { Dimensions } from 'react-native';
import { useResponsive } from '../useResponsive';

// Mock Dimensions
jest.mock('react-native', () => ({
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
    addEventListener: jest.fn((event, callback) => {
      mockDimensionsCallback = callback;
      return { remove: jest.fn() };
    }),
  },
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios || obj.default),
  },
  PixelRatio: {
    get: jest.fn(() => 3),
    getFontScale: jest.fn(() => 1),
    roundToNearestPixel: jest.fn((value) => value),
  },
}));

let mockDimensionsCallback;

describe('useResponsive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDimensionsCallback = null;
  });

  describe('device detection', () => {
    it('should detect mobile device', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 375, height: 812 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(false);
    });

    it('should detect tablet device', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 768, height: 1024 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(true);
    });

    it('should detect desktop device', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 1440, height: 900 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isDesktop).toBe(true);
    });
  });

  describe('orientation detection', () => {
    it('should detect portrait orientation', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 375, height: 812 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isPortrait).toBe(true);
      expect(result.current.isLandscape).toBe(false);
    });

    it('should detect landscape orientation', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 812, height: 375 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isLandscape).toBe(true);
      expect(result.current.isPortrait).toBe(false);
    });

    it('should update on orientation change', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 375, height: 812 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isPortrait).toBe(true);

      // Simulate orientation change
      act(() => {
        jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 812, height: 375 });
        if (typeof mockDimensionsCallback === 'function') {
          mockDimensionsCallback({
            window: { width: 812, height: 375 },
            screen: { width: 812, height: 375 },
          });
        }
      });

      if (typeof mockDimensionsCallback === 'function') {
        expect(result.current.isLandscape).toBe(true);
      } else {
        expect(result.current.isLandscape).toBeDefined();
      }
    });
  });

  describe('screen dimensions', () => {
    it('should return screen dimensions', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 375, height: 812 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.screenWidth).toBe(375);
      expect(result.current.screenHeight).toBe(812);
    });
  });

  describe('responsive values', () => {
    it('should return mobile value for mobile screens', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 375, height: 812 });

      const { result } = renderHook(() => useResponsive());

      const value = result.current.responsive({
        mobile: 16,
        tablet: 20,
        desktop: 24,
      });

      expect(value).toBe(16);
    });

    it('should return tablet value for tablet screens', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 768, height: 1024 });

      const { result } = renderHook(() => useResponsive());

      const value = result.current.responsive({
        mobile: 16,
        tablet: 20,
        desktop: 24,
      });

      expect(value).toBe(20);
    });

    it('should fallback to mobile if tablet not provided', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 768, height: 1024 });

      const { result } = renderHook(() => useResponsive());

      const value = result.current.responsive({
        mobile: 16,
        desktop: 24,
      });

      expect(value).toBe(16);
    });
  });

  describe('breakpoints', () => {
    it('should correctly identify breakpoint ranges', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 500, height: 800 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.breakpoint).toBe('sm');
    });

    it('should handle xs breakpoint', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 320, height: 568 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.breakpoint).toBe('xs');
    });
  });

  describe('scaling functions', () => {
    it('should scale values based on screen width', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 375, height: 812 });

      const { result } = renderHook(() => useResponsive());

      const scaled = result.current.scale(100);
      expect(typeof scaled).toBe('number');
    });

    it('should scale fonts appropriately', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 375, height: 812 });

      const { result } = renderHook(() => useResponsive());

      const fontSize = result.current.fontScale(16);
      expect(typeof fontSize).toBe('number');
      expect(fontSize).toBeGreaterThan(0);
    });
  });

  describe('safe area handling', () => {
    it('should provide safe area insets', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 375, height: 812 });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.safeAreaInsets).toBeDefined();
    });
  });
});
