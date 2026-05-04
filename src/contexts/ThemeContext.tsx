import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@zapsplit_theme';

export type ThemeMode = 'light' | 'dark' | 'system';

// ZapSplit 2026 — Friendly Fintech palettes.
// Reference: Coinbase × Public × Uber. Saturated brand blue used heavily,
// soft cards on warm grey canvas, soft-blue tinted icon circles.

const lightColors = {
  // Primary — saturated, used everywhere
  primary: '#2D7EF7',
  primaryDark: '#1F5FCC',
  primaryLight: '#EAF1FE',

  // Backgrounds
  background: '#F4F6FB',     // Warm pale grey-blue canvas
  surface: '#FFFFFF',         // Cards
  surfaceElevated: '#FFFFFF',

  // Text
  text: '#0F1830',            // Near-black with navy undertone
  textSecondary: '#5C6779',
  textTertiary: '#9098A8',
  textInverse: '#FFFFFF',

  // Accent / highlight
  accent: '#EAF1FE',          // Soft-blue tint — icon circles, secondary pills
  highlight: '#FEF1DA',

  // Status — saturated, friendly
  success: '#00B86B',
  successLight: '#E1F7EC',
  warning: '#F5A524',
  warningLight: '#FEF1DA',
  error: '#EF4856',
  errorLight: '#FCE7E9',
  info: '#2D7EF7',
  infoLight: '#EAF1FE',

  // Semantic
  paid: '#00B86B',
  pending: '#F5A524',
  owed: '#EF4856',

  // Neutral grays — collapsed onto the new canvas
  gray50: '#F4F6FB',
  gray100: '#EFF2F8',
  gray200: '#E5E9F2',
  gray300: '#D6DCE7',
  gray400: '#9098A8',
  gray500: '#5C6779',
  gray600: '#4A5466',
  gray700: '#343C4D',
  gray800: '#1F2638',
  gray900: '#0F1830',

  // Overlay & borders
  overlay: 'rgba(15, 24, 48, 0.55)',
  overlayLight: 'rgba(15, 24, 48, 0.18)',
  border: '#E5E9F2',
  borderLight: '#E5E9F2',
  divider: '#E5E9F2',
};

const darkColors = {
  // Primary
  primary: '#5B9DFF',
  primaryDark: '#2D7EF7',
  primaryLight: 'rgba(45, 126, 247, 0.16)',

  // Backgrounds
  background: '#0B0F1A',
  surface: '#161B2A',
  surfaceElevated: '#1E2436',

  // Text
  text: '#FFFFFF',
  textSecondary: '#9098A8',
  textTertiary: '#5C6779',
  textInverse: '#0F1830',

  // Accent / highlight
  accent: 'rgba(45, 126, 247, 0.16)',
  highlight: 'rgba(245, 165, 36, 0.16)',

  // Status
  success: '#3FCB85',
  successLight: 'rgba(63, 203, 133, 0.16)',
  warning: '#F5BB55',
  warningLight: 'rgba(245, 187, 85, 0.16)',
  error: '#FF6B75',
  errorLight: 'rgba(255, 107, 117, 0.16)',
  info: '#5B9DFF',
  infoLight: 'rgba(91, 157, 255, 0.16)',

  // Semantic
  paid: '#3FCB85',
  pending: '#F5BB55',
  owed: '#FF6B75',

  // Neutral grays
  gray50: '#0B0F1A',
  gray100: '#161B2A',
  gray200: '#222838',
  gray300: '#2E3548',
  gray400: '#5C6779',
  gray500: '#9098A8',
  gray600: '#B5BCCB',
  gray700: '#CDD3DE',
  gray800: '#E5E9F2',
  gray900: '#FFFFFF',

  // Overlay & borders
  overlay: 'rgba(0, 0, 0, 0.72)',
  overlayLight: 'rgba(0, 0, 0, 0.45)',
  border: '#222838',
  borderLight: '#222838',
  divider: '#222838',
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

  // ZapSplit 2026 — locked to dark mode.
  // The brand glows brighter against near-black, and a single canvas keeps the
  // visual language coherent. Light tokens are kept in the file in case the
  // decision ever reverses, but the runtime selection is fixed.
  const isDark = true;
  const colors = darkColors;

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

export { lightColors, darkColors };
