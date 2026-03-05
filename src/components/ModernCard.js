import { Platform, StyleSheet, View } from 'react-native';
import DESIGN_TOKENS from '../constants/designTokens';
import { shadowToWebBoxShadow } from '../utils/stylePlatform';

const ModernCard = ({ children, style }) => {
  const shadow = Platform.select({
    web: shadowToWebBoxShadow(DESIGN_TOKENS.shadows.md),
    default: DESIGN_TOKENS.shadows.md,
  });
  return <View style={[styles.card, shadow, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: DESIGN_TOKENS.colors.background,
    borderRadius: DESIGN_TOKENS.borderRadius.lg,
    overflow: 'hidden',
    padding: DESIGN_TOKENS.spacing.lg,
  },
});

export default ModernCard;
