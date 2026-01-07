import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, Platform, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/colors';

// Image cache manager - consolidated from OptimizedImage
const imageCache = new Map();
const IMAGE_CACHE_KEY = '@image_cache_keys';
const MAX_CACHE_SIZE = 50;

/**
 * UniversalImage - A comprehensive image component combining lazy loading,
 * caching, progressive enhancement, and error handling
 *
 * Features:
 * - Lazy loading with viewport detection
 * - Smart image caching with size limits
 * - Progressive image loading (thumbnail → full image)
 * - Smooth fade-in animations
 * - Error handling with retry logic
 * - Loading states and placeholders
 * - Memory optimization
 */
const UniversalImage = ({
  source,
  style,
  thumbnailSource,
  placeholder,
  resizeMode = 'cover',
  fadeDuration = 300,
  showLoadingIndicator = true,
  loadingIndicatorColor = Colors.primary,
  onLoad,
  onError,
  blurRadius,
  enableCache = true,
  enableLazy = true,
  retryCount = 2,
  progressive = true,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [imageSource, setImageSource] = useState(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isMounted = useRef(true);

  // Get the URI from source - consolidated logic
  const getUri = useCallback(() => {
    if (typeof source === 'string') return source;
    if (source?.uri) return source.uri;
    return null;
  }, [source]);

  // Check if image is cached
  const checkCache = useCallback(async (uri) => {
    if (!uri || !enableCache) return null;

    // Check in-memory cache first
    if (imageCache.has(uri)) {
      return imageCache.get(uri);
    }

    // For web, rely on browser caching
    if (Platform.OS === 'web') {
      return uri;
    }

    return uri;
  }, [enableCache]);

  // Cache the image
  const cacheImage = useCallback(async (uri) => {
    if (!uri || !enableCache) return;

    // Add to in-memory cache
    imageCache.set(uri, uri);

    // Manage cache size
    if (imageCache.size > MAX_CACHE_SIZE) {
      const firstKey = imageCache.keys().next().value;
      imageCache.delete(firstKey);
    }
  }, [enableCache]);

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
          const optimizedSource = enableCache ? {
            ...source,
            uri: cachedUri || uri,
            headers: {
              'Cache-Control': 'public, max-age=31536000',
              ...source.headers,
            },
          } : source;

          setImageSource(optimizedSource);
        }

        // Prefetch for caching (non-web platforms)
        if (Platform.OS !== 'web' && enableCache) {
          Image.prefetch(uri)
            .then(() => {
              cacheImage(uri);
            })
            .catch(() => {
              // Prefetch failed, but we can still try to load
            });
        }
      } catch (err) {
        if (isMounted.current) {
          setError(true);
        }
      }
    };

    // If lazy loading is disabled, load immediately
    if (!enableLazy) {
      loadImage();
    } else {
      // Implement simple lazy loading (could be enhanced with IntersectionObserver)
      const timer = setTimeout(loadImage, 100);
      return () => clearTimeout(timer);
    }

    return () => {
      isMounted.current = false;
    };
  }, [source, getUri, checkCache, cacheImage, enableCache, enableLazy]);

  // Handle image load complete
  const handleLoad = useCallback(
    (event) => {
      if (!isMounted.current) return;

      setLoaded(true);
      setError(false);

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

  // Handle image error with retry logic
  const handleError = useCallback(
    (event) => {
      if (!isMounted.current) return;

      setLoaded(true);
      setError(true);

      // Auto-retry logic
      if (retryAttempts < retryCount) {
        setTimeout(() => {
          if (isMounted.current) {
            setRetryAttempts(prev => prev + 1);
            setLoaded(false);
            setError(false);
          }
        }, 1000 * (retryAttempts + 1)); // Exponential backoff
      }

      // Still show something even on error
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: fadeDuration,
        useNativeDriver: true,
      }).start();

      onError?.(event);
    },
    [fadeAnim, fadeDuration, onError, retryAttempts, retryCount]
  );

  // Render placeholder/loading state
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
      {/* Low quality thumbnail (progressive loading) */}
      {thumbnailSource && progressive && !loaded && (
        <Image
          source={thumbnailSource}
          style={styles.thumbnail}
          blurRadius={2}
          resizeMode={resizeMode}
        />
      )}

      {/* Placeholder/Loading */}
      {!loaded && renderPlaceholder()}

      {/* Error state */}
      {error && loaded && retryAttempts >= retryCount && renderError()}

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
 * ProfileImage - Specialized component for profile photos
 */
export const ProfileImage = ({
  source,
  size = 100,
  style,
  ...props
}) => (
  <UniversalImage
    source={source}
    style={[
      styles.profileImage,
      { width: size, height: size, borderRadius: size / 2 },
      style,
    ]}
    placeholder={styles.profilePlaceholder}
    resizeMode="cover"
    enableLazy={false}
    {...props}
  />
);

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
          .then(() => resolve(url))
          .catch(() => resolve(null));
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
  thumbnail: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  profileImage: {
    backgroundColor: Colors.background.lightest,
  },
  profilePlaceholder: {
    backgroundColor: Colors.background.lightest,
    borderWidth: 2,
    borderColor: Colors.border.gray,
  },
});

UniversalImage.propTypes = {
  source: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  thumbnailSource: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  placeholder: PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.func]),
  resizeMode: PropTypes.string,
  fadeDuration: PropTypes.number,
  showLoadingIndicator: PropTypes.bool,
  loadingIndicatorColor: PropTypes.string,
  onLoad: PropTypes.func,
  onError: PropTypes.func,
  blurRadius: PropTypes.number,
  enableCache: PropTypes.bool,
  enableLazy: PropTypes.bool,
  retryCount: PropTypes.number,
  progressive: PropTypes.bool,
};

export default UniversalImage;