export default {
  expo: {
    name: 'dating-app',
    slug: 'genlang',
    owner: 'beharkabashis-organization',
    version: '1.4.2',
    // Runtime version for OTA updates - increment when native code changes
    runtimeVersion: {
      policy: 'sdkVersion',
    },
    plugins: [
      'expo-font',
      '@react-native-community/datetimepicker',
      'expo-web-browser',
      'expo-secure-store',
      // react-native-iap is auto-linked, no plugin needed
      // Sentry plugin - Uploads disabled to prevent build failures
      // Sentry error tracking will still work in the app, but sourcemaps won't be uploaded
      [
        '@sentry/react-native',
        {
          // Completely disable all uploads to prevent build failures
          uploadNativeSymbols: false,
          uploadSourceMaps: false,
          // Disable Gradle plugin uploads completely
          enableAutoSessionTracking: false,
          // Don't configure organization/project to prevent upload attempts
          // This ensures the Gradle plugin won't try to upload even if credentials exist
          organization: '',
          project: '',
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            kotlinVersion: '2.1.20',
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            minSdkVersion: 26,
            buildToolsVersion: '35.0.0',
          },
        },
      ],
      // react-native-iap is auto-linked, no plugin needed
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
      // URL for Expo updates (EAS Update) - Configure EAS_PROJECT_ID env var
      url: 'https://u.expo.dev/5c4d9519-5ab2-4768-a04c-247118bef600',
    },
    // iOS Configuration - Minimum iOS 14+
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.beharkabashis.datingapp',
      buildNumber: '42',
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
            CFBundleURLName: 'com.beharkabashis.datingapp',
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
      package: 'com.beharkabashis.datingapp',
      versionCode: 42,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      // Minimum SDK 26 = Android 8.0 Oreo
      minSdkVersion: 26,
      // Target SDK 35 (required by Google Play)
      targetSdkVersion: 35,
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
      // PRODUCTION WARNING: All values below are development fallbacks.
      // For production, set proper environment variables to override these defaults.
      // Never commit actual production credentials to source control.
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
      sentryDsn:
        process.env.EXPO_PUBLIC_SENTRY_DSN ||
        'https://e21c92d839607c2d0f9378d08ca96903@o4510655194726400.ingest.de.sentry.io/4510655204687952',
      // Firebase configuration
      firebaseApiKey:
        process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBlk0u4pYjlfcumY3-eCrTZi1LWoTbtfO4',
      firebaseAuthDomain:
        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'my-project-de65d.firebaseapp.com',
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'my-project-de65d',
      firebaseStorageBucket:
        process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'my-project-de65d.firebasestorage.app',
      firebaseMessagingSenderId:
        process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '466295464562',
      firebaseAppId:
        process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:466295464562:web:0edad1169197f22b3758eb',
      firebaseMeasurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-6SVJV18H0Q',
      // Google OAuth Client IDs (required for Google Sign-In)
      // - Web must be an OAuth Client ID ending with `.apps.googleusercontent.com`
      // - iOS/Android are optional unless you ship native builds
      googleWebClientId:
        process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
        '466295464562-d46eopil8i350mjdffno9v38bvt4nn31.apps.googleusercontent.com',
      googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
      googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
      // EAS Project ID for updates
      // Get your project ID by running: eas project:info
      eas: {
        projectId: process.env.EAS_PROJECT_ID || '5c4d9519-5ab2-4768-a04c-247118bef600',
      },
    },
  },
};
