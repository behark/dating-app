/**
 * JWT Decoding Utility
 * Decodes JWT tokens without verification (for client-side use)
 */
import logger from './logger';

/**
 * Base64 decode helper that works in both web and React Native
 * @param {string} str - Base64 string to decode
 * @returns {string} Decoded string
 */
const base64Decode = (str) => {
  if (typeof atob !== 'undefined') {
    // Browser/Web environment
    return atob(str);
  } else if (typeof Buffer !== 'undefined') {
    // Node.js/React Native environment
    return Buffer.from(str, 'base64').toString('utf-8');
  } else {
    // Fallback: manual base64 decoding
    // eslint-disable-next-line no-secrets/no-secrets
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    let i = 0;
    str = str.replace(/[^A-Za-z0-9+/=]/g, '');
    while (i < str.length) {
      const enc1 = chars.indexOf(str.charAt(i++));
      const enc2 = chars.indexOf(str.charAt(i++));
      const enc3 = chars.indexOf(str.charAt(i++));
      const enc4 = chars.indexOf(str.charAt(i++));
      const chr1 = (enc1 << 2) | (enc2 >> 4);
      const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      const chr3 = ((enc3 & 3) << 6) | enc4;
      output += String.fromCharCode(chr1);
      if (enc3 !== 64) output += String.fromCharCode(chr2);
      if (enc4 !== 64) output += String.fromCharCode(chr3);
    }
    return output;
  }
};

/**
 * Decode a JWT token and return the payload
 * Note: This does NOT verify the token signature - only decodes it
 * @param {string} token - JWT token to decode
 * @returns {Object|null} Decoded payload or null if invalid
 */
export const decodeJWT = (token) => {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    // Replace URL-safe base64 characters
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

    // Decode base64
    const decoded = base64Decode(padded);
    return JSON.parse(decoded);
  } catch (error) {
    logger.error('Error decoding JWT', error);
    return null;
  }
};

/**
 * Extract user information from Google ID token
 * @param {string} idToken - Google ID token
 * @returns {Object|null} User info object with sub, email, name, picture, or null if invalid
 */
export const extractGoogleUserInfo = (idToken) => {
  const decoded = decodeJWT(idToken);
  if (!decoded) {
    return null;
  }

  return {
    googleId: decoded.sub || decoded.user_id,
    email: decoded.email,
    name: decoded.name || decoded.given_name || decoded.email?.split('@')[0] || 'Google User',
    photoUrl: decoded.picture,
    emailVerified: decoded.email_verified || false,
  };
};

export default {
  decodeJWT,
  extractGoogleUserInfo,
};
