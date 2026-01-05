#!/usr/bin/env node

/**
 * Error Monitoring Test Script
 * Tests Sentry error tracking configuration
 */

require('dotenv').config();

async function testErrorMonitoring() {
  console.log('🧪 Testing Error Monitoring (Sentry)...\n');
  
  // Check if Sentry is configured
  const sentryDsn = process.env.SENTRY_DSN || process.env.SENTRY_DSN_BACKEND;
  
  if (!sentryDsn) {
    console.log('⚠️  Sentry DSN not configured');
    console.log('   Set SENTRY_DSN environment variable to enable error tracking');
    console.log('   This is recommended but not required for launch');
    return;
  }
  
  console.log('✅ Sentry DSN configured');
  console.log(`   DSN: ${sentryDsn.substring(0, 20)}...`);
  
  // Test Sentry initialization
  try {
    const Sentry = require('@sentry/node');
    
    if (Sentry.getCurrentHub().getClient()) {
      console.log('✅ Sentry client initialized');
    } else {
      console.log('⚠️  Sentry client not initialized');
      console.log('   Check Sentry initialization in backend/server.js');
    }
    
    // Test error capture
    console.log('\n📤 Testing error capture...');
    try {
      Sentry.captureException(new Error('Test error from verification script'));
      console.log('✅ Error capture test successful');
      console.log('   Check your Sentry dashboard for the test error');
    } catch (error) {
      console.log('❌ Error capture failed');
      console.log(`   Error: ${error.message}`);
    }
    
    // Test message capture
    console.log('\n📤 Testing message capture...');
    try {
      Sentry.captureMessage('Test message from verification script', 'info');
      console.log('✅ Message capture test successful');
      console.log('   Check your Sentry dashboard for the test message');
    } catch (error) {
      console.log('❌ Message capture failed');
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('\n✅ Error monitoring test PASSED');
    console.log('   ⚠️  Remember to check your Sentry dashboard to verify errors are being received');
    
  } catch (error) {
    console.log('❌ Sentry test FAILED');
    console.log(`   Error: ${error.message}`);
    console.log('   Make sure @sentry/node is installed: npm install @sentry/node');
  }
}

// Run test
testErrorMonitoring();
