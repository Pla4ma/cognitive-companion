// ══════════════════════════════════════════════════════════════
// INTENT — Voice Mode Copy
// All user-facing text for the voice capture experience
// ══════════════════════════════════════════════════════════════

import type { VoiceCopy, VoiceIntentCategory } from '../../types/voice'
import type { UserState } from '../../types/moment'

// ── Base Copy ───────────────────────────────────────────────

export const VOICE_COPY: VoiceCopy = {
  listeningPrompt: 'Listening… just speak naturally.',
  processingPrompt: 'Got it — processing what you said…',
  errorPrompt: 'Something went wrong. Let\'s try again.',
  confirmationPrompt: 'Heard you. Want to go with this?',
  permissionDeniedPrompt: 'I need microphone access to hear you. You can enable it in Settings.',
  recordingTooShortPrompt: 'That was too quick — try saying a bit more.',
  stateDetectedPrompt: 'I picked up how you\'re feeling. Let me help.',
}

// ── State-Specific Prompts ──────────────────────────────────

const STATE_PROMPTS: Record<UserState, {
  greeting: string
  followUp: string
  encouragement: string
}> = {
  avoiding: {
    greeting: 'I hear you. Starting is the hardest part.',
    followUp: 'What\'s the one thing you\'re avoiding right now?',
    encouragement: 'Just 2 minutes. That\'s all it takes to break through.',
  },
  overwhelmed: {
    greeting: 'That sounds like a lot. Let\'s sort through it together.',
    followUp: 'Want to dump everything out so we can see what\'s real?',
    encouragement: 'You don\'t have to do it all. Just one piece.',
  },
  stuck: {
    greeting: 'Being stuck is frustrating. Let\'s find your next move.',
    followUp: 'What\'s blocking you — do you know what to do, or not sure where to start?',
    encouragement: 'The first step is usually smaller than you think.',
  },
  tired: {
    greeting: 'I hear the exhaustion. Your energy matters.',
    followUp: 'Do you want to push through gently, or rest first?',
    encouragement: 'Even a tiny bit of progress counts when you\'re tired.',
  },
  distracted: {
    greeting: 'Got pulled away? That happens. Let\'s get back on track.',
    followUp: 'What was the distraction? Let\'s capture it and move on.',
    encouragement: 'Noticing the distraction is already a win.',
  },
  anxious: {
    greeting: 'Anxiety makes everything harder. You\'re not alone in this.',
    followUp: 'What\'s worrying you most right now?',
    encouragement: 'Name the fear. Then take one small step anyway.',
  },
  scattered: {
    greeting: 'Too many things pulling at you? Let\'s focus.',
    followUp: 'If you could only do one thing today, what would it be?',
    encouragement: 'One thing. That\'s enough. Everything else can wait.',
  },
  ready: {
    greeting: 'You\'re in a good place. Let\'s use it.',
    followUp: 'What\'s the most important thing to tackle while you\'re feeling this?',
    encouragement: 'This is your moment. Go.',
  },
  bored: {
    greeting: 'Boring tasks are the sneakiest form of resistance.',
    followUp: 'What if we add a constraint — like finishing in 10 minutes?',
    encouragement: 'Boring doesn\'t mean unimportant. Let\'s just get it done.',
  },
  perfectionism: {
    greeting: 'Perfectionism is resistance in disguise.',
    followUp: 'What are you trying to make perfect that could be good enough?',
    encouragement: 'Done is better than perfect. Ship the ugly version.',
  },
  unclear: {
    greeting: 'Not knowing where to start is normal. Let\'s figure it out.',
    followUp: 'What\'s the thing that feels most confusing right now?',
    encouragement: 'Clarity comes from doing, not thinking.',
  },
  time_pressure: {
    greeting: 'Time pressure is real. Let\'s define what "enough" looks like.',
    followUp: 'What\'s the one thing that absolutely has to get done?',
    encouragement: 'Reduce scope. Define done. Execute.',
  },
  low_confidence: {
    greeting: 'I get it. Self-doubt is loud sometimes.',
    followUp: 'What\'s making you doubt yourself?',
    encouragement: 'You\'ve done hard things before. You can do this one too.',
  },
  shame_spiral: {
    greeting: 'No judgment here. You showed up — that counts.',
    followUp: 'What\'s the smallest possible restart you can make?',
    encouragement: 'One tiny action breaks the spiral. Let\'s find it.',
  },
  fake_productivity: {
    greeting: 'Planning feels productive but isn\'t the same as doing.',
    followUp: 'What are you planning that you could just start right now?',
    encouragement: 'Close the plan. Open the work. Do one thing.',
  },
  planning_loop: {
    greeting: 'Looping on plans? Let\'s break the cycle.',
    followUp: 'You\'ve planned enough. What\'s one thing you can do in the next 2 minutes?',
    encouragement: 'Stop planning. Start doing. Right now.',
  },
  doomscroll_risk: {
    greeting: 'The scroll is calling? Let\'s do one thing first.',
    followUp: 'What\'s one tiny thing you could finish before you scroll?',
    encouragement: '2 minutes. Then scroll if you want. But try first.',
  },
}

// ── Category-Specific Prompts ───────────────────────────────

const CATEGORY_PROMPTS: Record<VoiceIntentCategory, {
  acknowledged: string
  nextStep: string
}> = {
  state_declaration: {
    acknowledged: 'I hear you. Let me find the right support.',
    nextStep: 'Here\'s what I\'d suggest based on how you\'re feeling.',
  },
  request: {
    acknowledged: 'On it. Let me help.',
    nextStep: 'Here\'s what we can do right now.',
  },
  distraction: {
    acknowledged: 'Got it — distraction captured. You can let it go now.',
    nextStep: 'Ready to get back to your mission?',
  },
  brain_dump: {
    acknowledged: 'Brain dump received. Let me sort through this.',
    nextStep: 'Here\'s what I pulled out. Want to pick one to focus on?',
  },
  unknown: {
    acknowledged: 'I heard you, but I\'m not sure what you need.',
    nextStep: 'Could you tell me how you\'re feeling or what you need help with?',
  },
}

// ── Public API ──────────────────────────────────────────────

/**
 * Get the base voice mode copy strings.
 */
export function getVoiceCopy(): VoiceCopy {
  return { ...VOICE_COPY }
}

/**
 * Get state-specific prompts for a detected UserState.
 */
export function getStatePrompts(state: UserState): {
  greeting: string
  followUp: string
  encouragement: string
} {
  const prompts = STATE_PROMPTS[state]
  return prompts ? { ...prompts } : {
    greeting: 'I\'m here. What\'s going on?',
    followUp: 'Tell me what you need.',
    encouragement: 'You\'re not alone in this.',
  }
}

/**
 * Get category-specific acknowledgment and next step prompts.
 */
export function getCategoryPrompts(category: VoiceIntentCategory): {
  acknowledged: string
  nextStep: string
} {
  const prompts = CATEGORY_PROMPTS[category]
  return prompts ? { ...prompts } : { ...CATEGORY_PROMPTS.unknown }
}

/**
 * Get the full voice experience copy for a detected state + category.
 * Combines state greeting with category next step.
 */
export function getVoiceExperienceCopy(
  state: UserState | null,
  category: VoiceIntentCategory,
): {
  greeting: string
  followUp: string
  encouragement: string
  acknowledged: string
  nextStep: string
} {
  const categoryPrompts = getCategoryPrompts(category)

  if (state) {
    const statePrompts = getStatePrompts(state)
    return {
      ...statePrompts,
      ...categoryPrompts,
    }
  }

  return {
    greeting: 'I\'m listening. Tell me what\'s on your mind.',
    followUp: 'What do you need right now?',
    encouragement: 'One step at a time.',
    ...categoryPrompts,
  }
}
