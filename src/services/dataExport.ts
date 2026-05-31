// ══════════════════════════════════════════════════════════════
// INTENT — Data Export Service
// GDPR/privacy-compliant data export — full JSON & session CSV
// ══════════════════════════════════════════════════════════════

// ⚠️ No top-level store imports — use useAppStore.getState() inside functions

// ── Types ───────────────────────────────────────────────────

interface ExportEnvelope {
  version: number
  exportedAt: string
  app: string
  user: unknown
  sessions: unknown[]
  missions: unknown[]
  microMissions: unknown[]
  momentumEvents: unknown[]
  resistancePatterns: unknown[]
  distractions: unknown[]
  brainDumps: unknown[]
  retentionState: unknown
}

// ── Full JSON Export ────────────────────────────────────────

/**
 * Exports all user-facing store data as a formatted JSON string.
 *
 * Includes: user profile, sessions, missions, micro-missions,
 * momentum events, resistance patterns, distractions, brain dumps,
 * retention state.
 *
 * Excludes: activeSession (UI ephemeral), skipCount (internal counter),
 * isLoading / currentRoute (transient UI state).
 */
export async function exportAllData(): Promise<string> {
  const { useAppStore } = require('../store')
  const state = useAppStore.getState()

  const envelope: ExportEnvelope = {
    version: 1,
    exportedAt: new Date().toISOString(),
    app: 'INTENT',
    user: state.user ?? null,
    sessions: state.sessions ?? [],
    missions: state.missions ?? [],
    microMissions: state.microMissions ?? [],
    momentumEvents: state.momentumEvents ?? [],
    resistancePatterns: state.resistancePatterns ?? [],
    distractions: state.distractions ?? [],
    brainDumps: state.brainDumps ?? [],
    retentionState: state.retentionState ?? null,
  }

  return JSON.stringify(envelope, null, 2)
}

// ── Session History CSV ─────────────────────────────────────

const CSV_ESCAPE = /["\n\r,]/

function csvField(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (CSV_ESCAPE.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Exports session history as a CSV string.
 *
 * Columns: id, mode, startedAt, completedAt, durationMinutes,
 * interrupted, protocolId, microMissionId, skipReason, notes.
 */
export async function exportSessionHistory(): Promise<string> {
  const { useAppStore } = require('../store')
  const state = useAppStore.getState()
  const sessions = state.sessions ?? []

  const headers = [
    'id',
    'mode',
    'startedAt',
    'completedAt',
    'durationMinutes',
    'interrupted',
    'protocolId',
    'microMissionId',
    'skipReason',
    'notes',
  ]

  const rows = sessions.map((s: Record<string, unknown>) =>
    headers
      .map((h) => csvField(s[h]))
      .join(','),
  )

  return [headers.join(','), ...rows].join('\n')
}
