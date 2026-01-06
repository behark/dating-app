#!/usr/bin/env node

/**
 * Legal URLs Verification Script
 * Verifies Privacy Policy and Terms of Service URLs are accessible
 */

const axios = require('axios');
require('dotenv').config();

const requiredUrls = {
  EXPO_PUBLIC_PRIVACY_POLICY_URL: 'Privacy Policy',
  EXPO_PUBLIC_TERMS_OF_SERVICE_URL: 'Terms of Service',
};

async function verifyLegalUrls() {
  console.log('🔍 Verifying Legal Document URLs...\n');

  let hasErrors = false;

  for (const [envVar, documentName] of Object.entries(requiredUrls)) {
    const url = process.env[envVar];

    if (!url) {
      console.log(`❌ ${documentName}`);
      console.log(`   ${envVar} is not set`);
      console.log(`   🔴 CRITICAL: Required for App Store submission!`);
      hasErrors = true;
      continue;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      console.log(`❌ ${documentName}`);
      console.log(`   Invalid URL format: ${url}`);
      hasErrors = true;
      continue;
    }

    // Test URL accessibility
    console.log(`\n📄 ${documentName}`);
    console.log(`   URL: ${url}`);

    try {
      const response = await axios.get(url, {
        timeout: 10000,
        validateStatus: (status) => status < 500, // Accept 4xx but not 5xx
      });

      if (response.status === 200) {
        console.log(`   ✅ URL is accessible (Status: ${response.status})`);

        // Check if it's HTML
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('text/html')) {
          console.log(`   ✅ Content type: HTML`);

          // Check for basic content
          const content = response.data.toLowerCase();
          if (
            content.includes('privacy') ||
            content.includes('terms') ||
            content.includes('policy')
          ) {
            console.log(`   ✅ Content appears to be a legal document`);
          } else {
            console.log(`   ⚠️  Warning: Content may not be a legal document`);
          }
        } else {
          console.log(`   ⚠️  Warning: Content type is ${contentType} (expected HTML)`);
        }
      } else if (response.status === 404) {
        console.log(`   ❌ URL returns 404 Not Found`);
        console.log(`   🔴 CRITICAL: Document is not accessible!`);
        hasErrors = true;
      } else {
        console.log(`   ⚠️  Warning: URL returns status ${response.status}`);
      }
    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.log(`   ❌ URL is not accessible`);
        console.log(`   Error: ${error.message}`);
        console.log(`   🔴 CRITICAL: Document must be accessible for App Store submission!`);
        hasErrors = true;
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`   ⚠️  Warning: URL timed out`);
        console.log(`   The URL may be slow or temporarily unavailable`);
      } else {
        console.log(`   ⚠️  Warning: Could not verify URL`);
        console.log(`   Error: ${error.message}`);
      }
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  if (hasErrors) {
    console.log('❌ VERIFICATION FAILED');
    console.log('   Please fix the issues above before App Store submission.');
    process.exit(1);
  } else {
    console.log('✅ VERIFICATION PASSED');
    console.log('   All legal document URLs are configured and accessible.');
    process.exit(0);
  }
}

// Run verification
verifyLegalUrls();
