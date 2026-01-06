#!/usr/bin/env node

/**
 * Production Environment Validation Script
 * Validates all required environment variables before deployment
 */

require('dotenv').config();

const CRITICAL = '🔴';
const WARNING = '🟡';
const SUCCESS = '🟢';
const INFO = '🔵';

/**
 * Validation results
 */
const results = {
  critical: [],
  warnings: [],
  passed: [],
  info: [],
};

/**
 * Check if a value exists and is not empty
 */
function exists(value) {
  return value !== undefined && value !== null && value !== '';
}

/**
 * Validate environment variable
 */
function validate(name, validator, severity = 'critical', message = '') {
  const value = process.env[name];
  const result = validator(value);

  if (result.valid) {
    results.passed.push({ name, message: result.message || message });
  } else {
    const item = { name, message: result.message || message };
    if (severity === 'critical') {
      results.critical.push(item);
    } else if (severity === 'warning') {
      results.warnings.push(item);
    }
  }

  return result.valid;
}

/**
 * Validators
 */
const validators = {
  required: (value) => ({
    valid: exists(value),
    message: 'Required but not set',
  }),

  minLength: (min) => (value) => ({
    valid: exists(value) && value.length >= min,
    message: `Must be at least ${min} characters (current: ${value?.length || 0})`,
  }),

  url: (value) => {
    try {
      if (!exists(value)) return { valid: false, message: 'URL not set' };
      new URL(value);
      return { valid: true, message: 'Valid URL' };
    } catch {
      return { valid: false, message: 'Invalid URL format' };
    }
  },

  https: (value) => {
    if (!exists(value)) return { valid: false, message: 'URL not set' };
    const valid = value.startsWith('https://');
    return {
      valid,
      message: valid ? 'Using HTTPS ✓' : 'Should use HTTPS in production',
    };
  },

  mongoUri: (value) => {
    if (!exists(value)) return { valid: false, message: 'MongoDB URI not set' };
    const isValid = value.startsWith('mongodb://') || value.startsWith('mongodb+srv://');
    const hasCredentials = value.includes('@');
    return {
      valid: isValid && hasCredentials,
      message: !isValid
        ? 'Invalid MongoDB URI format'
        : !hasCredentials
          ? 'MongoDB URI should include credentials'
          : 'Valid MongoDB URI',
    };
  },

  redisUrl: (value) => {
    if (!exists(value)) return { valid: false, message: 'Redis URL not set' };
    const isValid = value.startsWith('redis://') || value.startsWith('rediss://');
    return {
      valid: isValid,
      message: isValid ? 'Valid Redis URL' : 'Invalid Redis URL format',
    };
  },

  sentryDsn: (value) => {
    if (!exists(value)) return { valid: false, message: 'Sentry DSN not configured' };
    const isValid = value.startsWith('https://') && value.includes('sentry.io');
    return {
      valid: isValid,
      message: isValid ? 'Valid Sentry DSN' : 'Invalid Sentry DSN format',
    };
  },

  nodeEnv: (value) => {
    const valid = value === 'production';
    return {
      valid,
      message: valid
        ? 'Set to production ✓'
        : `Currently: ${value || 'not set'} (should be 'production')`,
    };
  },
};

console.log(`\n${'='.repeat(80)}`);
console.log('🔒 PRODUCTION ENVIRONMENT VALIDATION');
console.log(`${'='.repeat(80)}\n`);

// Critical Environment Variables
console.log('📌 CRITICAL ENVIRONMENT VARIABLES\n');

validate('NODE_ENV', validators.nodeEnv, 'critical');
validate('JWT_SECRET', validators.minLength(64), 'critical');
validate('JWT_REFRESH_SECRET', validators.minLength(64), 'critical');
validate('MONGODB_URI', validators.mongoUri, 'critical');
validate('FRONTEND_URL', validators.url, 'critical');

// High Priority
console.log('\n📌 HIGH PRIORITY\n');

validate('REDIS_URL', validators.redisUrl, 'warning', 'Caching and rate limiting');
validate('SENTRY_DSN', validators.sentryDsn, 'warning', 'Error monitoring');

// Security Configuration
console.log('\n🔐 SECURITY CONFIGURATION\n');

if (process.env.FRONTEND_URL) {
  validate('FRONTEND_URL', validators.https, 'warning', 'Should use HTTPS');
}

validate('CORS_ORIGIN', validators.required, 'warning', 'Explicit CORS origins');
validate('API_KEY', validators.minLength(32), 'warning', 'Server-to-server authentication');

// Optional but Recommended
console.log('\n💡 OPTIONAL BUT RECOMMENDED\n');

const optionalVars = [
  { name: 'PORT', default: '3000', purpose: 'Server port' },
  { name: 'JWT_ACCESS_EXPIRY', default: '15m', purpose: 'Access token lifetime' },
  { name: 'JWT_REFRESH_EXPIRY', default: '7d', purpose: 'Refresh token lifetime' },
  { name: 'RATE_LIMIT_WINDOW_MS', default: '900000', purpose: 'Rate limit window' },
  { name: 'RATE_LIMIT_MAX', default: '100', purpose: 'Max requests per window' },
  { name: 'LOG_LEVEL', default: 'info', purpose: 'Logging verbosity' },
];

optionalVars.forEach(({ name, default: defaultValue, purpose }) => {
  const value = process.env[name];
  if (exists(value)) {
    results.info.push({ name, message: `Set to: ${value}` });
  } else {
    results.info.push({
      name,
      message: `Not set (will use default: ${defaultValue}) - ${purpose}`,
    });
  }
});

// Print Results
console.log(`\n${'='.repeat(80)}`);
console.log('📊 VALIDATION RESULTS');
console.log(`${'='.repeat(80)}\n`);

if (results.critical.length > 0) {
  console.log(`${CRITICAL} CRITICAL ISSUES (${results.critical.length}):\n`);
  results.critical.forEach(({ name, message }) => {
    console.log(`   ${CRITICAL} ${name}: ${message}`);
  });
  console.log('');
}

if (results.warnings.length > 0) {
  console.log(`${WARNING} WARNINGS (${results.warnings.length}):\n`);
  results.warnings.forEach(({ name, message }) => {
    console.log(`   ${WARNING} ${name}: ${message}`);
  });
  console.log('');
}

if (results.passed.length > 0) {
  console.log(`${SUCCESS} PASSED (${results.passed.length}):\n`);
  results.passed.forEach(({ name, message }) => {
    console.log(`   ${SUCCESS} ${name}: ${message}`);
  });
  console.log('');
}

if (results.info.length > 0) {
  console.log(`${INFO} INFO (${results.info.length}):\n`);
  results.info.forEach(({ name, message }) => {
    console.log(`   ${INFO} ${name}: ${message}`);
  });
  console.log('');
}

// Final Verdict
console.log('='.repeat(80));

if (results.critical.length > 0) {
  console.log(`\n❌ VALIDATION FAILED`);
  console.log(
    `   ${results.critical.length} critical issue(s) must be fixed before production deployment\n`
  );
  console.log('📝 Next Steps:');
  console.log('   1. Run: node scripts/generate-jwt-secrets.js');
  console.log('   2. Set all required environment variables');
  console.log('   3. Run this script again to verify\n');
  process.exit(1);
} else if (results.warnings.length > 0) {
  console.log(`\n⚠️  VALIDATION PASSED WITH WARNINGS`);
  console.log(`   ${results.warnings.length} warning(s) should be addressed\n`);
  console.log('💡 Recommendation: Address warnings before production deployment\n');
  process.exit(0);
} else {
  console.log(`\n✅ VALIDATION SUCCESSFUL`);
  console.log('   All critical environment variables are properly configured\n');
  console.log('🚀 Ready for production deployment!\n');
  process.exit(0);
}
