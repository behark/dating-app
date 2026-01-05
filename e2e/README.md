# E2E Testing Configuration

This directory contains end-to-end tests using Maestro for mobile and Playwright for web.

## Setup

### Maestro (Mobile E2E)

```bash
# Install Maestro
curl -Ls "https://get.maestro.mobile.dev" | bash

# Verify installation
maestro --version
```

### Playwright (Web E2E)

```bash
# Install Playwright
npm install -D @playwright/test
npx playwright install
```

## Running Tests

### Mobile (Maestro)

```bash
# Run all mobile E2E tests
maestro test e2e/flows/

# Run specific flow
maestro test e2e/flows/auth.yaml

# Run with recording
maestro record e2e/flows/auth.yaml
```

### Web (Playwright)

```bash
# Run all web E2E tests
npx playwright test

# Run with UI
npx playwright test --ui

# Generate report
npx playwright show-report
```

## Test Structure

- `flows/` - Maestro YAML flow definitions
- `web/` - Playwright test files
- `fixtures/` - Test data and mock users
