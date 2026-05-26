// ══════════════════════════════════════════════════════════════
// INTENT — Anti-Drift Agent: Safety Layer
// Crisis detection, shame language filter, action blocking
// ══════════════════════════════════════════════════════════════

import type { SafetyStatus, SafetyLevel } from './types'

// ── Crisis Language Detection ───────────────────────────────

const CRISIS_PATTERNS = [
  /\bi want to (hurt|kill|harm) myself\b/i,
  /\bi'?m going to (kill|hurt|harm) myself\b/i,
  /\bi can'?t go on\b/i,
  /\bi can'?t (do this|take it) (anymore|any longer)\b/i,
  /\bi want to die\b/i,
  /\bi wish i (was|were) dead\b/i,
  /\bno (reason|point) in (living|going on|continuing)\b/i,
  /\bbetter off without me\b/i,
  /\bi'?m (a burden|worthless|hopeless|useless)\b/i,
  /\bwant to (end it|end my life|not wake up)\b/i,
  /\bself[\s-]?harm\b/i,
  /\bsuicid(e|al)\b/i,
  /\bcut(ting)? myself\b/i,
  /\boverdose\b/i,
  /\bjump(ing)? (off|from)\b/i,
]

const HIGH_DISTRESS_PATTERNS = [
  /\bi'?m (so )?(stressed|anxious|overwhelmed|exhausted|drained)\b/i,
  /\bi can'?t (handle|cope with) (this|it|everything)\b/i,
  /\bi'?m (falling apart|losing it|breaking down)\b/i,
  /\beverything is (too much|falling apart|terrible|awful)\b/i,
  /\bi'?m (not ok|not okay|not fine|struggling)\b/i,
  /\bi feel (empty|numb|hopeless|lost|trapped)\b/i,
  /\bcan'?t stop (crying|thinking|worrying)\b/i,
  /\bpanic attack\b/i,
  /\bcan'?t breathe\b/i,
  /\bheart (racing|pounding)\b/i,
]

// ── Shame Language Detection ────────────────────────────────

const SHAME_PATTERNS: { pattern: RegExp; replacement: string }[] = [
  { pattern: /\byou failed\b/gi, replacement: 'that didn\'t go as planned' },
  { pattern: /\byou'?re lazy\b/gi, replacement: 'starting is hard right now' },
  { pattern: /\bpathetic\b/gi, replacement: 'human' },
  { pattern: /\bno excuses\b/gi, replacement: 'let\'s find what works' },
  { pattern: /\byou wasted\b/gi, replacement: 'that time is gone' },
  { pattern: /\byou'?re behind\b/gi, replacement: 'you\'re here now' },
  { pattern: /\beveryone else\b/gi, replacement: 'other people' },
  { pattern: /\bfix your life\b/gi, replacement: 'take one small step' },
  { pattern: /\bget (your act together|disciplined)\b/gi, replacement: 'start with something tiny' },
  { pattern: /\byou'?re not good enough\b/gi, replacement: 'you\'re learning' },
  { pattern: /\byou'?ll never\b/gi, replacement: 'it takes time to' },
  { pattern: /\bworthless\b/gi, replacement: 'struggling right now' },
  { pattern: /\bhopeless\b/gi, replacement: 'challenging right now' },
  { pattern: /\bstop being\b/gi, replacement: 'try shifting from' },
  { pattern: /\bget over\b/gi, replacement: 'work through' },
  { pattern: /\bjust (do it|start|try)\b/gi, replacement: 'when you\'re ready, start with' },
  { pattern: /\bso (easy|simple|basic)\b/gi, replacement: 'challenging' },
  { pattern: /\byou should('?ve| have) (already )?\b/gi, replacement: 'you could' },
]

// ── Unsafe Action Patterns ──────────────────────────────────

const UNSAFE_MISSION_PATTERNS = [
  /\b(exercise|work out|run|lift) (until|to) (exhaustion|collapse|death)\b/i,
  /\b(starve|skip|don'?t eat)\b/i,
  /\b(cut|harm|hurt) (yourself|myself)\b/i,
  /\b(buy|purchase|order) .*\b(drugs|weed|pills|alcohol)\b/i,
  /\b(send|text|message) .*\b(ex|enemy|boss)\b/i,
  /\b(quit|leave|abandon) .*\b(job|school|family)\b/i,
  /\b(delete|destroy|burn) .*\b(photos|documents|files)\b/i,
]

// ── Public API ──────────────────────────────────────────────

export function classifyInput(text: string): SafetyLevel {
  if (!text || text.trim().length === 0) return 'safe'

  for (const pattern of CRISIS_PATTERNS) {
    if (pattern.test(text)) return 'crisis'
  }

  for (const pattern of HIGH_DISTRESS_PATTERNS) {
    if (pattern.test(text)) return 'caution'
  }

  return 'safe'
}

export function detectCrisisLanguage(text: string): { detected: boolean; matchedPatterns: string[] } {
  const matched: string[] = []
  for (const pattern of CRISIS_PATTERNS) {
    if (pattern.test(text)) {
      matched.push(pattern.source)
    }
  }
  return { detected: matched.length > 0, matchedPatterns: matched }
}

export function rewriteShameLanguage(text: string): { rewritten: string; wasRewritten: boolean } {
  let result = text
  let wasRewritten = false

  for (const { pattern, replacement } of SHAME_PATTERNS) {
    if (pattern.test(result)) {
      result = result.replace(pattern, replacement)
      wasRewritten = true
    }
  }

  return { rewritten: result, wasRewritten }
}

export function isMissionSafe(missionText: string): { safe: boolean; reason: string | null } {
  for (const pattern of UNSAFE_MISSION_PATTERNS) {
    if (pattern.test(missionText)) {
      return { safe: false, reason: 'Mission content may be unsafe' }
    }
  }
  return { safe: true, reason: null }
}

export function buildSafetyStatus(
  userInput: string,
  proposedActions: string[],
): SafetyStatus {
  const inputLevel = classifyInput(userInput)
  const crisis = detectCrisisLanguage(userInput)
  const { rewritten, wasRewritten } = rewriteShameLanguage(userInput)
  const blockedActions: string[] = []
  const notes: string[] = []

  // Block external actions in crisis
  if (inputLevel === 'crisis') {
    blockedActions.push(...proposedActions.filter(a =>
      a.startsWith('draft_') || a.startsWith('create_') || a.startsWith('send_')
    ))
    notes.push('Crisis language detected. External actions blocked. Support resources offered.')
  }

  // Block unsafe missions
  for (const action of proposedActions) {
    const check = isMissionSafe(action)
    if (!check.safe) {
      blockedActions.push(action)
      notes.push(`Blocked unsafe action: ${check.reason}`)
    }
  }

  if (wasRewritten) {
    notes.push('Shame language detected and rewritten.')
  }

  return {
    level: inputLevel,
    crisisDetected: crisis.detected,
    shameRewritten: wasRewritten,
    actionsBlocked: blockedActions,
    notes,
  }
}

// ── Crisis Response ─────────────────────────────────────────

export function getCrisisResponse(): {
  message: string
  resources: { label: string; action: string }[]
  shouldBlockProductivity: boolean
} {
  return {
    message: 'It sounds like you\'re going through something really difficult. You don\'t have to handle this alone. Please reach out to someone you trust or a professional who can help.',
    resources: [
      { label: 'Crisis Text Line', action: 'sms:741741' },
      { label: '988 Suicide & Crisis Lifeline', action: 'tel:988' },
      { label: 'International Association for Suicide Prevention', action: 'https://www.iasp.info/resources/Crisis_Centres/' },
    ],
    shouldBlockProductivity: true,
  }
}
