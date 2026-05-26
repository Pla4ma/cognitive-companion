// ══════════════════════════════════════════════════════════════
// INTENT — Drift Mirror
// "The moment you almost lost and what saved it"
// ══════════════════════════════════════════════════════════════

import type { UserState } from '../../types/moment'
import type { MissionOutcome } from './outcomeEngine'

export interface DriftMirrorInsight {
  id: string
  beforeState: UserState
  situation: string
  whatSavedIt: string
  newRule: string
  confidence: number // 0-1
  shareSafeVersion: string
  createdAt: number
  rejected: boolean
}

// ── Generate Drift Mirror Insight ──────────────────────────

export function generateDriftMirrorInsight(params: {
  state: UserState
  situation: string
  protocol: string
  outcome: MissionOutcome
  duration: number
}): DriftMirrorInsight {
  const stateLabel = stateToMirrorLabel(params.state)
  const outcomeGood = ['completed', 'partially_completed', 'started', 'salvaged'].includes(params.outcome)

  return {
    id: `mirror_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    beforeState: params.state,
    situation: `${stateLabel} + ${params.duration} min + ${params.situation}`,
    whatSavedIt: params.protocol,
    newRule: generateMirrorRule(params.state, params.protocol, outcomeGood),
    confidence: outcomeGood ? 0.6 : 0.3,
    shareSafeVersion: generateShareSafeMirror(stateLabel, params.protocol, outcomeGood),
    createdAt: Date.now(),
    rejected: false,
  }
}

// ── State Labels for Mirror ────────────────────────────────

function stateToMirrorLabel(state: UserState): string {
  const map: Record<UserState, string> = {
    overwhelmed: 'Overwhelmed',
    stuck: 'Stuck',
    avoiding: 'About to avoid',
    tired: 'Low energy',
    anxious: 'Tense',
    doomscroll_risk: 'About to scroll',
    perfectionism: 'Overthinking',
    scattered: 'Scattered',
    shame_spiral: 'Hard moment',
    ready: 'Ready',
  }
  return map[state] ?? 'In a moment'
}

// ── Rule Generation ────────────────────────────────────────

function generateMirrorRule(state: UserState, protocol: string, success: boolean): string {
  if (!success) {
    return `When ${state.toLowerCase()}, try a smaller version next time.`
  }

  const rules: Partial<Record<UserState, string>> = {
    overwhelmed: `When overwhelmed, ${protocol.toLowerCase()} breaks the freeze`,
    stuck: `When stuck, ${protocol.toLowerCase()} gets motion going`,
    avoiding: `When avoiding, ${protocol.toLowerCase()} reduces the friction`,
    tired: `When tired, ${protocol.toLowerCase()} works without willpower`,
    doomscroll_risk: `Before scrolling, ${protocol.toLowerCase()} redirects momentum`,
    perfectionism: `When overthinking, ${protocol.toLowerCase()} bypasses the inner critic`,
  }

  return rules[state] ?? `${protocol.toLowerCase()} works in this kind of moment`
}

// ── Share-safe Mirror ──────────────────────────────────────

function generateShareSafeMirror(state: string, protocol: string, success: boolean): string {
  if (success) {
    return `I was ${state.toLowerCase()} and a tiny action broke the pattern.`
  }
  return `I was ${state.toLowerCase()} and tried. That matters.`
}

// ── Mirror Copy ────────────────────────────────────────────

export function getMirrorTitle(): string {
  return 'Drift Mirror'
}

export function getMirrorSubcopy(): string {
  return 'The moment you almost lost and what saved it'
}

export function getMirrorRejectionCopy(): string {
  return 'Rule removed. INTENT will not suggest this again.'
}

export function getMirrorAcceptanceCopy(): string {
  return 'Added to your playbook.'
}

// ── Common Mirror Patterns ─────────────────────────────────

export function getCommonMirrorPatterns(): string[] {
  return [
    'You tend to plan when scared to start. Starting ugly works.',
    'You almost opened social apps, but a 2-minute mission broke the loop.',
    'You did not finish, but you came back. That pattern matters.',
    'Tiny starts work better for you than big sessions.',
    'Body double mode gets you moving when nothing else does.',
  ]
}
