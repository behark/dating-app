import { Platform } from 'react-native';

const DEFAULT_SHADOW_RGBA = 'rgba(0,0,0,0.2)';

// Convert RN shadow props to CSS box-shadow on web
export function shadowToWebBoxShadow(style = {}) {
  if (Platform.OS !== 'web' || !style) return {};
  const {
    shadowColor = DEFAULT_SHADOW_RGBA,
    shadowOffset = { width: 0, height: 0 },
    shadowOpacity = 0.2,
    shadowRadius = 0,
  } = style;
  // Normalize color with opacity if shadowColor is rgba already we trust it; otherwise apply opacity
  const color = typeof shadowColor === 'string' ? shadowColor : DEFAULT_SHADOW_RGBA;
  const h = shadowOffset.width || 0;
  const v = shadowOffset.height || 0;
  const blur = shadowRadius || 0;
  return { boxShadow: `${h}px ${v}px ${blur}px ${color}` };
}

// Convert RN textShadow* props to CSS textShadow on web
export function textShadowToWeb(style = {}) {
  if (Platform.OS !== 'web' || !style) return {};
  const {
    textShadowColor = DEFAULT_SHADOW_RGBA,
    textShadowOffset = { width: 0, height: 0 },
    textShadowRadius = 0,
  } = style;
  const color = typeof textShadowColor === 'string' ? textShadowColor : DEFAULT_SHADOW_RGBA;
  const h = textShadowOffset.width || 0;
  const v = textShadowOffset.height || 0;
  const blur = textShadowRadius || 0;
  return { textShadow: `${h}px ${v}px ${blur}px ${color}` };
}

// Pointer events helper: set style.pointerEvents on web, prop pointerEvents elsewhere
export function platformPointerEvents(value, existingStyle = {}) {
  if (Platform.OS === 'web') {
    return { style: { ...existingStyle, pointerEvents: value } };
  }
  return { pointerEvents: value, style: existingStyle };
}
