/**
 * Verify Demo Profiles on Production Site
 * Tests the deployed API to confirm demo profiles are accessible
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

// Get API URL from environment or use default
const API_URL = process.env.API_URL || process.env.EXPO_PUBLIC_API_URL || 'https://dating-app-backend-x4yq.onrender.com/api';

console.log('🔍 Verifying Demo Profiles on Production Site...\n');
console.log(`📡 API URL: ${API_URL}\n`);

// Test credentials (using first demo profile)
const TEST_EMAIL = 'demo0@example.com';
const TEST_PASSWORD = 'Demo123!';

async function verifyProfiles() {
  try {
    // Step 1: Login to get auth token
    console.log('1️⃣  Logging in with demo account...');
    let authToken;
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (loginResponse.data.success && loginResponse.data.token) {
        authToken = loginResponse.data.token;
        console.log('✅ Login successful');
        console.log(`   User: ${loginResponse.data.user?.name || TEST_EMAIL}`);
        console.log(`   User ID: ${loginResponse.data.user?._id || loginResponse.data.user?.id}\n`);
      } else {
        console.log('❌ Login failed - no token received');
        console.log('   Response:', loginResponse.data);
        return;
      }
    } catch (loginError) {
      console.log('❌ Login failed:');
      if (loginError.response) {
        console.log(`   Status: ${loginError.response.status}`);
        console.log(`   Message: ${loginError.response.data?.message || loginError.response.data}`);
      } else if (loginError.request) {
        console.log('   No response received - API might be down');
        console.log('   Error:', loginError.message);
      } else {
        console.log('   Error:', loginError.message);
      }
      return;
    }

    // Step 2: Get user's location (needed for discovery)
    console.log('2️⃣  Getting current user location...');
    let userLat = 40.7128; // Default to NYC
    let userLng = -74.0060;
    
    try {
      const profileResponse = await axios.get(`${API_URL}/profile/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 10000,
      });

      if (profileResponse.data.success && profileResponse.data.data?.user?.location) {
        const location = profileResponse.data.data.user.location;
        if (location.coordinates && location.coordinates.length === 2) {
          userLng = location.coordinates[0];
          userLat = location.coordinates[1];
          console.log(`✅ User location found: ${userLat}, ${userLng}`);
          console.log(`   City: ${location.city || 'Unknown'}\n`);
        } else {
          console.log('⚠️  User location missing coordinates, using default (NYC)\n');
        }
      } else {
        console.log('⚠️  Could not get user location, using default (NYC)\n');
      }
    } catch (locationError) {
      console.log('⚠️  Could not get user location, using default (NYC)');
      if (locationError.response) {
        console.log(`   Status: ${locationError.response.status}\n`);
      } else {
        console.log(`   Error: ${locationError.message}\n`);
      }
    }

    // Step 3: Test discovery endpoint
    console.log('3️⃣  Testing discovery endpoint...');
    try {
      const discoveryResponse = await axios.get(`${API_URL}/users/discover`, {
        params: {
          lat: userLat,
          lng: userLng,
          radius: 50000, // 50km radius
        },
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 15000,
      });

      if (discoveryResponse.data.success) {
        const users = discoveryResponse.data.data?.users || [];
        const count = discoveryResponse.data.data?.count || users.length;
        
        console.log(`✅ Discovery successful!`);
        console.log(`   Found ${users.length} users (total: ${count})`);
        
        // Check for demo profiles
        const demoProfiles = users.filter(u => u.isDemo === true);
        const regularProfiles = users.filter(u => !u.isDemo);
        
        console.log(`\n📊 Profile Breakdown:`);
        console.log(`   Demo profiles: ${demoProfiles.length}`);
        console.log(`   Regular profiles: ${regularProfiles.length}`);
        
        if (demoProfiles.length > 0) {
          console.log(`\n✅ Demo profiles ARE showing on production!`);
          console.log(`\n📋 Sample demo profiles:`);
          demoProfiles.slice(0, 5).forEach((profile, idx) => {
            console.log(`   ${idx + 1}. ${profile.name} (${profile.age}) - ${profile.email}`);
            console.log(`      Photos: ${profile.photos?.length || 0}`);
            console.log(`      Location: ${profile.location?.city || 'Unknown'}`);
          });
        } else {
          console.log(`\n⚠️  No demo profiles found in discovery results`);
          console.log(`   This could mean:`);
          console.log(`   - All demo profiles were already swiped`);
          console.log(`   - Demo profiles are outside the search radius`);
          console.log(`   - Demo profiles don't match user preferences`);
        }
        
        if (users.length > 0) {
          console.log(`\n📋 Sample profiles (first 3):`);
          users.slice(0, 3).forEach((profile, idx) => {
            console.log(`   ${idx + 1}. ${profile.name} (${profile.age})`);
            console.log(`      Email: ${profile.email || 'N/A'}`);
            console.log(`      Is Demo: ${profile.isDemo ? 'Yes' : 'No'}`);
            console.log(`      Photos: ${profile.photos?.length || 0}`);
          });
        }
        
      } else {
        console.log('❌ Discovery request failed');
        console.log('   Response:', discoveryResponse.data);
      }
    } catch (discoveryError) {
      console.log('❌ Discovery endpoint error:');
      if (discoveryError.response) {
        console.log(`   Status: ${discoveryError.response.status}`);
        console.log(`   Message: ${discoveryError.response.data?.message || discoveryError.response.data}`);
        console.log(`   Data:`, JSON.stringify(discoveryError.response.data, null, 2));
      } else if (discoveryError.request) {
        console.log('   No response received');
        console.log('   Error:', discoveryError.message);
      } else {
        console.log('   Error:', discoveryError.message);
      }
    }

    // Step 4: Try alternative discovery endpoint
    console.log('\n4️⃣  Testing alternative discovery endpoint (/discovery/explore)...');
    try {
      const exploreResponse = await axios.get(`${API_URL}/discovery/explore`, {
        params: {
          lat: userLat,
          lng: userLng,
          radius: 50000,
          limit: 20,
        },
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        timeout: 15000,
      });

      if (exploreResponse.data.success) {
        const users = exploreResponse.data.data || exploreResponse.data.users || [];
        const demoCount = users.filter(u => u.isDemo === true).length;
        
        console.log(`✅ Explore endpoint works!`);
        console.log(`   Found ${users.length} users`);
        console.log(`   Demo profiles: ${demoCount}`);
      } else {
        console.log('⚠️  Explore endpoint returned unsuccessful response');
      }
    } catch (exploreError) {
      console.log('⚠️  Explore endpoint not available or error occurred');
      if (exploreError.response) {
        console.log(`   Status: ${exploreError.response.status}`);
      }
    }

    console.log('\n✅ Verification complete!');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
}

verifyProfiles();
