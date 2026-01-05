# Backend ESLint Errors & Warnings - Fixed

**Date:** 2026-01-05

---

## ✅ All Issues Fixed

### Summary of Issues:

1. ✅ **`no-return-await` Error** - FIXED
2. ✅ **Object Injection Security Warnings** - FIXED

---

## 🔧 Fixes Applied:

### 1. ✅ `no-return-await` Error (Line 627)

**Issue:**

```javascript
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
```

**Error:**

```
627:10  error    Redundant use of `await` on a return value  no-return-await
```

**Fix:**
Removed redundant `await` and `async` keyword since we're just returning the promise:

```javascript
userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};
```

**Explanation:**

- When you `return await` in an async function, the `await` is redundant
- The function will wait for the promise anyway
- Since we're just returning the promise, we don't need `async`/`await` at all
- The caller can still `await` the result if needed

---

### 2. ✅ Object Injection Security Warnings (Line 686)

**Issue:**

```javascript
fields.forEach((field) => {
  if (this[field] && (Array.isArray(this[field]) ? this[field].length > 0 : true)) {
    score += 1;
  }
});
```

**Warnings:**

```
686:9   warning  Generic Object Injection Sink               security/detect-object-injection
686:39  warning  Function Call Object Injection Sink         security/detect-object-injection
686:54  warning  Generic Object Injection Sink               security/detect-object-injection
```

**Fix:**
Refactored to check each field explicitly instead of using dynamic property access:

```javascript
// Virtual for profile completeness score
userSchema.virtual('profileCompleteness').get(function () {
  let score = 0;
  // Check each field explicitly to avoid object injection warnings
  // Safe: All field names are hardcoded, not user input
  if (this.name) score += 1;
  if (this.age) score += 1;
  if (this.gender) score += 1;
  if (this.bio) score += 1;
  if (this.photos && Array.isArray(this.photos) && this.photos.length > 0) score += 1;
  if (this.interests && Array.isArray(this.interests) && this.interests.length > 0) score += 1;
  if (this.location) score += 1;

  return Math.round((score / 7) * 100);
});
```

**Explanation:**

- The security plugin warns about `this[field]` because it could be exploited if `field` comes from user input
- In this case, `fields` was a hardcoded array, so it was safe, but the linter couldn't verify that
- By checking each field explicitly, we eliminate the security warning
- The code is also more explicit and easier to understand

---

## 📋 Files Modified:

1. **`backend/models/User.js`**
   - Fixed `matchPassword` method (removed redundant `await`)
   - Refactored `profileCompleteness` virtual (explicit field checks)

---

## ✅ Status:

- ✅ **Error:** Fixed (`no-return-await`)
- ✅ **Security Warnings:** Fixed (object injection)
- ✅ **Code Quality:** Improved (more explicit, safer)

---

## 🎯 Result:

**All errors and warnings are fixed!** The code is now:

- ✅ More efficient (no redundant await)
- ✅ More secure (no dynamic property access)
- ✅ More explicit (easier to understand)
- ✅ ESLint compliant

---

## 💡 Notes:

- **`no-return-await`:** This is a performance optimization - returning a promise directly is slightly faster than awaiting it first
- **Object Injection:** While the original code was safe (hardcoded fields), the explicit approach is more secure and clearer
- **Functionality:** All fixes maintain existing functionality - no breaking changes

**All issues resolved!** 🎉
