import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react';
import { OfflineService } from '../services/OfflineService';

// Initial State
const initialState = {
  // Network status
  isOnline: true,
  isInitialized: false,

  // UI State
  isLoading: false,
  error: null,

  // App-wide settings
  settings: {
    notifications: true,
    soundEnabled: true,
    darkMode: false,
    language: 'en',
  },

  // Cached data for offline support
  cachedProfiles: [],
  cachedMatches: [],

  // Sync status
  lastSyncTime: null,
  pendingActionsCount: 0,
};

// Action Types
const ActionTypes = {
  INITIALIZE: 'INITIALIZE',
  SET_ONLINE_STATUS: 'SET_ONLINE_STATUS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  SET_CACHED_PROFILES: 'SET_CACHED_PROFILES',
  SET_CACHED_MATCHES: 'SET_CACHED_MATCHES',
  SET_LAST_SYNC: 'SET_LAST_SYNC',
  SET_PENDING_ACTIONS: 'SET_PENDING_ACTIONS',
  RESET_STATE: 'RESET_STATE',
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.INITIALIZE:
      return {
        ...state,
        ...action.payload,
        isInitialized: true,
      };

    case ActionTypes.SET_ONLINE_STATUS:
      return {
        ...state,
        isOnline: action.payload,
      };

    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case ActionTypes.UPDATE_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };

    case ActionTypes.SET_CACHED_PROFILES:
      return {
        ...state,
        cachedProfiles: action.payload,
      };

    case ActionTypes.SET_CACHED_MATCHES:
      return {
        ...state,
        cachedMatches: action.payload,
      };

    case ActionTypes.SET_LAST_SYNC:
      return {
        ...state,
        lastSyncTime: action.payload,
      };

    case ActionTypes.SET_PENDING_ACTIONS:
      return {
        ...state,
        pendingActionsCount: action.payload,
      };

    case ActionTypes.RESET_STATE:
      return {
        ...initialState,
        isInitialized: true,
      };

    default:
      return state;
  }
};

// Storage Keys
const STORAGE_KEYS = {
  SETTINGS: '@app_settings',
  LAST_SYNC: '@last_sync',
};

// Create Context
const AppContext = createContext(null);

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Provider Component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const offlineUnsubscribe = useRef(null);

  // Initialize app state
  useEffect(() => {
    initializeApp();

    return () => {
      if (offlineUnsubscribe.current) {
        offlineUnsubscribe.current();
      }
    };
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize offline service
      await OfflineService.initialize();

      // Subscribe to network changes
      offlineUnsubscribe.current = OfflineService.subscribe((isOnline) => {
        dispatch({ type: ActionTypes.SET_ONLINE_STATUS, payload: isOnline });
      });

      // Load persisted settings
      const [settingsStr, lastSyncStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC),
      ]);

      // Load cached data
      const [cachedProfiles, cachedMatches] = await Promise.all([
        OfflineService.getCachedProfiles(),
        OfflineService.getCachedMatches(),
      ]);

      dispatch({
        type: ActionTypes.INITIALIZE,
        payload: {
          settings: settingsStr ? JSON.parse(settingsStr) : initialState.settings,
          lastSyncTime: lastSyncStr ? JSON.parse(lastSyncStr) : null,
          cachedProfiles: cachedProfiles || [],
          cachedMatches: cachedMatches || [],
          isOnline: OfflineService.getNetworkStatus(),
        },
      });
    } catch (error) {
      console.error('Error initializing app:', error);
      dispatch({ type: ActionTypes.INITIALIZE, payload: {} });
    }
  };

  // Actions
  const setLoading = useCallback((isLoading) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: isLoading });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: ActionTypes.SET_ERROR, payload: error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  }, []);

  const updateSettings = useCallback(
    async (newSettings) => {
      try {
        const updatedSettings = { ...state.settings, ...newSettings };
        await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
        dispatch({ type: ActionTypes.UPDATE_SETTINGS, payload: newSettings });
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    },
    [state.settings]
  );

  const cacheProfiles = useCallback(async (profiles) => {
    try {
      await OfflineService.cacheProfiles(profiles);
      dispatch({ type: ActionTypes.SET_CACHED_PROFILES, payload: profiles });
    } catch (error) {
      console.error('Error caching profiles:', error);
    }
  }, []);

  const cacheMatches = useCallback(async (matches) => {
    try {
      await OfflineService.cacheMatches(matches);
      dispatch({ type: ActionTypes.SET_CACHED_MATCHES, payload: matches });
    } catch (error) {
      console.error('Error caching matches:', error);
    }
  }, []);

  const queueOfflineAction = useCallback(
    async (action) => {
      if (!state.isOnline) {
        await OfflineService.queueAction(action);
        dispatch({
          type: ActionTypes.SET_PENDING_ACTIONS,
          payload: state.pendingActionsCount + 1,
        });
        return true;
      }
      return false;
    },
    [state.isOnline, state.pendingActionsCount]
  );

  const updateLastSync = useCallback(async () => {
    const now = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, JSON.stringify(now));
    dispatch({ type: ActionTypes.SET_LAST_SYNC, payload: now });
  }, []);

  const resetState = useCallback(async () => {
    await AsyncStorage.multiRemove([STORAGE_KEYS.SETTINGS, STORAGE_KEYS.LAST_SYNC]);
    await OfflineService.clearCache();
    dispatch({ type: ActionTypes.RESET_STATE });
  }, []);

  // Context value
  const value = {
    // State
    ...state,

    // Actions
    setLoading,
    setError,
    clearError,
    updateSettings,
    cacheProfiles,
    cacheMatches,
    queueOfflineAction,
    updateLastSync,
    resetState,

    // Selectors
    getOfflineProfiles: () => state.cachedProfiles,
    getOfflineMatches: () => state.cachedMatches,
    hasPendingActions: () => state.pendingActionsCount > 0,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;
