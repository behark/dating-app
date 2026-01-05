#!/usr/bin/env node
/**
 * OAuth Configuration Verification Script
 * Checks that OAuth providers are properly configured
 * Run: node scripts/verify-oauth-config.js
 */

require('dotenv').config();

// Simple color functions for terminal output
const colors = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  blue: (s) => `\x1b[34m${s}\x1b[0m`,
};

console.log('\n' + '='.repeat(60));
console.log('OAuth Configuration Verification');
console.log('='.repeat(60) + '\n');

const checks = {
  google: {
    name: 'Google OAuth',
    required: ['GOOGLE_CLIENT_ID'],
    optional: ['GOOGLE_CLIENT_SECRET'],
    issues: [],
  },
  facebook: {
    name: 'Facebook OAuth',
    required: ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET'],
    optional: [],
    issues: [],
  },
  apple: {
    name: 'Apple Sign-In',
    required: ['APPLE_CLIENT_ID', 'APPLE_TEAM_ID'],
    optional: ['APPLE_KEY_ID', 'APPLE_PRIVATE_KEY'],
    issues: [],
  },
};

let hasErrors = false;

for (const [provider, config] of Object.entries(checks)) {
  console.log(`\n${colors.blue('▶')} ${config.name}:`);

  // Check required vars
  const missingRequired = config.required.filter(
    (v) => !process.env[v] || process.env[v] === `your-${v.toLowerCase().replace(/_/g, '-')}`
  );

  if (missingRequired.length > 0) {
    hasErrors = true;
    console.log(`  ${colors.red('✗')} Missing required: ${missingRequired.join(', ')}`);
    if (Array.isArray(config.issues)) {
      // @ts-ignore - issues array exists on config objects
      config.issues.push(`Missing: ${missingRequired.join(', ')}`);
    }
  } else {
    console.log(`  ${colors.green('✓')} All required environment variables set`);
  }

  // Check optional vars
  const missingOptional = config.optional.filter((v) => !process.env[v]);

  if (missingOptional.length > 0) {
    console.log(
      `  ${colors.yellow('!')} Optional (for enhanced features): ${missingOptional.join(', ')}`
    );
  }

  // Provider-specific checks
  if (provider === 'google' && process.env.GOOGLE_CLIENT_ID) {
    if (!process.env.GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com')) {
      console.log(
        `  ${colors.red('✗')} GOOGLE_CLIENT_ID should end with .apps.googleusercontent.com`
      );
      hasErrors = true;
    }
  }
}

// Check redirect URI configuration
console.log(`\n${colors.blue('▶')} Redirect URI Configuration:`);
console.log(`  Frontend URL: ${process.env.FRONTEND_URL || 'Not set (using defaults)'}`);

const possibleRedirectURIs = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:8081',
  'https://auth.expo.io',
].filter(Boolean);

console.log(`  Ensure these URIs are configured in your OAuth provider console:`);
possibleRedirectURIs.forEach((uri) => {
  console.log(`    - ${uri}`);
});

// Summary
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.log(colors.red('⚠  Some OAuth providers are not fully configured'));
  console.log('   OAuth will work in development mode with reduced security.');
  console.log('   For production, ensure all required variables are set.');
} else {
  console.log(colors.green('✓  All OAuth providers are properly configured'));
}
console.log('='.repeat(60) + '\n');

// Show common OAuth issues
console.log('Common OAuth Handshake Issues:');
console.log("1. Redirect URI Mismatch: Ensure your app's redirect URI matches");
console.log("   exactly what's configured in the OAuth provider console.");
console.log('2. Expired Client Secret: Google Client Secrets expire.');
console.log('   Check Google Cloud Console for secret expiration dates.');
console.log("3. Invalid Client ID: Ensure you're using the correct client ID");
console.log('   for your platform (Web, iOS, Android).');
console.log('4. Missing Scopes: Ensure openid, profile, and email scopes are enabled.');
console.log('');

process.exit(hasErrors ? 1 : 0);
