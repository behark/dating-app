/**
 * Performance Optimization Utilities
 * Helpers for load time optimization and bundle size reduction
 */

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, InteractionManager, View } from 'react-native';

// ==================== LAZY LOADING ====================

/**
 * Create a lazy-loaded component with loading fallback
 */
export const lazyLoad = (importFn, fallback = null) => {
  const LazyComponent = lazy(importFn);

  const LazyWrapper = (props) => (
    <Suspense fallback={fallback || <DefaultLoadingFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
  LazyWrapper.displayName = 'LazyWrapper';

  return LazyWrapper;
};

/**
 * Default loading fallback component
 */
const DefaultLoadingFallback = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color="#667eea" />
  </View>
);
DefaultLoadingFallback.displayName = 'DefaultLoadingFallback';

// ==================== DEFERRED RENDERING ====================

/**
 * Hook to defer heavy operations until after interaction
 * Improves initial render time
 */
export const useDeferredValue = (value, delay = 0) => {
  const [deferredValue, setDeferredValue] = useState(value);

  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => {
      if (delay > 0) {
        setTimeout(() => setDeferredValue(value), delay);
      } else {
        setDeferredValue(value);
      }
    });

    return () => handle.cancel();
  }, [value, delay]);

  return deferredValue;
};

/**
 * Defer rendering of heavy components
 */
export const DeferredRender = ({ children, delay = 0, placeholder = null }) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => {
      if (delay > 0) {
        setTimeout(() => setShouldRender(true), delay);
      } else {
        setShouldRender(true);
      }
    });

    return () => handle.cancel();
  }, [delay]);

  return shouldRender ? children : placeholder;
};

// ==================== MEMOIZATION ====================

/**
 * Deep comparison hook for complex objects
 */
export const useDeepMemo = (factory, deps) => {
  const ref = useRef();

  if (!ref.current || !deepEqual(ref.current.deps, deps)) {
    ref.current = { deps, value: factory() };
  }

  return ref.current.value;
};

/**
 * Deep equality check
 */
const deepEqual = (a, b) => {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
      return false;
    }
  }

  return true;
};

// ==================== DEBOUNCING & THROTTLING ====================

/**
 * Debounce hook
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Debounced callback hook
 */
export const useDebouncedCallback = (callback, delay) => {
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

/**
 * Throttle hook
 */
export const useThrottle = (value, interval) => {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastExecuted = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    if (now >= lastExecuted.current + interval) {
      lastExecuted.current = now;
      setThrottledValue(value);
    } else {
      const timerId = setTimeout(() => {
        lastExecuted.current = Date.now();
        setThrottledValue(value);
      }, interval);

      return () => clearTimeout(timerId);
    }
  }, [value, interval]);

  return throttledValue;
};

// ==================== IMAGE OPTIMIZATION ====================

/**
 * Get optimized image URL based on container size
 */
export const getOptimizedImageUrl = (url, { width, height, format = 'webp' }) => {
  if (!url) return null;

  // If using Cloudinary
  if (url.includes('cloudinary')) {
    const transformations = [
      `w_${Math.round(width)}`,
      `h_${Math.round(height)}`,
      'c_fill',
      'f_auto',
      'q_auto',
    ].join(',');

    return url.replace('/upload/', `/upload/${transformations}/`);
  }

  // If using custom CDN with image processing
  if (url.includes('cdn.') || url.includes('cloudfront')) {
    const params = new URLSearchParams({
      w: Math.round(width),
      h: Math.round(height),
      fit: 'cover',
      format,
      quality: 80,
    });

    return `${url}?${params.toString()}`;
  }

  return url;
};

/**
 * Generate srcset for responsive images
 */
export const generateSrcSet = (baseUrl, sizes = [320, 640, 960, 1280]) => {
  return sizes
    .map((size) => `${getOptimizedImageUrl(baseUrl, { width: size, height: size })} ${size}w`)
    .join(', ');
};

// ==================== BUNDLE OPTIMIZATION ====================

/**
 * Dynamic import with preloading
 */
export const preloadComponent = (importFn) => {
  const Component = lazy(importFn);

  // Start loading immediately
  importFn();

  return Component;
};

/**
 * Preload multiple components
 */
export const preloadComponents = (imports) => {
  return imports.map((importFn) => preloadComponent(importFn));
};

// ==================== NETWORK OPTIMIZATION ====================

/**
 * Request queue for rate limiting API calls
 */
class RequestQueue {
  constructor(maxConcurrent = 3, minDelay = 100) {
    this.maxConcurrent = maxConcurrent;
    this.minDelay = minDelay;
    this.queue = [];
    this.running = 0;
    this.lastRequestTime = 0;
  }

  async add(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.minDelay) {
      setTimeout(() => this.process(), this.minDelay - timeSinceLastRequest);
      return;
    }

    this.running++;
    this.lastRequestTime = Date.now();

    const { requestFn, resolve, reject } = this.queue.shift();

    try {
      const result = await requestFn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.process();
    }
  }
}

export const requestQueue = new RequestQueue();

// ==================== MEMORY OPTIMIZATION ====================

/**
 * Hook to track and cleanup subscriptions
 */
export const useSubscriptions = () => {
  const subscriptions = useRef([]);

  const add = useCallback((unsubscribe) => {
    subscriptions.current.push(unsubscribe);
  }, []);

  useEffect(() => {
    return () => {
      subscriptions.current.forEach((unsubscribe) => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
      subscriptions.current = [];
    };
  }, []);

  return add;
};

/**
 * Limit array size to prevent memory issues
 */
export const limitArraySize = (array, maxSize) => {
  if (array.length <= maxSize) return array;
  return array.slice(-maxSize);
};

// ==================== RENDER OPTIMIZATION ====================

/**
 * Hook to check if component is mounted
 */
export const useMounted = () => {
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  return mounted;
};

/**
 * Safe setState that checks if component is mounted
 */
export const useSafeState = (initialValue) => {
  const mounted = useMounted();
  const [state, setState] = useState(initialValue);

  const safeSetState = useCallback(
    (value) => {
      if (mounted.current) {
        setState(value);
      }
    },
    [mounted]
  );

  return [state, safeSetState];
};

/**
 * Hook to measure render performance
 */
export const useRenderCount = (componentName) => {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    // eslint-disable-next-line no-undef
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log(`[Render] ${componentName}: ${renderCount.current}`);
    }
  });

  return renderCount.current;
};

// ==================== INFINITE SCROLL OPTIMIZATION ====================

/**
 * Hook for optimized infinite scroll with prefetching
 */
export const useInfiniteScroll = ({
  fetchData,
  threshold = 0.5,
  prefetchThreshold = 0.7,
  onPrefetch,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const prefetchTriggered = useRef(false);

  const handleScroll = useCallback(
    (event) => {
      if (!hasMore || isLoading) return;

      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const paddingToBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
      const percentFromBottom = paddingToBottom / layoutMeasurement.height;

      // Prefetch when approaching threshold
      if (percentFromBottom < prefetchThreshold && !prefetchTriggered.current) {
        prefetchTriggered.current = true;
        onPrefetch?.();
      }

      // Load more when at threshold
      if (percentFromBottom < threshold) {
        setIsLoading(true);
        fetchData()
          .then((moreAvailable) => {
            setHasMore(moreAvailable !== false);
            prefetchTriggered.current = false;
          })
          .finally(() => setIsLoading(false));
      }
    },
    [fetchData, hasMore, isLoading, threshold, prefetchThreshold, onPrefetch]
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setHasMore(true);
    prefetchTriggered.current = false;
  }, []);

  return { handleScroll, isLoading, hasMore, reset };
};

/**
 * Cursor-based pagination hook
 */
export const useCursorPagination = (fetchFn, initialCursor = null) => {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(initialCursor);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn(cursor);
      setItems((prev) => [...prev, ...result.items]);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [cursor, fetchFn, hasMore, isLoading]);

  const refresh = useCallback(async () => {
    setCursor(null);
    setItems([]);
    setHasMore(true);
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn(null);
      setItems(result.items);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn]);

  return { items, loadMore, refresh, isLoading, hasMore, error };
};

// ==================== CDN IMAGE OPTIMIZATION ====================

const CDN_URL = process.env.EXPO_PUBLIC_CDN_URL || '';

/**
 * Image size presets matching backend
 */
export const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150, quality: 70 },
  small: { width: 300, height: 400, quality: 75 },
  medium: { width: 600, height: 800, quality: 80 },
  large: { width: 1200, height: 1600, quality: 85 },
};

/**
 * Get CDN-optimized image URL
 */
export const getCdnImageUrl = (url, size = 'medium', format = 'webp') => {
  if (!url || !CDN_URL) return url;

  const sizeConfig = IMAGE_SIZES[size] || IMAGE_SIZES.medium;
  const params = new URLSearchParams({
    w: sizeConfig.width.toString(),
    h: sizeConfig.height.toString(),
    q: sizeConfig.quality.toString(),
    f: format,
    fit: 'cover',
  });

  if (url.startsWith('/')) {
    return `${CDN_URL}${url}?${params.toString()}`;
  }

  if (url.includes(CDN_URL)) {
    const base = url.split('?')[0];
    return `${base}?${params.toString()}`;
  }

  return url;
};

/**
 * Preload images for smoother experience
 */
export const preloadImages = async (urls, size = 'medium') => {
  const { Image, Platform } = require('react-native');

  const optimizedUrls = urls.filter(Boolean).map((url) => getCdnImageUrl(url, size));

  if (Platform.OS === 'web') {
    return Promise.all(
      optimizedUrls.map((url) => {
        return new Promise((resolve) => {
          const img = new window.Image();
          img.onload = resolve;
          img.onerror = resolve; // Don't fail on single image error
          img.src = url;
        });
      })
    );
  }

  return Promise.all(optimizedUrls.map((url) => Image.prefetch(url).catch(() => null)));
};

// ==================== PERFORMANCE MONITORING ====================

/**
 * Performance timing tracker
 */
export const performanceTracker = {
  marks: new Map(),

  start(label) {
    this.marks.set(label, {
      startTime: Date.now(),
      startMemory: typeof performance !== 'undefined' ? performance?.memory?.usedJSHeapSize : null,
    });
  },

  end(label) {
    const mark = this.marks.get(label);
    if (!mark) return null;

    const duration = Date.now() - mark.startTime;
    this.marks.delete(label);

    // Log slow operations in development
    // eslint-disable-next-line no-undef
    if (typeof __DEV__ !== 'undefined' && __DEV__ && duration > 500) {
      console.warn(`[Performance] ${label}: ${duration}ms`);
    }

    return { label, duration };
  },

  async measure(label, fn) {
    this.start(label);
    try {
      const result = await fn();
      this.end(label);
      return result;
    } catch (error) {
      this.end(label);
      throw error;
    }
  },
};

// ==================== EXPORTS ====================

export default {
  lazyLoad,
  useDeferredValue,
  DeferredRender,
  useDeepMemo,
  useDebounce,
  useDebouncedCallback,
  useThrottle,
  getOptimizedImageUrl,
  generateSrcSet,
  preloadComponent,
  preloadComponents,
  requestQueue,
  useSubscriptions,
  limitArraySize,
  useMounted,
  useSafeState,
  useRenderCount,
  // New exports for infinite scroll & CDN
  useInfiniteScroll,
  useCursorPagination,
  getCdnImageUrl,
  preloadImages,
  performanceTracker,
  IMAGE_SIZES,
};
