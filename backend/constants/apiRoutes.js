/**
 * Backend Constants - API Routes
 * Centralized route path definitions to avoid duplication
 */

// ============================================
// API PREFIX
// ============================================

const API_PREFIX = '/api';

// ============================================
// ROUTE PREFIXES (used in server.js)
// ============================================

const ROUTE_PREFIXES = {
  AUTH: `${API_PREFIX}/auth`,
  PROFILE: `${API_PREFIX}/profile`,
  ACTIVITY: `${API_PREFIX}/activity`,
  SOCIAL_MEDIA: `${API_PREFIX}/social-media`,
  CHAT: `${API_PREFIX}/chat`,
  AI: `${API_PREFIX}/ai`,
  SWIPES: `${API_PREFIX}/swipes`,
  INTERACTIONS: `${API_PREFIX}/interactions`,
  DISCOVERY: `${API_PREFIX}/discovery`,
  NOTIFICATIONS: `${API_PREFIX}/notifications`,
  SAFETY: `${API_PREFIX}/safety`,
  PREMIUM: `${API_PREFIX}/premium`,
  USERS: `${API_PREFIX}/users`,
  MATCHES: `${API_PREFIX}/matches`,
  MESSAGES: `${API_PREFIX}/messages`,
  SETTINGS: `${API_PREFIX}/settings`,
  PAYMENTS: `${API_PREFIX}/payments`,
  WEBHOOKS: `${API_PREFIX}/webhooks`,
};

// ============================================
// AUTH ROUTES
// ============================================

const AUTH_ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  LOGOUT: '/logout',
  REFRESH_TOKEN: '/refresh-token',
  VERIFY_EMAIL: '/verify-email',
  RESEND_VERIFICATION: '/resend-verification',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  CHANGE_PASSWORD: '/change-password',
  VERIFY_PHONE: '/verify-phone',
  GOOGLE: '/google',
  APPLE: '/apple',
  FACEBOOK: '/facebook',
};

// ============================================
// PROFILE ROUTES
// ============================================

const PROFILE_ROUTES = {
  ME: '/me',
  UPDATE: '/update',
  PHOTOS: '/photos',
  PHOTOS_UPLOAD: '/photos/upload',
  PHOTOS_REORDER: '/photos/reorder',
  PHOTOS_DELETE: '/photos/:photoId',
  PROMPTS: '/prompts',
  PREFERENCES: '/preferences',
  LOCATION: '/location',
  PRIVACY: '/privacy',
  VERIFICATION: '/verification',
  DELETE: '/delete',
};

// ============================================
// DISCOVERY ROUTES
// ============================================

const DISCOVERY_ROUTES = {
  EXPLORE: '/explore',
  TOP_PICKS: '/top-picks',
  RECENTLY_ACTIVE: '/recently-active',
  VERIFIED: '/verified',
  VERIFY_PROFILE: '/verify-profile',
  APPROVE_VERIFICATION: '/approve-verification',
  RECOMMENDATIONS: '/recommendations',
  FILTERS: '/filters',
};

// ============================================
// CHAT ROUTES
// ============================================

const CHAT_ROUTES = {
  CONVERSATIONS: '/conversations',
  CONVERSATION_BY_ID: '/conversations/:conversationId',
  MESSAGES: '/messages',
  MESSAGES_BY_MATCH: '/messages/:matchId',
  SEND: '/send',
  READ: '/read',
  DELETE: '/delete/:messageId',
  TYPING: '/typing',
  MEDIA: {
    GIF: '/media/gif',
    STICKER: '/media/sticker',
    VOICE: '/media/voice',
    VOICE_TRANSCRIBE: '/media/voice/transcribe',
    GIFS_POPULAR: '/media/gifs/popular',
    GIFS_SEARCH: '/media/gifs/search',
    STICKER_PACKS: '/media/sticker-packs',
    VIDEO_CALL_INITIATE: '/media/video-call/initiate',
    VIDEO_CALL_STATUS: '/media/video-call/status',
  },
};

// ============================================
// SWIPES ROUTES
// ============================================

const SWIPE_ROUTES = {
  CREATE: '/',
  COUNT_TODAY: '/count/today',
  UNDO: '/undo',
  HISTORY: '/history',
  RECEIVED: '/received',
  STATISTICS: '/statistics',
  PENDING_LIKES: '/pending-likes',
};

// ============================================
// PREMIUM ROUTES
// ============================================

const PREMIUM_ROUTES = {
  STATUS: '/status',
  SUBSCRIBE: '/subscribe',
  CANCEL: '/cancel',
  FEATURES: '/features',
  LIKED_ME: '/liked-me',
  PASSPORT: '/passport',
  BOOST: '/boost',
  SUPER_LIKES: '/super-likes',
  REWIND: '/rewind',
};

// ============================================
// NOTIFICATIONS ROUTES
// ============================================

const NOTIFICATION_ROUTES = {
  LIST: '/',
  UNREAD: '/unread',
  MARK_READ: '/mark-read',
  MARK_ALL_READ: '/mark-all-read',
  SETTINGS: '/settings',
  REGISTER_DEVICE: '/register-device',
};

// ============================================
// SETTINGS ROUTES
// ============================================

const SETTINGS_ROUTES = {
  PREFERENCES: '/preferences',
  PRIVACY: '/privacy',
  NOTIFICATIONS: '/notifications',
  BLOCKED_USERS: '/blocked-users',
  HIDE_ADS: '/hide-ads',
};

module.exports = {
  API_PREFIX,
  ROUTE_PREFIXES,
  AUTH_ROUTES,
  PROFILE_ROUTES,
  DISCOVERY_ROUTES,
  CHAT_ROUTES,
  SWIPE_ROUTES,
  PREMIUM_ROUTES,
  NOTIFICATION_ROUTES,
  SETTINGS_ROUTES,
};
