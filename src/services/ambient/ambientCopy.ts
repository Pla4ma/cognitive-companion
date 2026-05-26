// ══════════════════════════════════════════════════════════════
// INTENT — Ambient Copy Generator
// Privacy-safe notification copy that never shames
// ══════════════════════════════════════════════════════════════

import type {
  AmbientSuggestion,
  AmbientTrigger,
  AmbientPromptType,
  DangerWindow,
} from '../../types/ambient'
import { SAFE_NOTIFICATION_COPY, UNSAFE_NOTIFICATION_PATTERNS } from '../../types/ambient'
import { isSafeNotificationCopy, sanitizeNotificationCopy } from './ambientPolicy'

interface CopyRequest {
  trigger: AmbientTrigger
  promptType: AmbientPromptType
  dangerWindow: DangerWindow | null
  sensitiveMode: boolean
  recentCopy: string[] // avoid repeats
  confidence: number
}

interface GeneratedCopy {
  title: string
  body: string
  action: string
  safe: boolean
}

// ── Copy Bank ──────────────────────────────────────────────

const TITLES: Record<AmbientTrigger, string[]> = {
  danger_window: ['Tiny restart', 'Quick reset', 'Small step ready'],
  missed_rescue: ['Welcome back', 'Tiny win waiting', 'Ready when you are'],
  abandoned_mission: ['No judgment', 'Fresh start', 'Smaller version ready'],
  comeback: ['One small step', 'Tiny restart', 'Your next win'],
  before_scroll_window: ['Before you scroll', 'Two minutes first?', 'Quick win?'],
  context_due_soon: ['Next step ready', 'Tiny action prepared', 'One move waiting'],
  user_pattern: ['Gentle nudge', 'Tiny option', 'Small step available'],
}

const BODIES: Record<AmbientTrigger, string[]> = {
  danger_window: [
    'A 2-minute reset is available.',
    'Your easiest next move is ready.',
    'One tiny step can change the momentum.',
  ],
  missed_rescue: [
    'No pressure. A tiny action is ready if you want it.',
    'You can start with just 2 minutes.',
    'The smallest version is prepared.',
  ],
  abandoned_mission: [
    'A smaller version is ready whenever you want.',
    'No judgment. Try the 2-minute version.',
    'The easiest next step is waiting.',
  ],
  comeback: [
    'Ready for a tiny restart?',
    'One small action today?',
    'Your next small win is ready.',
  ],
  before_scroll_window: [
    'One tiny win before you scroll?',
    'Two minutes first, then scroll freely.',
    'A small action, then your choice.',
  ],
  context_due_soon: [
    'The next step from your notes is ready.',
    'One tiny action is prepared.',
    'Your easiest next move is waiting.',
  ],
  user_pattern: [
    'A gentle option is available.',
    'Tiny step ready if you want it.',
    'Your smallest next action is prepared.',
  ],
}

const ACTIONS = [
  'Start 2 min',
  'Tiny restart',
  'Begin',
  'One small step',
  'Try it',
]

// ── Generator ──────────────────────────────────────────────

export function generateAmbientCopy(request: CopyRequest): GeneratedCopy {
  const { trigger, sensitiveMode, recentCopy, confidence } = request

  // Pick title avoiding repeats
  const titlePool = TITLES[trigger] ?? TITLES.danger_window
  const title = pickNonRepeat(titlePool, recentCopy)

  // Pick body avoiding repeats
  const bodyPool = BODIES[trigger] ?? BODIES.danger_window
  const body = pickNonRepeat(bodyPool, recentCopy)

  // Pick action
  const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)]

  // Safety check
  let finalTitle = title
  let finalBody = body

  if (sensitiveMode) {
    finalTitle = sanitizeNotificationCopy(finalTitle, true)
    finalBody = sanitizeNotificationCopy(finalBody, true)
  }

  const safe = isSafeNotificationCopy(finalTitle) && isSafeNotificationCopy(finalBody)

  return {
    title: finalTitle,
    body: finalBody,
    action,
    safe,
  }
}

// ── Explain Why ────────────────────────────────────────────

export function generateWhyExplanation(
  trigger: AmbientTrigger,
  dangerWindow: DangerWindow | null,
): string {
  switch (trigger) {
    case 'danger_window':
      return dangerWindow
        ? `This is a usual drift window (${dangerWindow.label}). A tiny action now can prevent avoidance.`
        : 'This time has been a drift window before. A small step can help.'
    case 'missed_rescue':
      return 'You missed a rescue window. No judgment — a tiny restart is ready.'
    case 'abandoned_mission':
      return 'A previous mission was abandoned. The smallest version is available.'
    case 'comeback':
      return 'It has been a while since your last action. A tiny step is ready.'
    case 'before_scroll_window':
      return 'This is a common scrolling time. One small action first?'
    case 'context_due_soon':
      return 'You have a pending task. The next tiny step is prepared.'
    case 'user_pattern':
      return 'Based on your patterns, a small action might help right now.'
    default:
      return 'A tiny action is available.'
  }
}

// ── Helpers ────────────────────────────────────────────────

function pickNonRepeat(pool: string[], recent: string[]): string {
  const available = pool.filter((item) => !recent.includes(item))
  if (available.length === 0) return pool[Math.floor(Math.random() * pool.length)]
  return available[Math.floor(Math.random() * available.length)]
}
