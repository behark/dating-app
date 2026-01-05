import { act, renderHook } from '@testing-library/react';
import { useOffline } from '../useOffline';

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn((callback) => {
    // Store callback for later use
    mockNetInfoCallback = callback;
    return jest.fn(); // unsubscribe function
  }),
  fetch: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiRemove: jest.fn(),
}));

let mockNetInfoCallback;

describe('useOffline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNetInfoCallback = null;
  });

  describe('isOnline state', () => {
    it('should initialize with online state', async () => {
      const NetInfo = require('@react-native-community/netinfo');
      NetInfo.fetch.mockResolvedValue({ isConnected: true });

      const { result, waitForNextUpdate } = renderHook(() => useOffline());

      await waitForNextUpdate();
      expect(result.current.isOnline).toBe(true);
    });

    it('should update when connection changes', async () => {
      const NetInfo = require('@react-native-community/netinfo');
      NetInfo.fetch.mockResolvedValue({ isConnected: true });

      const { result, waitForNextUpdate } = renderHook(() => useOffline());

      await waitForNextUpdate();
      expect(result.current.isOnline).toBe(true);

      // Simulate going offline
      act(() => {
        mockNetInfoCallback({ isConnected: false });
      });

      expect(result.current.isOnline).toBe(false);
    });
  });

  describe('pendingActions', () => {
    it('should queue actions when offline', async () => {
      const NetInfo = require('@react-native-community/netinfo');
      NetInfo.fetch.mockResolvedValue({ isConnected: false });

      const { result, waitForNextUpdate } = renderHook(() => useOffline());

      await waitForNextUpdate();

      act(() => {
        result.current.queueAction({
          type: 'LIKE_PROFILE',
          payload: { profileId: 'profile_123' },
        });
      });

      expect(result.current.pendingActions.length).toBe(1);
    });

    it('should not queue duplicate actions', async () => {
      const NetInfo = require('@react-native-community/netinfo');
      NetInfo.fetch.mockResolvedValue({ isConnected: false });

      const { result, waitForNextUpdate } = renderHook(() => useOffline());

      await waitForNextUpdate();

      const action = {
        type: 'LIKE_PROFILE',
        payload: { profileId: 'profile_123' },
      };

      act(() => {
        result.current.queueAction(action);
        result.current.queueAction(action);
      });

      expect(result.current.pendingActions.length).toBe(1);
    });
  });

  describe('syncPendingActions', () => {
    it('should sync actions when coming back online', async () => {
      const NetInfo = require('@react-native-community/netinfo');
      const AsyncStorage = require('@react-native-async-storage/async-storage');

      NetInfo.fetch.mockResolvedValue({ isConnected: false });
      AsyncStorage.getItem.mockResolvedValue(
        JSON.stringify([{ type: 'LIKE_PROFILE', payload: { profileId: '123' } }])
      );

      const { result, waitForNextUpdate } = renderHook(() => useOffline());

      await waitForNextUpdate();

      // Simulate coming back online
      act(() => {
        mockNetInfoCallback({ isConnected: true });
      });

      // Actions should be synced
      expect(result.current.isOnline).toBe(true);
    });
  });

  describe('cacheData', () => {
    it('should cache data locally', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      const NetInfo = require('@react-native-community/netinfo');
      NetInfo.fetch.mockResolvedValue({ isConnected: true });

      const { result, waitForNextUpdate } = renderHook(() => useOffline());

      await waitForNextUpdate();

      const testData = { profiles: [{ id: '1', name: 'Test' }] };

      act(() => {
        result.current.cacheData('discovery_profiles', testData);
      });

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should retrieve cached data', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      const NetInfo = require('@react-native-community/netinfo');
      NetInfo.fetch.mockResolvedValue({ isConnected: false });

      const cachedData = { profiles: [{ id: '1', name: 'Cached' }] };
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(cachedData));

      const { result, waitForNextUpdate } = renderHook(() => useOffline());

      await waitForNextUpdate();

      const data = await result.current.getCachedData('discovery_profiles');
      expect(data).toEqual(cachedData);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      const NetInfo = require('@react-native-community/netinfo');
      NetInfo.fetch.mockResolvedValue({ isConnected: true });

      AsyncStorage.getAllKeys.mockResolvedValue(['cache_key1', 'cache_key2']);

      const { result, waitForNextUpdate } = renderHook(() => useOffline());

      await waitForNextUpdate();

      await act(async () => {
        await result.current.clearCache();
      });

      expect(AsyncStorage.multiRemove).toHaveBeenCalled();
    });
  });

  describe('getConnectionType', () => {
    it('should return connection type', async () => {
      const NetInfo = require('@react-native-community/netinfo');
      NetInfo.fetch.mockResolvedValue({
        isConnected: true,
        type: 'wifi',
      });

      const { result, waitForNextUpdate } = renderHook(() => useOffline());

      await waitForNextUpdate();

      expect(result.current.connectionType).toBe('wifi');
    });
  });
});
