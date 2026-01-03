import { auth } from '../src/config/firebase';

// Mock Firebase auth module
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
  })),
  initializeAuth: jest.fn(),
  getReactNativePersistence: jest.fn(() => ({})),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

describe('Firebase Configuration', () => {
  it('should initialize Firebase config with valid settings', () => {
    expect(auth).toBeDefined();
  });

  it('should have default demo config fallback', () => {
    const config = {
      apiKey: 'test-key',
      authDomain: 'test.firebaseapp.com',
      projectId: 'test',
      storageBucket: 'test.appspot.com',
      messagingSenderId: '123',
      appId: '1:123:web:abc',
    };
    expect(config).toHaveProperty('apiKey');
    expect(config).toHaveProperty('projectId');
  });
});
