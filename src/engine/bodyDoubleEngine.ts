// ══════════════════════════════════════════════════════════════
// INTENT — Body Double Engine
// Guided presence for high-resistance moments
// ══════════════════════════════════════════════════════════════

import type { Mission } from '../types'

// ── Types ─────────────────────────────────────────────────

export type BodyDoubleSessionMode =
  | 'silent_room'
  | 'gentle_cowork'
  | 'firm_start'
  | 'study_room'
  | 'emergency_2min'
  | 'stay_with_me'

export interface BodyDoubleSession {
  id: string
  missionId: string
  mode: BodyDoubleSessionMode
  status: 'active' | 'paused' | 'completed'
  startedAt: string
  checkInCount: number
}

export interface BodyDoubleInput {
  state: string
  energy: string
  resistance: number // 1-5
}

export interface CheckIn {
  prompt: string
  type: 'binary' | 'open'
  scheduledAt: string
}

// ── Mode Selection ────────────────────────────────────────

export function selectBodyDoubleMode(input: BodyDoubleInput): BodyDoubleSessionMode {
  const { state, energy, resistance } = input

  // Emergency mode for high resistance + depleted energy or extreme resistance
  if (resistance >= 5 && energy === 'depleted') {
    return 'emergency_2min'
  }

  if (resistance >= 5 && (state === 'avoiding' || state === 'stuck')) {
    return 'emergency_2min'
  }

  // High resistance → stay_with_me
  if (resistance >= 4 && energy !== 'high') {
    return 'stay_with_me'
  }

  // Medium resistance with low energy → gentle cowork
  if (resistance >= 3 && (energy === 'low' || energy === 'depleted')) {
    return 'gentle_cowork'
  }

  // Default mapping by state
  const stateModeMap: Record<string, BodyDoubleSessionMode> = {
    avoiding: 'gentle_cowork',
    overwhelmed: 'stay_with_me',
    stuck: 'gentle_cowork',
    tired: 'gentle_cowork',
    anxious: 'stay_with_me',
    scattered: 'firm_start',
    low_confidence: 'gentle_cowork',
    shame_spiral: 'stay_with_me',
    perfectionism: 'gentle_cowork',
    fake_productivity: 'firm_start',
    planning_loop: 'firm_start',
    time_pressure: 'firm_start',
    distracted: 'firm_start',
  }

  return stateModeMap[state] ?? 'gentle_cowork'
}

// ── Session Management ────────────────────────────────────

export function createBodyDoubleSession(
  missionId: string,
  mode: BodyDoubleSessionMode,
): BodyDoubleSession {
  return {
    id: `bd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    missionId,
    mode,
    status: 'active',
    startedAt: new Date().toISOString(),
    checkInCount: 0,
  }
}

// ── Check-In Logic ────────────────────────────────────────

const CHECK_IN_PROMPTS: Record<BodyDoubleSessionMode, string[]> = {
  silent_room: [],
  gentle_cowork: [
    'Still here. How are you doing?',
    'Just checking in — still with you.',
    'How\'s it going? One word is fine.',
    'Still here. Any progress is progress.',
  ],
  firm_start: [
    'Where are you at? Keep going or need a break?',
    'Check in: on track or off track?',
    'Still focused? Be honest.',
  ],
  study_room: [
    'Study session check — what did you just learn?',
    'Quick review: what\'s the key point so far?',
  ],
  emergency_2min: [
    'Are you still here? Just say yes or no.',
    'Still doing the thing?',
  ],
  stay_with_me: [
    'I\'m here. You okay?',
    'Still with me?',
    'How are you feeling right now?',
    'One step at a time. Still here.',
  ],
}

export function getNextCheckIn(
  session: BodyDoubleSession,
  mission: Pick<Mission, 'estimatedMinutes'>,
): CheckIn | null {
  // Silent room has no check-ins
  if (session.mode === 'silent_room') {
    return null
  }

  const prompts = CHECK_IN_PROMPTS[session.mode]
  if (!prompts || prompts.length === 0) {
    return null
  }

  // Select prompt based on check-in count
  const prompt = prompts[session.checkInCount % prompts.length]

  return {
    prompt,
    type: session.mode === 'emergency_2min' ? 'binary' : 'open',
    scheduledAt: new Date().toISOString(),
  }
}
