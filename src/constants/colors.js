/**
 * Color Constants
 * Centralized color definitions for the app
 * This helps maintain consistency and makes it easier to implement themes
 */

export const Colors = {
  // Primary colors
  primary: '#667eea',
  primaryDark: '#764ba2',

  // Text colors
  text: {
    primary: '#000',
    secondary: '#666',
    tertiary: '#999',
    white: '#fff',
    white90: 'rgba(255, 255, 255, 0.9)',
    white70: 'rgba(255, 255, 255, 0.7)',
    white80: 'rgba(255, 255, 255, 0.8)',
    dark: '#333',
    medium: '#555',
    light: '#ccc',
    lighter: '#eee',
  },

  // Background colors
  background: {
    white: '#fff',
    white10: 'rgba(255, 255, 255, 0.1)',
    white20: 'rgba(255, 255, 255, 0.2)',
    white30: 'rgba(255, 255, 255, 0.3)',
    white90: 'rgba(255, 255, 255, 0.9)',
    white95: 'rgba(255, 255, 255, 0.95)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayDark: 'rgba(0, 0, 0, 0.6)',
    light: '#f0f0f0',
    lighter: '#f5f5f5',
    lightest: '#f8f9fa',
    gray: '#e9ecef',
    dark: '#121212',
    darker: '#1E1E1E',
    black: '#000',
  },

  // Shadow colors
  shadow: {
    primary: '#667eea',
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
    primary: '#667eea',
    secondary: '#4ECDC4',
    danger: '#EA4335',
    disabled: '#DADCE0',
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
    level3: '#667eea',
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
    premium: '#667eea',
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
    thumbsup: '#667eea',
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
    light: '#ddd',
    medium: '#ccc',
    dark: '#999',
    primary: '#667eea',
    white: '#fff',
    gray: '#e9ecef',
    transparent: 'transparent',
  },

  // Gradient colors
  gradient: {
    primary: ['#667eea', '#764ba2'],
    light: ['#f5f7fa', '#c3cfe2'],
    pink: ['#f093fb', '#f5576c'],
    sunset: ['#ff9a9e', '#fecfef'],
    ocean: ['#00c6ff', '#0072ff'],
    forest: ['#56ab2f', '#a8e063'],
    // Accent gradients
    teal: ['#4ECDC4', '#44A08D'],
    red: ['#FF6B6B', '#EE5A6F'],
    redOrange: ['#FF6B6B', '#FF8E53'],
    gold: ['#FFD700', '#FFA500'],
    purple: ['#8B5CF6', '#7C3AED'],
    blue: ['#3B82F6', '#1D4ED8'],
    green: ['#10B981', '#059669'],
    // Status gradients
    success: ['#4CAF50', '#81C784'],
    info: ['#2196F3', '#64B5F6'],
    // Disabled/placeholder gradients
    disabled: ['#ccc', '#bbb'],
    placeholder: ['#ccc', '#bbb'],
    // Theme-specific gradients
    dark: ['#232526', '#414345'],
    pinkSoft: ['#ee9ca7', '#ffdde1'],
    oceanDeep: ['#134E5E', '#71B280'],
    purplePink: ['#ec4899', '#be185d'],
    yellow: ['#f7971e', '#ffd200'],
  },

  // UI element colors
  ui: {
    online: '#FFD700',
    offline: '#999',
    placeholder: '#ccc',
    disabled: '#9E9E9E',
    divider: '#e9ecef',
    card: '#fff',
    cardBorder: '#e9ecef',
    input: '#f8f9fa',
    inputBorder: '#e9ecef',
    buttonPrimary: '#667eea',
    buttonSecondary: '#f8f9fa',
    buttonText: '#fff',
    link: '#667eea',
  },

  // Brand colors (for third-party integrations)
  brand: {
    google: '#4285F4',
    facebook: '#1877F2',
    apple: '#000000',
  },
};
