// ══════════════════════════════════════════════════════════════
// INTENT — Body Double Session Engine
// Not just a pulse animation — a real session type
// ══════════════════════════════════════════════════════════════

export type BodyDoubleMode = 'silent' | 'gentle' | 'direct' | 'study' | 'emergency' | 'low_energy'
export type CheckInType = 'binary' | 'micro_progress' | 'stuck' | 'distraction' | 'completion'

export interface BodyDoubleSession {
  id: string
  mode: BodyDoubleMode
  intention: string
  phase: 'set_intention' | 'together' | 'first_checkin' | 'midpoint' | 'stuck_rescue' | 'finish'
  startedAt: number
  checkIns: CheckInEvent[]
  checkInFrequency: number // minutes between check-ins
  silentMode: boolean
  missionId: string | null
  outcome: 'completed' | 'partial' | 'abandoned' | null
}

export interface CheckInEvent {
  id: string
  type: CheckInType
  question: string
  response: string | null
  timestamp: number
}

// ── Create Session ─────────────────────────────────────────

export function createBodyDoubleSession(params: {
  mode: BodyDoubleMode
  intention: string
  missionId?: string
  checkInFrequency?: number
}): BodyDoubleSession {
  return {
    id: `bd_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    mode: params.mode,
    intention: params.intention,
    phase: 'set_intention',
    startedAt: Date.now(),
    checkIns: [],
    checkInFrequency: params.checkInFrequency ?? getDefaultCheckInFrequency(params.mode),
    silentMode: params.mode === 'silent',
    missionId: params.missionId ?? null,
    outcome: null,
  }
}

// ── Default Frequencies ────────────────────────────────────

function getDefaultCheckInFrequency(mode: BodyDoubleMode): number {
  const frequencies: Record<BodyDoubleMode, number> = {
    silent: 999, // no check-ins
    gentle: 5,
    direct: 3,
    study: 5,
    emergency: 2,
    low_energy: 7,
  }
  return frequencies[mode]
}

// ── Check-In Generation ────────────────────────────────────

export function generateCheckIn(session: BodyDoubleSession): CheckInEvent {
  const type = getCheckInType(session)
  return {
    id: `ci_${Date.now()}`,
    type,
    question: getCheckInQuestion(type),
    response: null,
    timestamp: Date.now(),
  }
}

function getCheckInType(session: BodyDoubleSession): CheckInType {
  if (session.checkIns.length === 0) return 'binary'
  const lastResponse = session.checkIns[session.checkIns.length - 1]?.response
  if (lastResponse === 'stuck') return 'stuck'
  if (lastResponse === 'distracted') return 'distraction'
  return 'micro_progress'
}

function getCheckInQuestion(type: CheckInType): string {
  const questions: Record<CheckInType, string> = {
    binary: 'Still with it?',
    micro_progress: 'What changed?',
    stuck: 'Want smaller?',
    distraction: 'Capture it. Back to mission.',
    completion: 'Done or partial?',
  }
  return questions[type]
}

// ── Mode Descriptions ─────────────────────────────────────

export function getModeDescription(mode: BodyDoubleMode): string {
  const descriptions: Record<BodyDoubleMode, string> = {
    silent: 'No interruptions. Just presence.',
    gentle: 'Occasional soft check-ins.',
    direct: 'Regular accountability check-ins.',
    study: 'Study-focused with flashcard prompts.',
    emergency: 'Frequent check-ins for high resistance.',
    low_energy: 'Infrequent, supportive check-ins.',
  }
  return descriptions[mode]
}

export function getAvailableModes(): BodyDoubleMode[] {
  return ['silent', 'gentle', 'direct', 'study', 'emergency', 'low_energy']
}

// ── Session Advance ────────────────────────────────────────

export function advancePhase(session: BodyDoubleSession): BodyDoubleSession {
  const phases: BodyDoubleSession['phase'][] = ['set_intention', 'together', 'first_checkin', 'midpoint', 'stuck_rescue', 'finish']
  const currentIdx = phases.indexOf(session.phase)
  const nextIdx = Math.min(currentIdx + 1, phases.length - 1)
  return { ...session, phase: phases[nextIdx] }
}

export function completeSession(session: BodyDoubleSession, outcome: 'completed' | 'partial' | 'abandoned'): BodyDoubleSession {
  return { ...session, outcome, phase: 'finish' }
}
