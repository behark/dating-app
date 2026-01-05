/**
 * Performance Benchmark Suite
 * Measures and reports performance metrics
 */

const Benchmark = require('benchmark');

// Create benchmark suite
const suite = new Benchmark.Suite('Dating App Performance');

// Mock data generators
const generateUsers = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: `user_${i}`,
    name: `User ${i}`,
    age: 20 + (i % 40),
    bio: 'A sample bio that represents typical user content '.repeat(5),
    photos: Array.from({ length: 5 }, (_, j) => `photo_${i}_${j}.jpg`),
    interests: ['hiking', 'music', 'travel', 'food', 'fitness'].slice(0, 3 + (i % 3)),
    location: {
      latitude: 40 + Math.random() * 10,
      longitude: -74 + Math.random() * 10,
    },
    preferences: {
      ageRange: { min: 18, max: 50 },
      distance: 50,
      gender: ['male', 'female'],
    },
  }));

// Distance calculation (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Profile matching algorithm
const calculateCompatibility = (user1, user2) => {
  let score = 0;

  // Interest match
  const commonInterests = user1.interests.filter((i) => user2.interests.includes(i));
  score += (commonInterests.length / Math.max(user1.interests.length, user2.interests.length)) * 40;

  // Age compatibility
  const ageDiff = Math.abs(user1.age - user2.age);
  score += Math.max(0, 30 - ageDiff) * (30 / 30);

  // Distance score
  const distance = calculateDistance(
    user1.location.latitude,
    user1.location.longitude,
    user2.location.latitude,
    user2.location.longitude
  );
  score += Math.max(0, 30 - distance / 5);

  return Math.min(100, Math.round(score));
};

// Benchmark tests
const smallDataset = generateUsers(100);
const mediumDataset = generateUsers(1000);
const largeDataset = generateUsers(10000);

// Filter profiles benchmark
suite.add('Filter profiles (100 users)', () => {
  const currentUser = smallDataset[0];
  smallDataset.filter(
    (u) =>
      u.id !== currentUser.id &&
      u.age >= currentUser.preferences.ageRange.min &&
      u.age <= currentUser.preferences.ageRange.max
  );
});

suite.add('Filter profiles (1000 users)', () => {
  const currentUser = mediumDataset[0];
  mediumDataset.filter(
    (u) =>
      u.id !== currentUser.id &&
      u.age >= currentUser.preferences.ageRange.min &&
      u.age <= currentUser.preferences.ageRange.max
  );
});

suite.add('Filter profiles (10000 users)', () => {
  const currentUser = largeDataset[0];
  largeDataset.filter(
    (u) =>
      u.id !== currentUser.id &&
      u.age >= currentUser.preferences.ageRange.min &&
      u.age <= currentUser.preferences.ageRange.max
  );
});

// Distance calculation benchmark
suite.add('Calculate distance (100 users)', () => {
  const currentUser = smallDataset[0];
  smallDataset.map((u) =>
    calculateDistance(
      currentUser.location.latitude,
      currentUser.location.longitude,
      u.location.latitude,
      u.location.longitude
    )
  );
});

suite.add('Calculate distance (1000 users)', () => {
  const currentUser = mediumDataset[0];
  mediumDataset.map((u) =>
    calculateDistance(
      currentUser.location.latitude,
      currentUser.location.longitude,
      u.location.latitude,
      u.location.longitude
    )
  );
});

// Compatibility scoring benchmark
suite.add('Calculate compatibility (100 users)', () => {
  const currentUser = smallDataset[0];
  smallDataset.map((u) => calculateCompatibility(currentUser, u));
});

suite.add('Calculate compatibility (1000 users)', () => {
  const currentUser = mediumDataset[0];
  mediumDataset.map((u) => calculateCompatibility(currentUser, u));
});

// Sort and rank benchmark
suite.add('Sort by compatibility (1000 users)', () => {
  const currentUser = mediumDataset[0];
  const scored = mediumDataset.map((u) => ({
    ...u,
    compatibility: calculateCompatibility(currentUser, u),
  }));
  scored.sort((a, b) => b.compatibility - a.compatibility);
});

// JSON serialization benchmark
suite.add('JSON serialize profiles (1000 users)', () => {
  JSON.stringify(mediumDataset);
});

suite.add('JSON parse profiles (1000 users)', () => {
  const serialized = JSON.stringify(mediumDataset);
  JSON.parse(serialized);
});

// Array operations benchmark
suite.add('Map + Filter + Sort (1000 users)', () => {
  const currentUser = mediumDataset[0];
  mediumDataset
    .filter((u) => u.id !== currentUser.id)
    .map((u) => ({
      ...u,
      distance: calculateDistance(
        currentUser.location.latitude,
        currentUser.location.longitude,
        u.location.latitude,
        u.location.longitude
      ),
      compatibility: calculateCompatibility(currentUser, u),
    }))
    .filter((u) => u.distance <= 50)
    .sort((a, b) => b.compatibility - a.compatibility);
});

// Run benchmarks
suite
  .on('cycle', (event) => {
    console.log(String(event.target));
  })
  .on('complete', function () {
    console.log('\n📊 Benchmark Results Summary:');
    console.log('================================');

    this.forEach((benchmark) => {
      const opsPerSec = benchmark.hz.toFixed(2);
      const meanMs = ((1 / benchmark.hz) * 1000).toFixed(4);
      console.log(`${benchmark.name}:`);
      console.log(`  - ${opsPerSec} ops/sec`);
      console.log(`  - ${meanMs}ms per operation`);
      console.log('');
    });

    console.log('Fastest:', this.filter('fastest').map('name').join(', '));
    console.log('Slowest:', this.filter('slowest').map('name').join(', '));
  });

// Export for programmatic use
module.exports = {
  suite,
  generateUsers,
  calculateDistance,
  calculateCompatibility,
};

// Run if executed directly
if (require.main === module) {
  console.log('🚀 Starting Performance Benchmarks...\n');
  suite.run({ async: true });
}
