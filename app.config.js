export default {
  expo: {
    name: 'dating-app',
    slug: 'dating-app',
    version: '1.0.0',
    // Runtime version for OTA updates - increment when native code changes
    runtimeVersion: {
      policy: 'sdkVersion',
    },
    plugins: [
      'expo-in-app-purchases',
    ],
    orientation: 'default', // Allow both portrait and landscape for tablets
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic', // Support light/dark mode
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    // OTA Updates Configuration
    updates: {
      enabled: true,
      // Check for updates when app starts
      checkAutomatically: 'ON_LOAD',
      // Fallback timeout if update check fails (5 seconds)
      fallbackToCacheTimeout: 5000,
      // URL for Expo updates (EAS Update)
      url: 'https://u.expo.dev/your-project-id',
    },
    // iOS Configuration - Minimum iOS 14+
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.datingapp.app',
      buildNumber: '1',
      // Deep linking support
      associatedDomains: ['applinks:dating-app.com', 'applinks:*.dating-app.com'],
      infoPlist: {
        MinimumOSVersion: '14.0',
        UIRequiresFullScreen: false, // Required for iPad multitasking
        UISupportedInterfaceOrientations: [
          'UIInterfaceOrientationPortrait',
          'UIInterfaceOrientationLandscapeLeft',
          'UIInterfaceOrientationLandscapeRight',
        ],
        'UISupportedInterfaceOrientations~ipad': [
          'UIInterfaceOrientationPortrait',
          'UIInterfaceOrientationPortraitUpsideDown',
          'UIInterfaceOrientationLandscapeLeft',
          'UIInterfaceOrientationLandscapeRight',
        ],
        UIUserInterfaceStyle: 'Automatic',
        // Deep linking configuration
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: ['dating-app', 'exp'],
            CFBundleURLName: 'com.datingapp.app',
          },
        ],
        // Required permission usage descriptions for App Store submission
        NSPhotoLibraryUsageDescription:
          'We need access to your photos to upload profile pictures and share images in chats.',
        NSCameraUsageDescription:
          'We need camera access to take photos for your profile and verify your identity.',
        NSLocationWhenInUseUsageDescription:
          'We use your location to show you people nearby and enable distance-based matching. Your exact location is never shared with other users.',
        NSUserTrackingUsageDescription:
          'We use this to personalize your experience, show you relevant matches, and improve our service. You can change this in Settings at any time.',
      },
      config: {
        usesNonExemptEncryption: false,
      },
    },
    // Android Configuration - Minimum Android 8.0 (API 26)
    android: {
      package: 'com.datingapp.app',
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      // Minimum SDK 26 = Android 8.0 Oreo
      minSdkVersion: 26,
      // Target latest stable SDK for best compatibility
      targetSdkVersion: 34,
      // Support all screen sizes including tablets
      permissions: [],
      allowBackup: false,
      softwareKeyboardLayoutMode: 'pan',
      // Deep linking support
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'dating-app',
              host: '*',
            },
            {
              scheme: 'exp',
              host: '*',
            },
            {
              scheme: 'https',
              host: 'dating-app.com',
              pathPrefix: '/',
            },
            {
              scheme: 'https',
              host: '*.dating-app.com',
              pathPrefix: '/',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    // Web Configuration - Responsive
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
      name: 'Dating App',
      shortName: 'Dating',
      description: 'Find meaningful connections with people near you',
      themeColor: '#667eea',
      backgroundColor: '#ffffff',
      // Enable PWA features
      startUrl: '/',
      display: 'standalone',
      orientation: 'any',
    },
    // Deep Linking Configuration
    scheme: 'dating-app',
    // Extra configuration for runtime access
    extra: {
      // Environment
      env: process.env.EXPO_PUBLIC_ENV || 'production',
      // Support Expo Go for development
      ...(process.env.EXPO_PUBLIC_ENV === 'development' && {
        expoGoScheme: 'exp',
      }),
      // Backend API URL - Uses Vercel env var or defaults to production Render URL
      backendUrl:
        process.env.EXPO_PUBLIC_API_URL ||
        process.env.EXPO_PUBLIC_BACKEND_URL ||
        'https://dating-app-backend-x4yq.onrender.com/api',
      // Also expose the raw URL for socket connections
      apiUrl: (
        process.env.EXPO_PUBLIC_API_URL ||
        process.env.EXPO_PUBLIC_BACKEND_URL ||
        'https://dating-app-backend-x4yq.onrender.com/api'
      ).replace('/api', ''),
      // Sentry DSN for error tracking
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
      // Firebase configuration
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'your_firebase_api_key_here',
      firebaseAuthDomain:
        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'your_project.firebaseapp.com',
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'your_project_id',
      firebaseStorageBucket:
        process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'your_project_id.appspot.com',
      firebaseMessagingSenderId:
        process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'your_sender_id',
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 'your_app_id',
      firebaseMeasurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
      // Google OAuth Client IDs (required for Google Sign-In)
      // - Web must be an OAuth Client ID ending with `.apps.googleusercontent.com`
      // - iOS/Android are optional unless you ship native builds
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
      googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
      googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
      // EAS Project ID for updates
      eas: {
        projectId: process.env.EAS_PROJECT_ID || 'your-project-id',
      },
    },
  },
};
