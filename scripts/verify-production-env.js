#!/usr/bin/env node

/**
 * Production Environment Variables Verification Script
 * Verifies all required environment variables are set before launch
 */

const requiredBackendVars = {
  // Database
  MONGODB_URI: 'MongoDB connection string',
  REDIS_URL: 'Redis connection URL (optional but recommended)',
  
  // Security
  JWT_SECRET: 'JWT token signing secret (CRITICAL)',
  CORS_ORIGIN: 'Allowed CORS origins (comma-separated)',
  
  // Services
  SENTRY_DSN: 'Sentry error tracking DSN (optional but recommended)',
  STRIPE_SECRET_KEY: 'Stripe payment processing key',
  
  // Environment
  NODE_ENV: 'Should be "production"',
  
  // Optional but recommended
  FRONTEND_URL: 'Frontend application URL',
  API_KEY: 'API key for server-to-server communication (optional)',
};

const requiredFrontendVars = {
  // API
  EXPO_PUBLIC_API_URL: 'Backend API URL',
  
  // Firebase
  EXPO_PUBLIC_FIREBASE_API_KEY: 'Firebase API key',
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: 'Firebase auth domain',
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'Firebase project ID',
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: 'Firebase storage bucket',
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: 'Firebase messaging sender ID',
  EXPO_PUBLIC_FIREBASE_APP_ID: 'Firebase app ID',
  
  // OAuth
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: 'Google OAuth web client ID',
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: 'Google OAuth iOS client ID (optional)',
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: 'Google OAuth Android client ID (optional)',
  
  // Legal (Required for App Store)
  EXPO_PUBLIC_PRIVACY_POLICY_URL: 'Privacy Policy URL (REQUIRED for store submission)',
  EXPO_PUBLIC_TERMS_OF_SERVICE_URL: 'Terms of Service URL (REQUIRED for store submission)',
  EXPO_PUBLIC_SUPPORT_EMAIL: 'Support email address',
  EXPO_PUBLIC_PRIVACY_EMAIL: 'Privacy email address',
  EXPO_PUBLIC_COMPANY_ADDRESS: 'Company address for legal documents',
};

const optionalVars = {
  // AI Features
  EXPO_PUBLIC_VERCEL_AI_GATEWAY_KEY: 'Vercel AI Gateway key (optional)',
  EXPO_PUBLIC_VERCEL_AI_GATEWAY_URL: 'Vercel AI Gateway URL (optional)',
  
  // Cloudinary (if using)
  EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME: 'Cloudinary cloud name (optional)',
};

function checkEnvironment() {
  console.log('🔍 Verifying Production Environment Variables...\n');
  
  let hasErrors = false;
  let hasWarnings = false;
  
  // Check backend variables
  console.log('📦 BACKEND VARIABLES:\n');
  for (const [varName, description] of Object.entries(requiredBackendVars)) {
    const value = process.env[varName];
    if (!value) {
      console.log(`  ❌ ${varName}`);
      console.log(`     Missing: ${description}`);
      hasErrors = true;
    } else {
      // Mask sensitive values
      const displayValue = varName.includes('SECRET') || varName.includes('KEY') || varName.includes('PASSWORD')
        ? '***' + value.slice(-4)
        : value;
      console.log(`  ✅ ${varName} = ${displayValue}`);
      
      // Special checks
      if (varName === 'NODE_ENV' && value !== 'production') {
        console.log(`     ⚠️  Warning: NODE_ENV should be "production"`);
        hasWarnings = true;
      }
      if (varName === 'JWT_SECRET' && value.length < 32) {
        console.log(`     ⚠️  Warning: JWT_SECRET should be at least 32 characters`);
        hasWarnings = true;
      }
    }
  }
  
  console.log('\n📱 FRONTEND VARIABLES:\n');
  for (const [varName, description] of Object.entries(requiredFrontendVars)) {
    const value = process.env[varName];
    if (!value) {
      console.log(`  ❌ ${varName}`);
      console.log(`     Missing: ${description}`);
      
      // Mark critical store submission vars
      if (varName.includes('PRIVACY_POLICY') || varName.includes('TERMS_OF_SERVICE')) {
        console.log(`     🔴 CRITICAL: Required for App Store submission!`);
      }
      hasErrors = true;
    } else {
      // Validate URLs
      if (varName.includes('URL')) {
        try {
          new URL(value);
          console.log(`  ✅ ${varName} = ${value}`);
        } catch (e) {
          console.log(`  ⚠️  ${varName} = ${value}`);
          console.log(`     Warning: Invalid URL format`);
          hasWarnings = true;
        }
      } else {
        console.log(`  ✅ ${varName} = ${value}`);
      }
    }
  }
  
  console.log('\n📋 OPTIONAL VARIABLES:\n');
  for (const [varName, description] of Object.entries(optionalVars)) {
    const value = process.env[varName];
    if (value) {
      console.log(`  ✅ ${varName} = ${value}`);
    } else {
      console.log(`  ⚪ ${varName} (optional)`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  if (hasErrors) {
    console.log('❌ VERIFICATION FAILED');
    console.log('   Please set all required environment variables before launch.');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  VERIFICATION PASSED WITH WARNINGS');
    console.log('   Review warnings above before launch.');
    process.exit(0);
  } else {
    console.log('✅ VERIFICATION PASSED');
    console.log('   All required environment variables are set.');
    process.exit(0);
  }
}

// Run verification
checkEnvironment();
