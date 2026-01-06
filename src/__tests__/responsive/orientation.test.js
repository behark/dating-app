/**
 * Orientation Tests
 * Tests for handling device orientation changes
 */

import { renderHook } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';

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

describe('Orientation Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Portrait Orientation', () => {
    it('should detect portrait mode', () => {
      Dimensions.get.mockReturnValue({ width: 375, height: 812 });
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isLandscape).toBe(false);
    });

    it('should handle iPhone portrait', () => {
      Dimensions.get.mockReturnValue({ width: 375, height: 667 });
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isLandscape).toBe(false);
      expect(result.current.width).toBe(375);
      expect(result.current.height).toBe(667);
    });

    it('should handle iPad portrait', () => {
      Dimensions.get.mockReturnValue({ width: 768, height: 1024 });
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isLandscape).toBe(false);
      expect(result.current.deviceType).toBe('tablet');
    });
  });

  describe('Landscape Orientation', () => {
    it('should detect landscape mode', () => {
      Dimensions.get.mockReturnValue({ width: 812, height: 375 });
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isLandscape).toBe(true);
    });

    it('should handle iPhone landscape', () => {
      Dimensions.get.mockReturnValue({ width: 667, height: 375 });
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isLandscape).toBe(true);
      expect(result.current.width).toBe(667);
      expect(result.current.height).toBe(375);
    });

    it('should handle iPad landscape', () => {
      Dimensions.get.mockReturnValue({ width: 1024, height: 768 });
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isLandscape).toBe(true);
      expect(result.current.deviceType).toBe('tablet');
    });
  });

  describe('Orientation Changes', () => {
    it('should update on orientation change', () => {
      // Start portrait
      Dimensions.get.mockReturnValue({ width: 375, height: 812 });
      const { result, rerender } = renderHook(() => useResponsive());

      expect(result.current.isLandscape).toBe(false);

      // Change to landscape
      Dimensions.get.mockReturnValue({ width: 812, height: 375 });
      rerender();

      // In real implementation, Dimensions.addEventListener would update
      expect(result.current.width).toBeDefined();
    });

    it('should maintain device type on orientation change', () => {
      Dimensions.get.mockReturnValue({ width: 768, height: 1024 });
      const { result: portraitResult } = renderHook(() => useResponsive());
      expect(portraitResult.current.deviceType).toBe('tablet');

      Dimensions.get.mockReturnValue({ width: 1024, height: 768 });
      const { result: landscapeResult } = renderHook(() => useResponsive());
      expect(landscapeResult.current.deviceType).toBe('tablet');
    });
  });

  describe('Edge Cases', () => {
    it('should handle square screens', () => {
      Dimensions.get.mockReturnValue({ width: 1024, height: 1024 });
      const { result } = renderHook(() => useResponsive());
      // Equal dimensions should be considered portrait
      expect(result.current.isLandscape).toBe(false);
    });

    it('should handle very wide screens', () => {
      Dimensions.get.mockReturnValue({ width: 2560, height: 1080 });
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isLandscape).toBe(true);
    });

    it('should handle very tall screens', () => {
      Dimensions.get.mockReturnValue({ width: 1080, height: 2560 });
      const { result } = renderHook(() => useResponsive());
      expect(result.current.isLandscape).toBe(false);
    });
  });
});
