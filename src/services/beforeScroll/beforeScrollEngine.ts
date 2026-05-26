// ══════════════════════════════════════════════════════════════
// INTENT — Before You Scroll Engine (Deepened)
// Make it a choice, not a slip
// ══════════════════════════════════════════════════════════════

export type BeforeScrollMode = 'tiny_win_first' | 'name_avoidance' | 'scroll_with_timer' | 'swap_scroll' | 'earned_scroll'

export interface BeforeScrollSession {
  id: string
  mode: BeforeScrollMode
  startedAt: number
  tinyWinCompleted: boolean
  choseScrollAfter: boolean
  choseAnotherMission: boolean
  choseDone: boolean
  scrollTimerStarted: number | null
  scrollTimerEnded: number | null
  avoidedThing: string | null
}

// ── Create Session ─────────────────────────────────────────

export function createBeforeScrollSession(mode: BeforeScrollMode): BeforeScrollSession {
  return {
    id: `bs_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    mode,
    startedAt: Date.now(),
    tinyWinCompleted: false,
    choseScrollAfter: false,
    choseAnotherMission: false,
    choseDone: false,
    scrollTimerStarted: null,
    scrollTimerEnded: null,
    avoidedThing: null,
  }
}

// ── Mode Descriptions ─────────────────────────────────────

export function getModeDescription(mode: BeforeScrollMode): string {
  const descriptions: Record<BeforeScrollMode, string> = {
    tiny_win_first: 'Do one 2-minute action before scrolling',
    name_avoidance: 'Name what you are avoiding, then choose',
    scroll_with_timer: 'Choose intentional scroll with a timer',
    swap_scroll: 'Try a low-energy alternative instead',
    earned_scroll: 'Complete a tiny mission, then scroll freely',
  }
  return descriptions[mode]
}

export function getModeTitle(mode: BeforeScrollMode): string {
  const titles: Record<BeforeScrollMode, string> = {
    tiny_win_first: 'Tiny Win First',
    name_avoidance: 'Name the Avoidance',
    scroll_with_timer: 'Scroll With Timer',
    swap_scroll: 'Swap the Scroll',
    earned_scroll: 'Earned Scroll',
  }
  return titles[mode]
}

// ── Swap Suggestions ───────────────────────────────────────

export interface SwapSuggestion {
  action: string
  duration: number
  category: string
}

export function getSwapSuggestions(): SwapSuggestion[] {
  return [
    { action: 'Stretch for 2 minutes', duration: 2, category: 'body' },
    { action: 'Fill a glass of water', duration: 1, category: 'health' },
    { action: 'Clear one surface', duration: 3, category: 'environment' },
    { action: 'Open your notes and read one paragraph', duration: 2, category: 'study' },
    { action: 'Draft one message', duration: 2, category: 'social' },
    { action: 'Stand outside for 2 minutes', duration: 2, category: 'nature' },
  ]
}

// ── Session Completion ─────────────────────────────────────

export function completeBeforeScroll(session: BeforeScrollSession, outcome: {
  tinyWinCompleted: boolean
  choseScrollAfter: boolean
  choseAnotherMission: boolean
  choseDone: boolean
}): BeforeScrollSession {
  return {
    ...session,
    ...outcome,
  }
}

// ── Copy ───────────────────────────────────────────────────

export function getBeforeScrollCopy(): string[] {
  return [
    'Scroll after a tiny win.',
    'Make it a choice, not a slip.',
    'Two minutes before you disappear.',
    'No shame. Just choose intentionally.',
  ]
}

export function getRandomBeforeScrollCopy(): string {
  const copies = getBeforeScrollCopy()
  return copies[Math.floor(Math.random() * copies.length)]
}
