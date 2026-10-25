/**
 * ULTIM Design System — "Ember on Black"
 *
 * Spotify-inspired content-first darkness: the UI recedes into near-black
 * (#121212 family) so facilities, passes and credit numbers glow. Depth is
 * expressed through surface lightness + heavy shadows (never raw gray
 * borders), everything interactive is a pill (500–9999px) or circle (50%),
 * and the one functional accent is vibrant ember orange.
 *
 * Type: compact 10–24px range, bold/regular binary, uppercase + wide
 * tracking (1.4–2px) for the systematic button/label voice.
 */

// ─── Surfaces (Spotify-style lightness ladder) ───────────────────────────────
export const COLORS = {
  // Backgrounds & surfaces — depth through shade variation
  background: '#121212', // deepest layer (Spotify near-black)
  surface: '#181818', // Level 0 screen wash / cards
  surfaceDim: '#0B0B0D',
  surfaceBright: '#232328',
  surfaceLowest: '#0A0B0D',
  surfaceLow: '#1F1F1F', // chips, tracks, recessed controls (Spotify mid-dark)
  surfaceContainer: '#181818', // cards
  surfaceHigh: '#26262B', // dividers, subtle borders
  surfaceHighest: '#303038',

  // Text & content — white + silver only
  onSurface: '#FFFFFF',
  onSurfaceVariant: '#CBCBCB',
  onBackground: '#FFFFFF',
  textMuted: '#B3B3B3',

  // Primary Accent — functional ember orange only (replaces Spotify green)
  primary: '#FF5A1F',
  primaryContainer: '#FF7A3D',
  primaryMuted: 'rgba(255,90,31,0.16)',
  primaryBorder: 'rgba(255,90,31,0.40)',
  onPrimary: '#0A0503', // near-black text ON orange (never white)

  // Secondary — warm amber/gold (member passes, credit moments & highlights)
  secondary: '#E9B54C',
  secondaryContainer: 'rgba(233,181,76,0.12)',
  onSecondary: '#1E1710',

  // Gold ramp — the secondary accent in three steps
  gold: '#E9B54C',
  goldSoft: '#F2C05F',
  goldDeep: '#DD9F35',
  goldPanel: 'rgba(233,181,76,0.12)',
  goldBorder: 'rgba(233,181,76,0.28)',
  /** Dark warm ink used on top of gold surfaces. */
  ink: '#1E1710',
  inkSoft: 'rgba(30,23,16,0.62)',
  inkFaint: 'rgba(30,23,16,0.45)',

  // Tertiary — soft orange (notice / warning territory)
  tertiary: '#FF8A50',
  tertiaryContainer: '#2A1508',
  onTertiary: '#0A0503',

  // Utility & status
  error: '#F3727F',
  errorContainer: '#2B1214',
  success: '#34D399',
  successContainer: '#0B241B',
  info: '#539DF5',
  outline: '#4D4D4D',
  outlineVariant: '#2A2A2E',
  border: 'rgba(255,255,255,0.08)',

  // Glass surfaces — used for empty/fallback/hero-less blocks so they read as
  // frosted panels on the ember gradient instead of flat grey cards.
  glass: 'rgba(255,255,255,0.045)',
  glassHigh: 'rgba(255,255,255,0.075)',
  glassBorder: 'rgba(255,255,255,0.10)',

  // Ember-tinted panels — for credit/membership moments that should glow warm.
  emberPanel: 'rgba(255,90,31,0.06)',
  emberBorder: 'rgba(255,90,31,0.18)',

  // Card hero overlays
  cardOverlayGradientStart: 'transparent',
  cardOverlayGradientEnd: 'rgba(5, 5, 6, 0.96)',
};

// ─── Screen gradients ────────────────────────────────────────────────────────
export const GRADIENTS = {
  /** Full-screen wash: warm ember glow up top dissolving into pure black. */
  screen: ['#1A0E07', '#0B0B0D', '#050506'] as const,
  /** Ember radial glow color (top-right anchor). */
  ember: '#FF5A1F',
  /** Primary CTA gradient. */
  primaryButton: ['#FF7A3D', '#FF4D12'] as const,
  dangerButton: ['#F3727F', '#DC2626'] as const,
  darkButton: ['#2C2C31', '#141417'] as const,
  successButton: ['#34D399', '#059669'] as const,
};

// ─── Shadows ─────────────────────────────────────────────────────────────────
// Spotify keeps shadows heavy because light shadows are invisible on black.
export const SHADOWS = {
  /** Cards: soft lift. */
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 6,
  },
  /** Floating elements (tab bar, sheets): dramatic float. */
  float: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
  /** Orange glow for primary CTAs / active states. */
  ember: {
    shadowColor: '#FF5A1F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  /** Warm amber glow for the member pass cards. */
  gold: {
    shadowColor: '#E9B54C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 18,
    elevation: 8,
  },
};

export const RADIUS = {
  sm: 6, // album-art / subtle containers
  default: 8, // cards, sections (Spotify standard)
  md: 10,
  lg: 14,
  xl: 18,
  card: 8, // Spotify card radius — tight, not bubbly
  full: 9999, // pills
  pill: 500, // large primary buttons / search input
};

// ─── Motion (shared spring/duration tokens — 60fps UI thread) ───────────────
export const MOTION = {
  springSoft: { damping: 26, stiffness: 260, mass: 0.9 },
  springSnappy: { damping: 30, stiffness: 340, mass: 0.85 },
  durationFast: 140,
  durationMed: 220,
} as const;

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
 * Font families — Public Sans (loaded via @expo-google-fonts/public-sans in
 * App.tsx). Plays the role of SpotifyMixUI: compact, functional, binary
 * weight hierarchy (bold vs regular) rather than size inflation.
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
 * Typography scale — compact (10–26px), bold/regular binary contrast,
 * uppercase + wide tracking for the systematic button/label voice.
 */
export const TYPOGRAPHY = {
  display: {
    fontFamily: FONTS.black,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  h1: {
    fontFamily: FONTS.bold,
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
    fontFamily: FONTS.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  body: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  bodyStrong: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    lineHeight: 15,
    letterSpacing: 1.6,
    textTransform: 'uppercase' as const,
  },
  number: {
    fontFamily: FONTS.black,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
};
