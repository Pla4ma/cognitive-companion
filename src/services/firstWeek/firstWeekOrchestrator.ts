// ══════════════════════════════════════════════════════════════
// INTENT — First-Week Orchestrator
// Day 0-7 feature flag progression
// ══════════════════════════════════════════════════════════════

export type DayNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

export interface FirstWeekState {
  currentDay: DayNumber
  featuresUnlocked: string[]
  missionsCompleted: number
  firstRescueCompleted: boolean
  patternsShown: boolean
  beforeScrollIntroduced: boolean
  bodyDoubleIntroduced: boolean
  contextInboxIntroduced: boolean
  weeklyStoryShown: boolean
}

// ── Create Initial State ───────────────────────────────────

export function createFirstWeekState(): FirstWeekState {
  return {
    currentDay: 0,
    featuresUnlocked: ['emergency_start', 'state_select', 'basic_mission', 'salvage'],
    missionsCompleted: 0,
    firstRescueCompleted: false,
    patternsShown: false,
    beforeScrollIntroduced: false,
    bodyDoubleIntroduced: false,
    contextInboxIntroduced: false,
    weeklyStoryShown: false,
  }
}

// ── Day Progression ────────────────────────────────────────

export function advanceDay(state: FirstWeekState): FirstWeekState {
  const nextDay = Math.min(state.currentDay + 1, 7) as DayNumber
  const updated = { ...state, currentDay: nextDay }

  // Day 0: first rescue
  if (nextDay === 0) {
    updated.featuresUnlocked = ['emergency_start', 'state_select', 'basic_mission', 'salvage']
  }

  // Day 1: comeback prompt
  if (nextDay >= 1) {
    updated.featuresUnlocked = [...new Set([...updated.featuresUnlocked, 'comeback', 'attention_receipt'])]
  }

  // Day 2: first pattern
  if (nextDay >= 2 && state.missionsCompleted >= 2) {
    updated.featuresUnlocked = [...new Set([...updated.featuresUnlocked, 'drift_graph_basic'])]
    updated.patternsShown = true
  }

  // Day 3: Before You Scroll
  if (nextDay >= 3) {
    updated.featuresUnlocked = [...new Set([...updated.featuresUnlocked, 'before_scroll'])]
    updated.beforeScrollIntroduced = true
  }

  // Day 4: Body Double (if struggled)
  if (nextDay >= 4 && state.missionsCompleted >= 1) {
    updated.featuresUnlocked = [...new Set([...updated.featuresUnlocked, 'body_double_basic'])]
    updated.bodyDoubleIntroduced = true
  }

  // Day 5: Context Inbox
  if (nextDay >= 5) {
    updated.featuresUnlocked = [...new Set([...updated.featuresUnlocked, 'context_inbox'])]
    updated.contextInboxIntroduced = true
  }

  // Day 6: Playbook
  if (nextDay >= 6) {
    updated.featuresUnlocked = [...new Set([...updated.featuresUnlocked, 'playbook_basic'])]
  }

  // Day 7: Weekly Story
  if (nextDay >= 7) {
    updated.featuresUnlocked = [...new Set([...updated.featuresUnlocked, 'weekly_story', 'experiments_basic'])]
    updated.weeklyStoryShown = true
  }

  return updated
}

// ── Feature Gate Check ─────────────────────────────────────

export function isFeatureUnlocked(state: FirstWeekState, feature: string): boolean {
  return state.featuresUnlocked.includes(feature)
}

// ── Day Copy ───────────────────────────────────────────────

export function getDayCopy(day: DayNumber): { title: string; subtitle: string } {
  const copies: Record<DayNumber, { title: string; subtitle: string }> = {
    0: { title: 'Start your first rescue', subtitle: 'No account needed. One 2-minute action.' },
    1: { title: 'Welcome back', subtitle: 'Yesterday you rescued a moment. Want another tiny win?' },
    2: { title: 'First pattern spotted', subtitle: 'INTENT is learning what works for you.' },
    3: { title: 'Before You Scroll', subtitle: 'Want INTENT to appear before your usual drift window?' },
    4: { title: 'Body Double', subtitle: 'Sometimes starting together helps. Try it?' },
    5: { title: 'Drop one messy thing', subtitle: 'INTENT will turn it into a tiny mission.' },
    6: { title: 'Your playbook is forming', subtitle: 'See what patterns INTENT has found.' },
    7: { title: 'Your first week', subtitle: 'Here is your weekly story and one experiment to try.' },
  }
  return copies[day]
}

export function getNextUnlockHint(state: FirstWeekState): string | null {
  if (!state.firstRescueCompleted) return 'Complete your first rescue to unlock more'
  if (!state.patternsShown) return 'Complete 2 missions to see your first pattern'
  if (!state.beforeScrollIntroduced) return 'Before You Scroll unlocks on day 3'
  if (!state.contextInboxIntroduced) return 'Context Inbox unlocks on day 5'
  if (!state.weeklyStoryShown) return 'Weekly Story unlocks on day 7'
  return null
}
