// ══════════════════════════════════════════════════════════════
// INTENT — Body Double 2.0 Engine
// Guided presence system with 6 modes and check-ins
// ══════════════════════════════════════════════════════════════

import type { MicroMission } from '../types'

export type BodyDoubleMode =
  | 'silent_room'
  | 'gentle_cowork'
  | 'firm_start'
  | 'study_room'
  | 'emergency_2min'
  | 'stay_with_me'

export interface BodyDoubleCheckIn {
  id: string
  timestamp: string
  prompt: string
  responseType: 'still_working' | 'stuck' | 'distracted' | 'done' | 'need_smaller'
  nextIntervention: string | null
}

export interface BodyDoubleSession {
  id: string
  missionId: string
  mode: BodyDoubleMode
  startedAt: string
  endedAt: string | null
  checkIns: BodyDoubleCheckIn[]
  status: 'active' | 'paused' | 'completed' | 'abandoned'
}

// ── Mode Configurations ─────────────────────────────────────

interface ModeConfig {
  name: string
  description: string
  checkInIntervalMinutes: number
  maxCheckIns: number
  style: 'minimal' | 'gentle' | 'firm' | 'structured' | 'emergency' | 'supportive'
  binaryQuestionsOnly: boolean
  prompts: string[]
  stuckPrompts: string[]
  distractedPrompts: string[]
}

const MODE_CONFIGS: Record<BodyDoubleMode, ModeConfig> = {
  silent_room: {
    name: 'Silent Room',
    description: 'Minimal presence. No interruptions. Ambient pulse only.',
    checkInIntervalMinutes: 0,
    maxCheckIns: 0,
    style: 'minimal',
    binaryQuestionsOnly: false,
    prompts: [],
    stuckPrompts: ['You seem stuck. Want to try a smaller step?'],
    distractedPrompts: ['Noticed you might be drifting. Back to the mission?'],
  },
  gentle_cowork: {
    name: 'Gentle Co-Work',
    description: 'Soft check-ins every 3-5 minutes. Warm, supportive presence.',
    checkInIntervalMinutes: 4,
    maxCheckIns: 6,
    style: 'gentle',
    binaryQuestionsOnly: false,
    prompts: [
      'How\'s it going? Still with me?',
      'You\'re doing great. Keep going.',
      'What part are you working on right now?',
      'Making progress? Even a little counts.',
      'I\'m still here. You\'re not alone in this.',
      'Almost there. You\'ve got this.',
    ],
    stuckPrompts: [
      'Seems like you\'re stuck. What if we make it even smaller?',
      'Stuck is okay. What\'s the tiniest next step?',
      'Let\'s break this down. What\'s one thing you can do right now?',
    ],
    distractedPrompts: [
      'Noticed your attention might be drifting. That\'s normal. Back to it?',
      'Distraction happens. Write it down and return.',
      'What pulled your attention? Let it go and return.',
    ],
  },
  firm_start: {
    name: 'Firm Start',
    description: 'Direct instructions. No shame. Short lines only.',
    checkInIntervalMinutes: 3,
    maxCheckIns: 4,
    style: 'firm',
    binaryQuestionsOnly: true,
    prompts: [
      'Still working? Yes or no.',
      'Keep going. You\'re on track.',
      'Focus. You\'ve got this.',
      'Last check-in. Finish strong.',
    ],
    stuckPrompts: [
      'Stuck? Do the smallest possible version. Now.',
      'Break through. One action. Go.',
    ],
    distractedPrompts: [
      'Distracted. Return to mission. Now.',
      'Phone down. Eyes on the work.',
    ],
  },
  study_room: {
    name: 'Study Room',
    description: 'Recall prompts, flashcard nudges, explain-back check-ins.',
    checkInIntervalMinutes: 5,
    maxCheckIns: 5,
    style: 'structured',
    binaryQuestionsOnly: false,
    prompts: [
      'Can you explain what you just learned in one sentence?',
      'What\'s the key concept from the last 5 minutes?',
      'If you had to teach this to someone, what would you say?',
      'What\'s still unclear? Write it down.',
      'Quick recall: what are the 3 main points so far?',
    ],
    stuckPrompts: [
      'What part is confusing? Let\'s break it into smaller pieces.',
      'Go back to the last part you understood. Start from there.',
    ],
    distractedPrompts: [
      'Study mode. Return to the material.',
      'What were you just reading? Go back to that.',
    ],
  },
  emergency_2min: {
    name: 'Emergency 2-Minute Start',
    description: 'Step-by-step guided start. User responds after each tiny step.',
    checkInIntervalMinutes: 0.5,
    maxCheckIns: 4,
    style: 'emergency',
    binaryQuestionsOnly: true,
    prompts: [
      'Step 1: Open the document. Done?',
      'Step 2: Find the first heading. Done?',
      'Step 3: Write one word under it. Done?',
      'Step 4: You started. Keep going or take a break?',
    ],
    stuckPrompts: [
      'Just open the document. That\'s the only step right now.',
      'One tap. Open the file. That\'s it.',
    ],
    distractedPrompts: [
      'Ignore everything else. Just open the file.',
      'One thing. Open the document.',
    ],
  },
  stay_with_me: {
    name: 'Stay With Me',
    description: 'For high resistance moments. Very simple. Binary questions only.',
    checkInIntervalMinutes: 2,
    maxCheckIns: 8,
    style: 'supportive',
    binaryQuestionsOnly: true,
    prompts: [
      'I\'m here. Are you still with me?',
      'Still working? Just yes or no.',
      'Want to keep going or take a break?',
      'Should we make it even smaller?',
      'One more minute? Yes or no?',
      'You\'re doing great. Still with me?',
      'Almost done. Can you push a little more?',
      'You made it. How do you feel?',
    ],
    stuckPrompts: [
      'Let\'s make it smaller. Open the file. That\'s all.',
      'One tiny thing. Just open it.',
    ],
    distractedPrompts: [
      'Come back. I\'m still here.',
      'Let the distraction go. Return to me.',
    ],
  },
}

// ── Session Management ──────────────────────────────────────

export function createBodyDoubleSession(missionId: string, mode: BodyDoubleMode): BodyDoubleSession {
  return {
    id: `bd_${Date.now()}`,
    missionId,
    mode,
    startedAt: new Date().toISOString(),
    endedAt: null,
    checkIns: [],
    status: 'active',
  }
}

export function getNextCheckIn(session: BodyDoubleSession, mission: MicroMission): BodyDoubleCheckIn | null {
  const config = MODE_CONFIGS[session.mode]

  // No check-ins in silent room
  if (config.maxCheckIns === 0) return null

  // Max check-ins reached
  if (session.checkIns.length >= config.maxCheckIns) return null

  // Determine prompt type
  const lastResponse = session.checkIns[session.checkIns.length - 1]?.responseType
  let prompt: string

  if (lastResponse === 'stuck') {
    prompt = config.stuckPrompts[Math.min(session.checkIns.length, config.stuckPrompts.length - 1)]
  } else if (lastResponse === 'distracted') {
    prompt = config.distractedPrompts[Math.min(session.checkIns.length, config.distractedPrompts.length - 1)]
  } else {
    const prompts = config.prompts
    prompt = prompts[Math.min(session.checkIns.length, prompts.length - 1)] || prompts[prompts.length - 1]
  }

  return {
    id: `checkin_${Date.now()}`,
    timestamp: new Date().toISOString(),
    prompt,
    responseType: 'still_working',
    nextIntervention: null,
  }
}

export function recordCheckInResponse(
  session: BodyDoubleSession,
  checkInId: string,
  response: BodyDoubleCheckIn['responseType'],
): BodyDoubleSession {
  const checkIns = session.checkIns.map(ci => {
    if (ci.id === checkInId) {
      return {
        ...ci,
        responseType: response,
        nextIntervention: getNextIntervention(session.mode, response),
      }
    }
    return ci
  })

  return { ...session, checkIns }
}

function getNextIntervention(mode: BodyDoubleMode, response: BodyDoubleCheckIn['responseType']): string | null {
  if (response === 'done') return 'complete_session'
  if (response === 'need_smaller') return 'offer_fallback_mission'
  if (response === 'stuck') return 'offer_body_double_mode_change'
  if (response === 'distracted') return 'offer_distraction_capture'
  return null
}

export function endBodyDoubleSession(session: BodyDoubleSession, outcome: 'completed' | 'abandoned'): BodyDoubleSession {
  return {
    ...session,
    status: outcome === 'completed' ? 'completed' : 'abandoned',
    endedAt: new Date().toISOString(),
  }
}

// ── Mode Selection ──────────────────────────────────────────

export function selectBodyDoubleMode(context: {
  state: string
  energy: string
  resistance: number // 1-5
  previousMode?: BodyDoubleMode
  previousSuccess?: boolean
}): BodyDoubleMode {
  // High resistance → stay_with_me or emergency_2min
  if (context.resistance >= 4) {
    if (context.energy === 'depleted' || context.energy === 'low') {
      return 'emergency_2min'
    }
    return 'stay_with_me'
  }

  // Stuck → gentle_cowork or firm_start
  if (context.state === 'stuck') {
    return context.energy === 'high' ? 'firm_start' : 'gentle_cowork'
  }

  // Distracted → firm_start
  if (context.state === 'distracted') {
    return 'firm_start'
  }

  // Study/learning → study_room
  if (context.state === 'ready' && context.energy === 'high') {
    return 'study_room'
  }

  // Tired/depleted → silent_room or gentle_cowork
  if (context.energy === 'depleted' || context.state === 'tired') {
    return 'silent_room'
  }

  // Default
  return 'gentle_cowork'
}

// ── Mode Info ───────────────────────────────────────────────

export function getModeConfig(mode: BodyDoubleMode): ModeConfig {
  return MODE_CONFIGS[mode]
}

export function getAllModes(): { mode: BodyDoubleMode; config: ModeConfig }[] {
  return Object.entries(MODE_CONFIGS).map(([mode, config]) => ({
    mode: mode as BodyDoubleMode,
    config,
  }))
}
