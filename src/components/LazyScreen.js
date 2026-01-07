import PropTypes from 'prop-types';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/colors';
import logger from '../utils/logger';

/**
 * LazyScreen Component
 *
 * A wrapper component for lazy loading screens in React Native.
 * Unlike web React where React.lazy() works out of the box, React Native
 * requires a custom approach for code splitting.
 *
 * Features:
 * - Deferred component loading with animated transitions
 * - Loading state with customizable placeholder
 * - Error handling with retry capability
 * - Memory efficient unmounting
 */

const LoadingPlaceholder = memo(({ message = 'Loading...' }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const nativeDriver = Platform.OS !== 'web';
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: nativeDriver,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: nativeDriver,
        }),
      ])
    ).start();
  }, [fadeAnim]);

  return (
    <View style={styles.loadingContainer}>
      <Animated.View style={[styles.loadingContent, { opacity: fadeAnim }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{message}</Text>
      </Animated.View>
    </View>
  );
});

LoadingPlaceholder.displayName = 'LoadingPlaceholder';
LoadingPlaceholder.propTypes = {
  message: PropTypes.string,
};

/**
 * Creates a lazy-loaded screen component
 * @param {Function} importFn - Dynamic import function, e.g. () => import('./Screen')
 * @param {Object} options - Configuration options
 * @returns {React.Component} - Lazy loaded component wrapper
 */
export function createLazyScreen(importFn, options = {}) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/052d01ac-3f86-4688-97f8-e0e7268e5f14',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LazyScreen.js:63',message:'createLazyScreen entry',data:{displayName:options?.displayName,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const {
    loadingMessage = 'Loading...',
    minLoadingTime = 200, // Minimum loading time to prevent flashing
    preload = false, // Whether to start loading immediately
  } = options;

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/052d01ac-3f86-4688-97f8-e0e7268e5f14',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LazyScreen.js:70',message:'Before variable declarations',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  let cachedComponent = null;
  let loadPromise = null;
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/052d01ac-3f86-4688-97f8-e0e7268e5f14',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LazyScreen.js:72',message:'After variable declarations',data:{cachedComponent:typeof cachedComponent,loadPromise:typeof loadPromise,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  // Preload the component if requested
  if (preload) {
    loadPromise = importFn().then((module) => {
      cachedComponent = module.default || module;
      return cachedComponent;
    });
  }

  const LazyComponent = (props) => {
    // FIX: Pass a function that returns cachedComponent to avoid useState executing
    // cachedComponent if it's a functional component (which useState treats as a lazy initializer)
    const [Component, setComponent] = useState(() => cachedComponent);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(!cachedComponent);

    // Ensure props is always an object (fixes "Cannot destructure property 'navigation' of 'undefined'")
    const safeProps = props || {};

    const loadComponent = useCallback(async () => {
      if (cachedComponent) {
        setComponent(() => cachedComponent);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const startTime = Date.now();

        // Use existing promise if preloading, otherwise create new
        const promise = loadPromise || importFn();
        const module = await promise;

        logger.debug(`LazyScreen loaded module for ${options.displayName}`, {
          hasDefault: !!module.default,
          isModule: typeof module,
          keys: Object.keys(module),
        });

        // Ensure minimum loading time for smooth UX
        const elapsed = Date.now() - startTime;
        if (elapsed < minLoadingTime) {
          await new Promise((resolve) => setTimeout(resolve, minLoadingTime - elapsed));
        }

        cachedComponent = module.default || module;

        if (
          typeof cachedComponent === 'object' &&
          cachedComponent !== null &&
          !cachedComponent.$$typeof
        ) {
          logger.warn(
            `LazyScreen: Component is an object but not a React element/type for ${options.displayName}`,
            {
              keys: Object.keys(cachedComponent),
            }
          );
        }

        setComponent(() => cachedComponent);
      } catch (err) {
        logger.error('Lazy loading error', err);
        // Ensure error is always a string, not an object
        const errorMessage = err?.message || err?.toString() || 'Failed to load component';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      loadComponent();
    }, [loadComponent]);

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load screen</Text>
          <Text
            style={styles.retryText}
            onPress={() => {
              cachedComponent = null;
              loadPromise = null;
              loadComponent();
            }}
          >
            Tap to retry
          </Text>
        </View>
      );
    }

    if (loading || !Component) {
      return <LoadingPlaceholder message={loadingMessage} />;
    }

    // Pass safe props to component (ensures navigation and other props are always available)
    return <Component {...safeProps} />;
  };

  LazyComponent.displayName = `Lazy(${options.displayName || 'Component'})`;

  // Add preload method for prefetching
  LazyComponent.preload = () => {
    if (!cachedComponent && !loadPromise) {
      loadPromise = importFn().then((module) => {
        logger.debug(`LazyScreen preloaded module for ${options.displayName}`, {
          hasDefault: !!module.default,
          keys: Object.keys(module),
        });
        cachedComponent = module.default || module;
        return cachedComponent;
      });
    }
    return loadPromise;
  };

  return LazyComponent;
}

/**
 * Suspense-like wrapper for React Native
 * Renders fallback while children are loading
 */
export const SuspenseWrapper = ({ children, fallback }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure children have mounted
    const timer = setTimeout(() => setIsReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return fallback || <LoadingPlaceholder />;
  }

  return children;
};

SuspenseWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
};

/**
 * Hook to preload multiple screens at once
 * Useful for preloading likely navigation destinations
 */
export function usePreloadScreens(screens) {
  useEffect(() => {
    // Preload screens after initial render
    const timer = setTimeout(() => {
      screens.forEach((screen) => {
        if (screen && typeof screen.preload === 'function') {
          screen.preload();
        }
      });
    }, 1000); // Delay preloading to not affect initial load

    return () => clearTimeout(timer);
  }, [screens]);
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background?.light || Colors.background.lightest,
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.text?.secondary || '#6c757d',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background?.light || Colors.background.lightest,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error || '#dc3545',
    marginBottom: 12,
    textAlign: 'center',
  },
  retryText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    padding: 10,
  },
});

export { LoadingPlaceholder };
export default createLazyScreen;
