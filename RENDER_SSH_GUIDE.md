# Render SSH Access Guide 🔐

## Your SSH Connection Details

**Service**: `dating-app-backend-x4yq:10000`  
**SSH Command**:

```bash
ssh srv-d5cooc2li9vc73ct9j70@ssh.oregon.render.com
```

---

## What You Can Do with SSH Access

### 1. **Check Environment Variables** ✅

Verify that all your environment variables are set correctly:

```bash
# Check all environment variables
env | grep -E "SENTRY_DSN|DD_API_KEY|MONGODB_URI|JWT_SECRET"

# Check specific variables
echo $SENTRY_DSN
echo $DD_API_KEY
echo $NODE_ENV
echo $MONGODB_URI
```

### 2. **View Application Logs** 📋

Check real-time logs and debug issues:

```bash
# View recent logs
tail -f /var/log/render.log

# Check application logs
pm2 logs

# Or if using npm start directly
journalctl -u dating-app-backend -f
```

### 3. **Check Application Status** 🏥

Verify your application is running:

```bash
# Check if Node.js process is running
ps aux | grep node

# Check listening ports
netstat -tulpn | grep 10000

# Check application health
curl http://localhost:10000/health
```

### 4. **Test Sentry Integration** 🐛

Manually trigger Sentry test endpoint:

```bash
# Test Sentry endpoint
curl http://localhost:10000/api/test-sentry

# Check if Sentry is initialized (look for logs)
grep -i "sentry" /var/log/render.log
```

### 5. **Check Database Connection** 🗄️

Verify MongoDB connection:

```bash
# Test MongoDB connection (if mongosh is available)
mongosh $MONGODB_URI --eval "db.adminCommand('ping')"

# Or check connection in Node.js
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(e => console.error(e))"
```

### 6. **Check File System** 📁

Explore your deployed application:

```bash
# See current directory
pwd

# List files
ls -la

# Check disk space
df -h

# Check application files
ls -la /opt/render/project/src/backend/
```

### 7. **Check Resource Usage** 📊

Monitor CPU, memory, and disk:

```bash
# Check memory usage
free -h

# Check CPU usage
top -bn1 | head -20

# Check disk usage
du -sh /opt/render/project/src/*
```

### 8. **Debug Runtime Issues** 🔍

Investigate specific problems:

```bash
# Check Node.js version
node --version
npm --version

# Check installed packages
npm list --depth=0

# Check for errors in logs
grep -i "error" /var/log/render.log | tail -20
```

### 9. **Test API Endpoints** 🧪

Test your API directly from the server:

```bash
# Health check
curl http://localhost:10000/health

# Test Sentry
curl http://localhost:10000/api/test-sentry

# Test authentication (if you have test credentials)
curl -X POST http://localhost:10000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

### 10. **Check Environment-Specific Config** ⚙️

Verify production configuration:

```bash
# Check NODE_ENV
echo $NODE_ENV

# Check all environment variables (be careful with secrets!)
env | sort

# Check if specific services are configured
echo "Sentry: $([ -n "$SENTRY_DSN" ] && echo '✅ Configured' || echo '❌ Missing')"
echo "Datadog: $([ -n "$DD_API_KEY" ] && echo '✅ Configured' || echo '❌ Missing')"
echo "MongoDB: $([ -n "$MONGODB_URI" ] && echo '✅ Configured' || echo '❌ Missing')"
```

---

## Quick Diagnostic Script

Run this to get a complete health check:

```bash
#!/bin/bash
echo "=== Render Deployment Health Check ==="
echo ""
echo "📦 Application Status:"
ps aux | grep -E "node|npm" | grep -v grep || echo "❌ No Node.js process found"
echo ""
echo "🌐 Port Status:"
netstat -tulpn | grep 10000 || echo "❌ Port 10000 not listening"
echo ""
echo "🔧 Environment Variables:"
echo "NODE_ENV: ${NODE_ENV:-❌ Not set}"
echo "SENTRY_DSN: $([ -n "$SENTRY_DSN" ] && echo '✅ Set' || echo '❌ Not set')"
echo "DD_API_KEY: $([ -n "$DD_API_KEY" ] && echo '✅ Set' || echo '❌ Not set')"
echo "MONGODB_URI: $([ -n "$MONGODB_URI" ] && echo '✅ Set' || echo '❌ Not set')"
echo ""
echo "💾 Disk Usage:"
df -h | grep -E "Filesystem|/opt"
echo ""
echo "🧠 Memory Usage:"
free -h
echo ""
echo "🏥 Health Check:"
curl -s http://localhost:10000/health | head -5 || echo "❌ Health check failed"
```

---

## Common Use Cases

### Use Case 1: Verify Sentry is Working

```bash
# 1. Check if SENTRY_DSN is set
echo $SENTRY_DSN

# 2. Trigger test error
curl http://localhost:10000/api/test-sentry

# 3. Check logs for Sentry initialization
grep -i "sentry" /var/log/render.log | tail -10
```

### Use Case 2: Debug Database Connection Issues

```bash
# 1. Check MongoDB URI is set
echo $MONGODB_URI

# 2. Test connection
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log('✅ Connected'); process.exit(0); })
  .catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
"
```

### Use Case 3: Check Why Service Isn't Starting

```bash
# 1. Check recent logs
tail -50 /var/log/render.log

# 2. Check for errors
grep -i "error\|failed\|exception" /var/log/render.log | tail -20

# 3. Check Node.js version
node --version

# 4. Check if dependencies are installed
ls -la node_modules/ | head -10
```

### Use Case 4: Verify Environment Variables After Deployment

```bash
# Check all critical variables
env | grep -E "SENTRY_DSN|DD_API_KEY|DD_SITE|DD_ENV|MONGODB_URI|JWT_SECRET|NODE_ENV" | sort
```

---

## Important Notes ⚠️

1. **Read-Only Access**: Render SSH is typically read-only. You can't modify files or restart services.
2. **Temporary**: SSH access may be limited or disabled on free tier plans.
3. **Security**: Never share your SSH credentials or expose sensitive data in logs.
4. **Logs**: Logs are rotated, so older logs may not be available.

---

## Troubleshooting

### Can't Connect?

```bash
# Check if SSH is enabled in Render dashboard
# Settings → SSH → Enable SSH Access
```

### Permission Denied?

- SSH access might be disabled on your plan
- Check Render dashboard for SSH settings

### Can't Find Logs?

```bash
# Try different log locations
ls -la /var/log/
ls -la ~/.pm2/logs/
journalctl -u dating-app-backend
```

---

## Next Steps

1. **Connect via SSH**:

   ```bash
   ssh srv-d5cooc2li9vc73ct9j70@ssh.oregon.render.com
   ```

2. **Run the diagnostic script** to check everything

3. **Test Sentry** by triggering the test endpoint

4. **Verify environment variables** are set correctly

---

## Summary

SSH access lets you:

- ✅ Debug production issues in real-time
- ✅ Verify environment variables
- ✅ Check application logs
- ✅ Test endpoints directly
- ✅ Monitor resource usage
- ✅ Diagnose connection issues

**Most useful for**: Debugging production issues, verifying configuration, and testing integrations like Sentry and Datadog! 🚀
