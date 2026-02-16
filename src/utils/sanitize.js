/**
 * Input sanitization utilities to prevent XSS attacks
 * and ensure data integrity before sending to backend
 */

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} input - The input string to escape
 * @returns {string} - Escaped string safe for HTML rendering
 */
export const escapeHtml = (input) => {
  if (typeof input !== 'string') {
    return input;
  }

  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return input.replace(/[&<>"'/]/g, (match) => htmlEscapes[match]);
};

/**
 * Sanitizes a string input by trimming and escaping special characters
 * @param {string} input - The input string to sanitize
 * @param {Object} options - Sanitization options
 * @param {boolean} options.trim - Whether to trim whitespace (default: true)
 * @param {boolean} options.escapeHtml - Whether to escape HTML (default: true)
 * @param {number} options.maxLength - Maximum length allowed
 * @returns {string} - Sanitized string
 */
export const sanitizeString = (input, options = {}) => {
  if (input === null || input === undefined) {
    return '';
  }

  let sanitized = String(input);

  // Trim by default
  if (options.trim !== false) {
    sanitized = sanitized.trim();
  }

  // Escape HTML by default
  if (options.escapeHtml !== false) {
    sanitized = escapeHtml(sanitized);
  }

  // Enforce max length if specified
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  return sanitized;
};

/**
 * Sanitizes an email address
 * @param {string} email - The email to sanitize
 * @returns {string} - Sanitized email (lowercased and trimmed)
 */
export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return '';
  }

  return email.trim().toLowerCase();
};

/**
 * Sanitizes a number input
 * @param {string|number} input - The input to sanitize
 * @param {Object} options - Options for number sanitization
 * @param {number} options.min - Minimum value
 * @param {number} options.max - Maximum value
 * @param {number} options.defaultValue - Default value if invalid
 * @returns {number|null} - Sanitized number or null if invalid
 */
export const sanitizeNumber = (input, options = {}) => {
  if (input === null || input === undefined || input === '') {
    return options.defaultValue !== undefined ? options.defaultValue : null;
  }

  const num = typeof input === 'number' ? input : Number(input);

  if (isNaN(num)) {
    return options.defaultValue !== undefined ? options.defaultValue : null;
  }

  let sanitized = num;

  if (options.min !== undefined && sanitized < options.min) {
    sanitized = options.min;
  }

  if (options.max !== undefined && sanitized > options.max) {
    sanitized = options.max;
  }

  return sanitized;
};

/**
 * Sanitizes an array of strings
 * @param {Array} input - Array of strings to sanitize
 * @param {Object} options - Sanitization options
 * @returns {Array} - Array of sanitized strings
 */
export const sanitizeArray = (input, options = {}) => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => {
      if (typeof item === 'string') {
        return sanitizeString(item, options);
      }
      return item;
    })
    .filter((item) => item !== null && item !== undefined && item !== '');
};

/**
 * Sanitizes an object by sanitizing all string values
 * @param {Object} input - Object to sanitize
 * @param {Object} options - Sanitization options
 * @returns {Object} - Object with sanitized values
 */
export const sanitizeObject = (input, options = {}) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return input;
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value, options);
    } else if (Array.isArray(value)) {
      sanitized[key] = sanitizeArray(value, options);
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value, options);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Removes potentially dangerous characters and patterns
 * @param {string} input - Input string to clean
 * @returns {string} - Cleaned string
 */
export const removeDangerousChars = (input) => {
  if (typeof input !== 'string') {
    return input;
  }

  // Keep printable chars and preserve tabs/newlines for user-entered text formatting.
  const withoutControlChars = [...input]
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code === 9 || code === 10 || (code >= 32 && code !== 127);
    })
    .join('');

  // Remove null bytes, control characters (except newlines and tabs), and other dangerous patterns
  return withoutControlChars
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .trim();
};

/**
 * Comprehensive sanitization for user inputs before sending to backend
 * This is the main function to use for sanitizing form data
 * @param {Object} data - Data object to sanitize
 * @param {Object} schema - Schema defining how to sanitize each field
 * @returns {Object} - Fully sanitized data object
 */
export const sanitizeInput = (data, schema = {}) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(data)) {
    const fieldSchema = schema[key];

    if (fieldSchema) {
      // Use schema-specific sanitization
      if (fieldSchema.type === 'email') {
        sanitized[key] = sanitizeEmail(value);
      } else if (fieldSchema.type === 'number') {
        sanitized[key] = sanitizeNumber(value, fieldSchema.options || {});
      } else if (fieldSchema.type === 'string') {
        sanitized[key] = sanitizeString(value, fieldSchema.options || {});
      } else if (fieldSchema.type === 'array') {
        sanitized[key] = sanitizeArray(value, fieldSchema.options || {});
      } else {
        sanitized[key] = value;
      }
    } else {
      // Default sanitization based on value type
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = sanitizeArray(value);
      } else if (value && typeof value === 'object') {
        sanitized[key] = sanitizeInput(value, schema);
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
};
