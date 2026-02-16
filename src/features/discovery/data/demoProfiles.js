/* eslint-disable no-secrets/no-secrets */
// Demo profiles for guest mode preview
// App launched January 2025 - profiles have varying join dates
export const GUEST_FREE_VIEWS = 10;

// Helper to calculate days ago from current date
const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

export const GUEST_DEMO_PROFILES = [
  {
    id: 'demo_1',
    _id: 'demo_1',
    name: 'Alex',
    age: 28,
    bio: 'Love hiking, coffee, and good conversations. Looking for someone to explore the city with!',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    ],
    interests: ['hiking', 'coffee', 'travel', 'photography'],
    distance: 5,
    isVerified: true,
    isDemo: true,
    createdAt: daysAgo(340), // Early adopter - joined shortly after launch
    lastActive: daysAgo(0), // Active today
  },
  {
    id: 'demo_2',
    _id: 'demo_2',
    name: 'Jordan',
    age: 26,
    bio: 'Foodie, bookworm, and adventure seeker. Always up for trying something new!',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    ],
    interests: ['food', 'books', 'yoga', 'music'],
    distance: 12,
    isVerified: false,
    isDemo: true,
    createdAt: daysAgo(280), // Joined 9 months ago
    lastActive: daysAgo(1),
  },
  {
    id: 'demo_3',
    _id: 'demo_3',
    name: 'Taylor',
    age: 30,
    bio: "Fitness enthusiast, dog lover, and weekend explorer. Let's make memories together!",
    photoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    photos: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400',
    ],
    interests: ['fitness', 'dogs', 'travel', 'cooking'],
    distance: 8,
    isVerified: true,
    isDemo: true,
    createdAt: daysAgo(220), // Joined 7 months ago
    lastActive: daysAgo(0),
  },
  {
    id: 'demo_4',
    _id: 'demo_4',
    name: 'Sam',
    age: 27,
    bio: 'Creative soul, music lover, and sunset chaser. Looking for my person to share adventures with.',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
    ],
    interests: ['music', 'art', 'beach', 'photography'],
    distance: 15,
    isVerified: false,
    isDemo: true,
    createdAt: daysAgo(150), // Joined 5 months ago
    lastActive: daysAgo(2),
  },
  {
    id: 'demo_5',
    _id: 'demo_5',
    name: 'Casey',
    age: 29,
    bio: "Tech enthusiast, coffee addict, and weekend warrior. Let's build something amazing together!",
    photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400',
    ],
    interests: ['technology', 'coffee', 'hiking', 'gaming'],
    distance: 20,
    isVerified: true,
    isDemo: true,
    createdAt: daysAgo(90), // Joined 3 months ago
    lastActive: daysAgo(0),
  },
  {
    id: 'demo_6',
    _id: 'demo_6',
    name: 'Maya',
    age: 27,
    bio: 'Photographer, tea lover, and weekend trail runner. Always chasing golden hour.',
    photoURL: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
    photos: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400',
    ],
    interests: ['photography', 'running', 'travel', 'art'],
    distance: 9,
    isVerified: true,
    isDemo: true,
    createdAt: daysAgo(365), // OG user - joined at launch
    lastActive: daysAgo(0),
  },
  {
    id: 'demo_7',
    _id: 'demo_7',
    name: 'Diego',
    age: 31,
    bio: "Chef by day, salsa dancer by night. Let's find the best tacos in town.",
    photoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    photos: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    ],
    interests: ['cooking', 'dance', 'food', 'music'],
    distance: 14,
    isVerified: false,
    isDemo: true,
    createdAt: daysAgo(60), // Joined 2 months ago
    lastActive: daysAgo(1),
  },
  {
    id: 'demo_8',
    _id: 'demo_8',
    name: 'Priya',
    age: 29,
    bio: 'Product designer who loves museums, indie films, and handwritten notes.',
    photoURL: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400',
    photos: [
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
    ],
    interests: ['design', 'movies', 'museums', 'coffee'],
    distance: 6,
    isVerified: true,
    isDemo: true,
    createdAt: daysAgo(30), // Joined 1 month ago
    lastActive: daysAgo(0),
  },
  {
    id: 'demo_9',
    _id: 'demo_9',
    name: 'Hana',
    age: 24,
    bio: 'Bookshop explorer, brunch enthusiast, and watercolor artist.',
    photoURL: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
    photos: [
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400',
    ],
    interests: ['art', 'books', 'brunch', 'travel'],
    distance: 11,
    isVerified: false,
    isDemo: true,
    createdAt: daysAgo(14), // Joined 2 weeks ago
    lastActive: daysAgo(0),
  },
  {
    id: 'demo_10',
    _id: 'demo_10',
    name: 'Noah',
    age: 32,
    bio: 'Runner, podcast addict, and aspiring home barista.',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    ],
    interests: ['running', 'coffee', 'podcasts', 'travel'],
    distance: 4,
    isVerified: true,
    isDemo: true,
    createdAt: daysAgo(3), // New user - just joined!
    lastActive: daysAgo(0),
  },
];

export default GUEST_DEMO_PROFILES;
