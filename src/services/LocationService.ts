/**
 * LocationService (TypeScript)
 * Handles location permissions, updates, and geospatial operations
 */

import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { calculateDistance as calcDist } from '../utils/distanceCalculator';
import logger from '../utils/logger';
import api from './api';
import type { IUserProfile } from '../../shared/types/user';

const LOCATION_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Location coordinates
 */
export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

/**
 * Location privacy level
 */
export type LocationPrivacy = 'hidden' | 'visible_to_matches' | 'visible_to_all';

/**
 * User profile with distance
 */
export interface UserProfileWithDistance {
  _id: string;
  name: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  bio?: string;
  photos: Array<unknown>;
  interests: string[];
  location?: unknown;
  profileCompleteness?: number;
  lastActive?: Date | string;
  videos?: Array<unknown>;
  profilePrompts?: Array<unknown>;
  education?: unknown;
  occupation?: unknown;
  height?: unknown;
  ethnicity?: string[];
  isVerified?: boolean;
  isProfileVerified?: boolean;
  distance: number | null;
}

export class LocationService {
  static locationUpdateTimer: NodeJS.Timeout | null = null;

  /**
   * Request location permission
   */
  static async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        logger.warn('Location permission denied');
        return false;
      }
      return true;
    } catch (error) {
      logger.error('Error requesting location permission', error as any);
      return false;
    }
  }

  /**
   * Request background location permission
   */
  static async requestBackgroundLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== 'granted') {
        logger.warn('Background location permission denied');
        return false;
      }
      return true;
    } catch (error) {
      logger.error('Error requesting background location permission', error as any);
      return false;
    }
  }

  /**
   * Get current location
   */
  static async getCurrentLocation(): Promise<LocationCoordinates | null> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        // Fallback for development/demo: NYC Coordinates
        // This ensures the app works immediately with seeded data
        if (__DEV__) {
          logger.info('Using mock location (NYC) for development');
          return {
            latitude: 40.73061,
            longitude: -73.935242,
            accuracy: 100,
          };
        }
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy ?? undefined,
      };
    } catch (error) {
      logger.error('Error getting current location', error as any);

      // Fallback on error too
      if (__DEV__) {
        return {
          latitude: 40.73061,
          longitude: -73.935242,
          accuracy: 100,
        };
      }
      return null;
    }
  }

  /**
   * Update user location on backend
   */
  static async updateUserLocation(userId: string, location: LocationCoordinates | null): Promise<void> {
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage?.includes('ERR_BLOCKED_BY_CLIENT') || errorMessage?.includes('Network')) {
        logger.warn('Location update blocked or network error', { userId });
        return;
      }
      logger.error('Error updating user location', error as any, { userId });
    }
  }

  /**
   * Update location privacy setting
   */
  static async updateLocationPrivacy(userId: string, privacyLevel: LocationPrivacy): Promise<void> {
    try {
      // Use profile API to update privacy settings
      const response = await api.put('/profile/update', {
        locationPrivacy: privacyLevel, // 'hidden', 'visible_to_matches', 'visible_to_all'
      });

      if (!response.success) {
        logger.warn('Failed to update location privacy', { userId, privacyLevel });
      }
    } catch (error) {
      logger.error('Error updating location privacy', error as any, { userId, privacyLevel });
    }
  }

  /**
   * Get location privacy setting
   */
  static async getLocationPrivacy(userId: string): Promise<LocationPrivacy> {
    try {
      // Get privacy setting from user profile via API
      const response = await api.get('/profile');

      if (response.success && response.data) {
        const data = response.data as { locationPrivacy?: LocationPrivacy };
        return data.locationPrivacy || 'visible_to_matches';
      }
      return 'visible_to_matches';
    } catch (error) {
      logger.error('Error getting location privacy', error as any, { userId });
      return 'visible_to_matches';
    }
  }

  /**
   * Start periodic location updates
   */
  static async startPeriodicLocationUpdates(userId: string, interval: number = LOCATION_UPDATE_INTERVAL): Promise<void> {
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
      }, interval) as unknown as NodeJS.Timeout;

      logger.info('Periodic location updates started', { userId, interval });
    } catch (error) {
      logger.error('Error starting periodic location updates', error as any, { userId });
    }
  }

  /**
   * Stop periodic location updates
   */
  static stopPeriodicLocationUpdates(): void {
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
  static calculateDistance(coord1: LocationCoordinates | null, coord2: LocationCoordinates | null): number | null {
    if (!coord1 || !coord2) return null;
    return calcDist(coord1.latitude, coord1.longitude, coord2.latitude, coord2.longitude);
  }

  /**
   * Get nearby users
   */
  static async getNearbyUsers(currentUserId: string, maxDistanceKm: number = 50): Promise<UserProfileWithDistance[]> {
    try {
      // Use backend discovery API which handles geospatial queries
      const response = await api.get<IUserProfile[]>(`/discover/explore?maxDistance=${maxDistanceKm}`);

      if (!response.success) {
        logger.warn('Failed to get nearby users from API', {
          currentUserId,
          error: response.message,
        });
        return [];
      }

      // Backend returns profiles array with distance calculated
      const data = response.data as { profiles?: IUserProfile[] } | IUserProfile[];
      const profiles = Array.isArray(data) ? data : (data as { profiles?: IUserProfile[] })?.profiles || [];

      return profiles
        .map((profile) => ({
          ...profile,
          distance: (profile as { distance?: number }).distance != null
            ? Math.round((profile as { distance: number }).distance * 10) / 10
            : null,
        }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0)) as UserProfileWithDistance[];
    } catch (error) {
      logger.error('Error getting nearby users', error as any, { currentUserId, maxDistanceKm });
      return [];
    }
  }

  /**
   * Update location on user login
   */
  static async updateLocationOnLogin(userId: string): Promise<void> {
    try {
      const location = await this.getCurrentLocation();
      if (location) {
        await this.updateUserLocation(userId, location);
      }
    } catch (error) {
      logger.error('Error updating location on login', error as any, { userId });
    }
  }

  /**
   * Get location display string
   */
  static getLocationDisplayString(distanceKm: number | null | undefined): string {
    if (distanceKm === null || distanceKm === undefined) {
      return 'Distance unknown';
    }
    if (distanceKm < 1) {
      return '< 1 km away';
    } else if (distanceKm < 10) {
      return `${Math.round(distanceKm * 10) / 10} km away`;
    } else {
      return `${Math.round(distanceKm)} km away`;
    }
  }
}
