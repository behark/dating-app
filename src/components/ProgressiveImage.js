import React, { useState } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const ProgressiveImage = ({ source, style, placeholderSource, thumbnailSource, ...props }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
    setImageLoaded(true);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Low quality placeholder/thumbnail */}
      {thumbnailSource && !imageLoaded && (
        <Image source={thumbnailSource} style={styles.thumbnail} blurRadius={2} />
      )}

      {/* Main image */}
      <Image
        source={source}
        style={[styles.image, imageLoaded && styles.imageLoaded]}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        {...props}
      />

      {/* Loading indicator */}
      {loading && !error && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color={theme.interactive.primary}
            style={styles.loadingIndicator}
          />
        </View>
      )}

      {/* Error fallback */}
      {error && (
        <View style={styles.errorContainer}>
          <Image
            source={
              placeholderSource || {
                uri:
                  process.env.EXPO_PUBLIC_PLACEHOLDER_IMAGE_URL ||
                  'https://via.placeholder.com/400x400/cccccc/666666?text=No+Image',
              }
            }
            style={styles.placeholderImage}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    opacity: 0,
  },
  imageLoaded: {
    opacity: 1,
  },
  thumbnail: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  loadingIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 8,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    
    opacity: 0.6,
  },
});

export default ProgressiveImage;
