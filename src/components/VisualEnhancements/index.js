/**
 * Visual Design Enhancements - Component Index
 *
 * This file exports all the new visual enhancement components for easy importing.
 */

// Profile Components
export { default as InteractivePhotoGallery } from './Profile/InteractivePhotoGallery';
export { default as ProfileCompletionProgress } from './Profile/ProfileCompletionProgress';
export { default as ProfileVideoIntroduction } from './Profile/ProfileVideoIntroduction';
export {
  default as VerificationBadge,
  VerificationBadgeGroup,
  VerificationStatus,
} from './Profile/VerificationBadge';

// Gamification Components
export {
  ACHIEVEMENTS as ACHIEVEMENT_DEFINITIONS,
  default as AchievementBadgeAnimated,
  AchievementShowcase,
} from './Gamification/AchievementBadgeAnimated';
export { default as DailyChallenges } from './Gamification/DailyChallenges';
export { default as LevelProgressionCard } from './Gamification/LevelProgressionCard';

// Chat Components
export {
  default as AnimatedTypingIndicator,
  HeaderTypingIndicator,
  TYPING_ANIMATIONS,
} from './Chat/AnimatedTypingIndicator';
export { CHAT_THEMES, default as ChatThemes, useChatTheme } from './Chat/ChatThemes';
export {
  default as MessageReactions,
  QuickReactionButton,
  REACTIONS,
} from './Chat/MessageReactions';
export { default as MessageScheduler, ScheduledMessagesList } from './Chat/MessageScheduler';

// Existing Gamification Components (re-exports)
export { default as BadgeShowcase } from './Gamification/BadgeShowcase';
export { default as DailyRewardNotification } from './Gamification/DailyRewardNotification';
export { default as StreakCard } from './Gamification/StreakCard';
