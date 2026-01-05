/**
 * Beta User Testing Scenarios
 * Test scenarios for manual beta testing validation
 */

module.exports = {
  testSuites: [
    {
      name: 'User Onboarding',
      scenarios: [
        {
          id: 'ONB-001',
          name: 'New user registration via phone',
          priority: 'P0',
          steps: [
            'Open app for first time',
            'Enter phone number',
            'Receive and enter OTP code',
            'Create profile with required fields',
            'Upload at least one photo',
            'Set dating preferences',
            'Complete onboarding',
          ],
          expectedResult: 'User is registered and sees discovery screen',
          device: ['iOS', 'Android'],
          tags: ['critical', 'onboarding'],
        },
        {
          id: 'ONB-002',
          name: 'Social login (Google)',
          priority: 'P1',
          steps: [
            'Open app',
            'Tap "Continue with Google"',
            'Authenticate with Google account',
            'Complete profile setup',
          ],
          expectedResult: 'User is registered via Google OAuth',
          device: ['iOS', 'Android'],
          tags: ['auth', 'social'],
        },
        {
          id: 'ONB-003',
          name: 'Profile photo requirements',
          priority: 'P1',
          steps: [
            'Navigate to profile setup',
            'Try to skip photo upload',
            "Upload photo that doesn't meet requirements",
            'Upload valid photo',
          ],
          expectedResult: 'Only valid photos are accepted, minimum 1 required',
          device: ['iOS', 'Android'],
          tags: ['profile', 'photos'],
        },
      ],
    },
    {
      name: 'Discovery & Matching',
      scenarios: [
        {
          id: 'DIS-001',
          name: 'Basic swipe functionality',
          priority: 'P0',
          steps: [
            'Navigate to discovery screen',
            'Swipe right on a profile (like)',
            'Swipe left on a profile (pass)',
            'Tap X button (pass)',
            'Tap heart button (like)',
          ],
          expectedResult: 'All swipe actions work correctly',
          device: ['iOS', 'Android'],
          tags: ['critical', 'discovery'],
        },
        {
          id: 'DIS-002',
          name: 'Super Like functionality',
          priority: 'P1',
          steps: [
            'Navigate to discovery screen',
            'Swipe up on profile OR tap star button',
            'Verify Super Like animation',
            'Check daily Super Like limit',
          ],
          expectedResult: 'Super Like sent, limit enforced for free users',
          device: ['iOS', 'Android'],
          tags: ['discovery', 'premium'],
        },
        {
          id: 'DIS-003',
          name: 'Match creation',
          priority: 'P0',
          steps: [
            'Like a profile that has already liked you',
            'Verify match animation appears',
            'Check that match appears in matches list',
            'Verify chat is enabled for match',
          ],
          expectedResult: 'Match created, both users notified, chat enabled',
          device: ['iOS', 'Android'],
          tags: ['critical', 'matching'],
        },
        {
          id: 'DIS-004',
          name: 'Filter preferences',
          priority: 'P1',
          steps: [
            'Open discovery filters',
            'Set age range (e.g., 25-35)',
            'Set distance limit (e.g., 50km)',
            'Apply filters',
            'Verify profiles match criteria',
          ],
          expectedResult: 'Only profiles matching filters are shown',
          device: ['iOS', 'Android'],
          tags: ['discovery', 'filters'],
        },
        {
          id: 'DIS-005',
          name: 'Undo last swipe',
          priority: 'P2',
          steps: ['Swipe left on a profile', 'Tap undo button', 'Verify profile returns'],
          expectedResult: 'Previous profile restored (premium feature)',
          device: ['iOS', 'Android'],
          tags: ['discovery', 'premium'],
        },
      ],
    },
    {
      name: 'Messaging',
      scenarios: [
        {
          id: 'MSG-001',
          name: 'Send text message',
          priority: 'P0',
          steps: [
            'Open chat with a match',
            'Type a message',
            'Tap send button',
            'Verify message appears in chat',
            'Verify delivery indicator',
          ],
          expectedResult: 'Message sent and displayed correctly',
          device: ['iOS', 'Android'],
          tags: ['critical', 'chat'],
        },
        {
          id: 'MSG-002',
          name: 'Receive message (real-time)',
          priority: 'P0',
          steps: [
            'Have another user send you a message',
            'Verify message appears without refresh',
            'Verify push notification received',
            'Verify badge count updated',
          ],
          expectedResult: 'Message received in real-time',
          device: ['iOS', 'Android'],
          tags: ['critical', 'chat', 'realtime'],
        },
        {
          id: 'MSG-003',
          name: 'Send photo in chat',
          priority: 'P1',
          steps: [
            'Open chat with match',
            'Tap photo attachment button',
            'Select photo from gallery OR take new photo',
            'Send photo',
            'Verify photo displays correctly',
          ],
          expectedResult: 'Photo sent and rendered correctly',
          device: ['iOS', 'Android'],
          tags: ['chat', 'media'],
        },
        {
          id: 'MSG-004',
          name: 'Send GIF',
          priority: 'P2',
          steps: ['Open chat', 'Tap GIF button', 'Search for GIF', 'Select and send GIF'],
          expectedResult: 'GIF sent and animates in chat',
          device: ['iOS', 'Android'],
          tags: ['chat', 'media'],
        },
        {
          id: 'MSG-005',
          name: 'Voice notes (beta)',
          priority: 'P2',
          featureFlag: 'beta_voice_notes',
          steps: [
            'Open chat with match',
            'Tap and hold microphone button',
            'Record voice message',
            'Release to send',
            'Verify voice note plays correctly',
          ],
          expectedResult: 'Voice note recorded and playable',
          device: ['iOS', 'Android'],
          tags: ['chat', 'beta', 'voice'],
        },
      ],
    },
    {
      name: 'Profile Management',
      scenarios: [
        {
          id: 'PRO-001',
          name: 'Edit profile information',
          priority: 'P1',
          steps: [
            'Navigate to profile screen',
            'Tap edit button',
            'Modify name, bio, job, education',
            'Save changes',
            'Verify changes reflected',
          ],
          expectedResult: 'Profile updated successfully',
          device: ['iOS', 'Android'],
          tags: ['profile'],
        },
        {
          id: 'PRO-002',
          name: 'Reorder profile photos',
          priority: 'P1',
          steps: [
            'Go to edit profile',
            'Long press on a photo',
            'Drag to new position',
            'Save changes',
            'Verify new order',
          ],
          expectedResult: 'Photo order saved correctly',
          device: ['iOS', 'Android'],
          tags: ['profile', 'photos'],
        },
        {
          id: 'PRO-003',
          name: 'Add/remove photos',
          priority: 'P1',
          steps: [
            'Go to edit profile',
            'Add new photo',
            'Delete existing photo',
            'Verify minimum photo requirement',
          ],
          expectedResult: 'Photos managed correctly, min 1 enforced',
          device: ['iOS', 'Android'],
          tags: ['profile', 'photos'],
        },
        {
          id: 'PRO-004',
          name: 'Profile verification',
          priority: 'P2',
          steps: [
            'Navigate to verification section',
            'Follow photo verification steps',
            'Submit verification photo',
            'Check verification status',
          ],
          expectedResult: 'Verification badge applied when approved',
          device: ['iOS', 'Android'],
          tags: ['profile', 'verification'],
        },
      ],
    },
    {
      name: 'Premium Features',
      scenarios: [
        {
          id: 'PRE-001',
          name: 'Purchase premium subscription',
          priority: 'P0',
          steps: [
            'Navigate to premium screen',
            'Select subscription plan',
            'Complete in-app purchase',
            'Verify premium status activated',
          ],
          expectedResult: 'Premium unlocked after purchase',
          device: ['iOS', 'Android'],
          tags: ['critical', 'premium', 'payment'],
        },
        {
          id: 'PRE-002',
          name: 'See who liked you',
          priority: 'P1',
          steps: [
            'As premium user, navigate to Likes section',
            'View profiles that liked you',
            'Like back to create match',
          ],
          expectedResult: 'Premium users can see and interact with likes',
          device: ['iOS', 'Android'],
          tags: ['premium'],
        },
        {
          id: 'PRE-003',
          name: 'Boost profile',
          priority: 'P1',
          steps: [
            'Tap boost button',
            'Confirm boost activation',
            'Verify boost indicator',
            'Check boost statistics after duration',
          ],
          expectedResult: 'Profile boosted for set duration',
          device: ['iOS', 'Android'],
          tags: ['premium', 'boost'],
        },
        {
          id: 'PRE-004',
          name: 'Restore purchases',
          priority: 'P1',
          steps: [
            'Reinstall app OR login on new device',
            'Navigate to settings',
            'Tap restore purchases',
            'Verify premium status restored',
          ],
          expectedResult: 'Previous purchases restored',
          device: ['iOS', 'Android'],
          tags: ['premium', 'payment'],
        },
      ],
    },
    {
      name: 'Safety & Privacy',
      scenarios: [
        {
          id: 'SAF-001',
          name: 'Block user',
          priority: 'P0',
          steps: [
            'Open profile or chat with user',
            'Tap more options menu',
            'Select block user',
            'Confirm block',
            'Verify user no longer visible',
          ],
          expectedResult: 'User blocked, removed from all views',
          device: ['iOS', 'Android'],
          tags: ['critical', 'safety'],
        },
        {
          id: 'SAF-002',
          name: 'Report user',
          priority: 'P0',
          steps: [
            'Open user profile',
            'Tap report button',
            'Select report reason',
            'Add optional details',
            'Submit report',
          ],
          expectedResult: 'Report submitted successfully',
          device: ['iOS', 'Android'],
          tags: ['critical', 'safety'],
        },
        {
          id: 'SAF-003',
          name: 'Unmatch user',
          priority: 'P1',
          steps: [
            'Open chat with match',
            'Tap unmatch option',
            'Confirm unmatch',
            'Verify match removed',
          ],
          expectedResult: 'Match removed, chat deleted',
          device: ['iOS', 'Android'],
          tags: ['safety'],
        },
        {
          id: 'SAF-004',
          name: 'Privacy settings',
          priority: 'P1',
          steps: [
            'Navigate to privacy settings',
            'Toggle hide online status',
            'Toggle hide distance',
            'Toggle read receipts',
            'Verify settings applied',
          ],
          expectedResult: 'Privacy settings work correctly',
          device: ['iOS', 'Android'],
          tags: ['privacy'],
        },
        {
          id: 'SAF-005',
          name: 'Delete account',
          priority: 'P1',
          steps: [
            'Navigate to account settings',
            'Select delete account',
            'Confirm deletion',
            'Verify account removed',
            'Verify cannot login',
          ],
          expectedResult: 'Account permanently deleted',
          device: ['iOS', 'Android'],
          tags: ['account', 'privacy'],
        },
      ],
    },
    {
      name: 'Notifications',
      scenarios: [
        {
          id: 'NOT-001',
          name: 'Push notification - new match',
          priority: 'P1',
          steps: [
            'Have app in background',
            'Create match with another user',
            'Verify push notification received',
            'Tap notification to open match',
          ],
          expectedResult: 'Notification received and navigates correctly',
          device: ['iOS', 'Android'],
          tags: ['notifications'],
        },
        {
          id: 'NOT-002',
          name: 'Push notification - new message',
          priority: 'P1',
          steps: [
            'Have app in background',
            'Receive message from match',
            'Verify notification shows preview',
            'Tap to open chat',
          ],
          expectedResult: 'Message notification received',
          device: ['iOS', 'Android'],
          tags: ['notifications'],
        },
        {
          id: 'NOT-003',
          name: 'Notification settings',
          priority: 'P2',
          steps: [
            'Navigate to notification settings',
            'Toggle various notification types',
            'Verify settings respected',
          ],
          expectedResult: 'Notification preferences work',
          device: ['iOS', 'Android'],
          tags: ['notifications', 'settings'],
        },
      ],
    },
    {
      name: 'Performance & Reliability',
      scenarios: [
        {
          id: 'PER-001',
          name: 'App launch time',
          priority: 'P1',
          steps: ['Force close app', 'Launch app', 'Measure time to interactive state'],
          expectedResult: 'App launches in < 3 seconds',
          device: ['iOS', 'Android'],
          tags: ['performance'],
        },
        {
          id: 'PER-002',
          name: 'Offline mode',
          priority: 'P1',
          steps: [
            'Enable airplane mode',
            'Open app',
            'Navigate to cached screens',
            'Try to send message (should queue)',
            'Disable airplane mode',
            'Verify message sent',
          ],
          expectedResult: 'App handles offline gracefully',
          device: ['iOS', 'Android'],
          tags: ['performance', 'offline'],
        },
        {
          id: 'PER-003',
          name: 'Memory usage',
          priority: 'P2',
          steps: [
            'Open app',
            'Use app for 30 minutes',
            'Check memory usage',
            'Verify no memory leaks',
          ],
          expectedResult: 'Memory usage stays reasonable',
          device: ['iOS', 'Android'],
          tags: ['performance'],
        },
        {
          id: 'PER-004',
          name: 'Battery consumption',
          priority: 'P2',
          steps: ['Note battery level', 'Use app for 1 hour', 'Check battery usage'],
          expectedResult: 'Battery usage is reasonable',
          device: ['iOS', 'Android'],
          tags: ['performance'],
        },
      ],
    },
    {
      name: 'Beta Features',
      scenarios: [
        {
          id: 'BET-001',
          name: 'Video chat initiation',
          priority: 'P2',
          featureFlag: 'beta_video_chat',
          steps: [
            'Open chat with match',
            'Tap video call button',
            'Wait for other user to accept',
            'Verify video connection',
          ],
          expectedResult: 'Video call connects successfully',
          device: ['iOS', 'Android'],
          tags: ['beta', 'video'],
        },
        {
          id: 'BET-002',
          name: 'AI icebreakers',
          priority: 'P2',
          featureFlag: 'beta_icebreakers',
          steps: [
            'Open new match chat',
            'Check for AI suggested icebreakers',
            'Tap to use icebreaker',
            'Verify message sent',
          ],
          expectedResult: 'AI icebreakers appear and work',
          device: ['iOS', 'Android'],
          tags: ['beta', 'ai'],
        },
        {
          id: 'BET-003',
          name: 'Date spot suggestions',
          priority: 'P3',
          featureFlag: 'beta_date_spots',
          steps: [
            'Open chat with match',
            'Tap date spot suggestion button',
            'View suggested locations',
            'Share location with match',
          ],
          expectedResult: 'Date spots suggested and shareable',
          device: ['iOS', 'Android'],
          tags: ['beta'],
        },
      ],
    },
  ],

  // Generate test execution checklist
  generateChecklist(platform = null) {
    const checklist = [];

    this.testSuites.forEach((suite) => {
      suite.scenarios.forEach((scenario) => {
        if (!platform || scenario.device.includes(platform)) {
          checklist.push({
            id: scenario.id,
            suite: suite.name,
            name: scenario.name,
            priority: scenario.priority,
            featureFlag: scenario.featureFlag || null,
            status: 'pending', // pending, passed, failed, blocked
            tester: null,
            notes: '',
            bugs: [],
          });
        }
      });
    });

    return checklist;
  },

  // Get high priority scenarios
  getCriticalPath() {
    const critical = [];
    this.testSuites.forEach((suite) => {
      suite.scenarios.forEach((scenario) => {
        if (scenario.priority === 'P0') {
          critical.push(scenario);
        }
      });
    });
    return critical;
  },

  // Get scenarios by tag
  getByTag(tag) {
    const tagged = [];
    this.testSuites.forEach((suite) => {
      suite.scenarios.forEach((scenario) => {
        if (scenario.tags.includes(tag)) {
          tagged.push({ suite: suite.name, ...scenario });
        }
      });
    });
    return tagged;
  },
};
