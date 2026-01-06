# Frontend Production Features Setup Guide

This guide provides step-by-step instructions to complete the production readiness setup for the dating app frontend.

---

## 📦 Required Dependencies Installation

### 1. Network Detection (Offline Support)
```bash
npx expo install @react-native-community/netinfo
```

### 2. Push Notifications
```bash
npx expo install expo-notifications expo-device
```

### 3. Analytics (Choose one)

**Option A: Firebase Analytics (Recommended)**
```bash
npx expo install expo-firebase-analytics
# Also configure Firebase in app.config.js (already done)
```

**Option B: Segment Analytics**
```bash
npm install @segment/analytics-react-native
```

### 4. Error Tracking (Optional but Recommended)
```bash
npx expo install @sentry/react-native
```

---

## 🔧 Integration Steps

### Step 1: Wrap App with ErrorBoundary

Update your `App.js` to wrap the entire app with the ErrorBoundary component:

```javascript
import React from 'react';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { OfflineBanner } from './src/components/OfflineBanner';
import UpdateService from './src/services/UpdateService';
import NotificationService from './src/services/NotificationService';
import AnalyticsService from './src/services/AnalyticsService';

export default function App() {
  // Initialize services on app start
  React.useEffect(() => {
    const initializeApp = async () => {
      // Initialize analytics
      await AnalyticsService.initialize();
      
      // Initialize OTA updates
      await UpdateService.initialize();
      
      // Register for push notifications
      const pushToken = await NotificationService.registerForPushNotifications();
      if (pushToken) {
        console.log('Push token:', pushToken);
        // TODO: Send push token to your backend
        // await api.post('/users/push-token', { token: pushToken });
      }

      // Setup notification listeners
      const cleanup = NotificationService.setupNotificationListeners(
        (notification) => {
          console.log('Notification received:', notification);
        },
        (response) => {
          // Handle notification tap - navigate to appropriate screen
          const data = response.notification.request.content.data;
          console.log('Notification tapped:', data);
          // TODO: Navigate based on notification data
        }
      );

      return cleanup;
    };

    const cleanup = initializeApp();
    
    return () => {
      cleanup.then(fn => fn && fn());
      UpdateService.cleanup();
    };
  }, []);

  return (
    <ErrorBoundary>
      {/* Your app navigation and content */}
      <YourNavigationContainer>
        {/* Your screens */}
      </YourNavigationContainer>
      
      {/* Offline banner - shows when no internet */}
      <OfflineBanner />
    </ErrorBoundary>
  );
}
```

### Step 2: Add Deep Linking to Navigation

In your navigation setup file (e.g., `src/navigation/AppNavigator.js`):

```javascript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useDeepLinking } from './DeepLinkHandler';

export default function AppNavigator() {
  const navigationRef = React.useRef();

  // Enable deep linking
  useDeepLinking(navigationRef.current);

  return (
    <NavigationContainer ref={navigationRef}>
      {/* Your navigation structure */}
    </NavigationContainer>
  );
}
```

### Step 3: Add Analytics to Key Screens

Example for tracking screen views and user actions:

```javascript
import React, { useEffect } from 'react';
import AnalyticsService from '../services/AnalyticsService';

export default function DiscoverScreen() {
  // Track screen view
  useEffect(() => {
    AnalyticsService.logScreenView('Discover');
  }, []);

  const handleSwipe = async (action, profileId) => {
    // Track swipe action
    await AnalyticsService.logSwipe(action, profileId);
    
    // Your swipe logic...
  };

  return (
    // Your screen UI
  );
}
```

### Step 4: Handle Network Status in API Calls

Update your API service to handle offline state:

```javascript
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Alert } from 'react-native';

export function YourComponent() {
  const { isOnline } = useNetworkStatus();

  const makeAPICall = async () => {
    if (!isOnline) {
      Alert.alert(
        'No Internet Connection',
        'Please check your internet connection and try again.'
      );
      return;
    }

    // Make API call...
  };

  return (
    // Your component UI
  );
}
```

---

## 🔐 Environment Variables Setup

Update your `.env` or environment configuration:

```bash
# EAS Project ID (for OTA updates and push notifications)
EAS_PROJECT_ID=your-actual-project-id

# Firebase Configuration (for analytics)
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Sentry DSN (for error tracking - optional)
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn

# API URLs
EXPO_PUBLIC_API_URL=https://your-backend-api.com/api
EXPO_PUBLIC_BACKEND_URL=https://your-backend-api.com
```

---

## 🎯 EAS Setup (For Push Notifications & OTA Updates)

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
eas login
```

### 3. Configure EAS
```bash
eas build:configure
```

This will:
- Create/update `eas.json`
- Generate a unique project ID
- Update `app.config.js` with the project ID

### 4. Configure EAS Update
```bash
eas update:configure
```

### 5. Build for Testing
```bash
# iOS
eas build --platform ios --profile development

# Android
eas build --platform android --profile development
```

---

## 📱 Testing Checklist

### Error Boundaries
```javascript
// Test by intentionally throwing an error
const TestErrorScreen = () => {
  throw new Error('Test error');
  return null;
};
```

### Offline Detection
1. Turn off WiFi/mobile data
2. Verify offline banner appears
3. Try making API calls - should show offline message
4. Turn internet back on
5. Verify banner disappears

### Push Notifications
1. Run on physical device (not simulator)
2. Grant notification permissions
3. Check console for push token
4. Send test notification from Expo push tool: https://expo.dev/notifications
5. Verify notification appears
6. Tap notification and verify navigation works

### Deep Linking
```bash
# Test on iOS Simulator
xcrun simctl openurl booted dating-app://profile/123

# Test on Android Emulator
adb shell am start -W -a android.intent.action.VIEW \
  -d "dating-app://profile/123" com.datingapp.app
```

### Analytics
1. Enable Firebase debug mode in development
2. Trigger events (sign up, swipe, match, etc.)
3. Verify events appear in Firebase Analytics console (realtime view)
4. Check DebugView: https://console.firebase.google.com/project/YOUR_PROJECT/analytics/debugview

### OTA Updates
```bash
# Publish an update
eas update --branch production --message "Bug fixes"

# Test update
# 1. Build and install app
# 2. Publish update
# 3. Force close and restart app
# 4. Verify update is downloaded and applied
```

---

## 🐛 Troubleshooting

### Push Notifications Not Working

**Issue:** Not receiving push tokens

**Solutions:**
1. Ensure running on physical device (not simulator/emulator)
2. Check EAS project ID is configured in `app.config.js`
3. Verify permissions are granted
4. Check console logs for errors

**Issue:** Notifications not appearing

**Solutions:**
1. Check notification permissions in device settings
2. Verify Android notification channels are created
3. Test with Expo push tool first
4. Check backend is sending correct payload format

### Offline Detection Not Working

**Issue:** Banner not appearing when offline

**Solutions:**
1. Verify `@react-native-community/netinfo` is installed
2. Check console for NetInfo warnings
3. Test on physical device (simulators may not accurately detect network changes)

### Deep Links Not Opening

**Issue:** App not opening from links

**Solutions:**
1. Verify URL scheme in `app.config.js` matches deep link URL
2. Check iOS associated domains configuration
3. Verify Android intent filters are correct
4. Rebuild app after changing configuration
5. Test with `adb` or `xcrun simctl` commands first

### Analytics Not Tracking

**Issue:** Events not appearing in Firebase

**Solutions:**
1. Verify Firebase configuration in `app.config.js`
2. Check Firebase project has Analytics enabled
3. Use DebugView for real-time testing
4. Wait 24 hours for events to appear in standard reports
5. Check console logs for analytics initialization

---

## 📚 Additional Resources

### Documentation
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Updates](https://docs.expo.dev/versions/latest/sdk/updates/)
- [NetInfo](https://github.com/react-native-netinfo/react-native-netinfo)
- [Firebase Analytics](https://firebase.google.com/docs/analytics)
- [React Navigation Deep Linking](https://reactnavigation.org/docs/deep-linking/)

### Testing Tools
- [Expo Push Notification Tool](https://expo.dev/notifications)
- [Firebase Analytics DebugView](https://firebase.google.com/docs/analytics/debugview)
- [Deep Link Tester](https://branchio.github.io/universal-linking-validator/)

---

## ✅ Production Readiness Checklist

Before deploying to production:

- [ ] All dependencies installed (`@react-native-community/netinfo`, `expo-notifications`, analytics)
- [ ] ErrorBoundary wrapping entire app
- [ ] OfflineBanner component added
- [ ] Push notifications registered and token sent to backend
- [ ] Analytics initialized and tracking key events
- [ ] Deep linking configured and tested
- [ ] EAS project configured (`eas.json` created)
- [ ] Environment variables set for production
- [ ] Tested error boundary with intentional error
- [ ] Tested offline detection by disabling internet
- [ ] Tested push notifications on physical device
- [ ] Tested deep links on iOS and Android
- [ ] Tested analytics events appear in dashboard
- [ ] Tested OTA update flow
- [ ] Backend endpoint created for receiving push tokens
- [ ] Backend endpoint created for minimum version check
- [ ] Privacy policy updated with data collection details
- [ ] App Store/Play Store assets prepared

---

## 🚀 Deployment Commands

### Build for Production

```bash
# iOS App Store
eas build --platform ios --profile production

# Android Play Store
eas build --platform android --profile production
```

### Publish OTA Update

```bash
# Production update
eas update --branch production --message "Your update message"

# Staging update
eas update --branch staging --message "Test update"
```

### Submit to App Stores

```bash
# iOS
eas submit --platform ios

# Android
eas submit --platform android
```

---

**Last Updated:** January 6, 2026  
**Version:** 1.0.0
