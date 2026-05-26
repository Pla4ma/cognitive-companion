// ══════════════════════════════════════════════════════════════
// INTENT — Mission Outcome Labels
// Completion is not binary
// ══════════════════════════════════════════════════════════════

export type MissionOutcome =
  | 'completed'
  | 'partially_completed'
  | 'started'
  | 'clarified'
  | 'reduced'
  | 'delegated'
  | 'postponed_intentionally'
  | 'abandoned'
  | 'salvaged'
  | 'switched'
  | 'blocked'

export interface OutcomeRecord {
  missionId: string
  outcome: MissionOutcome
  notes: string
  nextAction: string
  timestamp: number
}

// ── Outcome Metadata ───────────────────────────────────────

export interface OutcomeMeta {
  label: string
  description: string
  countsAsProgress: boolean
  emoji: string
  momentumWeight: number // 0-1, how much this counts for momentum
}

export const OUTCOME_META: Record<MissionOutcome, OutcomeMeta> = {
  completed: {
    label: 'Done',
    description: 'Mission completed',
    countsAsProgress: true,
    emoji: '✓',
    momentumWeight: 1.0,
  },
  partially_completed: {
    label: 'Partially done',
    description: 'Made some progress',
    countsAsProgress: true,
    emoji: '◐',
    momentumWeight: 0.7,
  },
  started: {
    label: 'Started',
    description: 'Began the action',
    countsAsProgress: true,
    emoji: '→',
    momentumWeight: 0.5,
  },
  clarified: {
    label: 'Clarified',
    description: 'Now you know what to do',
    countsAsProgress: true,
    emoji: '◎',
    momentumWeight: 0.4,
  },
  reduced: {
    label: 'Made smaller',
    description: 'Reduced to something doable',
    countsAsProgress: true,
    emoji: '↘',
    momentumWeight: 0.3,
  },
  delegated: {
    label: 'Delegated',
    description: 'Passed to someone else',
    countsAsProgress: true,
    emoji: '↗',
    momentumWeight: 0.4,
  },
  postponed_intentionally: {
    label: 'Postponed',
    description: 'Chose to do it later',
    countsAsProgress: true,
    emoji: '⏱',
    momentumWeight: 0.2,
  },
  abandoned: {
    label: 'Let go',
    description: 'Decided not to do it',
    countsAsProgress: false,
    emoji: '○',
    momentumWeight: 0.0,
  },
  salvaged: {
    label: 'Salvaged',
    description: 'Saved something from it',
    countsAsProgress: true,
    emoji: '↻',
    momentumWeight: 0.6,
  },
  switched: {
    label: 'Switched',
    description: 'Moved to a different task',
    countsAsProgress: false,
    emoji: '↔',
    momentumWeight: 0.2,
  },
  blocked: {
    label: 'Blocked',
    description: 'Needs something else first',
    countsAsProgress: false,
    emoji: '■',
    momentumWeight: 0.1,
  },
}

// ── Outcome Helpers ────────────────────────────────────────

export function getOutcomeMeta(outcome: MissionOutcome): OutcomeMeta {
  return OUTCOME_META[outcome]
}

export function isProgress(outcome: MissionOutcome): boolean {
  return OUTCOME_META[outcome].countsAsProgress
}

export function getOutcomeOptions(): MissionOutcome[] {
  return [
    'completed',
    'partially_completed',
    'started',
    'clarified',
    'reduced',
    'salvaged',
    'postponed_intentionally',
    'abandoned',
    'blocked',
    'switched',
  ]
}

export function getOutcomePrompt(): string {
  return 'What happened?'
}

export function getOutcomeCopy(outcome: MissionOutcome): string {
  const meta = OUTCOME_META[outcome]
  return `${meta.emoji} ${meta.label} — ${meta.description}`
}
