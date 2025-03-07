import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeTransition } from '../hooks/useThemeTransition';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  colors: typeof lightColors | typeof darkColors;
  themeAnimation: {
    rotate: Animated.AnimatedInterpolation<string>;
    scale: Animated.AnimatedInterpolation<number>;
    interpolate: (outputRange: [any, any]) => Animated.AnimatedInterpolation<any>;
  };
}

// Light theme colors
export const lightColors = {
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
  primary: '#2196f3',
  border: '#dddddd',
  error: '#d32f2f',
  success: '#2e7d32',
  statusBar: 'dark-content' as const,
};

// Dark theme colors
export const darkColors = {
  background: '#121212',
  card: '#1e1e1e',
  text: '#ffffff',
  textSecondary: '#aaaaaa',
  primary: '#90caf9',
  border: '#333333',
  error: '#ef5350',
  success: '#81c784',
  statusBar: 'light-content' as const,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@theme_preference';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>('light');
  const isDark = theme === 'dark';
  const themeAnimation = useThemeTransition(isDark);

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Update theme when system theme changes if no saved preference
  useEffect(() => {
    if (systemColorScheme) {
      loadThemePreference();
    }
  }, [systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) {
        setTheme(savedTheme as Theme);
      } else if (systemColorScheme) {
        setTheme(systemColorScheme);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  };

  const saveThemePreference = async (newTheme: Theme) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    saveThemePreference(newTheme);
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      isDark, 
      colors,
      themeAnimation
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};