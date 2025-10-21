// src/constants/theme.ts
// Premium Design System - Billion Dollar App Quality

// ========================================
// COLORS - Based on ZapSplit Logo Branding
// ========================================
export const colors = {
  // Primary Colors
  primary: '#3B9EFF',        // Bright blue - lightning bolt color
  primaryDark: '#2B7FD9',    // Darker blue for hover/press states
  primaryLight: '#6BB4FF',   // Lighter blue for backgrounds

  // Background Colors
  background: '#F5F7FA',     // Light gray-blue - clean modern background
  surface: '#FFFFFF',        // White - cards and surfaces
  surfaceElevated: '#FFFFFF', // Elevated surfaces (cards on cards)

  // Text Colors
  text: '#2C5F8D',           // Dark blue - main text (logo text color)
  textSecondary: '#6B7B8C',  // Gray - secondary text
  textTertiary: '#9BA5B0',   // Lighter gray - hints and labels
  textInverse: '#FFFFFF',    // White text for dark backgrounds

  // Accent & Highlight
  accent: '#E8EEF9',         // Light blue - logo background color
  highlight: '#FFF9E6',      // Yellow highlight for important items

  // Status Colors
  success: '#34C759',        // Green - success states
  successLight: '#E8F8ED',   // Light green background
  warning: '#FF9500',        // Orange - warning states
  warningLight: '#FFF4E6',   // Light orange background
  error: '#FF3B30',          // Red - error states
  errorLight: '#FFE8E6',     // Light red background
  info: '#3B9EFF',           // Blue - info states
  infoLight: '#E8F4FF',      // Light blue background

  // Semantic Colors
  paid: '#34C759',           // Green - paid status
  pending: '#FF9500',        // Orange - pending status
  owed: '#FF3B30',           // Red - owed status

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

// ========================================
// GRADIENTS - Premium Look
// ========================================
export const gradients = {
  primary: ['#3B9EFF', '#2B7FD9'],           // Blue gradient
  primaryVertical: ['#6BB4FF', '#3B9EFF'],   // Light to dark blue
  success: ['#5EDC70', '#34C759'],           // Green gradient
  warning: ['#FFB84D', '#FF9500'],           // Orange gradient
  error: ['#FF6B64', '#FF3B30'],             // Red gradient
  surface: ['#FFFFFF', '#F9FAFB'],           // Subtle white gradient
  premium: ['#3B9EFF', '#8B5CF6', '#EC4899'], // Multi-color premium
  gold: ['#FCD34D', '#F59E0B'],              // Gold gradient for premium features
};

// ========================================
// TYPOGRAPHY - Professional Scale
// ========================================
export const typography = {
  // Headings
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: 0,
  },
  h5: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  h6: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: 0,
  },

  // Body Text
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyLarge: {
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 28,
    letterSpacing: 0,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },

  // Special Text
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  overline: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0.5,
  },

  // Number Display (for amounts)
  number: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  numberLarge: {
    fontSize: 36,
    fontWeight: '700' as const,
    lineHeight: 44,
    letterSpacing: -1,
  },
};

// ========================================
// SHADOWS & ELEVATION
// ========================================
export const shadows = {
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  low: {
    shadowColor: '#2C5F8D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#2C5F8D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  high: {
    shadowColor: '#2C5F8D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  premium: {
    shadowColor: '#3B9EFF',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
};

// ========================================
// BORDER RADIUS
// ========================================
export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 9999,  // Fully rounded
  circle: '50%' as const,
};

// ========================================
// SPACING
// ========================================
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// ========================================
// ANIMATION TIMINGS
// ========================================
export const animation = {
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
};

// ========================================
// ICON SIZES
// ========================================
export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
};
