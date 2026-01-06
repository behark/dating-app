/**
 * Global Setup for Jest Tests
 * Runs once before all test suites
 */

module.exports = async () => {
  console.log('\n🚀 Starting API Test Suite');
  console.log('================================\n');

  // Set test environment
  process.env.NODE_ENV = 'test';

  // Set required environment variables
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';

  // Database configuration
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dating_app_test';

  // Redis configuration
  process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

  // External services (use test/fake keys)
  process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_fake';
  process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';
  process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-test-fake';

  // Firebase configuration
  process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'test-project';

  // Cloudinary configuration
  process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'test-cloud';
  process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || 'test-api-key';
  process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'test-api-secret';

  // AWS configuration
  process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || 'test-access-key';
  process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || 'test-secret-key';
  process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';
  process.env.AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || 'test-bucket';

  // App configuration
  process.env.PORT = process.env.PORT || '3001';
  process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:19006';

  // Rate limiting (disabled for tests)
  process.env.RATE_LIMIT_ENABLED = 'false';

  console.log('✅ Environment variables configured');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   MongoDB: ${process.env.MONGODB_URI.replace(/:[^:]*@/, ':***@')}`);
  console.log('');
};
