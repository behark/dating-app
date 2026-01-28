import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { getApps, initializeApp } from 'firebase/app';
// eslint-disable-next-line import/named
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import logger from '../utils/logger';

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId,
  appId: Constants.expoConfig?.extra?.firebaseAppId,
  measurementId: Constants.expoConfig?.extra?.firebaseMeasurementId,
};

// Initialize Firebase - only if not already initialized and config is valid
let app;
const existingApps = getApps();
if (existingApps.length === 0) {
  // Only initialize if we have required config values
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    try {
      app = initializeApp(firebaseConfig);
      logger.info('Firebase initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Firebase:', error);
      app = null;
    }
  } else {
    logger.warn('Firebase config incomplete - skipping initialization', {
      hasApiKey: !!firebaseConfig.apiKey,
      hasProjectId: !!firebaseConfig.projectId,
    });
    app = null;
  }
} else {
  app = existingApps[0];
}

// Initialize Auth with AsyncStorage persistence (only if app exists)
let auth = null;
if (app) {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    // If auth already initialized, get the existing instance
    auth = getAuth(app);
  }
}

// Initialize Firestore (only if app exists)
let db = null;
if (app) {
  try {
    db = getFirestore(app);
  } catch (error) {
    logger.warn('Firestore initialization failed:', error);
  }
}

// Initialize Storage (optional - may not be available on free tier)
let storage = null;
if (app) {
  try {
    storage = getStorage(app);
  } catch (error) {
    logger.warn('Firebase Storage not available', error);
  }
}

export { auth, db, storage };
export default app;
