# GitHub Actions CI/CD Setup Guide

**Last Updated:** March 4, 2026

---

## 📋 Overview

This project includes 4 GitHub Actions workflows:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **frontend.yml** | Push/PR on `src/` | Frontend tests, lint, build |
| **backend.yml** | Push/PR on `backend/` | Backend tests, lint, API check |
| **e2e.yml** | Push/PR on `src/` or `e2e/` | End-to-end Playwright tests |
| **deploy.yml** | Push to `main` | Deploy to Vercel & Render |

---

## 🚀 Quick Start

### 1. Enable GitHub Actions
1. Go to your repository settings
2. Navigate to **Actions** → **General**
3. Ensure "Allow all actions and reusable workflows" is selected

### 2. Set Required Secrets
Go to **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

**Required Secrets:**

#### For Deployment (deploy.yml)
```
VERCEL_TOKEN          # From https://vercel.com/account/tokens
VERCEL_ORG_ID         # Organization ID
VERCEL_PROJECT_ID     # Project ID
RENDER_SERVICE_ID     # From Render dashboard
RENDER_DEPLOY_KEY     # From Render API settings
```

#### For Security Scanning (optional)
```
SNYK_TOKEN           # From https://app.snyk.io/account/settings
```

#### For Notifications (optional)
```
SLACK_WEBHOOK        # From your Slack workspace
```

### 3. Create Secrets in GitHub

```bash
# Using GitHub CLI
gh secret set VERCEL_TOKEN --body "your-token"
gh secret set VERCEL_ORG_ID --body "your-org-id"
gh secret set VERCEL_PROJECT_ID --body "your-project-id"
# ... repeat for all secrets
```

---

## 📁 Workflow Files

Located in: `.github/workflows/`

### frontend.yml
**Runs On:** Changes to `src/`, `tests/`, or `package.json`

**Jobs:**
1. **lint** - ESLint, Prettier, TypeScript checking
2. **test** - Jest tests with coverage
3. **security** - npm audit & Snyk scan
4. **build** - Build web-build directory

**Status Badge:**
```markdown
[![Frontend CI](https://github.com/your-username/dating-app/actions/workflows/frontend.yml/badge.svg)](https://github.com/your-username/dating-app/actions)
```

### backend.yml
**Runs On:** Changes to `backend/` directory

**Jobs:**
1. **lint** - ESLint & TypeScript
2. **test** - Jest tests with MongoDB service
3. **api-check** - Health endpoint verification
4. **security** - Vulnerability scanning

**Service:** MongoDB (auto-started for tests)

### e2e.yml
**Runs On:** Changes to `src/` or `e2e/` directories

**Jobs:**
1. **e2e-web** - Playwright web tests
2. **e2e-mobile** - Mobile platform tests

**Prerequisites:** Starts backend + frontend for testing

### deploy.yml
**Runs On:** Push to `main` branch (after all tests pass)

**Jobs:**
1. **test** - Pre-deployment validation
2. **deploy-frontend** - Push to Vercel
3. **deploy-backend** - Trigger Render build
4. **notify** - Slack notification

---

## 🔑 Getting Required Secrets

### Vercel Tokens
```bash
# 1. Go to https://vercel.com/account/tokens
# 2. Create new token (Scope: Full Account)
# 3. Copy token value → Set as VERCEL_TOKEN secret

# Get IDs from vercel.json or dashboard
VERCEL_ORG_ID=<from dashboard>
VERCEL_PROJECT_ID=<from vercel.json or dashboard>
```

### Render Service ID
```bash
# 1. Go to https://dashboard.render.com
# 2. Select your backend service
# 3. Find "Service ID" in settings
# 4. Copy value → Set as RENDER_SERVICE_ID secret

# Get deploy key from API settings
# Settings → API → Create API Key
```

### Snyk Token (Optional)
```bash
# 1. Go to https://app.snyk.io/account/settings
# 2. Authentication token → Copy
# 3. Set as SNYK_TOKEN secret
```

### Slack Webhook (Optional)
```bash
# 1. Create Slack app: https://api.slack.com/apps
# 2. Enable Incoming Webhooks
# 3. Create new webhook → Copy URL
# 4. Set as SLACK_WEBHOOK secret
```

---

## 📊 Viewing Workflow Results

### Via GitHub UI
1. Go to repository → **Actions**
2. Select workflow from list
3. View run results, logs, and artifacts

### View Logs
```bash
# Using GitHub CLI
gh run list --workflow=frontend.yml
gh run view <run-id>
gh run view <run-id> --log
```

### Download Artifacts
```bash
# List artifacts
gh run list --workflow=e2e.yml

# Download Playwright report
gh run download <run-id> -n playwright-report
```

---

## 🛠️ Customizing Workflows

### Run Workflows Manually

Edit workflow file and change trigger:
```yaml
on:
  workflow_dispatch:  # Enables manual trigger button
  push:
    branches: [main]
```

Then in GitHub Actions UI → "Run workflow" button

### Skip Workflow for Certain Commits

```bash
git commit -m "chore: update docs [skip ci]"
# or
git commit -m "docs: update README [no ci]"
```

### Schedule Workflow (Cron)

```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
```

### Run Only on PR

```yaml
on:
  pull_request:
    branches: [main, develop]
```

---

## ⚠️ Troubleshooting

### "Dependencies not found"
```yaml
# Ensure node_modules installed before test
- run: npm ci --legacy-peer-deps
```

### "MongoDB connection failed"
```yaml
# Ensure MongoDB service is running
services:
  mongodb:
    image: mongo:latest
    ports:
      - 27017:27017
```

### "Playwright browsers not installed"
```yaml
- run: npx playwright install --with-deps
```

### "Permission denied" on deploy
- Check secret values are correct
- Verify token has appropriate permissions
- Recreate token if expired

### "Build fails but tests pass"
```bash
# Run locally to debug
npm run build  # or npm run vercel-build
```

---

## 📈 Monitoring & Alerts

### GitHub Status Checks
- Enable branch protection: Settings → Branches → Add rule
- Require workflows to pass before merging

### Slack Notifications
The deploy.yml sends notifications to Slack on success/failure

### Email Notifications
GitHub sends default email for failed workflows

### Custom Alerts
```yaml
- name: Alert on failure
  if: failure()
  run: echo "::error::Workflow failed!"
```

---

## 🔄 Common Workflow Patterns

### Run tests for specific language
```yaml
# Only run if Python files changed
paths:
  - 'scripts/**'
  - 'backend/**'
```

### Conditional job execution
```yaml
jobs:
  test:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps: # ...
```

### Matrix testing (multiple Node versions)
```yaml
strategy:
  matrix:
    node-version: [16, 18, 20]
steps:
  - uses: actions/setup-node@v3
    with:
      node-version: ${{ matrix.node-version }}
```

### Artifact retention
```yaml
- uses: actions/upload-artifact@v3
  with:
    name: reports
    path: coverage/
    retention-days: 30  # Keep for 30 days
```

---

## 📚 Useful Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Workflow Commands](https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions)
- [Events Triggering Workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows)

---

## ✅ Setup Checklist

- [ ] Workflows created in `.github/workflows/`
- [ ] All secrets configured in GitHub Settings
- [ ] Test workflow runs successfully on PR
- [ ] Backend workflow passes with MongoDB
- [ ] E2E tests run successfully
- [ ] Deployment workflow configured
- [ ] Branch protection rules enabled
- [ ] Slack notifications working (if configured)
- [ ] Team notified of CI/CD setup
- [ ] Documentation updated

---

## 🚀 Next Steps

1. **Verify all workflows run:** Push a test commit to develop
2. **Test deployment:** Merge PR to main to trigger deploy workflow
3. **Configure team:** Add team members and notification settings
4. **Monitor:** Check Actions tab regularly for any failures

**Your CI/CD pipeline is now automated!** 🎉
