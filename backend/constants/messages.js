/**
 * Backend Constants - Centralized Messages
 * Reduces duplicate strings across controllers, middleware, and services
 */

// ============================================
// ERROR MESSAGES
// ============================================

const ERROR_MESSAGES = {
  // Authentication Errors
  AUTH_REQUIRED: 'Authentication required',
  INVALID_TOKEN: 'Invalid token',
  INVALID_TOKEN_FORMAT: 'Invalid token format',
  INVALID_REFRESH_TOKEN: 'Invalid refresh token',
  TOKEN_EXPIRED: 'Token has expired',
  INVALID_CREDENTIALS: 'Invalid email or password',
  INVALID_VERIFICATION_TOKEN: 'Invalid or expired verification token',
  INVALID_RESET_TOKEN: 'Invalid or expired reset token',
  INVALID_CSRF_TOKEN: 'Invalid CSRF token',
  
  // User Errors
  USER_NOT_FOUND: 'User not found',
  USER_NOT_FOUND_OR_INACTIVE: 'User not found or inactive',
  USER_NOT_FOUND_OR_NO_EMAIL: 'User not found or no email',
  EMAIL_ALREADY_EXISTS: 'User with this email already exists',
  
  // Access Errors
  ACCESS_DENIED: 'Access denied',
  ACCESS_DENIED_OWN_DATA: 'Access denied. You can only access your own data.',
  ACCESS_DENIED_MATCHES_ONLY: 'Access denied. You can only view profiles of your matches.',
  ACCESS_DENIED_CONVERSATION: 'Access denied to this conversation',
  MESSAGE_NOT_FOUND_OR_ACCESS_DENIED: 'Message not found or access denied',
  MATCH_NOT_FOUND_OR_ACCESS_DENIED: 'Match not found or access denied',
  
  // Resource Errors
  NOT_FOUND: 'Resource not found',
  MATCH_NOT_FOUND: 'Match not found',
  MESSAGE_NOT_FOUND: 'Message not found',
  CONVERSATION_NOT_FOUND: 'Conversation not found',
  PROFILE_NOT_FOUND: 'Profile not found',
  
  // Server Errors
  INTERNAL_SERVER_ERROR: 'Internal server error',
  INTERNAL_ERROR_DISCOVERY: 'Internal server error during user discovery',
  INTERNAL_ERROR_SWIPE: 'Internal server error while creating swipe',
  INTERNAL_ERROR_SWIPE_COUNT: 'Internal server error while retrieving swipe count',
  INTERNAL_ERROR_UNDO_SWIPE: 'Internal server error while undoing swipe',
  INTERNAL_ERROR_GET_SWIPES: 'Internal server error while retrieving swipes',
  INTERNAL_ERROR_GET_RECEIVED_SWIPES: 'Internal server error while retrieving received swipes',
  INTERNAL_ERROR_GET_MATCHES: 'Internal server error while retrieving matches',
  INTERNAL_ERROR_UNMATCH: 'Internal server error while unmatching',
  INTERNAL_ERROR_SWIPE_STATS: 'Internal server error while retrieving swipe statistics',
  INTERNAL_ERROR_PENDING_LIKES: 'Internal server error while retrieving pending likes',
  
  // Validation Errors
  INVALID_REQUEST: 'Invalid request',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  INVALID_INPUT: 'Invalid input provided',
};

// ============================================
// SUCCESS MESSAGES
// ============================================

const SUCCESS_MESSAGES = {
  // Profile Updates
  PROFILE_UPDATED: 'Profile updated successfully',
  PROFILE_PROMPTS_UPDATED: 'Profile prompts updated successfully',
  LOCATION_UPDATED: 'Location updated successfully',
  LOCATION_PRIVACY_UPDATED: 'Location privacy updated successfully',
  PREFERRED_DISTANCE_UPDATED: 'Preferred distance updated successfully',
  PRIVACY_SETTINGS_UPDATED: 'Privacy settings updated successfully',
  PERSONAL_DATA_UPDATED: 'Personal data updated successfully',
  PASSPORT_LOCATION_UPDATED: 'Passport location updated successfully',
  ADVANCED_FILTERS_UPDATED: 'Advanced filters updated successfully',
  ADS_PREFERENCES_UPDATED: 'Ads preferences updated successfully',
  NOTIFICATION_PREFERENCES_UPDATED: 'Notification preferences updated successfully',
  
  // Deletion
  PHOTO_DELETED: 'Photo deleted successfully',
  MESSAGE_DELETED: 'Message deleted successfully',
  ACCOUNT_DELETED: 'Account deleted successfully',
  
  // Auth
  EMAIL_VERIFIED: 'Email verified successfully',
  PASSWORD_RESET: 'Password reset successfully',
  PASSWORD_RESET_EMAIL_SENT: 'If email exists, a password reset link has been sent',
  LOGGED_OUT: 'Logged out successfully',
  
  // Generic
  OPERATION_SUCCESSFUL: 'Operation completed successfully',
};

// ============================================
// RATE LIMIT MESSAGES
// ============================================

const RATE_LIMIT_MESSAGES = {
  GENERIC: 'Too many requests, please try again later.',
  API: 'Too many API requests. Please slow down.',
  AUTH: 'Too many authentication attempts. Please try again later.',
  SWIPE_LIMIT_REACHED: 'Daily swipe limit reached. Upgrade to premium for more swipes!',
  MESSAGE: 'Sending messages too quickly. Please slow down.',
  UPLOAD: 'Upload limit reached. Please try again later.',
  SEARCH: 'Too many search requests. Please slow down.',
  REPORT: 'Too many reports submitted. Please contact support if this is urgent.',
  PROFILE_VIEW: 'Too many profile views. Please slow down.',
  DISCOVERY: 'Too many discovery requests. Please slow down.',
  PAYMENT: 'Too many payment requests. Please try again shortly.',
  NOTIFICATION: 'Too many notification requests.',
  AI: 'AI feature rate limit reached. Please try again later.',
  PASSWORD_RESET: 'Too many password reset requests. Please try again later.',
  VERIFICATION: 'Too many verification attempts. Please try again later.',
  SOCIAL: 'Too many connection requests. Please slow down.',
};

// ============================================
// PREMIUM FEATURE MESSAGES
// ============================================

const PREMIUM_MESSAGES = {
  FEATURE_REQUIRED: 'Premium feature required.',
  SEE_WHO_LIKED: 'Premium feature required. Please upgrade to see who liked you.',
  PASSPORT: 'Premium feature required. Please upgrade to use Passport.',
  ADVANCED_FILTERS: 'Premium feature required. Please upgrade to use Advanced Filters.',
  PRIORITY_LIKES: 'Premium feature required. Please upgrade to use Priority Likes.',
  HIDE_ADS: 'Premium feature required. Please upgrade to hide ads.',
  BOOST_ANALYTICS: 'Premium feature required. Please upgrade to view profile boost analytics.',
  UNLIMITED_SWIPES: 'Premium feature required. Please upgrade for unlimited swipes.',
  REWIND: 'Premium feature required. Please upgrade to use Rewind.',
  SUPER_LIKES: 'Premium feature required. Please upgrade to use Super Likes.',
};

// ============================================
// HTTP STATUS CODES (for reference)
// ============================================

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

module.exports = {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  RATE_LIMIT_MESSAGES,
  PREMIUM_MESSAGES,
  HTTP_STATUS,
};
