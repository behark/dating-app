export default {
  expo: {
    name: "dating-app",
    slug: "dating-app",
    version: "1.0.0",
    orientation: "default", // Allow both portrait and landscape for tablets
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic", // Support light/dark mode
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    // iOS Configuration - Minimum iOS 14+
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.datingapp.app",
      buildNumber: "1",
      infoPlist: {
        MinimumOSVersion: "14.0",
        UIRequiresFullScreen: false, // Required for iPad multitasking
        UISupportedInterfaceOrientations: [
          "UIInterfaceOrientationPortrait",
          "UIInterfaceOrientationLandscapeLeft",
          "UIInterfaceOrientationLandscapeRight"
        ],
        "UISupportedInterfaceOrientations~ipad": [
          "UIInterfaceOrientationPortrait",
          "UIInterfaceOrientationPortraitUpsideDown",
          "UIInterfaceOrientationLandscapeLeft",
          "UIInterfaceOrientationLandscapeRight"
        ],
        UIUserInterfaceStyle: "Automatic"
      },
      config: {
        usesNonExemptEncryption: false
      }
    },
    // Android Configuration - Minimum Android 8.0 (API 26)
    android: {
      package: "com.datingapp.app",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      // Minimum SDK 26 = Android 8.0 Oreo
      minSdkVersion: 26,
      // Target latest stable SDK for best compatibility
      targetSdkVersion: 34,
      // Support all screen sizes including tablets
      permissions: [],
      allowBackup: false,
      softwareKeyboardLayoutMode: "pan"
    },
    // Web Configuration - Responsive
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
      name: "Dating App",
      shortName: "Dating",
      description: "Find meaningful connections with people near you",
      themeColor: "#667eea",
      backgroundColor: "#ffffff",
      // Enable PWA features
      startUrl: "/",
      display: "standalone",
      orientation: "any"
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
