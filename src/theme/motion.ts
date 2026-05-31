// ══════════════════════════════════════════════════════════════
// INTENT — Motion / Animation Design System
// Duration, easing, spring, scale, and transition presets
// ══════════════════════════════════════════════════════════════

import { Easing, type WithSpringConfig, type WithTimingConfig } from 'react-native-reanimated'

// ── Duration Tokens (ms) ───────────────────────────────────

export const duration = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  breathe: 4000,
} as const

export type DurationToken = keyof typeof duration

// ── Easing Tokens ──────────────────────────────────────────

export const easing = {
  /** Standard Material ease-in-out */
  standard: Easing.bezier(0.4, 0.0, 0.2, 1),
  /** Decelerate — element entering view */
  decelerate: Easing.bezier(0.0, 0.0, 0.2, 1),
  /** Accelerate — element leaving view */
  accelerate: Easing.bezier(0.4, 0.0, 1, 1),
  /** Spring-like curve for timing-based animations */
  spring: Easing.bezier(0.175, 0.885, 0.32, 1.275),
  /** Gentle ease for ambient / breathing animations */
  breathe: Easing.bezier(0.45, 0.05, 0.55, 0.95),
} as const

export type EasingToken = keyof typeof easing

// ── Spring Configs ─────────────────────────────────────────

export const springs = {
  /** Default gentle spring — most interactions */
  gentle: { damping: 15, stiffness: 150, mass: 1 } satisfies WithSpringConfig,
  /** Bouncy spring — celebratory / delightful moments */
  bouncy: { damping: 12, stiffness: 200, mass: 0.8 } satisfies WithSpringConfig,
  /** Stiff spring — quick responsive feedback */
  stiff: { damping: 20, stiffness: 300, mass: 1 } satisfies WithSpringConfig,
  /** Slow spring — large surfaces / page transitions */
  slow: { damping: 18, stiffness: 80, mass: 1.2 } satisfies WithSpringConfig,
} as const

export type SpringToken = keyof typeof springs

// ── Scale Tokens (press feedback) ──────────────────────────

export const scale = {
  /** Primary button press */
  press: 0.97,
  /** Card / large surface press */
  cardPress: 0.98,
  /** Chip / small element press */
  chipPress: 0.95,
} as const

export type ScaleToken = keyof typeof scale

// ── Transition Presets ─────────────────────────────────────

export const transitions = {
  /** Fade in from transparent */
  fadeIn: {
    entering: (delay = 0) => ({
      opacity: 0,
      duration: duration.normal,
      delay,
      easing: easing.decelerate,
    }),
  },
  /** Slide up from below */
  slideUp: {
    entering: (delay = 0) => ({
      originY: 40,
      duration: duration.normal,
      delay,
      easing: easing.decelerate,
    }),
  },
  /** Slide down from above */
  slideDown: {
    entering: (delay = 0) => ({
      originY: -40,
      duration: duration.normal,
      delay,
      easing: easing.decelerate,
    }),
  },
  /** Scale in from smaller */
  scaleIn: {
    entering: (delay = 0) => ({
      transform: [{ scale: 0.9 }],
      opacity: 0,
      duration: duration.normal,
      delay,
      easing: easing.decelerate,
    }),
  },
  /** Stagger helper — returns a delay based on index */
  stagger: (index: number, baseDelay = 50) => index * baseDelay,
} as const

// ── Timing Configs (convenience) ───────────────────────────

export function timingConfig(
  durationMs: number,
  easingFn = easing.standard,
): WithTimingConfig {
  return {
    duration: durationMs,
    easing: easingFn,
  }
}

export function springConfig(token: SpringToken = 'gentle'): WithSpringConfig {
  return springs[token]
}

// ── Re-export for convenience ──────────────────────────────

/** Full motion design system */
export const motion = {
  duration,
  easing,
  springs,
  scale,
  transitions,
  timingConfig,
  springConfig,
} as const
