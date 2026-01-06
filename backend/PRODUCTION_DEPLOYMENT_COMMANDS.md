# Production Deployment - Terminal Commands Quick Reference

## 🔒 Security Audit Commands

### Run Complete Security Audit

```bash
cd /home/behar/dating-app
./backend/scripts/security-audit.sh
```

### Individual Security Checks

#### 1. Security Headers (Helmet)

```bash
# Verify Helmet is configured
grep -n "helmet\|app.use(helmet" backend/server.js
grep -n "require.*helmet" backend/server.js
```

#### 2. Rate Limiting

```bash
# Check if rate limiting middleware exists
ls -la backend/middleware/rateLimiter.js

# Check if rate limiting is applied globally (should show results)
grep -n "rateLimiter\|apiLimiter\|dynamicRateLimiter" backend/server.js

# Check which routes use rate limiting
grep -r "rateLimiter\|apiLimiter" backend/routes/ --include="*.js"
```

#### 3. CORS Configuration

```bash
# Verify CORS is configured
grep -A 30 "CORS configuration" backend/server.js

# Check for hardcoded origins (should be empty or only show env vars)
grep -n "origin.*:" backend/server.js | grep -v "process.env"
```

#### 4. Hardcoded Secrets Check

```bash
# Check for hardcoded MongoDB URIs
grep -r "mongodb://.*@" backend/ --include="*.js" --exclude-dir=node_modules | grep -v "localhost" | grep -v "example"

# Check for hardcoded JWT secrets
grep -r "jwt.*secret.*=.*['\"][^'\"]\{20,\}" backend/ --include="*.js" --exclude-dir=node_modules | grep -v "process.env" | grep -v "test"

# Check for hardcoded API keys
grep -r "api.*key.*=.*['\"][^'\"]\{20,\}" backend/ --include="*.js" --exclude-dir=node_modules | grep -v "process.env" | grep -v "test" | grep -v "your_api_key"

# Check for hardcoded passwords
grep -r "password.*=.*['\"][^'\"]\{8,\}" backend/ --include="*.js" --exclude-dir=node_modules | grep -v "process.env" | grep -v "test"
```

#### 5. Error Handling Audit

```bash
# Check for stack trace leaks (should be empty)
grep -r "res\.status.*json.*error.*stack" backend/ --include="*.js" --exclude-dir=node_modules | grep -v "process.env.NODE_ENV.*development"

# Check for console.log with sensitive data
grep -ri "console\.\(log\|error\|warn\).*password\|console\.\(log\|error\|warn\).*token\|console\.\(log\|error\|warn\).*secret" backend/ --include="*.js" --exclude-dir=node_modules | grep -v "test"

# Verify error handler returns clean JSON
grep -A 20 "Global error handler" backend/server.js
```

#### 6. Environment Variables Check

```bash
# Check if .env is in .gitignore
grep "\.env$" .gitignore backend/.gitignore

# Verify required environment variables are used
grep -r "process\.env\.JWT_SECRET" backend/ --include="*.js" | head -3
grep -r "process\.env\.MONGODB_URI" backend/ --include="*.js" | head -3
grep -r "process\.env\.NODE_ENV" backend/ --include="*.js" | head -3

# List all environment variables used in code
grep -roh "process\.env\.[A-Z_]*" backend/ --include="*.js" | sort -u
```

## 🚀 PM2 Process Management Commands

### Installation

```bash
# Install PM2 globally
npm install -g pm2

# Verify installation
pm2 --version
```

### Basic PM2 Commands

```bash
# Start application with PM2 (production)
cd backend
pm2 start ecosystem.config.js --env production

# Start with specific environment
pm2 start ecosystem.config.js --env staging
pm2 start ecosystem.config.js --env development

# View running processes
pm2 list
pm2 ls

# View detailed process information
pm2 show dating-app-backend

# View logs (real-time)
pm2 logs dating-app-backend

# View logs (all apps)
pm2 logs

# View only error logs
pm2 logs dating-app-backend --err

# View only output logs
pm2 logs dating-app-backend --out

# Monitor processes (CPU, memory, etc.)
pm2 monit

# Restart application
pm2 restart dating-app-backend

# Reload application (zero-downtime, cluster mode)
pm2 reload dating-app-backend

# Stop application
pm2 stop dating-app-backend

# Stop all applications
pm2 stop all

# Delete application from PM2
pm2 delete dating-app-backend

# Delete all applications
pm2 delete all
```

### PM2 Persistence & Startup

```bash
# Save current PM2 process list
pm2 save

# Setup PM2 to start on system boot (run as root or with sudo)
pm2 startup

# After running 'pm2 startup', it will provide a command to run
# Example: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u your-user --hp /home/your-user

# Remove PM2 from startup
pm2 unstartup
```

### PM2 Advanced Commands

```bash
# View process metrics
pm2 describe dating-app-backend

# Flush all logs
pm2 flush

# Reset restart counter
pm2 reset dating-app-backend

# Update PM2
npm install -g pm2@latest

# View PM2 version
pm2 --version

# Kill PM2 daemon
pm2 kill
```

### PM2 Log Management

```bash
# View logs with lines limit
pm2 logs dating-app-backend --lines 100

# View logs with timestamp
pm2 logs dating-app-backend --timestamp

# Clear logs
pm2 flush dating-app-backend

# Rotate logs (useful for log rotation)
pm2 reloadLogs
```

## 📋 Pre-Deployment Checklist Commands

### 1. Run Security Audit

```bash
cd /home/behar/dating-app
./backend/scripts/security-audit.sh
```

### 2. Check Dependencies

```bash
# Check for vulnerabilities
cd backend
npm audit

# Fix automatically (if safe)
npm audit fix

# Check outdated packages
npm outdated
```

### 3. Verify Environment Variables

```bash
# List required environment variables
grep -roh "process\.env\.[A-Z_]*" backend/ --include="*.js" | sort -u

# Check if .env file exists (should NOT be committed)
ls -la backend/.env

# Verify .env is in .gitignore
grep "\.env$" .gitignore backend/.gitignore
```

### 4. Test Application

```bash
# Run tests
cd backend
npm test

# Type check (if using TypeScript)
npm run type-check

# Lint code
npm run lint
```

### 5. Build/Prepare for Production

```bash
# Install production dependencies only
cd backend
npm ci --production

# Or install all (including dev dependencies for building)
npm ci
```

## 🔍 Production Health Check Commands

### After Deployment

```bash
# Test health endpoint
curl https://your-api-domain.com/health

# Test with verbose output
curl -v https://your-api-domain.com/health

# Check security headers
curl -I https://your-api-domain.com/api/health

# Test rate limiting (should get 429 after limit)
for i in {1..110}; do curl -s -o /dev/null -w "%{http_code}\n" https://your-api-domain.com/api/health; done

# Check CORS headers
curl -H "Origin: https://your-frontend.com" -H "Access-Control-Request-Method: GET" -X OPTIONS https://your-api-domain.com/api/health -v
```

## 📊 Monitoring Commands

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# View process info
pm2 show dating-app-backend

# View logs
pm2 logs dating-app-backend --lines 50
```

### System Monitoring

```bash
# Check Node.js process
ps aux | grep node

# Check memory usage
free -h

# Check disk usage
df -h

# Check system load
uptime
```

## 🛠️ Troubleshooting Commands

### Application Issues

```bash
# View recent errors
pm2 logs dating-app-backend --err --lines 100

# Restart application
pm2 restart dating-app-backend

# Check if application is listening
netstat -tulpn | grep :3000
# or
ss -tulpn | grep :3000

# Check application status
pm2 status
```

### Database Connection

```bash
# Test MongoDB connection (if mongosh is installed)
mongosh "your-mongodb-uri"

# Check Redis connection (if redis-cli is installed)
redis-cli -u "your-redis-url" ping
```

## 📝 Quick Reference

### Most Common Commands

```bash
# Start application
pm2 start ecosystem.config.js --env production

# View logs
pm2 logs

# Restart application
pm2 restart dating-app-backend

# Monitor
pm2 monit

# Save and setup startup
pm2 save && pm2 startup
```

### Security Audit

```bash
./backend/scripts/security-audit.sh
```

### Full Deployment Workflow

```bash
# 1. Security audit
./backend/scripts/security-audit.sh

# 2. Install dependencies
cd backend && npm ci --production

# 3. Start with PM2
pm2 start ecosystem.config.js --env production

# 4. Save PM2 config
pm2 save

# 5. Setup startup (if needed)
pm2 startup

# 6. Monitor
pm2 logs && pm2 monit
```
