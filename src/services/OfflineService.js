import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

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
      // Web-specific network detection
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
      this.isOnline = navigator.onLine;
    } else {
      // React Native - use NetInfo
      this.unsubscribeNetInfo = NetInfo.addEventListener(state => {
        this.handleNetworkChange(state.isConnected && state.isInternetReachable !== false);
      });
      
      // Get initial state
      NetInfo.fetch().then(state => {
        this.isOnline = state.isConnected && state.isInternetReachable !== false;
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
      window.removeEventListener('online', () => this.handleNetworkChange(true));
      window.removeEventListener('offline', () => this.handleNetworkChange(false));
    }
  }

  /**
   * Handle network status change
   */
  async handleNetworkChange(isOnline) {
    const wasOffline = !this.isOnline;
    this.isOnline = isOnline;

    // Notify listeners
    this.listeners.forEach(listener => listener(isOnline));

    // If coming back online, sync pending actions
    if (isOnline && wasOffline) {
      await this.syncPendingActions();
    }

    await AsyncStorage.setItem(STORAGE_KEYS.NETWORK_STATUS, JSON.stringify({ isOnline }));
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
      id: Date.now().toString(),
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
      await AsyncStorage.setItem(
        STORAGE_KEYS.OFFLINE_QUEUE,
        JSON.stringify(this.pendingActions)
      );
    } catch (error) {
      console.error('Error saving pending actions:', error);
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
      console.error('Error loading pending actions:', error);
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
        console.error('Error syncing action:', action, error);
        action.retryCount += 1;
        
        // Remove action if max retries exceeded
        if (action.retryCount >= 3) {
          completedActions.push(action.id);
        }
      }
    }

    // Remove completed actions
    this.pendingActions = this.pendingActions.filter(
      action => !completedActions.includes(action.id)
    );
    await this.savePendingActions();
    
    this.syncInProgress = false;
  }

  /**
   * Execute a queued action
   */
  async executeAction(action) {
    switch (action.type) {
      case 'SEND_MESSAGE':
        // Re-send message through chat service
        // This would integrate with your ChatContext
        console.log('Syncing message:', action.data);
        break;
      case 'SWIPE':
        // Re-submit swipe action
        console.log('Syncing swipe:', action.data);
        break;
      case 'UPDATE_PROFILE':
        // Re-submit profile update
        console.log('Syncing profile update:', action.data);
        break;
      default:
        console.warn('Unknown action type:', action.type);
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
      console.error('Error caching profiles:', error);
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
      console.error('Error getting cached profiles:', error);
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
      console.error('Error caching matches:', error);
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
      console.error('Error getting cached matches:', error);
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
      console.error('Error caching messages:', error);
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
      console.error('Error getting cached messages:', error);
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
      console.error('Error clearing cache:', error);
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
      console.error('Error getting storage info:', error);
      return null;
    }
  }
}

export const OfflineService = new OfflineServiceClass();
export default OfflineService;
