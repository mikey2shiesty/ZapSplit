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

// Dark theme colors
const darkColors = {
  // Primary Colors
  primary: '#5AADFF',
  primaryDark: '#3B9EFF',
  primaryLight: '#2B7FD9',

  // Background Colors
  background: '#0F0F0F',
  surface: '#1A1A1A',
  surfaceElevated: '#242424',

  // Text Colors
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  textInverse: '#111827',

  // Accent & Highlight
  accent: '#1E2A3A',
  highlight: '#3D3520',

  // Status Colors
  success: '#4ADE80',
  successLight: '#1A2E1A',
  warning: '#FFB84D',
  warningLight: '#3D2E1A',
  error: '#FF6B6B',
  errorLight: '#3D1A1A',
  info: '#5AADFF',
  infoLight: '#1A2A3D',

  // Semantic Colors
  paid: '#4ADE80',
  pending: '#FFB84D',
  owed: '#FF6B6B',

  // Neutral Grays (inverted)
  gray50: '#111827',
  gray100: '#1F2937',
  gray200: '#374151',
  gray300: '#4B5563',
  gray400: '#6B7280',
  gray500: '#9CA3AF',
  gray600: '#D1D5DB',
  gray700: '#E5E7EB',
  gray800: '#F3F4F6',
  gray900: '#F9FAFB',

  // Overlay & Borders
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',
  border: '#374151',
  borderLight: '#1F2937',
  divider: '#374151',
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
