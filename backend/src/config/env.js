const { cleanEnv, str, port, url } = require('envalid');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env depending on the environment
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = cleanEnv(process.env, {
  // Mode
  NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
  PORT: port({ default: 3000 }),

  // Database
  MONGODB_URI: str(),

  // Frontend integration
  FRONTEND_URL: url(),

  // Security (Critical)
  JWT_SECRET: str(),
  JWT_REFRESH_SECRET: str(),
  HASH_SALT: str(),
  ENCRYPTION_KEY: str(),

  // Optional Services
  REDIS_HOST: str({ default: '' }),
  REDIS_PORT: port({ default: 6379 }),
  EMAIL_USER: str({ default: '' }),
  EMAIL_PASSWORD: str({ default: '' }),
  SENTRY_DSN: str({ default: '' }),
  STRIPE_SECRET_KEY: str({ default: '' }),
  CLOUDINARY_CLOUD_NAME: str({ default: '' }),
  
  // Additional configurations expected by existing codebase
  CORS_ORIGIN: str({ default: '' }),
  API_KEY: str({ default: '' }),
  MONGODB_BACKUP_ENABLED: str({ choices: ['true', 'false'], default: 'false' }),
});

const config = {
  env: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',
  
  port: env.PORT,
  
  db: {
    uri: env.MONGODB_URI,
    backupEnabled: env.MONGODB_BACKUP_ENABLED === 'true',
  },
  
  frontend: {
    url: env.FRONTEND_URL,
    corsOrigins: env.CORS_ORIGIN,
  },
  
  security: {
    jwtSecret: env.JWT_SECRET,
    jwtRefreshSecret: env.JWT_REFRESH_SECRET,
    hashSalt: env.HASH_SALT,
    encryptionKey: env.ENCRYPTION_KEY,
    apiKey: env.API_KEY,
  },
  
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
  
  email: {
    user: env.EMAIL_USER,
    password: env.EMAIL_PASSWORD,
  },
  
  monitoring: {
    sentryDsn: env.SENTRY_DSN,
  },
  
  thirdParty: {
    stripeSecretKey: env.STRIPE_SECRET_KEY,
    cloudinaryCloudName: env.CLOUDINARY_CLOUD_NAME,
  }
};

module.exports = {
  env,
  config,
};
