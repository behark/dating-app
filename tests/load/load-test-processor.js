/**
 * Artillery Load Test Processor
 * Custom functions for load testing
 */

const crypto = require('crypto');

module.exports = {
  // Generate unique test user credentials
  generateTestUser: (context, events, done) => {
    const uniqueId = crypto.randomBytes(8).toString('hex');
    context.vars.testEmail = `loadtest_${uniqueId}@test.com`;
    context.vars.testPassword = `TestPass_${uniqueId}!`;
    context.vars.testName = `Load Test User ${uniqueId.substring(0, 6)}`;
    done();
  },

  // Generate random profile data
  generateProfileData: (context, events, done) => {
    const interests = [
      'hiking', 'photography', 'cooking', 'travel', 'music',
      'movies', 'fitness', 'reading', 'gaming', 'art'
    ];
    
    const randomInterests = interests
      .sort(() => Math.random() - 0.5)
      .slice(0, 3 + Math.floor(Math.random() * 3));

    context.vars.profileData = {
      bio: `Load test bio - ${Date.now()}`,
      interests: randomInterests,
      age: 18 + Math.floor(Math.random() * 42), // 18-59
    };
    done();
  },

  // Generate random swipe direction
  generateSwipeDirection: (context, events, done) => {
    const directions = ['left', 'left', 'right', 'right', 'right']; // 60% right
    context.vars.swipeDirection = directions[Math.floor(Math.random() * directions.length)];
    done();
  },

  // Generate random message
  generateMessage: (context, events, done) => {
    const messages = [
      'Hey! How are you?',
      'Nice profile! 😊',
      'What are you up to?',
      'Love your photos!',
      'Want to chat?',
      'How was your day?',
      'Any plans for the weekend?',
      'Great taste in music!',
    ];
    context.vars.randomMessage = messages[Math.floor(Math.random() * messages.length)];
    done();
  },

  // Log response time for custom metrics
  logResponseTime: (requestParams, response, context, ee, next) => {
    const responseTime = response.timings?.phases?.firstByte || 0;
    
    // Emit custom metric
    ee.emit('customStat', {
      stat: 'response_time_ms',
      value: responseTime,
    });

    // Log slow responses
    if (responseTime > 1000) {
      console.warn(`Slow response: ${requestParams.url} - ${responseTime}ms`);
    }

    next();
  },

  // Handle authentication errors
  handleAuthError: (requestParams, response, context, ee, next) => {
    if (response.statusCode === 401) {
      console.error('Authentication failed during load test');
      ee.emit('counter', 'auth_failures', 1);
    }
    next();
  },

  // Generate location data
  generateLocation: (context, events, done) => {
    // Random location within USA
    const locations = [
      { lat: 40.7128, lng: -74.0060, city: 'New York' },
      { lat: 34.0522, lng: -118.2437, city: 'Los Angeles' },
      { lat: 41.8781, lng: -87.6298, city: 'Chicago' },
      { lat: 29.7604, lng: -95.3698, city: 'Houston' },
      { lat: 33.4484, lng: -112.0740, city: 'Phoenix' },
    ];
    
    const location = locations[Math.floor(Math.random() * locations.length)];
    context.vars.location = {
      latitude: location.lat + (Math.random() - 0.5) * 0.1,
      longitude: location.lng + (Math.random() - 0.5) * 0.1,
    };
    done();
  },

  // Setup function - runs before scenarios
  setup: (context, events, done) => {
    context.vars.startTime = Date.now();
    context.vars.requestCount = 0;
    done();
  },

  // Teardown function - runs after scenarios
  teardown: (context, events, done) => {
    const duration = Date.now() - context.vars.startTime;
    console.log(`Scenario completed in ${duration}ms with ${context.vars.requestCount} requests`);
    done();
  },
};
