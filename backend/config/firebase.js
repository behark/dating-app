// Firebase Admin SDK configuration for backend
// This is a stub that provides the interface without requiring actual Firebase credentials

let db = null;
let admin = null;

// Only initialize Firebase if credentials are available
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
  try {
    const firebaseAdmin = require('firebase-admin');
    
    // Initialize Firebase Admin
    if (!firebaseAdmin.apps.length) {
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
      });
    }
    
    admin = firebaseAdmin;
    db = firebaseAdmin.firestore();
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.warn('Firebase Admin initialization failed:', error.message);
  }
} else {
  console.warn('Firebase credentials not configured - using MongoDB fallback');
}

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
        data: () => null
      }),
      update: async (data) => {
        console.log(`Mock Firestore: Would update ${name}/${id}`, data);
        return { id };
      },
      delete: async () => {
        console.log(`Mock Firestore: Would delete ${name}/${id}`);
        return true;
      }
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
        forEach: () => {}
      }),
      orderBy: () => ({
        limit: () => ({
          get: async () => ({
            empty: true,
            docs: []
          })
        }),
        get: async () => ({
          empty: true,
          docs: []
        })
      })
    }),
    orderBy: () => ({
      limit: () => ({
        get: async () => ({
          empty: true,
          docs: []
        })
      })
    })
  })
};

module.exports = {
  db: db || mockDb,
  admin
};
