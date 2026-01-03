#!/usr/bin/env node

/**
 * Script to check Render environment variables via API
 * Requires RENDER_API_KEY environment variable
 * 
 * Usage:
 *   export RENDER_API_KEY=your-api-key
 *   node check-render-env-via-api.js
 */

const https = require('https');

const SERVICE_ID = 'srv-d5cooc2li9vc73ct9j70';
const ENVIRONMENT_ID = 'evm-d5cooc6uk2gs738csr80';
const API_KEY = process.env.RENDER_API_KEY;

if (!API_KEY) {
  console.error('❌ RENDER_API_KEY environment variable not set');
  console.error('');
  console.error('To get your API key:');
  console.error('1. Go to https://dashboard.render.com');
  console.error('2. Click on your profile → API Keys');
  console.error('3. Create a new API key');
  console.error('4. Export it: export RENDER_API_KEY=your-key');
  console.error('');
  process.exit(1);
}

const API_BASE = 'api.render.com';

function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_BASE,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function checkEnvironmentVariables() {
  console.log('='.repeat(80));
  console.log('Checking Render Environment Variables via API');
  console.log('='.repeat(80));
  console.log('');
  console.log(`Service ID: ${SERVICE_ID}`);
  console.log(`Environment ID: ${ENVIRONMENT_ID}`);
  console.log('');

  try {
    // Try to get service environment variables
    console.log('Attempting to fetch environment variables...');
    console.log('-'.repeat(80));

    // Note: Render API might not expose env vars directly for security
    // Let's try a few endpoints
    
    // Method 1: Get service details
    console.log('\n1. Fetching service details...');
    const serviceResponse = await makeRequest(`/v1/services/${SERVICE_ID}`);
    console.log(`   Status: ${serviceResponse.status}`);
    
    if (serviceResponse.status === 200) {
      console.log('   ✅ Service found');
      if (serviceResponse.data.service) {
        console.log(`   Name: ${serviceResponse.data.service.name}`);
        console.log(`   Type: ${serviceResponse.data.service.type}`);
      }
    } else {
      console.log(`   ❌ Failed: ${JSON.stringify(serviceResponse.data)}`);
    }

    // Method 2: Get environment details
    console.log('\n2. Fetching environment details...');
    const envResponse = await makeRequest(`/v1/environments/${ENVIRONMENT_ID}`);
    console.log(`   Status: ${envResponse.status}`);
    
    if (envResponse.status === 200) {
      console.log('   ✅ Environment found');
      if (envResponse.data.environment) {
        console.log(`   Name: ${envResponse.data.environment.name}`);
      }
    } else {
      console.log(`   ❌ Failed: ${JSON.stringify(envResponse.data)}`);
    }

    // Method 3: Try to get env vars (may not be available)
    console.log('\n3. Attempting to fetch environment variables...');
    console.log('   ⚠️  Note: Render API may not expose env vars for security');
    
    // Try different possible endpoints
    const endpoints = [
      `/v1/services/${SERVICE_ID}/env-vars`,
      `/v1/environments/${ENVIRONMENT_ID}/env-vars`,
      `/v1/services/${SERVICE_ID}/environment-variables`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await makeRequest(endpoint);
        if (response.status === 200 && response.data) {
          console.log(`   ✅ Found env vars at: ${endpoint}`);
          if (Array.isArray(response.data)) {
            response.data.forEach(env => {
              if (env.key) {
                const value = env.value || env.sync === false ? '[HIDDEN - Set in Dashboard]' : env.value;
                console.log(`      ${env.key} = ${value}`);
              }
            });
          } else if (response.data.envVars) {
            Object.entries(response.data.envVars).forEach(([key, value]) => {
              console.log(`      ${key} = ${typeof value === 'string' ? value.substring(0, 20) + '...' : '[HIDDEN]'}`);
            });
          }
          break;
        }
      } catch (e) {
        // Endpoint doesn't exist, try next
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('Note: Render API may restrict access to environment variables');
    console.log('      for security reasons. Use SSH method or Dashboard instead.');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Possible issues:');
    console.error('1. API key is invalid or expired');
    console.error('2. API key doesn\'t have required permissions');
    console.error('3. Render API doesn\'t expose env vars via API');
    console.error('');
    console.error('Alternative: Use SSH method (check-render-env-via-ssh.sh)');
  }
}

checkEnvironmentVariables();
