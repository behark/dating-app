/**
 * OAuth Token Verification Utilities
 * Verifies ID tokens from Google, Facebook, and Apple OAuth providers
 * Prevents OAuth handshake failures and token spoofing attacks
 * @module utils/oauthVerifier
 */

const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios').default;

// Initialize Google OAuth client
const googleClient = new OAuth2Client();

/**
 * Verify Google ID token and extract user information
 * @param {string} idToken - Google ID token to verify
 * @param {string} [clientId] - Expected client ID (optional, will use env var)
 * @returns {Promise<Object>} Verified user info with googleId, email, name, photoUrl
 * @throws {Error} If token verification fails
 */
const verifyGoogleToken = async (idToken, clientId = undefined) => {
  if (!idToken) {
    throw new Error('Google ID token is required');
  }

  // Get the client ID to verify against
  const expectedClientId = clientId || process.env.GOOGLE_CLIENT_ID;
  
  // If no client ID configured, we'll still verify the token structure but skip audience check
  // This allows for development/testing scenarios
  const verifyOptions = expectedClientId 
    ? { idToken, audience: expectedClientId }
    : { idToken };

  try {
    const ticket = await googleClient.verifyIdToken(verifyOptions);
    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error('Invalid Google token: no payload');
    }

    // Check token expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Google token has expired');
    }

    // Verify issuer
    const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
    if (!validIssuers.includes(payload.iss)) {
      throw new Error('Invalid Google token issuer');
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.given_name || payload.email?.split('@')[0] || 'Google User',
      photoUrl: payload.picture,
      emailVerified: payload.email_verified || false,
      tokenExpiry: payload.exp,
      issuedAt: payload.iat,
    };
  } catch (err) {
    // Handle specific Google OAuth errors
    const error = err instanceof Error ? err : new Error(String(err));
    const errorMessage = error.message || '';
    
    if (errorMessage.includes('Token used too late')) {
      throw new Error('Google OAuth token has expired. Please sign in again.');
    }
    if (errorMessage.includes('Invalid token signature')) {
      throw new Error('Invalid Google OAuth token signature. Please sign in again.');
    }
    if (errorMessage.includes('Wrong recipient')) {
      throw new Error('Google OAuth redirect URI mismatch. Check your Google Cloud Console configuration.');
    }
    if (errorMessage.includes('invalid_client')) {
      throw new Error('Google OAuth client configuration error. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
    }
    
    console.error('Google token verification error:', error);
    throw new Error(`Google token verification failed: ${errorMessage}`);
  }
};

/**
 * Verify Facebook access token and extract user information
 * @param {string} accessToken - Facebook access token to verify
 * @param {string} facebookId - User's Facebook ID to verify
 * @returns {Promise<Object>} Verified user info
 * @throws {Error} If token verification fails
 */
const verifyFacebookToken = async (accessToken, facebookId) => {
  if (!accessToken || !facebookId) {
    throw new Error('Facebook access token and user ID are required');
  }

  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;

  // If no Facebook credentials configured, fall back to trust-but-verify mode
  // This is less secure but allows operation during development
  if (!appId || !appSecret) {
    console.warn('⚠️  Facebook OAuth credentials not configured - token verification skipped');
    return {
      facebookId,
      tokenVerified: false,
      warning: 'Token not verified - configure FACEBOOK_APP_ID and FACEBOOK_APP_SECRET',
    };
  }

  try {
    // First, get an app access token
    const appAccessTokenUrl = `https://graph.facebook.com/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&grant_type=client_credentials`;
    const appTokenResponse = await axios.get(appAccessTokenUrl);
    const appAccessToken = appTokenResponse.data.access_token;

    // Verify the user's access token
    const debugTokenUrl = `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appAccessToken}`;
    const debugResponse = await axios.get(debugTokenUrl);
    const tokenData = debugResponse.data.data;

    if (!tokenData.is_valid) {
      throw new Error('Facebook access token is invalid or expired');
    }

    // Verify the user ID matches
    if (tokenData.user_id !== facebookId) {
      throw new Error('Facebook user ID mismatch');
    }

    // Check if token belongs to our app
    if (tokenData.app_id !== appId) {
      throw new Error('Facebook token was issued for a different application');
    }

    // Check expiration
    if (tokenData.expires_at && tokenData.expires_at < Math.floor(Date.now() / 1000)) {
      throw new Error('Facebook access token has expired');
    }

    return {
      facebookId: tokenData.user_id,
      tokenVerified: true,
      scopes: tokenData.scopes || [],
      expiresAt: tokenData.expires_at,
    };
  } catch (err) {
    const error = err;
    if (error && typeof error === 'object' && 'response' in error && error.response?.data?.error) {
      const fbError = error.response.data.error;
      if (fbError.code === 190) {
        throw new Error('Facebook OAuth token has expired or is invalid. Please sign in again.');
      }
      throw new Error(`Facebook OAuth error: ${fbError.message}`);
    }
    throw error;
  }
};

/**
 * Verify Apple identity token
 * Apple Sign-In uses JWT tokens that can be verified using Apple's public keys
 * @param {string} identityToken - Apple identity token (JWT)
 * @param {string} appleId - User's Apple ID to verify
 * @returns {Promise<Object>} Verified user info
 * @throws {Error} If token verification fails
 */
const verifyAppleToken = async (identityToken, appleId) => {
  if (!identityToken && !appleId) {
    throw new Error('Apple identity token or Apple ID is required');
  }

  // If only appleId is provided (legacy flow), trust it but warn
  if (!identityToken) {
    console.warn('⚠️  Apple Sign-In without identity token - consider updating client');
    return {
      appleId,
      tokenVerified: false,
      warning: 'Identity token not provided - user info limited',
    };
  }

  try {
    const jwt = require('jsonwebtoken');
    
    // Decode the token header to get the key ID
    const tokenParts = identityToken.split('.');
    if (tokenParts.length !== 3) {
      throw new Error('Invalid Apple identity token format');
    }

    if (tokenParts.length < 1 || !tokenParts[0]) {
      throw new Error('Invalid token format');
    }
    const header = JSON.parse(Buffer.from(tokenParts[0], 'base64').toString());
    const kid = header.kid;

    if (!kid) {
      throw new Error('Apple token missing key ID');
    }

    // Fetch Apple's public keys
    const keysResponse = await axios.get('https://appleid.apple.com/auth/keys');
    const keys = keysResponse.data.keys;
    
    // Find the matching key
    const key = keys.find(k => k.kid === kid);
    if (!key) {
      throw new Error('Apple public key not found - key may have rotated');
    }

    // Convert JWK to PEM format using Node.js crypto
    const publicKey = createJwkToPem()(key);

    // Verify the token
    const decoded = jwt.verify(identityToken, publicKey, {
      algorithms: ['RS256'],
      issuer: 'https://appleid.apple.com',
    });

    // Handle both string and object decoded values
    const payload = typeof decoded === 'string' ? JSON.parse(decoded) : decoded;

    // Verify the subject matches the provided appleId
    if (appleId && payload.sub !== appleId) {
      throw new Error('Apple user ID mismatch');
    }

    return {
      appleId: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified === 'true' || payload.email_verified === true,
      tokenVerified: true,
      issuedAt: payload.iat,
      expiresAt: payload.exp,
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    if (error.name === 'TokenExpiredError') {
      throw new Error('Apple identity token has expired. Please sign in again.');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid Apple identity token. Please sign in again.');
    }
    throw error;
  }
};

/**
 * Simple JWK to PEM converter (fallback if jwk-to-pem not installed)
 * @returns {Function} Converter function
 */
function createJwkToPem() {
  return function(jwk) {
    // This is a simplified implementation for RSA keys
    // In production, use the jwk-to-pem package
    const { n, e } = jwk;
    
    // Base64url decode
    const nBuffer = Buffer.from(n.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const eBuffer = Buffer.from(e.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    
    // Create key object
    const keyObject = crypto.createPublicKey({
      key: {
        kty: 'RSA',
        n: nBuffer.toString('base64'),
        e: eBuffer.toString('base64'),
      },
      format: 'jwk',
    });
    
    return keyObject.export({ type: 'spki', format: 'pem' });
  };
}

/**
 * Check if OAuth provider credentials are configured
 * @param {string} provider - OAuth provider name ('google', 'facebook', 'apple')
 * @returns {Object} Configuration status
 */
const checkOAuthConfig = (provider) => {
  const configs = {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
    facebook: {
      appId: process.env.FACEBOOK_APP_ID,
      appSecret: process.env.FACEBOOK_APP_SECRET,
      configured: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID,
      teamId: process.env.APPLE_TEAM_ID,
      keyId: process.env.APPLE_KEY_ID,
      configured: !!(process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID),
    },
  };

  return configs[provider.toLowerCase()] || { configured: false, error: 'Unknown provider' };
};

module.exports = {
  verifyGoogleToken,
  verifyFacebookToken,
  verifyAppleToken,
  checkOAuthConfig,
};
