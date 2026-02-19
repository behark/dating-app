import AsyncStorage from '@react-native-async-storage/async-storage';
// eslint-disable-next-line import/no-named-as-default-member
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import logger from '../utils/logger';

// Storage keys
const STORAGE_KEYS = {
  OFFLINE_QUEUE: '@offline_queue',
  CACHED_PROFILES: '@cached_profiles',
  CACHED_MATCHES: '@cached_matches',
  CACHED_MESSAGES: '@cached_messages',
  LAST_SYNC: '@last_sync',
  NETWORK_STATUS: '@network_status',
};

// Cache expiration times (in milliseconds)
const CACHE_EXPIRY = {
  PROFILES: 30 * 60 * 1000, // 30 minutes
  MATCHES: 5 * 60 * 1000, // 5 minutes
  MESSAGES: 60 * 1000, // 1 minute
};

class OfflineServiceClass {
  constructor() {
    this.isOnline = true;
    this.listeners = new Set();
    this.syncInProgress = false;
    this.pendingActions = [];
    this.unsubscribeNetInfo = null;
  }

  /**
   * Initialize the offline service
   */
  async initialize() {
    // Load pending actions from storage
    await this.loadPendingActions();

    // Setup network status listener
    this.setupNetworkListener();

    return this;
  }

  /**
   * Setup network status listener using NetInfo
   */
  setupNetworkListener() {
    if (Platform.OS === 'web') {
      const hasWindowListeners =
        typeof window !== 'undefined' &&
        typeof window.addEventListener === 'function' &&
        typeof window.removeEventListener === 'function';

      // Web-specific network detection - store bound handlers to enable proper removal
      this._handleOnline = () => this.handleNetworkChange(true);
      this._handleOffline = () => this.handleNetworkChange(false);

      if (hasWindowListeners) {
        window.addEventListener('online', this._handleOnline);
        window.addEventListener('offline', this._handleOffline);
      }

      this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
    } else {
      // React Native - use NetInfo
      this.unsubscribeNetInfo = NetInfo.addEventListener((state) => {
        this.handleNetworkChange(state.isConnected && state.isInternetReachable !== false);
      });

      // Get initial state
      NetInfo.fetch()
        .then((state) => {
          this.isOnline = state.isConnected && state.isInternetReachable !== false;
          return null; // Explicit return to satisfy promise/always-return
        })
        .catch((error) => {
          logger.error('Error fetching network status', error);
          // Default to offline if we can't determine status
          this.isOnline = false;
          return null; // Explicit return to satisfy promise/always-return
        });
    }
  }

  /**
   * Cleanup listeners
   */
  cleanup() {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
    }
    if (Platform.OS === 'web') {
      // Use the stored bound handlers to properly remove event listeners
      if (this._handleOnline && typeof window !== 'undefined') {
        window.removeEventListener('online', this._handleOnline);
      }
      if (this._handleOffline && typeof window !== 'undefined') {
        window.removeEventListener('offline', this._handleOffline);
      }
    }
  }

  /**
   * Handle network status change
   */
  async handleNetworkChange(isOnline) {
    const wasOffline = !this.isOnline;
    this.isOnline = isOnline;

    // Notify listeners
    this.listeners.forEach((listener) => listener(isOnline));

    // If coming back online, sync pending actions
    if (isOnline && wasOffline) {
      try {
        await this.syncPendingActions();
      } catch (error) {
        logger.error('Error syncing pending actions after reconnect', error);
      }
    }

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NETWORK_STATUS, JSON.stringify({ isOnline }));
    } catch (error) {
      logger.error('Error persisting network status', error);
    }
  }

  /**
   * Subscribe to network status changes
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current network status
   */
  getNetworkStatus() {
    return this.isOnline;
  }

  /**
   * Queue an action for later execution when offline
   */
  async queueAction(action) {
    const queuedAction = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...action,
      retryCount: 0,
    };

    this.pendingActions.push(queuedAction);
    await this.savePendingActions();

    return queuedAction.id;
  }

  /**
   * Save pending actions to storage
   */
  async savePendingActions() {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(this.pendingActions));
    } catch (error) {
      logger.error('Error saving pending actions', error);
    }
  }

  /**
   * Load pending actions from storage
   */
  async loadPendingActions() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      if (stored) {
        this.pendingActions = JSON.parse(stored);
      }
    } catch (error) {
      logger.error('Error loading pending actions', error);
      this.pendingActions = [];
    }
  }

  /**
   * Sync pending actions when back online
   */
  async syncPendingActions() {
    if (this.syncInProgress || this.pendingActions.length === 0) return;

    this.syncInProgress = true;
    const completedActions = [];

    for (const action of this.pendingActions) {
      try {
        await this.executeAction(action);
        completedActions.push(action.id);
      } catch (error) {
        logger.error('Error syncing action', error, {
          actionType: action.type,
          actionId: action.id,
        });
        action.retryCount += 1;

        // Remove action if max retries exceeded
        if (action.retryCount >= 3) {
          completedActions.push(action.id);
        }
      }
    }

    // Remove completed actions
    this.pendingActions = this.pendingActions.filter(
      (action) => !completedActions.includes(action.id)
    );
    await this.savePendingActions();

    this.syncInProgress = false;
  }

  /**
   * Execute a queued action using the sync API
   */
  async executeAction(action) {
    try {
      const api = require('./api').default;
      const response = await api.post('/sync/execute', {
        actions: [
          {
            id: action.id,
            type: action.type,
            timestamp: action.timestamp,
            data: action.data,
          },
        ],
      });

      if (response.success) {
        const result = response.data.results[0];
        if (result.status === 'success' || result.status === 'skipped') {
          return { success: true };
        } else if (result.status === 'conflict') {
          logger.warn('Action has conflict', { actionId: action.id, conflict: result.conflict });
          return { success: false, conflict: true };
        } else {
          logger.error('Action failed', { actionId: action.id, error: result.error });
          return { success: false, error: result.error };
        }
      }
      return { success: false, error: 'Sync API returned error' };
    } catch (error) {
      logger.error('Error executing action via sync API', error, {
        actionType: action.type,
        actionId: action.id,
      });
      throw error;
    }
  }

  // ==================== CACHING METHODS ====================

  /**
   * Cache user profiles
   */
  async cacheProfiles(profiles) {
    try {
      const cacheData = {
        data: profiles,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.CACHED_PROFILES, JSON.stringify(cacheData));
    } catch (error) {
      logger.error('Error caching profiles', error, { profileCount: profiles.length });
    }
  }

  /**
   * Get cached profiles
   */
  async getCachedProfiles() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_PROFILES);
      if (stored) {
        const { data, timestamp } = JSON.parse(stored);
        // Check if cache is still valid
        if (Date.now() - timestamp < CACHE_EXPIRY.PROFILES) {
          return data;
        }
      }
      return null;
    } catch (error) {
      logger.error('Error getting cached profiles', error);
      return null;
    }
  }

  /**
   * Cache matches
   */
  async cacheMatches(matches) {
    try {
      const cacheData = {
        data: matches,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.CACHED_MATCHES, JSON.stringify(cacheData));
    } catch (error) {
      logger.error('Error caching matches', error, { matchCount: matches.length });
    }
  }

  /**
   * Get cached matches
   */
  async getCachedMatches() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_MATCHES);
      if (stored) {
        const { data, timestamp } = JSON.parse(stored);
        if (Date.now() - timestamp < CACHE_EXPIRY.MATCHES) {
          return data;
        }
      }
      return null;
    } catch (error) {
      logger.error('Error getting cached matches', error);
      return null;
    }
  }

  /**
   * Cache messages for a specific match
   */
  async cacheMessages(matchId, messages) {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_MESSAGES);
      const allMessages = stored ? JSON.parse(stored) : {};

      allMessages[matchId] = {
        data: messages,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(STORAGE_KEYS.CACHED_MESSAGES, JSON.stringify(allMessages));
    } catch (error) {
      logger.error('Error caching messages', error, { matchId, messageCount: messages.length });
    }
  }

  /**
   * Get cached messages for a specific match
   */
  async getCachedMessages(matchId) {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_MESSAGES);
      if (stored) {
        const allMessages = JSON.parse(stored);
        const matchMessages = allMessages[matchId];

        if (matchMessages && Date.now() - matchMessages.timestamp < CACHE_EXPIRY.MESSAGES) {
          return matchMessages.data;
        }
      }
      return null;
    } catch (error) {
      logger.error('Error getting cached messages', error, { matchId });
      return null;
    }
  }

  /**
   * Clear all cached data
   */
  async clearCache() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.CACHED_PROFILES,
        STORAGE_KEYS.CACHED_MATCHES,
        STORAGE_KEYS.CACHED_MESSAGES,
      ]);
    } catch (error) {
      logger.error('Error clearing cache', error);
    }
  }

  /**
   * Get storage size info
   */
  async getStorageInfo() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;

      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }

      return {
        keysCount: keys.length,
        totalSizeBytes: totalSize,
        totalSizeKB: (totalSize / 1024).toFixed(2),
      };
    } catch (error) {
      logger.error('Error getting storage info', error);
      return null;
    }
  }

  /**
   * Cache user profile
   */
  async cacheUserProfile(profile) {
    try {
      const cacheData = {
        data: profile,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem('@cached_user_profile', JSON.stringify(cacheData));
    } catch (error) {
      logger.error('Error caching user profile', error);
    }
  }

  /**
   * Get cached user profile
   */
  async getCachedUserProfile() {
    try {
      const stored = await AsyncStorage.getItem('@cached_user_profile');
      if (stored) {
        const { data, timestamp } = JSON.parse(stored);
        if (Date.now() - timestamp < CACHE_EXPIRY.PROFILES) {
          return data;
        }
      }
      return null;
    } catch (error) {
      logger.error('Error getting cached user profile', error);
      return null;
    }
  }

  /**
   * Cache conversations
   */
  async cacheConversations(conversations) {
    try {
      const cacheData = {
        data: conversations,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem('@cached_conversations', JSON.stringify(cacheData));
    } catch (error) {
      logger.error('Error caching conversations', error, { count: conversations.length });
    }
  }

  /**
   * Get cached conversations
   */
  async getCachedConversations() {
    try {
      const stored = await AsyncStorage.getItem('@cached_conversations');
      if (stored) {
        const { data, timestamp } = JSON.parse(stored);
        if (Date.now() - timestamp < CACHE_EXPIRY.MATCHES) {
          return data;
        }
      }
      return null;
    } catch (error) {
      logger.error('Error getting cached conversations', error);
      return null;
    }
  }
}

export const OfflineService = new OfflineServiceClass();
export default OfflineService;
