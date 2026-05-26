// ══════════════════════════════════════════════════════════════
// INTENT — Timer State Machine
// Date.now-based, survives background/kill/timezone changes
// ══════════════════════════════════════════════════════════════

export type TimerState =
  | 'idle'
  | 'preparing'
  | 'running'
  | 'paused'
  | 'backgrounded'
  | 'completed'
  | 'abandoned'
  | 'salvage_offered'
  | 'salvaged'

export type TimerEvent =
  | 'START' | 'PAUSE' | 'RESUME' | 'BACKGROUND' | 'FOREGROUND'
  | 'COMPLETE' | 'DONE_EARLY' | 'CANCEL' | 'SALVAGE_OFFER' | 'SALVAGE_ACCEPT'
  | 'APP_KILL' | 'CLOCK_CHANGE'

export interface TimerSession {
  state: TimerState
  missionId: string
  durationMs: number
  startedAt: number | null
  pausedAt: number | null
  totalPausedMs: number
  backgroundedAt: number | null
  completedAt: number | null
  driftDuringPause: boolean
}

// ── State Transitions ──────────────────────────────────────

const TRANSITIONS: Record<TimerState, Partial<Record<TimerEvent, TimerState>>> = {
  idle: { START: 'preparing' },
  preparing: { START: 'running', CANCEL: 'idle' },
  running: {
    PAUSE: 'paused', BACKGROUND: 'backgrounded', COMPLETE: 'completed',
    DONE_EARLY: 'completed', CANCEL: 'abandoned', SALVAGE_OFFER: 'salvage_offered',
  },
  paused: {
    RESUME: 'running', CANCEL: 'abandoned', COMPLETE: 'completed',
    BACKGROUND: 'backgrounded', SALVAGE_OFFER: 'salvage_offered',
  },
  backgrounded: {
    FOREGROUND: 'running', COMPLETE: 'completed', APP_KILL: 'abandoned',
  },
  completed: {},
  abandoned: { SALVAGE_OFFER: 'salvage_offered' },
  salvage_offered: { SALVAGE_ACCEPT: 'salvaged', CANCEL: 'abandoned' },
  salvaged: {},
}

export function transitionTimer(session: TimerSession, event: TimerEvent): TimerSession {
  const nextState = TRANSITIONS[session.state]?.[event]
  if (!nextState) return session // invalid transition, no-op

  const now = Date.now()
  const updated = { ...session, state: nextState }

  switch (event) {
    case 'START':
      updated.startedAt = now
      updated.totalPausedMs = 0
      break
    case 'PAUSE':
      updated.pausedAt = now
      break
    case 'RESUME':
      if (updated.pausedAt) {
        updated.totalPausedMs += now - updated.pausedAt
      }
      updated.pausedAt = null
      break
    case 'BACKGROUND':
      updated.backgroundedAt = now
      updated.driftDuringPause = true
      break
    case 'FOREGROUND':
      updated.backgroundedAt = null
      break
    case 'COMPLETE':
    case 'DONE_EARLY':
      updated.completedAt = now
      break
    case 'APP_KILL':
      updated.driftDuringPause = true
      break
  }

  return updated
}

// ── Time Calculations ──────────────────────────────────────

export function getElapsedMs(session: TimerSession): number {
  if (!session.startedAt) return 0
  const end = session.completedAt ?? Date.now()
  return end - session.startedAt - session.totalPausedMs
}

export function getRemainingMs(session: TimerSession): number {
  return Math.max(0, session.durationMs - getElapsedMs(session))
}

export function getProgress(session: TimerSession): number {
  if (session.durationMs === 0) return 0
  return Math.min(1, getElapsedMs(session) / session.durationMs)
}

export function isExpired(session: TimerSession): boolean {
  return getRemainingMs(session) <= 0
}

// ── Create Session ─────────────────────────────────────────

export function createTimerSession(missionId: string, durationMinutes: number): TimerSession {
  return {
    state: 'idle',
    missionId,
    durationMs: durationMinutes * 60 * 1000,
    startedAt: null,
    pausedAt: null,
    totalPausedMs: 0,
    backgroundedAt: null,
    completedAt: null,
    driftDuringPause: false,
  }
}
