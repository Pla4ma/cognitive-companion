// ══════════════════════════════════════════════════════════════
// INTENT — "Not This" Feedback Loop
// Learn from bad recommendations with one-tap reasons
// ══════════════════════════════════════════════════════════════

export type NotThisReason =
  | 'too_hard'
  | 'too_easy'
  | 'wrong_task'
  | 'wrong_mood'
  | 'too_long'
  | 'not_enough_energy'
  | 'too_private'
  | 'already_done'
  | 'not_important'
  | 'want_to_choose'

export interface NotThisFeedback {
  missionId: string
  reason: NotThisReason | null
  timestamp: number
}

// ── Reason Labels ──────────────────────────────────────────

export const NOT_THIS_REASONS: { reason: NotThisReason; label: string }[] = [
  { reason: 'too_hard', label: 'Too hard' },
  { reason: 'too_easy', label: 'Too easy' },
  { reason: 'wrong_task', label: 'Wrong task' },
  { reason: 'wrong_mood', label: 'Wrong mood' },
  { reason: 'too_long', label: 'Too long' },
  { reason: 'not_enough_energy', label: 'Not enough energy' },
  { reason: 'too_private', label: 'Too private' },
  { reason: 'already_done', label: 'Already done' },
  { reason: 'not_important', label: 'Not important' },
  { reason: 'want_to_choose', label: 'I want to choose' },
]

// ── Create Feedback ────────────────────────────────────────

export function createNotThisFeedback(missionId: string, reason?: NotThisReason): NotThisFeedback {
  return {
    missionId,
    reason: reason ?? null,
    timestamp: Date.now(),
  }
}

// ── Apply Feedback to Adjust ───────────────────────────────

export interface AdjustmentResult {
  action: 'shrink' | 'switch_protocol' | 'reduce_duration' | 'switch_energy' | 'let_user_choose' | 'no_change'
  newDuration: number | null
  newEnergy: 'low' | 'medium' | 'high' | null
  confidence: number
}

export function applyFeedbackAdjustment(
  reason: NotThisReason,
  currentDuration: number,
): AdjustmentResult {
  switch (reason) {
    case 'too_hard':
      return { action: 'shrink', newDuration: Math.max(1, currentDuration - 3), newEnergy: 'low', confidence: 0.7 }
    case 'too_easy':
      return { action: 'shrink', newDuration: currentDuration + 5, newEnergy: 'medium', confidence: 0.6 }
    case 'wrong_task':
      return { action: 'switch_protocol', newDuration: null, newEnergy: null, confidence: 0.5 }
    case 'wrong_mood':
      return { action: 'switch_protocol', newDuration: null, newEnergy: null, confidence: 0.5 }
    case 'too_long':
      return { action: 'reduce_duration', newDuration: Math.max(1, Math.round(currentDuration / 2)), newEnergy: null, confidence: 0.8 }
    case 'not_enough_energy':
      return { action: 'switch_energy', newDuration: null, newEnergy: 'low', confidence: 0.7 }
    case 'too_private':
      return { action: 'switch_protocol', newDuration: null, newEnergy: null, confidence: 0.4 }
    case 'already_done':
      return { action: 'switch_protocol', newDuration: null, newEnergy: null, confidence: 0.3 }
    case 'not_important':
      return { action: 'switch_protocol', newDuration: null, newEnergy: null, confidence: 0.4 }
    case 'want_to_choose':
      return { action: 'let_user_choose', newDuration: null, newEnergy: null, confidence: 0.2 }
    default:
      return { action: 'no_change', newDuration: null, newEnergy: null, confidence: 0.5 }
  }
}

// ── Get Not This Prompt ────────────────────────────────────

export function getNotThisPrompt(): string {
  return 'What was wrong?'
}

export function getNotThisSkipLabel(): string {
  return 'Skip'
}
