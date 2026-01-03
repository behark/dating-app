import * as Location from 'expo-location';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const LOCATION_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

export class LocationService {
  static locationUpdateTimer = null;

  static async requestLocationPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  static async requestBackgroundLocationPermission() {
    try {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Background location permission denied');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting background location permission:', error);
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
      console.error('Error getting current location:', error);
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

      console.log('User location updated successfully');
    } catch (error) {
      console.error('Error updating user location:', error);
    }
  }

  static async updateLocationPrivacy(userId, privacyLevel) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        locationPrivacy: privacyLevel, // 'hidden', 'visible_to_matches', 'visible_to_all'
      });
    } catch (error) {
      console.error('Error updating location privacy:', error);
    }
  }

  static async getLocationPrivacy(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data().locationPrivacy || 'visible_to_matches';
      }
      return 'visible_to_matches';
    } catch (error) {
      console.error('Error getting location privacy:', error);
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

      console.log('Periodic location updates started');
    } catch (error) {
      console.error('Error starting periodic location updates:', error);
    }
  }

  static stopPeriodicLocationUpdates() {
    if (this.locationUpdateTimer) {
      clearInterval(this.locationUpdateTimer);
      this.locationUpdateTimer = null;
      console.log('Periodic location updates stopped');
    }
  }

  static calculateDistance(coord1, coord2) {
    if (!coord1 || !coord2) return null;

    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) * Math.cos(this.toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers

    return distance;
  }

  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  static async getNearbyUsers(currentUserId, maxDistanceKm = 50) {
    try {
      const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
      const currentUserData = currentUserDoc.data();

      if (!currentUserData?.location) {
        console.log('Current user has no location data');
        return [];
      }

      const currentLocation = currentUserData.location;

      // In a real app, you'd use Firebase Geo queries or a spatial database
      // For now, we'll fetch all users and filter client-side
      // TODO: Implement proper geospatial queries for production
      const usersSnapshot = await getDoc(collection(db, 'users'));
      const nearbyUsers = [];

      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.location && doc.id !== currentUserId) {
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
      console.error('Error getting nearby users:', error);
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
      console.error('Error updating location on login:', error);
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
