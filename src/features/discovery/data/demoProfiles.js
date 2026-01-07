// Demo profiles for guest mode preview
export const GUEST_FREE_VIEWS = 10;

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
  },
];

export default GUEST_DEMO_PROFILES;
