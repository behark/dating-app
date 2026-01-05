# Mongoose Duplicate Index Warning - Fix Guide

## Problem

You're seeing this warning:

```
[MONGOOSE] Warning: Duplicate schema index on {"userId":1} found.
This is often due to declaring an index using both "index: true" and "schema.index()".
```

## Root Cause

Some models have `unique: true` on the `userId` field (which automatically creates an index) AND also have `schema.index({ userId: 1 })` (which creates a duplicate index).

## Models with Duplicate Indexes

### 1. Subscription.js

- **Line 9**: `userId: { unique: true }` ← Creates index automatically
- **Line 131**: `subscriptionSchema.index({ userId: 1 })` ← Creates duplicate index

**Fix**: Remove line 131 since `unique: true` already creates the index.

### 2. SwipeStreak.js

- **Line 8**: `userId: { unique: true }` ← Creates index automatically
- **Line 84**: `swipeStreakSchema.index({ userId: 1 })` ← Creates duplicate index

**Fix**: Remove line 84 since `unique: true` already creates the index.

## Solution

### Option 1: Remove Explicit Index (Recommended)

Since `unique: true` already creates an index, remove the explicit `schema.index()` calls:

**Subscription.js** - Remove line 131:

```javascript
// REMOVE THIS LINE:
subscriptionSchema.index({ userId: 1 });
```

**SwipeStreak.js** - Remove line 84:

```javascript
// REMOVE THIS LINE:
swipeStreakSchema.index({ userId: 1 });
```

### Option 2: Remove `unique: true` and Keep Explicit Index

If you need the explicit index for other reasons, remove `unique: true` from the field definition and keep the `schema.index()` call.

## Other Models (No Issue)

These models have `schema.index({ userId: 1 })` but NO `unique: true` or `index: true` in the field definition, so they're fine:

- ✅ SharedProfile.js
- ✅ DailyReward.js
- ✅ AchievementBadge.js
- ✅ Rewind.js
- ✅ BoostProfile.js
- ✅ UserActivity.js
- ✅ PaymentTransaction.js

## Quick Fix Commands

```bash
# Check which files have the issue
grep -n "unique: true" backend/models/Subscription.js backend/models/SwipeStreak.js
grep -n "\.index({ userId" backend/models/Subscription.js backend/models/SwipeStreak.js
```

## After Fixing

Restart your backend server to clear the warnings:

```bash
# Stop current server (Ctrl+C)
# Then restart
cd backend && npm start
```

---

**Note**: The warnings don't break functionality, but fixing them improves performance and removes the annoying warnings.
