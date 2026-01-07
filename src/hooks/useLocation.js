import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import logger from '../utils/logger';

/**
 * Custom hook for managing device location with permission handling
 *
 * Features:
 * - Automatic permission requests
 * - Location caching and error handling
 * - Loading states
 * - Configurable accuracy and timeout
 */
export const useLocation = (options = {}) => {
  const {
    requestPermission = true,
    enableHighAccuracy = false,
    timeout = 10000,
    maximumAge = 300000, // 5 minutes
    autoRequest = true,
  } = options;

  const [location, setLocation] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Request location permissions
   */
  const requestPermissions = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      logger.info('Location permission status', { status });
      return status;
    } catch (err) {
      logger.error('Error requesting location permissions', err);
      setError('Failed to request location permissions');
      return null;
    }
  }, []);

  /**
   * Get current location
   */
  const getCurrentLocation = useCallback(async () => {
    if (loading) return null;

    setLoading(true);
    setError(null);

    try {
      // Check permissions first
      if (requestPermission) {
        const status = await requestPermissions();
        if (status !== 'granted') {
          throw new Error('Location permission not granted');
        }
      }

      const locationOptions = {
        accuracy: enableHighAccuracy
          ? Location.Accuracy.High
          : Location.Accuracy.Balanced,
        timeout,
        maximumAge,
      };

      const currentLocation = await Location.getCurrentPositionAsync(locationOptions);
      setLocation(currentLocation.coords);
      setError(null);

      logger.info('Location retrieved successfully', {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy,
      });

      return currentLocation.coords;
    } catch (err) {
      const errorMessage = err.message || 'Failed to get location';
      setError(errorMessage);
      logger.error('Error getting location', err);

      // Show user-friendly error message
      if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
        setError('Location permission is required to show nearby matches');
      } else if (errorMessage.includes('timeout')) {
        setError('Location request timed out. Please try again.');
      } else {
        setError('Unable to get your location. Some features may not work correctly.');
      }

      return null;
    } finally {
      setLoading(false);
    }
  }, [loading, requestPermission, enableHighAccuracy, timeout, maximumAge, requestPermissions]);

  /**
   * Initialize location on mount
   */
  useEffect(() => {
    if (autoRequest) {
      getCurrentLocation();
    } else if (requestPermission) {
      // Just check permissions without requesting location
      requestPermissions();
    }
  }, [autoRequest, getCurrentLocation, requestPermission, requestPermissions]);

  /**
   * Clear location data
   */
  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  /**
   * Retry getting location
   */
  const retry = useCallback(() => {
    return getCurrentLocation();
  }, [getCurrentLocation]);

  return {
    location,
    permissionStatus,
    loading,
    error,
    getCurrentLocation,
    requestPermissions,
    clearLocation,
    retry,
    hasPermission: permissionStatus === 'granted',
    isAvailable: !!location,
  };
};

export default useLocation;