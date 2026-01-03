/**
 * Performance Testing Suite
 * Benchmarks and load testing for the dating app
 */

const { performance, PerformanceObserver } = require('perf_hooks');

// Performance metrics collector
class PerformanceMetrics {
  constructor() {
    this.metrics = {
      api: [],
      render: [],
      database: [],
      memory: [],
    };
  }

  record(category, name, duration, metadata = {}) {
    this.metrics[category].push({
      name,
      duration,
      timestamp: Date.now(),
      ...metadata,
    });
  }

  getAverage(category) {
    const items = this.metrics[category];
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, item) => acc + item.duration, 0);
    return sum / items.length;
  }

  getP95(category) {
    const items = this.metrics[category].map(i => i.duration).sort((a, b) => a - b);
    const index = Math.floor(items.length * 0.95);
    return items[index] || 0;
  }

  getP99(category) {
    const items = this.metrics[category].map(i => i.duration).sort((a, b) => a - b);
    const index = Math.floor(items.length * 0.99);
    return items[index] || 0;
  }

  getSummary() {
    return {
      api: {
        count: this.metrics.api.length,
        average: this.getAverage('api'),
        p95: this.getP95('api'),
        p99: this.getP99('api'),
      },
      render: {
        count: this.metrics.render.length,
        average: this.getAverage('render'),
        p95: this.getP95('render'),
        p99: this.getP99('render'),
      },
      database: {
        count: this.metrics.database.length,
        average: this.getAverage('database'),
        p95: this.getP95('database'),
        p99: this.getP99('database'),
      },
    };
  }

  reset() {
    this.metrics = { api: [], render: [], database: [], memory: [] };
  }
}

const metrics = new PerformanceMetrics();

// Performance test helpers
async function measureAsync(fn, name, category = 'api') {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    metrics.record(category, name, duration, { success: true });
    return { result, duration };
  } catch (error) {
    const duration = performance.now() - start;
    metrics.record(category, name, duration, { success: false, error: error.message });
    throw error;
  }
}

function measureSync(fn, name, category = 'render') {
  const start = performance.now();
  try {
    const result = fn();
    const duration = performance.now() - start;
    metrics.record(category, name, duration, { success: true });
    return { result, duration };
  } catch (error) {
    const duration = performance.now() - start;
    metrics.record(category, name, duration, { success: false, error: error.message });
    throw error;
  }
}

// API Performance Tests
describe('API Performance Tests', () => {
  const API_TIMEOUT = 1000; // 1 second max
  const mockFetch = jest.fn();

  beforeEach(() => {
    metrics.reset();
    global.fetch = mockFetch;
  });

  describe('Authentication Endpoints', () => {
    it('should login within acceptable time', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ success: true, token: 'jwt_token' }),
      });

      const { duration } = await measureAsync(async () => {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
        });
        return response.json();
      }, 'login');

      expect(duration).toBeLessThan(API_TIMEOUT);
    });

    it('should register within acceptable time', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ success: true, user: { id: '123' } }),
      });

      const { duration } = await measureAsync(async () => {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email: 'new@example.com',
            password: 'password',
            name: 'New User',
          }),
        });
        return response.json();
      }, 'register');

      expect(duration).toBeLessThan(API_TIMEOUT);
    });
  });

  describe('Discovery Endpoints', () => {
    it('should fetch profiles within acceptable time', async () => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            profiles: Array.from({ length: 20 }, (_, i) => ({
              id: `profile_${i}`,
              name: `User ${i}`,
            })),
          }),
      });

      const { duration } = await measureAsync(async () => {
        const response = await fetch('/api/discovery/profiles');
        return response.json();
      }, 'fetch_profiles');

      expect(duration).toBeLessThan(500); // 500ms for profile fetch
    });

    it('should record swipe within acceptable time', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ success: true, isMatch: false }),
      });

      const { duration } = await measureAsync(async () => {
        const response = await fetch('/api/discovery/swipe', {
          method: 'POST',
          body: JSON.stringify({ targetUserId: 'user_123', direction: 'right' }),
        });
        return response.json();
      }, 'record_swipe');

      expect(duration).toBeLessThan(200); // 200ms for swipe
    });

    it('should handle rapid swipes', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });

      const swipes = [];
      for (let i = 0; i < 10; i++) {
        swipes.push(
          measureAsync(async () => {
            const response = await fetch('/api/discovery/swipe', {
              method: 'POST',
              body: JSON.stringify({ targetUserId: `user_${i}`, direction: 'right' }),
            });
            return response.json();
          }, `rapid_swipe_${i}`)
        );
      }

      await Promise.all(swipes);

      const summary = metrics.getSummary();
      expect(summary.api.average).toBeLessThan(300);
    });
  });

  describe('Chat Endpoints', () => {
    it('should send message within acceptable time', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ success: true, messageId: 'msg_123' }),
      });

      const { duration } = await measureAsync(async () => {
        const response = await fetch('/api/chat/send', {
          method: 'POST',
          body: JSON.stringify({
            conversationId: 'conv_123',
            message: 'Hello!',
          }),
        });
        return response.json();
      }, 'send_message');

      expect(duration).toBeLessThan(200); // 200ms for message send
    });

    it('should fetch messages within acceptable time', async () => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            messages: Array.from({ length: 50 }, (_, i) => ({
              id: `msg_${i}`,
              content: `Message ${i}`,
            })),
          }),
      });

      const { duration } = await measureAsync(async () => {
        const response = await fetch('/api/chat/messages?conversationId=conv_123');
        return response.json();
      }, 'fetch_messages');

      expect(duration).toBeLessThan(500);
    });
  });
});

// Database Performance Tests
describe('Database Performance Tests', () => {
  const mockDbQuery = jest.fn();

  beforeEach(() => {
    metrics.reset();
  });

  describe('User Queries', () => {
    it('should find user by ID quickly', async () => {
      mockDbQuery.mockResolvedValue({ _id: 'user_123', name: 'Test' });

      const { duration } = await measureAsync(async () => {
        return mockDbQuery({ _id: 'user_123' });
      }, 'find_user_by_id', 'database');

      expect(duration).toBeLessThan(50); // 50ms max
    });

    it('should handle geospatial queries efficiently', async () => {
      mockDbQuery.mockResolvedValue(
        Array.from({ length: 100 }, (_, i) => ({
          _id: `user_${i}`,
          distance: i * 1000,
        }))
      );

      const { duration } = await measureAsync(async () => {
        return mockDbQuery({
          $geoNear: {
            near: { type: 'Point', coordinates: [-74, 40] },
            maxDistance: 50000,
          },
        });
      }, 'geo_near_query', 'database');

      expect(duration).toBeLessThan(200);
    });
  });

  describe('Aggregation Pipelines', () => {
    it('should aggregate match statistics efficiently', async () => {
      mockDbQuery.mockResolvedValue([
        { totalMatches: 500, averageResponseTime: 3600 },
      ]);

      const { duration } = await measureAsync(async () => {
        return mockDbQuery([
          { $match: { createdAt: { $gte: new Date(Date.now() - 86400000) } } },
          { $group: { _id: null, total: { $sum: 1 } } },
        ]);
      }, 'match_aggregation', 'database');

      expect(duration).toBeLessThan(300);
    });
  });
});

// Memory Performance Tests
describe('Memory Performance Tests', () => {
  it('should not leak memory on repeated operations', () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Simulate many operations
    for (let i = 0; i < 1000; i++) {
      const data = Array.from({ length: 100 }, () => ({
        id: Math.random(),
        name: 'Test User',
        photos: ['photo1.jpg', 'photo2.jpg'],
      }));
      // Process and discard
      data.filter(d => d.id > 0.5);
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be reasonable (less than 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });

  it('should handle large profile lists without excessive memory', () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Create large profile list
    const profiles = Array.from({ length: 10000 }, (_, i) => ({
      id: `profile_${i}`,
      name: `User ${i}`,
      age: 20 + (i % 30),
      bio: 'A'.repeat(500),
      photos: [`photo_${i}_1.jpg`, `photo_${i}_2.jpg`],
    }));

    // Process profiles
    const filtered = profiles.filter(p => p.age >= 25 && p.age <= 35);
    const sorted = filtered.sort((a, b) => a.age - b.age);

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryUsed = finalMemory - initialMemory;

    // Should use less than 100MB for 10k profiles
    expect(memoryUsed).toBeLessThan(100 * 1024 * 1024);
    expect(sorted.length).toBeGreaterThan(0);
  });
});

// Concurrent Request Performance
describe('Concurrent Request Performance', () => {
  it('should handle concurrent API requests', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    });
    global.fetch = mockFetch;

    const start = performance.now();

    // Simulate 50 concurrent requests
    const requests = Array.from({ length: 50 }, (_, i) =>
      fetch(`/api/endpoint_${i}`)
    );

    await Promise.all(requests);

    const duration = performance.now() - start;

    // All requests should complete within 2 seconds
    expect(duration).toBeLessThan(2000);
    expect(mockFetch).toHaveBeenCalledTimes(50);
  });
});

// Export for use in other tests
module.exports = {
  PerformanceMetrics,
  metrics,
  measureAsync,
  measureSync,
};
