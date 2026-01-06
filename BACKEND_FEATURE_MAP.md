# Backend Feature Map - Complete Analysis

## Executive Summary

This document provides a comprehensive analysis of all backend API endpoints, their usage, and recommendations for improvement.

**Total API Routes Analyzed:** 100+  
**Routes Used by Frontend:** ~45  
**Orphaned Routes:** ~55  
**Missing Critical APIs:** 8  
**Duplicated Logic Areas:** 5  
**Missing Business Rules:** 12

---

## Complete API Feature Map

### 1. Authentication Routes (`/api/auth`)

| Route                                 | Method | Purpose                      | Input                                    | Output                            | Auth Required | Used by Frontend |
| ------------------------------------- | ------ | ---------------------------- | ---------------------------------------- | --------------------------------- | ------------- | ---------------- |
| `/api/auth/register`                  | POST   | Register new user            | `{email, password, name, age?, gender?}` | `{user, authToken, refreshToken}` | No            | ✅ Yes           |
| `/api/auth/login`                     | POST   | User login                   | `{email, password}`                      | `{user, authToken, refreshToken}` | No            | ✅ Yes           |
| `/api/auth/verify-email`              | POST   | Verify email address         | `{token}`                                | `{success, message}`              | No            | ✅ Yes           |
| `/api/auth/forgot-password`           | POST   | Request password reset       | `{email}`                                | `{success, message}`              | No            | ✅ Yes           |
| `/api/auth/reset-password`            | POST   | Reset password               | `{token, newPassword}`                   | `{success, message}`              | No            | ✅ Yes           |
| `/api/auth/refresh-token`             | POST   | Refresh JWT token            | `{refreshToken}`                         | `{authToken, refreshToken}`       | No            | ✅ Yes           |
| `/api/auth/delete-account`            | DELETE | Delete user account          | None                                     | `{success, message}`              | ✅ Yes        | ❌ No            |
| `/api/auth/google`                    | POST   | Google OAuth login           | `{googleId, email}`                      | `{user, authToken, refreshToken}` | No            | ✅ Yes           |
| `/api/auth/facebook`                  | POST   | Facebook OAuth login         | `{facebookId, email}`                    | `{user, authToken, refreshToken}` | No            | ✅ Yes           |
| `/api/auth/apple`                     | POST   | Apple OAuth login            | `{appleId}`                              | `{user, authToken, refreshToken}` | No            | ✅ Yes           |
| `/api/auth/oauth-status`              | GET    | Get OAuth config status      | None                                     | `{google, facebook, apple}`       | No            | ❌ No            |
| `/api/auth/send-phone-verification`   | POST   | Send phone verification code | `{phoneNumber}`                          | `{success, message}`              | ✅ Yes        | ✅ Yes           |
| `/api/auth/verify-phone`              | POST   | Verify phone number          | `{code}`                                 | `{success, message}`              | ✅ Yes        | ✅ Yes           |
| `/api/auth/resend-phone-verification` | POST   | Resend phone verification    | None                                     | `{success, message}`              | ✅ Yes        | ❌ No            |

**Issues:**

- ❌ **Orphaned:** `/api/auth/delete-account`, `/api/auth/oauth-status`, `/api/auth/resend-phone-verification`
- ⚠️ **Missing:** `/api/auth/logout` endpoint (frontend expects it but it doesn't exist)

---

### 2. Profile Routes (`/api/profile`)

| Route                                  | Method | Purpose                    | Input                          | Output         | Auth Required | Used by Frontend |
| -------------------------------------- | ------ | -------------------------- | ------------------------------ | -------------- | ------------- | ---------------- |
| `/api/profile/me`                      | GET    | Get current user's profile | None                           | `{user}`       | ✅ Yes        | ✅ Yes           |
| `/api/profile/:userId`                 | GET    | Get user profile by ID     | `userId` (param)               | `{user}`       | ✅ Yes        | ✅ Yes           |
| `/api/profile/update`                  | PUT    | Update profile             | `{name?, age?, gender?, bio?}` | `{user}`       | ✅ Yes        | ✅ Yes           |
| `/api/profile/photos/upload`           | POST   | Upload photos              | `{photos: [{url}]}`            | `{photos}`     | ✅ Yes        | ✅ Yes           |
| `/api/profile/photos/reorder`          | PUT    | Reorder photos             | `{photoIds: []}`               | `{photos}`     | ✅ Yes        | ✅ Yes           |
| `/api/profile/photos/:photoId`         | DELETE | Delete photo               | `photoId` (param)              | `{photos}`     | ✅ Yes        | ✅ Yes           |
| `/api/profile/photos/:photoId/approve` | PUT    | Approve photo (admin)      | `photoId` (param)              | `{success}`    | ✅ Yes        | ❌ No            |
| `/api/profile/photos/:photoId/reject`  | PUT    | Reject photo (admin)       | `{reason?}`                    | `{success}`    | ✅ Yes        | ❌ No            |
| `/api/profile/admin/photos/pending`    | GET    | Get pending photos (admin) | None                           | `{photos: []}` | ✅ Yes        | ❌ No            |

**Issues:**

- ❌ **Orphaned:** All admin photo moderation endpoints
- ⚠️ **Missing Business Rule:** No validation for photo count limits (max 6) in upload endpoint
- ⚠️ **Missing Business Rule:** No photo quality/content validation

---

### 3. Enhanced Profile Routes (`/api/profile/enhanced`)

| Route                                  | Method | Purpose                | Input                                                | Output          | Auth Required | Used by Frontend |
| -------------------------------------- | ------ | ---------------------- | ---------------------------------------------------- | --------------- | ------------- | ---------------- |
| `/api/profile/enhanced/prompts/list`   | GET    | Get available prompts  | None                                                 | `{prompts: []}` | No            | ❌ No            |
| `/api/profile/enhanced/prompts/update` | PUT    | Update profile prompts | `{prompts: [{promptId, answer}]}`                    | `{success}`     | ✅ Yes        | ❌ No            |
| `/api/profile/enhanced/education`      | PUT    | Update education       | `{school?, degree?, fieldOfStudy?, graduationYear?}` | `{success}`     | ✅ Yes        | ❌ No            |
| `/api/profile/enhanced/occupation`     | PUT    | Update occupation      | `{jobTitle?, company?, industry?}`                   | `{success}`     | ✅ Yes        | ❌ No            |
| `/api/profile/enhanced/height`         | PUT    | Update height          | `{value, unit: 'cm'\|'ft'}`                          | `{success}`     | ✅ Yes        | ❌ No            |
| `/api/profile/enhanced/ethnicity`      | PUT    | Update ethnicity       | `{ethnicity: []}`                                    | `{success}`     | ✅ Yes        | ❌ No            |

**Issues:**

- ❌ **Orphaned:** All enhanced profile endpoints are unused by frontend
- ⚠️ **Missing:** Frontend may need these for profile completion features

---

### 4. Discovery Routes (`/api/discover`)

| Route                    | Method | Purpose                    | Input                   | Output               | Auth Required | Used by Frontend |
| ------------------------ | ------ | -------------------------- | ----------------------- | -------------------- | ------------- | ---------------- |
| `/api/discover`          | GET    | Discover users by location | `?lat=&lng=&radius=`    | `{users: [], count}` | ⚠️ Mock       | ✅ Yes           |
| `/api/discover/settings` | GET    | Get discovery preferences  | None                    | `{settings}`         | ⚠️ Mock       | ❌ No            |
| `/api/discover/location` | PUT    | Update user location       | `{latitude, longitude}` | `{success}`          | ⚠️ Mock       | ❌ No            |

**Issues:**

- ⚠️ **CRITICAL:** Uses mock authentication instead of real auth middleware
- ❌ **Orphaned:** Settings and location update endpoints
- ⚠️ **Missing:** Discovery filters (age, gender, distance) not exposed as separate endpoint

---

### 5. Discovery Enhancements Routes (`/api/discovery`)

| Route                                 | Method | Purpose                      | Input                  | Output           | Auth Required | Used by Frontend |
| ------------------------------------- | ------ | ---------------------------- | ---------------------- | ---------------- | ------------- | ---------------- |
| `/api/discovery/explore`              | GET    | Explore users with filters   | Query params           | `{users: []}`    | ✅ Yes        | ✅ Yes           |
| `/api/discovery/top-picks`            | GET    | Get top picks (algorithm)    | `?limit=`              | `{topPicks: []}` | ✅ Yes        | ✅ Yes           |
| `/api/discovery/recently-active`      | GET    | Get recently active users    | `?hoursBack=&limit=`   | `{users: []}`    | ✅ Yes        | ✅ Yes           |
| `/api/discovery/verified`             | GET    | Get verified profiles        | Query params           | `{users: []}`    | ✅ Yes        | ✅ Yes           |
| `/api/discovery/verify-profile`       | POST   | Request profile verification | `{verificationMethod}` | `{success}`      | ✅ Yes        | ✅ Yes           |
| `/api/discovery/approve-verification` | POST   | Approve verification (admin) | `{userId}`             | `{success}`      | ✅ Yes        | ❌ No            |

**Issues:**

- ⚠️ **Duplication:** `/api/discover` and `/api/discovery/explore` have overlapping functionality
- ❌ **Orphaned:** Admin approval endpoint

---

### 6. Swipe Routes (`/api/swipes`)

| Route                          | Method | Purpose                 | Input                             | Output                                              | Auth Required | Used by Frontend |
| ------------------------------ | ------ | ----------------------- | --------------------------------- | --------------------------------------------------- | ------------- | ---------------- |
| `/api/swipes`                  | POST   | Create swipe            | `{targetId, action, isPriority?}` | `{swipeId, action, isMatch, matchData?, remaining}` | ✅ Yes        | ✅ Yes           |
| `/api/swipes/count/today`      | GET    | Get today's swipe count | None                              | `{count, limit, remaining}`                         | ✅ Yes        | ❌ No            |
| `/api/swipes/undo`             | POST   | Undo last swipe         | `{swipeId}`                       | `{success}`                                         | ✅ Yes        | ❌ No            |
| `/api/swipes/user`             | GET    | Get user's swipes       | None                              | `{swipes: []}`                                      | ✅ Yes        | ❌ No            |
| `/api/swipes/received`         | GET    | Get received swipes     | None                              | `{swipes: []}`                                      | ✅ Yes        | ❌ No            |
| `/api/swipes/stats`            | GET    | Get swipe statistics    | None                              | `{stats}`                                           | ✅ Yes        | ❌ No            |
| `/api/swipes/pending-likes`    | GET    | Get pending likes       | None                              | `{likes: [], count}`                                | ✅ Yes        | ❌ No            |
| `/api/swipes/matches`          | GET    | Get all matches         | `?status=&limit=&skip=&sortBy=`   | `{matches: []}`                                     | ✅ Yes        | ✅ Yes           |
| `/api/swipes/matches/:matchId` | DELETE | Unmatch with user       | `matchId` (param)                 | `{success}`                                         | ✅ Yes        | ✅ Yes           |

**Issues:**

- ❌ **Orphaned:** Most swipe endpoints except create, matches, and unmatch
- ⚠️ **Missing Business Rule:** No rate limiting on undo (could be abused)
- ⚠️ **Missing:** Frontend may need pending-likes for premium features

---

### 7. Chat Routes (`/api/chat`)

| Route                                       | Method | Purpose                  | Input                            | Output                | Auth Required | Used by Frontend |
| ------------------------------------------- | ------ | ------------------------ | -------------------------------- | --------------------- | ------------- | ---------------- |
| `/api/chat/conversations`                   | GET    | Get all conversations    | None                             | `{conversations: []}` | ⚠️ Mock       | ✅ Yes           |
| `/api/chat/unread`                          | GET    | Get unread count         | None                             | `{count}`             | ⚠️ Mock       | ❌ No            |
| `/api/chat/messages/:matchId`               | GET    | Get messages for match   | `matchId` (param)                | `{messages: []}`      | ⚠️ Mock       | ✅ Yes           |
| `/api/chat/messages/:matchId/read`          | PUT    | Mark messages as read    | `matchId` (param)                | `{success}`           | ⚠️ Mock       | ❌ No            |
| `/api/chat/messages/:messageId/read-single` | PUT    | Mark single message read | `messageId` (param)              | `{success}`           | ⚠️ Mock       | ❌ No            |
| `/api/chat/receipts/:matchId`               | GET    | Get read receipts        | `matchId` (param)                | `{receipts: []}`      | ⚠️ Mock       | ❌ No            |
| `/api/chat/messages/encrypted`              | POST   | Send encrypted message   | `{matchId, content, encryption}` | `{message}`           | ⚠️ Mock       | ❌ No            |
| `/api/chat/messages/:messageId`             | DELETE | Delete message           | `messageId` (param)              | `{success}`           | ⚠️ Mock       | ❌ No            |

**Issues:**

- ⚠️ **CRITICAL:** All routes use mock authentication instead of real auth
- ❌ **Orphaned:** Most chat endpoints except conversations and messages
- ⚠️ **Missing:** Socket.io handles message sending, but no REST endpoint for it
- ⚠️ **Missing Business Rule:** No message length validation

---

### 8. Media Messages Routes (`/api/chat/media`)

| Route                                 | Method | Purpose             | Input                  | Output             | Auth Required | Used by Frontend |
| ------------------------------------- | ------ | ------------------- | ---------------------- | ------------------ | ------------- | ---------------- |
| `/api/chat/media/gif`                 | POST   | Send GIF message    | `{matchId, gifUrl}`    | `{message}`        | ✅ Yes        | ❌ No            |
| `/api/chat/media/gifs/popular`        | GET    | Get popular GIFs    | None                   | `{gifs: []}`       | ✅ Yes        | ❌ No            |
| `/api/chat/media/gifs/search`         | GET    | Search GIFs         | `?query=`              | `{gifs: []}`       | ✅ Yes        | ❌ No            |
| `/api/chat/media/sticker`             | POST   | Send sticker        | `{matchId, stickerId}` | `{message}`        | ✅ Yes        | ❌ No            |
| `/api/chat/media/sticker-packs`       | GET    | Get sticker packs   | None                   | `{packs: []}`      | ✅ Yes        | ❌ No            |
| `/api/chat/media/voice`               | POST   | Send voice message  | `{matchId, audioUrl}`  | `{message}`        | ✅ Yes        | ❌ No            |
| `/api/chat/media/voice/transcribe`    | POST   | Transcribe voice    | `{audioUrl}`           | `{transcription}`  | ✅ Yes        | ❌ No            |
| `/api/chat/media/video-call/initiate` | POST   | Initiate video call | `{matchId}`            | `{callId, roomId}` | ✅ Yes        | ❌ No            |
| `/api/chat/media/video-call/status`   | PUT    | Update call status  | `{callId, status}`     | `{success}`        | ✅ Yes        | ❌ No            |

**Issues:**

- ❌ **Orphaned:** All media message endpoints are unused
- ⚠️ **Missing:** Frontend may need these for rich messaging features

---

### 9. Notifications Routes (`/api/notifications`)

| Route                            | Method | Purpose                      | Input                                 | Output          | Auth Required | Used by Frontend |
| -------------------------------- | ------ | ---------------------------- | ------------------------------------- | --------------- | ------------- | ---------------- |
| `/api/notifications/preferences` | GET    | Get notification preferences | None                                  | `{preferences}` | ✅ Yes        | ❌ No            |
| `/api/notifications/preferences` | PUT    | Update preferences           | `{preferences}`                       | `{success}`     | ✅ Yes        | ❌ No            |
| `/api/notifications/send`        | POST   | Send notification (admin)    | `{userId, type, title, message}`      | `{success}`     | ✅ Yes        | ❌ No            |
| `/api/notifications/send-bulk`   | POST   | Send bulk notifications      | `{userIds: [], type, title, message}` | `{success}`     | ✅ Yes        | ❌ No            |
| `/api/notifications/enable`      | PUT    | Enable all notifications     | None                                  | `{success}`     | ✅ Yes        | ❌ No            |
| `/api/notifications/disable`     | PUT    | Disable all notifications    | None                                  | `{success}`     | ✅ Yes        | ❌ No            |

**Issues:**

- ❌ **Orphaned:** All notification endpoints
- ⚠️ **Missing:** Frontend needs endpoints to fetch notification list and mark as read

---

### 10. Premium Routes (`/api/premium`)

| Route                                   | Method | Purpose                      | Input                   | Output                | Auth Required | Used by Frontend |
| --------------------------------------- | ------ | ---------------------------- | ----------------------- | --------------------- | ------------- | ---------------- |
| `/api/premium/subscription/status`      | GET    | Get subscription status      | None                    | `{subscription}`      | ✅ Yes        | ❌ No            |
| `/api/premium/subscription/trial/start` | POST   | Start free trial             | None                    | `{subscription}`      | ✅ Yes        | ❌ No            |
| `/api/premium/subscription/upgrade`     | POST   | Upgrade to premium           | `{tierId}`              | `{subscription}`      | ✅ Yes        | ❌ No            |
| `/api/premium/subscription/cancel`      | POST   | Cancel subscription          | None                    | `{success}`           | ✅ Yes        | ❌ No            |
| `/api/premium/likes/received`           | GET    | Get received likes (premium) | None                    | `{likes: []}`         | ✅ Yes        | ❌ No            |
| `/api/premium/passport/status`          | GET    | Get passport status          | None                    | `{enabled, location}` | ✅ Yes        | ❌ No            |
| `/api/premium/passport/location`        | POST   | Set passport location        | `{latitude, longitude}` | `{success}`           | ✅ Yes        | ❌ No            |
| `/api/premium/passport/disable`         | POST   | Disable passport             | None                    | `{success}`           | ✅ Yes        | ❌ No            |
| `/api/premium/filters/options`          | GET    | Get advanced filter options  | None                    | `{filters}`           | ✅ Yes        | ❌ No            |
| `/api/premium/filters/update`           | POST   | Update advanced filters      | `{filters}`             | `{success}`           | ✅ Yes        | ❌ No            |
| `/api/premium/likes/priority`           | POST   | Send priority like           | `{targetId}`            | `{success}`           | ✅ Yes        | ❌ No            |
| `/api/premium/ads/preferences`          | POST   | Update ads preferences       | `{showAds: boolean}`    | `{success}`           | ✅ Yes        | ❌ No            |
| `/api/premium/analytics/boosts`         | GET    | Get boost analytics          | None                    | `{analytics}`         | ✅ Yes        | ❌ No            |
| `/api/premium/analytics/boost-session`  | POST   | Record boost session         | `{sessionData}`         | `{success}`           | ✅ Yes        | ❌ No            |

**Issues:**

- ❌ **Orphaned:** All premium endpoints are unused
- ⚠️ **Missing:** Frontend may need these for premium features

---

### 11. Payment Routes (`/api/payment`)

| Route                                       | Method | Purpose                      | Input                                        | Output                             | Auth Required | Used by Frontend |
| ------------------------------------------- | ------ | ---------------------------- | -------------------------------------------- | ---------------------------------- | ------------- | ---------------- |
| `/api/payment/tiers`                        | GET    | Get subscription tiers       | None                                         | `{tiers: []}`                      | No            | ✅ Yes           |
| `/api/payment/status`                       | GET    | Get payment status           | None                                         | `{status}`                         | ✅ Yes        | ✅ Yes           |
| `/api/payment/history`                      | GET    | Get billing history          | None                                         | `{invoices: [], transactions: []}` | ✅ Yes        | ✅ Yes           |
| `/api/payment/stripe/checkout`              | POST   | Create Stripe checkout       | `{planType}`                                 | `{url}`                            | ✅ Yes        | ✅ Yes           |
| `/api/payment/stripe/payment-intent`        | POST   | Create payment intent        | `{productType, productId, quantity}`         | `{clientSecret}`                   | ✅ Yes        | ✅ Yes           |
| `/api/payment/stripe/setup-intent`          | POST   | Create setup intent          | None                                         | `{clientSecret}`                   | ✅ Yes        | ❌ No            |
| `/api/payment/stripe/portal`                | GET    | Get customer portal URL      | None                                         | `{url}`                            | ✅ Yes        | ✅ Yes           |
| `/api/payment/paypal/subscription`          | POST   | Create PayPal subscription   | `{planType}`                                 | `{approvalUrl}`                    | ✅ Yes        | ✅ Yes           |
| `/api/payment/paypal/subscription/activate` | POST   | Activate PayPal subscription | `{subscriptionId}`                           | `{success}`                        | ✅ Yes        | ✅ Yes           |
| `/api/payment/paypal/order`                 | POST   | Create PayPal order          | `{productType, productId, quantity}`         | `{approvalUrl}`                    | ✅ Yes        | ✅ Yes           |
| `/api/payment/paypal/order/capture`         | POST   | Capture PayPal order         | `{orderId}`                                  | `{success}`                        | ✅ Yes        | ✅ Yes           |
| `/api/payment/apple/validate`               | POST   | Validate Apple receipt       | `{receiptData, productId}`                   | `{success}`                        | ✅ Yes        | ✅ Yes           |
| `/api/payment/apple/restore`                | POST   | Restore Apple purchases      | `{receiptData}`                              | `{purchases: []}`                  | ✅ Yes        | ✅ Yes           |
| `/api/payment/google/validate`              | POST   | Validate Google purchase     | `{purchaseToken, productId, isSubscription}` | `{success}`                        | ✅ Yes        | ✅ Yes           |
| `/api/payment/google/restore`               | POST   | Restore Google purchases     | `{purchases: []}`                            | `{purchases: []}`                  | ✅ Yes        | ✅ Yes           |
| `/api/payment/subscription/cancel`          | POST   | Cancel subscription          | `{immediately?}`                             | `{success}`                        | ✅ Yes        | ✅ Yes           |
| `/api/payment/subscription/resume`          | POST   | Resume subscription          | None                                         | `{success}`                        | ✅ Yes        | ✅ Yes           |
| `/api/payment/refund/request`               | POST   | Request refund               | `{transactionId, reason, amount}`            | `{success}`                        | ✅ Yes        | ✅ Yes           |
| `/api/payment/webhooks/stripe`              | POST   | Stripe webhook               | Webhook payload                              | `{success}`                        | No            | ❌ No            |
| `/api/payment/webhooks/paypal`              | POST   | PayPal webhook               | Webhook payload                              | `{success}`                        | No            | ❌ No            |
| `/api/payment/webhooks/apple`               | POST   | Apple webhook                | Webhook payload                              | `{success}`                        | No            | ❌ No            |
| `/api/payment/webhooks/google`              | POST   | Google webhook               | Webhook payload                              | `{success}`                        | No            | ❌ No            |

**Issues:**

- ✅ **Well Used:** Payment routes are properly integrated
- ⚠️ **Missing Business Rule:** No validation for refund eligibility (time limits, etc.)

---

### 12. Safety Routes (`/api/safety`)

| Route                                             | Method | Purpose                      | Input                                      | Output                   | Auth Required | Used by Frontend |
| ------------------------------------------------- | ------ | ---------------------------- | ------------------------------------------ | ------------------------ | ------------- | ---------------- |
| `/api/safety/report`                              | POST   | Report user                  | `{reportedUserId, category, description}`  | `{success, reportId}`    | ✅ Yes        | ❌ No            |
| `/api/safety/reports`                             | GET    | Get reports (admin)          | None                                       | `{reports: []}`          | ✅ Yes        | ❌ No            |
| `/api/safety/reports/:reportId/review`            | PUT    | Review report (admin)        | `{status, action}`                         | `{success}`              | ✅ Yes        | ❌ No            |
| `/api/safety/block`                               | POST   | Block user                   | `{blockedUserId}`                          | `{success}`              | ✅ Yes        | ❌ No            |
| `/api/safety/block/:blockedUserId`                | DELETE | Unblock user                 | `blockedUserId` (param)                    | `{success}`              | ✅ Yes        | ❌ No            |
| `/api/safety/blocked`                             | GET    | Get blocked users            | None                                       | `{blockedUsers: []}`     | ✅ Yes        | ❌ No            |
| `/api/safety/blocked/:otherUserId`                | GET    | Check if blocked             | `otherUserId` (param)                      | `{isBlocked}`            | ✅ Yes        | ❌ No            |
| `/api/safety/flag`                                | POST   | Flag content                 | `{contentType, contentId, reason}`         | `{success}`              | ✅ Yes        | ❌ No            |
| `/api/safety/safety-score/:userId`                | GET    | Get safety score (admin)     | `userId` (param)                           | `{score}`                | ✅ Yes        | ❌ No            |
| `/api/safety/tips`                                | GET    | Get safety tips              | None                                       | `{tips: []}`             | No            | ❌ No            |
| `/api/safety/suspend/:userId`                     | PUT    | Suspend user (admin)         | `userId` (param)                           | `{success}`              | ✅ Yes        | ❌ No            |
| `/api/safety/unsuspend/:userId`                   | PUT    | Unsuspend user (admin)       | `userId` (param)                           | `{success}`              | ✅ Yes        | ❌ No            |
| `/api/safety/account-status`                      | GET    | Get account status           | None                                       | `{status, restrictions}` | ✅ Yes        | ❌ No            |
| `/api/safety/appeal`                              | POST   | Appeal suspension            | `{reason}`                                 | `{success}`              | ✅ Yes        | ❌ No            |
| `/api/safety/date-plan`                           | POST   | Share date plan              | `{matchUserId, location, dateTime, notes}` | `{success}`              | ✅ Yes        | ❌ No            |
| `/api/safety/date-plans/active`                   | GET    | Get active date plans        | None                                       | `{plans: []}`            | ✅ Yes        | ❌ No            |
| `/api/safety/checkin/start`                       | POST   | Start check-in timer         | `{datePlanId, duration?}`                  | `{checkInId}`            | ✅ Yes        | ❌ No            |
| `/api/safety/checkin/:checkInId/complete`         | POST   | Complete check-in            | `checkInId` (param)                        | `{success}`              | ✅ Yes        | ❌ No            |
| `/api/safety/sos`                                 | POST   | Send emergency SOS           | `{location, message?}`                     | `{sosAlertId}`           | ✅ Yes        | ❌ No            |
| `/api/safety/sos/active`                          | GET    | Get active SOS               | None                                       | `{alerts: []}`           | ✅ Yes        | ❌ No            |
| `/api/safety/sos/:sosAlertId/respond`             | POST   | Respond to SOS               | `{message?, confirmedSafe?}`               | `{success}`              | ✅ Yes        | ❌ No            |
| `/api/safety/sos/:sosAlertId/resolve`             | PUT    | Resolve SOS                  | `sosAlertId` (param)                       | `{success}`              | ✅ Yes        | ❌ No            |
| `/api/safety/background-check`                    | POST   | Initiate background check    | `{userInfo}`                               | `{backgroundCheckId}`    | ✅ Yes        | ❌ No            |
| `/api/safety/background-check/:backgroundCheckId` | GET    | Get check status             | `backgroundCheckId` (param)                | `{status, results}`      | ✅ Yes        | ❌ No            |
| `/api/safety/emergency-contact`                   | POST   | Add emergency contact        | `{name, phone, relationship}`              | `{success}`              | ✅ Yes        | ❌ No            |
| `/api/safety/emergency-contacts`                  | GET    | Get emergency contacts       | None                                       | `{contacts: []}`         | ✅ Yes        | ❌ No            |
| `/api/safety/emergency-contact/:contactId`        | DELETE | Delete emergency contact     | `contactId` (param)                        | `{success}`              | ✅ Yes        | ❌ No            |
| `/api/safety/photo-verification/advanced`         | POST   | Submit advanced verification | `{photoUri, livenessData}`                 | `{verificationId}`       | ✅ Yes        | ❌ No            |

**Issues:**

- ❌ **Orphaned:** All safety endpoints are unused (frontend uses Firebase directly)
- ⚠️ **CRITICAL:** Frontend SafetyService uses Firebase instead of backend APIs
- ⚠️ **Missing Business Rule:** No automatic suspension thresholds based on report count

---

### 13. Activity Routes (`/api/activity`)

| Route                                 | Method | Purpose                    | Input                 | Output                 | Auth Required | Used by Frontend |
| ------------------------------------- | ------ | -------------------------- | --------------------- | ---------------------- | ------------- | ---------------- |
| `/api/activity/update-online-status`  | POST   | Update online status       | `{isOnline: boolean}` | `{success}`            | ✅ Yes        | ❌ No            |
| `/api/activity/online-status/:userId` | GET    | Get user's online status   | `userId` (param)      | `{isOnline, lastSeen}` | ✅ Yes        | ❌ No            |
| `/api/activity/view-profile/:userId`  | POST   | Record profile view        | `userId` (param)      | `{success}`            | ✅ Yes        | ❌ No            |
| `/api/activity/profile-views`         | GET    | Get profile views          | None                  | `{views: []}`          | ✅ Yes        | ❌ No            |
| `/api/activity/status`                | POST   | Get multiple users' status | `{userIds: []}`       | `{statuses: []}`       | ✅ Yes        | ❌ No            |
| `/api/activity/heartbeat`             | POST   | Keep user active           | None                  | `{success}`            | ✅ Yes        | ❌ No            |

**Issues:**

- ❌ **Orphaned:** All activity endpoints are unused
- ⚠️ **Missing:** Frontend may need these for "who viewed me" premium feature

---

### 14. Social Media Routes (`/api/social-media`)

| Route                                    | Method | Purpose                 | Input                                  | Output                   | Auth Required | Used by Frontend |
| ---------------------------------------- | ------ | ----------------------- | -------------------------------------- | ------------------------ | ------------- | ---------------- |
| `/api/social-media/connect-spotify`      | POST   | Connect Spotify         | `{spotifyId, username, profileUrl?}`   | `{success}`              | ✅ Yes        | ❌ No            |
| `/api/social-media/connect-instagram`    | POST   | Connect Instagram       | `{instagramId, username, profileUrl?}` | `{success}`              | ✅ Yes        | ❌ No            |
| `/api/social-media/disconnect-spotify`   | DELETE | Disconnect Spotify      | None                                   | `{success}`              | ✅ Yes        | ❌ No            |
| `/api/social-media/disconnect-instagram` | DELETE | Disconnect Instagram    | None                                   | `{success}`              | ✅ Yes        | ❌ No            |
| `/api/social-media/:userId/social-media` | GET    | Get user's social media | `userId` (param)                       | `{spotify?, instagram?}` | ✅ Yes        | ❌ No            |

**Issues:**

- ❌ **Orphaned:** All social media endpoints are unused

---

### 15. AI Routes (`/api/ai`)

| Route                                         | Method | Purpose                   | Input                           | Output                  | Auth Required | Used by Frontend |
| --------------------------------------------- | ------ | ------------------------- | ------------------------------- | ----------------------- | ------------- | ---------------- |
| `/api/ai/icebreaker`                          | POST   | Generate icebreaker       | `{matchId? or targetUserId}`    | `{suggestions: []}`     | ✅ Yes        | ❌ No            |
| `/api/ai/smart-photos/:userId`                | GET    | Get photo recommendations | `userId` (param)                | `{recommendations: []}` | ✅ Yes        | ❌ No            |
| `/api/ai/bio-suggestions`                     | POST   | Generate bio suggestions  | `{currentBio?}`                 | `{suggestions: []}`     | ✅ Yes        | ❌ No            |
| `/api/ai/compatibility/:userId/:targetUserId` | GET    | Calculate compatibility   | `userId, targetUserId` (params) | `{score, factors}`      | ✅ Yes        | ❌ No            |
| `/api/ai/conversation-starters`               | POST   | Get conversation starters | `{matchId?}`                    | `{starters: []}`        | ✅ Yes        | ❌ No            |
| `/api/ai/analyze-photo`                       | POST   | Analyze photo quality     | `{photoUrl}`                    | `{analysis}`            | ✅ Yes        | ❌ No            |
| `/api/ai/personalized-matches/:userId`        | GET    | Get personalized matches  | `userId` (param)                | `{matches: []}`         | ✅ Yes        | ❌ No            |
| `/api/ai/profile-suggestions/:userId`         | GET    | Get profile suggestions   | `userId` (param)                | `{suggestions: []}`     | ✅ Yes        | ❌ No            |
| `/api/ai/conversation-insights/:userId`       | GET    | Get conversation insights | `userId` (param)                | `{insights}`            | ✅ Yes        | ❌ No            |

**Issues:**

- ❌ **Orphaned:** All AI endpoints are unused
- ⚠️ **Missing:** Frontend may need these for AI-powered features

---

### 16. Advanced Interactions Routes (`/api/interactions`)

| Route                                | Method | Purpose              | Input        | Output                 | Auth Required | Used by Frontend |
| ------------------------------------ | ------ | -------------------- | ------------ | ---------------------- | ------------- | ---------------- |
| `/api/interactions/super-like`       | POST   | Send super like      | `{targetId}` | `{success, remaining}` | ✅ Yes        | ❌ No            |
| `/api/interactions/super-like-quota` | GET    | Get super like quota | None         | `{quota, remaining}`   | ✅ Yes        | ❌ No            |
| `/api/interactions/rewind`           | POST   | Rewind last swipe    | None         | `{success, remaining}` | ✅ Yes        | ❌ No            |
| `/api/interactions/rewind-quota`     | GET    | Get rewind quota     | None         | `{quota, remaining}`   | ✅ Yes        | ❌ No            |
| `/api/interactions/boost`            | POST   | Boost profile        | None         | `{success, expiresAt}` | ✅ Yes        | ❌ No            |
| `/api/interactions/boost-quota`      | GET    | Get boost quota      | None         | `{quota, remaining}`   | ✅ Yes        | ❌ No            |

**Issues:**

- ❌ **Orphaned:** All advanced interaction endpoints are unused
- ⚠️ **Missing Business Rule:** No cooldown period for boosts
- ⚠️ **Missing Business Rule:** No validation that user has quota before allowing action

---

### 17. Gamification Routes (`/api/gamification`)

| Route                                                            | Method | Purpose                        | Input                            | Output                   | Auth Required | Used by Frontend |
| ---------------------------------------------------------------- | ------ | ------------------------------ | -------------------------------- | ------------------------ | ------------- | ---------------- |
| `/api/gamification/streaks/track`                                | POST   | Track swipe                    | None                             | `{success}`              | ✅ Yes        | ❌ No            |
| `/api/gamification/streaks/:userId`                              | GET    | Get swipe streak               | `userId` (param)                 | `{streak, longest}`      | ✅ Yes        | ❌ No            |
| `/api/gamification/leaderboards/streaks`                         | GET    | Get streak leaderboard         | None                             | `{leaderboard: []}`      | ✅ Yes        | ❌ No            |
| `/api/gamification/leaderboards/longest-streaks`                 | GET    | Get longest streak leaderboard | None                             | `{leaderboard: []}`      | ✅ Yes        | ❌ No            |
| `/api/gamification/badges/award`                                 | POST   | Award badge (admin)            | `{userId, badgeId}`              | `{success}`              | ✅ Yes        | ❌ No            |
| `/api/gamification/badges/:userId`                               | GET    | Get user badges                | `userId` (param)                 | `{badges: []}`           | ✅ Yes        | ❌ No            |
| `/api/gamification/badges/:userId/update`                        | POST   | Update badges                  | `userId` (param)                 | `{badges: []}`           | ✅ Yes        | ❌ No            |
| `/api/gamification/rewards/:userId`                              | GET    | Get daily reward               | `userId` (param)                 | `{reward, claimed}`      | ✅ Yes        | ❌ No            |
| `/api/gamification/rewards/:rewardId/claim`                      | POST   | Claim reward                   | `rewardId` (param)               | `{success}`              | ✅ Yes        | ❌ No            |
| `/api/gamification/stats/:userId`                                | GET    | Get gamification stats         | `userId` (param)                 | `{stats}`                | ✅ Yes        | ❌ No            |
| `/api/gamification/levels/:userId`                               | GET    | Get user level                 | `userId` (param)                 | `{level, xp, nextLevel}` | ✅ Yes        | ❌ No            |
| `/api/gamification/levels/add-xp`                                | POST   | Add XP                         | `{userId, amount, reason}`       | `{success}`              | ✅ Yes        | ❌ No            |
| `/api/gamification/levels/:level/rewards`                        | GET    | Get level rewards              | `level` (param)                  | `{rewards: []}`          | ✅ Yes        | ❌ No            |
| `/api/gamification/challenges/daily/:userId`                     | GET    | Get daily challenges           | `userId` (param)                 | `{challenges: []}`       | ✅ Yes        | ❌ No            |
| `/api/gamification/challenges/progress`                          | POST   | Update challenge progress      | `{challengeId, progress}`        | `{success}`              | ✅ Yes        | ❌ No            |
| `/api/gamification/challenges/track`                             | POST   | Track action for challenges    | `{action, metadata}`             | `{success}`              | ✅ Yes        | ❌ No            |
| `/api/gamification/challenges/claim`                             | POST   | Claim challenge reward         | `{challengeId}`                  | `{success}`              | ✅ Yes        | ❌ No            |
| `/api/gamification/challenges/bonus/:userId`                     | GET    | Get completion bonus           | `userId` (param)                 | `{bonus}`                | ✅ Yes        | ❌ No            |
| `/api/gamification/challenges/bonus/:userId/claim`               | POST   | Claim completion bonus         | `userId` (param)                 | `{success}`              | ✅ Yes        | ❌ No            |
| `/api/gamification/achievements/:userId`                         | GET    | Get user achievements          | `userId` (param)                 | `{achievements: []}`     | ✅ Yes        | ❌ No            |
| `/api/gamification/achievements/check`                           | POST   | Check and unlock achievements  | `{userId}`                       | `{unlocked: []}`         | ✅ Yes        | ❌ No            |
| `/api/gamification/achievements/unlock`                          | POST   | Unlock achievement             | `{userId, achievementId}`        | `{success}`              | ✅ Yes        | ❌ No            |
| `/api/gamification/achievements/:userId/:achievementId/progress` | GET    | Get achievement progress       | `userId, achievementId` (params) | `{progress}`             | ✅ Yes        | ❌ No            |
| `/api/gamification/achievements/:userId/recent`                  | GET    | Get recent achievements        | `userId` (param)                 | `{achievements: []}`     | ✅ Yes        | ❌ No            |

**Issues:**

- ❌ **Orphaned:** All gamification endpoints are unused
- ⚠️ **Missing:** Frontend may need these for engagement features

---

### 18. Social Features Routes (`/api/social`)

| Route                                        | Method | Purpose                     | Input                                     | Output              | Auth Required | Used by Frontend |
| -------------------------------------------- | ------ | --------------------------- | ----------------------------------------- | ------------------- | ------------- | ---------------- |
| `/api/social/group-dates`                    | POST   | Create group date           | `{location, dateTime, maxParticipants}`   | `{groupDateId}`     | ✅ Yes        | ❌ No            |
| `/api/social/group-dates/:groupDateId/join`  | POST   | Join group date             | `groupDateId` (param)                     | `{success}`         | ✅ Yes        | ❌ No            |
| `/api/social/group-dates/:groupDateId/leave` | POST   | Leave group date            | `groupDateId` (param)                     | `{success}`         | ✅ Yes        | ❌ No            |
| `/api/social/group-dates/nearby`             | GET    | Get nearby group dates      | `?lat=&lng=&radius=`                      | `{groupDates: []}`  | ✅ Yes        | ❌ No            |
| `/api/social/reviews`                        | POST   | Create friend review        | `{reviewedUserId, rating, comment}`       | `{reviewId}`        | ✅ Yes        | ❌ No            |
| `/api/social/reviews/:userId`                | GET    | Get user reviews            | `userId` (param)                          | `{reviews: []}`     | ✅ Yes        | ❌ No            |
| `/api/social/events`                         | POST   | Create event                | `{name, location, dateTime, description}` | `{eventId}`         | ✅ Yes        | ❌ No            |
| `/api/social/events/:eventId/register`       | POST   | Register for event          | `eventId` (param)                         | `{success}`         | ✅ Yes        | ❌ No            |
| `/api/social/events/nearby`                  | GET    | Get nearby events           | `?lat=&lng=&radius=`                      | `{events: []}`      | ✅ Yes        | ❌ No            |
| `/api/social/share-profile/:userId`          | POST   | Create shareable link       | `userId` (param)                          | `{shareToken, url}` | ✅ Yes        | ❌ No            |
| `/api/social/share-profile/:userId/with`     | POST   | Share profile with someone  | `{recipientId}`                           | `{success}`         | ✅ Yes        | ❌ No            |
| `/api/social/shared-profile/:shareToken`     | GET    | Get shared profile (public) | `shareToken` (param)                      | `{profile}`         | No            | ❌ No            |
| `/api/social/share-profile/:userId/links`    | GET    | Get user's share links      | `userId` (param)                          | `{links: []}`       | ✅ Yes        | ❌ No            |
| `/api/social/share-profile/:shareToken`      | DELETE | Deactivate share link       | `shareToken` (param)                      | `{success}`         | ✅ Yes        | ❌ No            |

**Issues:**

- ❌ **Orphaned:** All social features endpoints are unused

---

### 19. Privacy Routes (`/api/privacy`)

| Route                         | Method | Purpose                     | Input        | Output          | Auth Required | Used by Frontend |
| ----------------------------- | ------ | --------------------------- | ------------ | --------------- | ------------- | ---------------- |
| `/api/privacy/export`         | GET    | Export user data (GDPR)     | None         | `{data}` (file) | ✅ Yes        | ❌ No            |
| `/api/privacy/settings`       | GET    | Get privacy settings        | None         | `{settings}`    | ✅ Yes        | ❌ No            |
| `/api/privacy/settings`       | PUT    | Update privacy settings     | `{settings}` | `{success}`     | ✅ Yes        | ❌ No            |
| `/api/privacy/do-not-sell`    | POST   | Opt out of data sale (CCPA) | None         | `{success}`     | ✅ Yes        | ❌ No            |
| `/api/privacy/delete-account` | DELETE | Delete account (GDPR)       | None         | `{success}`     | ✅ Yes        | ❌ No            |
| `/api/privacy/rectify`        | PUT    | Update personal data (GDPR) | `{data}`     | `{success}`     | ✅ Yes        | ❌ No            |
| `/api/privacy/consent`        | GET    | Get consent status          | None         | `{consent}`     | ✅ Yes        | ❌ No            |
| `/api/privacy/consent`        | POST   | Record consent              | `{consent}`  | `{success}`     | ✅ Yes        | ❌ No            |
| `/api/privacy/consent`        | DELETE | Withdraw consent            | None         | `{success}`     | ✅ Yes        | ❌ No            |

**Issues:**

- ❌ **Orphaned:** All privacy endpoints are unused
- ⚠️ **CRITICAL:** GDPR/CCPA compliance requires these endpoints to be accessible

---

### 20. Metrics Routes (`/api/metrics`)

| Route                            | Method | Purpose                       | Input                                           | Output                         | Auth Required  | Used by Frontend |
| -------------------------------- | ------ | ----------------------------- | ----------------------------------------------- | ------------------------------ | -------------- | ---------------- |
| `/api/metrics/dashboard`         | GET    | Get dashboard metrics (admin) | `?startDate=&endDate=`                          | `{dashboard}`                  | ✅ Yes (Admin) | ❌ No            |
| `/api/metrics/dau`               | GET    | Get Daily Active Users        | `?date=`                                        | `{count, date}`                | ✅ Yes (Admin) | ❌ No            |
| `/api/metrics/active-users`      | GET    | Get DAU/WAU/MAU               | None                                            | `{dau, wau, mau, stickiness}`  | ✅ Yes (Admin) | ❌ No            |
| `/api/metrics/retention`         | GET    | Get retention metrics         | `?cohortDate=&days=`                            | `{retention}`                  | ✅ Yes (Admin) | ❌ No            |
| `/api/metrics/retention/rolling` | GET    | Get rolling retention         | `?days=`                                        | `{retention}`                  | ✅ Yes (Admin) | ❌ No            |
| `/api/metrics/matches`           | GET    | Get match metrics             | `?startDate=&endDate=`                          | `{matchRate, swipeConversion}` | ✅ Yes (Admin) | ❌ No            |
| `/api/metrics/messages`          | GET    | Get messaging metrics         | `?startDate=&endDate=`                          | `{responseRate, avgMessages}`  | ✅ Yes (Admin) | ❌ No            |
| `/api/metrics/premium`           | GET    | Get premium metrics           | `?startDate=&endDate=`                          | `{conversionRate, churnRate}`  | ✅ Yes (Admin) | ❌ No            |
| `/api/metrics/photos`            | GET    | Get photo upload metrics      | `?startDate=&endDate=`                          | `{uploadMetrics}`              | ✅ Yes (Admin) | ❌ No            |
| `/api/metrics/crash`             | POST   | Report app crash              | `{platform, version, errorMessage, stackTrace}` | `{success}`                    | ✅ Yes         | ❌ No            |
| `/api/metrics/export`            | GET    | Export metrics as CSV         | `?type=&startDate=&endDate=`                    | CSV file                       | ✅ Yes (Admin) | ❌ No            |

**Issues:**

- ❌ **Orphaned:** All metrics endpoints (admin-only, expected)
- ⚠️ **Missing:** Frontend may need crash reporting endpoint

---

### 21. Users Routes (`/api/users`)

| Route                 | Method | Purpose                    | Input                | Output        | Auth Required | Used by Frontend |
| --------------------- | ------ | -------------------------- | -------------------- | ------------- | ------------- | ---------------- |
| `/api/users/discover` | GET    | Discover users (duplicate) | `?lat=&lng=&radius=` | `{users: []}` | ✅ Yes        | ❌ No            |
| `/api/users/:id`      | GET    | Get user by ID             | `id` (param)         | `{user}`      | ✅ Yes        | ❌ No            |

**Issues:**

- ⚠️ **Duplication:** `/api/users/discover` duplicates `/api/discover` and `/api/discovery/explore`
- ❌ **Orphaned:** Both endpoints are unused

---

### 22. Health & System Routes

| Route              | Method | Purpose                | Input | Output                        | Auth Required | Used by Frontend |
| ------------------ | ------ | ---------------------- | ----- | ----------------------------- | ------------- | ---------------- |
| `/health`          | GET    | Health check           | None  | `{status, timestamp, uptime}` | No            | ❌ No            |
| `/api/csrf-token`  | GET    | Get CSRF token         | None  | `{token}`                     | No            | ❌ No            |
| `/api/test-sentry` | GET    | Test Sentry (dev only) | None  | `{success}`                   | No            | ❌ No            |

**Issues:**

- ✅ **Expected:** Health check and CSRF token are system endpoints

---

## Critical Issues Summary

### 1. Orphaned APIs (Not Used by Frontend)

**Total: ~55 endpoints**

**High Priority:**

- All safety endpoints (frontend uses Firebase directly - **CRITICAL ARCHITECTURE ISSUE**)
- All notification endpoints (frontend may need these)
- All privacy/GDPR endpoints (legal compliance requirement)
- Chat endpoints (using mock auth - **SECURITY ISSUE**)
- Discovery endpoints (using mock auth - **SECURITY ISSUE**)

**Medium Priority:**

- Enhanced profile endpoints
- Media message endpoints
- Premium feature endpoints
- Gamification endpoints
- Social features endpoints
- AI endpoints

**Low Priority:**

- Admin-only endpoints (metrics, moderation)
- System endpoints (health, CSRF)

---

### 2. Missing APIs Needed by Frontend

Based on frontend service files and constants:

**Authentication:**

1. **`/api/auth/logout`** - Frontend expects this but it doesn't exist

**Notifications:** 2. **`/api/notifications`** (GET) - Get notification list 3. **`/api/notifications/:id/read`** (PUT) - Mark notification as read

**Chat:** 4. **`/api/chat/send`** (POST) - REST endpoint for sending messages (currently only Socket.io)

**Discovery:** 5. **`/api/discovery/settings`** (PUT) - Update discovery preferences

**Premium:** 6. **`/api/premium/status`** (GET) - Get premium status (different from subscription status) 7. **`/api/swipes/pending-likes`** - May be needed for premium "See Who Liked You"

**Activity:** 8. **`/api/activity/profile-views`** - May be needed for premium "Who Viewed Me"

**Offline Sync (NEW):** 9. **`/api/sync/queue`** (GET) - Get pending offline actions queue 10. **`/api/sync/execute`** (POST) - Execute queued offline actions in bulk 11. **`/api/sync/conflicts`** (GET) - Get sync conflicts that need resolution 12. **`/api/sync/resolve`** (POST) - Resolve sync conflicts 13. **`/api/sync/status`** (GET) - Get sync status and last sync timestamp

**Feature Flags (NEW):** 14. **`/api/feature-flags`** (GET) - Get feature flags for current user 15. **`/api/feature-flags/:flagName`** (GET) - Check if specific flag is enabled 16. **`/api/feature-flags/admin`** (GET) - Get all flags (admin only) 17. **`/api/feature-flags/admin`** (POST) - Create/update flag (admin only) 18. **`/api/feature-flags/admin/:flagName/rollout`** (PUT) - Update rollout percentage (admin only) 19. **`/api/feature-flags/admin/:flagName/override`** (POST) - Set user override (admin only)

**Beta Testing (NEW):** 20. **`/api/beta/enroll`** (POST) - Enroll user in beta program 21. **`/api/beta/status`** (GET) - Check if user is beta tester 22. **`/api/beta/feedback`** (POST) - Submit feedback/bug report 23. **`/api/beta/feedback`** (GET) - Get user's feedback submissions 24. **`/api/beta/session`** (POST) - Record session analytics 25. **`/api/beta/analytics`** (GET) - Get beta program analytics (admin only) 26. **`/api/beta/feedback/:id`** (PUT) - Update feedback status (admin only)

---

### 3. Duplicated Logic

1. **Discovery Endpoints:**
   - `/api/discover` (mock auth)
   - `/api/discovery/explore` (real auth)
   - `/api/users/discover` (real auth)
   - **Recommendation:** Consolidate to `/api/discovery/explore` and remove others

2. **Authentication Middleware:**
   - `authenticate` and `authenticateToken` are aliases
   - Mock auth in discovery and chat routes
   - **Recommendation:** Standardize on `authenticate` middleware everywhere

3. **Profile Access Control:**
   - `authorizeOwner` and `authorizeMatchedUsers` have overlapping logic
   - **Recommendation:** Create unified authorization middleware

4. **Swipe Processing:**
   - SwipeController and SwipeService have some duplicate validation
   - **Recommendation:** Move all business logic to service layer

5. **Payment Status:**
   - `/api/premium/subscription/status` and `/api/payment/status` may overlap
   - **Recommendation:** Consolidate subscription status endpoints

---

### 4. Missing Business Rules

1. **Swipe Limits:**
   - No validation for daily swipe limits in route (only in controller)
   - No premium user swipe limit differentiation

2. **Photo Moderation:**
   - No automatic content scanning
   - No photo quality validation
   - No duplicate photo detection

3. **Match Creation:**
   - No validation that both users are active
   - No check for account suspension before matching

4. **Message Validation:**
   - No message length limits
   - No profanity filtering
   - No spam detection

5. **Premium Features:**
   - No validation that user has premium before accessing premium endpoints
   - No quota checking before allowing super likes, rewinds, boosts

6. **Safety:**
   - No automatic suspension based on report count
   - No rate limiting on report endpoint (could be abused)
   - No validation that user can't report themselves

7. **Location Privacy:**
   - No validation for location accuracy
   - No check for location spoofing
   - No distance-based privacy settings

8. **Account Deletion:**
   - No grace period for account recovery
   - No data retention policy enforcement

9. **OAuth:**
   - No validation that OAuth provider is properly configured before allowing login
   - No check for duplicate accounts across OAuth providers

10. **Subscription:**
    - No validation for subscription tier limits
    - No check for subscription expiration before allowing premium features

11. **Rate Limiting:**
    - Inconsistent rate limiting across endpoints
    - No dynamic rate limiting based on user behavior

12. **Data Validation:**
    - Missing validation for many optional fields
    - No sanitization for user-generated content

---

## Recommendations

### Immediate Actions (Critical)

1. **Fix Authentication Issues:**
   - Replace mock auth in `/api/discover` and `/api/chat` with real `authenticate` middleware
   - Add `/api/auth/logout` endpoint

2. **Fix Safety Service Architecture:**
   - Migrate frontend SafetyService from Firebase to backend APIs
   - This is a critical architecture issue - safety features should be centralized

3. **Add Missing Critical Endpoints:**
   - `/api/auth/logout`
   - `/api/notifications` (GET list)
   - `/api/notifications/:id/read` (PUT)

4. **Add Offline Sync Support:**
   - Create `/api/sync/execute` endpoint for bulk action processing
   - Implement conflict detection and resolution
   - Add sync status tracking
   - **Priority:** High - affects user experience when offline

5. **Add Feature Flag Backend:**
   - Create feature flag management system
   - Implement user-specific overrides
   - Add rollout percentage support
   - **Priority:** High - needed for beta testing and gradual rollouts

6. **Add Beta Testing Backend:**
   - Create beta enrollment system
   - Implement feedback/bug report storage
   - Add session analytics tracking
   - **Priority:** Medium - improves beta testing workflow

### Short-term (1-2 weeks)

4. **Consolidate Duplicated Endpoints:**
   - Remove `/api/discover` and `/api/users/discover`
   - Keep only `/api/discovery/explore`
   - Standardize authentication middleware

5. **Add Business Rule Validation:**
   - Add swipe limit validation to routes
   - Add premium feature access checks
   - Add message validation rules
   - Add rate limiting to report endpoint

6. **Enable Privacy/GDPR Endpoints:**
   - Ensure frontend can access privacy endpoints
   - Test data export functionality
   - Verify consent management works

### Medium-term (1 month)

7. **Frontend Integration:**
   - Integrate unused but valuable endpoints:
     - Enhanced profile features
     - Media messages (GIFs, stickers, voice)
     - Premium features
     - Activity tracking

8. **Remove or Document Orphaned Endpoints:**
   - Either integrate with frontend or mark as "future feature"
   - Add API versioning for deprecated endpoints

9. **Improve Error Handling:**
   - Standardize error responses
   - Add proper validation error messages
   - Implement consistent error codes

### Long-term (2-3 months)

10. **API Documentation:**
    - Generate OpenAPI/Swagger documentation
    - Add endpoint usage examples
    - Document authentication requirements

11. **Testing:**
    - Add integration tests for all endpoints
    - Test authentication flows
    - Test business rule validation

12. **Monitoring:**
    - Add endpoint usage analytics
    - Track orphaned endpoint access
    - Monitor for security issues

---

## Statistics

- **Total API Routes:** 100+
- **Routes with Real Auth:** ~75
- **Routes with Mock Auth:** 2 (CRITICAL)
- **Routes Used by Frontend:** ~45
- **Orphaned Routes:** ~55
- **Admin-Only Routes:** ~15
- **Public Routes:** ~10
- **Missing Critical Endpoints:** 26 (8 original + 18 new)
- **Duplicated Endpoints:** 5
- **Missing Business Rules:** 12

## Frontend Services Without Backend Support

### 1. PWAService ✅

**Status:** Client-only (acceptable)  
**Location:** `src/services/PWAService.js`  
**Backend Support:** Not needed - handles service workers, install prompts, push subscriptions client-side

### 2. OfflineService ❌

**Status:** Needs backend sync mechanism  
**Location:** `src/services/OfflineService.js`  
**Missing Backend APIs:**

- Offline queue sync endpoint
- Bulk action execution
- Conflict resolution
- Sync status tracking

**Current Behavior:**

- Queues actions locally when offline (SEND_MESSAGE, SWIPE, UPDATE_PROFILE)
- Attempts to sync when back online
- No backend support for bulk sync or conflict resolution

**Required Endpoints:**

```
POST /api/sync/execute - Execute queued offline actions
GET  /api/sync/conflicts - Get sync conflicts
POST /api/sync/resolve - Resolve conflicts
GET  /api/sync/status - Get sync status
```

### 3. BetaTestingService ❌

**Status:** Should use backend feature flags and feedback system  
**Location:** `src/services/BetaTestingService.js`  
**Missing Backend APIs:**

- Beta enrollment endpoint
- Feedback submission endpoint
- Bug report endpoint
- Session analytics endpoint
- Beta analytics (admin)

**Current Behavior:**

- All data stored client-side only
- No persistence across devices
- No admin visibility
- No centralized control

**Required Endpoints:**

```
POST /api/beta/enroll - Enroll in beta
GET  /api/beta/status - Check beta status
POST /api/beta/feedback - Submit feedback/bug
POST /api/beta/session - Record session
GET  /api/beta/analytics - Get analytics (admin)
```

### 4. FeatureFlagService ❌

**Status:** Should use backend feature flags  
**Location:** `src/services/FeatureFlagService.js`  
**Missing Backend APIs:**

- Feature flag retrieval endpoint
- User-specific flag overrides
- Rollout percentage management
- A/B test configuration

**Current Behavior:**

- Flags hardcoded in frontend
- No centralized control
- No user-specific overrides from backend
- No dynamic rollout management

**Required Endpoints:**

```
GET  /api/feature-flags - Get flags for user
GET  /api/feature-flags/:name - Check specific flag
POST /api/feature-flags/admin - Manage flags (admin)
PUT  /api/feature-flags/admin/:name/rollout - Update rollout (admin)
POST /api/feature-flags/admin/:name/override - User override (admin)
```

---

## Conclusion

The backend has a comprehensive API structure with many features implemented. However, there are critical issues:

1. **Security:** Mock authentication in discovery and chat routes
2. **Architecture:** Safety features split between Firebase and backend
3. **Integration:** Many endpoints not connected to frontend
4. **Business Logic:** Missing validation and business rules in several areas

Priority should be given to fixing authentication issues, consolidating duplicated endpoints, and ensuring critical business rules are enforced.
