// ══════════════════════════════════════════════════════════════
// INTENT — Context Inbox Engine
// Deterministic extraction + context-to-mission pipeline
// ══════════════════════════════════════════════════════════════

import type {
  ExtractionResult,
  DeadlineExtraction,
  PossibleMission,
  ContextCategory,
  ContextCaptureInput,
  ContextProcessingOptions,
} from '../../types/contextInbox'
import type { ContextCapsule, ContextSource, ContextSensitivity, ExtractedObligation } from '../../types/contextCapsule'
import {
  DEADLINE_PATTERNS,
  ACTION_VERBS,
  BLOCKER_PATTERNS,
  PEOPLE_PATTERNS,
  detectSensitivity,
  DEFAULT_PROCESSING_OPTIONS,
} from '../../types/contextInbox'

// ── Main Extraction Function ───────────────────────────────

export function extractContext(input: ContextCaptureInput): ExtractionResult {
  const text = input.text.trim()
  const options = { ...DEFAULT_PROCESSING_OPTIONS, ...input.options }

  if (text.length === 0) {
    return emptyResult()
  }

  const obligations = extractObligations(text)
  const deadlines = extractDeadlines(text)
  const people = extractPeople(text)
  const blockers = extractBlockers(text)
  const sensitivity = options.classifySensitivity ? detectSensitivity(text) : 'public'
  const category = classifyCategory(text)
  const possibleMissions = generatePossibleMissions(obligations, deadlines, blockers)

  return {
    obligations,
    deadlines,
    people,
    blockers,
    possibleMissions,
    questions: generateClarifyingQuestions(obligations, deadlines),
    sensitivity,
    category,
    confidence: calculateExtractionConfidence(obligations, deadlines),
  }
}

// ── Obligation Extraction ──────────────────────────────────

function extractObligations(text: string): ExtractedObligation[] {
  const obligations: ExtractedObligation[] = []
  const sentences = splitIntoSentences(text)

  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (trimmed.length < 5) continue

    // Check for action verbs
    const hasAction = ACTION_VERBS.some((v) => trimmed.toLowerCase().includes(v))
    const hasDeadline = DEADLINE_PATTERNS.some((p) => p.test(trimmed))
    const hasBlocker = BLOCKER_PATTERNS.some((p) => p.test(trimmed))

    if (hasAction || hasDeadline || hasBlocker) {
      obligations.push({
        text: trimmed,
        deadline: extractFirstMatch(trimmed, DEADLINE_PATTERNS),
        people: extractPeopleFromText(trimmed),
        actionVerbs: ACTION_VERBS.filter((v) => trimmed.toLowerCase().includes(v)),
        urgency: hasDeadline ? 'high' : hasBlocker ? 'medium' : 'low',
        category: classifyObligationCategory(trimmed),
      })
    }
  }

  return obligations
}

// ── Deadline Extraction ────────────────────────────────────

function extractDeadlines(text: string): DeadlineExtraction[] {
  const deadlines: DeadlineExtraction[] = []
  const seen = new Set<string>()

  for (const pattern of DEADLINE_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags)
    let match
    while ((match = regex.exec(text)) !== null) {
      const raw = match[1] ?? match[0]
      if (seen.has(raw.toLowerCase())) continue
      seen.add(raw.toLowerCase())

      deadlines.push({
        text: raw,
        date: parseRelativeDate(raw),
        urgency: estimateUrgency(raw),
        relatedObligation: findRelatedSentence(text, match.index),
      })
    }
  }

  return deadlines
}

// ── People Extraction ──────────────────────────────────────

function extractPeople(text: string): string[] {
  const people = new Set<string>()
  for (const pattern of PEOPLE_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags)
    let match
    while ((match = regex.exec(text)) !== null) {
      if (match[1]) people.add(match[1])
    }
  }
  return [...people]
}

function extractPeopleFromText(text: string): string[] {
  const people: string[] = []
  for (const pattern of PEOPLE_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags)
    let match
    while ((match = regex.exec(text)) !== null) {
      if (match[1]) people.push(match[1])
    }
  }
  return people
}

// ── Blocker Extraction ─────────────────────────────────────

function extractBlockers(text: string): string[] {
  const blockers: string[] = []
  for (const pattern of BLOCKER_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags)
    let match
    while ((match = regex.exec(text)) !== null) {
      blockers.push(match[0].trim())
    }
  }
  return blockers
}

// ── Mission Generation ─────────────────────────────────────

function generatePossibleMissions(
  obligations: ExtractedObligation[],
  deadlines: DeadlineExtraction[],
  blockers: string[],
): PossibleMission[] {
  const missions: PossibleMission[] = []

  // Generate from obligations
  for (const obligation of obligations) {
    const tinyAction = deriveTinyAction(obligation)
    if (tinyAction) {
      missions.push({
        title: tinyAction,
        exactAction: tinyAction,
        estimatedMinutes: 2,
        priority: obligation.urgency === 'high' ? 5 : obligation.urgency === 'medium' ? 3 : 1,
        sourceObligation: obligation.text,
      })
    }
  }

  // Sort by priority
  return missions.sort((a, b) => b.priority - a.priority).slice(0, 5)
}

function deriveTinyAction(obligation: ExtractedObligation): string | null {
  const text = obligation.text.toLowerCase()

  // Email patterns
  if (text.includes('email') || text.includes('send')) {
    return 'Write the subject line of the email'
  }

  // Study patterns
  if (text.includes('study') || text.includes('read') || text.includes('review')) {
    return 'Open the notes and read the first paragraph'
  }

  // Write patterns
  if (text.includes('write') || text.includes('essay') || text.includes('draft')) {
    return 'Write one ugly sentence to start'
  }

  // Clean patterns
  if (text.includes('clean') || text.includes('organize')) {
    return 'Put 10 items into one basket'
  }

  // Submit patterns
  if (text.includes('submit') || text.includes('turn in')) {
    return 'Open the submission page and read the requirements'
  }

  // Call patterns
  if (text.includes('call') || text.includes('phone')) {
    return 'Write down the phone number and what to say'
  }

  // Generic: use first action verb
  if (obligation.actionVerbs.length > 0) {
    const verb = obligation.actionVerbs[0]
    return `Start with: ${verb} (just the first step)`
  }

  return 'Open the file and read the first section'
}

// ── Category Classification ────────────────────────────────

function classifyCategory(text: string): ContextCategory {
  const lower = text.toLowerCase()

  if (/\b(?:essay|homework|assignment|exam|class|professor|teacher|school|grade|gpa|thesis)\b/.test(lower)) return 'school'
  if (/\b(?:meeting|project|client|deadline|report|team|boss|work|office|jira|ticket)\b/.test(lower)) return 'work'
  if (/\b(?:clean|laundry|dishes|organize|tidy|garage|closet)\b/.test(lower)) return 'cleaning'
  if (/\b(?:doctor|dentist|appointment|insurance|bill|tax|bank|pay)\b/.test(lower)) return 'life_admin'
  if (/\b(?:write|draw|design|music|art|creative|paint|sketch)\b/.test(lower)) return 'creative'
  if (/\b(?:exercise|gym|run|walk|health|diet|sleep|meditation)\b/.test(lower)) return 'health'
  if (/\b(?:call|text|message|friend|family|birthday|party|social)\b/.test(lower)) return 'social'
  if (/\b(?:money|budget|invest|loan|debt|financial|salary)\b/.test(lower)) return 'finance'

  return 'unknown'
}

function classifyObligationCategory(text: string): ExtractedObligation['category'] {
  const cat = classifyCategory(text)
  if (cat === 'unknown') return 'unknown'
  return cat as ExtractedObligation['category']
}

// ── Clarifying Questions ───────────────────────────────────

function generateClarifyingQuestions(
  obligations: ExtractedObligation[],
  deadlines: DeadlineExtraction[],
): string[] {
  const questions: string[] = []

  if (obligations.length > 3) {
    questions.push('Which of these feels most urgent right now?')
  }

  if (obligations.some((o) => !o.deadline)) {
    questions.push('Any of these have a deadline?')
  }

  if (obligations.some((o) => o.urgency === 'high')) {
    questions.push('Want to start with the highest urgency item?')
  }

  return questions.slice(0, 2) // Max 2 questions
}

// ── Helpers ────────────────────────────────────────────────

function splitIntoSentences(text: string): string[] {
  return text
    .split(/[.\n;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function extractFirstMatch(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const regex = new RegExp(pattern.source, pattern.flags)
    const match = regex.exec(text)
    if (match) return match[1] ?? match[0]
  }
  return null
}

function findRelatedSentence(text: string, matchIndex: number): string | null {
  const before = text.substring(Math.max(0, matchIndex - 100), matchIndex)
  const sentences = before.split(/[.\n]/).filter((s) => s.trim().length > 0)
  return sentences.length > 0 ? sentences[sentences.length - 1].trim() : null
}

function parseRelativeDate(text: string): string | null {
  const lower = text.toLowerCase()
  const now = new Date()

  if (lower === 'today') return now.toISOString().slice(0, 10)
  if (lower === 'tomorrow') {
    const d = new Date(now.getTime() + 86400000)
    return d.toISOString().slice(0, 10)
  }
  if (lower.includes('next week')) {
    const d = new Date(now.getTime() + 7 * 86400000)
    return d.toISOString().slice(0, 10)
  }

  // Try parsing explicit dates
  const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/)
  if (dateMatch) {
    const month = parseInt(dateMatch[1], 10)
    const day = parseInt(dateMatch[2], 10)
    const year = dateMatch[3] ? parseInt(dateMatch[3], 10) : now.getFullYear()
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  }

  return null
}

function estimateUrgency(text: string): 'low' | 'medium' | 'high' {
  const lower = text.toLowerCase()
  if (/today|tonight|asap|urgent|immediately/.test(lower)) return 'high'
  if (/tomorrow|this week|soon/.test(lower)) return 'high'
  if (/next week|friday|monday/.test(lower)) return 'medium'
  return 'low'
}

function calculateExtractionConfidence(
  obligations: ExtractedObligation[],
  deadlines: DeadlineExtraction[],
): number {
  let confidence = 0.3 // base
  if (obligations.length > 0) confidence += 0.2
  if (deadlines.length > 0) confidence += 0.2
  if (obligations.some((o) => o.actionVerbs.length > 0)) confidence += 0.15
  if (obligations.some((o) => o.deadline)) confidence += 0.15
  return Math.min(confidence, 1)
}

function emptyResult(): ExtractionResult {
  return {
    obligations: [],
    deadlines: [],
    people: [],
    blockers: [],
    possibleMissions: [],
    questions: [],
    sensitivity: 'public',
    category: 'unknown',
    confidence: 0,
  }
}

// ── Capsule Creation ───────────────────────────────────────

export function createCapsuleFromExtraction(
  input: ContextCaptureInput,
  extraction: ExtractionResult,
): ContextCapsule {
  return {
    id: uid(),
    source: input.source,
    rawContent: input.text,
    summary: generateSummary(extraction),
    extractedObligations: extraction.obligations,
    extractedDeadlines: extraction.deadlines.map((d) => d.text),
    extractedPeople: extraction.people,
    extractedActions: extraction.possibleMissions.map((m) => m.exactAction),
    sensitivity: extraction.sensitivity,
    aiProcessingAllowed: false,
    analyticsAllowed: false,
    retentionPolicy: 'keep',
    createdMissions: [],
    createdAt: new Date().toISOString(),
    expiresAt: null,
  }
}

function generateSummary(extraction: ExtractionResult): string {
  const parts: string[] = []
  if (extraction.obligations.length > 0) {
    parts.push(`${extraction.obligations.length} obligation${extraction.obligations.length > 1 ? 's' : ''}`)
  }
  if (extraction.deadlines.length > 0) {
    parts.push(`${extraction.deadlines.length} deadline${extraction.deadlines.length > 1 ? 's' : ''}`)
  }
  if (extraction.blockers.length > 0) {
    parts.push(`blocker: ${extraction.blockers[0]}`)
  }
  if (extraction.possibleMissions.length > 0) {
    parts.push(`${extraction.possibleMissions.length} possible mission${extraction.possibleMissions.length > 1 ? 's' : ''}`)
  }
  return parts.length > 0 ? parts.join(' · ') : 'No obligations found'
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}
