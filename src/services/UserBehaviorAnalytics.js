import logger from '../utils/logger';
import { AnalyticsService } from './AnalyticsService';

/**
 * User Behavior Analytics Service
 *
 * Provides comprehensive analytics for understanding user behavior:
 * - Swipe pattern analysis for better recommendations
 * - Time spent tracking on different features
 * - Conversion funnel tracking
 * - A/B testing framework for UI changes
 */

// Swipe pattern tracking
const swipePatterns = {
  sessions: [],
  currentSession: null,
  totalSwipes: { left: 0, right: 0, superLike: 0 },
  patterns: [],
};

// Time tracking
const timeTracking = {
  screenTimes: {},
  currentScreen: null,
  screenStartTime: null,
  featureUsage: {},
};

// Conversion funnels
const funnels = {
  registration: {
    steps: ['app_opened', 'signup_started', 'profile_created', 'first_swipe', 'first_match'],
    userProgress: {},
  },
  premium: {
    steps: [
      'feature_blocked',
      'premium_viewed',
      'plan_selected',
      'payment_started',
      'purchase_completed',
    ],
    userProgress: {},
  },
  engagement: {
    steps: ['match_created', 'chat_opened', 'message_sent', 'multiple_messages', 'date_scheduled'],
    userProgress: {},
  },
};

// A/B tests configuration
const abTests = {};
const userVariants = {};

export class UserBehaviorAnalytics {
  /**
   * Initialize behavior analytics
   */
  static initialize() {
    this.startNewSwipeSession();
    logger.info('User Behavior Analytics initialized');
  }

  // ==================== SWIPE PATTERN ANALYSIS ====================

  /**
   * Start a new swipe session
   */
  static startNewSwipeSession() {
    if (swipePatterns.currentSession) {
      // Save previous session
      swipePatterns.sessions.push({
        ...swipePatterns.currentSession,
        endTime: Date.now(),
      });
    }

    swipePatterns.currentSession = {
      id: `session_${Date.now()}`,
      startTime: Date.now(),
      swipes: [],
      rightCount: 0,
      leftCount: 0,
      superLikeCount: 0,
      averageSwipeTime: 0,
      consecutiveRights: 0,
      consecutiveLefts: 0,
      maxConsecutiveRights: 0,
      maxConsecutiveLefts: 0,
    };
  }

  /**
   * Track a swipe action with detailed metrics
   */
  static trackSwipe(direction, profileData = {}) {
    const session = swipePatterns.currentSession;
    if (!session) this.startNewSwipeSession();

    const now = Date.now();
    const lastSwipe = session.swipes[session.swipes.length - 1];
    const timeSinceLastSwipe = lastSwipe ? now - lastSwipe.timestamp : 0;

    const swipeData = {
      timestamp: now,
      direction,
      timeSinceLastSwipe,
      profileAge: profileData.age,
      profileDistance: profileData.distance,
      profileHasVerifiedPhoto: profileData.verified,
      profilePhotoCount: profileData.photoCount,
      viewDuration: profileData.viewDuration || timeSinceLastSwipe,
    };

    session.swipes.push(swipeData);

    // Update counts
    if (direction === 'right') {
      session.rightCount++;
      session.consecutiveRights++;
      session.consecutiveLefts = 0;
      session.maxConsecutiveRights = Math.max(
        session.maxConsecutiveRights,
        session.consecutiveRights
      );
      swipePatterns.totalSwipes.right++;
    } else if (direction === 'left') {
      session.leftCount++;
      session.consecutiveLefts++;
      session.consecutiveRights = 0;
      session.maxConsecutiveLefts = Math.max(session.maxConsecutiveLefts, session.consecutiveLefts);
      swipePatterns.totalSwipes.left++;
    } else if (direction === 'superLike') {
      session.superLikeCount++;
      session.consecutiveRights = 0;
      session.consecutiveLefts = 0;
      swipePatterns.totalSwipes.superLike++;
    }

    // Calculate average swipe time
    const totalSwipeTime = session.swipes.reduce((sum, s) => sum + s.timeSinceLastSwipe, 0);
    session.averageSwipeTime = totalSwipeTime / session.swipes.length;

    // Analyze patterns
    this.analyzeSwipePatterns(session);

    // Log to analytics
    AnalyticsService.logEvent('swipe_detailed', {
      direction,
      session_swipe_count: session.swipes.length,
      average_swipe_time: Math.round(session.averageSwipeTime),
      right_ratio: session.rightCount / session.swipes.length,
      ...profileData,
    });

    return swipeData;
  }

  /**
   * Analyze swipe patterns for insights
   */
  static analyzeSwipePatterns(session) {
    const patterns = [];
    const swipes = session.swipes;

    // Detect "swipe fatigue" - when swipes get faster and more negative
    if (swipes.length >= 10) {
      const recentSwipes = swipes.slice(-10);
      const recentAvgTime = recentSwipes.reduce((sum, s) => sum + s.timeSinceLastSwipe, 0) / 10;
      const recentRightRatio = recentSwipes.filter((s) => s.direction === 'right').length / 10;

      if (recentAvgTime < session.averageSwipeTime * 0.5 && recentRightRatio < 0.2) {
        patterns.push({
          type: 'swipe_fatigue',
          confidence: 0.8,
          suggestion: 'Consider showing fewer profiles or taking a break',
        });
      }
    }

    // Detect "too selective" - very low right swipe ratio
    if (swipes.length >= 20) {
      const rightRatio = session.rightCount / swipes.length;
      if (rightRatio < 0.1) {
        patterns.push({
          type: 'too_selective',
          confidence: 0.7,
          suggestion: 'Consider broadening preferences',
        });
      }
    }

    // Detect "not selective enough" - very high right swipe ratio
    if (swipes.length >= 20) {
      const rightRatio = session.rightCount / swipes.length;
      if (rightRatio > 0.9) {
        patterns.push({
          type: 'not_selective',
          confidence: 0.7,
          suggestion: 'Being more selective may lead to better matches',
        });
      }
    }

    // Detect "photo preference" - correlate with photo count
    const rightSwipesWithManyPhotos = swipes.filter(
      (s) => s.direction === 'right' && s.profilePhotoCount >= 4
    ).length;
    const rightSwipesWithFewPhotos = swipes.filter(
      (s) => s.direction === 'right' && s.profilePhotoCount < 4
    ).length;

    if (rightSwipesWithManyPhotos > rightSwipesWithFewPhotos * 2) {
      patterns.push({
        type: 'prefers_many_photos',
        confidence: 0.6,
        suggestion: 'Prioritize profiles with more photos',
      });
    }

    swipePatterns.patterns = patterns;
    return patterns;
  }

  /**
   * Get swipe analytics summary
   */
  static getSwipeAnalytics() {
    const session = swipePatterns.currentSession;
    const allSessions = [...swipePatterns.sessions, session].filter(Boolean);

    return {
      currentSession: session,
      totalSessions: allSessions.length,
      totalSwipes: swipePatterns.totalSwipes,
      overallRightRatio:
        swipePatterns.totalSwipes.right /
          (swipePatterns.totalSwipes.right + swipePatterns.totalSwipes.left) || 0,
      patterns: swipePatterns.patterns,
      averageSessionLength:
        allSessions.reduce((sum, s) => sum + s.swipes.length, 0) / allSessions.length || 0,
    };
  }

  // ==================== TIME TRACKING ====================

  /**
   * Track screen view start
   */
  static startScreenTracking(screenName) {
    // End tracking for previous screen
    if (timeTracking.currentScreen) {
      this.endScreenTracking();
    }

    timeTracking.currentScreen = screenName;
    timeTracking.screenStartTime = Date.now();

    AnalyticsService.logScreenView(screenName, timeTracking.currentScreen);
  }

  /**
   * End screen tracking and record time
   */
  static endScreenTracking() {
    if (!timeTracking.currentScreen || !timeTracking.screenStartTime) return;

    const timeSpent = Date.now() - timeTracking.screenStartTime;
    const screenName = timeTracking.currentScreen;

    // Accumulate time
    if (!timeTracking.screenTimes[screenName]) {
      timeTracking.screenTimes[screenName] = {
        totalTime: 0,
        visits: 0,
        averageTime: 0,
      };
    }

    timeTracking.screenTimes[screenName].totalTime += timeSpent;
    timeTracking.screenTimes[screenName].visits++;
    timeTracking.screenTimes[screenName].averageTime =
      timeTracking.screenTimes[screenName].totalTime / timeTracking.screenTimes[screenName].visits;

    // Log to analytics
    AnalyticsService.logEvent('screen_time', {
      screen_name: screenName,
      time_spent_ms: timeSpent,
      time_spent_seconds: Math.round(timeSpent / 1000),
    });

    timeTracking.currentScreen = null;
    timeTracking.screenStartTime = null;
  }

  /**
   * Track feature usage
   */
  static trackFeatureUsage(featureName, metadata = {}) {
    if (!timeTracking.featureUsage[featureName]) {
      timeTracking.featureUsage[featureName] = {
        usageCount: 0,
        lastUsed: null,
        metadata: [],
      };
    }

    timeTracking.featureUsage[featureName].usageCount++;
    timeTracking.featureUsage[featureName].lastUsed = Date.now();
    timeTracking.featureUsage[featureName].metadata.push({
      timestamp: Date.now(),
      ...metadata,
    });

    AnalyticsService.logEvent('feature_used', {
      feature_name: featureName,
      usage_count: timeTracking.featureUsage[featureName].usageCount,
      ...metadata,
    });
  }

  /**
   * Get time analytics
   */
  static getTimeAnalytics() {
    return {
      screenTimes: timeTracking.screenTimes,
      featureUsage: timeTracking.featureUsage,
      mostUsedScreen: (() => {
        const sorted = Object.entries(timeTracking.screenTimes).sort(
          (a, b) => b[1].totalTime - a[1].totalTime
        );
        return sorted.length > 0 ? sorted[0]?.[0] : null;
      })(),
      mostUsedFeature: (() => {
        const sorted = Object.entries(timeTracking.featureUsage).sort(
          (a, b) => b[1].usageCount - a[1].usageCount
        );
        return sorted.length > 0 ? sorted[0]?.[0] : null;
      })(),
    };
  }

  // ==================== CONVERSION FUNNELS ====================

  /**
   * Track funnel step completion
   */
  static trackFunnelStep(funnelName, stepName, userId = 'anonymous') {
    const funnel = funnels[funnelName];
    if (!funnel) {
      logger.warn('Unknown funnel', null, { funnelName });
      return;
    }

    const stepIndex = funnel.steps.indexOf(stepName);
    if (stepIndex === -1) {
      logger.warn('Unknown step in funnel', null, { funnelName, stepName });
      return;
    }

    if (!funnel.userProgress[userId]) {
      funnel.userProgress[userId] = {
        startTime: Date.now(),
        completedSteps: [],
        currentStep: null,
      };
    }

    const userProgress = funnel.userProgress[userId];

    if (!userProgress.completedSteps.includes(stepName)) {
      userProgress.completedSteps.push(stepName);
      userProgress.currentStep = stepName;

      AnalyticsService.logEvent('funnel_step_completed', {
        funnel_name: funnelName,
        step_name: stepName,
        step_index: stepIndex,
        total_steps: funnel.steps.length,
        time_in_funnel: Date.now() - userProgress.startTime,
      });

      // Check if funnel completed
      if (userProgress.completedSteps.length === funnel.steps.length) {
        AnalyticsService.logEvent('funnel_completed', {
          funnel_name: funnelName,
          total_time: Date.now() - userProgress.startTime,
        });
      }
    }
  }

  /**
   * Get funnel analytics
   */
  static getFunnelAnalytics(funnelName) {
    const funnel = funnels[funnelName];
    if (!funnel) return null;

    const users = Object.values(funnel.userProgress);
    const totalUsers = users.length;

    const stepCompletionRates = funnel.steps.map((step, index) => {
      const usersAtStep = users.filter((u) => u.completedSteps.includes(step)).length;
      return {
        step,
        index,
        users: usersAtStep,
        rate: totalUsers > 0 ? usersAtStep / totalUsers : 0,
        dropOffRate:
          index > 0
            ? 1 -
              usersAtStep /
                (users.filter((u) => u.completedSteps.includes(funnel.steps[index - 1])).length ||
                  1)
            : 0,
      };
    });

    return {
      funnelName,
      totalUsers,
      steps: stepCompletionRates,
      completionRate: stepCompletionRates[stepCompletionRates.length - 1]?.rate || 0,
      biggestDropOff: stepCompletionRates.reduce(
        (max, step) => (step.dropOffRate > max.dropOffRate ? step : max),
        { step: null, dropOffRate: 0 }
      ),
    };
  }

  // ==================== A/B TESTING FRAMEWORK ====================

  /**
   * Register a new A/B test
   */
  static registerABTest(testId, variants, config = {}) {
    abTests[testId] = {
      id: testId,
      variants,
      config: {
        distribution: config.distribution || variants.map(() => 1 / variants.length),
        startDate: config.startDate || Date.now(),
        endDate: config.endDate || null,
        targetAudience: config.targetAudience || 'all',
      },
      metrics: variants.reduce((acc, v) => {
        acc[v] = { impressions: 0, conversions: 0, events: [] };
        return acc;
      }, {}),
    };

    logger.info('A/B Test registered', { testId, variants: variants.join(', ') });
  }

  /**
   * Get variant for a user
   */
  static getVariant(testId, userId = 'anonymous') {
    const test = abTests[testId];
    if (!test) {
      logger.warn('Unknown A/B test', null, { testId });
      return null;
    }

    // Check if test is active
    const now = Date.now();
    if (test.config.endDate && now > test.config.endDate) {
      return test.variants.length > 0 ? test.variants[0] : null; // Return control after test ends
    }

    // Return cached variant for user
    if (userVariants[userId]?.[testId]) {
      return userVariants[userId][testId];
    }

    // Assign variant based on distribution
    const random = this.hashUserToNumber(userId + testId);
    let cumulativeProb = 0;
    let selectedVariant = test.variants.length > 0 ? test.variants[0] : null;

    for (let i = 0; i < test.variants.length; i++) {
      cumulativeProb += test.config.distribution[i];
      if (random < cumulativeProb) {
        selectedVariant = test.variants[i];
        break;
      }
    }

    // Cache variant
    if (!userVariants[userId]) userVariants[userId] = {};
    userVariants[userId][testId] = selectedVariant;

    // Track impression
    test.metrics[selectedVariant].impressions++;

    AnalyticsService.logEvent('ab_test_impression', {
      test_id: testId,
      variant: selectedVariant,
    });

    return selectedVariant;
  }

  /**
   * Track conversion for A/B test
   */
  static trackABConversion(testId, userId = 'anonymous', eventName = 'conversion', value = 1) {
    const test = abTests[testId];
    if (!test) return;

    const variant = userVariants[userId]?.[testId];
    if (!variant) return;

    test.metrics[variant].conversions += value;
    test.metrics[variant].events.push({
      event: eventName,
      value,
      timestamp: Date.now(),
      userId,
    });

    AnalyticsService.logEvent('ab_test_conversion', {
      test_id: testId,
      variant,
      event_name: eventName,
      value,
    });
  }

  /**
   * Get A/B test results
   */
  static getABTestResults(testId) {
    const test = abTests[testId];
    if (!test) return null;

    const results = test.variants.map((variant) => {
      const metrics = test.metrics[variant];
      return {
        variant,
        impressions: metrics.impressions,
        conversions: metrics.conversions,
        conversionRate: metrics.impressions > 0 ? metrics.conversions / metrics.impressions : 0,
        events: metrics.events,
      };
    });

    // Calculate statistical significance (simplified)
    if (results.length === 0) {
      return { results: [], significance: [] };
    }
    const control = results[0];
    if (!control) {
      return { results: [], significance: [] };
    }
    const significanceResults = results.slice(1).map((variant) => {
      const lift =
        control.conversionRate > 0
          ? (variant.conversionRate - control.conversionRate) / control.conversionRate
          : 0;

      return {
        variant: variant.variant,
        lift: lift * 100,
        isSignificant:
          Math.abs(lift) > 0.05 && control.impressions > 100 && variant.impressions > 100,
      };
    });

    return {
      testId,
      startDate: test.config.startDate,
      endDate: test.config.endDate,
      results,
      significanceResults,
      winner: results.reduce((max, r) => (r.conversionRate > max.conversionRate ? r : max)),
    };
  }

  /**
   * Hash user ID to consistent number between 0 and 1
   */
  static hashUserToNumber(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash % 1000) / 1000;
  }

  // ==================== AGGREGATE ANALYTICS ====================

  /**
   * Get comprehensive analytics summary
   */
  static getAnalyticsSummary() {
    return {
      swipeAnalytics: this.getSwipeAnalytics(),
      timeAnalytics: this.getTimeAnalytics(),
      funnels: {
        registration: this.getFunnelAnalytics('registration'),
        premium: this.getFunnelAnalytics('premium'),
        engagement: this.getFunnelAnalytics('engagement'),
      },
      abTests: Object.keys(abTests).map((testId) => this.getABTestResults(testId)),
    };
  }

  /**
   * Export analytics data for analysis
   */
  static exportAnalyticsData() {
    return {
      exportDate: new Date().toISOString(),
      swipePatterns,
      timeTracking,
      funnels,
      abTests,
      userVariants,
    };
  }
}

// Export commonly used events for consistency
export const BEHAVIOR_EVENTS = {
  // Swipe events
  SWIPE_SESSION_START: 'swipe_session_start',
  SWIPE_SESSION_END: 'swipe_session_end',
  SWIPE_PATTERN_DETECTED: 'swipe_pattern_detected',

  // Time events
  SCREEN_ENTER: 'screen_enter',
  SCREEN_EXIT: 'screen_exit',
  FEATURE_USED: 'feature_used',

  // Funnel events
  FUNNEL_STEP: 'funnel_step',
  FUNNEL_COMPLETED: 'funnel_completed',
  FUNNEL_ABANDONED: 'funnel_abandoned',

  // A/B events
  AB_IMPRESSION: 'ab_impression',
  AB_CONVERSION: 'ab_conversion',
};

export default UserBehaviorAnalytics;
