// ══════════════════════════════════════════════════════════════
// INTENT — Mission Thread Engine
// Track progress across attempts, not tasks
// ══════════════════════════════════════════════════════════════

export type ThreadEvent =
  | 'context_added' | 'mission_compiled' | 'mission_started' | 'mission_completed'
  | 'mission_salvaged' | 'blocker_detected' | 'protocol_changed' | 'handoff_created'
  | 'outcome_labeled' | 'next_action_generated'

export interface MissionThreadEvent {
  id: string
  type: ThreadEvent
  description: string
  timestamp: number
  metadata: Record<string, unknown>
}

export interface MissionThread {
  id: string
  title: string
  contextId: string | null
  events: MissionThreadEvent[]
  currentNextAction: string
  bestProtocol: string | null
  lastBlocker: string | null
  status: 'active' | 'completed' | 'abandoned'
  createdAt: number
  updatedAt: number
}

// ── Create Thread ──────────────────────────────────────────

export function createMissionThread(title: string, contextId?: string): MissionThread {
  return {
    id: `thread_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    title,
    contextId: contextId ?? null,
    events: [],
    currentNextAction: '',
    bestProtocol: null,
    lastBlocker: null,
    status: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

// ── Add Event ──────────────────────────────────────────────

export function addThreadEvent(
  thread: MissionThread,
  type: ThreadEvent,
  description: string,
  metadata: Record<string, unknown> = {},
): MissionThread {
  const event: MissionThreadEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type,
    description,
    timestamp: Date.now(),
    metadata,
  }
  return {
    ...thread,
    events: [...thread.events, event],
    updatedAt: Date.now(),
  }
}

// ── Update Thread State ────────────────────────────────────

export function setCurrentNextAction(thread: MissionThread, action: string): MissionThread {
  return { ...thread, currentNextAction: action, updatedAt: Date.now() }
}

export function setBestProtocol(thread: MissionThread, protocol: string): MissionThread {
  return { ...thread, bestProtocol: protocol, updatedAt: Date.now() }
}

export function setLastBlocker(thread: MissionThread, blocker: string): MissionThread {
  return { ...thread, lastBlocker: blocker, updatedAt: Date.now() }
}

export function completeThread(thread: MissionThread): MissionThread {
  return addThreadEvent({ ...thread, status: 'completed' }, 'mission_completed', 'Thread completed')
}

// ── Thread Summary ─────────────────────────────────────────

export function getThreadSummary(thread: MissionThread): {
  totalAttempts: number
  completions: number
  salvages: number
  blockers: string[]
  timeline: string
} {
  const completions = thread.events.filter((e) => e.type === 'mission_completed').length
  const salvages = thread.events.filter((e) => e.type === 'mission_salvaged').length
  const starts = thread.events.filter((e) => e.type === 'mission_started').length
  const blockers = thread.events
    .filter((e) => e.type === 'blocker_detected')
    .map((e) => e.description)

  const daySpan = thread.events.length > 1
    ? Math.ceil((thread.events[thread.events.length - 1].timestamp - thread.events[0].timestamp) / 86400000)
    : 0

  return {
    totalAttempts: starts,
    completions,
    salvages,
    blockers,
    timeline: daySpan > 0 ? `${daySpan} day${daySpan > 1 ? 's' : ''}` : 'Today',
  }
}

export function getCurrentNextAction(thread: MissionThread): string | null {
  if (!thread.currentNextAction || thread.currentNextAction.length === 0) return null
  return thread.currentNextAction
}

export function getThreadProgressPercent(thread: MissionThread): number {
  const summary = getThreadSummary(thread)
  if (summary.totalAttempts === 0) return 0
  return Math.round(((summary.completions + summary.salvages * 0.5) / summary.totalAttempts) * 100)
}
