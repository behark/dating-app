/**
 * Test Cloudinary Connection
 * Verifies Cloudinary credentials are correctly configured
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const cloudinary = require('cloudinary').v2;

// Check environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const storageProvider = process.env.STORAGE_PROVIDER || 'cloudinary';

console.log('🔍 Testing Cloudinary Configuration...\n');

// Check if storage provider is set to cloudinary
if (storageProvider !== 'cloudinary') {
  console.log(`⚠️  STORAGE_PROVIDER is set to: ${storageProvider}`);
  console.log('   Expected: cloudinary\n');
}

// Check for required environment variables
const missingVars = [];
if (!cloudName) missingVars.push('CLOUDINARY_CLOUD_NAME');
if (!apiKey) missingVars.push('CLOUDINARY_API_KEY');
if (!apiSecret) missingVars.push('CLOUDINARY_API_SECRET');

if (missingVars.length > 0) {
  console.log('❌ Missing environment variables:');
  missingVars.forEach(v => console.log(`   - ${v}`));
  console.log('\n💡 Add these to your Render dashboard environment variables.');
  process.exit(1);
}

console.log('✅ All environment variables found:');
console.log(`   CLOUDINARY_CLOUD_NAME: ${cloudName ? '✅ Set' : '❌ Missing'}`);
console.log(`   CLOUDINARY_API_KEY: ${apiKey ? '✅ Set' : '❌ Missing'}`);
console.log(`   CLOUDINARY_API_SECRET: ${apiSecret ? '✅ Set (hidden)' : '❌ Missing'}`);
console.log(`   STORAGE_PROVIDER: ${storageProvider}\n`);

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

// Test connection
async function testConnection() {
  try {
    console.log('📡 Testing Cloudinary connection...');
    
    // Simple API call to verify credentials
    const result = await cloudinary.api.ping();
    
    if (result.status === 'ok') {
      console.log('✅ Cloudinary connection successful!');
      console.log(`   Status: ${result.status}`);
      
      // Try to get account info
      try {
        const accountInfo = await cloudinary.api.usage();
        console.log('\n📊 Account Usage:');
        console.log(`   Storage: ${(accountInfo.used_storage_bytes / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Bandwidth: ${(accountInfo.used_bandwidth_bytes / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Requests: ${accountInfo.requests || 'N/A'}`);
      } catch (usageError) {
        console.log('⚠️  Could not fetch usage info (may need admin API key)');
      }
      
      console.log('\n🎉 Cloudinary is properly configured and ready to use!');
      return true;
    } else {
      console.log('❌ Cloudinary connection failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Cloudinary connection error:');
    console.log(`   ${error.message}`);
    
    if (error.message.includes('Invalid API Key')) {
      console.log('\n💡 Check your CLOUDINARY_API_KEY in Render dashboard');
    } else if (error.message.includes('Invalid signature')) {
      console.log('\n💡 Check your CLOUDINARY_API_SECRET in Render dashboard');
    } else if (error.message.includes('Cloud name')) {
      console.log('\n💡 Check your CLOUDINARY_CLOUD_NAME in Render dashboard');
    }
    
    return false;
  }
}

testConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
