export default {
  expo: {
    name: "dating-app",
    slug: "dating-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    extra: {
      backendUrl: process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:3000/api",
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "your_firebase_api_key_here",
      firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "your_project.firebaseapp.com",
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "your_project_id",
      firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "your_project_id.appspot.com",
      firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "your_sender_id",
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "your_app_id",
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "your_google_web_client_id"
    }
  }
};
