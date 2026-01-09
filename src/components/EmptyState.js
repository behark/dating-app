import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';

/**
 * EmptyState component for displaying empty states with optional CTA
 *
 * @param {Object} props
 * @param {string} props.icon - Icon name from Ionicons
 * @param {number} props.iconSize - Size of the icon (default: 80)
 * @param {string} props.title - Main title text
 * @param {string} props.description - Description text
 * @param {string} props.buttonText - Text for the CTA button
 * @param {Function} props.onButtonPress - Callback when button is pressed
 * @param {Array} props.gradientColors - Colors for the background gradient
 * @param {Object} props.style - Additional styling for the container
 */
const EmptyState = ({
  icon,
  iconSize = 80,
  title,
  description,
  buttonText,
  onButtonPress,
  gradientColors = ['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.1)'],
  style,
}) => (
  <View style={[styles.container, style]}>
    <LinearGradient colors={gradientColors} style={styles.card}>
      {icon && (
        <Ionicons name={icon} size={iconSize} color={Colors.primary} />
      )}
      {title && (
        <Text style={styles.title}>{title}</Text>
      )}
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}
      {buttonText && onButtonPress && (
        <TouchableOpacity
          style={styles.button}
          onPress={onButtonPress}
          activeOpacity={0.8}
        >
          <LinearGradient colors={Colors.gradient.primary} style={styles.buttonGradient}>
            <Text style={styles.buttonText}>{buttonText}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </LinearGradient>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  card: {
    width: '100%',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.dark,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  button: {
    borderRadius: 15,
    overflow: 'hidden',
    width: '100%',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Colors.background.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default EmptyState;
