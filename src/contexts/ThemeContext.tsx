import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@zapsplit_theme';

export type ThemeMode = 'light' | 'dark' | 'system';

// Light theme colors
const lightColors = {
  // Primary Colors
  primary: '#3B9EFF',
  primaryDark: '#2B7FD9',
  primaryLight: '#6BB4FF',

  // Background Colors
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Text Colors
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Accent & Highlight
  accent: '#E8EEF9',
  highlight: '#FFF9E6',

  // Status Colors
  success: '#34C759',
  successLight: '#E8F8ED',
  warning: '#FF9500',
  warningLight: '#FFF4E6',
  error: '#FF3B30',
  errorLight: '#FFE8E6',
  info: '#3B9EFF',
  infoLight: '#E8F4FF',

  // Semantic Colors
  paid: '#34C759',
  pending: '#FF9500',
  owed: '#FF3B30',

  // Neutral Grays
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Overlay & Borders
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.2)',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  divider: '#E5E7EB',
};

// Dark theme colors - True black, pristine like Apple/Twitter dark mode
const darkColors = {
  // Primary Colors
  primary: '#3B9EFF',
  primaryDark: '#2B7FD9',
  primaryLight: 'rgba(59, 158, 255, 0.15)',

  // Background Colors - TRUE BLACK
  background: '#000000',
  surface: '#1C1C1E',
  surfaceElevated: '#2C2C2E',

  // Text Colors - Clean white
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#636366',
  textInverse: '#000000',

  // Accent & Highlight
  accent: '#1C1C1E',
  highlight: '#2C2C2E',

  // Status Colors - Vibrant on dark
  success: '#30D158',
  successLight: 'rgba(48, 209, 88, 0.15)',
  warning: '#FFD60A',
  warningLight: 'rgba(255, 214, 10, 0.15)',
  error: '#FF453A',
  errorLight: 'rgba(255, 69, 58, 0.15)',
  info: '#3B9EFF',
  infoLight: 'rgba(59, 158, 255, 0.15)',

  // Semantic Colors
  paid: '#30D158',
  pending: '#FFD60A',
  owed: '#FF453A',

  // Neutral Grays - Apple-style dark grays
  gray50: '#000000',
  gray100: '#1C1C1E',
  gray200: '#2C2C2E',
  gray300: '#3A3A3C',
  gray400: '#48484A',
  gray500: '#636366',
  gray600: '#8E8E93',
  gray700: '#AEAEB2',
  gray800: '#C7C7CC',
  gray900: '#FFFFFF',

  // Overlay & Borders
  overlay: 'rgba(0, 0, 0, 0.8)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
  border: '#3A3A3C',
  borderLight: '#2C2C2E',
  divider: '#3A3A3C',
};

export type ThemeColors = typeof lightColors;

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        setThemeModeState(saved as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_KEY, mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Determine if we should use dark mode
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

  // Get the appropriate colors
  const colors = isDark ? darkColors : lightColors;

  // Don't render children until theme is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ themeMode, isDark, colors, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Export colors for backwards compatibility (light theme as default)
export { lightColors, darkColors };
