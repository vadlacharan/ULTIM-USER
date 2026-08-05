export type ThemeMode = 'dark' | 'light';

export const DARK_COLORS = {
  // Backgrounds & Surfaces (Twitter Lights Out & Shadcn UI Dark Black)
  background: '#000000',
  surface: '#000000',
  surfaceDim: '#09090b',
  surfaceBright: '#27272a',
  surfaceLowest: '#000000',
  surfaceLow: '#0e0e11',
  surfaceContainer: '#09090b',
  surfaceHigh: '#1f1f23',
  surfaceHighest: '#27272a',

  // Text & Content (Shadcn Slate / Off-White)
  onSurface: '#f4f4f5',
  onSurfaceVariant: '#ffe4dc',
  onBackground: '#f4f4f5',
  textMuted: '#a1a1aa',

  // Primary Accent - Pure Vibrant Orange
  primary: '#ff5722',
  primaryContainer: '#ff5722',
  onPrimary: '#ffffff',

  // Secondary Accent - Bright Warm Orange
  secondary: '#ff7043',
  secondaryContainer: '#ff7043',
  onSecondary: '#ffffff',

  // Tertiary Accent - Soft Orange
  tertiary: '#ff8a65',
  tertiaryContainer: '#ff7043',
  onTertiary: '#ffffff',

  // Utility & Status
  error: '#f87171',
  errorContainer: '#7f1d1d',
  outline: '#a1a1aa',
  outlineVariant: '#27272a',
  border: '#1f1f23',
  cardOverlayGradientStart: 'transparent',
  cardOverlayGradientEnd: 'rgba(0, 0, 0, 0.95)',
};

export const LIGHT_COLORS = {
  // Backgrounds & Surfaces
  background: '#F5F6F8',
  surface: '#FFFFFF',
  surfaceDim: '#EAEBED',
  surfaceBright: '#FFFFFF',
  surfaceLowest: '#FFFFFF',
  surfaceLow: '#F0F2F5',
  surfaceContainer: '#FFFFFF',
  surfaceHigh: '#E2E4E8',
  surfaceHighest: '#D1D5DB',

  // Text & Content
  onSurface: '#111827',
  onSurfaceVariant: '#374151',
  onBackground: '#111827',
  textMuted: '#6B7280',

  // Primary Accent - Pure Vibrant Orange
  primary: '#ff5722',
  primaryContainer: '#FFEBE5',
  onPrimary: '#ffffff',

  // Secondary Accent - Bright Warm Orange
  secondary: '#ff7043',
  secondaryContainer: '#FFECE0',
  onSecondary: '#ffffff',

  // Tertiary Accent - Soft Orange
  tertiary: '#ff8a65',
  tertiaryContainer: '#FFEDD5',
  onTertiary: '#ffffff',

  // Utility & Status
  error: '#DC2626',
  errorContainer: '#FEE2E2',
  outline: '#9CA3AF',
  outlineVariant: '#E5E7EB',
  border: '#E5E7EB',
  cardOverlayGradientStart: 'transparent',
  cardOverlayGradientEnd: 'rgba(255, 255, 255, 0.95)',
};

let currentThemeMode: ThemeMode = 'dark';

export const COLORS = { ...DARK_COLORS };

export const applyTheme = (mode: ThemeMode) => {
  currentThemeMode = mode;
  Object.assign(COLORS, mode === 'light' ? LIGHT_COLORS : DARK_COLORS);
};

export const getThemeColors = (mode: ThemeMode = currentThemeMode) => {
  return mode === 'light' ? LIGHT_COLORS : DARK_COLORS;
};

export const RADIUS = {
  sm: 4,
  default: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SPACING = {
  base: 4,
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
  containerPadding: 20,
  cardGap: 16,
};

/**
 * Font families — Public Sans (neutral, professional humanist sans-serif;
 * the same family used by the U.S. Web Design System). Loaded via
 * @expo-google-fonts/public-sans in App.tsx.
 *
 * Unlike a loud/geometric display face, Public Sans reads as calm and
 * credible at small sizes, which is why the scale below leans on lighter
 * weights and tighter, more restrained tracking than a typical "sporty" UI.
 */
export const FONTS = {
  regular: 'PublicSans_400Regular',
  medium: 'PublicSans_500Medium',
  semiBold: 'PublicSans_600SemiBold',
  bold: 'PublicSans_700Bold',
  extraBold: 'PublicSans_800ExtraBold',
  black: 'PublicSans_900Black',
};

/**
 * Typography scale
 *
 * Guidelines baked into these tokens (apply the same logic anywhere a
 * one-off text style is defined instead of using this scale directly):
 *  - Reserve `black` (900) for hero numbers / display wordmarks only.
 *    Headings use `extraBold`/`bold` at most — it keeps things premium
 *    instead of shouty.
 *  - Large headings get slightly NEGATIVE letter-spacing (tighter, more
 *    editorial). Small uppercase labels get a little positive tracking,
 *    but modestly (0.4–0.6), not 1+.
 *  - Every size defines a lineHeight so text never feels cramped.
 */
export const TYPOGRAPHY = {
  display: {
    fontFamily: FONTS.extraBold,
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: -0.6,
  },
  h1: {
    fontFamily: FONTS.extraBold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  h2: {
    fontFamily: FONTS.bold,
    fontSize: 19,
    lineHeight: 25,
    letterSpacing: -0.2,
  },
  h3: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: -0.1,
  },
  label: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
  body: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  bodyStrong: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    lineHeight: 21,
  },
  caption: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  button: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
  },
  number: {
    fontFamily: FONTS.extraBold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
};
