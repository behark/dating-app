#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 *
 * Validates all required environment variables for production deployment
 * Run before deploying to Render/Vercel
 *
 * Usage: node scripts/validate-env-for-production.js
 */

const crypto = require('crypto');

const CHECK = '✅';
const FAIL = '❌';
const WARN = '⚠️';
const INFO = 'ℹ️';

// =============================================================================
// BACKEND VARIABLE DEFINITIONS
// =============================================================================

const BACKEND_VARS = {
  critical: [
    {
      name: 'JWT_SECRET',
      minLength: 64,
      description: 'JWT authentication secret',
      noDefaultValues: ['your-super-secret', 'change-in-production', 'secret', 'test'],
    },
    {
      name: 'JWT_REFRESH_SECRET',
      minLength: 64,
      description: 'JWT refresh token secret',
      noDefaultValues: ['your-super-secret', 'change-in-production', 'secret', 'test'],
      mustDifferFrom: 'JWT_SECRET',
    },
    {
      name: 'HASH_SALT',
      minLength: 16,
      description: 'Hash salt for sensitive data',
    },
    {
      name: 'MONGODB_URI',
      alternatives: ['MONGODB_URL'],
      description: 'MongoDB connection string',
      pattern: /^mongodb(\+srv)?:\/\//,
    },
  ],

  important: [
    {
      name: 'NODE_ENV',
      expectedValue: 'production',
      description: 'Environment mode',
    },
    {
      name: 'FRONTEND_URL',
      description: 'Frontend URL for CORS',
      pattern: /^https:\/\//,
      patternMessage: 'Must be HTTPS in production',
    },
    {
      name: 'REDIS_URL',
      alternatives: ['REDIS_HOST'],
      description: 'Redis connection',
    },
  ],

  recommended: [
    { name: 'SENTRY_DSN', description: 'Error tracking' },
    { name: 'EMAIL_USER', description: 'Email service' },
    { name: 'EMAIL_PASSWORD', description: 'Email password' },
    { name: 'CLOUDINARY_CLOUD_NAME', description: 'Image storage' },
    { name: 'CLOUDINARY_API_KEY', description: 'Image storage' },
    { name: 'CLOUDINARY_API_SECRET', description: 'Image storage' },
    { name: 'STRIPE_SECRET_KEY', description: 'Payment processing' },
  ],
};

// =============================================================================
// FRONTEND VARIABLE DEFINITIONS
// =============================================================================

const FRONTEND_VARS = {
  critical: [
    {
      name: 'EXPO_PUBLIC_API_URL',
      alternatives: ['EXPO_PUBLIC_BACKEND_URL', 'EXPO_PUBLIC_API_URL_PRODUCTION'],
      description: 'Backend API URL',
      pattern: /^https:\/\//,
      patternMessage: 'Must be HTTPS in production',
    },
  ],

  important: [
    { name: 'EXPO_PUBLIC_FIREBASE_API_KEY', description: 'Firebase config' },
    { name: 'EXPO_PUBLIC_FIREBASE_PROJECT_ID', description: 'Firebase config' },
    { name: 'EXPO_PUBLIC_PRIVACY_POLICY_URL', description: 'Legal - App Store requirement' },
    { name: 'EXPO_PUBLIC_TERMS_OF_SERVICE_URL', description: 'Legal - App Store requirement' },
  ],

  recommended: [
    { name: 'EXPO_PUBLIC_SENTRY_DSN', description: 'Error tracking' },
    { name: 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', description: 'Firebase auth' },
  ],
};

// =============================================================================
// SECURITY CHECKS
// =============================================================================

const FORBIDDEN_IN_FRONTEND = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'HASH_SALT',
  'MONGODB_URI',
  'MONGODB_URL',
  'REDIS_URL',
  'REDIS_PASSWORD',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'CLOUDINARY_API_SECRET',
  'AWS_SECRET_ACCESS_KEY',
  'OPENAI_API_KEY',
  'EMAIL_PASSWORD',
  'SMTP_PASS',
  'PAYPAL_CLIENT_SECRET',
  'APPLE_SHARED_SECRET',
  'APPLE_PRIVATE_KEY',
  'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY',
  'GOOGLE_CLIENT_SECRET',
];

// =============================================================================
// VALIDATION LOGIC
// =============================================================================

class EnvValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passes = [];
    this.infos = [];
  }

  pass(message) {
    this.passes.push(message);
    console.log(`${CHECK} ${message}`);
  }

  fail(message) {
    this.errors.push(message);
    console.log(`${FAIL} ${message}`);
  }

  warn(message) {
    this.warnings.push(message);
    console.log(`${WARN} ${message}`);
  }

  info(message) {
    this.infos.push(message);
    console.log(`${INFO} ${message}`);
  }

  getValue(varDef) {
    let value = process.env[varDef.name];
    if (!value && varDef.alternatives) {
      for (const alt of varDef.alternatives) {
        value = process.env[alt];
        if (value) break;
      }
    }
    return value;
  }

  validateVar(varDef, level = 'critical') {
    const value = this.getValue(varDef);

    if (!value) {
      if (level === 'critical') {
        this.fail(`${varDef.name}: MISSING (${varDef.description})`);
      } else if (level === 'important') {
        this.warn(`${varDef.name}: Not set (${varDef.description})`);
      } else {
        this.info(`${varDef.name}: Not set (${varDef.description})`);
      }
      return false;
    }

    // Check minimum length
    if (varDef.minLength && value.length < varDef.minLength) {
      this.fail(`${varDef.name}: Too short (${value.length} chars, need ${varDef.minLength})`);
      return false;
    }

    // Check for default/placeholder values
    if (varDef.noDefaultValues) {
      const lowerValue = value.toLowerCase();
      for (const forbidden of varDef.noDefaultValues) {
        if (lowerValue.includes(forbidden.toLowerCase())) {
          this.fail(`${varDef.name}: Contains placeholder value "${forbidden}"`);
          return false;
        }
      }
    }

    // Check expected value
    if (varDef.expectedValue && value !== varDef.expectedValue) {
      this.warn(`${varDef.name}: Expected "${varDef.expectedValue}", got "${value}"`);
    }

    // Check pattern
    if (varDef.pattern && !varDef.pattern.test(value)) {
      if (level === 'critical') {
        this.fail(`${varDef.name}: ${varDef.patternMessage || 'Invalid format'}`);
        return false;
      } else {
        this.warn(`${varDef.name}: ${varDef.patternMessage || 'May have invalid format'}`);
      }
    }

    // Check must differ from another var
    if (varDef.mustDifferFrom) {
      const otherValue = process.env[varDef.mustDifferFrom];
      if (value === otherValue) {
        this.fail(`${varDef.name}: Must be different from ${varDef.mustDifferFrom}`);
        return false;
      }
    }

    this.pass(`${varDef.name}: OK`);
    return true;
  }

  validateBackend() {
    console.log('\n' + '='.repeat(60));
    console.log('🔧 BACKEND ENVIRONMENT VALIDATION');
    console.log('='.repeat(60));

    console.log('\n--- Critical Variables ---\n');
    for (const varDef of BACKEND_VARS.critical) {
      this.validateVar(varDef, 'critical');
    }

    console.log('\n--- Important Variables ---\n');
    for (const varDef of BACKEND_VARS.important) {
      this.validateVar(varDef, 'important');
    }

    console.log('\n--- Recommended Variables ---\n');
    for (const varDef of BACKEND_VARS.recommended) {
      this.validateVar(varDef, 'recommended');
    }
  }

  validateFrontend() {
    console.log('\n' + '='.repeat(60));
    console.log('🌐 FRONTEND ENVIRONMENT VALIDATION');
    console.log('='.repeat(60));

    console.log('\n--- Critical Variables ---\n');
    for (const varDef of FRONTEND_VARS.critical) {
      this.validateVar(varDef, 'critical');
    }

    console.log('\n--- Important Variables ---\n');
    for (const varDef of FRONTEND_VARS.important) {
      this.validateVar(varDef, 'important');
    }

    console.log('\n--- Recommended Variables ---\n');
    for (const varDef of FRONTEND_VARS.recommended) {
      this.validateVar(varDef, 'recommended');
    }
  }

  validateSecurity() {
    console.log('\n' + '='.repeat(60));
    console.log('🔒 SECURITY VALIDATION');
    console.log('='.repeat(60) + '\n');

    // Check that secrets are not exposed in EXPO_PUBLIC_* variables
    let hasSecurityIssue = false;

    for (const forbidden of FORBIDDEN_IN_FRONTEND) {
      const exposedName = `EXPO_PUBLIC_${forbidden}`;
      if (process.env[exposedName]) {
        this.fail(`SECRET EXPOSED: ${forbidden} is set as ${exposedName}`);
        hasSecurityIssue = true;
      }
    }

    if (!hasSecurityIssue) {
      this.pass('No secrets exposed in EXPO_PUBLIC_* variables');
    }

    // Check for localhost in production URLs
    if (process.env.NODE_ENV === 'production') {
      const urlVars = ['FRONTEND_URL', 'EXPO_PUBLIC_API_URL', 'CORS_ORIGIN'];
      for (const varName of urlVars) {
        const value = process.env[varName] || '';
        if (value.includes('localhost') || value.includes('127.0.0.1')) {
          this.fail(`${varName} contains localhost in production`);
        }
      }
    }

    // Check JWT secrets are different
    if (process.env.JWT_SECRET && process.env.JWT_REFRESH_SECRET) {
      if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
        this.fail('JWT_SECRET and JWT_REFRESH_SECRET must be different');
      } else {
        this.pass('JWT secrets are different');
      }
    }
  }

  checkMisconfigurations() {
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  POTENTIAL MISCONFIGURATIONS');
    console.log('='.repeat(60) + '\n');

    // Check URL consistency
    const frontendUrl = process.env.FRONTEND_URL || '';
    const corsOrigin = process.env.CORS_ORIGIN || '';
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';

    if (frontendUrl && !corsOrigin.includes(frontendUrl) && !corsOrigin) {
      this.info('Consider adding FRONTEND_URL to CORS_ORIGIN if needed');
    }

    // Check for HTTP in production
    if (process.env.NODE_ENV === 'production') {
      if (frontendUrl.startsWith('http://')) {
        this.warn('FRONTEND_URL uses HTTP, should be HTTPS in production');
      }
      if (apiUrl.startsWith('http://')) {
        this.warn('EXPO_PUBLIC_API_URL uses HTTP, should be HTTPS in production');
      }
    }

    // Check email configuration
    if (process.env.EMAIL_USER && !process.env.EMAIL_PASSWORD) {
      this.warn('EMAIL_USER set but EMAIL_PASSWORD is missing');
    }

    // Check Cloudinary configuration
    const cloudinaryVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
    const cloudinarySet = cloudinaryVars.filter((v) => process.env[v]);
    if (cloudinarySet.length > 0 && cloudinarySet.length < 3) {
      this.warn(`Cloudinary partially configured. Set: ${cloudinarySet.join(', ')}`);
    }

    // Check Stripe configuration
    if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_WEBHOOK_SECRET) {
      this.warn('Stripe secret key set but webhook secret missing');
    }
  }

  generateSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(60) + '\n');

    console.log(`${CHECK} Passed: ${this.passes.length}`);
    console.log(`${FAIL} Errors: ${this.errors.length}`);
    console.log(`${WARN} Warnings: ${this.warnings.length}`);
    console.log(`${INFO} Info: ${this.infos.length}`);

    if (this.errors.length > 0) {
      console.log('\n🚫 CRITICAL ISSUES (must fix before deployment):');
      this.errors.forEach((e) => console.log(`   ${FAIL} ${e}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS (review before deployment):');
      this.warnings.forEach((w) => console.log(`   ${WARN} ${w}`));
    }

    console.log('\n' + '='.repeat(60));
    if (this.errors.length === 0) {
      console.log('✅ READY FOR PRODUCTION');
    } else {
      console.log('❌ NOT READY - Fix critical issues before deploying');
    }
    console.log('='.repeat(60) + '\n');

    return this.errors.length === 0;
  }

  run() {
    console.log('\n🔍 ENVIRONMENT VARIABLES PRODUCTION VALIDATOR\n');
    console.log('Checking environment for Render (Backend) & Vercel (Frontend)\n');

    this.validateBackend();
    this.validateFrontend();
    this.validateSecurity();
    this.checkMisconfigurations();

    return this.generateSummary();
  }
}

// =============================================================================
// RUN VALIDATOR
// =============================================================================

if (require.main === module) {
  // Load .env file if present
  try {
    require('dotenv').config();
    require('dotenv').config({ path: './backend/.env' });
  } catch (e) {
    // dotenv not installed, that's fine
  }

  const validator = new EnvValidator();
  const isValid = validator.run();
  process.exit(isValid ? 0 : 1);
}

module.exports = EnvValidator;
