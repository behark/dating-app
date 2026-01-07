import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';

/**
 * EmptyState Component
 * 
 * A reusable component for showing engaging empty states throughout the app.
 * Provides consistent design with illustrations, messages, and call-to-action buttons.
 * 
 * @param {string} icon - Ionicons name for the main icon
 * @param {string} title - Main heading text
 * @param {string} description - Supporting description text
 * @param {string} buttonText - Text for the action button (optional)
 * @param {function} onButtonPress - Handler for button press (optional)
 * @param {string} secondaryButtonText - Text for secondary button (optional)
 * @param {function} onSecondaryButtonPress - Handler for secondary button (optional)
 * @param {string} variant - Visual variant: 'gradient', 'simple', 'minimal' (default: 'gradient')
 * @param {number} iconSize - Size of the icon (default: 80)
 * @param {string} iconColor - Color of the icon (optional)
 */
const EmptyState = ({
  icon = 'heart-outline',
  title = 'Nothing here yet',
  description = '',
  buttonText,
  onButtonPress,
  secondaryButtonText,
  onSecondaryButtonPress,
  variant = 'gradient',
  iconSize = 80,
  iconColor,
  style,
}) => {
  const renderContent = () => (
    <>
      <View style={styles.iconContainer}>
        <Ionicons
          name={icon}
          size={iconSize}
          color={
            iconColor ||
            (variant === 'gradient' ? Colors.background.white : Colors.primary)
          }
        />
      </View>

      <Text
        style={[
          styles.title,
          variant === 'gradient' && styles.titleGradient,
          variant === 'minimal' && styles.titleMinimal,
        ]}
      >
        {title}
      </Text>

      {description ? (
        <Text
          style={[
            styles.description,
            variant === 'gradient' && styles.descriptionGradient,
            variant === 'minimal' && styles.descriptionMinimal,
          ]}
        >
          {description}
        </Text>
      ) : null}

      {buttonText && onButtonPress && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onButtonPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                variant === 'gradient'
                  ? [Colors.background.white, Colors.background.light]
                  : Colors.gradient.primary
              }
              style={styles.actionButtonGradient}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  variant === 'gradient' && styles.actionButtonTextGradient,
                ]}
              >
                {buttonText}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {secondaryButtonText && onSecondaryButtonPress && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onSecondaryButtonPress}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>{secondaryButtonText}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </>
  );

  if (variant === 'gradient') {
    return (
      <View style={[styles.container, style]}>
        <LinearGradient colors={Colors.gradient.primary} style={styles.gradientCard}>
          {renderContent()}
        </LinearGradient>
      </View>
    );
  }

  if (variant === 'minimal') {
    return (
      <View style={[styles.container, styles.minimalContainer, style]}>
        {renderContent()}
      </View>
    );
  }

  // Simple variant (default fallback)
  return (
    <View style={[styles.container, styles.simpleContainer, style]}>
      <View style={styles.simpleCard}>{renderContent()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  gradientCard: {
    borderRadius: 30,
    padding: 40,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  simpleContainer: {
    backgroundColor: Colors.background.white,
  },
  simpleCard: {
    backgroundColor: Colors.background.lightest,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  minimalContainer: {
    backgroundColor: 'transparent',
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.dark,
    marginBottom: 12,
    textAlign: 'center',
  },
  titleGradient: {
    color: Colors.background.white,
    fontSize: 28,
    fontWeight: '800',
  },
  titleMinimal: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  description: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    maxWidth: 300,
  },
  descriptionGradient: {
    color: Colors.text.white90,
    fontSize: 16,
    lineHeight: 24,
  },
  descriptionMinimal: {
    fontSize: 14,
    color: Colors.text.tertiary,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  actionButton: {
    borderRadius: 25,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 280,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: Colors.background.white,
    fontSize: 16,
    fontWeight: '700',
  },
  actionButtonTextGradient: {
    color: Colors.primary,
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    color: Colors.text.white90,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EmptyState;
