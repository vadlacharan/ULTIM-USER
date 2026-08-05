---
name: ULTIM
colors:
  surface: '#131312'
  surface-dim: '#131312'
  surface-bright: '#3a3938'
  surface-container-lowest: '#0e0e0d'
  surface-container-low: '#1c1c1a'
  surface-container: '#20201e'
  surface-container-high: '#2a2a29'
  surface-container-highest: '#353533'
  on-surface: '#e5e2e0'
  on-surface-variant: '#e4beb4'
  inverse-surface: '#e5e2e0'
  inverse-on-surface: '#31302f'
  outline: '#ab8980'
  outline-variant: '#5b4039'
  surface-tint: '#ffb5a0'
  primary: '#ffb5a0'
  on-primary: '#5f1500'
  primary-container: '#ff5722'
  on-primary-container: '#541200'
  inverse-primary: '#b02f00'
  secondary: '#ffffff'
  on-secondary: '#283500'
  secondary-container: '#c3f400'
  on-secondary-container: '#556d00'
  tertiary: '#44ddc1'
  on-tertiary: '#00382f'
  tertiary-container: '#00a38d'
  on-tertiary-container: '#003028'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbd1'
  primary-fixed-dim: '#ffb5a0'
  on-primary-fixed: '#3b0900'
  on-primary-fixed-variant: '#862200'
  secondary-fixed: '#c3f400'
  secondary-fixed-dim: '#abd600'
  on-secondary-fixed: '#161e00'
  on-secondary-fixed-variant: '#3c4d00'
  tertiary-fixed: '#68fadd'
  tertiary-fixed-dim: '#44ddc1'
  on-tertiary-fixed: '#00201a'
  on-tertiary-fixed-variant: '#005145'
  background: '#131312'
  on-background: '#e5e2e0'
  surface-variant: '#353533'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  container-padding: 20px
  card-gap: 16px
---

## Brand & Style

The design system is engineered for high-performance fitness and sports membership management. It evokes a sense of kinetic energy, urgency, and premium athleticism. The target audience consists of active individuals who value efficiency and motivation in their fitness journey.

The visual style is **Corporate / Modern** with **High-Contrast** accents. It leverages a clean, structured layout to handle dense membership data while using vibrant, saturated color hits to drive user action and emotional engagement. The aesthetic balances professional reliability with the raw energy of a competitive sports environment.

## Colors

This design system utilizes a "Warm Dark" default mode to reduce eye strain in gym environments while making the accent colors vibrate. 

- **Primary (Vibrant Orange):** Used for main CTAs, progress highlights, and brand moments.
- **Secondary (Neon Lime):** Reserved exclusively for "Active," "Live," or "Unlocked" states.
- **Tertiary (Energetic Teal):** Used for health metrics, recovery data, and secondary biometric feedback.
- **Surface Strategy:** Use a warm neutral palette. Backgrounds should be a deep charcoal (#121211), with cards sitting on a slightly lighter elevation (#1E1E1D).
- **Light Mode:** When in light mode, the background shifts to a warm off-white (#FAFAF9) with borders replacing subtle shadows for definition.

## Typography

The typography strategy relies on the high-impact geometry of Montserrat for all headings to establish a "sport-editorial" feel. Inter provides the functional counterbalance, ensuring that complex schedules and biometric data remain legible at small sizes.

Uppercase styling is applied to labels and sub-headers to reinforce the authoritative, coach-like tone of the interface. Line heights are kept tight on headings to maintain a sense of density and power.

## Layout & Spacing

This design system uses a **Fluid Grid** optimized for mobile viewports. The layout is driven by a 4px baseline shift, but primarily relies on a 20px outer margin to provide breathing room for large imagery.

- **Mobile:** 4-column grid with 16px gutters.
- **Card Layouts:** Cards should utilize internal padding of 16px or 24px depending on content density.
- **Safe Areas:** Ensure all critical CTAs (like 'Swipe to Book') are placed within the thumb-zone (bottom 30% of the screen).

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layers** combined with **Ambient Shadows**. 

- **Surface 0:** Main background (#121211).
- **Surface 1:** Primary cards and containers (#1E1E1D).
- **Surface 2:** Floating elements or active inputs (#2A2A29).
- **Shadows:** Use large, soft blurs (Y: 10, Blur: 20) with low opacity (15% black) to give cards a physical presence without creating "muddiness."
- **Overlays:** Use a 40% backdrop blur for modal backgrounds to maintain focus on the membership action.

## Shapes

The shape language is dominated by generous, organic curves that contrast with the aggressive typography.

- **Cards and Containers:** Use 16px (`rounded-lg`) to 24px (`rounded-xl`) corner radii to soften the high-contrast aesthetic and make the app feel modern and approachable.
- **Buttons:** Use fully rounded (pill-shaped) ends for primary actions to maximize tap-target visibility and differentiate them from informational cards.
- **Inputs:** Maintain a consistent 12px radius to balance between the cards and buttons.

## Components

### Buttons
- **Primary:** Background #FF5722, Text #FFFFFF. Bold, uppercase, pill-shaped.
- **Secondary:** Outlined with 2px stroke, #FFFFFF or #FF5722.

### Swipe to Book Slider
- A full-width horizontal track with a 16px radius. 
- The "handle" is a pill-shaped button containing the primary accent color and a chevron icon. 
- As the user swipes, the track fills with a gradient from #FF5722 to #CCFF00.

### Status Badges
- Small, uppercase labels with a 10% opacity background of their respective functional color (e.g., Neon Lime for "Active") and a 100% opacity text color for maximum contrast.

### Cards
- Images within cards should use a subtle dark-to-transparent gradient overlay on the bottom third to ensure white text remains legible over photography.

### Input Fields
- Understated dark backgrounds with a 1px border that illuminates in #FF5722 upon focus. Labels should be small and uppercase, sitting just above the field.

### Lists
- Membership features or class schedules should be presented in clean, separated rows with 1px dividers at 10% opacity, utilizing the Energetic Teal for "Checkmark" icons.