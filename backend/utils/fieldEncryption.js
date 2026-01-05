/**
 * Field-Level Encryption Plugin for Mongoose
 * Automatically encrypts sensitive fields before saving and decrypts after reading
 */

const { encrypt, decrypt } = require('./encryption');

/**
 * List of fields that should be encrypted at rest
 * These fields contain PII (Personally Identifiable Information)
 */
const ENCRYPTED_FIELDS = [
  'phoneNumber',
  'email', // Note: You may want to store a hashed version for lookups
  'socialSecurityNumber',
  'bankAccountNumber',
  'creditCardNumber',
  'address',
  'dateOfBirth',
];

/**
 * Mongoose plugin for field-level encryption
 * @param {Schema} schema - Mongoose schema to apply encryption to
 * @param {Object} options - Configuration options
 */
const fieldEncryptionPlugin = (schema, options = {}) => {
  const fieldsToEncrypt = options.fields || [];

  if (fieldsToEncrypt.length === 0) {
    return; // No fields to encrypt
  }

  // Pre-save middleware: encrypt fields before saving
  schema.pre('save', function (next) {
    try {
      for (const field of fieldsToEncrypt) {
        const value = this.get(field);
        if (value && typeof value === 'string' && !isEncrypted(value)) {
          this.set(field, encrypt(value));
          // Store flag that field is encrypted
          this.set(`_${field}Encrypted`, true);
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  });

  // Pre-findOneAndUpdate middleware: encrypt fields in updates
  schema.pre('findOneAndUpdate', function (next) {
    try {
      const update = this.getUpdate();

      for (const field of fieldsToEncrypt) {
        // Handle direct field updates
        if (update[field] && !isEncrypted(update[field])) {
          update[field] = encrypt(update[field]);
        }

        // Handle $set updates
        if (update.$set && update.$set[field] && !isEncrypted(update.$set[field])) {
          update.$set[field] = encrypt(update.$set[field]);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  });

  // Post-find middleware: decrypt fields after reading
  schema.post('find', (docs) => {
    if (!Array.isArray(docs)) return docs;

    return docs.map((doc) => decryptDocument(doc, fieldsToEncrypt));
  });

  schema.post('findOne', (doc) => {
    if (!doc) return doc;
    return decryptDocument(doc, fieldsToEncrypt);
  });

  schema.post('findById', (doc) => {
    if (!doc) return doc;
    return decryptDocument(doc, fieldsToEncrypt);
  });

  // Add method to get decrypted value
  schema.methods.getDecrypted = function (field) {
    const value = this.get(field);
    if (!value) return value;
    return decrypt(value);
  };

  // Add method to set encrypted value
  schema.methods.setEncrypted = function (field, value) {
    this.set(field, encrypt(value));
    this.set(`_${field}Encrypted`, true);
  };

  // Add static method to find by encrypted field
  schema.statics.findByEncryptedField = async function (field, value) {
    // For searching encrypted fields, we need to encrypt the search value
    const encryptedValue = encrypt(value);
    return this.findOne({ [field]: encryptedValue });
  };
};

/**
 * Check if a value is already encrypted
 * @param {string} value - Value to check
 * @returns {boolean} - Whether the value is encrypted
 */
const isEncrypted = (value) => {
  if (typeof value !== 'string') return false;
  // Our encryption format: iv:authTag:ciphertext
  const parts = value.split(':');
  return (
    parts.length === 3 &&
    parts[0].length === 24 && // Base64 IV (16 bytes = 24 chars)
    parts[1].length === 24
  ); // Base64 auth tag (16 bytes = 24 chars)
};

/**
 * Decrypt a document's encrypted fields
 * @param {Object} doc - Document to decrypt
 * @param {Array} fields - Fields to decrypt
 * @returns {Object} - Document with decrypted fields
 */
const decryptDocument = (doc, fields) => {
  if (!doc) return doc;

  // Handle both plain objects and Mongoose documents
  const obj = doc.toObject ? doc.toObject() : doc;

  for (const field of fields) {
    if (obj[field] && isEncrypted(obj[field])) {
      try {
        obj[field] = decrypt(obj[field]);
      } catch (e) {
        // Keep encrypted value if decryption fails
        console.error(`Failed to decrypt field ${field}:`, (e instanceof Error ? e.message : String(e)));
      }
    }
  }

  return obj;
};

/**
 * Helper to encrypt specific fields in an object
 * @param {Object} data - Object with data to encrypt
 * @param {Array} fields - Fields to encrypt
 * @returns {Object} - Object with encrypted fields
 */
const encryptFields = (data, fields) => {
  const result = { ...data };

  for (const field of fields) {
    if (result[field] && !isEncrypted(result[field])) {
      result[field] = encrypt(result[field]);
    }
  }

  return result;
};

/**
 * Helper to decrypt specific fields in an object
 * @param {Object} data - Object with encrypted data
 * @param {Array} fields - Fields to decrypt
 * @returns {Object} - Object with decrypted fields
 */
const decryptFields = (data, fields) => {
  const result = { ...data };

  for (const field of fields) {
    if (result[field] && isEncrypted(result[field])) {
      try {
        result[field] = decrypt(result[field]);
      } catch (e) {
        console.error(`Failed to decrypt field ${field}`);
      }
    }
  }

  return result;
};

module.exports = {
  fieldEncryptionPlugin,
  isEncrypted,
  decryptDocument,
  encryptFields,
  decryptFields,
  ENCRYPTED_FIELDS,
};
