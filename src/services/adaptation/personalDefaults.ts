// ══════════════════════════════════════════════════════════════
// INTENT — Personal Defaults Engine
// Defaults that change themselves based on evidence
// ══════════════════════════════════════════════════════════════

import type { UserState } from '../../types/moment'

export interface PersonalDefaults {
  defaultDurationByState: Partial<Record<UserState, number>>
  defaultProtocolByState: Partial<Record<UserState, string>>
  defaultToneByState: Partial<Record<UserState, string>>
  bodyDoubleDefault: string
  beforeScrollMode: string
  missionComplexity: 'minimal' | 'simple' | 'standard'
  commandlessHomeMode: boolean
  widgetPrivacyMode: 'private' | 'standard' | 'detailed'
  lastUpdated: number
}

export interface DefaultChange {
  field: string
  oldValue: unknown
  newValue: unknown
  reason: string
  confidence: number
  timestamp: number
}

// ── Create Initial Defaults ────────────────────────────────

export function createInitialDefaults(): PersonalDefaults {
  return {
    defaultDurationByState: {
      overwhelmed: 2,
      stuck: 5,
      avoiding: 2,
      tired: 2,
      anxious: 2,
      doomscroll_risk: 2,
      perfectionism: 5,
      scattered: 2,
      shame_spiral: 2,
      ready: 15,
    },
    defaultProtocolByState: {},
    defaultToneByState: {},
    bodyDoubleDefault: 'gentle',
    beforeScrollMode: 'tiny_win_first',
    missionComplexity: 'simple',
    commandlessHomeMode: false,
    widgetPrivacyMode: 'private',
    lastUpdated: Date.now(),
  }
}

// ── Update Default Based on Evidence ───────────────────────

export function updateDefault(
  defaults: PersonalDefaults,
  changes: DefaultChange[],
): PersonalDefaults {
  let updated = { ...defaults }

  for (const change of changes) {
    if (change.confidence < 0.7) continue // only change with strong evidence

    switch (change.field) {
      case 'duration':
        if (typeof change.newValue === 'number' && typeof change.oldValue === 'number') {
          const state = extractStateFromReason(change.reason)
          if (state) {
            updated = {
              ...updated,
              defaultDurationByState: {
                ...updated.defaultDurationByState,
                [state]: change.newValue,
              },
            }
          }
        }
        break
      case 'protocol':
        if (typeof change.newValue === 'string') {
          const state = extractStateFromReason(change.reason)
          if (state) {
            updated = {
              ...updated,
              defaultProtocolByState: {
                ...updated.defaultProtocolByState,
                [state]: change.newValue,
              },
            }
          }
        }
        break
      case 'complexity':
        if (typeof change.newValue === 'string') {
          updated = { ...updated, missionComplexity: change.newValue as PersonalDefaults['missionComplexity'] }
        }
        break
    }
  }

  return { ...updated, lastUpdated: Date.now() }
}

function extractStateFromReason(reason: string): UserState | null {
  const states: UserState[] = ['overwhelmed', 'stuck', 'avoiding', 'tired', 'anxious', 'doomscroll_risk', 'perfectionism', 'scattered', 'shame_spiral', 'ready']
  for (const state of states) {
    if (reason.toLowerCase().includes(state)) return state
  }
  return null
}

// ── Change Explanation ─────────────────────────────────────

export function getDefaultChangeExplanation(change: DefaultChange): string {
  return `Changed ${change.field} from ${change.oldValue} to ${change.newValue}. ${change.reason}`
}

export function getDefaultsSummary(defaults: PersonalDefaults): string[] {
  const summary: string[] = []
  for (const [state, duration] of Object.entries(defaults.defaultDurationByState)) {
    if (duration) summary.push(`${state}: ${duration} min default`)
  }
  return summary
}
