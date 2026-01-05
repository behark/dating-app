/**
 * User ID Normalization Utility
 * 
 * This utility ensures consistent user ID handling across the app,
 * normalizing between Firebase UIDs and MongoDB _id fields.
 */

/**
 * Get the normalized user ID from a user object
 * Prioritizes `uid` > `_id` > `id`
 * 
 * @param {Object} user - User object that may have uid, _id, or id
 * @returns {string|null} The normalized user ID
 */
export const getUserId = (user) => {
  if (!user) return null;
  return user.uid || user._id || user.id || null;
};

/**
 * Check if two user IDs are equal (handles string/ObjectId comparison)
 * 
 * @param {string|Object} id1 - First user ID
 * @param {string|Object} id2 - Second user ID
 * @returns {boolean} True if IDs match
 */
export const userIdsMatch = (id1, id2) => {
  if (!id1 || !id2) return false;
  return String(id1) === String(id2);
};

/**
 * Check if a user matches a given ID
 * 
 * @param {Object} user - User object
 * @param {string} userId - ID to compare against
 * @returns {boolean} True if user's ID matches
 */
export const isUserMatch = (user, userId) => {
  const normalizedId = getUserId(user);
  return userIdsMatch(normalizedId, userId);
};

/**
 * Normalize a user object to always have a `uid` field
 * 
 * @param {Object} user - User object from API or Firebase
 * @returns {Object} User object with guaranteed `uid` field
 */
export const normalizeUser = (user) => {
  if (!user) return null;
  
  const uid = getUserId(user);
  
  return {
    ...user,
    uid,
    // Keep _id for MongoDB compatibility
    _id: user._id || uid,
    // Keep id for generic compatibility
    id: user.id || uid,
  };
};

/**
 * Extract user ID from various source types
 * Can handle strings, user objects, or ID objects with toString
 * 
 * @param {string|Object} source - ID source (string, user object, or MongoDB ObjectId)
 * @returns {string|null} Normalized string ID
 */
export const extractUserId = (source) => {
  if (!source) return null;
  
  // If it's a string, return it directly
  if (typeof source === 'string') return source;
  
  // If it's an object with toString (MongoDB ObjectId), convert it
  if (typeof source.toString === 'function' && source.toString() !== '[object Object]') {
    return source.toString();
  }
  
  // If it's a user object, use getUserId
  return getUserId(source);
};

/**
 * Create a comparison function for filtering by user ID
 * 
 * @param {string} targetUserId - The user ID to compare against
 * @returns {Function} Filter function (user) => boolean
 */
export const createUserIdMatcher = (targetUserId) => {
  const normalizedTarget = extractUserId(targetUserId);
  return (user) => {
    const userId = getUserId(user);
    return userIdsMatch(userId, normalizedTarget);
  };
};

/**
 * Get display-safe user ID (truncated for UI display)
 * 
 * @param {Object|string} userOrId - User object or ID string
 * @param {number} maxLength - Maximum display length (default 8)
 * @returns {string} Truncated ID for display
 */
export const getDisplayUserId = (userOrId, maxLength = 8) => {
  const id = typeof userOrId === 'string' ? userOrId : getUserId(userOrId);
  if (!id) return 'Unknown';
  if (id.length <= maxLength) return id;
  return `${id.substring(0, maxLength)}...`;
};

export default {
  getUserId,
  userIdsMatch,
  isUserMatch,
  normalizeUser,
  extractUserId,
  createUserIdMatcher,
  getDisplayUserId,
};
