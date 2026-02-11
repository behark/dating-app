// Jest setup file
import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    })
  ),
}));

// Mock Expo modules
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      backendUrl: 'http://localhost:3000/api',
      googleWebClientId: 'test-client-id',
    },
  },
}));

jest.mock('expo-auth-session', () => ({
  useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock('expo-linking', () => ({
  openURL: jest.fn(() => Promise.resolve()),
  createURL: jest.fn(),
  parseURL: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  isAvailableAsync: jest.fn(async () => false),
  setItemAsync: jest.fn(async () => undefined),
  getItemAsync: jest.fn(async () => null),
  deleteItemAsync: jest.fn(async () => undefined),
}));

// Mock React Native
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Platform.OS = 'web';
  RN.Dimensions = {
    get: jest.fn(() => ({ width: 375, height: 812 })),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  };
  return RN;
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    PanGestureHandler: View,
    GestureHandlerRootView: View,
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    default: {
      View: View,
    },
    useAnimatedGestureHandler: jest.fn(() => ({})),
    useAnimatedStyle: jest.fn(() => ({})),
    useSharedValue: jest.fn((val) => ({ value: val })),
    withSpring: jest.fn((val) => val),
    withTiming: jest.fn((val) => val),
    runOnJS: jest.fn((fn) => fn),
    Easing: {
      inOut: jest.fn(() => ({})),
    },
  };
});

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
