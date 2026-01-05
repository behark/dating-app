#!/usr/bin/env node

/**
 * Security Audit Script
 * Comprehensive security checks for the dating app
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[PASS]${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}═══ ${msg} ═══${colors.reset}\n`),
};

// Audit results
const auditResults = {
  passed: [],
  warnings: [],
  failed: [],
};

// Security patterns to check
const securityPatterns = {
  // Sensitive data exposure
  sensitiveData: {
    patterns: [
      /password\s*[=:]\s*["'][^"']+["']/gi,
      /api[_-]?key\s*[=:]\s*["'][^"']+["']/gi,
      /secret\s*[=:]\s*["'][^"']+["']/gi,
      /private[_-]?key\s*[=:]\s*["'][^"']+["']/gi,
      /auth[_-]?token\s*[=:]\s*["'][^"']+["']/gi,
    ],
    description: 'Hardcoded sensitive data',
    severity: 'critical',
  },

  // SQL Injection patterns
  sqlInjection: {
    patterns: [
      /\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE|DROP)/gi,
      /`\s*(?:SELECT|INSERT|UPDATE|DELETE|DROP)\s+.*\$\{/gi,
      /query\s*\(\s*["'`].*\+.*["'`]\s*\)/gi,
    ],
    description: 'Potential SQL injection vulnerability',
    severity: 'critical',
  },

  // XSS vulnerabilities
  xss: {
    patterns: [
      /innerHTML\s*=/gi,
      /dangerouslySetInnerHTML/gi,
      /document\.write/gi,
      /eval\s*\(/gi,
      /new\s+Function\s*\(/gi,
    ],
    description: 'Potential XSS vulnerability',
    severity: 'high',
  },

  // Insecure randomness
  insecureRandom: {
    patterns: [/Math\.random\(\)/gi],
    description: 'Insecure random number generation (use crypto)',
    severity: 'medium',
  },

  // Weak cryptography
  weakCrypto: {
    patterns: [
      /createHash\s*\(\s*["']md5["']\s*\)/gi,
      /createHash\s*\(\s*["']sha1["']\s*\)/gi,
      /createCipher\s*\(\s*["']des["']/gi,
    ],
    description: 'Weak cryptographic algorithm',
    severity: 'high',
  },

  // Command injection
  commandInjection: {
    patterns: [
      /exec\s*\(\s*[`"'].*\$\{/gi,
      /spawn\s*\(\s*[`"'].*\$\{/gi,
      /execSync\s*\(\s*[`"'].*\$\{/gi,
    ],
    description: 'Potential command injection',
    severity: 'critical',
  },

  // Path traversal
  pathTraversal: {
    patterns: [/\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\//gi],
    description: 'Potential path traversal vulnerability',
    severity: 'high',
  },

  // Insecure HTTP
  insecureHttp: {
    patterns: [/http:\/\/(?!localhost|127\.0\.0\.1)/gi],
    description: 'Insecure HTTP connection (use HTTPS)',
    severity: 'medium',
  },

  // Debug/console statements
  debugStatements: {
    patterns: [
      /console\.log\s*\([^)]*password[^)]*\)/gi,
      /console\.log\s*\([^)]*token[^)]*\)/gi,
      /console\.log\s*\([^)]*secret[^)]*\)/gi,
    ],
    description: 'Debug statement logging sensitive data',
    severity: 'medium',
  },
};

// Files to scan
const filesToScan = [
  'src/**/*.js',
  'src/**/*.jsx',
  'src/**/*.ts',
  'src/**/*.tsx',
  'backend/**/*.js',
];

// Files/directories to exclude
const excludePatterns = [
  'node_modules',
  '__tests__',
  '*.test.js',
  '*.spec.js',
  'coverage',
  'dist',
  'build',
];

/**
 * Scan file for security issues
 */
function scanFile(filePath) {
  const issues = [];

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Check each security pattern
    Object.entries(securityPatterns).forEach(([name, config]) => {
      config.patterns.forEach((pattern) => {
        lines.forEach((line, index) => {
          if (pattern.test(line)) {
            issues.push({
              file: filePath,
              line: index + 1,
              content: line.trim().substring(0, 100),
              type: name,
              description: config.description,
              severity: config.severity,
            });
          }
        });
      });
    });
  } catch (error) {
    log.error(`Error scanning ${filePath}: ${error.message}`);
  }

  return issues;
}

/**
 * Get all files matching patterns
 */
function getFiles(patterns, excludes) {
  const files = [];
  const rootDir = process.cwd();

  function walkDir(dir) {
    try {
      const items = fs.readdirSync(dir);

      items.forEach((item) => {
        const fullPath = path.join(dir, item);
        const relativePath = path.relative(rootDir, fullPath);

        // Check if should exclude
        if (excludes.some((ex) => relativePath.includes(ex))) {
          return;
        }

        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (stat.isFile() && /\.(js|jsx|ts|tsx)$/.test(item)) {
          files.push(fullPath);
        }
      });
    } catch (error) {
      // Ignore permission errors
    }
  }

  walkDir(rootDir);
  return files;
}

/**
 * Run npm audit
 */
function runNpmAudit() {
  log.section('NPM Dependency Audit');

  try {
    const result = execSync('npm audit --json 2>/dev/null', { encoding: 'utf8' });
    const audit = JSON.parse(result);

    if (audit.metadata) {
      const { vulnerabilities } = audit.metadata;

      if (vulnerabilities.critical > 0 || vulnerabilities.high > 0) {
        log.error(`Critical: ${vulnerabilities.critical}, High: ${vulnerabilities.high}`);
        auditResults.failed.push('npm audit found critical/high vulnerabilities');
      } else if (vulnerabilities.moderate > 0) {
        log.warn(`Moderate vulnerabilities: ${vulnerabilities.moderate}`);
        auditResults.warnings.push('npm audit found moderate vulnerabilities');
      } else {
        log.success('No known vulnerabilities in dependencies');
        auditResults.passed.push('npm audit passed');
      }
    }
  } catch (error) {
    // npm audit returns non-zero on vulnerabilities
    if (error.stdout) {
      try {
        const audit = JSON.parse(error.stdout);
        log.warn(`Found ${audit.metadata?.vulnerabilities?.total || 'some'} vulnerabilities`);
        auditResults.warnings.push('npm audit found vulnerabilities');
      } catch {
        log.warn('Could not parse npm audit output');
      }
    } else {
      log.info('npm audit not available or failed');
    }
  }
}

/**
 * Check environment variables
 */
function checkEnvSecurity() {
  log.section('Environment Configuration');

  const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
  let foundEnvFile = false;

  envFiles.forEach((envFile) => {
    const envPath = path.join(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      foundEnvFile = true;

      // Check if in .gitignore
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      if (fs.existsSync(gitignorePath)) {
        const gitignore = fs.readFileSync(gitignorePath, 'utf8');
        if (!gitignore.includes(envFile) && envFile !== '.env.example') {
          log.error(`${envFile} may not be in .gitignore`);
          auditResults.failed.push(`${envFile} not in .gitignore`);
        } else {
          log.success(`${envFile} is properly ignored`);
          auditResults.passed.push(`${envFile} is in .gitignore`);
        }
      }
    }
  });

  if (!foundEnvFile) {
    log.info('No .env files found');
  }
}

/**
 * Check for security headers configuration
 */
function checkSecurityHeaders() {
  log.section('Security Headers Configuration');

  const headersToCheck = [
    'helmet',
    'cors',
    'X-Frame-Options',
    'Content-Security-Policy',
    'X-Content-Type-Options',
    'X-XSS-Protection',
  ];

  // Check backend for helmet usage
  const serverPath = path.join(process.cwd(), 'backend', 'server.js');
  if (fs.existsSync(serverPath)) {
    const serverContent = fs.readFileSync(serverPath, 'utf8');

    if (serverContent.includes('helmet')) {
      log.success('Helmet security middleware is configured');
      auditResults.passed.push('Helmet middleware enabled');
    } else {
      log.warn('Helmet security middleware not found');
      auditResults.warnings.push('Consider adding Helmet middleware');
    }

    if (serverContent.includes('cors')) {
      log.success('CORS is configured');
      auditResults.passed.push('CORS configured');
    }
  }
}

/**
 * Check authentication security
 */
function checkAuthSecurity() {
  log.section('Authentication Security');

  const authPatterns = {
    jwtVerify: /verifyIdToken|verify\s*\(/gi,
    passwordHash: /bcrypt|argon2|scrypt/gi,
    rateLimit: /rateLimiter|rate-limit|express-rate-limit/gi,
  };

  const backendFiles = getFiles(['backend/**/*.js'], excludePatterns);

  let hasJwtVerify = false;
  let hasPasswordHash = false;
  let hasRateLimit = false;

  backendFiles.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    if (authPatterns.jwtVerify.test(content)) hasJwtVerify = true;
    if (authPatterns.passwordHash.test(content)) hasPasswordHash = true;
    if (authPatterns.rateLimit.test(content)) hasRateLimit = true;
  });

  if (hasJwtVerify) {
    log.success('JWT/Token verification implemented');
    auditResults.passed.push('JWT verification found');
  } else {
    log.warn('JWT/Token verification not detected');
    auditResults.warnings.push('Verify JWT implementation');
  }

  if (hasPasswordHash) {
    log.success('Secure password hashing detected');
    auditResults.passed.push('Password hashing implemented');
  } else {
    log.warn('Secure password hashing not detected');
    auditResults.warnings.push('Verify password hashing');
  }

  if (hasRateLimit) {
    log.success('Rate limiting implemented');
    auditResults.passed.push('Rate limiting found');
  } else {
    log.warn('Rate limiting not detected');
    auditResults.warnings.push('Consider adding rate limiting');
  }
}

/**
 * Main audit function
 */
async function runSecurityAudit() {
  console.log(`
╔════════════════════════════════════════════════════════╗
║           🔐 SECURITY AUDIT REPORT                      ║
║           Dating App Security Scanner                   ║
╚════════════════════════════════════════════════════════╝
`);

  log.info(`Audit started at ${new Date().toISOString()}`);
  log.info(`Scanning directory: ${process.cwd()}`);

  // Run npm audit
  runNpmAudit();

  // Check environment
  checkEnvSecurity();

  // Check security headers
  checkSecurityHeaders();

  // Check authentication
  checkAuthSecurity();

  // Scan source files
  log.section('Source Code Security Scan');

  const files = getFiles(filesToScan, excludePatterns);
  log.info(`Scanning ${files.length} files...`);

  const allIssues = [];

  files.forEach((file) => {
    const issues = scanFile(file);
    allIssues.push(...issues);
  });

  // Group issues by severity
  const critical = allIssues.filter((i) => i.severity === 'critical');
  const high = allIssues.filter((i) => i.severity === 'high');
  const medium = allIssues.filter((i) => i.severity === 'medium');

  if (critical.length > 0) {
    log.error(`Found ${critical.length} critical issues:`);
    critical.forEach((issue) => {
      console.log(`  - ${issue.file}:${issue.line} - ${issue.description}`);
      console.log(`    ${issue.content}`);
    });
    auditResults.failed.push(`${critical.length} critical security issues`);
  }

  if (high.length > 0) {
    log.warn(`Found ${high.length} high severity issues:`);
    high.forEach((issue) => {
      console.log(`  - ${issue.file}:${issue.line} - ${issue.description}`);
    });
    auditResults.failed.push(`${high.length} high severity issues`);
  }

  if (medium.length > 0) {
    log.info(`Found ${medium.length} medium severity issues`);
    auditResults.warnings.push(`${medium.length} medium severity issues`);
  }

  if (allIssues.length === 0) {
    log.success('No security issues found in source code');
    auditResults.passed.push('Source code scan passed');
  }

  // Print summary
  console.log(`
╔════════════════════════════════════════════════════════╗
║                   AUDIT SUMMARY                         ║
╚════════════════════════════════════════════════════════╝

${colors.green}✓ Passed: ${auditResults.passed.length}${colors.reset}
${colors.yellow}⚠ Warnings: ${auditResults.warnings.length}${colors.reset}
${colors.red}✗ Failed: ${auditResults.failed.length}${colors.reset}

`);

  if (auditResults.failed.length > 0) {
    log.error('AUDIT FAILED - Address critical issues before deployment');
    process.exit(1);
  } else if (auditResults.warnings.length > 0) {
    log.warn('AUDIT PASSED WITH WARNINGS');
    process.exit(0);
  } else {
    log.success('AUDIT PASSED');
    process.exit(0);
  }
}

// Run audit
runSecurityAudit().catch(console.error);
