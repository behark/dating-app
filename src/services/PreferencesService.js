import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export class PreferencesService {
  static async getUserPreferences(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();

      return {
        // Age preferences
        minAge: userData?.preferences?.minAge || 18,
        maxAge: userData?.preferences?.maxAge || 100,

        // Distance preferences
        maxDistance: userData?.preferences?.maxDistance || 50, // km

        // Gender preferences
        interestedIn: userData?.preferences?.interestedIn || 'both', // 'men', 'women', 'both'

        // Notification preferences
        notificationsEnabled: userData?.notificationsEnabled !== false,
        matchNotifications: userData?.preferences?.matchNotifications !== false,
        messageNotifications: userData?.preferences?.messageNotifications !== false,

        // Privacy preferences
        showDistance: userData?.preferences?.showDistance !== false,
        showAge: userData?.preferences?.showAge !== false,

        // Discovery settings
        discoveryEnabled: userData?.preferences?.discoveryEnabled !== false,

        ...userData?.preferences,
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  static getDefaultPreferences() {
    return {
      minAge: 18,
      maxAge: 100,
      maxDistance: 50,
      interestedIn: 'both',
      notificationsEnabled: true,
      matchNotifications: true,
      messageNotifications: true,
      showDistance: true,
      showAge: true,
      discoveryEnabled: true,
    };
  }

  static async updateUserPreferences(userId, preferences) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        preferences: {
          ...preferences,
          updatedAt: new Date(),
        },
        updatedAt: new Date(),
      });

      console.log('User preferences updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return false;
    }
  }

  static async updateSinglePreference(userId, key, value) {
    try {
      const preferences = await this.getUserPreferences(userId);
      preferences[key] = value;
      return await this.updateUserPreferences(userId, preferences);
    } catch (error) {
      console.error('Error updating single preference:', error);
      return false;
    }
  }

  // Advanced filtering logic
  static async filterUsersForDiscovery(currentUserId, allUsers) {
    try {
      const currentUserPrefs = await this.getUserPreferences(currentUserId);
      const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
      const currentUserData = currentUserDoc.data();

      if (!currentUserPrefs.discoveryEnabled) {
        return [];
      }

      return allUsers.filter(user => {
        // Don't show current user
        if (user.id === currentUserId) return false;

        // Age filter
        if (user.age < currentUserPrefs.minAge || user.age > currentUserPrefs.maxAge) {
          return false;
        }

        // Distance filter (if both users have location)
        if (currentUserData?.location && user.location) {
          const distance = this.calculateDistance(currentUserData.location, user.location);
          if (distance > currentUserPrefs.maxDistance) {
            return false;
          }
        }

        // Gender preference filter (would need gender field in user profile)
        // if (currentUserPrefs.interestedIn !== 'both' && user.gender !== currentUserPrefs.interestedIn) {
        //   return false;
        // }

        return true;
      });
    } catch (error) {
      console.error('Error filtering users:', error);
      return allUsers;
    }
  }

  static calculateDistance(coord1, coord2) {
    if (!coord1 || !coord2) return Infinity;

    const R = 6371; // Earth's radius in kilometers
    const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static validatePreferences(preferences) {
    const errors = [];

    if (preferences.minAge < 18 || preferences.minAge > 100) {
      errors.push('Minimum age must be between 18 and 100');
    }

    if (preferences.maxAge < 18 || preferences.maxAge > 100) {
      errors.push('Maximum age must be between 18 and 100');
    }

    if (preferences.minAge > preferences.maxAge) {
      errors.push('Minimum age cannot be greater than maximum age');
    }

    if (preferences.maxDistance < 1 || preferences.maxDistance > 500) {
      errors.push('Maximum distance must be between 1 and 500 km');
    }

    if (!['men', 'women', 'both'].includes(preferences.interestedIn)) {
      errors.push('Invalid gender preference');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}