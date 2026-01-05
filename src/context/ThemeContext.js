import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

export const lightTheme = {
  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    tertiary: '#F1F3F4',
    card: '#FFFFFF',
    modal: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Text colors
  text: {
    primary: '#202124',
    secondary: '#5F6368',
    tertiary: '#80868B',
    inverse: '#FFFFFF',
    accent: '#1A73E8',
    success: '#34A853',
    warning: '#FBBC04',
    error: '#EA4335',
    premium: '#FFD700',
  },

  // Border colors
  border: {
    light: '#E8EAED',
    medium: '#DADCE0',
    dark: '#BDC1C6',
    focus: '#1A73E8',
  },

  // Interactive colors
  interactive: {
    primary: '#1A73E8',
    secondary: '#34A853',
    danger: '#EA4335',
    disabled: '#DADCE0',
  },

  // Status colors
  status: {
    online: '#34A853',
    away: '#FBBC04',
    offline: '#80868B',
  },

  // Shadows
  shadow: {
    color: '#000000',
    opacity: 0.1,
  },

  // Gradients
  gradient: {
    primary: ['#667EEA', '#764BA2'],
    premium: ['#FFD700', '#FFA500'],
    success: ['#34A853', '#43A047'],
  },
};

export const darkTheme = {
  // Background colors
  background: {
    primary: '#121212',
    secondary: '#1E1E1E',
    tertiary: '#2D2D2D',
    card: '#1E1E1E',
    modal: '#2D2D2D',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },

  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: '#E8EAED',
    tertiary: '#BDC1C6',
    inverse: '#202124',
    accent: '#8AB4F8',
    success: '#81C995',
    warning: '#FDD663',
    error: '#F28B82',
    premium: '#FFD700',
  },

  // Border colors
  border: {
    light: '#5F6368',
    medium: '#80868B',
    dark: '#9AA0A6',
    focus: '#8AB4F8',
  },

  // Interactive colors
  interactive: {
    primary: '#8AB4F8',
    secondary: '#81C995',
    danger: '#F28B82',
    disabled: '#5F6368',
  },

  // Status colors
  status: {
    online: '#81C995',
    away: '#FDD663',
    offline: '#BDC1C6',
  },

  // Shadows
  shadow: {
    color: '#000000',
    opacity: 0.3,
  },

  // Gradients
  gradient: {
    primary: ['#667EEA', '#764BA2'],
    premium: ['#FFD700', '#FFA500'],
    success: ['#81C995', '#43A047'],
  },
};

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const THEME_STORAGE_KEY = '@dating_app_theme';

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState(lightTheme);
  const [colorScheme, setColorScheme] = useState('light');

  // Load saved theme preference
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme) {
          setColorScheme(savedTheme);
          setTheme(savedTheme === 'dark' ? darkTheme : lightTheme);
        } else {
          // Use system preference if no saved preference
          const initialScheme = systemColorScheme || 'light';
          setColorScheme(initialScheme);
        setTheme(initialScheme === 'dark' ? darkTheme : lightTheme);
      }
    } catch (error) {
      logger.error('Error loading theme preference', error);
      // Fallback to system preference
        const initialScheme = systemColorScheme || 'light';
        setColorScheme(initialScheme);
        setTheme(initialScheme === 'dark' ? darkTheme : lightTheme);
      }
    };

    loadThemePreference();
  }, [systemColorScheme]);

  const toggleTheme = async () => {
    const newScheme = colorScheme === 'light' ? 'dark' : 'light';
    const newTheme = newScheme === 'dark' ? darkTheme : lightTheme;

    setColorScheme(newScheme);
    setTheme(newTheme);

    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newScheme);
    } catch (error) {
      logger.error('Error saving theme preference', error, { theme: newScheme });
    }
  };

  const setThemeMode = async (mode) => {
    const newTheme = mode === 'dark' ? darkTheme : lightTheme;

    setColorScheme(mode);
    setTheme(newTheme);

    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      logger.error('Error saving theme preference', error, { theme: mode });
    }
  };

  const value = {
    theme,
    colorScheme,
    toggleTheme,
    setThemeMode,
    isDark: colorScheme === 'dark',
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;
