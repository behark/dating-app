import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import DESIGN_TOKENS from '../constants/designTokens';

const GradientButton = ({
  onPress,
  title,
  gradient = 'discovery',
  size = 'md',
  style,
  disabled = false,
}) => {
  const sizes = {
    sm: { paddingVertical: 10, paddingHorizontal: DESIGN_TOKENS.spacing.lg, fontSize: 13 },
    md: { paddingVertical: 14, paddingHorizontal: DESIGN_TOKENS.spacing.xl, fontSize: 15 },
    lg: {
      paddingVertical: 17,
      paddingHorizontal: DESIGN_TOKENS.spacing.xxxl,
      fontSize: 17,
    },
  };

  const selectedSize = sizes[size] || sizes.md;

  return (
    <LinearGradient
      colors={
        disabled
          ? DESIGN_TOKENS.colors.gradients.glass
          : DESIGN_TOKENS.colors.gradients[gradient] || DESIGN_TOKENS.colors.gradients.discovery
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, style, disabled && styles.disabled]}
    >
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.button,
          {
            paddingVertical: selectedSize.paddingVertical,
            paddingHorizontal: selectedSize.paddingHorizontal,
          },
        ]}
        activeOpacity={0.85}
        disabled={disabled}
      >
        <Text style={[styles.text, { fontSize: selectedSize.fontSize }]}>{title}</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    overflow: 'hidden',
    ...Platform.select({
      web: {},
      default: {
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
      },
    }),
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default GradientButton;
