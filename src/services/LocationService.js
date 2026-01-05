import * as Location from 'expo-location';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { calculateDistance as calcDist } from '../utils/distanceCalculator';
import logger from '../utils/logger';

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
      return null;
    }
  }

  static async updateUserLocation(userId, location) {
    try {
      if (!location) return;

      await updateDoc(doc(db, 'users', userId), {
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          updatedAt: new Date(),
        },
        lastLocationUpdate: new Date(),
      });

      logger.debug('User location updated successfully', { userId });
    } catch (error) {
      logger.error('Error updating user location', error, { userId });
    }
  }

  static async updateLocationPrivacy(userId, privacyLevel) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        locationPrivacy: privacyLevel, // 'hidden', 'visible_to_matches', 'visible_to_all'
      });
    } catch (error) {
      logger.error('Error updating location privacy', error, { userId, privacyLevel });
    }
  }

  static async getLocationPrivacy(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData?.locationPrivacy || 'visible_to_matches';
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
      const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
      if (!currentUserDoc.exists()) {
        logger.warn('Current user not found', { currentUserId });
        return [];
      }
      const currentUserData = currentUserDoc.data();
      if (!currentUserData?.location) {
        logger.warn('Current user has no location data', { currentUserId });
        return [];
      }

      const currentLocation = currentUserData.location;

      // Note: For production, implement server-side geospatial queries using MongoDB $geoNear
      // or Firebase GeoFire. Client-side filtering is used here for development.
      // Backend should handle geospatial queries at /api/discovery/explore endpoint
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const nearbyUsers = [];

      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData && userData.location && doc.id !== currentUserId) {
          const distance = this.calculateDistance(currentLocation, userData.location);
          if (distance !== null && distance <= maxDistanceKm) {
            nearbyUsers.push({
              id: doc.id,
              ...userData,
              distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
            });
          }
        }
      });

      return nearbyUsers.sort((a, b) => a.distance - b.distance);
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
