/**
 * Haptic Feedback Utility
 *
 * Provides consistent haptic feedback across the app.
 * Uses expo-haptics for iOS and Android support.
 */

import * as Haptics from 'expo-haptics';
import logger from './logger';

/**
 * Check if haptics are available on this device
 */
const isHapticsAvailable = async () => {
  // Expo Haptics is available on supported native platforms.
  return true;
};

/**
 * Light Impact - For subtle interactions
 * Use for: button taps, tab switches, card reveals
 */
export const lightImpact = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    // Silently fail - haptics are not critical
    logger.debug('Light haptic feedback failed:', error);
  }
};

/**
 * Medium Impact - For standard interactions
 * Use for: like/pass actions, message sent, card swipes
 */
export const mediumImpact = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    logger.debug('Medium haptic feedback failed:', error);
  }
};

/**
 * Heavy Impact - For important actions
 * Use for: match moments, super likes, important confirmations
 */
export const heavyImpact = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {
    logger.debug('Heavy haptic feedback failed:', error);
  }
};

/**
 * Success Notification - For positive outcomes
 * Use for: successful match, message delivered, profile updated
 */
export const successNotification = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    logger.debug('Success haptic feedback failed:', error);
  }
};

/**
 * Warning Notification - For warning states
 * Use for: approaching limit, important notice
 */
export const warningNotification = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (error) {
    logger.debug('Warning haptic feedback failed:', error);
  }
};

/**
 * Error Notification - For errors
 * Use for: failed action, error state, validation error
 */
export const errorNotification = async () => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    logger.debug('Error haptic feedback failed:', error);
  }
};

/**
 * Selection Changed - For picker/slider interactions
 * Use for: scrolling through options, adjusting sliders
 */
export const selectionChanged = async () => {
  try {
    await Haptics.selectionAsync();
  } catch (error) {
    logger.debug('Selection haptic feedback failed:', error);
  }
};

/**
 * Custom Haptic Pattern - For special moments
 * Creates a celebratory pattern for matches
 */
export const matchCelebration = async () => {
  try {
    // Triple burst for celebration
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    logger.debug('Match celebration haptic failed:', error);
  }
};

/**
 * Swipe Feedback - For card swipe gestures
 * @param {string} direction - 'left' or 'right'
 */
export const swipeFeedback = async (direction) => {
  try {
    if (direction === 'right') {
      // Like - medium positive impact
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      // Pass - light impact
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (error) {
    logger.debug('Swipe haptic feedback failed:', error);
  }
};

export default {
  lightImpact,
  mediumImpact,
  heavyImpact,
  successNotification,
  warningNotification,
  errorNotification,
  selectionChanged,
  matchCelebration,
  swipeFeedback,
  isHapticsAvailable,
};
