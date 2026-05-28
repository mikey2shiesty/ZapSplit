// src/constants/theme.ts
// ZapSplit 2026 — Friendly Fintech design system.
// Reference: Coinbase × Public × Uber. Bold rounded sans, soft cards on warm grey,
// saturated brand blue everywhere, pill buttons. Palette derived from the logo.

import { Platform } from 'react-native';

// ========================================
// FONT STACKS — bold rounded sans, no mono
// ========================================
// iOS uses SF Pro Rounded (free, native). Android uses the system sans
// (Roboto on most builds). Söhne / Inter Display can drop in later via expo-font
// without changing any consumer code — just point `fonts.sans` at the loaded family.
export const fonts = {
  sans: Platform.select({ ios: 'SF Pro Rounded', android: 'sans-serif', default: 'System' })!,
  // sansItalic / sansMono kept undefined for now; we don't use them in this language.
};

// ========================================
// PALETTE — locked, derived from logo, used heavily
// ========================================
const palette = {
  // Canvas + surfaces
  canvas: '#F4F6FB',          // Warm pale grey-blue, the soft canvas Coinbase uses
  canvasDark: '#0B0F1A',
  surface: '#FFFFFF',
  surfaceDark: '#161B2A',
  surfaceTint: '#EAF1FE',     // Soft-blue — secondary pill fill, tab active circle, icon circles
  surfaceTintDark: 'rgba(45, 126, 247, 0.12)',

  // Borders
  border: '#E5E9F2',
  borderDark: '#222838',

  // Ink
  ink: '#0F1830',             // Primary text — near-black with navy undertone
  inkDark: '#FFFFFF',
  inkMuted: '#5C6779',        // Body labels, subtitles
  inkMutedDark: '#9098A8',
  inkSubtle: '#9098A8',       // Tertiary — timestamps, helper text
  inkSubtleDark: '#5C6779',

  // Accent — used heavily, not sparingly
  accent: '#2D7EF7',
  accentDeep: '#1F5FCC',      // Pressed
  accentSoft: '#EAF1FE',
  accentInk: '#FFFFFF',

  // Status — saturated, friendly
  positive: '#00B86B',
  positiveSoft: '#E1F7EC',
  negative: '#EF4856',
  negativeSoft: '#FCE7E9',
  warning: '#F5A524',
  warningSoft: '#FEF1DA',
};

// ========================================
// COLORS — back-compat surface for older imports
// ========================================
// Existing screens import { colors } from this file. We keep the same keys but
// point them at the Friendly Fintech palette so the screen-by-screen migration
// can happen without breaking the tree.
export const colors = {
  primary: palette.accent,
  primaryDark: palette.accentDeep,
  primaryLight: palette.accentSoft,

  background: palette.canvas,
  surface: palette.surface,
  surfaceElevated: palette.surface,

  text: palette.ink,
  textSecondary: palette.inkMuted,
  textTertiary: palette.inkSubtle,
  textInverse: palette.accentInk,

  accent: palette.accentSoft,
  highlight: palette.warningSoft,

  success: palette.positive,
  successLight: palette.positiveSoft,
  warning: palette.warning,
  warningLight: palette.warningSoft,
  error: palette.negative,
  errorLight: palette.negativeSoft,
  info: palette.accent,
  infoLight: palette.accentSoft,

  paid: palette.positive,
  pending: palette.warning,
  owed: palette.negative,

  gray50: palette.canvas,
  gray100: '#EFF2F8',
  gray200: palette.border,
  gray300: '#D6DCE7',
  gray400: palette.inkSubtle,
  gray500: palette.inkMuted,
  gray600: '#4A5466',
  gray700: '#343C4D',
  gray800: '#1F2638',
  gray900: palette.ink,

  overlay: 'rgba(15, 24, 48, 0.55)',
  overlayLight: 'rgba(15, 24, 48, 0.18)',
  border: palette.border,
  borderLight: palette.border,
  divider: palette.border,
};

// Surface the raw palette for new code that wants to use the friendly names.
export const brand = palette;

// ========================================
// GRADIENTS — kept for back-compat, flattened to solid accent
// ========================================
// The Friendly Fintech language is solid colour, not gradients. Old callers
// still reach for these; map them all to flat accent so nothing renders wrong.
export const gradients = {
  primary: [palette.accent, palette.accent],
  primaryVertical: [palette.accent, palette.accent],
  success: [palette.positive, palette.positive],
  warning: [palette.warning, palette.warning],
  error: [palette.negative, palette.negative],
  surface: [palette.surface, palette.surface],
  premium: [palette.accent, palette.accent, palette.accent],
  gold: [palette.warning, palette.warning],
};

// ========================================
// TYPOGRAPHY — bold rounded sans
// ========================================
// Three weights of one family: 700 (display), 600 (titles + buttons), 500 (body).
// Money is bold display sans, NOT mono. Title case throughout.
export const typography = {
  // Display — hero numbers, page titles, card headlines
  displayHero: {
    fontFamily: fonts.sans,
    fontSize: 44,
    fontWeight: '700' as const,
    lineHeight: 50,
    letterSpacing: -0.8,
  },
  displayLarge: {
    fontFamily: fonts.sans,
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  displayMedium: {
    fontFamily: fonts.sans,
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
    letterSpacing: -0.3,
  },

  // Body
  bodyLarge: {
    fontFamily: fonts.sans,
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 26,
    letterSpacing: -0.1,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '500' as const,
    lineHeight: 22,
    letterSpacing: 0,
  },
  bodySmall: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },

  // Buttons + chips
  button: {
    fontFamily: fonts.sans,
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },
  chip: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },

  // ===== Legacy aliases — kept so older imports keep compiling =====
  h1: { fontFamily: fonts.sans, fontSize: 32, fontWeight: '700' as const, lineHeight: 38, letterSpacing: -0.5 },
  h2: { fontFamily: fonts.sans, fontSize: 28, fontWeight: '700' as const, lineHeight: 34, letterSpacing: -0.4 },
  h3: { fontFamily: fonts.sans, fontSize: 22, fontWeight: '700' as const, lineHeight: 28, letterSpacing: -0.3 },
  h4: { fontFamily: fonts.sans, fontSize: 19, fontWeight: '600' as const, lineHeight: 24, letterSpacing: -0.2 },
  h5: { fontFamily: fonts.sans, fontSize: 17, fontWeight: '600' as const, lineHeight: 22, letterSpacing: -0.1 },
  h6: { fontFamily: fonts.sans, fontSize: 15, fontWeight: '600' as const, lineHeight: 20, letterSpacing: 0 },
  overline: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '600' as const, lineHeight: 16, letterSpacing: 0.5 },
  number: { fontFamily: fonts.sans, fontSize: 22, fontWeight: '700' as const, lineHeight: 28, letterSpacing: -0.3 },
  numberLarge: { fontFamily: fonts.sans, fontSize: 32, fontWeight: '700' as const, lineHeight: 38, letterSpacing: -0.5 },
};

// ========================================
// SHADOWS — subtle card lift, single level
// ========================================
// Coinbase / Public / Uber all use a barely-there shadow under cards. One level,
// applied uniformly. Keep legacy keys so older imports compile.
const cardShadow = {
  shadowColor: '#0F1830',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 3,
  elevation: 1,
};
const liftShadow = {
  shadowColor: '#0F1830',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 4,
};
export const shadows = {
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  low: cardShadow,
  card: cardShadow,
  medium: liftShadow,
  high: liftShadow,
  premium: liftShadow,
};

// ========================================
// RADIUS — soft corners
// ========================================
// 16 on cards, 12 on inputs, 9999 on every pill (button / search / chip / icon circle).
export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 9999,
  circle: '50%' as const,
};

// ========================================
// SPACING — 8pt grid
// ========================================
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 72,
};

// ========================================
// ANIMATION
// ========================================
export const animation = {
  fast: 120,
  normal: 200,
  slow: 320,
  slower: 480,
};

// ========================================
// ICON SIZES
// ========================================
export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 18,
  lg: 22,
  xl: 24,
  xxl: 28,
};

// ========================================
// LAYOUT — tab bar, padding
// ========================================
export const layout = {
  tabBarHeight: 56,
  cardPaddingV: 20,
  cardPaddingH: 16,
};
