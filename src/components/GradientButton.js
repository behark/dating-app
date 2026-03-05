import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import DESIGN_TOKENS from '../constants/designTokens';

const GradientButton = ({ onPress, title, gradient = 'discovery', size = 'md', style }) => {
  const sizes = {
    sm: { paddingVertical: DESIGN_TOKENS.spacing.sm, paddingHorizontal: DESIGN_TOKENS.spacing.lg },
    md: { paddingVertical: DESIGN_TOKENS.spacing.md, paddingHorizontal: DESIGN_TOKENS.spacing.xl },
    lg: {
      paddingVertical: DESIGN_TOKENS.spacing.lg,
      paddingHorizontal: DESIGN_TOKENS.spacing.xxxl,
    },
  };

  const selectedSize = sizes[size] || sizes.md;

  return (
    <LinearGradient
      colors={DESIGN_TOKENS.colors.gradients[gradient] || DESIGN_TOKENS.colors.gradients.discovery}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, style]}
    >
      <TouchableOpacity onPress={onPress} style={[styles.button, selectedSize]} activeOpacity={0.9}>
        <Text style={styles.text}>{title}</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    borderRadius: DESIGN_TOKENS.borderRadius.md,
    overflow: 'hidden',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GradientButton;
