import { Platform, StyleSheet, View } from 'react-native';
import DESIGN_TOKENS from '../constants/designTokens';
import { shadowToWebBoxShadow } from '../utils/stylePlatform';

const ModernCard = ({ children, style, elevated = false }) => {
  const shadow = Platform.select({
    web: shadowToWebBoxShadow(elevated ? DESIGN_TOKENS.shadows.lg : DESIGN_TOKENS.shadows.sm),
    default: elevated ? DESIGN_TOKENS.shadows.lg : DESIGN_TOKENS.shadows.sm,
  });
  return <View style={[styles.card, shadow, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: DESIGN_TOKENS.borderRadius.lg,
    overflow: 'hidden',
    padding: DESIGN_TOKENS.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.06)',
  },
});

export default ModernCard;
