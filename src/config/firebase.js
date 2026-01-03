import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Firebase configuration
// Replace these values with your Firebase project credentials from Firebase Console
// For Expo, you can use app.json or environment variables
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || "your_api_key_here",
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || "your_project_id.firebaseapp.com",
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || "your_project_id",
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || "your_project_id.appspot.com",
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || "your_sender_id",
  appId: Constants.expoConfig?.extra?.firebaseAppId || "your_app_id"
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.warn('Firebase initialization error:', error);
  // Fallback initialization
  app = initializeApp({
    apiKey: "demo-key",
    authDomain: "demo.firebaseapp.com",
    projectId: "demo",
    storageBucket: "demo.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
  });
}

// Initialize Auth with AsyncStorage persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // If auth already initialized, get the existing instance
  auth = getAuth(app);
}

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage (optional - may not be available on free tier)
let storage;
try {
  storage = getStorage(app);
} catch (error) {
  console.warn('Firebase Storage not available:', error);
  storage = null;
}

export { auth, db, storage };
export default app;
