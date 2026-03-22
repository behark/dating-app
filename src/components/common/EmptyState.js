import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';

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
 * @param {string} props.secondaryButtonText - Text for the secondary button
 * @param {Function} props.onSecondaryButtonPress - Callback when secondary button is pressed
 * @param {string} props.variant - Variant style ('default' | 'simple')
 * @param {Array} props.gradientColors - Colors for the background gradient
 * @param {Object} props.style - Additional styling for the container
 */
const EmptyState = ({
  icon,
  iconSize = 72,
  title,
  description,
  buttonText,
  onButtonPress,
  secondaryButtonText,
  onSecondaryButtonPress,
  variant = 'default',
  gradientColors = ['rgba(108, 99, 255, 0.06)', 'rgba(159, 122, 234, 0.06)'],
  style,
}) => (
  <View style={[styles.container, style]}>
    <LinearGradient colors={gradientColors} style={styles.card}>
      {icon && (
        <View style={styles.iconWrapper}>
          <Ionicons name={icon} size={iconSize} color={Colors.primary} />
        </View>
      )}
      {title && <Text style={styles.title}>{title}</Text>}
      {description && <Text style={styles.description}>{description}</Text>}
      {buttonText && onButtonPress && (
        <TouchableOpacity style={styles.button} onPress={onButtonPress} activeOpacity={0.8}>
          <LinearGradient colors={Colors.gradient.primary} style={styles.buttonGradient}>
            <Text style={styles.buttonText}>{buttonText}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
      {secondaryButtonText && onSecondaryButtonPress && (
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onSecondaryButtonPress}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>{secondaryButtonText}</Text>
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
    paddingVertical: 48,
  },
  card: {
    width: '100%',
    padding: 36,
    borderRadius: 24,
    alignItems: 'center',
  },
  iconWrapper: {
    marginBottom: 8,
    opacity: 0.9,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.dark,
    marginTop: 16,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  button: {
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Colors.background.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default EmptyState;
