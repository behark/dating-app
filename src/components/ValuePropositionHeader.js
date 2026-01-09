import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';

/**
 * ValuePropositionHeader component for displaying app value proposition with CTA
 *
 * @param {Object} props
 * @param {string} props.title - Main title text
 * @param {string} props.subtitle - Subtitle/description text
 * @param {string} props.buttonText - Text for the CTA button
 * @param {Function} props.onButtonPress - Callback when button is pressed
 * @param {Object} props.style - Additional styling for the container
 * @param {Array} props.gradientColors - Colors for the button gradient
 */
const ValuePropositionHeader = ({
  title,
  subtitle,
  buttonText,
  onButtonPress,
  style,
  gradientColors = Colors.gradient.primary,
}) => (
  <View style={[styles.container, style]}>
    <View style={styles.content}>
      {title && <Text style={styles.title}>{title}</Text>}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
    {buttonText && onButtonPress && (
      <TouchableOpacity
        style={styles.button}
        onPress={onButtonPress}
        activeOpacity={0.8}
      >
        <LinearGradient colors={gradientColors} style={styles.buttonGradient}>
          <Text style={styles.buttonText}>{buttonText}</Text>
        </LinearGradient>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: Colors.background.white95,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.gray,
  },
  content: {
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text.dark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  button: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Colors.background.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default ValuePropositionHeader;