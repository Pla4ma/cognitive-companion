// ══════════════════════════════════════════════════════════════
// INTENT — Design System
// Dark-first color tokens, spacing, typography, shadows, animations
// ══════════════════════════════════════════════════════════════

// ── Color System ───────────────────────────────────────────
// All colors are hex/rgba — React Native does NOT support oklch()
// Brand: purple (hue 280), perceptually tuned for dark backgrounds

export const colors = {
  // Backgrounds
  bg: {
    base: '#060608',
    surface: '#0E0E12',
    elevated: '#16161A',
    overlay: '#1E1E24',
    card: '#121218',
    cardHover: '#1A1A22',
  },

  // Text
  text: {
    primary: '#FFFFFF',
    secondary: '#B4B4C8',    // was oklch(75% 0.02 260)
    tertiary: '#7E7E96',     // was oklch(55% 0.02 260)
    disabled: '#6A6A80',     // was '#565668', raised for WCAG AA contrast
    inverse: '#060608',
  },

  // Brand (purple gradient, perceptually mapped from oklch)
  brand: {
    50: '#F2ECFF',           // was oklch(95% 0.05 280)
    100: '#E0D4FF',          // was oklch(90% 0.08 280)
    200: '#C4ADFF',          // was oklch(80% 0.12 280)
    300: '#A47AFF',          // was oklch(70% 0.18 280)
    400: '#8B5CF6',          // was oklch(60% 0.22 280) — primary accent
    500: '#6C3AED',          // kept (was hex already)
    600: '#5528CC',          // was oklch(45% 0.22 280)
    700: '#3E1A9E',          // was oklch(35% 0.20 280)
    800: '#2A1070',          // was oklch(25% 0.16 280)
    900: '#1A0A42',          // was oklch(15% 0.12 280)
  },

  // Semantic
  success: '#10B981',
  successBg: '#DCFCE7',      // was oklch(90% 0.08 155)
  warning: '#F59E0B',
  warningBg: '#FEF3C7',      // was oklch(90% 0.08 80)
  error: '#EF4444',
  errorBg: '#FEE2E2',        // was oklch(90% 0.08 20)
  info: '#3B82F6',
  infoBg: '#DBEAFE',         // was oklch(90% 0.08 240)

  // Accent palette
  accent: {
    purple: '#6C3AED',
    pink: '#EC4899',
    green: '#10B981',
    orange: '#F59E0B',
    blue: '#3B82F6',
    cyan: '#06B6D4',
    red: '#EF4444',
  },

  // Focus type colors
  focus: {
    deep_work: '#6C3AED',
    creative: '#EC4899',
    learning: '#10B981',
    rest: '#F59E0B',
  },

  // Borders
  border: {
    subtle: 'rgba(255,255,255,0.06)',
    default: 'rgba(255,255,255,0.10)',
    strong: 'rgba(255,255,255,0.16)',
    focus: '#6C3AED',
  },

  // Gradients (as color stops)
  gradients: {
    brand: ['#7C4FED', '#A78BFA'],
    success: ['#10B981', '#34D399'],
    warning: ['#F59E0B', '#FBBF24'],
    surface: ['#16161A', '#0E0E12'],
    card: ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.01)'],
    glow: ['rgba(108,58,237,0.3)', 'rgba(108,58,237,0)'],
  },
} as const

// ── Spacing (8pt grid) ────────────────────────────────────

export const spacing = {
  xxxs: 2,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  sectionGap: 28,
} as const

// ── Border Radius ─────────────────────────────────────────

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 9999,
} as const

// ── Typography ────────────────────────────────────────────

import { fonts } from './fonts'

export type TypographyScale = {
  hero: import('react-native').TextStyle
  display: import('react-native').TextStyle
  headline: import('react-native').TextStyle
  h1: import('react-native').TextStyle
  h2: import('react-native').TextStyle
  h3: import('react-native').TextStyle
  body: import('react-native').TextStyle
  bodyMedium: import('react-native').TextStyle
  bodySmall: import('react-native').TextStyle
  label: import('react-native').TextStyle
  labelSmall: import('react-native').TextStyle
  caption: import('react-native').TextStyle
  button: import('react-native').TextStyle
  buttonSmall: import('react-native').TextStyle
  mono: import('react-native').TextStyle
  monoSmall: import('react-native').TextStyle
}

export const typography: TypographyScale = {
  hero: { fontSize: 40, lineHeight: 44, fontWeight: '800', letterSpacing: -1.5, fontFamily: fonts.display },
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -1, fontFamily: fonts.display },
  headline: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.5, fontFamily: fonts.display },
  h1: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.5, fontFamily: fonts.bold },
  h2: { fontSize: 20, lineHeight: 26, fontWeight: '600', letterSpacing: -0.3, fontFamily: fonts.bold },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '600', fontFamily: fonts.bold },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400', fontFamily: fonts.body },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400', fontFamily: fonts.bodyMedium },
  bodySmall: { fontSize: 12, lineHeight: 16, fontWeight: '400', fontFamily: fonts.body },
  label: { fontSize: 14, lineHeight: 16, fontWeight: '600', letterSpacing: 0.5, fontFamily: fonts.bold },
  labelSmall: { fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 0.8, fontFamily: fonts.bodyMedium },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500', fontFamily: fonts.bodyMedium },
  button: { fontSize: 16, lineHeight: 20, fontWeight: '600', fontFamily: fonts.bold },
  buttonSmall: { fontSize: 14, lineHeight: 16, fontWeight: '600', fontFamily: fonts.bold },
  mono: { fontSize: 48, lineHeight: 52, fontWeight: '700', fontVariant: ['tabular-nums'], fontFamily: fonts.mono },
  monoSmall: { fontSize: 24, lineHeight: 28, fontWeight: '600', fontVariant: ['tabular-nums'], fontFamily: fonts.mono },
}

// ── Shadows ───────────────────────────────────────────────

import type { ViewStyle } from 'react-native'

export const shadows: Record<string, ViewStyle> = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#6C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  glowPink: {
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
}

// ── Animation Durations ───────────────────────────────────

export const animation = {
  instant: 100,
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 800,
  page: 400,
  spring: { damping: 15, stiffness: 150, mass: 1 },
  springBouncy: { damping: 12, stiffness: 200, mass: 0.8 },
} as const

// ── Z-Index Scale ─────────────────────────────────────────

export const zIndex = {
  base: 0,
  card: 1,
  sticky: 10,
  overlay: 50,
  modal: 100,
  toast: 200,
  tooltip: 300,
} as const

// ── Layout ────────────────────────────────────────────────

export const layout = {
  tabBarHeight: 80,
  headerHeight: 60,
  maxContentWidth: 480,
  screenPadding: 20,
  cardPadding: 16,
  sectionGap: 24,
  itemGap: 12,
} as const

// ── Glass Effect ──────────────────────────────────────────

export const glass = {
  light: { backgroundColor: 'rgba(255,255,255,0.04)', blur: 20, border: 'rgba(255,255,255,0.08)' },
  medium: { backgroundColor: 'rgba(255,255,255,0.06)', blur: 30, border: 'rgba(255,255,255,0.10)' },
  strong: { backgroundColor: 'rgba(255,255,255,0.08)', blur: 40, border: 'rgba(255,255,255,0.14)' },
} as const
