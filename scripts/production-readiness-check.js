/**
 * Production Readiness Checklist Script
 * Run this before deploying to production
 */

const fs = require('fs');
const path = require('path');

const CHECK = '✅';
const FAIL = '❌';
const WARN = '⚠️';

class ProductionChecker {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
    };
  }

  log(status, message) {
    console.log(`${status} ${message}`);
  }

  pass(message) {
    this.results.passed.push(message);
    this.log(CHECK, message);
  }

  fail(message) {
    this.results.failed.push(message);
    this.log(FAIL, message);
  }

  warn(message) {
    this.results.warnings.push(message);
    this.log(WARN, message);
  }

  // Environment Variable Checks
  checkEnvVariables() {
    console.log('\n📋 Checking Environment Variables...\n');

    const required = ['NODE_ENV', 'MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];

    const recommended = ['REDIS_URL', 'SENTRY_DSN', 'CORS_ORIGINS', 'RATE_LIMIT_MAX'];

    required.forEach((key) => {
      if (process.env[key]) {
        this.pass(`${key} is set`);
      } else {
        this.fail(`${key} is MISSING (required)`);
      }
    });

    recommended.forEach((key) => {
      if (process.env[key]) {
        this.pass(`${key} is set`);
      } else {
        this.warn(`${key} is not set (recommended)`);
      }
    });

    // Security checks
    if (process.env.JWT_SECRET?.length < 32) {
      this.fail('JWT_SECRET is too short (min 32 chars)');
    }

    if (process.env.JWT_REFRESH_SECRET?.length < 32) {
      this.fail('JWT_REFRESH_SECRET is too short (min 32 chars)');
    }

    if (process.env.NODE_ENV !== 'production') {
      this.warn(`NODE_ENV is "${process.env.NODE_ENV}" (should be "production")`);
    }
  }

  // Security Configuration Checks
  checkSecurityConfig() {
    console.log('\n🔒 Checking Security Configuration...\n');

    // Check for common security files
    const securityFiles = [
      { path: 'backend/middleware/rateLimiter.js', name: 'Rate Limiter' },
      { path: 'backend/middleware/csrf.js', name: 'CSRF Protection' },
      { path: 'backend/middleware/auth.js', name: 'Authentication Middleware' },
    ];

    securityFiles.forEach(({ path: filePath, name }) => {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        this.pass(`${name} exists`);
      } else {
        this.fail(`${name} not found at ${filePath}`);
      }
    });

    // Check helmet config
    try {
      const serverPath = path.join(process.cwd(), 'backend/server.js');
      const serverContent = fs.readFileSync(serverPath, 'utf8');

      if (serverContent.includes('helmet')) {
        this.pass('Helmet security middleware configured');
      } else {
        this.fail('Helmet security middleware not found');
      }

      if (serverContent.includes('compression')) {
        this.pass('Compression middleware configured');
      } else {
        this.warn('Compression middleware not found');
      }

      if (serverContent.includes('cors')) {
        this.pass('CORS middleware configured');
      } else {
        this.warn('CORS middleware not found');
      }
    } catch (err) {
      this.warn(`Could not analyze server.js: ${err.message}`);
    }
  }

  // Database Configuration Checks
  checkDatabaseConfig() {
    console.log('\n💾 Checking Database Configuration...\n');

    // Check MongoDB connection string security
    const mongoUri = process.env.MONGODB_URI || '';

    if (mongoUri.includes('mongodb+srv://')) {
      this.pass('Using MongoDB Atlas (SRV connection)');
    } else if (mongoUri.includes('mongodb://')) {
      this.warn('Using standard MongoDB connection (consider Atlas for production)');
    }

    if (mongoUri.includes('retryWrites=true')) {
      this.pass('Retry writes enabled');
    } else {
      this.warn('Retry writes not explicitly enabled');
    }

    // Check for backup configuration
    if (process.env.MONGODB_BACKUP_ENABLED === 'true') {
      this.pass('Database backups enabled');
    } else {
      this.warn('Database backups not configured');
    }
  }

  // API & Route Checks
  checkAPIConfiguration() {
    console.log('\n🌐 Checking API Configuration...\n');

    const routeFiles = [
      'auth.js',
      'profile.js',
      'swipe.js',
      'chat.js',
      'safety.js',
      'discovery.js',
    ];

    const routesPath = path.join(process.cwd(), 'backend/routes');

    routeFiles.forEach((file) => {
      const fullPath = path.join(routesPath, file);
      if (fs.existsSync(fullPath)) {
        this.pass(`Route ${file} exists`);
      } else {
        this.warn(`Route ${file} not found`);
      }
    });
  }

  // Error Handling Checks
  checkErrorHandling() {
    console.log('\n🚨 Checking Error Handling...\n');

    // Check for Sentry
    if (process.env.SENTRY_DSN) {
      this.pass('Sentry error tracking configured');
    } else {
      this.warn('Sentry DSN not set - error tracking disabled');
    }

    // Check for error middleware
    const errorMiddlewarePath = path.join(process.cwd(), 'backend/middleware/errorHandler.js');
    if (fs.existsSync(errorMiddlewarePath)) {
      this.pass('Error handler middleware exists');
    } else {
      this.warn('Error handler middleware not found');
    }
  }

  // Performance Checks
  checkPerformanceConfig() {
    console.log('\n⚡ Checking Performance Configuration...\n');

    // Check for Redis caching
    if (process.env.REDIS_URL) {
      this.pass('Redis caching configured');
    } else {
      this.warn('Redis not configured - caching disabled');
    }

    // Check for CDN/static file handling
    const cdnServicePath = path.join(process.cwd(), 'backend/services/cdnService.js');
    if (fs.existsSync(cdnServicePath)) {
      this.pass('CDN service exists');
    } else {
      this.warn('CDN service not found');
    }
  }

  // Health Check Endpoints
  checkHealthEndpoints() {
    console.log('\n🏥 Checking Health Check Endpoints...\n');

    try {
      const serverPath = path.join(process.cwd(), 'backend/server.js');
      const serverContent = fs.readFileSync(serverPath, 'utf8');

      if (serverContent.includes('/health') || serverContent.includes('/api/health')) {
        this.pass('Health check endpoint configured');
      } else {
        this.warn('Health check endpoint not found');
      }

      if (serverContent.includes('/ready') || serverContent.includes('/readiness')) {
        this.pass('Readiness probe endpoint configured');
      } else {
        this.warn('Readiness probe endpoint not found');
      }

      if (serverContent.includes('/live') || serverContent.includes('/liveness')) {
        this.pass('Liveness probe endpoint configured');
      } else {
        this.warn('Liveness probe endpoint not found');
      }
    } catch (err) {
      this.warn(`Could not check health endpoints: ${err.message}`);
    }
  }

  // Test Coverage
  checkTestCoverage() {
    console.log('\n🧪 Checking Test Configuration...\n');

    const testDirs = ['backend/__tests__', 'src/__tests__'];

    testDirs.forEach((dir) => {
      const fullPath = path.join(process.cwd(), dir);
      if (fs.existsSync(fullPath)) {
        const files = fs.readdirSync(fullPath, { recursive: true });
        const testFiles = files.filter(
          (f) => f.toString().endsWith('.test.js') || f.toString().endsWith('.spec.js')
        );
        this.pass(`${testFiles.length} test files found in ${dir}`);
      } else {
        this.warn(`Test directory ${dir} not found`);
      }
    });
  }

  // Docker Configuration
  checkDockerConfig() {
    console.log('\n🐳 Checking Docker Configuration...\n');

    const dockerFiles = ['Dockerfile', 'docker-compose.yml', 'docker-compose.production.yml'];

    dockerFiles.forEach((file) => {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        this.pass(`${file} exists`);
      } else {
        this.warn(`${file} not found`);
      }
    });
  }

  // CI/CD Configuration
  checkCICD() {
    console.log('\n🔄 Checking CI/CD Configuration...\n');

    const ciFiles = ['.github/workflows/ci.yml', '.github/workflows/api-tests.yml'];

    ciFiles.forEach((file) => {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        this.pass(`${file} exists`);
      } else {
        this.warn(`${file} not found`);
      }
    });
  }

  // App Store Requirements
  checkAppStoreRequirements() {
    console.log('\n📱 Checking App Store Requirements...\n');

    // Check for privacy policy
    const legalFiles = [
      { pattern: '**/privacy*.md', name: 'Privacy Policy' },
      { pattern: '**/terms*.md', name: 'Terms of Service' },
    ];

    if (process.env.PRIVACY_POLICY_URL) {
      this.pass('Privacy Policy URL configured');
    } else {
      this.warn('Privacy Policy URL not set');
    }

    if (process.env.TERMS_OF_SERVICE_URL) {
      this.pass('Terms of Service URL configured');
    } else {
      this.warn('Terms of Service URL not set');
    }

    // Check app.config.js for required fields
    try {
      const appConfigPath = path.join(process.cwd(), 'app.config.js');
      if (fs.existsSync(appConfigPath)) {
        this.pass('app.config.js exists');
      } else {
        this.fail('app.config.js not found');
      }
    } catch (err) {
      this.warn(`Could not check app.config.js: ${err.message}`);
    }
  }

  // Generate Summary
  generateSummary() {
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 PRODUCTION READINESS SUMMARY');
    console.log(`${'='.repeat(60)}\n`);

    console.log(`${CHECK} Passed: ${this.results.passed.length}`);
    console.log(`${FAIL} Failed: ${this.results.failed.length}`);
    console.log(`${WARN} Warnings: ${this.results.warnings.length}`);

    const score = Math.round(
      (this.results.passed.length / (this.results.passed.length + this.results.failed.length)) * 100
    );

    console.log(`\n📈 Readiness Score: ${score}%`);

    if (this.results.failed.length > 0) {
      console.log('\n🚫 CRITICAL ISSUES TO FIX:');
      this.results.failed.forEach((msg) => console.log(`   ${FAIL} ${msg}`));
    }

    if (this.results.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS TO REVIEW:');
      this.results.warnings.forEach((msg) => console.log(`   ${WARN} ${msg}`));
    }

    console.log(`\n${'='.repeat(60)}`);

    if (this.results.failed.length === 0) {
      console.log('✅ READY FOR PRODUCTION DEPLOYMENT');
    } else {
      console.log('❌ NOT READY - Fix critical issues before deploying');
    }
    console.log(`${'='.repeat(60)}\n`);

    return {
      passed: this.results.passed.length,
      failed: this.results.failed.length,
      warnings: this.results.warnings.length,
      score,
      isReady: this.results.failed.length === 0,
    };
  }

  // Run all checks
  run() {
    console.log('\n🔍 PRODUCTION READINESS CHECK');
    console.log(`=${'='.repeat(59)}\n`);

    this.checkEnvVariables();
    this.checkSecurityConfig();
    this.checkDatabaseConfig();
    this.checkAPIConfiguration();
    this.checkErrorHandling();
    this.checkPerformanceConfig();
    this.checkHealthEndpoints();
    this.checkTestCoverage();
    this.checkDockerConfig();
    this.checkCICD();
    this.checkAppStoreRequirements();

    return this.generateSummary();
  }
}

// Run if executed directly
if (require.main === module) {
  require('dotenv').config();
  const checker = new ProductionChecker();
  const result = checker.run();
  process.exit(result.isReady ? 0 : 1);
}

module.exports = ProductionChecker;
