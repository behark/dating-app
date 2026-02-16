/**
 * Load Testing Script using Artillery
 * Tests API endpoints under load conditions
 */

const LOAD_TEST_PASSWORD = 'TestPass123!';
const AUTH_LOGIN_URL = '/api/auth/login';
const AUTHORIZATION_TOKEN_HEADER = 'Bearer {{ authToken }}';

module.exports = {
  config: {
    target: process.env.API_URL || 'http://localhost:3001',
    phases: [
      // Warm-up phase
      { duration: 60, arrivalRate: 5, name: 'Warm up' },
      // Ramp up
      { duration: 120, arrivalRate: 5, rampTo: 50, name: 'Ramp up' },
      // Sustained load
      { duration: 300, arrivalRate: 50, name: 'Sustained load' },
      // Spike test
      { duration: 60, arrivalRate: 100, name: 'Spike' },
      // Cool down
      { duration: 60, arrivalRate: 10, name: 'Cool down' },
    ],
    defaults: {
      headers: {
        'Content-Type': 'application/json',
      },
    },
    plugins: {
      expect: {},
      'metrics-by-endpoint': {},
    },
    variables: {
      testUsers: [
        { email: 'load_test_1@example.com', password: LOAD_TEST_PASSWORD },
        { email: 'load_test_2@example.com', password: LOAD_TEST_PASSWORD },
        { email: 'load_test_3@example.com', password: LOAD_TEST_PASSWORD },
      ],
    },
    ensure: {
      p95: 500, // 95th percentile under 500ms
      p99: 1000, // 99th percentile under 1s
      maxErrorRate: 1, // Max 1% error rate
    },
  },

  scenarios: [
    // Authentication flow
    {
      name: 'User Authentication',
      weight: 2,
      flow: [
        {
          post: {
            url: AUTH_LOGIN_URL,
            json: {
              email: '{{ testUsers[0].email }}',
              password: '{{ testUsers[0].password }}',
            },
            capture: {
              json: '$.token',
              as: 'authToken',
            },
            expect: [{ statusCode: 200 }, { hasProperty: 'token' }],
          },
        },
        {
          think: 1,
        },
        {
          get: {
            url: '/api/profile/me',
            headers: {
              Authorization: AUTHORIZATION_TOKEN_HEADER,
            },
            expect: [{ statusCode: 200 }],
          },
        },
      ],
    },

    // Discovery flow
    {
      name: 'Profile Discovery',
      weight: 5,
      flow: [
        {
          post: {
            url: AUTH_LOGIN_URL,
            json: {
              email: '{{ testUsers[1].email }}',
              password: '{{ testUsers[1].password }}',
            },
            capture: {
              json: '$.token',
              as: 'authToken',
            },
          },
        },
        {
          loop: [
            {
              get: {
                url: '/api/discovery/profiles?limit=20',
                headers: {
                  Authorization: AUTHORIZATION_TOKEN_HEADER,
                },
                capture: {
                  json: '$.profiles[0].id',
                  as: 'profileId',
                },
                expect: [{ statusCode: 200 }, { hasProperty: 'profiles' }],
              },
            },
            {
              think: [1, 3],
            },
            {
              post: {
                url: '/api/discovery/swipe',
                headers: {
                  Authorization: AUTHORIZATION_TOKEN_HEADER,
                },
                json: {
                  targetUserId: '{{ profileId }}',
                  direction: '{{ $randomString(["left", "right"]) }}',
                },
                expect: [{ statusCode: 200 }],
              },
            },
            {
              think: [0.5, 2],
            },
          ],
          count: 10,
        },
      ],
    },

    // Chat flow
    {
      name: 'Chat Messaging',
      weight: 3,
      flow: [
        {
          post: {
            url: AUTH_LOGIN_URL,
            json: {
              email: '{{ testUsers[2].email }}',
              password: '{{ testUsers[2].password }}',
            },
            capture: {
              json: '$.token',
              as: 'authToken',
            },
          },
        },
        {
          get: {
            url: '/api/chat/conversations',
            headers: {
              Authorization: AUTHORIZATION_TOKEN_HEADER,
            },
            capture: {
              json: '$.conversations[0].id',
              as: 'conversationId',
            },
          },
        },
        {
          loop: [
            {
              get: {
                url: '/api/chat/messages/{{ conversationId }}?limit=50',
                headers: {
                  Authorization: AUTHORIZATION_TOKEN_HEADER,
                },
                expect: [{ statusCode: 200 }],
              },
            },
            {
              think: 2,
            },
            {
              post: {
                url: '/api/chat/send',
                headers: {
                  Authorization: AUTHORIZATION_TOKEN_HEADER,
                },
                json: {
                  conversationId: '{{ conversationId }}',
                  message: 'Load test message {{ $timestamp }}',
                },
                expect: [{ statusCode: 200 }],
              },
            },
            {
              think: [2, 5],
            },
          ],
          count: 5,
        },
      ],
    },

    // Profile updates
    {
      name: 'Profile Updates',
      weight: 1,
      flow: [
        {
          post: {
            url: AUTH_LOGIN_URL,
            json: {
              email: '{{ testUsers[0].email }}',
              password: '{{ testUsers[0].password }}',
            },
            capture: {
              json: '$.token',
              as: 'authToken',
            },
          },
        },
        {
          put: {
            url: '/api/profile/me',
            headers: {
              Authorization: AUTHORIZATION_TOKEN_HEADER,
            },
            json: {
              bio: 'Updated bio at {{ $timestamp }}',
            },
            expect: [{ statusCode: 200 }],
          },
        },
      ],
    },

    // Health check (lightweight)
    {
      name: 'Health Check',
      weight: 1,
      flow: [
        {
          get: {
            url: '/api/health',
            expect: [{ statusCode: 200 }],
          },
        },
      ],
    },
  ],

  // Custom processor for data generation
  processor: './load-test-processor.js',
};
