#!/usr/bin/env node

/**
 * Cloud Environment Audit
 *
 * Validates backend/frontend env shape and checks Vercel/EAS drift.
 *
 * Usage examples:
 *   node scripts/cloud-env-audit.js
 *   node scripts/cloud-env-audit.js --backend /tmp/render.env --vercel /tmp/vercel.production.env --eas /tmp/eas.production.env
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const CHECK = '✅';
const FAIL = '❌';
const WARN = '⚠️';
const INFO = 'ℹ️';

const args = process.argv.slice(2);
const argValue = (flag, fallback) => {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx === args.length - 1) {
    return fallback;
  }
  return args[idx + 1];
};

const paths = {
  backend: argValue('--backend', path.join(process.cwd(), 'backend/.env.production')),
  frontend: argValue('--frontend', path.join(process.cwd(), '.env')),
  vercel: argValue('--vercel', '/tmp/vercel.production.env'),
  eas: argValue('--eas', '/tmp/eas.production.env'),
};

const results = {
  passed: 0,
  warnings: [],
  errors: [],
};

const pass = (msg) => {
  results.passed += 1;
  console.log(`${CHECK} ${msg}`);
};

const warn = (msg) => {
  results.warnings.push(msg);
  console.log(`${WARN} ${msg}`);
};

const fail = (msg) => {
  results.errors.push(msg);
  console.log(`${FAIL} ${msg}`);
};

const loadEnvFile = (filePath, label, optional = false) => {
  if (!fs.existsSync(filePath)) {
    const message = `${label} env file not found at ${filePath}`;
    if (optional) {
      warn(message);
      return {};
    }
    fail(message);
    return {};
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    pass(`${label} env file loaded (${filePath})`);
    return dotenv.parse(content);
  } catch (error) {
    fail(`${label} env file could not be parsed: ${error.message}`);
    return {};
  }
};

const getVar = (envObj, key, alternatives = []) => {
  if (envObj[key]) {
    return { key, value: envObj[key] };
  }
  for (const alt of alternatives) {
    if (envObj[alt]) {
      return { key: alt, value: envObj[alt] };
    }
  }
  return null;
};

const validateUrlLike = (name, value, label) => {
  if (!value) return;
  if (value !== value.trim()) {
    fail(`${label}: ${name} has leading/trailing whitespace`);
  }
  if (value.includes('\\n') || value.includes('\n')) {
    fail(`${label}: ${name} contains newline characters; remove trailing \\n/line breaks`);
  }
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    fail(`${label}: ${name} is wrapped in quotes; store raw value without outer quotes`);
  }
};

const validateBackend = (envObj) => {
  console.log('\nBackend checks');
  console.log('------------');

  const required = [
    { key: 'NODE_ENV', expected: 'production' },
    { key: 'JWT_SECRET', min: 32 },
    { key: 'JWT_REFRESH_SECRET', min: 32, mustDifferFrom: 'JWT_SECRET' },
    { key: 'HASH_SALT', min: 16 },
    { key: 'MONGODB_URI', alternatives: ['MONGODB_URL'], pattern: /^mongodb(\+srv)?:\/\// },
    { key: 'FRONTEND_URL', pattern: /^https:\/\// },
    { key: 'CORS_ORIGIN', alternatives: ['CORS_ORIGINS'] },
  ];

  for (const def of required) {
    const found = getVar(envObj, def.key, def.alternatives || []);
    if (!found) {
      fail(`backend: missing ${def.key}${def.alternatives ? ` (or ${def.alternatives.join(', ')})` : ''}`);
      continue;
    }
    const { key, value } = found;
    if (def.expected && value !== def.expected) {
      fail(`backend: ${key} must be "${def.expected}"`);
      continue;
    }
    if (def.min && value.length < def.min) {
      fail(`backend: ${key} too short (${value.length} < ${def.min})`);
      continue;
    }
    if (def.pattern && !def.pattern.test(value)) {
      fail(`backend: ${key} has invalid format`);
      continue;
    }
    pass(`backend: ${key} looks valid`);
  }

  // URL/DSN formatting checks
  ['MONGODB_URI', 'MONGODB_URL', 'FRONTEND_URL', 'CORS_ORIGIN', 'CORS_ORIGINS', 'SENTRY_DSN', 'REDIS_URL'].forEach((k) =>
    validateUrlLike(k, envObj[k], 'backend')
  );

  // Special private key formatting
  if (envObj.FIREBASE_PRIVATE_KEY) {
    const key = envObj.FIREBASE_PRIVATE_KEY;
    if (key.includes('"-----BEGIN') || key.includes("'-----BEGIN")) {
      fail('backend: FIREBASE_PRIVATE_KEY appears wrapped with extra quotes');
    } else if (!key.includes('\\n')) {
      warn('backend: FIREBASE_PRIVATE_KEY does not contain escaped newlines (\\n)');
    } else {
      pass('backend: FIREBASE_PRIVATE_KEY format looks valid');
    }
  } else {
    warn('backend: FIREBASE_PRIVATE_KEY not set (required only if using Firebase admin features)');
  }

  if (!envObj.REDIS_URL) {
    warn('backend: REDIS_URL not set (recommended)');
  } else {
    pass('backend: REDIS_URL set');
  }
};

const validateFrontend = (envObj, label) => {
  console.log(`\n${label} checks`);
  console.log('------------');

  const required = [
    'EXPO_PUBLIC_API_URL',
    'EXPO_PUBLIC_BACKEND_URL',
    'EXPO_PUBLIC_ENV',
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID',
    'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
    'EXPO_PUBLIC_PRIVACY_POLICY_URL',
    'EXPO_PUBLIC_TERMS_OF_SERVICE_URL',
  ];

  required.forEach((key) => {
    if (!envObj[key]) {
      fail(`${label}: missing ${key}`);
    } else {
      pass(`${label}: ${key} set`);
    }
  });

  ['EXPO_PUBLIC_API_URL', 'EXPO_PUBLIC_BACKEND_URL', 'EXPO_PUBLIC_PRIVACY_POLICY_URL', 'EXPO_PUBLIC_TERMS_OF_SERVICE_URL', 'EXPO_PUBLIC_SENTRY_DSN'].forEach(
    (k) => validateUrlLike(k, envObj[k], label)
  );

  // Prevent secret leaks into EXPO_PUBLIC*
  Object.keys(envObj)
    .filter((k) => k.startsWith('EXPO_PUBLIC_'))
    .forEach((k) => {
      const upper = k.toUpperCase();
      if (
        upper.includes('JWT') ||
        upper.includes('SECRET') ||
        upper.includes('PASSWORD') ||
        upper.includes('PRIVATE_KEY') ||
        upper.includes('STRIPE_SECRET')
      ) {
        fail(`${label}: secret-like key exposed in public namespace (${k})`);
      }
    });
};

const compareCloudPublicVars = (vercelEnv, easEnv) => {
  const syncKeys = [
    'EXPO_PUBLIC_API_URL',
    'EXPO_PUBLIC_BACKEND_URL',
    'EXPO_PUBLIC_ENV',
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID',
    'EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID',
    'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
    'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID',
    'EXPO_PUBLIC_PRIVACY_POLICY_URL',
    'EXPO_PUBLIC_TERMS_OF_SERVICE_URL',
    'EXPO_PUBLIC_SUPPORT_EMAIL',
    'EXPO_PUBLIC_SENTRY_DSN',
  ];

  console.log('\nCloud drift checks (Vercel vs EAS)');
  console.log('----------------------------------');

  let driftCount = 0;
  for (const key of syncKeys) {
    const v = vercelEnv[key];
    const e = easEnv[key];
    if (!v || !e) {
      warn(`cloud: ${key} missing in ${!v ? 'Vercel' : ''}${!v && !e ? ' and ' : ''}${!e ? 'EAS' : ''}`);
      driftCount += 1;
      continue;
    }
    if (v !== e) {
      warn(`cloud: ${key} differs between Vercel and EAS`);
      driftCount += 1;
    } else {
      pass(`cloud: ${key} is in sync`);
    }
  }

  if (driftCount === 0) {
    pass('cloud: no public env drift detected between Vercel and EAS');
  }
};

const backendEnv = loadEnvFile(paths.backend, 'backend');
const frontendEnv = loadEnvFile(paths.frontend, 'frontend');
const vercelEnv = loadEnvFile(paths.vercel, 'vercel', true);
const easEnv = loadEnvFile(paths.eas, 'eas', true);

validateBackend(backendEnv);
validateFrontend(frontendEnv, 'frontend');

if (Object.keys(vercelEnv).length && Object.keys(easEnv).length) {
  validateFrontend(vercelEnv, 'vercel');
  validateFrontend(easEnv, 'eas');
  compareCloudPublicVars(vercelEnv, easEnv);
} else {
  warn('cloud: skipped Vercel/EAS drift check (one or both env files unavailable)');
}

console.log('\nSummary');
console.log('-------');
console.log(`${CHECK} Passed checks: ${results.passed}`);
console.log(`${WARN} Warnings: ${results.warnings.length}`);
console.log(`${FAIL} Errors: ${results.errors.length}`);

if (results.errors.length > 0) {
  process.exit(1);
}

process.exit(0);
