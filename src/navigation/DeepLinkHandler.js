import { useEffect } from 'react';
import { Linking } from 'react-native';
import { CommonActions } from '@react-navigation/native';

/**
 * Deep Link Handler
 * Handles deep linking navigation for the app
 * 
 * Supported URL schemes:
 * - dating-app://profile/:userId
 * - dating-app://chat/:matchId
 * - dating-app://match/:matchId
 * - https://dating-app.com/profile/:userId
 * - https://dating-app.com/chat/:matchId
 */

/**
 * Parse deep link URL and extract route information
 * @param {string} url - Deep link URL
 * @returns {Object|null} Route object with screen and params, or null if invalid
 */
export const parseDeepLink = (url) => {
  if (!url) return null;

  try {
    // Match patterns:
    // dating-app://screen/id
    // https://dating-app.com/screen/id
    const match = url.match(
      /(?:dating-app:\/\/|https?:\/\/(?:www\.)?dating-app\.com\/)([^/?]+)(?:\/([^?]+))?/
    );

    if (!match) {
      console.log('Deep link does not match expected format:', url);
      return null;
    }

    const [, screen, id] = match;

    // Map URL paths to screen names
    switch (screen.toLowerCase()) {
      case 'profile':
        if (!id) return null;
        return {
          screen: 'ViewProfile',
          params: { userId: id },
        };

      case 'chat':
      case 'message':
      case 'conversation':
        if (!id) return null;
        return {
          screen: 'Chat',
          params: { matchId: id },
        };

      case 'match':
      case 'matches':
        if (id) {
          return {
            screen: 'Main',
            params: { screen: 'Matches' },
          };
        }
        return {
          screen: 'Main',
          params: { screen: 'Matches' },
        };

      case 'discover':
      case 'swipe':
        return {
          screen: 'Main',
          params: { screen: 'Discover' },
        };

      case 'settings':
        return {
          screen: 'Preferences',
          params: {},
        };

      case 'premium':
      case 'subscription':
        return {
          screen: 'Premium',
          params: {},
        };

      default:
        console.log('Unknown deep link screen:', screen);
        return null;
    }
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return null;
  }
};

/**
 * Hook to handle deep linking in the app
 * @param {Object} navigationRef - React Navigation container ref (from NavigationContainer)
 */
export const useDeepLinking = (navigationRef) => {
  useEffect(() => {
    if (!navigationRef || !navigationRef.current) {
      // Navigation not ready yet - this is expected on initial mount
      return;
    }

    /**
     * Handle deep link navigation
     * @param {Object} event - Deep link event
     */
    const handleDeepLink = ({ url }) => {
      if (!url) return;

      console.log('Deep link received:', url);

      // Parse the URL
      const route = parseDeepLink(url);

      if (route) {
        console.log('Navigating to:', route.screen, route.params);
        
        // Navigate to the parsed route using NavigationContainer ref
        try {
          if (navigationRef.current) {
            navigationRef.current.dispatch(
              CommonActions.navigate({
                name: route.screen,
                params: route.params,
              })
            );
          }
        } catch (error) {
          console.error('Error navigating to deep link:', error);
        }
      } else {
        console.log('Could not parse deep link, ignoring');
      }
    };

    // Get initial URL (app opened from closed state via deep link)
    Linking.getInitialURL()
      .then((url) => {
        if (url) {
          console.log('Initial URL:', url);
          handleDeepLink({ url });
        }
      })
      .catch((error) => {
        console.error('Error getting initial URL:', error);
      });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Cleanup listener on unmount
    return () => {
      subscription.remove();
    };
  }, [navigationRef]);
};

/**
 * Create a deep link URL
 * @param {string} screen - Screen name
 * @param {Object} params - Screen parameters
 * @returns {string} Deep link URL
 */
export const createDeepLink = (screen, params = {}) => {
  const baseUrl = 'dating-app://';
  
  // Map screen names to URL paths
  const screenPaths = {
    ViewProfile: 'profile',
    Chat: 'chat',
    Matches: 'matches',
    Discover: 'discover',
    Preferences: 'settings',
    Premium: 'premium',
  };

  const path = screenPaths[screen] || screen.toLowerCase();
  
  // Build URL with parameters
  let url = `${baseUrl}${path}`;
  
  // Add ID parameter if present
  if (params.userId) {
    url += `/${params.userId}`;
  } else if (params.matchId) {
    url += `/${params.matchId}`;
  }

  return url;
};

/**
 * Create a universal link URL (https)
 * @param {string} screen - Screen name
 * @param {Object} params - Screen parameters
 * @returns {string} Universal link URL
 */
export const createUniversalLink = (screen, params = {}) => {
  const deepLink = createDeepLink(screen, params);
  // Replace scheme with https
  return deepLink.replace('dating-app://', 'https://dating-app.com/');
};

/**
 * Open a URL (external link)
 * @param {string} url - URL to open
 */
export const openURL = async (url) => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.error('Cannot open URL:', url);
    }
  } catch (error) {
    console.error('Error opening URL:', error);
  }
};

export default {
  useDeepLinking,
  parseDeepLink,
  createDeepLink,
  createUniversalLink,
  openURL,
};
