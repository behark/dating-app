import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { calculateDistance as calcDist } from '../utils/distanceCalculator';
import logger from '../utils/logger';
import api from './api';

const LOCATION_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

export class LocationService {
  static locationUpdateTimer = null;

  static async requestLocationPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        logger.warn('Location permission denied');
        return false;
      }
      return true;
    } catch (error) {
      logger.error('Error requesting location permission', error);
      return false;
    }
  }

  static async requestBackgroundLocationPermission() {
    try {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== 'granted') {
        logger.warn('Background location permission denied');
        return false;
      }
      return true;
    } catch (error) {
      logger.error('Error requesting background location permission', error);
      return false;
    }
  }

  static async getCurrentLocation() {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        // Fallback for development/demo: NYC Coordinates
        // This ensures the app works immediately with seeded data
        if (__DEV__) {
             logger.info('Using mock location (NYC) for development');
             return {
                latitude: 40.730610,
                longitude: -73.935242,
                accuracy: 100,
             };
        }
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      };
    } catch (error) {
      logger.error('Error getting current location', error);
      
      // Fallback on error too
      if (__DEV__) {
         return {
            latitude: 40.730610,
            longitude: -73.935242,
            accuracy: 100,
         };
      }
      return null;
    }
  }

  static async updateUserLocation(userId, location) {
    try {
      if (!location) return;

      // Use backend API to update location
      const response = await api.put('/discover/location', {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      });

      if (response.success) {
        logger.debug('User location updated successfully via API', { userId });
      } else {
        logger.warn('Failed to update location via API', { userId, error: response.message });
      }
    } catch (error) {
      // Handle network errors gracefully
      if (error.message?.includes('ERR_BLOCKED_BY_CLIENT') || error.message?.includes('Network')) {
        logger.warn('Location update blocked or network error', { userId });
        return;
      }
      logger.error('Error updating user location', error, { userId });
    }
  }

  static async updateLocationPrivacy(userId, privacyLevel) {
    try {
      // Use profile API to update privacy settings
      const response = await api.put('/profile/update', {
        locationPrivacy: privacyLevel, // 'hidden', 'visible_to_matches', 'visible_to_all'
      });

      if (!response.success) {
        logger.warn('Failed to update location privacy', { userId, privacyLevel });
      }
    } catch (error) {
      logger.error('Error updating location privacy', error, { userId, privacyLevel });
    }
  }

  static async getLocationPrivacy(userId) {
    try {
      // Get privacy setting from user profile via API
      const response = await api.get('/profile');

      if (response.success && response.data) {
        return response.data.locationPrivacy || 'visible_to_matches';
      }
      return 'visible_to_matches';
    } catch (error) {
      logger.error('Error getting location privacy', error, { userId });
      return 'visible_to_matches';
    }
  }

  static async startPeriodicLocationUpdates(userId, interval = LOCATION_UPDATE_INTERVAL) {
    try {
      // Initial update
      const location = await this.getCurrentLocation();
      if (location) {
        await this.updateUserLocation(userId, location);
      }

      // Set up periodic updates
      this.locationUpdateTimer = setInterval(async () => {
        const currentLocation = await this.getCurrentLocation();
        if (currentLocation) {
          await this.updateUserLocation(userId, currentLocation);
        }
      }, interval);

      logger.info('Periodic location updates started', { userId, interval });
    } catch (error) {
      logger.error('Error starting periodic location updates', error, { userId });
    }
  }

  static stopPeriodicLocationUpdates() {
    if (this.locationUpdateTimer) {
      clearInterval(this.locationUpdateTimer);
      this.locationUpdateTimer = null;
      logger.info('Periodic location updates stopped');
    }
  }

  /**
   * Calculate distance between two coordinates
   * @deprecated Use calculateDistance from '../utils/distanceCalculator' directly
   */
  static calculateDistance(coord1, coord2) {
    if (!coord1 || !coord2) return null;
    return calcDist(coord1.latitude, coord1.longitude, coord2.latitude, coord2.longitude);
  }

  static async getNearbyUsers(currentUserId, maxDistanceKm = 50) {
    try {
      // Use backend discovery API which handles geospatial queries
      const response = await api.get('/discover/explore', {
        params: {
          maxDistance: maxDistanceKm,
        },
      });

      if (!response.success) {
        logger.warn('Failed to get nearby users from API', {
          currentUserId,
          error: response.message,
        });
        return [];
      }

      // Backend returns profiles array with distance calculated
      const profiles = response.data?.profiles || response.profiles || [];

      return profiles
        .map((profile) => ({
          id: profile._id || profile.id,
          ...profile,
          distance: profile.distance != null ? Math.round(profile.distance * 10) / 10 : null,
        }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } catch (error) {
      logger.error('Error getting nearby users', error, { currentUserId, maxDistanceKm });
      return [];
    }
  }

  static async updateLocationOnLogin(userId) {
    try {
      const location = await this.getCurrentLocation();
      if (location) {
        await this.updateUserLocation(userId, location);
      }
    } catch (error) {
      logger.error('Error updating location on login', error, { userId });
    }
  }

  static getLocationDisplayString(distanceKm) {
    if (distanceKm < 1) {
      return '< 1 km away';
    } else if (distanceKm < 10) {
      return `${Math.round(distanceKm * 10) / 10} km away`;
    } else {
      return `${Math.round(distanceKm)} km away`;
    }
  }
}
