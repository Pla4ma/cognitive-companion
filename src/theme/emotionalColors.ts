// ══════════════════════════════════════════════════════════════
// INTENT — Emotional Color Map
// Maps UserState → warm, calming color palette
// ══════════════════════════════════════════════════════════════

import type { UserState } from '../types/moment'

// ── Types ──────────────────────────────────────────────────

export interface EmotionalColor {
  /** Primary accent color for the state */
  primary: string
  /** Light tint for backgrounds / fills */
  background: string
  /** Soft glow for shadows / decorative elements */
  glow: string
}

// ── Color Map ──────────────────────────────────────────────
// All colors are warm, calming, and non-alarming.
// Designed for dark-first UI — glows are subtle and ambient.

export const emotionalColors: Record<UserState, EmotionalColor> = {
  avoiding: {
    primary: '#FCD34D',        // warm amber
    background: 'rgba(252, 211, 77, 0.08)',
    glow: 'rgba(252, 211, 77, 0.20)',
  },
  overwhelmed: {
    primary: '#93C5FD',        // soft blue
    background: 'rgba(147, 197, 253, 0.08)',
    glow: 'rgba(147, 197, 253, 0.20)',
  },
  stuck: {
    primary: '#C4B5FD',        // muted purple
    background: 'rgba(196, 181, 253, 0.08)',
    glow: 'rgba(196, 181, 253, 0.20)',
  },
  tired: {
    primary: '#D1D5DB',        // warm gray
    background: 'rgba(209, 213, 219, 0.08)',
    glow: 'rgba(209, 213, 219, 0.15)',
  },
  distracted: {
    primary: '#FDE68A',        // soft gold
    background: 'rgba(253, 230, 138, 0.08)',
    glow: 'rgba(253, 230, 138, 0.20)',
  },
  anxious: {
    primary: '#FCA5A5',        // soft pink
    background: 'rgba(252, 165, 165, 0.08)',
    glow: 'rgba(252, 165, 165, 0.20)',
  },
  scattered: {
    primary: '#FBD38D',        // warm sand
    background: 'rgba(251, 211, 141, 0.08)',
    glow: 'rgba(251, 211, 141, 0.18)',
  },
  ready: {
    primary: '#86EFAC',        // soft green
    background: 'rgba(134, 239, 172, 0.08)',
    glow: 'rgba(134, 239, 172, 0.20)',
  },
  bored: {
    primary: '#E5E7EB',        // light cool gray
    background: 'rgba(229, 231, 235, 0.08)',
    glow: 'rgba(229, 231, 235, 0.12)',
  },
  perfectionism: {
    primary: '#DDD6FE',        // lavender
    background: 'rgba(221, 214, 254, 0.08)',
    glow: 'rgba(221, 214, 254, 0.20)',
  },
  unclear: {
    primary: '#F3F4F6',        // near-white cool
    background: 'rgba(243, 244, 246, 0.06)',
    glow: 'rgba(243, 244, 246, 0.12)',
  },
  time_pressure: {
    primary: '#FDBA74',        // soft orange
    background: 'rgba(253, 186, 116, 0.08)',
    glow: 'rgba(253, 186, 116, 0.20)',
  },
  low_confidence: {
    primary: '#D8B4FE',        // light violet
    background: 'rgba(216, 180, 254, 0.08)',
    glow: 'rgba(216, 180, 254, 0.20)',
  },
  shame_spiral: {
    primary: '#5EEAD4',        // deep teal
    background: 'rgba(94, 234, 212, 0.08)',
    glow: 'rgba(94, 234, 212, 0.20)',
  },
  fake_productivity: {
    primary: '#FCD34D',        // warm amber (same as avoiding — related state)
    background: 'rgba(252, 211, 77, 0.06)',
    glow: 'rgba(252, 211, 77, 0.15)',
  },
  planning_loop: {
    primary: '#C084FC',        // medium purple
    background: 'rgba(192, 132, 252, 0.08)',
    glow: 'rgba(192, 132, 252, 0.20)',
  },
  doomscroll_risk: {
    primary: '#FDA4AF',        // rose pink
    background: 'rgba(253, 164, 175, 0.08)',
    glow: 'rgba(253, 164, 175, 0.18)',
  },
} as const

// ── Helper ─────────────────────────────────────────────────

/**
 * Get the emotional color set for a given user state.
 * Falls back to a neutral palette if state is somehow invalid.
 */
export function getEmotionalColor(state: UserState): EmotionalColor {
  return emotionalColors[state] ?? {
    primary: '#B4B4C8',
    background: 'rgba(180, 180, 200, 0.06)',
    glow: 'rgba(180, 180, 200, 0.12)',
  }
}
