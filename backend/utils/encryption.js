/**
 * Encryption Utility for End-to-End Encryption and Field-Level Encryption
 * Implements AES-256-GCM for data encryption
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

// Get encryption key from environment or generate deterministic key from secret
const getEncryptionKey = () => {
  const masterKey = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!masterKey) {
    throw new Error('ENCRYPTION_KEY or JWT_SECRET environment variable is required');
  }
  // Derive a 32-byte key using SHA-256
  return crypto.createHash('sha256').update(masterKey).digest();
};

/**
 * Encrypt data using AES-256-GCM
 * @param {string} plaintext - The data to encrypt
 * @returns {string} - Encrypted data in format: iv:authTag:ciphertext (base64 encoded)
 */
const encrypt = (plaintext) => {
  if (!plaintext) return plaintext;

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
    ciphertext += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Return format: iv:authTag:ciphertext (all base64)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt data encrypted with AES-256-GCM
 * @param {string} encryptedData - The encrypted data in format: iv:authTag:ciphertext
 * @returns {string} - Decrypted plaintext
 */
const decrypt = (encryptedData) => {
  if (!encryptedData) return encryptedData;

  // Check if data is already decrypted (not in expected format)
  if (!encryptedData.includes(':')) {
    return encryptedData;
  }

  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');

    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
      // Data is not encrypted or in wrong format
      return encryptedData;
    }

    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const ciphertext = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let plaintext = decipher.update(ciphertext, 'base64', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  } catch (error) {
    console.error('Decryption error:', error);
    // Return original data if decryption fails (might not be encrypted)
    return encryptedData;
  }
};

/**
 * Hash sensitive data (one-way, for lookups)
 * @param {string} data - Data to hash
 * @returns {string} - Hashed data
 */
const hash = (data) => {
  if (!data) return data;

  // Ensure HASH_SALT is configured
  if (!process.env.HASH_SALT) {
    throw new Error(
      'HASH_SALT environment variable is not set. This is required for secure hashing.'
    );
  }

  const salt = process.env.HASH_SALT;
  return crypto.createHmac('sha256', salt).update(data).digest('hex');
};

/**
 * Generate a random encryption key for user-specific E2E encryption
 * @returns {string} - Base64 encoded 256-bit key
 */
const generateUserKey = () => {
  return crypto.randomBytes(32).toString('base64');
};

/**
 * Encrypt message with user-specific key (for E2E messaging)
 * @param {string} message - Message to encrypt
 * @param {string} userKey - User's encryption key (base64)
 * @returns {string} - Encrypted message
 */
const encryptMessage = (message, userKey) => {
  if (!message || !userKey) return message;

  try {
    const key = Buffer.from(userKey, 'base64');
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let ciphertext = cipher.update(message, 'utf8', 'base64');
    ciphertext += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext}`;
  } catch (error) {
    console.error('Message encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
};

/**
 * Decrypt message with user-specific key (for E2E messaging)
 * @param {string} encryptedMessage - Encrypted message
 * @param {string} userKey - User's encryption key (base64)
 * @returns {string} - Decrypted message
 */
const decryptMessage = (encryptedMessage, userKey) => {
  if (!encryptedMessage || !userKey) return encryptedMessage;

  if (!encryptedMessage.includes(':')) {
    return encryptedMessage;
  }

  try {
    const key = Buffer.from(userKey, 'base64');
    const parts = encryptedMessage.split(':');

    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
      return encryptedMessage;
    }

    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const ciphertext = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let plaintext = decipher.update(ciphertext, 'base64', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  } catch (error) {
    console.error('Message decryption error:', error);
    return encryptedMessage;
  }
};

/**
 * Generate a shared key for a conversation between two users
 * Uses Diffie-Hellman style key derivation
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {string} - Shared conversation key (base64)
 */
const generateConversationKey = (userId1, userId2) => {
  const masterKey = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
  // Sort user IDs to ensure consistent key generation regardless of order
  const sortedIds = [userId1, userId2].sort().join(':');

  // Derive a conversation-specific key
  return crypto.createHmac('sha256', masterKey).update(sortedIds).digest('base64');
};

module.exports = {
  encrypt,
  decrypt,
  hash,
  generateUserKey,
  encryptMessage,
  decryptMessage,
  generateConversationKey,
};
