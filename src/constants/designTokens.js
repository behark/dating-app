const DESIGN_TOKENS = {
  colors: {
    gradients: {
      discovery: ['#667eea', '#764ba2'],
      chat: ['#3b82f6', '#2563eb'],
      profile: ['#ec4899', '#be185d'],
      matches: ['#f43f5e', '#e11d48'],
      premium: ['#fbbf24', '#f97316'],
      home: ['#10b981', '#059669'],
    },
    background: '#ffffff',
    surface: '#f9fafb',
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
      tertiary: '#9ca3af',
    },
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  typography: {
    h1: { fontSize: 42, fontWeight: '700', letterSpacing: -0.5 },
    h2: { fontSize: 28, fontWeight: '700' },
    h3: { fontSize: 24, fontWeight: '600' },
    body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
    caption: { fontSize: 12, fontWeight: '500' },
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 8,
    },
  },
};

export default DESIGN_TOKENS;
