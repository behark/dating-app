# Beta User Testing Guide

This guide covers the beta testing framework implementation for the Dating App.

## Overview

The beta testing framework provides:
- **Feature Flags**: Control feature rollout and A/B testing
- **User Enrollment**: Manage beta tester signups and tiers
- **Feedback Collection**: In-app feedback and bug reporting
- **Analytics**: Session tracking and usage metrics
- **Crash Reporting**: Automatic error tracking

## Components

### 1. Feature Flag Service

Location: `src/services/FeatureFlagService.js`

```javascript
import { featureFlagService } from '../services/FeatureFlagService';

// Check if feature is enabled for user
const isEnabled = featureFlagService.isEnabled('beta_video_chat', userId, userGroups);

// Get all flags for a user
const userFlags = featureFlagService.getUserFlags(userId, ['beta_testers']);

// Override flag for specific user (testing)
featureFlagService.setUserOverride(userId, 'beta_feature', true);

// Update rollout percentage
featureFlagService.updateRollout('beta_feature', 50);
```

### 2. Beta Testing Service

Location: `src/services/BetaTestingService.js`

```javascript
import { betaTestingService } from '../services/BetaTestingService';

// Enroll user in beta
betaTestingService.enrollUser(userId, {
  email: 'user@email.com',
  tier: 'premium',
  features: ['video_chat', 'ai_matching'],
});

// Submit feedback
betaTestingService.submitFeedback(userId, {
  type: 'bug',
  title: 'App crashes on startup',
  description: 'Steps to reproduce...',
  severity: 'high',
});

// Get analytics
const analytics = betaTestingService.getAnalytics();
```

### 3. Feedback Widget Component

Location: `src/components/BetaFeedbackWidget.js`

```jsx
import { BetaFeedbackWidget, BetaFeedbackButton } from '../components/BetaFeedbackWidget';

// In your app
<BetaFeedbackButton onPress={() => setShowFeedback(true)} />

<BetaFeedbackWidget
  userId={currentUser.id}
  isVisible={showFeedback}
  onClose={() => setShowFeedback(false)}
  onSubmit={handleFeedbackSubmit}
  currentScreen={navigation.getCurrentRoute().name}
  appVersion="1.0.0-beta"
/>
```

### 4. useBetaTesting Hook

Location: `src/hooks/useBetaTesting.js`

```javascript
import { useBetaTesting } from '../hooks/useBetaTesting';

function MyComponent() {
  const {
    isBetaUser,
    isFeatureEnabled,
    submitFeedback,
    trackAction,
  } = useBetaTesting(userId, userGroups);

  // Check feature flag
  if (isFeatureEnabled('beta_video_chat')) {
    // Show video chat feature
  }

  // Track user action
  trackAction('swipe_right', 'discovery', { profileId: '123' });
}
```

## Feature Flags

### Current Beta Features

| Flag Name | Description | Default Rollout |
|-----------|-------------|-----------------|
| `beta_video_chat` | Video chat feature | 0% (beta only) |
| `beta_ai_matchmaking` | AI-powered matching | 10% |
| `beta_voice_notes` | Voice notes in chat | 25% |
| `beta_profile_prompts` | Interactive prompts | 50% |
| `beta_date_spots` | Date spot suggestions | 0% (beta only) |
| `beta_icebreakers` | AI icebreakers | 75% |

### A/B Tests

| Flag Name | Description | Rollout |
|-----------|-------------|---------|
| `ab_profile_layout_v2` | New profile layout | 50% |
| `ab_discovery_algorithm_v3` | Updated discovery | 30% |

## Beta Testing Workflow

### 1. User Enrollment

```javascript
// From settings screen
const handleJoinBeta = async () => {
  await enrollInBeta({
    email: user.email,
    deviceInfo: await getDeviceInfo(),
    screenshotConsent: agreedToScreenshots,
  });
  
  Alert.alert('Welcome to Beta!', 'Thank you for helping us improve.');
};
```

### 2. Feature Gating

```jsx
// Conditionally render features
{isFeatureEnabled('beta_video_chat') && (
  <VideoChatButton onPress={startVideoCall} />
)}

// Or use fallback
<FeatureGate feature="beta_video_chat" fallback={<StandardChat />}>
  <VideoChat />
</FeatureGate>
```

### 3. Feedback Collection

Feedback types:
- **Bug Report**: Technical issues
- **Feature Request**: New functionality ideas
- **Improvement**: Enhancements to existing features
- **General**: Other feedback

### 4. Session Tracking

```javascript
// On app start
useEffect(() => {
  startSession({ platform: 'ios', version: '15.0' });
  
  return () => {
    endSession('1.0.0-beta');
  };
}, []);

// Track screens
useEffect(() => {
  trackScreen(route.name);
}, [route]);
```

## Analytics Dashboard

Access beta analytics:

```javascript
const analytics = betaTestingService.getAnalytics();

console.log({
  totalBetaUsers: analytics.totalBetaUsers,
  activeUsers: analytics.activeUsers,
  feedbackStats: analytics.feedbackStats,
  bugStats: analytics.bugStats,
  featureUsage: analytics.featureUsage,
});
```

## Running Beta Tests

### 1. Local Testing

```bash
# Run unit tests
npm test -- --testPathPattern=BetaTestingService

# Run feature flag tests
npm test -- --testPathPattern=FeatureFlagService
```

### 2. Test Specific Features

```bash
# Enable feature for testing
curl -X POST http://localhost:3000/api/admin/feature-flags \
  -H "Content-Type: application/json" \
  -d '{"flag": "beta_video_chat", "userId": "test_user", "enabled": true}'
```

### 3. Review Feedback

```bash
# Export feedback data
node -e "
  const { betaTestingService } = require('./src/services/BetaTestingService');
  console.log(betaTestingService.exportFeedback('json'));
" > feedback_export.json
```

## Best Practices

### 1. Feature Flag Naming

- Use `beta_` prefix for beta features
- Use `exp_` prefix for experiments
- Use `ab_` prefix for A/B tests
- Use descriptive names: `beta_video_chat` not `beta_vc`

### 2. Rollout Strategy

1. **0%**: Internal testing only
2. **10%**: Initial beta testers
3. **25%**: Expanded beta
4. **50%**: A/B testing
5. **75%**: Near-complete rollout
6. **100%**: General availability

### 3. Feedback Response

- Acknowledge feedback within 24 hours
- Update status regularly
- Follow up with users on fixes
- Thank users for reports

### 4. Bug Triage

| Severity | Response Time | Description |
|----------|---------------|-------------|
| Critical | 4 hours | App crashes, data loss |
| High | 24 hours | Major feature broken |
| Medium | 72 hours | Minor feature broken |
| Low | 1 week | Cosmetic issues |

## Integration with CI/CD

### Feature Flag Configuration

```yaml
# .github/workflows/deploy.yml
- name: Update Feature Flags
  run: |
    npm run flags:sync -- --env=${{ github.ref_name }}
```

### Environment-specific Flags

```javascript
// config/featureFlags.js
module.exports = {
  development: {
    beta_video_chat: { enabled: true, rollout: 100 },
  },
  staging: {
    beta_video_chat: { enabled: true, rollout: 50 },
  },
  production: {
    beta_video_chat: { enabled: true, rollout: 10 },
  },
};
```

## Metrics to Track

1. **Engagement**
   - Session duration
   - Feature usage frequency
   - Screen flow patterns

2. **Quality**
   - Bug reports per feature
   - Crash-free sessions
   - Error rates

3. **Satisfaction**
   - Average feedback rating
   - NPS score
   - Feature request themes

4. **Retention**
   - Beta user retention rate
   - Feature adoption rate
   - Churn reasons

## Support

For beta testing support:
- Slack: #beta-testing
- Email: beta@datingapp.com
- Dashboard: admin.datingapp.com/beta
