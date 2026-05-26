// ══════════════════════════════════════════════════════════════
// INTENT — Context Extractor
// Extracts obligations, deadlines, people, actions from pasted text
// ══════════════════════════════════════════════════════════════

import type { ContextCapsule, ExtractedObligation, ContextSensitivity, ContextSource } from '../../types'

interface ExtractionResult {
  obligations: ExtractedObligation[]
  deadlines: string[]
  people: string[]
  actions: string[]
  sensitivity: ContextSensitivity
  summary: string
  crisisDetected: boolean
}

// ── Patterns ─────────────────────────────────────────────────

const DEADLINE_PATTERNS = [
  /\b(due|deadline|by|before)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
  /\b(due|deadline|by|before)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/gi,
  /\b(due|deadline|by|before)\s+(tomorrow|tonight|end of week|end of day)\b/gi,
  /\b(due|deadline|by|before)\s+(next week|this week|end of semester)\b/gi,
  /\b(test|exam|quiz|midterm|final)\s+(?:is\s+)?(on\s+)?(monday|tuesday|wednesday|thursday|friday|\d{1,2}[\/\-]\d{1,2})/gi,
  /\b(submit|turn in|hand in|present)\s+.+\s+(by|before|on)\s+(monday|tuesday|wednesday|thursday|friday|\d{1,2}[\/\-]\d{1,2})/gi,
]

const PEOPLE_PATTERNS = [
  /\b(professor|prof|dr|doctor)\s+([A-Z][a-z]+)\b/gi,
  /\b(mr|mrs|ms)\s+([A-Z][a-z]+)\b/gi,
  /\b(group|team|partner|classmate)\s+([A-Z][a-z]+)\b/gi,
  /\b([A-Z][a-z]+)\s+(said|told|asked|assigned|gave)\b/gi,
]

const ACTION_VERBS = [
  'write', 'read', 'study', 'submit', 'complete', 'finish', 'prepare',
  'review', 'revise', 'edit', 'create', 'build', 'design', 'implement',
  'analyze', 'research', 'present', 'email', 'call', 'meet', 'attend',
  'submit', 'upload', 'post', 'share', 'schedule', 'plan', 'organize',
  'clean', 'organize', 'file', 'send', 'reply', 'respond',
]

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  school: ['class', 'course', 'assignment', 'essay', 'paper', 'project', 'homework', 'test', 'exam', 'quiz', 'midterm', 'final', 'grade', 'professor', 'lecture', 'semester', 'credit', 'degree', 'university', 'college', 'school'],
  work: ['meeting', 'deadline', 'report', 'presentation', 'client', 'boss', 'manager', 'team', 'project', 'sprint', 'review', 'promotion', 'salary', 'office', 'company'],
  cleaning: ['clean', 'wash', 'vacuum', 'dust', 'organize', 'tidy', 'dishes', 'laundry', 'trash', 'room', 'kitchen', 'bathroom', 'desk'],
  admin: ['email', 'call', 'appointment', 'schedule', 'book', 'reserve', 'renew', 'apply', 'form', 'document', 'file', 'tax', 'insurance', 'bank'],
  creative: ['write', 'draw', 'paint', 'design', 'compose', 'record', 'edit', 'create', 'draft', 'story', 'poem', 'song', 'art', 'photo', 'video'],
  health: ['doctor', 'dentist', 'appointment', 'exercise', 'gym', 'run', 'walk', 'meditate', 'therapy', 'medicine', 'prescription', 'sleep', 'eat'],
  social: ['party', 'dinner', 'lunch', 'coffee', 'drinks', 'birthday', 'wedding', 'event', 'hang out', 'meet up', 'visit'],
  finance: ['pay', 'bill', 'rent', 'budget', 'save', 'invest', 'bank', 'credit', 'debt', 'loan', 'tax', 'insurance'],
  personal: ['goal', 'habit', 'routine', 'journal', 'read', 'learn', 'practice', 'improve'],
}

const SENSITIVE_PATTERNS = [
  /\b(password|ssn|social security|credit card|bank account|routing number)\b/i,
  /\b(diagnosis|medication|prescription|therapy|mental health|depression|anxiety disorder)\b/i,
  /\b(divorce|custody|lawsuit|legal|attorney|court|criminal)\b/i,
  /\b(fired|terminated|layoff|quit|resign)\b/i,
]

const CRISIS_PATTERNS = [
  /\bi want to (hurt|kill|harm) myself\b/i,
  /\bi can'?t go on\b/i,
  /\bi want to die\b/i,
  /\bno (reason|point) in (living|going on)\b/i,
  /\bself[\s-]?harm\b/i,
  /\bsuicid(e|al)\b/i,
]

// ── Main Extraction ─────────────────────────────────────────

export function extractFromText(text: string, source: ContextSource): ExtractionResult {
  const lower = text.toLowerCase()
  const obligations: ExtractedObligation[] = []
  const deadlines: string[] = []
  const people: string[] = []
  const actions: string[] = []

  // Extract deadlines
  for (const pattern of DEADLINE_PATTERNS) {
    for (const match of Array.from(text.matchAll(pattern))) {
      deadlines.push(match[0])
    }
  }

  // Extract people
  for (const pattern of PEOPLE_PATTERNS) {
    for (const match of Array.from(text.matchAll(pattern))) {
      const name = match[2] || match[1]
      if (name && !people.includes(name)) {
        people.push(name)
      }
    }
  }

  // Extract action verbs
  for (const verb of ACTION_VERBS) {
    if (lower.includes(verb)) {
      actions.push(verb)
    }
  }

  // Determine category
  let category = 'unknown'
  let maxMatches = 0
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matches = keywords.filter(k => lower.includes(k)).length
    if (matches > maxMatches) {
      maxMatches = matches
      category = cat
    }
  }

  // Determine urgency
  let urgency: 'low' | 'medium' | 'high' = 'low'
  if (/\b(today|tonight|asap|urgent|emergency|immediately)\b/i.test(text)) urgency = 'high'
  else if (/\b(tomorrow|this week|soon|due|deadline)\b/i.test(text)) urgency = 'medium'

  // Create obligation if we found actionable content
  if (actions.length > 0 || deadlines.length > 0) {
    obligations.push({
      text: text.slice(0, 200),
      deadline: deadlines[0] || null,
      people,
      actionVerbs: actions.slice(0, 5),
      urgency,
      category: category as ExtractedObligation['category'],
    })
  }

  // Determine sensitivity
  let sensitivity: ContextSensitivity = 'public'
  if (SENSITIVE_PATTERNS.some(p => p.test(text))) {
    sensitivity = 'restricted'
  } else if (/\b(personal|private|confidential)\b/i.test(text)) {
    sensitivity = 'sensitive'
  } else if (people.length > 0 || deadlines.length > 0) {
    sensitivity = 'personal'
  }

  // Crisis detection
  const crisisDetected = CRISIS_PATTERNS.some(p => p.test(text))

  // Generate summary
  const summary = generateSummary(text, obligations, deadlines, people)

  return { obligations, deadlines, people, actions, sensitivity, summary, crisisDetected }
}

function generateSummary(text: string, obligations: ExtractedObligation[], deadlines: string[], people: string[]): string {
  if (obligations.length === 0) {
    return text.length > 100 ? text.slice(0, 100) + '...' : text
  }

  const parts: string[] = []
  const obl = obligations[0]

  if (obl.category !== 'unknown') parts.push(`Category: ${obl.category}`)
  if (deadlines.length > 0) parts.push(`Deadline: ${deadlines[0]}`)
  if (people.length > 0) parts.push(`People: ${people.slice(0, 3).join(', ')}`)
  if (obl.actionVerbs.length > 0) parts.push(`Actions: ${obl.actionVerbs.slice(0, 3).join(', ')}`)

  return parts.join(' | ')
}

// ── Context Capsule Creation ─────────────────────────────────

export function createContextCapsule(
  text: string,
  source: ContextSource,
  aiAllowed: boolean = false,
): ContextCapsule {
  const extraction = extractFromText(text, source)
  const now = new Date().toISOString()

  return {
    id: `capsule_${Date.now()}`,
    source,
    rawContent: text,
    summary: extraction.summary,
    extractedObligations: extraction.obligations,
    extractedDeadlines: extraction.deadlines,
    extractedPeople: extraction.people,
    extractedActions: extraction.actions,
    sensitivity: extraction.sensitivity,
    aiProcessingAllowed: aiAllowed && extraction.sensitivity !== 'restricted',
    analyticsAllowed: extraction.sensitivity === 'public',
    retentionPolicy: extraction.sensitivity === 'restricted' ? 'delete_after_mission' : 'keep',
    createdMissions: [],
    createdAt: now,
    expiresAt: null,
  }
}

// ── Context to Mission ──────────────────────────────────────

export function contextToMission(capsule: ContextCapsule): string | null {
  if (capsule.extractedObligations.length === 0) return null

  const obl = capsule.extractedObligations[0]
  const action = obl.actionVerbs[0] || 'work on'
  const category = obl.category

  // Generate mission based on category + action
  if (category === 'school') {
    if (action === 'write') return 'Open your assignment doc and write one sentence. That\'s it.'
    if (action === 'study') return 'Open your notes and make 3 flashcards from the first page.'
    if (action === 'read') return 'Open the reading and read the first paragraph. Highlight one key idea.'
    if (action === 'submit') return 'Open the submission page. Check the requirements. Prepare your file.'
    return 'Open your assignment and do the first small step.'
  }

  if (category === 'work') {
    if (action === 'email') return 'Open your inbox and draft the subject line of the email.'
    if (action === 'meeting') return 'Open the meeting agenda. Write down one question you have.'
    if (action === 'present') return 'Open your slides. Review the first 3 slides.'
    return 'Open the work document and do one small action.'
  }

  if (category === 'cleaning') {
    return 'Set a 5-minute timer. Pick up 10 items from the floor.'
  }

  if (category === 'admin') {
    return 'Open the form or email. Fill in the first field.'
  }

  if (category === 'creative') {
    return 'Open your creative document. Write one ugly sentence or make one rough sketch.'
  }

  if (category === 'health') {
    return 'Open the health app or calendar. Schedule the appointment.'
  }

  // Default
  return `Open the relevant document and do one small step toward: ${obl.text.slice(0, 60)}`
}

// ── Helpers ─────────────────────────────────────────────────
