import { Dimensions, Platform } from 'react-native';

// Performance API polyfill for React Native
const performance = global.performance || {
  now: () => Date.now(),
};

/**
 * Performance utilities for optimizing React Native components
 */

// Device capabilities
export const deviceCapabilities = {
  screen: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    pixelRatio: Dimensions.get('window').scale,
  },
  platform: Platform.OS,
  version: Platform.Version,
};

// Performance thresholds
export const PERFORMANCE_THRESHERS = {
  RENDER_TIME_WARNING: 16, // 60fps = ~16ms per frame
  LIST_ITEM_HEIGHT: 100,
  MAX_VISIBLE_ITEMS: 10,
  IMAGE_CACHE_SIZE: 50,
  API_TIMEOUT: 10000,
};

/**
 * Measure render time of components
 */
export class RenderTimer {
  constructor(name = 'Component') {
    this.name = name;
    this.startTime = null;
  }

  start() {
    this.startTime = performance.now();
    return this;
  }

  end() {
    if (!this.startTime) {
      if (__DEV__) console.warn(`${this.name}: Timer not started`);
      return;
    }

    const duration = performance.now() - this.startTime;
    if (duration > PERFORMANCE_THRESHERS.RENDER_TIME_WARNING) {
      if (__DEV__) console.warn(`${this.name} render took ${duration.toFixed(2)}ms (slow)`);
    } else {
      if (__DEV__) console.log(`${this.name} render: ${duration.toFixed(2)}ms`);
    }

    this.startTime = null;
    return duration;
  }
}

/**
 * Memory usage estimator for arrays
 */
export const estimateMemoryUsage = {
  /**
   * Estimate memory usage of user array
   */
  users: (users) => {
    if (!Array.isArray(users)) return 0;

    // Rough estimation: 2KB per user profile
    const baseMemoryPerUser = 2048; // 2KB
    return users.length * baseMemoryPerUser;
  },

  /**
   * Estimate memory usage of images
   */
  images: (imageUrls, averageSizeKB = 500) => {
    if (!Array.isArray(imageUrls)) return 0;
    return imageUrls.length * averageSizeKB * 1024; // Convert to bytes
  },

  /**
   * Format bytes to human readable
   */
  formatBytes: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  },
};

/**
 * Optimize list rendering performance
 */
export const listOptimizations = {
  /**
   * Calculate optimal initial render count based on device
   */
  getOptimalInitialRenderCount: (itemHeight = PERFORMANCE_THRESHERS.LIST_ITEM_HEIGHT) => {
    const screenHeight = deviceCapabilities.screen.height;
    const optimalCount = Math.ceil(screenHeight / itemHeight) + 2; // +2 for buffer
    return Math.min(optimalCount, PERFORMANCE_THRESHERS.MAX_VISIBLE_ITEMS);
  },

  /**
   * Calculate optimal window size for FlatList
   */
  getOptimalWindowSize: (initialNumToRender) => {
    return Math.max(10, initialNumToRender * 2);
  },

  /**
   * Get optimized FlatList props
   */
  getOptimizedFlatListProps: (customProps = {}) => {
    const initialNumToRender = listOptimizations.getOptimalInitialRenderCount();
    const windowSize = listOptimizations.getOptimalWindowSize(initialNumToRender);

    return {
      initialNumToRender,
      maxToRenderPerBatch: 5,
      windowSize,
      updateCellsBatchingPeriod: 50,
      removeClippedSubviews: Platform.OS === 'android',
      getItemLayout: customProps.getItemLayout, // Preserve if provided
      ...customProps,
    };
  },
};

/**
 * Image optimization utilities
 */
export const imageOptimizations = {
  /**
   * Get optimal image dimensions based on container size
   */
  getOptimalImageSize: (containerWidth, containerHeight, imageAspectRatio = 1) => {
    const pixelRatio = deviceCapabilities.screen.pixelRatio;
    const maxWidth = containerWidth * pixelRatio;
    const maxHeight = containerHeight * pixelRatio;

    // Calculate dimensions maintaining aspect ratio
    let width = maxWidth;
    let height = width / imageAspectRatio;

    if (height > maxHeight) {
      height = maxHeight;
      width = height * imageAspectRatio;
    }

    return {
      width: Math.round(width),
      height: Math.round(height),
      pixelRatio,
    };
  },

  /**
   * Generate responsive image URLs
   */
  generateResponsiveUrls: (baseUrl, sizes = [320, 640, 1024]) => {
    return sizes.map((size) => ({
      uri: `${baseUrl}?w=${size}&fit=crop&auto=format`,
      width: size,
    }));
  },
};

/**
 * Debounce utility for performance-critical functions
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

/**
 * Throttle utility for performance-critical functions
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Performance monitoring hook
 */
export const usePerformanceMonitor = (componentName) => {
  const renderTimer = new RenderTimer(componentName);

  const startRender = () => renderTimer.start();
  const endRender = () => renderTimer.end();

  return {
    startRender,
    endRender,
  };
};

/**
 * Memory warning detection
 */
export const memoryWarnings = {
  /**
   * Check if app is using too much memory
   */
  shouldOptimize: (itemCount, itemType = 'items') => {
    const estimatedMemory = estimateMemoryUsage.users(itemCount);
    const threshold = 50 * 1024 * 1024; // 50MB threshold

    if (estimatedMemory > threshold) {
      console.warn(
        `High memory usage detected: ${estimateMemoryUsage.formatBytes(estimatedMemory)} for ${itemCount} ${itemType}`
      );
      return true;
    }

    return false;
  },
};

export default {
  deviceCapabilities,
  PERFORMANCE_THRESHERS,
  RenderTimer,
  estimateMemoryUsage,
  listOptimizations,
  imageOptimizations,
  debounce,
  throttle,
  usePerformanceMonitor,
  memoryWarnings,
};
