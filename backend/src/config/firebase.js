// Firebase Admin SDK configuration for backend
// Supports both service account JSON file and environment variables

const path = require('path');
const fs = require('fs');

let db = null;
let admin = null;
let initialized = false;

/**
 * Initialize Firebase Admin SDK
 * Priority:
 * 1. Service account JSON file (keys/firebase-service-account.json)
 * 2. Environment variables (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL)
 * 3. Fall back to mock/MongoDB
 */
const initializeFirebase = () => {
  if (initialized) return { admin, db };

  try {
    const firebaseAdmin = require('firebase-admin');

    // Skip if already initialized
    if (firebaseAdmin.apps.length) {
      admin = firebaseAdmin;
      db = firebaseAdmin.firestore();
      initialized = true;
      return { admin, db };
    }

    // Option 1: Try service account JSON file
    const serviceAccountPath = path.join(__dirname, '../keys/firebase-service-account.json');

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);

      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(serviceAccount),
      });

      admin = firebaseAdmin;
      db = firebaseAdmin.firestore();
      initialized = true;
      console.log('✅ Firebase Admin initialized with service account file');
      return { admin, db };
    }

    // Option 2: Try environment variables
    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_CLIENT_EMAIL
    ) {
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });

      admin = firebaseAdmin;
      db = firebaseAdmin.firestore();
      initialized = true;
      console.log('✅ Firebase Admin initialized with environment variables');
      return { admin, db };
    }

    // No credentials available
    console.warn('⚠️ Firebase credentials not configured - using MongoDB fallback');
    return { admin: null, db: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('⚠️ Firebase Admin initialization failed:', errorMessage);
    return { admin: null, db: null };
  }
};

// Initialize on module load
initializeFirebase();

// Mock Firestore interface for when Firebase is not available
const mockDb = {
  collection: (name) => ({
    doc: (id) => ({
      set: async (data) => {
        console.log(`Mock Firestore: Would set ${name}/${id}`, data);
        return { id };
      },
      get: async () => ({
        exists: false,
        data: () => null,
      }),
      update: async (data) => {
        console.log(`Mock Firestore: Would update ${name}/${id}`, data);
        return { id };
      },
      delete: async () => {
        console.log(`Mock Firestore: Would delete ${name}/${id}`);
        return true;
      },
    }),
    add: async (data) => {
      const id = Date.now().toString();
      console.log(`Mock Firestore: Would add to ${name}`, data);
      return { id };
    },
    where: () => ({
      get: async () => ({
        empty: true,
        docs: [],
        forEach: () => {},
      }),
      orderBy: () => ({
        limit: () => ({
          get: async () => ({
            empty: true,
            docs: [],
          }),
        }),
        get: async () => ({
          empty: true,
          docs: [],
        }),
      }),
    }),
    orderBy: () => ({
      limit: () => ({
        get: async () => ({
          empty: true,
          docs: [],
        }),
      }),
    }),
  }),
};

module.exports = {
  db: db || mockDb,
  admin,
};
