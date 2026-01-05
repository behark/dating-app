# Code Quality & Security Tools Setup

This document describes the code quality and security tools that have been configured for this project.

## 🛠️ Installed Tools

### 1. ESLint (Enhanced)

**Auto-fixable:** ✅ Yes (`npm run lint:fix`)

Enhanced with:

- **React plugins**: React, React Hooks, React Native specific rules
- **TypeScript support**: TypeScript ESLint parser and recommended rules
- **Security rules**: `eslint-plugin-security` for detecting security vulnerabilities

**Commands:**

```bash
# Frontend
npm run lint              # Check for issues
npm run lint:fix          # Auto-fix issues

# Backend
cd backend
npm run lint              # Check for issues
npm run lint:fix          # Auto-fix issues
```

### 2. Prettier

**Auto-fixable:** ✅ Yes (`npm run format`)

Code formatter for consistent styling.

**Commands:**

```bash
npm run format            # Auto-format all files
npm run format:check      # Check formatting (CI)
```

### 3. TypeScript Type Checking

**Auto-fixable:** ❌ No (reports errors only)

Strict type checking to catch type errors before runtime.

**Commands:**

```bash
# Frontend
npm run type-check        # Check types
npm run type-check:watch  # Watch mode

# Backend
cd backend
npm run type-check        # Check types
npm run type-check:watch  # Watch mode
```

### 4. Snyk Security Scanning

**Auto-fixable:** ⚠️ Partial (creates fix PRs)

Advanced security vulnerability scanning (better than `npm audit`).

**Setup:**

1. Sign up at https://snyk.io (free for open source)
2. Get your API token
3. Add to GitHub Secrets as `SNYK_TOKEN`

**Commands:**

```bash
# Install Snyk CLI globally (first time)
npm install -g snyk

# Authenticate
snyk auth

# Test for vulnerabilities
npm run snyk:test         # Frontend
cd backend && npm run snyk:test  # Backend

# Monitor (tracks vulnerabilities over time)
npm run snyk:monitor
```

### 5. npm audit

**Auto-fixable:** ⚠️ Limited (`npm audit fix`)

Basic security scanning (built into npm).

**Commands:**

```bash
npm run audit             # Check vulnerabilities
npm run audit:fix         # Attempt to fix (limited)
```

## 📋 CI/CD Integration

All tools are integrated into the GitHub Actions CI pipeline:

1. **Frontend Tests Job:**
   - ESLint linting (with auto-fix attempt)
   - Prettier format check
   - TypeScript type checking
   - Jest tests with coverage

2. **Backend Tests Job:**
   - ESLint linting (with auto-fix attempt)
   - TypeScript type checking
   - Jest tests with coverage

3. **Security Scan Job:**
   - npm audit (frontend & backend)
   - Snyk security scanning (frontend & backend)
   - Trivy vulnerability scanner

## 🚀 Quick Start

### Install Dependencies

```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

### Run All Checks Locally

```bash
# Frontend
npm run lint:fix          # Fix linting issues
npm run format            # Format code
npm run type-check        # Check types
npm run test:coverage     # Run tests

# Backend
cd backend
npm run lint:fix
npm run type-check
npm test
```

## 🔧 Configuration Files

- `.eslintrc.json` - Frontend ESLint config
- `backend/.eslintrc.json` - Backend ESLint config
- `.prettierrc.json` - Prettier formatting rules
- `tsconfig.json` - Frontend TypeScript config
- `backend/tsconfig.json` - Backend TypeScript config
- `.snyk` - Snyk policy file
- `.github/workflows/ci.yml` - CI pipeline

## 📝 Notes

- **ESLint auto-fix**: Many issues can be automatically fixed. Always review changes.
- **Prettier**: Runs automatically on save (if configured in your editor).
- **TypeScript**: Reports errors but doesn't fix them. You need to fix manually.
- **Snyk**: Requires authentication. Free tier is sufficient for most projects.
- **CI Pipeline**: All checks run in CI but most are set to `continue-on-error: true` to not block deployments.

## 🎯 Best Practices

1. **Before committing:**

   ```bash
   npm run lint:fix && npm run format && npm run type-check
   ```

2. **Regular security checks:**

   ```bash
   npm run audit
   npm run snyk:test
   ```

3. **Editor Integration:**
   - Install ESLint extension
   - Install Prettier extension
   - Enable "format on save"

4. **Pre-commit hooks (optional):**
   Consider using `husky` + `lint-staged` to run these checks automatically before commits.
