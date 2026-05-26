// ══════════════════════════════════════════════════════════════
// INTENT — Design System
// OKLCH color tokens, spacing, typography, shadows, animations
// ══════════════════════════════════════════════════════════════

// ── Color System (OKLCH) ──────────────────────────────────
// Perceptually uniform, accessible, dark-first

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
    secondary: 'oklch(75% 0.02 260)',
    tertiary: 'oklch(55% 0.02 260)',
    disabled: 'oklch(40% 0.02 260)',
    inverse: '#060608',
  },

  // Brand
  brand: {
    50: 'oklch(95% 0.05 280)',
    100: 'oklch(90% 0.08 280)',
    200: 'oklch(80% 0.12 280)',
    300: 'oklch(70% 0.18 280)',
    400: 'oklch(60% 0.22 280)',
    500: '#6C3AED',
    600: 'oklch(45% 0.22 280)',
    700: 'oklch(35% 0.20 280)',
    800: 'oklch(25% 0.16 280)',
    900: 'oklch(15% 0.12 280)',
  },

  // Semantic
  success: '#10B981',
  successBg: 'oklch(90% 0.08 155)',
  warning: '#F59E0B',
  warningBg: 'oklch(90% 0.08 80)',
  error: '#EF4444',
  errorBg: 'oklch(90% 0.08 20)',
  info: '#3B82F6',
  infoBg: 'oklch(90% 0.08 240)',

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
    brand: ['#6C3AED', '#8B5CF6', '#A78BFA'],
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

export const typography: Record<string, import('react-native').TextStyle> = {
  hero: { fontSize: 40, lineHeight: 44, fontWeight: '800', letterSpacing: -1.5 },
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -1 },
  headline: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.5 },
  h1: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.5 },
  h2: { fontSize: 20, lineHeight: 26, fontWeight: '600', letterSpacing: -0.3 },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  bodySmall: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 16, fontWeight: '600', letterSpacing: 0.5 },
  labelSmall: { fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 0.8 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  button: { fontSize: 16, lineHeight: 20, fontWeight: '600' },
  buttonSmall: { fontSize: 14, lineHeight: 16, fontWeight: '600' },
  mono: { fontSize: 48, lineHeight: 52, fontWeight: '700', fontVariant: ['tabular-nums'] },
  monoSmall: { fontSize: 24, lineHeight: 28, fontWeight: '600', fontVariant: ['tabular-nums'] },
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
