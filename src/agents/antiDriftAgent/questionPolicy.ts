// ══════════════════════════════════════════════════════════════
// INTENT — One Question Max Policy
// A stuck user hates forms. Ask at most one question.
// ══════════════════════════════════════════════════════════════

import type { UserState } from '../../types/moment'

export type QuestionType =
  | 'time_available'
  | 'category'
  | 'size_preference'
  | 'what_avoiding'

export interface QuestionDecision {
  shouldAsk: boolean
  question: QuestionType | null
  questionText: string | null
  options: string[] | null
  reason: string
}

// ── Decision Logic ─────────────────────────────────────────

export function decideQuestion(
  state: UserState | null,
  availableMinutes: number | null,
  category: string | null,
  userMessage: string,
): QuestionDecision {
  const lower = userMessage.toLowerCase()

  // If user already specified state, time, and category — no question needed
  if (state && availableMinutes && category) {
    return {
      shouldAsk: false,
      question: null,
      questionText: null,
      options: null,
      reason: 'Enough information to generate mission',
    }
  }

  // If no state, ask what they are avoiding
  if (!state && !inferState(lower)) {
    return {
      shouldAsk: true,
      question: 'what_avoiding',
      questionText: 'What are you avoiding?',
      options: ['Too much to do', 'Stuck on something', 'No energy', 'About to scroll', 'Perfectionism'],
      reason: 'Need to know what kind of moment this is',
    }
  }

  // If no time, ask
  if (!availableMinutes) {
    return {
      shouldAsk: true,
      question: 'time_available',
      questionText: 'How much time do you have?',
      options: ['2 minutes', '5 minutes', '10 minutes', '15+ minutes'],
      reason: 'Need to size the mission',
    }
  }

  // If no category, ask
  if (!category) {
    return {
      shouldAsk: true,
      question: 'category',
      questionText: 'Is this school, work, or life?',
      options: ['School', 'Work', 'Life', 'Health'],
      reason: 'Need to pick the right mission template',
    }
  }

  return {
    shouldAsk: false,
    question: null,
    questionText: null,
    options: null,
    reason: 'Enough information',
  }
}

// ── Infer State from Text ──────────────────────────────────

function inferState(text: string): UserState | null {
  if (text.includes('overwhelm') || text.includes('too much')) return 'overwhelmed'
  if (text.includes('stuck') || text.includes("can't start")) return 'stuck'
  if (text.includes('avoid') || text.includes("don't want")) return 'avoiding'
  if (text.includes('tired') || text.includes('exhausted')) return 'tired'
  if (text.includes('anxious') || text.includes('worried')) return 'anxious'
  if (text.includes('scroll') || text.includes('phone')) return 'doomscroll_risk'
  if (text.includes('perfect') || text.includes('not good enough')) return 'perfectionism'
  return null
}

// ── Policy Enforcement ─────────────────────────────────────

export function validateQuestionCount(questions: number): boolean {
  return questions <= 1
}

export function getNoQuestionCopy(): string {
  return 'I have enough to start. Here is your mission.'
}
