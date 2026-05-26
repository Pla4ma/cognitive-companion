// ══════════════════════════════════════════════════════════════
// INTENT — Personal Playbook Engine
// Your anti-drift playbook — learns what works for you
// ══════════════════════════════════════════════════════════════

import type { UserState } from '../../types/moment'

export interface PlaybookRule {
  id: string
  category: 'protocol' | 'duration' | 'body_double' | 'danger_window' | 'avoid' | 'comeback' | 'before_scroll' | 'notification' | 'tone'
  state: UserState | 'any'
  rule: string
  confidence: number // 0-1
  evidence: number // number of data points
  source: 'learned' | 'starter' | 'user_edited'
  createdAt: number
}

export interface PersonalPlaybook {
  rules: PlaybookRule[]
  lastUpdated: number
  totalMissions: number
  isLearning: boolean
}

// ── Create Empty Playbook ──────────────────────────────────

export function createEmptyPlaybook(): PersonalPlaybook {
  return {
    rules: getStarterRules(),
    lastUpdated: Date.now(),
    totalMissions: 0,
    isLearning: true,
  }
}

// ── Starter Rules ──────────────────────────────────────────

function getStarterRules(): PlaybookRule[] {
  const now = Date.now()
  return [
    { id: 'sr-1', category: 'protocol', state: 'overwhelmed', rule: 'Start with 2-minute Shrink The Beast', confidence: 0.4, evidence: 0, source: 'starter', createdAt: now },
    { id: 'sr-2', category: 'protocol', state: 'stuck', rule: 'Body Double with gentle cowork mode', confidence: 0.4, evidence: 0, source: 'starter', createdAt: now },
    { id: 'sr-3', category: 'protocol', state: 'tired', rule: 'Maintenance Spark — tiny action only', confidence: 0.4, evidence: 0, source: 'starter', createdAt: now },
    { id: 'sr-4', category: 'protocol', state: 'perfectionism', rule: 'Ugly First Move — write badly on purpose', confidence: 0.4, evidence: 0, source: 'starter', createdAt: now },
    { id: 'sr-5', category: 'protocol', state: 'doomscroll_risk', rule: 'Before You Scroll — 2-min win first', confidence: 0.4, evidence: 0, source: 'starter', createdAt: now },
    { id: 'sr-6', category: 'duration', state: 'any', rule: '2-minute starts work best when resistance is high', confidence: 0.5, evidence: 0, source: 'starter', createdAt: now },
    { id: 'sr-7', category: 'comeback', state: 'any', rule: 'Come back with the smallest possible action', confidence: 0.5, evidence: 0, source: 'starter', createdAt: now },
  ]
}

// ── Update Playbook from Outcomes ──────────────────────────

export function updatePlaybookFromOutcome(
  playbook: PersonalPlaybook,
  state: UserState,
  protocolId: string,
  duration: number,
  outcome: 'success' | 'failure' | 'salvage',
): PersonalPlaybook {
  const rules = [...playbook.rules]

  // Find or create protocol rule for this state
  let rule = rules.find((r) => r.category === 'protocol' && r.state === state)
  if (!rule) {
    rule = {
      id: `learned_${Date.now()}`,
      category: 'protocol',
      state,
      rule: `${protocolId} works for ${state}`,
      confidence: 0.3,
      evidence: 0,
      source: 'learned',
      createdAt: Date.now(),
    }
    rules.push(rule)
  }

  // Update confidence based on outcome
  if (outcome === 'success') {
    rule.confidence = Math.min(1, rule.confidence + 0.1)
    rule.evidence++
  } else if (outcome === 'failure') {
    rule.confidence = Math.max(0, rule.confidence - 0.05)
    rule.evidence++
  } else {
    rule.evidence++
  }

  return {
    ...playbook,
    rules,
    lastUpdated: Date.now(),
    totalMissions: playbook.totalMissions + 1,
    isLearning: playbook.totalMissions + 1 < 10,
  }
}

// ── Get Playbook Summary ───────────────────────────────────

export function getPlaybookSummary(playbook: PersonalPlaybook): string[] {
  const confident = playbook.rules
    .filter((r) => r.confidence >= 0.6 && r.evidence >= 3)
    .sort((a, b) => b.confidence - a.confidence)

  if (confident.length === 0) {
    return ['Still learning your patterns. Each rescue teaches INTENT something.']
  }

  return confident.map((r) => r.rule)
}

export function getPlaybookForState(playbook: PersonalPlaybook, state: UserState): PlaybookRule | null {
  const rules = playbook.rules
    .filter((r) => r.state === state || r.state === 'any')
    .sort((a, b) => b.confidence - a.confidence)

  return rules[0] ?? null
}
