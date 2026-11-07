/**
 * ULTIM Design System — "Arena Night"
 *
 * The visual language is lifted from the Sports-Arena design handoff:
 * a single near-black stage (#0A0B0D), charcoal surfaces (#121417/#191B1F),
 * hairline structural borders (#2B2D32), warm paper typography (#F6F2EA)
 * and one functional arena orange (#FF6A1A).
 *
 * Typography is the identity: Barlow Condensed for oversized, tightly
 * tracked uppercase display type; Manrope for all functional body copy.
 * Corners are either gently rounded (10–22px) or fully pill-shaped.
 */

// ─── Core tokens ─────────────────────────────────────────────────────────────
export const COLORS = {
  // Surfaces
  background: '#0A0B0D',
  night: '#0A0B0D',
  surface: '#121417',
  surfaceDim: '#0E0F11',
  surfaceBright: '#191B1F',
  surfaceLowest: '#0A0B0D',
  surfaceLow: '#191B1F',
  surfaceContainer: '#121417',
  surfaceHigh: '#1E2025',
  surfaceHighest: '#2B2D32',

  // Text
  onSurface: '#F6F2EA',
  onSurfaceVariant: '#D8D3CA',
  onBackground: '#F6F2EA',
  textMuted: '#AAA59D',
  muted: '#AAA59D',
  meta: '#8C8881',
  paper: '#F6F2EA',
  paperDim: '#D8D3CA',

  // Arena orange
  primary: '#FF6A1A',
  primaryHot: '#FF5100',
  primaryContainer: '#FF8A50',
  primaryMuted: 'rgba(255,106,26,0.12)',
  primaryBorder: 'rgba(255,106,26,0.42)',
  onPrimary: '#0A0B0D',

  // Supporting accents (status only — orange remains the brand accent)
  secondary: '#FF8A50',
  secondaryContainer: 'rgba(255,138,80,0.12)',
  onSecondary: '#0A0B0D',
  gold: '#FF8A50',
  goldSoft: '#FFB27A',
  goldDeep: '#FF6A1A',
  goldPanel: 'rgba(255,106,26,0.12)',
  goldBorder: 'rgba(255,106,26,0.38)',
  ink: '#0A0B0D',
  inkSoft: 'rgba(10,11,13,0.62)',
  inkFaint: 'rgba(10,11,13,0.45)',

  tertiary: '#FFD2A8',
  tertiaryContainer: '#17110D',
  onTertiary: '#0A0B0D',

  // Utility & status
  error: '#F3727F',
  errorContainer: '#2B1214',
  success: '#7BD99A',
  successContainer: 'rgba(123,217,154,0.10)',
  info: '#7AA7FF',
  outline: '#2B2D32',
  outlineVariant: '#202227',
  border: '#2B2D32',
  line: '#2B2D32',
  lineSoft: '#202227',

  // Flat surface aliases (legacy components inherit the arena palette)
  glass: '#121417',
  glassHigh: '#191B1F',
  glassBorder: '#2B2D32',
  emberPanel: '#17110D',
  emberBorder: 'rgba(255,106,26,0.42)',

  // Imagery overlays
  cardOverlayGradientStart: 'transparent',
  cardOverlayGradientEnd: 'rgba(10,11,13,0.94)',
};

// ─── Gradients ───────────────────────────────────────────────────────────────
// The reference design is intentionally flat; gradients are reserved for image
// legibility scrims. CTA gradients resolve to a solid arena orange.
export const GRADIENTS = {
  screen: ['#0A0B0D', '#0A0B0D', '#0A0B0D'] as const,
  ember: '#FF6A1A',
  primaryButton: ['#FF6A1A', '#FF6A1A'] as const,
  dangerButton: ['#F3727F', '#F3727F'] as const,
  darkButton: ['#191B1F', '#191B1F'] as const,
  successButton: ['#7BD99A', '#7BD99A'] as const,
};

// ─── Shadows ─────────────────────────────────────────────────────────────────
export const SHADOWS = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  },
  float: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.42,
    shadowRadius: 22,
    elevation: 14,
  },
  ember: {
    shadowColor: '#FF6A1A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  gold: {
    shadowColor: '#FF6A1A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
};

export const RADIUS = {
  sm: 10,
  default: 14,
  md: 12,
  lg: 16,
  xl: 20,
  card: 16,
  panel: 22,
  full: 9999,
  pill: 9999,
};

// ─── Motion ──────────────────────────────────────────────────────────────────
export const MOTION = {
  springSoft: { damping: 24, stiffness: 220, mass: 0.9 },
  springSnappy: { damping: 28, stiffness: 320, mass: 0.8 },
  durationFast: 160,
  durationMed: 240,
  durationSlow: 340,
} as const;

export const SPACING = {
  base: 4,
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
  containerPadding: 20,
  cardGap: 12,
};

// ─── Fonts ───────────────────────────────────────────────────────────────────
// Barlow Condensed = display voice. Manrope = functional voice.
export const FONTS = {
  // Barlow Condensed
  display: 'BarlowCondensed_600SemiBold',
  displayMedium: 'BarlowCondensed_500Medium',
  displayBold: 'BarlowCondensed_700Bold',
  // Manrope
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semiBold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extraBold: 'Manrope_800ExtraBold',
  black: 'Manrope_800ExtraBold',
};

// ─── Typography scale ────────────────────────────────────────────────────────
export const TYPOGRAPHY = {
  hero: {
    fontFamily: FONTS.display,
    fontSize: 52,
    lineHeight: 47,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  pageTitle: {
    fontFamily: FONTS.display,
    fontSize: 42,
    lineHeight: 38,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
  sectionTitle: {
    fontFamily: FONTS.display,
    fontSize: 30,
    lineHeight: 29,
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
  },
  cardTitle: {
    fontFamily: FONTS.display,
    fontSize: 24,
    lineHeight: 24,
    letterSpacing: 0.3,
    textTransform: 'uppercase' as const,
  },
  eyebrow: {
    fontFamily: FONTS.extraBold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1.6,
    textTransform: 'uppercase' as const,
  },
  h1: {
    fontFamily: FONTS.extraBold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  label: {
    fontFamily: FONTS.extraBold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1.1,
    textTransform: 'uppercase' as const,
  },
  body: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  bodyStrong: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  button: {
    fontFamily: FONTS.extraBold,
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  number: {
    fontFamily: FONTS.display,
    fontSize: 32,
    lineHeight: 32,
    letterSpacing: 0.3,
  },
};
