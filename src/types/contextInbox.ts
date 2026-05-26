// ══════════════════════════════════════════════════════════════
// INTENT — Context Inbox 2.0 Types
// Enhanced context ingestion and processing
// ══════════════════════════════════════════════════════════════

import type { ContextSource, ContextSensitivity, ContextRetentionPolicy, ExtractedObligation, ContextCapsule } from './contextCapsule'

// ── Context Inbox State ────────────────────────────────────

export type ContextInboxFilter = 'all' | 'unprocessed' | 'has_mission' | 'sensitive' | 'deadline_soon'

export interface ContextInboxState {
  capsules: ContextCapsule[]
  filter: ContextInboxFilter
  selectedCapsuleId: string | null
  isProcessing: boolean
}

// ── Extraction Result ──────────────────────────────────────

export interface ExtractionResult {
  obligations: ExtractedObligation[]
  deadlines: DeadlineExtraction[]
  people: string[]
  blockers: string[]
  possibleMissions: PossibleMission[]
  questions: string[]
  sensitivity: ContextSensitivity
  category: ContextCategory
  confidence: number // 0-1
}

export interface DeadlineExtraction {
  text: string
  date: string | null
  urgency: 'low' | 'medium' | 'high'
  relatedObligation: string | null
}

export interface PossibleMission {
  title: string
  exactAction: string
  estimatedMinutes: number
  priority: number // 1-5
  sourceObligation: string | null
}

export type ContextCategory =
  | 'school'
  | 'work'
  | 'life_admin'
  | 'cleaning'
  | 'creative'
  | 'health'
  | 'social'
  | 'finance'
  | 'mixed'
  | 'unknown'

// ── Context Processing Pipeline ────────────────────────────

export interface ContextProcessingOptions {
  extractDeterministic: boolean
  useAIEnhancement: boolean
  classifySensitivity: boolean
  deleteRawAfterProcessing: boolean
  createMissionAutomatically: boolean
}

export const DEFAULT_PROCESSING_OPTIONS: ContextProcessingOptions = {
  extractDeterministic: true,
  useAIEnhancement: false,
  classifySensitivity: true,
  deleteRawAfterProcessing: false,
  createMissionAutomatically: false,
}

// ── Context Capture Input ──────────────────────────────────

export interface ContextCaptureInput {
  text: string
  source: ContextSource
  options?: Partial<ContextProcessingOptions>
}

// ── Deterministic Extraction Patterns ──────────────────────

export const DEADLINE_PATTERNS = [
  /\b(?:due|deadline|submit|turn in|by)\s+(?:on\s+)?(\w+day|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|\w+\s+\d{1,2}(?:st|nd|rd|th)?)/gi,
  /\b(?:by|before|until)\s+(?:the\s+)?(\d{1,2}(?:st|nd|rd|th)?\s+of\s+\w+|\w+\s+\d{1,2}(?:st|nd|rd|th)?)/gi,
  /\b(tomorrow|today|next\s+week|this\s+friday|this\s+monday|end\s+of\s+(?:week|day|month))/gi,
  /\b(\d{1,2}:\d{2}\s*(?:am|pm)?)/gi,
]

export const ACTION_VERBS = [
  'submit', 'send', 'email', 'call', 'write', 'read', 'finish', 'complete',
  'review', 'study', 'clean', 'organize', 'fix', 'update', 'create', 'build',
  'prepare', 'schedule', 'book', 'pay', 'buy', 'return', 'register', 'apply',
  'draft', 'proof', 'print', 'scan', 'upload', 'download', 'install',
]

export const BLOCKER_PATTERNS = [
  /\b(?:i(?:'m| am)? )?(?:avoiding|procrastinating|stuck on|can'?t start|don'?t know how|overwhelmed by|scared of|worried about)/gi,
  /\b(?:too (?:big|hard|complex|much|many)|not sure where to start|no idea)/gi,
  /\b(?:keeps? (?:getting|getting put off|getting delayed))/gi,
]

export const PEOPLE_PATTERNS = [
  /\b(?:professor|teacher|boss|manager|client|doctor|therapist|counselor|advisor|instructor|supervisor)\s+(\w+)/gi,
  /\b(?:email|call|text|message|ask|tell|meet with)\s+(\w+)/gi,
]

// ── Sensitivity Detection ──────────────────────────────────

export const SENSITIVE_PATTERNS = [
  /\b(?:password|ssn|social security|credit card|bank|routing)\b/i,
  /\b(?:diagnosis|medication|therapy|mental health|anxiety|depression)\b/i,
  /\b(?:salary|income|debt|loan|financial)\b/i,
  /\b(?:legal|lawyer|court|lawsuit|arrest)\b/i,
]

export function detectSensitivity(text: string): ContextSensitivity {
  const lower = text.toLowerCase()
  if (SENSITIVE_PATTERNS.some((p) => p.test(lower))) return 'restricted'
  if (/(?:doctor|hospital|family|relationship|personal)/i.test(lower)) return 'sensitive'
  if (/(?:work|school|assignment|project)/i.test(lower)) return 'personal'
  return 'public'
}
