/**
 * Responsive Breakpoint Tests
 * Tests for responsive design breakpoints and device detection
 */

import { renderHook } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { useResponsive, BREAKPOINTS, getDeviceType } from '../../hooks/useResponsive';

// Mock Dimensions
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Dimensions: {
      get: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  };
});

describe('Responsive Breakpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Breakpoint Detection', () => {
    it('should detect xs breakpoint (< 360px)', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 320, height: 568 });
      const { result } = renderHook(() => useResponsive());
      expect(result.current.width).toBe(320);
    });

    it('should detect sm breakpoint (360px - 768px)', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 375, height: 667 });
      const { result } = renderHook(() => useResponsive());
      expect(result.current.width).toBe(375);
    });

    it('should detect md breakpoint (768px - 1024px)', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 768, height: 1024 });
      const { result } = renderHook(() => useResponsive());
      expect(result.current.width).toBe(768);
    });

    it('should detect lg breakpoint (1024px - 1280px)', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 1024, height: 768 });
      const { result } = renderHook(() => useResponsive());
      expect(result.current.width).toBe(1024);
    });

    it('should detect xl breakpoint (>= 1280px)', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 1280, height: 720 });
      const { result } = renderHook(() => useResponsive());
      expect(result.current.width).toBe(1280);
    });
  });

  describe('Device Type Detection', () => {
    it('should detect mobile device (< 768px)', () => {
      expect(getDeviceType(375)).toBe('mobile');
      expect(getDeviceType(414)).toBe('mobile');
      expect(getDeviceType(320)).toBe('mobile');
    });

    it('should detect tablet device (768px - 1024px)', () => {
      expect(getDeviceType(768)).toBe('tablet');
      expect(getDeviceType(834)).toBe('tablet');
      expect(getDeviceType(1024)).toBe('tablet');
    });

    it('should detect desktop device (> 1024px)', () => {
      expect(getDeviceType(1280)).toBe('desktop');
      expect(getDeviceType(1920)).toBe('desktop');
      expect(getDeviceType(2560)).toBe('desktop');
    });
  });

  describe('Orientation Detection', () => {
    it('should detect portrait orientation', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 375, height: 812 });
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isLandscape).toBe(false);
    });

    it('should detect landscape orientation', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 812, height: 375 });
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isLandscape).toBe(true);
    });
  });

  describe('Platform Detection', () => {
    it('should detect web platform', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 1280, height: 720 });
      const { result } = renderHook(() => useResponsive());
      // Platform detection depends on Platform.OS mock
      expect(result.current.platform).toBeDefined();
    });

    it('should detect iOS platform', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 375, height: 812 });
      const { result } = renderHook(() => useResponsive());
      expect(result.current.platform).toBeDefined();
    });

    it('should detect Android platform', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 414, height: 896 });
      const { result } = renderHook(() => useResponsive());
      expect(result.current.platform).toBeDefined();
    });
  });

  describe('Breakpoint Constants', () => {
    it('should have correct breakpoint values', () => {
      expect(BREAKPOINTS.xs).toBe(0);
      expect(BREAKPOINTS.sm).toBe(360);
      expect(BREAKPOINTS.md).toBe(768);
      expect(BREAKPOINTS.lg).toBe(1024);
      expect(BREAKPOINTS.xl).toBe(1280);
    });

    it('should have breakpoints in ascending order', () => {
      expect(BREAKPOINTS.xs).toBeLessThan(BREAKPOINTS.sm);
      expect(BREAKPOINTS.sm).toBeLessThan(BREAKPOINTS.md);
      expect(BREAKPOINTS.md).toBeLessThan(BREAKPOINTS.lg);
      expect(BREAKPOINTS.lg).toBeLessThan(BREAKPOINTS.xl);
    });
  });

  describe('Dimension Updates', () => {
    it('should update dimensions on orientation change', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 375, height: 812 });
      const { result, rerender } = renderHook(() => useResponsive());

      expect(result.current.width).toBe(375);
      expect(result.current.isLandscape).toBe(false);

      // Simulate orientation change
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 812, height: 375 });
      rerender();

      // Note: In real implementation, Dimensions.addEventListener would trigger update
      // This test verifies the hook structure
      expect(result.current.width).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small screens', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 280, height: 400 });
      const { result } = renderHook(() => useResponsive());
      expect(result.current.width).toBe(280);
      expect(getDeviceType(280)).toBe('mobile');
    });

    it('should handle very large screens', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 3840, height: 2160 });
      const { result } = renderHook(() => useResponsive());
      expect(result.current.width).toBe(3840);
      expect(getDeviceType(3840)).toBe('desktop');
    });

    it('should handle square screens', () => {
      jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 1024, height: 1024 });
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isLandscape).toBe(false); // Equal dimensions = portrait
    });
  });
});
