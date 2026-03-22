/**
 * Color Constants
 * Centralized color definitions for the app
 * This helps maintain consistency and makes it easier to implement themes
 */

export const Colors = {
  // Primary colors
  primary: '#6C63FF',
  primaryDark: '#5A4FCF',

  // Text colors
  text: {
    primary: '#1A1A2E',
    secondary: '#6B7194',
    tertiary: '#9CA3C0',
    white: '#fff',
    white90: 'rgba(255, 255, 255, 0.9)',
    white70: 'rgba(255, 255, 255, 0.7)',
    white80: 'rgba(255, 255, 255, 0.8)',
    dark: '#1A1A2E',
    medium: '#4A4E6A',
    light: '#C5CAE9',
    lighter: '#E8EAF6',
  },

  // Background colors
  background: {
    white: '#FFFFFF',
    white10: 'rgba(255, 255, 255, 0.1)',
    white20: 'rgba(255, 255, 255, 0.2)',
    white30: 'rgba(255, 255, 255, 0.3)',
    white90: 'rgba(255, 255, 255, 0.9)',
    white95: 'rgba(255, 255, 255, 0.96)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayDark: 'rgba(0, 0, 0, 0.6)',
    light: '#F0F2FF',
    lighter: '#F5F6FF',
    lightest: '#FAFBFF',
    gray: '#E8EAF6',
    dark: '#0D0D1A',
    darker: '#16162B',
    black: '#000',
  },

  // Shadow colors
  shadow: {
    primary: '#6C63FF',
    black: 'rgba(0, 0, 0, 0.3)',
    black50: 'rgba(0, 0, 0, 0.5)',
  },

  // Accent colors
  accent: {
    pink: '#FF6B9D',
    yellow: '#FFE66D',
    red: '#FF6B6B',
    gold: '#FFD700',
    teal: '#4ECDC4',
    purple: '#8B5CF6',
    orange: '#FF9800',
    blue: '#3B82F6',
    green: '#10B981',
  },

  // Interactive colors (for buttons, links, etc.)
  interactive: {
    primary: '#6C63FF',
    secondary: '#4ECDC4',
    danger: '#EA4335',
    disabled: '#D5D8E8',
    success: '#34A853',
    warning: '#FBBC04',
  },

  // Status colors
  status: {
    success: '#4CAF50',
    successLight: '#81C784',
    successDark: '#388E3C',
    error: '#F44336',
    errorLight: '#E57373',
    errorDark: '#C62828',
    warning: '#FF9800',
    warningLight: '#FFB74D',
    warningDark: '#E65100',
    warningOrange: '#FF6B35',
    info: '#2196F3',
    infoLight: '#64B5F6',
    infoDark: '#0D47A1',
    infoBlue: '#42A5F5',
  },

  // Gamification colors
  gamification: {
    level1: '#90BE6D',
    level2: '#4ECDC4',
    level3: '#6C63FF',
    level4: '#F48FB1',
    level5: '#FF6B6B',
    level6: '#FFD700',
    level7: '#8B5CF6',
    level8: '#FF6B35',
    level9: '#EF4444',
    level10: '#EC4899',
    newcomer: '#78909C',
    explorer: '#4CAF50',
    connector: '#2196F3',
    socialButterfly: '#9C27B0',
    charmer: '#FF9800',
    heartbreaker: '#E91E63',
    loveExpert: '#F44336',
    matchmaker: '#E040FB',
    cupid: '#FF4081',
    cupidElite: '#FFD700',
  },

  // Verification badge colors
  verification: {
    verified: '#4ECDC4',
    premium: '#6C63FF',
    safety: '#FF6B6B',
    social: '#3B82F6',
    photo: '#8B5CF6',
    id: '#FFD700',
    phone: '#10B981',
  },

  // Reaction colors
  reactions: {
    heart: '#FF6B6B',
    laugh: '#FFD93D',
    wow: '#4ECDC4',
    sad: '#74B9FF',
    angry: '#FF7675',
    fire: '#FF9F43',
    thumbsup: '#6C63FF',
    clap: '#F8B500',
  },

  // Safety report colors
  safety: {
    inappropriatePhotos: '#FF6B6B',
    fakeProfile: '#FFD93D',
    harassment: '#6BCB77',
    scam: '#4D96FF',
    offensiveBehavior: '#FF6B9D',
    other: '#9D84B7',
  },

  // Border colors
  border: {
    light: '#E8EAF6',
    medium: '#C5CAE9',
    dark: '#9FA8DA',
    primary: '#6C63FF',
    white: '#fff',
    gray: '#E8EAF6',
    transparent: 'transparent',
  },

  // Gradient colors
  gradient: {
    primary: ['#6C63FF', '#9F7AEA'],
    light: ['#F0F2FF', '#E8EAF6'],
    pink: ['#FF6B9D', '#F43F5E'],
    sunset: ['#FF9A9E', '#FECFEF'],
    ocean: ['#00C6FF', '#0072FF'],
    forest: ['#56AB2F', '#A8E063'],
    // Accent gradients
    teal: ['#4ECDC4', '#2DB5AA'],
    red: ['#FF6B6B', '#F43F5E'],
    redOrange: ['#FF6B6B', '#FF8E53'],
    gold: ['#FFD700', '#FF9500'],
    purple: ['#8B5CF6', '#7C3AED'],
    blue: ['#3B82F6', '#6366F1'],
    green: ['#10B981', '#059669'],
    // Status gradients
    success: ['#4CAF50', '#81C784'],
    info: ['#2196F3', '#64B5F6'],
    // Disabled/placeholder gradients
    disabled: ['#C5CAE9', '#B0B8D6'],
    placeholder: ['#C5CAE9', '#B0B8D6'],
    // Theme-specific gradients
    dark: ['#0D0D1A', '#1A1A2E'],
    pinkSoft: ['#FFE0E8', '#FFDDE1'],
    oceanDeep: ['#134E5E', '#71B280'],
    purplePink: ['#EC4899', '#BE185D'],
    yellow: ['#F7971E', '#FFD200'],
    // Premium glass effect
    glass: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)'],
    glassLight: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)'],
  },

  // UI element colors
  ui: {
    online: '#10B981',
    offline: '#9CA3C0',
    placeholder: '#C5CAE9',
    disabled: '#B0B8D6',
    divider: '#E8EAF6',
    card: '#FFFFFF',
    cardBorder: '#E8EAF6',
    input: '#F5F6FF',
    inputBorder: '#E8EAF6',
    buttonPrimary: '#6C63FF',
    buttonSecondary: '#F5F6FF',
    buttonText: '#fff',
    link: '#6C63FF',
  },

  // Brand colors (for third-party integrations)
  brand: {
    google: '#4285F4',
    facebook: '#1877F2',
    apple: '#000000',
  },
};
