# TypeScript Migration - Quick Start Guide

## ✨ What's Been Done Today

### Completed Migrations (2 major services)

1. **✅ PaymentService.ts** (391 lines)
   - Complete payment processing with Stripe, PayPal, Apple IAP, Google Play
   - 15+ comprehensive type definitions
   - 20+ fully typed methods
   - Platform-specific helpers with types

2. **✅ SafetyService.ts** (931 lines)
   - Comprehensive safety features (blocking, reporting, verification)
   - 20+ type definitions including emergency features
   - 35+ fully typed methods
   - Advanced features: date plans, check-ins, SOS, background checks

### Documentation Created

1. **TYPESCRIPT_MIGRATION_PROGRESS.md** - Live progress tracking
2. **TYPESCRIPT_MIGRATION_EXECUTION_PLAN.md** - Complete 10-week plan
3. **scripts/ts-migration-helper.sh** - Automation helper scripts

---

## 🚀 Quick Start

### Run Migration Progress Report
```bash
./scripts/ts-migration-helper.sh progress
```

### Find Next Files to Migrate
```bash
./scripts/ts-migration-helper.sh next
```

### Interactive Mode
```bash
./scripts/ts-migration-helper.sh
```

---

## 📊 Current Status

**Overall Progress:** ~15% complete

| Category | Migrated | Remaining | Progress |
|----------|----------|-----------|----------|
| **Frontend Services** | 9 | 25 | 26% |
| **Backend Controllers** | 1 | 29 | 3% |
| **Screens** | 0 | 40+ | 0% |

---

## 🎯 Next Steps (Continue Migration)

### Week 1 Priorities (Days 3-7)

#### Day 3: Premium & Monitoring Services
```bash
# Migrate these services:
1. src/services/PremiumService.js → PremiumService.ts
2. src/services/MonitoringService.js → MonitoringService.ts
3. src/services/PrivacyService.js → PrivacyService.ts
```

**How to migrate:**
```bash
# 1. Generate template
./scripts/ts-migration-helper.sh template src/services/PremiumService.js > src/services/PremiumService.ts

# 2. Open and customize the file
code src/services/PremiumService.ts

# 3. Add actual type definitions and convert methods
# (Follow pattern from PaymentService.ts and SafetyService.ts)

# 4. Validate
./scripts/ts-migration-helper.sh validate src/services/PremiumService.ts

# 5. Type check
npx tsc --noEmit src/services/PremiumService.ts
```

#### Day 4-5: Large Services
```bash
# GamificationService is 805 lines - complex migration
1. src/services/GamificationService.js → GamificationService.ts
2. src/services/IAPService.js → IAPService.ts
3. src/services/MediaMessagesService.js → MediaMessagesService.ts
```

---

## 📚 Migration Patterns

### Pattern 1: Simple Service Method
```typescript
// BEFORE (JavaScript)
static async getUser(userId) {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    logger.error('Error getting user:', error);
    return null;
  }
}

// AFTER (TypeScript)
static async getUser(userId: string): Promise<User | null> {
  try {
    const response = await api.get(`/users/${userId}`);
    
    if (!response.success) {
      logger.error('Error getting user', new Error(response.message));
      return null;
    }
    
    return response.data as User || null;
  } catch (error) {
    logger.error('Error getting user', error as Error);
    return null;
  }
}
```

### Pattern 2: Complex Response Types
```typescript
// Define interface first
export interface PaymentResponse {
  success: boolean;
  data?: {
    transactionId: string;
    amount: number;
    currency: string;
  };
  error?: string;
  message?: string;
}

// Use in method
static async processPayment(
  amount: number,
  currency: string,
  token: string
): Promise<PaymentResponse> {
  try {
    const response = await api.post('/payment', { amount, currency }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response;
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    };
  }
}
```

### Pattern 3: Union Types for Status
```typescript
export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded';

export interface Transaction {
  id: string;
  amount: number;
  status: PaymentStatus; // Only these 5 values allowed
}
```

---

## 🔧 Helper Commands

### Type Checking
```bash
# Frontend
npx tsc --noEmit

# Backend
cd backend && npx tsc --noEmit

# Specific file
npx tsc --noEmit src/services/PaymentService.ts

# Watch mode
npx tsc --noEmit --watch
```

### Finding Files
```bash
# Find all JavaScript services
find src/services -name "*.js"

# Find all TypeScript services
find src/services -name "*.ts"

# Count lines in a file
wc -l src/services/GamificationService.js
```

### Testing
```bash
# Test specific file
npm test -- PaymentService

# Test all services
npm test -- services/

# With coverage
npm test -- --coverage
```

---

## 📝 Daily Workflow

### Morning Setup (15 min)
1. Check progress: `./scripts/ts-migration-helper.sh progress`
2. Find next file: `./scripts/ts-migration-helper.sh next`
3. Generate checklist: `./scripts/ts-migration-helper.sh checklist <file>`

### Migration Loop (Repeat for each file, ~2-4 hours per file)
1. **Read original file** - Understand logic and methods
2. **Generate template** - Use helper script
3. **Add types** - Define interfaces and types at top
4. **Convert methods** - Add parameter and return types
5. **Type check** - Run `npx tsc --noEmit`
6. **Fix errors** - Resolve any type errors
7. **Test** - Run tests for the service
8. **Commit** - Git commit the new TypeScript file

### Evening Review (15 min)
1. Update progress in `TYPESCRIPT_MIGRATION_PROGRESS.md`
2. Run full type check: `./scripts/ts-migration-helper.sh typecheck`
3. Commit progress
4. Plan tomorrow's files

---

## 🎓 Learning Resources

### TypeScript Fundamentals
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

### React Native + TypeScript
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Expo TypeScript Guide](https://docs.expo.dev/guides/typescript/)

### Best Practices
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [TypeScript Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot find module"
```bash
# Solution: Check tsconfig paths
# Verify in tsconfig.json:
"paths": {
  "@services/*": ["src/services/*"]
}
```

### Issue 2: "Implicit 'any' type"
```typescript
// Bad
function process(data) { // ❌ Implicit any
  return data.value;
}

// Good
function process(data: DataType): number { // ✅ Explicit types
  return data.value;
}
```

### Issue 3: "Type 'X' is not assignable to type 'Y'"
```typescript
// Solution: Use type assertion or type guard
const response = await api.get('/user');
const user = response.data as User; // Type assertion

// Or use type guard
if (isUser(response.data)) {
  const user: User = response.data;
}
```

### Issue 4: Circular Dependencies
```typescript
// Solution: Use type-only imports
import type { User } from './UserService';

// Or extract types to shared file
import { User } from '../types/user';
```

---

## ✅ Quality Checklist

Before marking a file as "migrated":

- [ ] All function parameters have types
- [ ] All functions have return types
- [ ] No implicit `any` types
- [ ] All exported types documented
- [ ] File passes `npx tsc --noEmit`
- [ ] File passes linter
- [ ] Tests pass
- [ ] Imports updated in consuming files

---

## 📈 Progress Tracking

### Update Progress Document
```bash
# After each file migration, update:
vim TYPESCRIPT_MIGRATION_PROGRESS.md

# Update the "Completed" section
# Move file from "Remaining" to "Completed"
# Update percentage calculations
```

### Commit Messages
```bash
# Use consistent commit format:
git add src/services/PaymentService.ts
git commit -m "feat(ts): migrate PaymentService to TypeScript

- Added 15+ type definitions
- Migrated 20 methods with full type safety
- Exported types for consuming modules
- Progress: 9/34 services (26%)
"
```

---

## 🎯 Goals & Milestones

### Week 1 Goal
- Complete 15 more service migrations
- Reach 70% service migration (24/34 services)

### Week 2 Goal
- Complete all remaining services (34/34)
- Start backend controller migrations

### Month 1 Goal
- Complete all services and controllers
- 50% screen migration

### Month 2 Goal
- Complete all screens
- Enable strict mode
- 95%+ type coverage

---

## 🤝 Getting Help

### Type Check Errors
```bash
# Get detailed error output
npx tsc --noEmit --pretty

# Check specific file with line numbers
npx tsc --noEmit src/services/PaymentService.ts | grep "error TS"
```

### Finding Examples
```bash
# Look at already migrated files
code src/services/PaymentService.ts
code src/services/SafetyService.ts
code src/services/api.ts
```

### Validation
```bash
# Use helper script
./scripts/ts-migration-helper.sh validate src/services/YourService.ts
```

---

## 🎉 Success Metrics

Track these metrics weekly:

1. **Files Migrated** - Number of .ts/.tsx files
2. **Type Coverage** - Percentage of typed code
3. **Any Types** - Count of `any` types (goal: minimize)
4. **Build Time** - TypeScript compilation time
5. **Error Detection** - Compile-time vs runtime errors

---

## 📞 Support

**Documentation:**
- Main Plan: `TYPESCRIPT_MIGRATION_EXECUTION_PLAN.md`
- Progress: `TYPESCRIPT_MIGRATION_PROGRESS.md`
- This Guide: `TYPESCRIPT_MIGRATION_GUIDE.md`

**Scripts:**
- Helper: `scripts/ts-migration-helper.sh`

**TypeScript Config:**
- Frontend: `tsconfig.json`
- Backend: `backend/tsconfig.json`

---

**Last Updated:** January 7, 2026  
**Next Review:** Daily at end of work session  
**Estimated Completion:** March 2026 (10 weeks)
