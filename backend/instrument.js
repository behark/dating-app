/**
 * Sentry Instrumentation
 * Initialize Sentry as early as possible in the application lifecycle
 * This file must be imported at the very top of server.js
 */

const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');

// Only initialize if DSN is provided
if (process.env.SENTRY_DSN) {
  // @ts-ignore - profiling-node uses different @sentry/core version
  const profilingIntegration = nodeProfilingIntegration();
  
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.RELEASE_VERSION || 'unknown',

    // @ts-ignore - integration types may differ between Sentry packages
    integrations: [
      // @ts-ignore - profiling-node uses different @sentry/core version
      profilingIntegration,
      // HTTP calls tracing
      Sentry.httpIntegration(),
      // Express integration for request/error handling
      Sentry.expressIntegration(),
      // Mongo tracing
      Sentry.mongoIntegration(),
    ],

    // Send structured logs to Sentry
    enableLogs: true,

    // Tracing - capture 100% of transactions (as per Sentry recommendation)
    tracesSampleRate: 1.0,

    // Profiling - capture 100% of sessions (as per Sentry recommendation)
    profileSessionSampleRate: 1.0,

    // Trace lifecycle automatically enables profiling during active traces
    profileLifecycle: 'trace',

    // Setting this option to true will send default PII data to Sentry
    // For example, automatic IP address collection on events
    sendDefaultPii: true,

    // Filter sensitive data
    beforeSend(event, hint) {
      // Remove sensitive data
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
      }
      return event;
    },

    // Ignore common non-critical errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Network request failed',
      'Load failed',
      'ChunkLoadError',
    ],
  });

  console.log('✅ Sentry initialized with profiling');
} else {
  console.log('⚠️  Sentry DSN not configured, skipping Sentry initialization');
}

// Profiling happens automatically after setting it up with `Sentry.init()`.
// All spans (unless those discarded by sampling) will have profiling data attached to them.

module.exports = Sentry;
