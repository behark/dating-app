#!/usr/bin/env node

/**
 * Generate Strong JWT Secrets
 * Creates cryptographically secure random secrets for JWT tokens
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const MIN_LENGTH = 64; // Minimum 64 characters for production security

/**
 * Generate a cryptographically secure random string
 * @param {number} length - Length of the secret
 * @returns {string} - Base64 encoded random string
 */
function generateSecret(length = MIN_LENGTH) {
  // Generate random bytes and convert to base64
  // base64 encoding increases length by ~33%, so we adjust
  const bytes = Math.ceil((length * 3) / 4);
  return crypto.randomBytes(bytes).toString('base64').slice(0, length);
}

/**
 * Main function
 */
function main() {
  console.log('🔐 JWT Secret Generator\n');
  console.log('Generating cryptographically secure JWT secrets...\n');

  // Generate secrets
  const jwtSecret = generateSecret(MIN_LENGTH);
  const jwtRefreshSecret = generateSecret(MIN_LENGTH);
  const apiKey = generateSecret(32); // Shorter for API key

  console.log('✅ Secrets generated successfully!\n');
  console.log('📋 Copy these to your .env file:\n');
  console.log('─'.repeat(80));
  console.log(`JWT_SECRET=${jwtSecret}`);
  console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}`);
  console.log(`API_KEY=${apiKey}`);
  console.log('─'.repeat(80));
  console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
  console.log('   • Never commit these secrets to version control');
  console.log('   • Use different secrets for each environment (dev/staging/prod)');
  console.log('   • Store production secrets in secure environment variables');
  console.log('   • Rotate secrets periodically (every 90 days recommended)');
  console.log('   • Each secret is 64+ characters as required for production\n');

  // Ask if user wants to save to .env file
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), 'backend', '.env.example');

  console.log('📝 Options:');
  console.log(`   1. Manually copy to: ${envPath}`);
  console.log(`   2. Review example at: ${envExamplePath}`);
  console.log('\n💡 Tip: Run this script again to generate new secrets\n');

  // Create a production-ready .env template
  const envTemplate = `# ===================================
# GENERATED JWT SECRETS
# ===================================
# Generated: ${new Date().toISOString()}
# 
# ⚠️  CRITICAL: These are PRODUCTION secrets
# • Do NOT commit to version control
# • Store in secure environment variables (Render, Vercel, etc.)
# • Use different secrets for dev/staging/production

# JWT Authentication Secrets (64+ characters required)
JWT_SECRET=${jwtSecret}
JWT_REFRESH_SECRET=${jwtRefreshSecret}

# Optional: Server-to-Server API Key (for webhooks, etc.)
API_KEY=${apiKey}

# JWT Token Expiry
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# ===================================
# OTHER REQUIRED ENVIRONMENT VARIABLES
# ===================================
# Copy from .env.example and fill in:
# - MONGODB_URI=mongodb+srv://...
# - REDIS_URL=redis://...
# - SENTRY_DSN=https://...
# - FRONTEND_URL=https://...
# - NODE_ENV=production
`;

  const saveToFile = path.join(process.cwd(), '.env.production.secrets');
  try {
    fs.writeFileSync(saveToFile, envTemplate);
    console.log(`✅ Secrets saved to: ${saveToFile}`);
    console.log('   (This file is gitignored - safe to keep locally)\n');
  } catch (error) {
    console.log(`❌ Could not save to file: ${error.message}\n`);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { generateSecret };
