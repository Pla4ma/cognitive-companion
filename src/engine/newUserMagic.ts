// ══════════════════════════════════════════════════════════════
// INTENT — New User Magic Engine
// App feels smart on day 0 without pretending it has data
// ══════════════════════════════════════════════════════════════

import type { UserState } from '../../types/moment'

// ── Starter Defaults ───────────────────────────────────────

export interface StarterDefault {
  state: UserState
  protocol: string
  duration: number
  copy: string
}

export const STARTER_DEFAULTS: StarterDefault[] = [
  { state: 'overwhelmed', protocol: 'shrink_the_beast', duration: 2, copy: 'Start with the smallest version' },
  { state: 'stuck', protocol: 'body_double', duration: 2, copy: 'Open it and read for 2 minutes' },
  { state: 'avoiding', protocol: 'ugly_first_move', duration: 2, copy: 'Open it. One line.' },
  { state: 'tired', protocol: 'maintenance_spark', duration: 2, copy: 'One tiny thing, then rest' },
  { state: 'anxious', protocol: 'pressure_valve', duration: 2, copy: 'Breathe. Then one small step.' },
  { state: 'doomscroll_risk', protocol: 'before_scroll', duration: 2, copy: 'One 2-minute win before you scroll' },
  { state: 'perfectionism', protocol: 'ugly_first_move', duration: 2, copy: 'Write the worst version on purpose' },
  { state: 'scattered', protocol: 'focus_one', duration: 2, copy: 'Close everything. Pick one thing.' },
  { state: 'shame_spiral', protocol: 'tiny_reset', duration: 2, copy: 'Just one tiny thing. No judgment.' },
  { state: 'ready', protocol: 'deep_work_sprint', duration: 15, copy: 'Start the thing on your mind' },
]

export function getStarterDefault(state: UserState): StarterDefault {
  return STARTER_DEFAULTS.find((d) => d.state === state) ?? STARTER_DEFAULTS[0]
}

// ── Mission Feedback ───────────────────────────────────────

export type MissionFeedback =
  | 'too_easy' | 'just_right' | 'too_hard'
  | 'wrong_task' | 'helped_start' | 'did_not_help'

export interface FeedbackEvent {
  feedback: MissionFeedback
  state: UserState
  duration: number
  protocolId: string
  timestamp: number
}

export function processFeedback(event: FeedbackEvent): {
  adjustment: string
  newDuration: number
  confidence: number
} {
  switch (event.feedback) {
    case 'too_easy':
      return { adjustment: 'increase_duration', newDuration: Math.min(event.duration + 5, 30), confidence: 0.6 }
    case 'too_hard':
      return { adjustment: 'decrease_duration', newDuration: Math.max(event.duration - 2, 1), confidence: 0.7 }
    case 'wrong_task':
      return { adjustment: 'switch_protocol', newDuration: event.duration, confidence: 0.3 }
    case 'just_right':
      return { adjustment: 'keep', newDuration: event.duration, confidence: 0.8 }
    case 'helped_start':
      return { adjustment: 'keep', newDuration: event.duration, confidence: 0.9 }
    case 'did_not_help':
      return { adjustment: 'try_different', newDuration: event.duration, confidence: 0.2 }
    default:
      return { adjustment: 'keep', newDuration: event.duration, confidence: 0.5 }
  }
}

// ── New User Detection ─────────────────────────────────────

export function isNewUser(totalMissions: number, totalDays: number): boolean {
  return totalMissions < 5 || totalDays < 3
}

export function getNewUserCopy(): string {
  return 'INTENT is learning what works for you. Each rescue teaches it something.'
}

export function getDay0Copy(): string {
  return 'Start with one 2-minute action. That is all.'
}
