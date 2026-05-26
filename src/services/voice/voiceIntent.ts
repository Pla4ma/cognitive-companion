// ══════════════════════════════════════════════════════════════
// INTENT — Voice Intent Extraction
// Parse transcribed text into structured intents
// Maps to UserState, rescue protocol, brain dump
// ══════════════════════════════════════════════════════════════

import type { UserState } from '../../types/moment'
import type { RescueProtocolId } from '../../types/rescue'
import type {
  VoiceIntentCategory,
  VoiceIntentResult,
  VoiceIntentContext,
  VoiceIntentOptions,
} from '../../types/voice'
import { getProtocolForState } from '../../types/rescue'

// ── State Detection Patterns ────────────────────────────────

interface StatePattern {
  state: UserState
  keywords: string[]
  phrases: string[]
  weight: number
}

const STATE_PATTERNS: StatePattern[] = [
  {
    state: 'avoiding',
    keywords: ['avoiding', 'avoid', 'procrastinating', 'procrastinate', "can't start", 'putting off', 'delaying'],
    phrases: ["can't make myself", "don't want to", "keep putting it off", "been avoiding"],
    weight: 1.0,
  },
  {
    state: 'overwhelmed',
    keywords: ['overwhelmed', 'overwhelming', 'too much', 'drowning', 'swamped', 'flooded'],
    phrases: ['too much to do', "can't handle", 'everything at once', 'drowning in', 'piled up'],
    weight: 1.0,
  },
  {
    state: 'stuck',
    keywords: ['stuck', 'stalled', 'blocked', 'frozen', 'paralyzed', 'immobile'],
    phrases: ["don't know how", 'no idea what', 'feel frozen', 'stuck on this'],
    weight: 1.0,
  },
  {
    state: 'tired',
    keywords: ['tired', 'exhausted', 'drained', 'wiped', 'fatigued', 'sleepy', 'burned out', 'burnt out'],
    phrases: ['no energy', 'running on empty', 'need a nap', 'too tired', 'out of gas'],
    weight: 1.0,
  },
  {
    state: 'distracted',
    keywords: ['distracted', 'distracted', 'sidetracked', 'off track', 'pulled away'],
    phrases: ['keep getting distracted', 'can focus on', 'every little thing', 'lost focus', 'keeps pulling me'],
    weight: 0.9,
  },
  {
    state: 'anxious',
    keywords: ['anxious', 'anxiety', 'worried', 'nervous', 'panic', 'stressed', 'stress'],
    phrases: ['feeling anxious', 'stressed out', 'worrying about', 'anxious about', 'panicking'],
    weight: 1.0,
  },
  {
    state: 'scattered',
    keywords: ['scattered', 'fragmented', 'pulled', 'jumping', 'bouncing', 'pulling'],
    phrases: ['too many things', 'jumping between', 'scattered thoughts', 'all over the place', 'pulled in every direction'],
    weight: 0.9,
  },
  {
    state: 'ready',
    keywords: ['ready', 'motivated', 'energized', 'focused', 'locked in', 'game'],
    phrases: ['ready to go', 'feeling good', 'locked in', 'got this', 'let\'s do this'],
    weight: 1.0,
  },
  {
    state: 'bored',
    keywords: ['bored', 'boring', 'mind-numbing', 'tedious', 'uninteresting', 'dull'],
    phrases: ['so boring', 'hate this task', 'mind numbing', 'dreading this'],
    weight: 0.9,
  },
  {
    state: 'perfectionism',
    keywords: ['perfect', 'perfectionism', 'flawless', 'polish', 'redoing', 'rewrite'],
    phrases: ['not good enough', 'has to be perfect', "can't ship this", 'keep rewriting', 'needs to be better'],
    weight: 1.0,
  },
  {
    state: 'unclear',
    keywords: ['unclear', 'confused', 'uncertain', 'unsure', 'directionless'],
    phrases: ["don't know where to start", 'no clear direction', 'what am i doing', "what's the first step"],
    weight: 0.9,
  },
  {
    state: 'time_pressure',
    keywords: ['deadline', 'rushing', 'hurry', 'time', 'late', 'running out'],
    phrases: ['running out of time', 'deadline is', 'not enough time', 'behind schedule', 'due today'],
    weight: 1.0,
  },
  {
    state: 'low_confidence',
    keywords: ['confidence', 'doubt', 'inadequate', 'imposter', 'not good enough', 'incompetent'],
    phrases: ["i can't do this", "not smart enough", "everyone else is better", "i'll fail", "don't believe in myself"],
    weight: 1.0,
  },
  {
    state: 'shame_spiral',
    keywords: ['shame', 'ashamed', 'embarrassed', 'guilty', 'failure', 'loser'],
    phrases: ["i'm terrible", 'feel so bad', 'wasted time', "should have done", "why can't i"],
    weight: 1.0,
  },
  {
    state: 'fake_productivity',
    keywords: ['planning', 'organizing', 'researching', 'preparing', 'reading'],
    phrases: ["just planning", "still researching", "need to prepare more", "organizing my thoughts", "reading about it"],
    weight: 0.8,
  },
  {
    state: 'planning_loop',
    keywords: ['loop', 'circling', 'repeating', 'stuck planning', 'never starting'],
    phrases: ['keep planning', 'going in circles', 'just planning again', 'never actually do it'],
    weight: 0.9,
  },
  {
    state: 'doomscroll_risk',
    keywords: ['scrolling', 'phone', 'doomscroll', 'tiktok', 'instagram', 'twitter', 'reddit'],
    phrases: ['about to scroll', 'keep scrolling', 'lost in my phone', 'can\'t put phone down', 'doom scrolling'],
    weight: 0.9,
  },
]

// ── Intent Category Detection ───────────────────────────────

interface CategoryPattern {
  category: VoiceIntentCategory
  keywords: string[]
  phrases: string[]
  minConfidence: number
}

const CATEGORY_PATTERNS: CategoryPattern[] = [
  {
    category: 'state_declaration',
    keywords: ['i feel', 'feeling', 'i am', "i'm", 'i\'m feeling'],
    phrases: [
      'i feel', 'feeling overwhelmed', 'feeling stuck', "i'm avoiding",
      "i'm tired", "i'm anxious", "i'm distracted", 'feeling anxious',
      'feeling scattered', "i'm burned out", "i'm stressed",
    ],
    minConfidence: 0.6,
  },
  {
    category: 'request',
    keywords: ['help', 'please', 'can you', 'need', 'want', 'start', 'begin', 'do'],
    phrases: [
      'help me', 'can you help', 'i need to', 'i want to',
      'please start', 'help me start', 'what should i do',
      'give me something', 'i need help', 'start me off',
    ],
    minConfidence: 0.5,
  },
  {
    category: 'distraction',
    keywords: ['distracted', 'sidetracked', 'off track', 'pulled', 'thought'],
    phrases: [
      'got distracted', 'just thought of', 'reminded me',
      'off track', 'pulling my attention', 'random thought',
      'came to mind', 'realized i need to', 'almost forgot',
    ],
    minConfidence: 0.5,
  },
  {
    category: 'brain_dump',
    keywords: ['dump', 'everything', 'list', 'lots', 'bunch', 'things', 'stuff'],
    phrases: [
      'brain dump', 'everything i need', 'let me dump',
      'so many things', 'where do i start', 'the list is',
      'first i need', 'then i also', 'and also',
    ],
    minConfidence: 0.5,
  },
]

// ── Time Reference Extraction ───────────────────────────────

const TIME_PATTERNS: RegExp[] = [
  /(\d+)\s*(?:min(?:ute)?s?)/i,
  /(\d+)\s*(?:hour)s?/i,
  /(?:half)\s*(?:an?\s*)?(?:hour)/i,
  /(\d+)\s*(?:hr)s?/i,
]

function extractTimeReference(text: string): number | null {
  for (const pattern of TIME_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      if (match[0].includes('half')) return 30
      const value = parseInt(match[1]!, 10)
      if (match[0].toLowerCase().includes('hour') || match[0].toLowerCase().includes('hr')) {
        return value * 60
      }
      return value
    }
  }
  return null
}

// ── Emotion Extraction ──────────────────────────────────────

const EMOTION_KEYWORDS = [
  'happy', 'sad', 'angry', 'frustrated', 'excited', 'nervous',
  'anxious', 'stressed', 'calm', 'peaceful', 'overwhelmed',
  'confused', 'hopeful', 'grateful', 'lonely', 'content',
  'irritated', 'motivated', 'discouraged', 'relieved',
  'terrified', 'proud', 'embarrassed', 'jealous', 'guilty',
  'ashamed', 'surprised', 'disgusted', 'trustful',
]

function extractEmotions(text: string): string[] {
  const lower = text.toLowerCase()
  return EMOTION_KEYWORDS.filter(e => lower.includes(e))
}

// ── Brain Dump Item Extraction ──────────────────────────────

function extractBrainDumpItems(text: string): string[] {
  // Split on common list delimiters
  const items = text
    .split(/(?:,|;|\band\b|\.|\n|then\b|also\b|next\b)/i)
    .map(s => s.trim())
    .filter(s => s.length > 2 && s.length < 200)

  return items
}

// ── Task Mention Extraction ─────────────────────────────────

const TASK_PATTERNS = [
  /(?:need to|have to|should|must|gotta|going to)\s+(.+?)(?:\.|,|$)/i,
  /(?:work on|finish|complete|do)\s+(.+?)(?:\.|,|$)/i,
  /(?:start|begin|tackle)\s+(?:with\s+)?(.+?)(?:\.|,|$)/i,
]

function extractMentionedTask(text: string): string | null {
  for (const pattern of TASK_PATTERNS) {
    const match = text.match(pattern)
    if (match?.[1] && match[1].trim().length > 2) {
      return match[1].trim()
    }
  }
  return null
}

// ── Explicit Request Detection ──────────────────────────────

function detectExplicitRequest(text: string): boolean {
  const lower = text.toLowerCase()
  const requestIndicators = [
    'help me', 'can you', 'please', 'i need', 'i want',
    'give me', 'show me', 'tell me', 'start me', 'do something',
  ]
  return requestIndicators.some(ind => lower.includes(ind))
}

// ── Main Extraction Logic ───────────────────────────────────

function scoreStatePatterns(text: string): { state: UserState; score: number }[] {
  const lower = text.toLowerCase()
  const scores: { state: UserState; score: number }[] = []

  for (const pattern of STATE_PATTERNS) {
    let score = 0

    // Keyword matches
    for (const kw of pattern.keywords) {
      if (lower.includes(kw)) {
        score += 0.3 * pattern.weight
      }
    }

    // Phrase matches (higher signal)
    for (const phrase of pattern.phrases) {
      if (lower.includes(phrase)) {
        score += 0.5 * pattern.weight
      }
    }

    if (score > 0) {
      scores.push({ state: pattern.state, score: Math.min(score, 1.0) })
    }
  }

  return scores.sort((a, b) => b.score - a.score)
}

function scoreCategoryPatterns(text: string): { category: VoiceIntentCategory; score: number }[] {
  const lower = text.toLowerCase()
  const scores: { category: VoiceIntentCategory; score: number }[] = []

  for (const pattern of CATEGORY_PATTERNS) {
    let score = 0

    for (const kw of pattern.keywords) {
      if (lower.includes(kw)) {
        score += 0.3
      }
    }

    for (const phrase of pattern.phrases) {
      if (lower.includes(phrase)) {
        score += 0.5
      }
    }

    if (score >= pattern.minConfidence) {
      scores.push({ category: pattern.category, score: Math.min(score, 1.0) })
    }
  }

  return scores.sort((a, b) => b.score - a.score)
}

// ── Public API ──────────────────────────────────────────────

/**
 * Extract a structured intent from transcribed voice text.
 *
 * Detects:
 * - state_declaration: User declares how they feel
 * - request: User asks for help
 * - distraction: User captures a distraction thought
 * - brain_dump: User lists multiple items
 * - unknown: Couldn't determine intent
 *
 * Maps to UserState, RescueProtocol, and provides extracted context.
 */
export function extractIntentFromVoice(
  rawTranscript: string,
  options: VoiceIntentOptions = {},
): VoiceIntentResult {
  const {
    minConfidence = 0.3,
    enableStateMapping = true,
  } = options

  const text = rawTranscript.trim()

  if (text.length === 0) {
    return {
      category: 'unknown',
      state: null,
      protocol: null,
      confidence: 0,
      extractedText: '',
      rawTranscript,
      context: {
        timeReference: null,
        emotionKeywords: [],
        explicitRequest: false,
        mentionedTask: null,
        brainDumpItems: [],
      },
    }
  }

  // ── Detect Category ─────────────────────────────────────
  const categoryScores = scoreCategoryPatterns(text)
  const topCategory = categoryScores[0]
  const category: VoiceIntentCategory = topCategory
    ? topCategory.category
    : 'unknown'
  const categoryConfidence = topCategory?.score ?? 0

  // ── Detect State ────────────────────────────────────────
  let state: UserState | null = null
  let stateConfidence = 0

  if (enableStateMapping) {
    const stateScores = scoreStatePatterns(text)
    const topState = stateScores[0]
    if (topState && topState.score >= minConfidence) {
      state = topState.state
      stateConfidence = topState.score
    }
  }

  // ── Map to Protocol ─────────────────────────────────────
  let protocol: RescueProtocolId | null = null
  if (state) {
    protocol = getProtocolForState(state)
  }

  // ── Extract Context ─────────────────────────────────────
  const context: VoiceIntentContext = {
    timeReference: extractTimeReference(text),
    emotionKeywords: extractEmotions(text),
    explicitRequest: detectExplicitRequest(text),
    mentionedTask: extractMentionedTask(text),
    brainDumpItems: category === 'brain_dump' ? extractBrainDumpItems(text) : [],
  }

  // ── Brain dump special handling ─────────────────────────
  // If it looks like a brain dump with multiple items, override category
  if (context.brainDumpItems.length >= 3 && category !== 'brain_dump') {
    // Likely a brain dump even if patterns didn't catch it
  }

  // ── Combined Confidence ─────────────────────────────────
  // Weighted average of category and state confidence
  const overallConfidence = state
    ? (categoryConfidence * 0.4 + stateConfidence * 0.6)
    : categoryConfidence

  return {
    category,
    state,
    protocol,
    confidence: Math.round(overallConfidence * 100) / 100,
    extractedText: text,
    rawTranscript,
    context,
  }
}

/**
 * Quick helper: just get the UserState from voice text.
 * Returns null if no state detected above threshold.
 */
export function detectUserState(text: string): UserState | null {
  const result = extractIntentFromVoice(text, { minConfidence: 0.4 })
  return result.state
}

/**
 * Quick helper: check if the voice text is a brain dump.
 */
export function isBrainDump(text: string): boolean {
  const result = extractIntentFromVoice(text, { minConfidence: 0.3 })
  return result.category === 'brain_dump' || result.context.brainDumpItems.length >= 3
}
