#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\n🚀 Play Store Readiness Validation\n');
console.log('=====================================\n');

const checks = {
  critical: [],
  warnings: [],
  passed: [],
};

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    checks.passed.push(`✅ ${description}`);
    return true;
  } else {
    checks.critical.push(`❌ ${description} - File not found: ${filePath}`);
    return false;
  }
}

function checkEnvVar(varName, description, required = true) {
  const value = process.env[varName];
  if (value && value !== '' && !value.includes('your-') && !value.includes('TODO')) {
    checks.passed.push(`✅ ${description}`);
    return true;
  } else {
    if (required) {
      checks.critical.push(`❌ ${description} - ${varName} not set or contains placeholder`);
    } else {
      checks.warnings.push(`⚠️  ${description} - ${varName} not set (optional)`);
    }
    return false;
  }
}

console.log('📋 Checking Required Files...\n');

checkFile('public/privacy-policy.html', 'Privacy Policy HTML');
checkFile('public/terms-of-service.html', 'Terms of Service HTML');
checkFile('assets/icon.png', 'App Icon (512x512)');
checkFile('assets/adaptive-icon.png', 'Adaptive Icon');
checkFile('app.config.js', 'App Configuration');
checkFile('eas.json', 'EAS Build Configuration');

console.log('\n📋 Checking Environment Variables...\n');

require('dotenv').config();

checkEnvVar('EXPO_PUBLIC_PRIVACY_POLICY_URL', 'Privacy Policy URL', true);
checkEnvVar('EXPO_PUBLIC_TERMS_OF_SERVICE_URL', 'Terms of Service URL', true);
checkEnvVar('EXPO_PUBLIC_SUPPORT_EMAIL', 'Support Email', true);
checkEnvVar('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID', 'Google Android OAuth Client ID', true);
checkEnvVar('EXPO_PUBLIC_API_URL', 'Backend API URL', true);
checkEnvVar('EXPO_PUBLIC_FIREBASE_API_KEY', 'Firebase API Key', true);
checkEnvVar('EXPO_PUBLIC_FIREBASE_PROJECT_ID', 'Firebase Project ID', true);
checkEnvVar('EAS_PROJECT_ID', 'EAS Project ID', true);
checkEnvVar('EXPO_PUBLIC_SENTRY_DSN', 'Sentry DSN', false);

console.log('\n📋 Checking App Configuration...\n');

try {
  const appConfig = require('../app.config.js');
  const config = appConfig.expo || appConfig;

  if (config.android && config.android.package === 'com.datingapp.app') {
    checks.passed.push('✅ Android package name configured');
  } else {
    checks.critical.push('❌ Android package name not configured');
  }

  if (config.version) {
    checks.passed.push(`✅ App version set: ${config.version}`);
  } else {
    checks.critical.push('❌ App version not set');
  }

  if (config.android && config.android.versionCode) {
    checks.passed.push(`✅ Android version code set: ${config.android.versionCode}`);
  } else {
    checks.warnings.push('⚠️  Android version code not set (will auto-increment with EAS)');
  }
} catch (error) {
  checks.critical.push(`❌ Error reading app.config.js: ${error.message}`);
}

console.log('\n📋 Checking Store Assets...\n');

checkFile('google-service-account.json', 'Google Service Account JSON (for EAS submit)');

console.log(`\n${'='.repeat(50)}\n`);
console.log('📊 RESULTS SUMMARY\n');

if (checks.passed.length > 0) {
  console.log(`✅ Passed: ${checks.passed.length} checks\n`);
  checks.passed.forEach((check) => console.log(check));
}

if (checks.warnings.length > 0) {
  console.log(`\n⚠️  Warnings: ${checks.warnings.length} items\n`);
  checks.warnings.forEach((check) => console.log(check));
}

if (checks.critical.length > 0) {
  console.log(`\n❌ Critical Issues: ${checks.critical.length} blockers\n`);
  checks.critical.forEach((check) => console.log(check));
}

console.log(`\n${'='.repeat(50)}\n`);

if (checks.critical.length === 0) {
  console.log('🎉 READY FOR PLAY STORE SUBMISSION!\n');
  console.log('Next steps:');
  console.log('1. Build: eas build --platform android --profile production');
  console.log('2. Test the APK/AAB thoroughly');
  console.log('3. Submit: eas submit --platform android\n');
  process.exit(0);
} else {
  console.log('❌ NOT READY - Fix critical issues above\n');
  console.log('See docs/PLAY_STORE_DEPLOYMENT_GUIDE.md for help\n');
  process.exit(1);
}
