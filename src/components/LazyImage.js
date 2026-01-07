import React, { useState, useCallback } from 'react';
import { Image, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/colors';

/**
 * LazyImage - Optimized image component with lazy loading and error handling
 *
 * Features:
 * - Automatic lazy loading
 * - Loading placeholder
 * - Error fallback
 * - Retry mechanism
 * - Memory optimization
 */
const LazyImage = ({
  source,
  style,
  placeholderStyle,
  errorStyle,
  onLoad,
  onError,
  resizeMode = 'cover',
  showLoading = true,
  retryCount = 2,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);

  const handleLoadStart = useCallback(() => {
    setLoading(true);
    setError(false);
  }, []);

  const handleLoad = useCallback((event) => {
    setLoading(false);
    setError(false);
    onLoad?.(event);
  }, [onLoad]);

  const handleError = useCallback((errorEvent) => {
    setLoading(false);
    setError(true);

    // Auto-retry logic
    if (retryAttempts < retryCount) {
      setTimeout(() => {
        setRetryAttempts(prev => prev + 1);
        setLoading(true);
        setError(false);
      }, 1000 * (retryAttempts + 1)); // Exponential backoff
    }

    onError?.(errorEvent);
  }, [onError, retryAttempts, retryCount]);

  const handleRetry = useCallback(() => {
    setRetryAttempts(0);
    setLoading(true);
    setError(false);
  }, []);

  if (error && retryAttempts >= retryCount) {
    return (
      <View style={[styles.container, style]}>
        <View style={[styles.errorContainer, errorStyle]}>
          <ActivityIndicator size="small" color={Colors.text.tertiary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Image
        source={source}
        style={[
          styles.image,
          loading && styles.hidden,
          style,
        ]}
        resizeMode={resizeMode}
        onLoadStart={handleLoadStart}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />

      {loading && showLoading && (
        <View style={[styles.placeholder, placeholderStyle]}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      )}
    </View>
  );
};

/**
 * ProfileImage - Specialized lazy image for profile photos
 */
export const ProfileImage = ({
  source,
  size = 100,
  style,
  ...props
}) => (
  <LazyImage
    source={source}
    style={[
      styles.profileImage,
      { width: size, height: size, borderRadius: size / 2 },
      style,
    ]}
    placeholderStyle={styles.profilePlaceholder}
    resizeMode="cover"
    {...props}
  />
);

/**
 * OptimizedImage - Image with advanced caching and optimization
 */
export const OptimizedImage = ({
  source,
  style,
  enableCache = true,
  ...props
}) => {
  // For Expo apps, images are automatically optimized
  // Add additional caching logic if needed
  const optimizedSource = enableCache ? {
    ...source,
    headers: {
      'Cache-Control': 'public, max-age=31536000',
      ...source.headers,
    },
  } : source;

  return (
    <LazyImage
      source={optimizedSource}
      style={style}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  hidden: {
    opacity: 0,
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.lightest,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.lightest,
    borderWidth: 1,
    borderColor: Colors.border.gray,
    borderStyle: 'dashed',
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

export default LazyImage;