// ══════════════════════════════════════════════════════════════
// INTENT — Safety Engine
// Crisis detection, shame language filter, content classification,
// safety boundaries, and escalation routing.
//
// This is non-negotiable for any 2026 AI app that deals with
// emotional states, avoidance patterns, and personal data.
// ══════════════════════════════════════════════════════════════

import { UserState, PushStyle } from '../types'

// ── Crisis Detection ───────────────────────────────────────

export type CrisisLevel = 'none' | 'mild' | 'moderate' | 'severe'

export interface CrisisAssessment {
  level: CrisisLevel
  detectedSignals: string[]
  recommendedAction: string
  shouldEscalate: boolean
  escalationTarget: 'self_help' | 'peer_support' | 'professional' | 'emergency'
}

// Keywords and patterns that may indicate crisis
const CRISIS_PATTERNS: { pattern: RegExp; level: CrisisLevel; signal: string }[] = [
  { pattern: /\b(kill myself|end it all|suicide|suicidal)\b/i, level: 'severe', signal: 'suicidal_ideation' },
  { pattern: /\b(hurt myself|self.?harm|cutting|burning myself)\b/i, level: 'severe', signal: 'self_harm' },
  { pattern: /\b(want to die|better off dead|no reason to live)\b/i, level: 'severe', signal: 'death_wish' },
  { pattern: /\b(can.?t go on|give up|no hope|hopeless|worthless)\b/i, level: 'moderate', signal: 'hopelessness' },
  { pattern: /\b(panic attack|can.?t breathe|heart racing|losing control)\b/i, level: 'moderate', signal: 'panic' },
  { pattern: /\b(breakdown|falling apart|can.?t cope|overwhelmed)\b/i, level: 'mild', signal: 'overwhelm' },
  { pattern: /\b(numb|empty|disconnected|not real|derealiz)\b/i, level: 'mild', signal: 'dissociation' },
  { pattern: /\b(can.?t sleep|no appetite|eating too much|exhausted all the time)\b/i, level: 'mild', signal: 'physical_symptoms' },
  { pattern: /\b(wouldn.?t care if i disappeared|nobody would notice)\b/i, level: 'moderate', signal: 'isolation' },
  { pattern: /\b(addicted|can.?t stop drinking|using again|relapsed)\b/i, level: 'moderate', signal: 'substance_use' },
]

// Context-aware crisis detection beyond word matching
const CRISIS_CONTEXT_SIGNALS: { check: (context: UserContext) => boolean; level: CrisisLevel; signal: string }[] = [
  {
    check: (ctx) => ctx.consecutiveBadDays >= 7 && ctx.socialInteractionDeclining,
    level: 'moderate',
    signal: 'prolonged_decline'
  },
  {
    check: (ctx) => ctx.sleepQuality === 'poor' && ctx.energyLevel === 'depleted' && ctx.moodTrend === 'declining',
    level: 'mild',
    signal: 'physical_decline'
  },
  {
    check: (ctx) => ctx.sessionAbandonRate > 0.8 && ctx.daysSinceLastSuccess > 14,
    level: 'moderate',
    signal: 'engagement_collapse'
  },
  {
    check: (ctx) => ctx.selfTalkNegativeStreak >= 5,
    level: 'moderate',
    signal: 'negative_self_talk_pattern'
  },
]

interface UserContext {
  consecutiveBadDays: number
  socialInteractionDeclining: boolean
  sleepQuality: 'good' | 'fair' | 'poor'
  energyLevel: 'high' | 'medium' | 'low' | 'depleted'
  moodTrend: 'improving' | 'stable' | 'declining'
  sessionAbandonRate: number
  daysSinceLastSuccess: number
  selfTalkNegativeStreak: number
}

export function assessCrisis(input: string, context?: UserContext): CrisisAssessment {
  const detectedSignals: string[] = []
  let maxLevel: CrisisLevel = 'none'

  // Pattern matching
  for (const { pattern, level, signal } of CRISIS_PATTERNS) {
    if (pattern.test(input)) {
      detectedSignals.push(signal)
      if (levelValue(level) > levelValue(maxLevel)) {
        maxLevel = level
      }
    }
  }

  // Context-aware detection
  if (context) {
    for (const { check, level, signal } of CRISIS_CONTEXT_SIGNALS) {
      if (check(context)) {
        detectedSignals.push(signal)
        if (levelValue(level) > levelValue(maxLevel)) {
          maxLevel = level
        }
      }
    }
  }

  return {
    level: maxLevel,
    detectedSignals,
    recommendedAction: getCrisisAction(maxLevel),
    shouldEscalate: maxLevel === 'severe' || maxLevel === 'moderate',
    escalationTarget: getCrisisEscalation(maxLevel),
  }
}

function levelValue(level: CrisisLevel): number {
  return { none: 0, mild: 1, moderate: 2, severe: 3 }[level]
}

function getCrisisAction(level: CrisisLevel): string {
  switch (level) {
    case 'severe':
      return 'Your safety matters most. Please reach out to a crisis counselor — they are trained to help and available 24/7. You can also call or text 988 (Suicide & Crisis Lifeline).'
    case 'moderate':
      return 'It sounds like you are going through a really hard time. Talking to someone you trust or a professional can help. This app is here for the small steps, but you deserve real human support too.'
    case 'mild':
      return 'Noticing these feelings is important. A small grounding exercise or reaching out to a friend might help. You are not alone in this.'
    default:
      return 'All clear.'
  }
}

function getCrisisEscalation(level: CrisisLevel): CrisisAssessment['escalationTarget'] {
  switch (level) {
    case 'severe': return 'emergency'
    case 'moderate': return 'professional'
    case 'mild': return 'peer_support'
    default: return 'self_help'
  }
}

// ── Shame Language Filter ──────────────────────────────────

// Words and patterns that are counterproductive in a motivational context
const SHAME_PATTERNS: { pattern: RegExp; replacement: string; reason: string }[] = [
  { pattern: /\b(you'?re (so )?lazy)\b/i, replacement: 'you are having a hard time getting started', reason: 'labeling' },
  { pattern: /\b(just (do it|get over it|try harder))\b/i, replacement: 'every small step counts', reason: 'minimizing' },
  { pattern: /\b(everyone else can)\b/i, replacement: 'you are on your own path', reason: 'comparison' },
  { pattern: /\b(you should (have|be|know))\b/i, replacement: 'it is okay to be where you are', reason: 'should_statements' },
  { pattern: /\b(what'?s wrong with you)\b/i, replacement: 'you are facing a real challenge', reason: 'blame' },
  { pattern: /\b(you'?re (a )?(failure|disappointment|loser))\b/i, replacement: 'you are learning and growing', reason: 'identity_attack' },
  { pattern: /\b(you always (fail|quit|give up|mess up))\b/i, replacement: 'you have had setbacks, and that is normal', reason: 'overgeneralization' },
  { pattern: /\b(you never (finish|follow through|succeed))\b/i, replacement: 'you are still building your pattern', reason: 'overgeneralization' },
  { pattern: /\b(pathetic|useless|worthless|stupid)\b/i, replacement: 'you matter (filtered from input)', reason: 'profanity_shame' },
  { pattern: /\b(just (be |get )?disciplined)\b/i, replacement: 'building systems that work for your brain', reason: 'neurotypical_assumption' },
]

export interface ShameFilterResult {
  original: string
  filtered: string
  hadShameLanguage: boolean
  detectedPatterns: string[]
  wasModified: boolean
}

export function filterShameLanguage(input: string): ShameFilterResult {
  let filtered = input
  const detectedPatterns: string[] = []
  let wasModified = false

  for (const { pattern, replacement, reason } of SHAME_PATTERNS) {
    if (pattern.test(filtered)) {
      detectedPatterns.push(reason)
      filtered = filtered.replace(pattern, replacement)
      wasModified = true
    }
  }

  return {
    original: input,
    filtered,
    hadShameLanguage: detectedPatterns.length > 0,
    detectedPatterns,
    wasModified,
  }
}

// ── Content Classification ──────────────────────────────────

export type ContentCategory =
  | 'safe'
  | 'distraction_report'
  | 'emotional_distress'
  | 'crisis'
  | 'spam'
  | 'off_topic'
  | 'self_reflection'
  | 'goal_setting'

export interface ContentClassification {
  category: ContentCategory
  confidence: number
  userStates: UserState[]
  shouldStore: boolean
  shouldAnalyze: boolean
  privacyLevel: 'public' | 'private' | 'sensitive' | 'clinical'
}

export function classifyContent(input: string, currentState?: UserState): ContentClassification {
  const lower = input.toLowerCase().trim()

  // Crisis check first (highest priority)
  const crisis = assessCrisis(input)
  if (crisis.level === 'severe' || crisis.level === 'moderate') {
    return {
      category: 'crisis',
      confidence: 0.9,
      userStates: ['anxious', 'avoiding'],
      shouldStore: false, // Don't store crisis data long-term
      shouldAnalyze: false, // Don't feed into pattern analysis
      privacyLevel: 'clinical',
    }
  }

  // Distraction report
  if (/\b(distraction|procrastinat|scrolling|phone|social media|youtube|tiktok|instagram)\b/i.test(lower)) {
    return {
      category: 'distraction_report',
      confidence: 0.85,
      userStates: currentState ? [currentState] : ['distracted'],
      shouldStore: true,
      shouldAnalyze: true,
      privacyLevel: 'private',
    }
  }

  // Goal setting
  if (/\b(goal|want to|plan to|going to|will |intent|mission|project|start|begin)\b/i.test(lower)) {
    return {
      category: 'goal_setting',
      confidence: 0.8,
      userStates: currentState ? [currentState] : ['ready'],
      shouldStore: true,
      shouldAnalyze: true,
      privacyLevel: 'private',
    }
  }

  // Self reflection
  if (/\b(feel|feeling|think|thought|realize|noticed|pattern|habit|always|never|why do i|i wonder)\b/i.test(lower)) {
    const states: UserState[] = ['scattered', 'stuck']
    if (/\b(sad|down|depressed|anxious|worried)\b/i.test(lower)) states.push('anxious')
    if (/\b(tired|exhausted|drained)\b/i.test(lower)) states.push('tired')
    return {
      category: 'self_reflection',
      confidence: 0.75,
      userStates: currentState ? [currentState, ...states] : states,
      shouldStore: true,
      shouldAnalyze: true,
      privacyLevel: 'sensitive',
    }
  }

  // Emotional distress (mild)
  if (/\b(stressed|overwhelmed|anxious|worried|scared|afraid|nervous|frustrated|angry|hurt|sad)\b/i.test(lower)) {
    return {
      category: 'emotional_distress',
      confidence: 0.8,
      userStates: ['anxious', 'overwhelmed'],
      shouldStore: true,
      shouldAnalyze: true,
      privacyLevel: 'sensitive',
    }
  }

  // Spam / off-topic
  if (lower.length < 3 || /^[^a-z]*$/.test(lower)) {
    return {
      category: 'spam',
      confidence: 0.95,
      userStates: [],
      shouldStore: false,
      shouldAnalyze: false,
      privacyLevel: 'public',
    }
  }

  return {
    category: 'safe',
    confidence: 0.5,
    userStates: currentState ? [currentState] : [],
    shouldStore: true,
    shouldAnalyze: true,
    privacyLevel: 'private',
  }
}

// ── Safety Boundaries ───────────────────────────────────────

export interface SafetyBoundary {
  id: string
  description: string
  enforcement: 'block' | 'warn' | 'log' | 'escalate'
  action: (input: string) => { allowed: boolean; reason: string; modifiedInput?: string }
}

export const SAFETY_BOUNDARIES: SafetyBoundary[] = [
  {
    id: 'crisis_intervention',
    description: 'Detect and respond to crisis signals',
    enforcement: 'escalate',
    action: (input) => {
      const assessment = assessCrisis(input)
      if (assessment.level === 'severe') {
        return {
          allowed: false,
          reason: assessment.recommendedAction,
        }
      }
      return { allowed: true, reason: '' }
    },
  },
  {
    id: 'shame_filter',
    description: 'Filter shame-based language from AI responses',
    enforcement: 'warn',
    action: (input) => {
      const result = filterShameLanguage(input)
      if (result.wasModified) {
        return {
          allowed: true,
          reason: `Shame language filtered: ${result.detectedPatterns.join(', ')}`,
          modifiedInput: result.filtered,
        }
      }
      return { allowed: true, reason: '' }
    },
  },
  {
    id: 'medical_advice_boundary',
    description: 'Prevent the app from giving medical/psychiatric advice',
    enforcement: 'block',
    action: (input) => {
      if (/\b(diagnos|prescri|medication|dosage|antidepressant|therapy session|clinical treatment)\b/i.test(input)) {
        return {
          allowed: false,
          reason: 'This app is not a medical professional. For diagnosis or treatment, please consult a healthcare provider.',
        }
      }
      return { allowed: true, reason: '' }
    },
  },
  {
    id: 'data_minimization',
    description: 'Minimize data collection for sensitive content',
    enforcement: 'log',
    action: (input) => {
      const classification = classifyContent(input)
      if (classification.privacyLevel === 'clinical') {
        return {
          allowed: true,
          reason: 'Clinical-level content detected. Data will not be stored long-term or used for pattern analysis.',
        }
      }
      return { allowed: true, reason: '' }
    },
  },
]

export function checkSafetyBoundaries(input: string): {
  safe: boolean
  violations: { boundary: string; reason: string; modifiedInput?: string }[]
} {
  const violations: { boundary: string; reason: string; modifiedInput?: string }[] = []

  for (const boundary of SAFETY_BOUNDARIES) {
    const result = boundary.action(input)
    if (!result.allowed || result.reason) {
      violations.push({
        boundary: boundary.id,
        reason: result.reason,
        modifiedInput: result.modifiedInput,
        allowed: result.allowed,
      })
    }
    if (!result.allowed) break // Stop at first blocking boundary
  }

  return {
    safe: !violations.some(v => v.allowed === false || (v.reason && !v.modifiedInput)),
    violations,
  }
}

// ── Push Style Safety Adapter ───────────────────────────────
// Ensures that even "firm" and "emergency" push styles
// never cross into shame, blame, or harm.

const UNSAFE_PUSH_TRANSFORMS: Record<PushStyle, RegExp[]> = {
  gentle: [], // Gentle is always safe
  firm: [
    /\b(you have no excuse)\b/i,
    /\b(stop being weak)\b/i,
    /\b(grow up)\b/i,
  ],
  emergency: [
    /\b(if you (don'?t|won'?t) do this (now|immediately))\b/i,
    /\b(you'?re running out of time)\b/i,
    /\b(this is your last chance)\b/i,
  ],
}

export function isPushStyleSafe(message: string, style: PushStyle): boolean {
  const patterns = UNSAFE_PUSH_TRANSFORMS[style] || []
  return !patterns.some(p => p.test(message))
}

export function sanitizePushMessage(message: string, style: PushStyle): string {
  let sanitized = message
  const patterns = UNSAFE_PUSH_TRANSFORMS[style] || []
  for (const pattern of patterns) {
    sanitized = sanitized.replace(pattern, '')
  }
  return sanitized.trim()
}
