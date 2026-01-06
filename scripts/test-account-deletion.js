#!/usr/bin/env node

/**
 * Account Deletion Test Script
 * Tests the account deletion flow end-to-end
 */

const axios = require('axios');
require('dotenv').config();

const API_URL =
  process.env.API_URL || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

async function testAccountDeletion() {
  console.log('🧪 Testing Account Deletion Flow...\n');

  let testUserId = null;
  let authToken = null;

  try {
    // Step 1: Create a test account
    console.log('1️⃣  Creating test account...');
    const signupResponse = await axios.post(`${API_URL}/auth/signup`, {
      email: `test-delete-${Date.now()}@test.com`,
      password: 'TestPassword123!',
      name: 'Test User',
      age: 25,
      gender: 'other',
    });

    if (signupResponse.data.success) {
      testUserId = signupResponse.data.data.user._id || signupResponse.data.data.user.id;
      authToken = signupResponse.data.data.tokens?.accessToken || signupResponse.data.authToken;
      console.log(`   ✅ Test account created: ${testUserId}`);
    } else {
      throw new Error('Failed to create test account');
    }

    // Step 2: Verify account exists
    console.log('\n2️⃣  Verifying account exists...');
    const profileResponse = await axios.get(`${API_URL}/profile/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (profileResponse.data.success) {
      console.log(`   ✅ Account verified: ${profileResponse.data.data.email}`);
    } else {
      throw new Error('Failed to verify account');
    }

    // Step 3: Test deletion endpoint
    console.log('\n3️⃣  Testing account deletion...');
    const deleteResponse = await axios.delete(`${API_URL}/privacy/delete-account`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        password: 'TestPassword123!',
      },
    });

    if (deleteResponse.data.success) {
      console.log('   ✅ Account deletion request successful');
    } else {
      throw new Error(`Deletion failed: ${deleteResponse.data.message}`);
    }

    // Step 4: Verify account is deleted (should fail)
    console.log('\n4️⃣  Verifying account is deleted...');
    try {
      await axios.get(`${API_URL}/profile/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      console.log('   ❌ Account still accessible - deletion may not have worked');
      process.exit(1);
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 404) {
        console.log('   ✅ Account successfully deleted (no longer accessible)');
      } else {
        throw error;
      }
    }

    // Step 5: Verify data cleanup
    console.log('\n5️⃣  Verifying data cleanup...');
    // Note: This would require admin access or database queries
    // For now, we just verify the account is inaccessible
    console.log('   ⚠️  Manual verification required:');
    console.log('      - Check database for user data');
    console.log('      - Verify photos are deleted');
    console.log('      - Verify messages are deleted');
    console.log('      - Verify matches are deleted');

    console.log('\n✅ Account deletion test PASSED');
    console.log('   ⚠️  Note: Manual verification of data cleanup recommended');
  } catch (error) {
    console.error('\n❌ Account deletion test FAILED');
    console.error(`   Error: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    process.exit(1);
  }
}

// Run test
testAccountDeletion();
