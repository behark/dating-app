/**
 * Common Constants
 * Centralized string constants to avoid duplication
 * This helps maintain consistency and makes refactoring easier
 */

// ============================================
// ERROR MESSAGES
// ============================================

export const ERROR_MESSAGES = {
  METHOD_NOT_IMPLEMENTED: 'Method not implemented',
  INVALID_USER_ID: 'Invalid user ID provided',
  REQUEST_FAILED: 'Request failed',
  NO_AUTH_TOKEN: 'No authentication token found',
  NO_RESPONSE_FROM_SERVER: 'No response from server',
  INVALID_SERVER_RESPONSE: 'Invalid response from server. Please try again.',
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  UNAUTHORIZED: 'Please sign in to continue.',
  FORBIDDEN: "You don't have permission to perform this action.",
  NOT_FOUND: 'The requested item was not found.',
  USER_NOT_FOUND: 'User not found',
  USER_DATA_NOT_FOUND: 'User data not found',
  INVALID_AGE_RANGE: 'Age must be between 18 and 100',
  INVALID_LIMIT_RANGE: 'Limit must be between 1 and 100',
  RATE_LIMIT: 'Too many requests. Please wait a moment and try again.',
  SERVER_ERROR: 'Our servers are experiencing issues. Please try again later.',
  UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again.',
  GENERIC_ERROR: 'An error occurred. Please try again.',
  SOMETHING_WENT_WRONG: 'Something went wrong. Please try again.',
  OOPS_ERROR: 'Oops! Something went wrong',
};

// ============================================
// AI/ML CONSTANTS
// ============================================

export const AI_MODELS = {
  DEFAULT: 'google/gemini-3-flash',
};

// ============================================
// SUCCESS MESSAGES
// ============================================

export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profile updated successfully',
  PHOTO_UPLOADED: 'Photo uploaded successfully',
  PHOTO_DELETED: 'Photo deleted successfully',
  SETTINGS_SAVED: 'Settings saved successfully',
  MESSAGE_SENT: 'Message sent',
  MATCH_CREATED: "It's a match!",
};

// ============================================
// API ENDPOINTS
// ============================================

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // Profile
  PROFILE: {
    ME: '/profile/me',
    UPDATE: '/profile/update',
    PHOTOS_UPLOAD: '/profile/photos/upload',
    PHOTOS_REORDER: '/profile/photos/reorder',
    PROMPTS: '/profile/prompts',
    PREFERENCES: '/profile/preferences',
    LOCATION: '/profile/location',
    DELETE: '/profile/delete',
  },

  // Discovery
  DISCOVERY: {
    EXPLORE: '/discovery/explore',
    TOP_PICKS: '/discovery/top-picks',
    RECENTLY_ACTIVE: '/discovery/recently-active',
    VERIFIED: '/discovery/verified',
    VERIFY_PROFILE: '/discovery/verify-profile',
  },

  // Chat
  CHAT: {
    CONVERSATIONS: '/chat/conversations',
    MESSAGES: '/chat/messages',
    SEND: '/chat/send',
    MEDIA: {
      GIF: '/chat/media/gif',
      STICKER: '/chat/media/sticker',
      VOICE: '/chat/media/voice',
      VOICE_TRANSCRIBE: '/chat/media/voice/transcribe',
      GIFS_POPULAR: '/chat/media/gifs/popular',
      GIFS_SEARCH: '/chat/media/gifs/search',
      STICKER_PACKS: '/chat/media/sticker-packs',
      VIDEO_CALL_INITIATE: '/chat/media/video-call/initiate',
      VIDEO_CALL_STATUS: '/chat/media/video-call/status',
    },
  },

  // Swipes
  SWIPES: {
    CREATE: '/swipes',
    COUNT_TODAY: '/swipes/count/today',
    UNDO: '/swipes/undo',
    HISTORY: '/swipes/history',
  },

  // Matches
  MATCHES: {
    LIST: '/matches',
    UNMATCH: '/matches/unmatch',
  },

  // Premium
  PREMIUM: {
    STATUS: '/premium/status',
    SUBSCRIBE: '/premium/subscribe',
    FEATURES: '/premium/features',
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    UNREAD: '/notifications/unread',
    MARK_READ: '/notifications/mark-read',
    SETTINGS: '/notifications/settings',
  },
};

// ============================================
// ASYNC STORAGE KEYS
// ============================================

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
  CHAT_THEME_PREFIX: 'chat_theme_',
  CHAT_PATTERN_PREFIX: 'chat_pattern_',
  PENDING_FEEDBACK: '@pending_feedback',
  ONBOARDING_COMPLETE: 'onboardingComplete',
  PUSH_TOKEN: 'pushToken',
  PREFERENCES: 'preferences',
};

// ============================================
// UI MESSAGES
// ============================================

export const UI_MESSAGES = {
  DAILY_LIMIT_REACHED: 'Daily Limit Reached',
  NO_MORE_PROFILES: 'No more profiles to show',
  LOADING: 'Loading...',
  PULL_TO_REFRESH: 'Pull to refresh',
  NO_MATCHES: 'No matches yet',
  NO_MESSAGES: 'No messages yet',
  START_CONVERSATION: 'Start a conversation!',
  UPGRADE_FOR_MORE: 'Upgrade for more features',
};

// ============================================
// PREMIUM MESSAGES
// ============================================

export const PREMIUM_MESSAGES = {
  FEATURE_REQUIRED: 'Premium feature required',
  UPGRADE_TO_SEE_LIKES: 'Upgrade to see who liked you',
  UPGRADE_FOR_PASSPORT: 'Upgrade to use Passport',
  UPGRADE_FOR_FILTERS: 'Upgrade to use Advanced Filters',
  UPGRADE_FOR_REWIND: 'Upgrade to use Rewind',
  UPGRADE_FOR_UNLIMITED: 'Upgrade for unlimited swipes',
  SWIPE_LIMIT_REACHED: 'Daily swipe limit reached. Upgrade to premium for more swipes!',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getChatThemeKey = (matchId) => `${STORAGE_KEYS.CHAT_THEME_PREFIX}${matchId}`;
export const getChatPatternKey = (matchId) => `${STORAGE_KEYS.CHAT_PATTERN_PREFIX}${matchId}`;

/**
 * Get endpoint with dynamic parameters
 * @param {string} endpoint - Base endpoint path
 * @param {Object} params - Parameters to replace in the path
 * @returns {string} Formatted endpoint
 */
export const formatEndpoint = (endpoint, params = {}) => {
  let formattedEndpoint = endpoint;
  Object.entries(params).forEach(([key, value]) => {
    formattedEndpoint = formattedEndpoint.replace(`:${key}`, value);
  });
  return formattedEndpoint;
};
