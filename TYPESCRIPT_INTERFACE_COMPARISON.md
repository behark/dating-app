# TypeScript Interface Comparison Report

## Overview

This report compares the User type definitions across the codebase:

- **Frontend**: `src/types/index.d.ts` - `User` interface
- **Backend**: `backend/types/index.d.ts` - `IUser` interface
- **Database Schema**: `backend/models/User.js` - Mongoose schema

**Note**: This project uses Mongoose, not Prisma. No Prisma schema exists.

---

## Field-by-Field Comparison

### ✅ Fields Present in All Three

| Field               | Frontend Type                                           | Backend Type                     | Mongoose Schema                                | Status               |
| ------------------- | ------------------------------------------------------- | -------------------------------- | ---------------------------------------------- | -------------------- |
| `_id`               | `string`                                                | N/A (in UserDocument)            | `ObjectId`                                     | ⚠️ Type mismatch     |
| `email`             | `string`                                                | `string`                         | `String` (required, unique)                    | ✅ Match             |
| `name`              | `string`                                                | `string`                         | `String` (required)                            | ✅ Match             |
| `age`               | `number?`                                               | `number?`                        | `Number` (min: 18, max: 100)                   | ✅ Match             |
| `gender`            | `'male' \| 'female' \| 'other'?`                        | `'male' \| 'female' \| 'other'?` | `String` (enum)                                | ✅ Match             |
| `bio`               | `string?`                                               | `string?`                        | `String` (maxlength: 500)                      | ✅ Match             |
| `photos`            | `Photo[]?`                                              | `IPhoto[]` (required)            | `Array` (subdocument)                          | ⚠️ Required mismatch |
| `interests`         | `string[]?`                                             | `string[]` (required)            | `Array` (String)                               | ⚠️ Required mismatch |
| `location`          | `Location?`                                             | `ILocation?`                     | `Object` (required)                            | ⚠️ Required mismatch |
| `locationPrivacy`   | `'hidden' \| 'visible_to_matches' \| 'visible_to_all'?` | Same                             | `String` (enum, default: 'visible_to_matches') | ✅ Match             |
| `preferredGender`   | `'male' \| 'female' \| 'other' \| 'any'?`               | Same                             | `String` (enum, default: 'any')                | ✅ Match             |
| `preferredAgeRange` | `{ min: number; max: number }?`                         | `IAgeRange?`                     | `Object` (min/max, defaults)                   | ✅ Match             |
| `preferredDistance` | `number?`                                               | `number?`                        | `Number` (default: 50)                         | ✅ Match             |
| `isActive`          | `boolean?`                                              | `boolean?`                       | `Boolean` (default: true)                      | ✅ Match             |
| `isVerified`        | `boolean?`                                              | `boolean?`                       | `Boolean` (default: false)                     | ✅ Match             |
| `isProfileVerified` | `boolean?`                                              | `boolean?`                       | `Boolean` (default: false)                     | ✅ Match             |
| `lastActive`        | `string?`                                               | `Date?`                          | `Date` (default: Date.now)                     | ⚠️ Type mismatch     |
| `googleId`          | `string?`                                               | `string?`                        | `String` (unique, sparse)                      | ✅ Match             |
| `facebookId`        | `string?`                                               | `string?`                        | `String` (unique, sparse)                      | ✅ Match             |
| `appleId`           | `string?`                                               | `string?`                        | `String` (unique, sparse)                      | ✅ Match             |
| `isPremium`         | `boolean?`                                              | `boolean?`                       | `Boolean` (default: false)                     | ✅ Match             |
| `createdAt`         | `string?`                                               | `Date?`                          | `Date` (auto)                                  | ⚠️ Type mismatch     |
| `updatedAt`         | `string?`                                               | `Date?`                          | `Date` (auto)                                  | ⚠️ Type mismatch     |

---

## ❌ Fields Missing in Frontend Type

These fields exist in backend/database but are **NOT** in the frontend `User` interface:

### Authentication & Security

- `password` - Backend has it, frontend shouldn't expose it ✅ (correctly omitted)
- `passwordResetToken` - Backend only ✅
- `passwordResetTokenExpiry` - Backend only ✅
- `emailVerificationToken` - Backend only ✅
- `emailVerificationTokenExpiry` - Backend only ✅
- `phoneVerificationCode` - Backend only ✅
- `phoneVerificationCodeExpiry` - Backend only ✅

### Phone Verification

- `phoneNumber` - Backend has it, frontend missing ❌
- `isPhoneVerified` - Backend has it, frontend missing ❌
- `phoneVerified` - Backend has it (alias), frontend missing ❌

### Email Verification

- `emailVerified` - Backend has it, frontend has `isEmailVerified` ⚠️ (naming inconsistency)

### Enhanced Profile Fields

- `videos` - Backend has `IVideo[]`, frontend missing ❌
- `profilePrompts` - Backend has it, frontend missing ❌
- `education` - Backend has `IEducation`, frontend missing ❌
- `occupation` - Backend has `IOccupation`, frontend missing ❌
- `height` - Backend has `IHeight`, frontend missing ❌
- `ethnicity` - Backend has `string[]`, frontend missing ❌
- `socialMedia` - Backend has `ISocialMedia`, frontend missing ❌

### Subscription & Premium

- `subscription` - Backend has `ISubscription`, frontend missing ❌
- `subscriptionEnd` - Frontend has it, but backend uses `subscription.endDate` ⚠️ (structure mismatch)
- `premiumExpiresAt` - Mongoose has it, frontend missing ❌

### Account Status

- `suspended` - Backend has it, frontend missing ❌
- `needsReview` - Backend has it, frontend missing ❌
- `suspendedAt` - Mongoose only ❌
- `suspendReason` - Mongoose only ❌
- `suspensionType` - Mongoose only ❌
- `appealReason` - Mongoose only ❌
- `appealedAt` - Mongoose only ❌
- `reportCount` - Mongoose only ❌
- `blockedUsers` - Mongoose only ❌
- `blockedCount` - Mongoose only ❌

### Verification Details

- `verificationStatus` - Backend has it, frontend missing ❌
- `verificationMethod` - Backend has it, frontend missing ❌
- `verificationDate` - Mongoose only ❌

### Activity & Engagement

- `isOnline` - Backend has it, frontend missing ❌
- `lastOnlineAt` - Mongoose only ❌
- `profileViewCount` - Mongoose only ❌
- `profileViewedBy` - Mongoose only ❌
- `activityScore` - Backend has it, frontend missing ❌
- `totalSwipes` - Backend has it, frontend missing ❌
- `totalMatches` - Backend has it, frontend missing ❌
- `totalConversations` - Mongoose only ❌
- `responseRate` - Backend has it, frontend missing ❌
- `lastActivityAt` - Mongoose only ❌

### OAuth

- `oauthProviders` - Backend has it, frontend missing ❌

### Profile Completeness

- `profileCompleteness` - Backend has it (virtual), frontend missing ❌

### Location Details

- `lastLocationUpdate` - Mongoose only ❌
- `locationHistoryEnabled` - Mongoose only ❌

### Premium Features (Mongoose only)

- `receivedLikes` - Array of likes received ❌
- `passportMode` - Location override feature ❌
- `advancedFilters` - Advanced filtering options ❌
- `priorityLikesReceived` - Count ❌
- `priorityLikesSent` - Count ❌
- `adsPreferences` - Ad preferences ❌
- `boostAnalytics` - Boost performance data ❌
- `swipeStats` - Swipe statistics ❌
- `superLikeUsageToday` - Daily super like tracking ❌
- `superLikeResetTime` - Reset time ❌
- `rewindUsageToday` - Daily rewind tracking ❌
- `rewindResetTime` - Reset time ❌
- `boostUsageToday` - Daily boost tracking ❌
- `boostResetTime` - Reset time ❌
- `activeBoostId` - Reference to active boost ❌

### Privacy & Compliance

- `privacySettings` - GDPR/CCPA settings ❌

### Encryption

- `encryptionPublicKey` - E2E encryption key ❌
- `encryptionPrivateKeyEncrypted` - Encrypted private key ❌
- `encryptionKeyVersion` - Key version ❌

### Gamification

- `gamification` - XP, challenges, achievements ❌

---

## ❌ Fields Only in Frontend Type

These fields exist in frontend but **NOT** in backend/database:

- `uid` - Alias for `_id` (Firebase compatibility) - Frontend only ✅ (acceptable)

---

## ⚠️ Type Mismatches

### Date vs String

- **Frontend**: Uses `string` for dates (`createdAt`, `updatedAt`, `lastActive`, `subscriptionEnd`)
- **Backend**: Uses `Date` for dates
- **Issue**: Frontend receives dates as strings from API, but TypeScript types should reflect this

### Required vs Optional

- **Frontend**: `photos` and `interests` are optional (`?`)
- **Backend**: `photos` and `interests` are required arrays (non-nullable)
- **Mongoose**: Arrays can be empty but field exists
- **Issue**: Frontend allows `undefined`, but backend expects arrays (even if empty)

### Photo Structure

- **Frontend**: `Photo` has `isMain?: boolean`
- **Backend**: `IPhoto` has `isMain?: boolean`
- **Mongoose**: Photo schema doesn't have `isMain` field explicitly defined
- **Issue**: Field may not be persisted in database

---

## 🔴 Critical Discrepancies

### 1. Missing Essential Fields in Frontend

The frontend `User` interface is missing many fields that are actively used:

- Phone verification fields (`phoneNumber`, `isPhoneVerified`)
- Enhanced profile fields (`videos`, `education`, `occupation`, `height`, `ethnicity`, `socialMedia`)
- Activity metrics (`activityScore`, `totalSwipes`, `totalMatches`, `responseRate`)
- Account status (`suspended`, `needsReview`)
- Verification details (`verificationStatus`, `verificationMethod`)

### 2. Date Type Inconsistency

- Frontend uses `string` for dates (correct for JSON serialization)
- Backend uses `Date` (correct for database)
- This is actually **correct** - dates are serialized as strings in JSON

### 3. Required Field Mismatch

- Frontend allows `photos` and `interests` to be `undefined`
- Backend expects them as arrays (can be empty `[]`)
- **Recommendation**: Frontend should use `Photo[]` and `string[]` (non-nullable arrays)

### 4. Subscription Structure Mismatch

- Frontend has `subscriptionEnd?: string`
- Backend has `subscription?: ISubscription` with `endDate` inside
- Mongoose has both `subscription` object and `premiumExpiresAt` field
- **Issue**: Inconsistent structure

---

## 📋 Recommendations

### High Priority

1. **Add missing essential fields** to frontend `User` interface:
   - Phone verification fields
   - Enhanced profile fields (videos, education, occupation, etc.)
   - Activity metrics
   - Account status fields

2. **Fix required field types**:
   - Change `photos?: Photo[]` to `photos: Photo[]` (can be empty array)
   - Change `interests?: string[]` to `interests: string[]` (can be empty array)

3. **Standardize subscription field**:
   - Decide on either `subscriptionEnd` or `subscription.endDate`
   - Update both frontend and backend to match

### Medium Priority

4. **Add premium feature fields** if frontend needs them:
   - `receivedLikes`, `passportMode`, `advancedFilters`, etc.

5. **Add gamification fields** if frontend displays XP/challenges:
   - `gamification` object

6. **Standardize email verification field name**:
   - Use either `isEmailVerified` or `emailVerified` consistently

### Low Priority

7. **Add privacy settings** if frontend has privacy UI:
   - `privacySettings` object

8. **Add encryption fields** if frontend handles E2E encryption:
   - `encryptionPublicKey`, etc.

---

## Summary

- **Total fields in Mongoose schema**: ~80+ fields
- **Total fields in backend IUser**: ~60 fields
- **Total fields in frontend User**: ~25 fields
- **Missing in frontend**: ~55 fields
- **Type mismatches**: 3 (dates, required fields, subscription structure)

The frontend `User` interface is significantly incomplete compared to the backend schema. This could lead to:

- Type errors when accessing fields that exist in API responses
- Missing type safety for new features
- Inconsistent data handling

**Recommendation**: Update the frontend `User` interface to include all fields that the API might return, even if they're optional.
