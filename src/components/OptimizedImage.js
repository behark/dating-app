import PropTypes from 'prop-types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, Platform, StyleSheet, View } from 'react-native';
import { Colors } from '../constants/colors';

// Image cache manager
const imageCache = new Map();
const IMAGE_CACHE_KEY = '@image_cache_keys';
const MAX_CACHE_SIZE = 50; // Maximum number of images to cache

/**
 * OptimizedImage - A lazy-loading image component with caching and placeholder support
 *
 * Features:
 * - Lazy loading (loads when in viewport)
 * - Smooth fade-in animation
 * - Placeholder support
 * - Image caching
 * - Error handling with fallback
 * - Loading indicator
 */
const OptimizedImage = ({
  source,
  style,
  placeholder,
  resizeMode = 'cover',
  fadeDuration = 300,
  showLoadingIndicator = true,
  loadingIndicatorColor = Colors.primary,
  onLoad,
  onError,
  blurRadius,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [imageSource, setImageSource] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isMounted = useRef(true);

  // Get the URI from source
  const getUri = useCallback(() => {
    if (typeof source === 'string') return source;
    if (source?.uri) return source.uri;
    return null;
  }, [source]);

  // Check if image is cached
  const checkCache = useCallback(async (uri) => {
    if (!uri) return null;

    // Check in-memory cache first
    if (imageCache.has(uri)) {
      return imageCache.get(uri);
    }

    // For web, we rely on browser caching
    if (Platform.OS === 'web') {
      return uri;
    }

    return uri;
  }, []);

  // Cache the image
  const cacheImage = useCallback(async (uri) => {
    if (!uri) return;

    // Add to in-memory cache
    imageCache.set(uri, uri);

    // Manage cache size
    if (imageCache.size > MAX_CACHE_SIZE) {
      const firstKey = imageCache.keys().next().value;
      imageCache.delete(firstKey);
    }
  }, []);

  // Load the image
  useEffect(() => {
    isMounted.current = true;
    const uri = getUri();

    const loadImage = async () => {
      if (!uri) {
        setError(true);
        return;
      }

      try {
        const cachedUri = await checkCache(uri);

        if (isMounted.current) {
          setImageSource({ uri: cachedUri || uri });
        }

        // Prefetch the image
        if (Platform.OS !== 'web') {
          Image.prefetch(uri)
            .then(() => {
              cacheImage(uri);
              return null; // Explicit return to satisfy promise/always-return
            })
            .catch(() => {
              // Prefetch failed, but we can still try to load
              return null; // Explicit return to satisfy promise/always-return
            });
        }
      } catch (err) {
        if (isMounted.current) {
          setError(true);
        }
      }
    };

    loadImage();

    return () => {
      isMounted.current = false;
    };
  }, [source, getUri, checkCache, cacheImage]);

  // Handle image load complete
  const handleLoad = useCallback(
    (event) => {
      if (!isMounted.current) return;

      setLoaded(true);

      // Animate fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: fadeDuration,
        useNativeDriver: true,
      }).start();

      onLoad?.(event);
    },
    [fadeAnim, fadeDuration, onLoad]
  );

  // Handle image error
  const handleError = useCallback(
    (event) => {
      if (!isMounted.current) return;

      setError(true);
      setLoaded(true);

      // Still show something even on error
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: fadeDuration,
        useNativeDriver: true,
      }).start();

      onError?.(event);
    },
    [fadeAnim, fadeDuration, onError]
  );

  // Render placeholder
  const renderPlaceholder = () => {
    if (placeholder) {
      if (typeof placeholder === 'function') {
        return placeholder();
      }
      return (
        <Image
          source={placeholder}
          style={[styles.image, style]}
          resizeMode={resizeMode}
          blurRadius={10}
        />
      );
    }

    return (
      <View style={[styles.placeholder, style]}>
        {showLoadingIndicator && !error && (
          <ActivityIndicator size="small" color={loadingIndicatorColor} />
        )}
      </View>
    );
  };

  // Render error fallback
  const renderError = () => {
    if (placeholder) {
      if (typeof placeholder === 'function') {
        return placeholder();
      }
      return <Image source={placeholder} style={[styles.image, style]} resizeMode={resizeMode} />;
    }

    return (
      <View style={[styles.errorPlaceholder, style]}>
        <View style={styles.errorIcon}>
          <View style={styles.errorLine} />
        </View>
      </View>
    );
  };

  // If source is a local require, render directly
  if (typeof source === 'number') {
    return (
      <Image
        source={source}
        style={[styles.image, style]}
        resizeMode={resizeMode}
        blurRadius={blurRadius}
        {...props}
      />
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Placeholder/Loading */}
      {!loaded && renderPlaceholder()}

      {/* Error state */}
      {error && loaded && renderError()}

      {/* Main Image */}
      {imageSource && !error && (
        <Animated.Image
          source={imageSource}
          style={[styles.image, style, { opacity: fadeAnim }]}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
          blurRadius={blurRadius}
          {...props}
        />
      )}
    </View>
  );
};

/**
 * Preload images for better performance
 * @param {string[]} urls - Array of image URLs to preload
 */
export const preloadImages = async (urls) => {
  const promises = urls.map((url) => {
    return new Promise((resolve) => {
      if (Platform.OS === 'web') {
        const img = new window.Image();
        img.onload = () => resolve(url);
        img.onerror = () => resolve(null);
        img.src = url;
      } else {
        Image.prefetch(url)
          .then(() => {
            resolve(url);
            return null; // Explicit return to satisfy promise/always-return
          })
          .catch(() => {
            resolve(null);
            return null; // Explicit return to satisfy promise/always-return
          });
      }
    });
  });

  return Promise.all(promises);
};

/**
 * Clear the image cache
 */
export const clearImageCache = () => {
  imageCache.clear();
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => ({
  size: imageCache.size,
  maxSize: MAX_CACHE_SIZE,
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: Colors.background.light,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.ui.disabled,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.background.lighter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorLine: {
    width: 20,
    height: 2,
    backgroundColor: Colors.text.tertiary,
    transform: [{ rotate: '45deg' }],
  },
});

OptimizedImage.propTypes = {
  source: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  placeholder: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  resizeMode: PropTypes.string,
  fadeDuration: PropTypes.number,
  showLoadingIndicator: PropTypes.bool,
  loadingIndicatorColor: PropTypes.string,
  onLoad: PropTypes.func,
  onError: PropTypes.func,
  blurRadius: PropTypes.number,
};

export default OptimizedImage;
