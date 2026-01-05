/**
 * Environment Variable Validation
 * Validates that critical environment variables are set before server starts
 */

// NOTE:
// We intentionally avoid importing `chalk` here.
// - In some production deploys, optional deps may be missing (causing MODULE_NOT_FOUND).
// - Chalk v5+ is ESM-only, which throws when required from CommonJS.
// This file doesn't need chalk (no colored output), so keeping it dependency-free is safest.

/**
 * Critical environment variables that MUST be set
 */
const CRITICAL_ENV_VARS = [
  {
    name: 'JWT_SECRET',
    description: 'Secret key for JWT authentication tokens',
    minLength: 32,
    secure: true,
  },
  {
    name: 'JWT_REFRESH_SECRET',
    description: 'Secret key for JWT refresh tokens',
    minLength: 32,
    secure: true,
  },
  {
    name: 'HASH_SALT',
    description: 'Salt for hashing sensitive data',
    minLength: 16,
    secure: true,
  },
];

/**
 * Important environment variables (warnings if not set)
 */
const IMPORTANT_ENV_VARS = [
  {
    name: 'MONGODB_URI',
    description: 'MongoDB connection string',
    alternative: 'MONGODB_URL',
  },
  {
    name: 'NODE_ENV',
    description: 'Environment mode (development/production)',
    default: 'development',
  },
  {
    name: 'PORT',
    description: 'Server port',
    default: '3000',
  },
];

/**
 * Optional but recommended environment variables
 */
const OPTIONAL_ENV_VARS = [
  'FRONTEND_URL',
  'REDIS_HOST',
  'REDIS_PORT',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'SENTRY_DSN',
  'STRIPE_SECRET_KEY',
  'CLOUDINARY_CLOUD_NAME',
];

/**
 * Validate environment variables
 * @returns {Object} Validation result
 */
function validateEnvironment() {
  const errors = [];
  const warnings = [];
  const info = [];

  console.log('\n🔍 Validating environment configuration...\n');

  // Check critical variables
  for (const envVar of CRITICAL_ENV_VARS) {
    const value = process.env[envVar.name];

    if (!value) {
      errors.push({
        var: envVar.name,
        message: `${envVar.description} is required but not set`,
        hint: `Set ${envVar.name} in your .env file`,
      });
    } else if (envVar.minLength && value.length < envVar.minLength) {
      errors.push({
        var: envVar.name,
        message: `${envVar.description} must be at least ${envVar.minLength} characters`,
        hint: `Current length: ${value.length}`,
      });
    } else if (
      (envVar.secure && value.includes('default')) ||
      value.includes('change-in-production')
    ) {
      errors.push({
        var: envVar.name,
        message: `${envVar.description} is using default/placeholder value`,
        hint: 'Generate a secure random value',
      });
    } else {
      info.push(`✅ ${envVar.name} is set (${value.length} chars)`);
    }
  }

  // Check important variables
  for (const envVar of IMPORTANT_ENV_VARS) {
    const value = process.env[envVar.name];
    const altValue = envVar.alternative ? process.env[envVar.alternative] : null;

    if (!value && !altValue) {
      if (envVar.default) {
        warnings.push({
          var: envVar.name,
          message: `${envVar.description} not set, using default: ${envVar.default}`,
          hint: 'Consider setting explicitly',
        });
      } else {
        warnings.push({
          var: envVar.name,
          message: `${envVar.description} is not set`,
          hint: envVar.alternative
            ? `Alternative: ${envVar.alternative}`
            : 'Some features may not work',
        });
      }
    } else {
      const usedVar = value ? envVar.name : envVar.alternative;
      info.push(`✅ ${usedVar} is set`);
    }
  }

  // Check optional variables
  const missingOptional = OPTIONAL_ENV_VARS.filter((name) => !process.env[name]);
  if (missingOptional.length > 0) {
    info.push(`ℹ️  Optional variables not set: ${missingOptional.join(', ')}`);
  }

  // Print results
  if (info.length > 0) {
    console.log('📋 Configuration Status:');
    info.forEach((msg) => console.log(`   ${msg}`));
    console.log();
  }

  if (warnings.length > 0) {
    console.log('⚠️  Warnings:');
    warnings.forEach((w) => {
      console.log(`   ${w.var}: ${w.message}`);
      console.log(`      Hint: ${w.hint}`);
    });
    console.log();
  }

  if (errors.length > 0) {
    console.log('❌ Critical Errors:');
    errors.forEach((e) => {
      console.log(`   ${e.var}: ${e.message}`);
      console.log(`      Hint: ${e.hint}`);
    });
    console.log();

    return {
      valid: false,
      errors,
      warnings,
    };
  }

  console.log('✅ Environment validation passed!\n');

  return {
    valid: true,
    errors: [],
    warnings,
  };
}

/**
 * Generate secure random values for missing secrets
 * @returns {Object} Generated secrets
 */
function generateSecrets() {
  const crypto = require('crypto');

  return {
    JWT_SECRET: crypto.randomBytes(64).toString('hex'),
    JWT_REFRESH_SECRET: crypto.randomBytes(64).toString('hex'),
    HASH_SALT: crypto.randomBytes(32).toString('hex'),
  };
}

/**
 * Print example .env configuration
 */
function printExampleEnv() {
  const secrets = generateSecrets();

  console.log('\n📝 Example .env configuration with generated secrets:\n');
  console.log('# Critical Security Settings (MUST CHANGE IN PRODUCTION)');
  console.log(`JWT_SECRET=${secrets.JWT_SECRET}`);
  console.log(`JWT_REFRESH_SECRET=${secrets.JWT_REFRESH_SECRET}`);
  console.log(`HASH_SALT=${secrets.HASH_SALT}`);
  console.log('\n# Database');
  console.log('MONGODB_URI=mongodb://localhost:27017/dating-app');
  console.log('\n# Server');
  console.log('PORT=3000');
  console.log('NODE_ENV=development');
  console.log('FRONTEND_URL=http://localhost:19006');
  console.log('\n# Optional Services');
  console.log('REDIS_HOST=localhost');
  console.log('REDIS_PORT=6379');
  console.log('# EMAIL_USER=your-email@gmail.com');
  console.log('# EMAIL_PASSWORD=your-app-password');
  console.log('# SENTRY_DSN=your-sentry-dsn');
  console.log();
}

/**
 * Main validation function
 * Throws error if validation fails in production
 */
function validateOrExit() {
  const result = validateEnvironment();

  if (!result.valid) {
    console.error('💥 Environment validation failed!\n');

    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 Cannot start server in production without proper configuration.\n');
      process.exit(1);
    } else {
      console.warn('⚠️  Starting server with missing configuration (development mode).');
      console.warn('    Some features may not work correctly.\n');

      // Show example configuration
      printExampleEnv();
    }
  }

  return result;
}

module.exports = {
  validateEnvironment,
  validateOrExit,
  generateSecrets,
  printExampleEnv,
};
