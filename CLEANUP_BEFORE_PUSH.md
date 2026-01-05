# Files to Remove Before Pushing to Vercel

## 🗑️ Files to DELETE (Safe to Remove)

### 1. Backup Files (21 files)
These are old backup files from January 5th - safe to delete:
```bash
backend/controllers/*.backup.20260105_*
```

### 2. Temporary Files (9 files)
These are temporary files - safe to delete:
```bash
backend/controllers/*.tmp
```

### 3. Test Connection Scripts (2 files)
These were for testing - safe to delete:
```bash
backend/test-redis-connection.js
backend/test-mongodb-connection.js
```

### 4. Log Files (3 files)
These are log files - should be in .gitignore:
```bash
backend/server.log
frontend.log
ddagent-install.log
```

### 5. Coverage Directory
Already in .gitignore, but if tracked, remove:
```bash
coverage/
```

---

## ✅ Files to KEEP (Useful Documentation)

These are helpful documentation files - keep them:
- `backend/REDIS_SETUP.md` - Redis setup guide
- `backend/REDIS_URL_CONVERSION.md` - Redis URL format guide
- `backend/RENDER_ENV_REVIEW.md` - Environment variables review
- `backend/RENDER_SETUP.md` - Render deployment guide
- `backend/__tests__/setup.js` - Jest setup (needed for tests)
- `backend/__tests__/global-teardown.js` - Jest teardown (needed for tests)

---

## 🚀 Quick Cleanup Command

Run this to remove all unnecessary files:

```bash
# Remove backup files
find backend/controllers -name "*.backup.*" -delete

# Remove temporary files
find backend/controllers -name "*.tmp" -delete

# Remove test scripts
rm -f backend/test-redis-connection.js backend/test-mongodb-connection.js

# Remove log files
rm -f backend/server.log frontend.log ddagent-install.log
```

---

## 📋 Verification

After cleanup, verify with:
```bash
git status
```

You should only see:
- Modified source files (✅ keep)
- New documentation files (✅ keep)
- No backup/tmp/log files (✅ removed)
