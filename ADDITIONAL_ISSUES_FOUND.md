# Additional Issues Found - Environment Configuration Review

**Date:** January 2026  
**Status:** Issues Identified

---

## 🔍 Issues Found

### 1. ⚠️ **Hardcoded Placeholder URLs in `src/config/environments.js`**

**Location:** `src/config/environments.js` lines 56, 72

**Issue:**
```javascript
[ENVIRONMENTS.STAGING]: {
  apiUrl: 'https://staging.yourapp.com',  // ❌ Placeholder
  ...
},
[ENVIRONMENTS.PRODUCTION]: {
  apiUrl: 'https://yourapp.com',  // ❌ Placeholder
  ...
}
```

**Problem:**
- These are placeholder URLs that don't match your actual production backend
- If this config is used anywhere, it would point to wrong URLs
- Should use `EXPO_PUBLIC_API_URL` or match the actual production URL

**Impact:** 
- **Very Low** - ✅ **Verified: File is NOT used anywhere in the codebase**
- No imports found - this appears to be unused/orphaned code

**Recommendation:**
- **Low Priority** - Can be left as-is or removed for cleanup
- If keeping, consider updating placeholder URLs for future use
- Or add a comment noting it's currently unused

---

### 2. ⚠️ **Missing CORS_ORIGIN Validation in Production**

**Location:** `backend/utils/validateEnv.js`

**Issue:**
- `CORS_ORIGIN` and `FRONTEND_URL` are listed as "optional" but are critical for production
- No validation that these are set in production mode
- Could cause CORS issues if not configured

**Current Status:**
```javascript
const OPTIONAL_ENV_VARS = [
  'FRONTEND_URL',  // ⚠️ Should be required in production
  ...
];
```

**Recommendation:**
- Add `FRONTEND_URL` and `CORS_ORIGIN` to `IMPORTANT_ENV_VARS` with production check
- Warn if not set in production mode

---

### 3. ℹ️ **Hardcoded Fallback URLs (Acceptable)**

**Location:** `src/config/api.js`, `app.config.js`

**Status:** ✅ **This is OK** - These are fallback defaults

The hardcoded URLs in these files are acceptable because:
- They're only used as fallbacks when env vars aren't set
- The priority system correctly checks env vars first
- They match your actual production backend URL

**Files:**
- `src/config/api.js`: `https://dating-app-backend-x4yq.onrender.com/api` ✅
- `app.config.js`: `https://dating-app-backend-x4yq.onrender.com/api` ✅

---

## 📊 Summary

| Issue | Severity | Status | Action Needed |
|-------|----------|--------|---------------|
| Hardcoded URLs in environments.js | Very Low | ✅ Not used | Optional: Remove or document as unused |
| Missing CORS validation | Medium | ✅ **FIXED** | Added FRONTEND_URL validation for production |
| Hardcoded fallbacks | Info | ✅ OK | None - these are correct |

---

## ✅ Recommendations

### Priority 1: Verify `environments.js` Usage
```bash
# Check if this file is actually imported anywhere
grep -r "environments.js\|EnvironmentConfig" src/
```

**If NOT used:** Consider removing or documenting it as unused  
**If USED:** Update URLs to use `EXPO_PUBLIC_API_URL` or actual production values

### Priority 2: Add CORS Validation ✅ **FIXED**
✅ Updated `backend/utils/validateEnv.js` to:
- Added `FRONTEND_URL` to `IMPORTANT_ENV_VARS` with `requiredInProduction: true`
- Now validates that `FRONTEND_URL` is set in production mode
- Will show error (not just warning) if missing in production

---

## 🎯 Next Steps

1. ✅ **Check if `environments.js` is used** - ✅ Verified: NOT used (no imports found)
2. ✅ **Add CORS validation** - ✅ **FIXED** - Added FRONTEND_URL production validation
3. ℹ️ **Document or remove unused config** - Optional cleanup (low priority)

---

**Review Status:** Additional issues identified, none critical
