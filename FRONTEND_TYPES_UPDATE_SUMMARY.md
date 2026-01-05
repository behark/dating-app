# Frontend TypeScript Types Update Summary

## Overview
Updated the frontend `User` interface in `src/types/index.d.ts` to align with the backend Mongoose schema and TypeScript definitions.

## Changes Made

### 1. Fixed Required Fields
- Changed `photos?: Photo[]` → `photos: Photo[]` (required array, can be empty)
- Changed `interests?: string[]` → `interests: string[]` (required array, can be empty)

### 2. Added Missing Core Fields

#### Email & Phone Verification
- `emailVerified` (alias for `isEmailVerified`)
- `emailVerificationToken`
- `emailVerificationTokenExpiry`
- `phoneNumber`
- `isPhoneVerified`
- `phoneVerified` (alias)
- `phoneVerificationCode`
- `phoneVerificationCodeExpiry`

#### Subscription & Premium
- `premiumExpiresAt`
- `subscription` (object with `tier`, `startDate`, `endDate`, `stripeSubscriptionId`, `status`)
- Kept `subscriptionEnd` for backward compatibility (marked as deprecated)

#### Location & Privacy
- `lastLocationUpdate`
- `locationHistoryEnabled`

#### Account Status
- `suspended`
- `suspendedAt`
- `suspendReason`
- `suspensionType`
- `needsReview`
- `appealReason`
- `appealedAt`
- `reportCount`
- `blockedUsers`
- `blockedCount`

#### Profile Verification
- `verificationStatus`
- `verificationMethod`
- `verificationDate`

#### Activity & Engagement
- `isOnline`
- `lastOnlineAt`
- `lastActivityAt`
- `profileViewCount`
- `profileViewedBy`
- `activityScore`
- `totalSwipes`
- `totalMatches`
- `totalConversations`
- `responseRate`
- `profileCompleteness`

#### Enhanced Profile Fields
- `videos` (array of Video objects)
- `profilePrompts` (array of ProfilePrompt objects)
- `education` (Education object)
- `occupation` (Occupation object)
- `height` (Height object)
- `ethnicity` (string array)
- `socialMedia` (SocialMedia object)

#### OAuth
- `oauthProviders` (string array)

### 3. Added Premium Features Fields

#### See Who Liked You
- `receivedLikes` (array of like objects)

#### Passport (Location Override)
- `passportMode` (object with location override settings)

#### Advanced Filters
- `advancedFilters` (object with all filter options)

#### Priority Likes
- `priorityLikesReceived`
- `priorityLikesSent`

#### Ads Control
- `adsPreferences` (object with ad settings)

#### Boost Analytics
- `boostAnalytics` (object with boost performance data)

#### Swipe Stats
- `swipeStats` (object with swipe statistics)

#### Usage Tracking
- `superLikeUsageToday`
- `superLikeResetTime`
- `rewindUsageToday`
- `rewindResetTime`
- `boostUsageToday`
- `boostResetTime`
- `activeBoostId`

### 4. Added Privacy & Compliance Fields
- `privacySettings` (GDPR/CCPA compliance object)

### 5. Added Encryption Fields
- `encryptionPublicKey`
- `encryptionPrivateKeyEncrypted`
- `encryptionKeyVersion`

### 6. Added Gamification Fields
- `gamification` (object with XP, challenges, and achievements)

### 7. Added New Supporting Interfaces

#### Video
```typescript
export interface Video {
  _id?: string;
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  order?: number;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  uploadedAt?: string;
}
```

#### ProfilePrompt
```typescript
export interface ProfilePrompt {
  promptId: string;
  answer: string;
}
```

#### Education
```typescript
export interface Education {
  school?: string;
  degree?: string;
  fieldOfStudy?: string;
  graduationYear?: number;
}
```

#### Occupation
```typescript
export interface Occupation {
  jobTitle?: string;
  company?: string;
  industry?: string;
}
```

#### Height
```typescript
export interface Height {
  value?: number; // in cm
  unit?: 'cm' | 'ft';
}
```

#### SocialMedia
```typescript
export interface SocialMedia {
  spotify?: {
    id?: string;
    username?: string;
    profileUrl?: string;
    isVerified?: boolean;
  };
  instagram?: {
    id?: string;
    username?: string;
    profileUrl?: string;
    isVerified?: boolean;
  };
}
```

#### Subscription
```typescript
export interface Subscription {
  tier?: 'free' | 'gold' | 'platinum' | 'unlimited';
  startDate?: string;
  endDate?: string;
  stripeSubscriptionId?: string;
  status?: 'active' | 'cancelled' | 'expired' | 'past_due';
}
```

#### AgeRange
```typescript
export interface AgeRange {
  min: number;
  max: number;
}
```

### 8. Updated Photo Interface
- Added `_id?: string` field
- Made `order` optional (was required)

### 9. Updated Exports
- Added all new interfaces to the export statement:
  - `AgeRange`
  - `Education`
  - `Height`
  - `Occupation`
  - `ProfilePrompt`
  - `SocialMedia`
  - `Subscription`
  - `Video`

## Type Consistency

### Date Fields
All date fields use `string` type (not `Date`) because:
- JSON serialization converts dates to strings
- Frontend receives dates as ISO strings from the API
- This matches the actual runtime behavior

### Required vs Optional
- Arrays like `photos` and `interests` are now required (non-nullable) but can be empty arrays `[]`
- This matches backend expectations where these fields always exist as arrays

## Statistics

- **Fields added**: ~80+ new fields
- **New interfaces**: 8 supporting interfaces
- **Fields updated**: 2 (photos, interests - made required)
- **Total User interface fields**: ~105 fields (up from ~25)

## Benefits

1. **Type Safety**: Frontend now has complete type definitions matching backend
2. **IntelliSense**: Better autocomplete for all user properties
3. **Error Prevention**: TypeScript will catch missing fields at compile time
4. **Documentation**: Types serve as documentation for available fields
5. **Consistency**: Frontend and backend types are now aligned

## Backward Compatibility

- `subscriptionEnd` field is kept for backward compatibility (marked as deprecated)
- All new fields are optional, so existing code won't break
- `photos` and `interests` are now required arrays, but empty arrays `[]` are valid

## Next Steps

1. **Update API Response Types**: Ensure API responses match these types
2. **Update Components**: Components can now safely access all these fields with type safety
3. **Remove Deprecated Fields**: Consider removing `subscriptionEnd` in a future version
4. **Add Validation**: Consider adding runtime validation for required fields

## Files Modified

- `src/types/index.d.ts` - Updated User interface and added supporting interfaces
