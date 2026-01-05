/**
 * Property-Based Tests for Validators using fast-check
 *
 * These tests use property-based testing to find edge cases
 * that traditional unit tests might miss.
 */

import fc from 'fast-check';
import {
  validateEmail,
  validatePassword,
  validateAge,
  validateLatitude,
  validateLongitude,
  validateCoordinates,
  validateUserId,
  validateNumberRange,
  validateNotEmpty,
  validateArrayNotEmpty,
} from '../../utils/validators';

// Constants to avoid duplicate strings
const DEFAULT_TIMEOUT = 10000;

describe('Validators - Property-Based Tests', () => {
  describe('validateEmail - Property Tests', () => {
    it('should never crash on any string input', () => {
      fc.assert(
        fc.property(fc.string(), (email) => {
          // Should never throw, always return boolean
          const result = validateEmail(email);
          return typeof result === 'boolean';
        }),
        { numRuns: 500, timeout: DEFAULT_TIMEOUT }
      );
    });

    it('should return false for strings without @ symbol', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes('@')),
          (email) => {
            return validateEmail(email) === false;
          }
        ),
        { numRuns: 200, timeout: DEFAULT_TIMEOUT }
      );
    });

    it('should return false for strings with multiple @ symbols', () => {
      fc.assert(
        fc.property(
          fc
            .tuple(
              fc.string({ minLength: 0, maxLength: 10 }),
              fc.string({ minLength: 1, maxLength: 10 }),
              fc.string({ minLength: 1, maxLength: 10 })
            )
            .map(([prefix, middle, suffix]) => `${prefix}@${middle}@${suffix}`),
          (email) => {
            return validateEmail(email) === false;
          }
        ),
        { numRuns: 100, timeout: DEFAULT_TIMEOUT }
      );
    });

    it('should return false for empty strings', () => {
      fc.assert(
        fc.property(fc.constant(''), (email) => {
          return validateEmail(email) === false;
        })
      );
    });
  });

  describe('validatePassword - Property Tests', () => {
    it('should never crash on any string input', () => {
      fc.assert(
        fc.property(fc.string(), (password) => {
          const result = validatePassword(password);
          return typeof result === 'boolean';
        }),
        { numRuns: 500, timeout: DEFAULT_TIMEOUT }
      );
    });

    it('should respect minLength constraint', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          fc.string({ minLength: 0, maxLength: 50 }),
          (minLength, password) => {
            const result = validatePassword(password, { minLength });
            if (password.length >= minLength && password.length > 0) {
              return result === true;
            }
            return result === false;
          }
        ),
        { numRuns: 200, timeout: DEFAULT_TIMEOUT }
      );
    });

    it('should return false for empty passwords', () => {
      fc.assert(
        fc.property(fc.constant(''), (password) => {
          return validatePassword(password) === false;
        })
      );
    });

    it('should return false for null/undefined', () => {
      fc.assert(
        fc.property(fc.constantFrom(null, undefined), (password) => {
          return validatePassword(password) === false;
        })
      );
    });
  });

  describe('validateAge - Property Tests', () => {
    it('should never crash on any number input', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.float(),
            fc.integer(),
            fc.constant(NaN),
            fc.constant(Infinity),
            fc.constant(-Infinity)
          ),
          (age) => {
            const result = validateAge(age);
            return typeof result === 'boolean';
          }
        ),
        { numRuns: 500, timeout: DEFAULT_TIMEOUT }
      );
    });

    it('should return true for ages between 18 and 100', () => {
      fc.assert(
        fc.property(fc.integer({ min: 18, max: 100 }), (age) => {
          return validateAge(age) === true;
        }),
        { numRuns: 100 }
      );
    });

    it('should return false for ages below 18', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 17 }), (age) => {
          return validateAge(age) === false;
        }),
        { numRuns: 50 }
      );
    });

    it('should return false for ages above 100', () => {
      fc.assert(
        fc.property(fc.integer({ min: 101, max: 200 }), (age) => {
          return validateAge(age) === false;
        }),
        { numRuns: 50 }
      );
    });

    it('should return false for negative numbers', () => {
      fc.assert(
        fc.property(fc.integer({ min: -100, max: -1 }), (age) => {
          return validateAge(age) === false;
        }),
        { numRuns: 50 }
      );
    });

    it('should handle custom age ranges', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 18, max: 30 }),
          fc.integer({ min: 31, max: 65 }),
          fc.integer({ min: 18, max: 100 }),
          (minAge, maxAge, testAge) => {
            const result = validateAge(testAge, { minAge, maxAge });
            if (testAge >= minAge && testAge <= maxAge) {
              return result === true;
            }
            return result === false;
          }
        ),
        { numRuns: 100, timeout: DEFAULT_TIMEOUT }
      );
    });
  });

  describe('validateLatitude - Property Tests', () => {
    it('should return true for valid latitudes (-90 to 90)', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -90, max: 90 }).filter((lat) => !isNaN(lat)),
          (lat) => {
            return validateLatitude(lat) === true;
          }
        ),
        { numRuns: 200, timeout: DEFAULT_TIMEOUT }
      );
    });

    it('should return false for latitudes outside valid range', () => {
      fc.assert(
        fc.property(
          fc
            .oneof(
              fc.float({ min: -180, max: Math.fround(-90.1) }),
              fc.float({ min: Math.fround(90.1), max: 180 })
            )
            .filter((lat) => !isNaN(lat)),
          (lat) => {
            return validateLatitude(lat) === false;
          }
        ),
        { numRuns: 200, timeout: DEFAULT_TIMEOUT }
      );
    });

    it('should handle boundary values correctly', () => {
      fc.assert(
        fc.property(fc.constantFrom(-90, 90, Math.fround(-90.1), Math.fround(90.1)), (lat) => {
          const result = validateLatitude(lat);
          if (lat === -90 || lat === 90) {
            return result === true;
          }
          return result === false;
        }),
        { timeout: 10000 }
      );
    });
  });

  describe('validateLongitude - Property Tests', () => {
    it('should return true for valid longitudes (-180 to 180)', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -180, max: 180 }).filter((lng) => !isNaN(lng)),
          (lng) => {
            return validateLongitude(lng) === true;
          }
        ),
        { numRuns: 200, timeout: DEFAULT_TIMEOUT }
      );
    });

    it('should return false for longitudes outside valid range', () => {
      fc.assert(
        fc.property(
          fc
            .oneof(
              fc.float({ min: -360, max: Math.fround(-180.1) }),
              fc.float({ min: Math.fround(180.1), max: 360 })
            )
            .filter((lng) => !isNaN(lng)),
          (lng) => {
            return validateLongitude(lng) === false;
          }
        ),
        { numRuns: 200, timeout: DEFAULT_TIMEOUT }
      );
    });
  });

  describe('validateCoordinates - Property Tests', () => {
    it('should return true for valid coordinate pairs', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -90, max: 90 }).filter((lat) => !isNaN(lat)),
          fc.float({ min: -180, max: 180 }).filter((lng) => !isNaN(lng)),
          (lat, lng) => {
            return validateCoordinates(lat, lng) === true;
          }
        ),
        { numRuns: 200, timeout: DEFAULT_TIMEOUT }
      );
    });

    it('should return false if latitude is invalid', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -180, max: Math.fround(-90.1) }).filter((lat) => !isNaN(lat)),
          fc.float({ min: -180, max: 180 }).filter((lng) => !isNaN(lng)),
          (lat, lng) => {
            return validateCoordinates(lat, lng) === false;
          }
        ),
        { numRuns: 100, timeout: DEFAULT_TIMEOUT }
      );
    });

    it('should return false if longitude is invalid', () => {
      fc.assert(
        fc.property(
          fc.float({ min: -90, max: 90 }).filter((lat) => !isNaN(lat)),
          fc.float({ min: Math.fround(180.1), max: 360 }).filter((lng) => !isNaN(lng)),
          (lat, lng) => {
            return validateCoordinates(lat, lng) === false;
          }
        ),
        { numRuns: 100, timeout: DEFAULT_TIMEOUT }
      );
    });
  });

  describe('validateUserId - Property Tests', () => {
    it('should return true for valid MongoDB ObjectIds', () => {
      const hexChars = '0123456789abcdef';
      fc.assert(
        fc.property(
          fc
            .array(fc.constantFrom(...hexChars.split('')), { minLength: 24, maxLength: 24 })
            .map((arr) => arr.join('')),
          (id) => {
            // MongoDB ObjectId is 24 hex characters
            return validateUserId(id) === true;
          }
        ),
        { numRuns: 200, timeout: DEFAULT_TIMEOUT }
      );
    });

    it('should return false for strings that are too short', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 23 }), (id) => {
          return validateUserId(id) === false;
        }),
        { numRuns: 100, timeout: DEFAULT_TIMEOUT }
      );
    });

    it('should return false for empty strings', () => {
      fc.assert(
        fc.property(fc.constant(''), (id) => {
          return validateUserId(id) === false;
        })
      );
    });
  });

  describe('validateNumberRange - Property Tests', () => {
    it('should return true for numbers within range', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 10 }),
          (min, max, value) => {
            if (min <= max && value >= min && value <= max) {
              return validateNumberRange(value, min, max) === true;
            }
            return true; // Skip invalid ranges
          }
        ),
        { numRuns: 200, timeout: DEFAULT_TIMEOUT }
      );
    });

    it('should return false for numbers outside range', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 20 }),
          fc.integer({ min: 1, max: 9 }),
          (min, value) => {
            // value (1-9) should be outside range [min, min+10] where min is 10-20
            // So range is [10-20, 20-30], and value is 1-9, so it should be false
            return validateNumberRange(value, min, min + 10) === false;
          }
        ),
        { numRuns: 100, timeout: DEFAULT_TIMEOUT }
      );
    });

    it('should handle boundary values correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (min, max) => {
            if (min <= max) {
              const resultMin = validateNumberRange(min, min, max);
              const resultMax = validateNumberRange(max, min, max);
              return resultMin === true && resultMax === true;
            }
            return true;
          }
        ),
        { numRuns: 200 }
      );
    });
  });

  describe('validateNotEmpty - Property Tests', () => {
    it('should return true for non-empty strings', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), (str) => {
          return validateNotEmpty(str) === true;
        }),
        { numRuns: 200, timeout: DEFAULT_TIMEOUT }
      );
    });

    it('should return false for empty strings', () => {
      fc.assert(
        fc.property(fc.constant(''), (str) => {
          return validateNotEmpty(str) === false;
        })
      );
    });

    it('should return false for whitespace-only strings', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 20 })
            .filter((s) => s.trim().length === 0 && s.length > 0),
          (str) => {
            return validateNotEmpty(str) === false;
          }
        ),
        { numRuns: 50, timeout: DEFAULT_TIMEOUT }
      );
    });

    it('should return false for null/undefined', () => {
      fc.assert(
        fc.property(fc.constantFrom(null, undefined), (value) => {
          return validateNotEmpty(value) === false;
        })
      );
    });
  });

  describe('validateArrayNotEmpty - Property Tests', () => {
    it('should return true for non-empty arrays', () => {
      fc.assert(
        fc.property(fc.array(fc.anything(), { minLength: 1 }), (arr) => {
          return validateArrayNotEmpty(arr) === true;
        }),
        { numRuns: 200, timeout: DEFAULT_TIMEOUT }
      );
    });

    it('should return false for empty arrays', () => {
      fc.assert(
        fc.property(fc.constant([]), (arr) => {
          return validateArrayNotEmpty(arr) === false;
        })
      );
    });

    it('should return false for non-array values', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.constant(null),
            fc.constant(undefined)
          ),
          (value) => {
            return validateArrayNotEmpty(value) === false;
          }
        ),
        { numRuns: 100, timeout: DEFAULT_TIMEOUT }
      );
    });
  });

  describe('Edge Cases - Combined Validators', () => {
    it('should handle extreme coordinate values', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(-90, 90, -89.999, 89.999),
          fc.constantFrom(-180, 180, -179.999, 179.999),
          (lat, lng) => {
            const result = validateCoordinates(lat, lng);
            // All these should be valid
            return result === true;
          }
        )
      );
    });

    it('should handle password with various special characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 8, maxLength: 100 }).filter((s) => {
            // Include various special characters
            return /[!@#$%^&*(),.?":{}|<>]/.test(s);
          }),
          (password) => {
            const result = validatePassword(password);
            // Should handle special characters without crashing
            return typeof result === 'boolean';
          }
        ),
        { numRuns: 200 }
      );
    });
  });
});
