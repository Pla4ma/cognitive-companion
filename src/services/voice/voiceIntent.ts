// ══════════════════════════════════════════════════════════════
// INTENT — Voice Intent Extraction
// Parses voice transcripts into structured intents with state detection
// ══════════════════════════════════════════════════════════════

import type { UserState } from '../../types/moment'
import type { RescueProtocolId } from '../../types/rescue'
import type { VoiceIntentResult, VoiceIntentCategory, VoiceIntentOptions } from '../../types/voice'

// ── State Keywords & Phrases ───────────────────────────────

interface StateSignal {
  state: UserState
  keywords: string[]
  phrases: string[]
  protocol: RescueProtocolId
}

const STATE_SIGNALS: StateSignal[] = [
  {
    state: 'avoiding',
    keywords: ['avoiding', 'procrastinating', 'putting off', 'can\'t start', 'won\'t start'],
    phrases: ['can\'t make myself start', 'been avoiding this', 'keep avoiding', 'every time I try to start', 'just can\'t begin'],
    protocol: 'two_minute_ignition',
  },
  {
    state: 'overwhelmed',
    keywords: ['overwhelmed', 'too much', 'overloaded', 'swamped', 'drowning'],
    phrases: ['too much to do', 'too much to handle', 'don\'t know where to begin', 'everything at once'],
    protocol: 'shrink_the_beast',
  },
  {
    state: 'stuck',
    keywords: ['stuck', 'frozen', 'paralyzed', 'halted'],
    phrases: ['don\'t know how to proceed', 'can\'t move forward', 'no idea what to do next', 'stuck on this'],
    protocol: 'body_double_start',
  },
  {
    state: 'tired',
    keywords: ['tired', 'exhausted', 'drained', 'fatigued', 'worn out', 'no energy', 'spent'],
    phrases: ['no energy left', 'so exhausted', 'completely drained', 'running on empty'],
    protocol: 'maintenance_spark',
  },
  {
    state: 'distracted',
    keywords: ['distracted', 'sidetracked', 'pulled away', 'off track'],
    phrases: ['keep getting distracted', 'can\'t focus', 'keeps pulling me away', 'random thoughts'],
    protocol: 'lock_the_door',
  },
  {
    state: 'anxious',
    keywords: ['anxious', 'stressed', 'worried', 'nervous', 'panicking', 'tense'],
    phrases: ['feeling anxious', 'stressed about', 'worried about', 'can\'t stop worrying'],
    protocol: 'pressure_valve',
  },
  {
    state: 'scattered',
    keywords: ['scattered', 'unfocused', 'fragmented', 'all over the place'],
    phrases: ['jumping between', 'too many things', 'all over the place', 'can\'t settle on one thing'],
    protocol: 'clear_the_fog',
  },
  {
    state: 'ready',
    keywords: ['ready', 'motivated', 'energized', 'locked in', 'pumped'],
    phrases: ['feeling ready', 'ready to go', 'locked in', 'feeling motivated'],
    protocol: 'two_minute_ignition',
  },
  {
    state: 'bored',
    keywords: ['bored', 'tedious', 'mind-numbing', 'dull', 'monotonous'],
    phrases: ['so boring', 'tedious task', 'mind-numbing', 'hate doing this'],
    protocol: 'doomscroll_intercept',
  },
  {
    state: 'perfectionism',
    keywords: ['perfect', 'perfectionism', 'not good enough', 'rewrite', 'redo'],
    phrases: ['has to be perfect', 'not good enough yet', 'keep rewriting', 'can\'t ship this'],
    protocol: 'ugly_first_move',
  },
  {
    state: 'unclear',
    keywords: ['confused', 'unclear', 'lost', 'bewildered'],
    phrases: ['don\'t know where to start', 'no idea what to do', 'where do I begin', 'confused about'],
    protocol: 'clear_the_fog',
  },
  {
    state: 'time_pressure',
    keywords: ['deadline', 'running out of time', 'no time', 'late', 'overdue'],
    phrases: ['deadline is today', 'running out of time', 'no time left', 'due soon', 'due today'],
    protocol: 'pressure_valve',
  },
  {
    state: 'low_confidence',
    keywords: ['can\'t do this', 'not smart enough', 'not good enough', 'incapable', 'incompetent'],
    phrases: ['i can\'t do this', 'not smart enough', 'i\'m not capable', 'don\'t think i can'],
    protocol: 'comeback_seed',
  },
  {
    state: 'shame_spiral',
    keywords: ['failure', 'ashamed', 'shame', 'pathetic', 'worthless', 'useless'],
    phrases: ['such a failure', 'feel so ashamed', 'so pathetic', 'hate myself for'],
    protocol: 'comeback_seed',
  },
  {
    state: 'doomscroll_risk',
    keywords: ['scroll', 'tiktok', 'instagram', 'phone', 'social media', 'doomscroll'],
    phrases: ['about to scroll', 'losing myself in my phone', 'keep scrolling', 'keep losing time on phone'],
    protocol: 'doomscroll_intercept',
  },
  {
    state: 'planning_loop',
    keywords: ['planning', 'going in circles', 'loop', 'circling'],
    phrases: ['planning but never do', 'keep planning', 'going in circles', 'never actually do it', 'planning but never executing'],
    protocol: 'planning_loop_breaker',
  },
  {
    state: 'fake_productivity',
    keywords: ['researching', 'organizing', 'preparing', 'planning instead of doing'],
    phrases: ['still researching', 'organizing my thoughts', 'just planning', 'preparing to start'],
    protocol: 'planning_loop_breaker',
  },
]

// ── Category Detection ─────────────────────────────────────

const BRAIN_DUMP_SIGNALS = ['brain dump', 'braindump', 'first i need', 'then i need', 'also need to', 'and then']
const REQUEST_SIGNALS = ['help me', 'i need', 'can you', 'please help', 'help me start', 'i need to work']
const DISTRACTION_SIGNALS = ['got distracted', 'random thought', 'just thought of', 'came to mind', 'popped into']
const STATE_DECLARATION_SIGNALS = ['i feel', 'i\'m feeling', 'i am feeling', 'i\'m so', 'i am so', 'i\'m really', 'i\'ve been']

function detectCategory(text: string): VoiceIntentCategory {
  const lower = text.toLowerCase().trim()

  if (!lower) return 'unknown'

  // Check brain dump first (multiple items with sequencing words)
  if (BRAIN_DUMP_SIGNALS.some(s => lower.includes(s)) && (lower.includes('then') || lower.includes('also') || lower.includes(','))) {
    return 'brain_dump'
  }

  // Check request
  if (REQUEST_SIGNALS.some(s => lower.includes(s))) {
    return 'request'
  }

  // Check distraction
  if (DISTRACTION_SIGNALS.some(s => lower.includes(s))) {
    return 'distraction'
  }

  // Check state declaration
  if (STATE_DECLARATION_SIGNALS.some(s => lower.includes(s))) {
    return 'state_declaration'
  }

  // If we detected a state keyword, it's a state declaration
  for (const signal of STATE_SIGNALS) {
    if (signal.keywords.some(k => lower.includes(k))) {
      return 'state_declaration'
    }
  }

  return 'unknown'
}

// ── State Detection ────────────────────────────────────────

function detectState(text: string): { state: UserState | null; confidence: number } {
  const lower = text.toLowerCase().trim()
  if (!lower) return { state: null, confidence: 0 }

  let bestState: UserState | null = null
  let bestConfidence = 0

  for (const signal of STATE_SIGNALS) {
    // Check phrases first (higher confidence)
    for (const phrase of signal.phrases) {
      if (lower.includes(phrase)) {
        const confidence = 0.85
        if (confidence > bestConfidence) {
          bestState = signal.state
          bestConfidence = confidence
        }
      }
    }

    // Check keywords (lower confidence)
    for (const keyword of signal.keywords) {
      if (lower.includes(keyword)) {
        const confidence = 0.6
        if (confidence > bestConfidence) {
          bestState = signal.state
          bestConfidence = confidence
        }
      }
    }
  }

  return { state: bestState, confidence: bestConfidence }
}

// ── Context Extraction ─────────────────────────────────────

const EMOTION_KEYWORDS = [
  'anxious', 'stressed', 'worried', 'frustrated', 'angry', 'sad', 'happy',
  'excited', 'nervous', 'scared', 'overwhelmed', 'exhausted', 'hopeful',
  'grateful', 'ashamed', 'embarrassed', 'lonely', 'confused', 'calm',
]

function extractTimeReference(text: string): number | null {
  const lower = text.toLowerCase()

  // "X hours" pattern
  const hourMatch = lower.match(/(\d+)\s*hours?/)
  if (hourMatch) return parseInt(hourMatch[1], 10) * 60

  // "X minutes" pattern
  const minuteMatch = lower.match(/(\d+)\s*minutes?/)
  if (minuteMatch) return parseInt(minuteMatch[1], 10)

  // "half hour" / "half an hour"
  if (lower.includes('half hour') || lower.includes('half an hour')) return 30

  return null
}

function extractEmotionKeywords(text: string): string[] {
  const lower = text.toLowerCase()
  return EMOTION_KEYWORDS.filter(k => lower.includes(k))
}

function detectExplicitRequest(text: string): boolean {
  const lower = text.toLowerCase()
  return /\b(help\s+me|can\s+you|please|I\s+need\s+you|i\s+want\s+you\s+to)\b/.test(lower)
}

function extractMentionedTask(text: string): string | null {
  const lower = text.toLowerCase()

  // "I need to X" pattern
  const needToMatch = lower.match(/(?:i\s+need\s+to|i\s+have\s+to|i\s+must|i\s+should)\s+(.+?)(?:\.|$|,)/)
  if (needToMatch) return needToMatch[1].trim()

  // "finish my X" pattern
  const finishMatch = lower.match(/finish\s+(?:my\s+)?(.+?)(?:\.|$|,)/)
  if (finishMatch) return finishMatch[1].trim()

  // "work on X" pattern
  const workMatch = lower.match(/work\s+on\s+(?:my\s+)?(.+?)(?:\.|$|,)/)
  if (workMatch) return workMatch[1].trim()

  return null
}

function extractBrainDumpItems(text: string): string[] {
  const lower = text.toLowerCase()

  if (!BRAIN_DUMP_SIGNALS.some(s => lower.includes(s))) return []

  // Split by common delimiters
  const items = text
    .split(/(?:,|\bthen\b|\band\s+also\b|\balso\b|\band\b)/i)
    .map(s => s.trim())
    .filter(s => s.length > 3)

  return items
}

// ── Public API ─────────────────────────────────────────────

export function extractIntentFromVoice(
  text: string,
  options?: VoiceIntentOptions
): VoiceIntentResult {
  const trimmed = text.trim()

  if (!trimmed) {
    return {
      category: 'unknown',
      state: null,
      protocol: null,
      confidence: 0,
      extractedText: '',
      rawTranscript: text,
      context: {
        timeReference: null,
        emotionKeywords: [],
        explicitRequest: false,
        mentionedTask: null,
        brainDumpItems: [],
      },
    }
  }

  const { state, confidence } = detectState(trimmed)
  const category = detectCategory(trimmed)
  const minConfidence = options?.minConfidence ?? 0

  // If confidence is below threshold, null out the state
  const effectiveState = confidence >= minConfidence ? state : null

  // Find the protocol for the detected state
  let protocol: RescueProtocolId | null = null
  if (effectiveState) {
    const signal = STATE_SIGNALS.find(s => s.state === effectiveState)
    protocol = signal?.protocol ?? null
  }

  return {
    category,
    state: effectiveState,
    protocol,
    confidence,
    extractedText: trimmed,
    rawTranscript: text,
    context: {
      timeReference: extractTimeReference(trimmed),
      emotionKeywords: extractEmotionKeywords(trimmed),
      explicitRequest: detectExplicitRequest(trimmed),
      mentionedTask: extractMentionedTask(trimmed),
      brainDumpItems: extractBrainDumpItems(trimmed),
    },
  }
}

export function detectUserState(text: string): UserState | null {
  const trimmed = text.trim()
  if (!trimmed || trimmed.length < 3) return null

  const { state, confidence } = detectState(trimmed)
  // Only return state if confidence is reasonable
  return confidence >= 0.5 ? state : null
}

export function isBrainDump(text: string): boolean {
  const lower = text.toLowerCase().trim()
  return BRAIN_DUMP_SIGNALS.some(s => lower.includes(s)) &&
    (lower.includes('then') || lower.includes('also') || lower.includes(',') || lower.split(/\s+/).length > 10)
}
