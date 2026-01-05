# 🧹 QUICK CLEANUP GUIDE - Safe File Removal

**Quick Reference:** Files that are 100% safe to remove with zero risk.

**Rules Applied:**
- ✅ Do NOT remove tests
- ✅ Do NOT remove configs
- ✅ Do NOT remove migrations
- ✅ Do NOT remove documentation

---

## ⚡ QUICK REMOVAL (Run This Now)

```bash
# Automated cleanup script
bash scripts/cleanup-safe-files.sh
```

**This will remove:**
- ✅ Coverage reports (9.4 MB) - Generated files, not tests
- ✅ 5 preview HTML files - Static previews, not used in code
- ✅ 7 one-time fix scripts - Code transformations (not migrations), already applied
- ✅ 2 temporary env check files - Temporary files, not configs
- ✅ Empty temp directory - Temporary storage

**Total Space Saved:** ~10 MB  
**Risk:** ✅ **ZERO** - All files verified safe, following all rules

---

## 📋 WHAT GETS REMOVED

### ✅ 100% Safe (Zero Risk)

1. **`coverage/` directory** (9.4 MB)
   - **Why Safe:** Generated test coverage reports (output, not tests themselves)
   - **Not:** Tests, configs, migrations, or documentation
   - Regenerated with `npm test -- --coverage`

2. **Preview HTML files** (5 files)
   - `preview-ChatScreen.html`
   - `preview-ExploreScreen.html`
   - `preview-HomeScreen.html`
   - `preview-MatchesScreen.html`
   - `preview-TopPicksScreen.html`
   - **Why Safe:** Static HTML previews for design reference, not used in code
   - **Not:** Tests, configs, migrations, or documentation
   - Verified: No imports/requires in codebase

3. **One-time fix scripts** (7 files)
   - `scripts/fix-color-syntax.js`
   - `scripts/fix-colors-import-paths.js`
   - `scripts/fix-gradient-colors.js`
   - `scripts/fix-remaining-colors.js`
   - `scripts/replace-colors.js`
   - `scripts/replace-console-statements.js`
   - `scripts/replace-console.js`
   - **Why Safe:** Code transformation scripts (NOT database migrations), fixes already applied
   - **Not:** Tests, configs, migrations (these are code transformations, not DB migrations), or documentation
   - Verified: Not in package.json scripts, changes already in codebase

4. **Temporary files** (2 files)
   - `.env.check-current`
   - `.env.vercel-check`
   - **Why Safe:** Temporary check files, not actual configuration
   - **Not:** Tests, configs (`.env.example` is the real config), migrations, or documentation

---

## ✅ WHAT STAYS (Protected by Rules)

The cleanup script will **NOT** remove:
- ✅ **Tests** - All test files preserved (`__tests__/`, `tests/`, `e2e/`, `*.test.js`, `*.spec.js`)
- ✅ **Configs** - All config files preserved (`.env.example`, `package.json`, `*.config.js`, etc.)
- ✅ **Migrations** - All migration scripts preserved (`backend/scripts/migrate-api-responses.sh`, etc.)
- ✅ **Documentation** - All `.md` files preserved (README, guides, etc.)

---

## ✅ VERIFICATION

All files verified:
- ✅ Not imported/required in code
- ✅ Not in package.json scripts
- ✅ Not needed for deployment
- ✅ Information preserved elsewhere (for docs)

---

## 🚀 RUN CLEANUP

```bash
bash scripts/cleanup-safe-files.sh
```

**That's it!** Safe, automated cleanup with zero risk.
