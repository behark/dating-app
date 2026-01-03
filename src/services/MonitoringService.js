// Monitoring service for performance tracking and error reporting
export class MonitoringService {
  static performanceMarks = new Map();

  // Performance monitoring
  static startPerformanceMark(name) {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${name}-start`);
      this.performanceMarks.set(name, Date.now());
    }
  }

  static endPerformanceMark(name) {
    if (typeof performance !== 'undefined' && performance.mark) {
      try {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);

        const startTime = this.performanceMarks.get(name);
        if (startTime) {
          const duration = Date.now() - startTime;
          console.log(`Performance: ${name} took ${duration}ms`);

          // Log to analytics
          if (window.gtag) {
            window.gtag('event', 'performance_metric', {
              metric_name: name,
              value: duration,
              unit: 'ms',
            });
          }
        }
      } catch (error) {
        console.warn('Performance measurement failed:', error);
      } finally {
        this.performanceMarks.delete(name);
      }
    }
  }

  // Error monitoring
  static captureException(error, context = {}) {
    console.error('Exception captured:', error, context);

    // In production, send to error reporting service
    if (!__DEV__) {
      // Example: Send to Sentry, LogRocket, or similar
      this.sendToErrorReporting(error, context);
    }
  }

  static sendToErrorReporting(error, context) {
    // Placeholder for error reporting service integration
    // Replace with actual error reporting service (Sentry, Bugsnag, etc.)

    const errorReport = {
      message: error.message,
      stack: error.stack,
      context: context,
      timestamp: new Date().toISOString(),
      userAgent: navigator?.userAgent,
      url: window?.location?.href,
    };

    // Send to your error reporting endpoint
    fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorReport),
    }).catch(err => {
      console.warn('Failed to send error report:', err);
    });
  }

  // User interaction tracking
  static trackUserInteraction(action, details = {}) {
    if (__DEV__) {
      console.log('User interaction:', action, details);
    }

    // Track in analytics
    if (window.gtag) {
      window.gtag('event', 'user_interaction', {
        action: action,
        ...details,
      });
    }
  }

  // Network request monitoring
  static monitorNetworkRequest(url, method, startTime) {
    const duration = Date.now() - startTime;

    if (__DEV__) {
      console.log(`Network: ${method} ${url} - ${duration}ms`);
    }

    // Log slow requests
    if (duration > 3000) {
      console.warn(`Slow network request: ${method} ${url} took ${duration}ms`);
    }

    // Track in analytics
    if (window.gtag) {
      window.gtag('event', 'network_request', {
        url: url,
        method: method,
        duration: duration,
      });
    }
  }

  // Memory usage monitoring
  static logMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;

      const memoryUsage = {
        used: Math.round(usedJSHeapSize / 1024 / 1024), // MB
        total: Math.round(totalJSHeapSize / 1024 / 1024), // MB
        limit: Math.round(jsHeapSizeLimit / 1024 / 1024), // MB
        percentage: Math.round((usedJSHeapSize / jsHeapSizeLimit) * 100),
      };

      console.log('Memory usage:', memoryUsage);

      // Warn if memory usage is high
      if (memoryUsage.percentage > 80) {
        console.warn('High memory usage detected:', memoryUsage.percentage + '%');
      }

      return memoryUsage;
    }

    return null;
  }

  // App lifecycle monitoring
  static trackAppLifecycle(event, details = {}) {
    console.log('App lifecycle:', event, details);

    if (window.gtag) {
      window.gtag('event', 'app_lifecycle', {
        lifecycle_event: event,
        ...details,
      });
    }
  }

  // Feature usage tracking
  static trackFeatureUsage(feature, details = {}) {
    if (__DEV__) {
      console.log('Feature used:', feature, details);
    }

    if (window.gtag) {
      window.gtag('event', 'feature_usage', {
        feature: feature,
        ...details,
      });
    }
  }

  // Health check
  static async performHealthCheck() {
    const checks = {
      timestamp: new Date().toISOString(),
      checks: {},
    };

    try {
      // Check network connectivity
      const networkCheck = await fetch('/health', { method: 'HEAD' })
        .then(() => 'ok')
        .catch(() => 'failed');
      checks.checks.network = networkCheck;

      // Check memory usage
      const memoryUsage = this.logMemoryUsage();
      checks.checks.memory = memoryUsage ? 'ok' : 'unavailable';

      // Check local storage
      try {
        localStorage.setItem('health_check', 'test');
        localStorage.removeItem('health_check');
        checks.checks.storage = 'ok';
      } catch {
        checks.checks.storage = 'failed';
      }

      console.log('Health check results:', checks);
      return checks;
    } catch (error) {
      console.error('Health check failed:', error);
      return { ...checks, error: error.message };
    }
  }

  // Initialize monitoring
  static initialize() {
    // Set up global error handlers
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.captureException(event.error, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.captureException(event.reason, {
          type: 'unhandledrejection',
        });
      });
    }

    // Periodic health checks (every 5 minutes)
    if (!__DEV__) {
      setInterval(() => {
        this.performHealthCheck();
      }, 5 * 60 * 1000);
    }

    console.log('Monitoring service initialized');
  }
}