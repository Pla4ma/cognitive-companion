// ══════════════════════════════════════════════════════════════
// INTENT — Context Extractor
// Extracts obligations, deadlines, people, and urgency from text
// ══════════════════════════════════════════════════════════════

import type { ContextCapsule, ContextSource, ContextSensitivity, ExtractedObligation } from '../../types/contextCapsule'

// ── Extraction Result ──────────────────────────────────────

export interface ExtractionResult {
  deadlines: string[]
  people: string[]
  obligations: ExtractedObligation[]
  crisisDetected: boolean
  sensitivity: ContextSensitivity
  rawText: string
}

// ── Patterns ───────────────────────────────────────────────

const DEADLINE_PATTERNS = [
  /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
  /\b(today|tomorrow|next week|this week|next month)\b/gi,
  /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/gi,
  /\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/g,
  /\bdue\s+\w+/gi,
  /\bdeadline[:\s]+[^\n]*/gi,
  /\bby\s+(the\s+)?end\s+of\b/gi,
  /\basap\b/gi,
]

const PERSON_PATTERNS = [
  /\b(Professor|Prof\.?|Dr\.?|Mr\.?|Mrs\.?|Ms\.?)\s+[A-Z][a-z]+/g,
  /\b[A-Z][a-z]+\s+(said|told|asked|mentioned|wants|needs)\b/g,
  /\bmy\s+(boss|manager|teacher|professor|advisor|counselor|therapist|supervisor)\b/gi,
]

const CRISIS_PATTERNS = [
  /\bcan'?t\s+(go\s+on|take\s+it|do\s+this\s+anymore|keep\s+going)\b/gi,
  /\b(end\s+it|give\s+up\s+on\s+life|want\s+to\s+die|kill\s+myself)\b/gi,
  /\bno\s+point\s+(in\s+)?living\b/gi,
  /\bi\s+just\s+want\s+(it\s+to\s+)?(stop|end)\b/gi,
]

const SENSITIVE_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN
  /\b\d{16}\b/, // credit card
  /\b(password|ssn|social\s+security|credit\s+card)\b/gi,
]

const SCHOOL_KEYWORDS = ['essay', 'homework', 'exam', 'test', 'class', 'school', 'professor', 'teacher', 'assignment', 'study', 'grade', 'university', 'college', 'lecture', 'thesis', 'paper', 'biology', 'english', 'math', 'chemistry', 'physics', 'history']
const WORK_KEYWORDS = ['presentation', 'meeting', 'client', 'boss', 'deadline', 'project', 'report', 'email', 'colleague', 'office', 'work', 'proposal', 'stakeholder', 'quarterly', 'review', 'team']
const CLEANING_KEYWORDS = ['clean', 'tidy', 'organize', 'laundry', 'dishes', 'room', 'apartment', 'house']
const ADMIN_KEYWORDS = ['form', 'application', 'insurance', 'tax', 'appointment', 'registration', 'document']
const CREATIVE_KEYWORDS = ['paint', 'write', 'music', 'song', 'draw', 'design', 'create', 'art']
const HEALTH_KEYWORDS = ['doctor', 'gym', 'exercise', 'medication', 'therapy', 'health', 'appointment']
const SOCIAL_KEYWORDS = ['call', 'text', 'friend', 'family', 'birthday', 'party', 'visit']
const FINANCE_KEYWORDS = ['bill', 'payment', 'budget', 'bank', 'rent', 'money']

function detectCategory(text: string): ExtractedObligation['category'] {
  const lower = text.toLowerCase()
  if (SCHOOL_KEYWORDS.some(k => lower.includes(k))) return 'school'
  if (WORK_KEYWORDS.some(k => lower.includes(k))) return 'work'
  if (CLEANING_KEYWORDS.some(k => lower.includes(k))) return 'cleaning'
  if (ADMIN_KEYWORDS.some(k => lower.includes(k))) return 'admin'
  if (CREATIVE_KEYWORDS.some(k => lower.includes(k))) return 'creative'
  if (HEALTH_KEYWORDS.some(k => lower.includes(k))) return 'health'
  if (SOCIAL_KEYWORDS.some(k => lower.includes(k))) return 'social'
  if (FINANCE_KEYWORDS.some(k => lower.includes(k))) return 'finance'
  return 'unknown'
}

function detectUrgency(text: string): ExtractedObligation['urgency'] {
  const lower = text.toLowerCase()
  if (/\b(asap|urgent|immediately|right now|today|tonight|emergency)\b/.test(lower)) return 'high'
  if (/\b(soon|this week|tomorrow|important)\b/.test(lower)) return 'medium'
  return 'low'
}

function extractPeople(text: string): string[] {
  const people: string[] = []
  for (const pattern of PERSON_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags)
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      people.push(match[0].trim())
    }
  }
  return [...new Set(people)]
}

function extractDeadlines(text: string): string[] {
  const deadlines: string[] = []
  for (const pattern of DEADLINE_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags)
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      deadlines.push(match[0].trim())
    }
  }
  return [...new Set(deadlines)]
}

function detectCrisis(text: string): boolean {
  return CRISIS_PATTERNS.some(p => p.test(text))
}

function detectSensitivity(text: string): ContextSensitivity {
  if (SENSITIVE_PATTERNS.some(p => p.test(text))) return 'restricted'
  return 'personal'
}

// ── Public API ─────────────────────────────────────────────

export function extractFromText(text: string, source: ContextSource): ExtractionResult {
  const deadlines = extractDeadlines(text)
  const people = extractPeople(text)
  const crisisDetected = detectCrisis(text)
  const sensitivity = detectSensitivity(text)
  const category = detectCategory(text)
  const urgency = detectUrgency(text)

  const obligations: ExtractedObligation[] = []
  if (text.trim().length > 0) {
    obligations.push({
      text: text.trim(),
      deadline: deadlines.length > 0 ? deadlines[0] : null,
      people,
      actionVerbs: [],
      urgency,
      category,
    })
  }

  return {
    deadlines,
    people,
    obligations,
    crisisDetected,
    sensitivity,
    rawText: text,
  }
}

export function createContextCapsule(text: string, source: ContextSource): ContextCapsule {
  const extracted = extractFromText(text, source)

  return {
    id: `capsule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    source,
    rawContent: text,
    summary: text.length > 100 ? text.slice(0, 100) + '...' : text,
    extractedObligations: extracted.obligations,
    extractedDeadlines: extracted.deadlines,
    extractedPeople: extracted.people,
    extractedActions: [],
    sensitivity: extracted.sensitivity,
    aiProcessingAllowed: extracted.sensitivity !== 'restricted',
    analyticsAllowed: extracted.sensitivity !== 'restricted',
    retentionPolicy: extracted.sensitivity === 'restricted' ? 'delete_after_mission' : 'keep',
    createdMissions: [],
    createdAt: new Date().toISOString(),
    expiresAt: null,
  }
}

export function contextToMission(capsule: ContextCapsule): string {
  const obligation = capsule.extractedObligations[0]
  if (!obligation) return 'Take one small step on something that matters to you.'

  const actionMap: Record<string, string> = {
    school: 'Open the assignment and write the first sentence',
    work: 'Open the document and review the first section',
    cleaning: 'Start with one small area',
    admin: 'Open the form and fill in the first field',
    creative: 'Create something rough — it can be refined later',
    health: 'Make the appointment or do 2 minutes of movement',
    social: 'Send one short message',
    finance: 'Open the bill and note the amount',
    personal: 'Take one small step forward',
    unknown: 'Start with the smallest possible action',
  }

  return actionMap[obligation.category] ?? actionMap.unknown
}
