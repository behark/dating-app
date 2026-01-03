# Feature 12 & 13 Testing Guide

## Testing Checklist

### Feature 12: Advanced Interactions

#### Super Like Tests
- [ ] **Free user super like limit**
  - Send 5 super likes → success
  - Send 6th super like → error 429 "Daily limit reached"
  - Verify remaining count decreases: 5/5 → 4/5 → 3/5...

- [ ] **Premium user unlimited**
  - Premium user sends 10+ super likes → all succeed
  - Verify remaining shows -1 (unlimited)

- [ ] **Super like with message**
  - Send super like with optional message → message stored
  - Send super like without message → content field only

- [ ] **Match on super like**
  - User A super likes User B (who previously liked A) → isMatch: true
  - Verify match record created in Swipe model

- [ ] **Duplicate prevention**
  - Super like same user twice → error 400 "Already sent"

- [ ] **Notification sending**
  - Super like sent → notification logged
  - Verify activity recorded in UserActivity

#### Rewind Tests
- [ ] **Free user rewind limit**
  - Rewind 1st swipe → success
  - Attempt rewind 2nd time same day → error 429 "Daily limit reached"

- [ ] **Premium user unlimited**
  - Premium user rewinds 5+ times → all succeed

- [ ] **Rewind functionality**
  - Swipe on profile → status: success
  - Rewind → original Swipe deleted, Rewind record created with success: true
  - Verify user can swipe on same profile again

- [ ] **No swipes to rewind**
  - New user attempts rewind → error 404 "No swipe to rewind"

#### Boost Profile Tests
- [ ] **Free user boost limit**
  - Boost 1st time → success, endsAt set to 30 min from now
  - Attempt boost 2nd time same day → error 429 "Daily limit reached"

- [ ] **Premium user unlimited**
  - Premium user boosts 3+ times → all succeed
  - Verify visibilityMultiplier: 5 (premium) vs 3 (free)

- [ ] **Active boost tracking**
  - Boost profile → user.activeBoostId set
  - Query boost quota → hasActiveBoost: true, endsAt returned
  - Wait 30+ minutes → boost expires, isActive: false

- [ ] **Visibility multiplier in discovery**
  - Boosted user appears higher in explore results
  - Explore response includes isBoosted: true, boostEndsAt

- [ ] **Prevent multiple active boosts**
  - User has active boost, attempts another → error 400 "Already have active boost"

### Feature 13: Discovery Enhancements

#### Explore/Browse Mode Tests
- [ ] **Location-based discovery**
  - Query with lat/lng → users within radius returned
  - Verify distance calculated correctly

- [ ] **Age filter**
  - Query minAge: 25, maxAge: 35 → only users in range
  - Query outside range → no results

- [ ] **Gender filter**
  - Query gender: 'female' → only females returned
  - Query gender: 'any' → all genders

- [ ] **Sort options**
  - sortBy: 'recentActivity' → sorted by lastActivityAt DESC
  - sortBy: 'profileQuality' → sorted by profileCompleteness DESC
  - sortBy: 'verified' → only verified profiles, sorted by activity
  - sortBy: 'boosted' → boosted profiles first

- [ ] **Exclude already swiped**
  - User swiped A, B, C
  - Explore results don't include A, B, C

- [ ] **Exclude self**
  - User's own profile never appears in explore

- [ ] **Pagination**
  - Query limit: 20, skip: 0 → first 20 users
  - Query limit: 20, skip: 20 → next 20 users

#### Top Picks Algorithm Tests
- [ ] **Score calculation**
  - Query top picks → compatibilityScore 0-100
  - scoreBreakdown populated with component scores

- [ ] **Ranking**
  - Highest compatibility scores ranked first (rankPosition 1, 2, 3...)
  - User 1: 92% → position 1
  - User 2: 85% → position 2
  - User 3: 78% → position 3

- [ ] **Freshness**
  - Top picks calculated today → returned
  - Top picks from 2+ days ago → recalculation triggered (background job)

- [ ] **Mark as seen**
  - View top picks → isSeen: false → true
  - seenAt timestamp set

- [ ] **Exclude swiped users**
  - User already swiped on top pick candidate → not included

#### Recently Active Tests
- [ ] **Activity tracking**
  - User logs in → activity logged: 'login'
  - User views profile → activity logged: 'profile_view'
  - User swipes → activity logged: 'swipe'
  - User sends message → activity logged: 'message'

- [ ] **Lookback period**
  - hoursBack: 24 → users active in last 24 hours
  - hoursBack: 48 → users active in last 48 hours

- [ ] **Activity sorting**
  - Recently active returned sorted by lastActivityAt DESC
  - Most recent first

- [ ] **Activity retention**
  - Activity records stored for 90 days
  - Records older than 90 days auto-deleted via TTL index

- [ ] **Exclude swiped users**
  - Recently active list excludes users already swiped

#### Verified Profiles Tests
- [ ] **Verification request**
  - User initiates verification → verificationStatus: 'pending'
  - verificationMethod stored (photo/video/id)

- [ ] **Admin approval**
  - Admin approves user → isProfileVerified: true
  - verificationStatus: 'verified'
  - verificationDate: now

- [ ] **Verified badge display**
  - Verified user profile → badge shown in explore
  - Verified user in top picks → verified indicator

- [ ] **Verified-only filter**
  - Query sort: 'verified' → only isProfileVerified: true users
  - Apply to discover, top picks, recently active

- [ ] **Rejection handling**
  - Admin rejects verification → verificationStatus: 'rejected'
  - User can re-submit after rejection

### Message Media Tests

#### GIF Support
- [ ] **Send GIF**
  - POST /chat/media/gif with gifUrl → success
  - Message type: 'gif', content: 'Sent a GIF'
  - mediaUrl stored, gifId stored in mediaMetadata

- [ ] **GIF search**
  - Search 'love' → results returned
  - Search results paginated with offset/limit

- [ ] **Popular GIFs**
  - GET popular → trending GIFs returned

#### Sticker Support
- [ ] **Send sticker**
  - POST /chat/media/sticker → success
  - Message type: 'sticker'
  - stickerPackId and stickerId stored

- [ ] **Sticker packs**
  - GET /sticker-packs → list of packs with stickers returned

#### Voice Messages
- [ ] **Send voice**
  - Duration 1-300 seconds → success
  - Duration 0 or 301+ → error 400

- [ ] **Voice transcript**
  - POST to transcribe → transcript generated (mock or real)
  - isTranscribed: true

- [ ] **Voice metadata**
  - Language stored
  - Duration tracked
  - Audio file URL stored

#### Video Calls
- [ ] **Initiate call**
  - POST initiate → message created with status: 'pending'
  - callId and initiatorId stored

- [ ] **Call status updates**
  - PUT status 'accepted' → status updated
  - PUT status 'ended' with duration → duration recorded
  - endedAt timestamp set

- [ ] **Call history**
  - Completed calls accessible in message history
  - Duration and status visible

## Test Data Setup

### Create Test Users
```javascript
// User 1 - Free user
{
  name: "Alice",
  email: "alice@test.com",
  age: 25,
  isPremium: false
}

// User 2 - Premium user
{
  name: "Bob",
  email: "bob@test.com",
  age: 28,
  isPremium: true,
  premiumExpiresAt: "2025-12-31"
}

// User 3 - Verified user
{
  name: "Charlie",
  email: "charlie@test.com",
  age: 26,
  isProfileVerified: true,
  verificationStatus: "verified"
}
```

### Reset Test Data Daily
```bash
# Clear daily counters at midnight UTC
npm run test:reset-daily-limits

# Clear all activity logs
npm run test:clear-activities

# Reset all top picks
npm run test:recalculate-top-picks
```

## Manual Testing Flow

### User Flow 1: Super Like Feature
1. Login as free user
2. View profile → see "Super Like" button
3. Click → navigate to SuperLikeScreen
4. Add optional message
5. Send → success message, remaining count shows 4/5
6. Repeat 5 times → last one fails with "Daily limit reached"
7. Upgrade to premium
8. Send 10+ super likes → all succeed, counter shows unlimited

### User Flow 2: Explore Mode
1. Navigate to Explore tab
2. See sort options (Activity, Quality, Verified, Boosted)
3. Apply filters: Age 20-30, Female
4. See grid of matching users
5. Click sort by "Boosted" → boosted profiles first
6. Tap profile → navigate to detailed view
7. See verified badge on verified profiles

### User Flow 3: Top Picks
1. Navigate to Top Picks
2. See compatibility score for current pick
3. See breakdown of why they're a top pick
4. Swipe left/right to see next pick
5. View full profile
6. Like → next pick shown

## Automated Test Examples

```javascript
// Super like test
describe('Super Like', () => {
  it('should limit free users to 5 per day', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/interactions/super-like')
        .set('Authorization', `Bearer ${freeUserToken}`)
        .send({ recipientId: otherId });
      expect(res.status).toBe(201);
    }

    const res6 = await request(app)
      .post('/api/interactions/super-like')
      .set('Authorization', `Bearer ${freeUserToken}`)
      .send({ recipientId: otherId });
    expect(res6.status).toBe(429);
    expect(res6.body.message).toContain('limit reached');
  });

  it('should allow unlimited super likes for premium users', async () => {
    for (let i = 0; i < 15; i++) {
      const res = await request(app)
        .post('/api/interactions/super-like')
        .set('Authorization', `Bearer ${premiumUserToken}`)
        .send({ recipientId: otherId });
      expect(res.status).toBe(201);
    }
  });
});

// Explore test
describe('Explore', () => {
  it('should return users matching filters', async () => {
    const res = await request(app)
      .get('/api/discovery/explore')
      .set('Authorization', `Bearer ${token}`)
      .query({
        lat: 40.7128,
        lng: -74.0060,
        minAge: 25,
        maxAge: 35,
        gender: 'female'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.users).toBeDefined();
    expect(res.body.data.users[0].age).toBeGreaterThanOrEqual(25);
    expect(res.body.data.users[0].age).toBeLessThanOrEqual(35);
  });
});
```

## Performance Testing

### Load Testing
- 1000 concurrent explore queries → response time < 500ms
- 1000 concurrent top picks → response time < 300ms
- 100 simultaneous video call initiations → all succeed within 2s

### Database
- Indexes verified on:
  - superLike: (senderId, createdAt)
  - rewind: (userId, success)
  - boostProfile: (userId, isActive, endsAt)
  - topPicks: (forUserId, rankPosition)
  - userActivity: (userId, createdAt)

## Troubleshooting

### Super Like Not Working
1. Verify user exists
2. Check isPremium status
3. Verify daily limit calculation (UTC midnight reset)
4. Check database indexes

### Explore Not Returning Results
1. Verify location indexes (2dsphere)
2. Check coordinates are valid lat/lng
3. Verify excluded users list is accurate
4. Check query syntax

### Top Picks Not Calculating
1. Verify TopPicks model has records
2. Check algorithm calculation
3. Verify user preferences stored
4. Check score breakdown components

### Activity Not Logging
1. Verify UserActivity model exists
2. Check TTL index on createdAt
3. Verify logging calls in controllers
4. Check database TTL settings
