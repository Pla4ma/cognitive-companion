// INTENT — Session Engines
// Tracks what happens during and after sessions:
//   - Attention receipts (post-session summary)
//   - Mission threads (progress across attempts)
//   - Playbook (learned patterns)

import type { AttentionReceipt, AttentionReceiptOutcome } from '../types/attentionReceipt'
import type { UserState } from '../types/moment'
import type { DriftSignal } from '../types/drift'

// ══════════════════════════════════════════════════════════════
// SECTION 1: Attention Receipts
// "What did I do with the moment I almost lost?"
// ══════════════════════════════════════════════════════════════

function generateId(): string {
  return `receipt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function createAttentionReceipt(params: {
  beforeState: UserState
  driftSignal: DriftSignal | null
  missionTitle: string
  missionAction: string
  duration: number
  outcome: AttentionReceiptOutcome
  whatChanged: string
  nextMicroStep: string
}): AttentionReceipt {
  const driftRisk = params.driftSignal ? getSeverityLabel(params.driftSignal.severity) : 'medium'
  const stateLabel = stateToLabel(params.beforeState)
  return {
    id: generateId(),
    beforeState: stateLabel,
    driftRisk,
    missionTitle: params.missionTitle,
    missionAction: params.missionAction,
    duration: params.duration,
    outcome: params.outcome,
    whatChanged: params.whatChanged,
    nextMicroStep: params.nextMicroStep,
    privacySafeSummary: buildPrivacySafeSummary(params.outcome, params.duration),
    shareableVersion: buildShareableVersion(params.outcome, params.duration, stateLabel),
    createdAt: Date.now(),
  }
}

function getSeverityLabel(severity: number): 'low' | 'medium' | 'high' {
  if (severity >= 4) return 'high'
  if (severity >= 2) return 'medium'
  return 'low'
}

function stateToLabel(state: UserState): string {
  const map: Record<string, string> = {
    overwhelmed: 'Overwhelmed', stuck: 'Stuck', avoiding: 'Avoiding',
    tired: 'Low energy', anxious: 'Tense', doomscroll_risk: 'About to scroll',
    perfectionism: 'Overthinking', scattered: 'Scattered',
    shame_spiral: 'Hard moment', ready: 'Ready',
  }
  return map[state] ?? 'In a moment'
}

function buildPrivacySafeSummary(outcome: AttentionReceiptOutcome, duration: number): string {
  const action = outcomeToAction(outcome)
  return `Rescued ${duration} minutes. ${action}.`
}

function buildShareableVersion(outcome: AttentionReceiptOutcome, duration: number, state: string): string {
  const action = outcomeToAction(outcome)
  return `I rescued ${duration} minutes instead of disappearing. ${action}.`
}

function outcomeToAction(outcome: AttentionReceiptOutcome): string {
  const map: Record<AttentionReceiptOutcome, string> = {
    completed: 'Completed the mission', salvaged: 'Salvaged something useful',
    partial: 'Made partial progress', skipped: 'Chose to rest instead',
  }
  return map[outcome]
}

export function getReceiptTitle(outcome: AttentionReceiptOutcome): string {
  const titles: Record<AttentionReceiptOutcome, string> = {
    completed: 'Moment rescued', salvaged: 'Something saved',
    partial: 'Progress made', skipped: 'Rest chosen',
  }
  return titles[outcome]
}

export function getReceiptEmoji(outcome: AttentionReceiptOutcome): string {
  const emojis: Record<AttentionReceiptOutcome, string> = {
    completed: '✓', salvaged: '↻', partial: '→', skipped: '○',
  }
  return emojis[outcome]
}

export function getReceiptNextCopy(receipt: AttentionReceipt): string {
  if (receipt.nextMicroStep) return `Next: ${receipt.nextMicroStep}`
  return 'You can come back to this later'
}

// ══════════════════════════════════════════════════════════════
// SECTION 2: Mission Threads
// Track progress across attempts, not tasks
// ══════════════════════════════════════════════════════════════

export type ThreadEvent =
  | 'context_added' | 'mission_compiled' | 'mission_started' | 'mission_completed'
  | 'mission_salvaged' | 'blocker_detected' | 'protocol_changed' | 'handoff_created'
  | 'outcome_labeled' | 'next_action_generated'

export interface MissionThreadEvent {
  id: string
  type: ThreadEvent
  description: string
  timestamp: number
  metadata: Record<string, unknown>
}

export interface MissionThread {
  id: string
  title: string
  contextId: string | null
  events: MissionThreadEvent[]
  currentNextAction: string
  bestProtocol: string | null
  lastBlocker: string | null
  status: 'active' | 'completed' | 'abandoned'
  createdAt: number
  updatedAt: number
}

export function createMissionThread(title: string, contextId?: string): MissionThread {
  return {
    id: `thread_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    title,
    contextId: contextId ?? null,
    events: [],
    currentNextAction: '',
    bestProtocol: null,
    lastBlocker: null,
    status: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function addThreadEvent(
  thread: MissionThread,
  type: ThreadEvent,
  description: string,
  metadata: Record<string, unknown> = {},
): MissionThread {
  const event: MissionThreadEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type,
    description,
    timestamp: Date.now(),
    metadata,
  }
  return { ...thread, events: [...thread.events, event], updatedAt: Date.now() }
}

export function setCurrentNextAction(thread: MissionThread, action: string): MissionThread {
  return { ...thread, currentNextAction: action, updatedAt: Date.now() }
}

export function setBestProtocol(thread: MissionThread, protocol: string): MissionThread {
  return { ...thread, bestProtocol: protocol, updatedAt: Date.now() }
}

export function setLastBlocker(thread: MissionThread, blocker: string): MissionThread {
  return { ...thread, lastBlocker: blocker, updatedAt: Date.now() }
}

export function completeThread(thread: MissionThread): MissionThread {
  return addThreadEvent({ ...thread, status: 'completed' }, 'mission_completed', 'Thread completed')
}

export function getThreadSummary(thread: MissionThread): {
  totalAttempts: number
  completions: number
  salvages: number
  blockers: string[]
  timeline: string
} {
  const completions = thread.events.filter((e) => e.type === 'mission_completed').length
  const salvages = thread.events.filter((e) => e.type === 'mission_salvaged').length
  const starts = thread.events.filter((e) => e.type === 'mission_started').length
  const blockers = thread.events
    .filter((e) => e.type === 'blocker_detected')
    .map((e) => e.description)
  const daySpan = thread.events.length > 1
    ? Math.ceil((thread.events[thread.events.length - 1].timestamp - thread.events[0].timestamp) / 86400000)
    : 0
  return {
    totalAttempts: starts,
    completions,
    salvages,
    blockers,
    timeline: daySpan > 0 ? `${daySpan} day${daySpan > 1 ? 's' : ''}` : 'Today',
  }
}

export function getCurrentNextAction(thread: MissionThread): string | null {
  if (!thread.currentNextAction || thread.currentNextAction.length === 0) return null
  return thread.currentNextAction
}

export function getThreadProgressPercent(thread: MissionThread): number {
  const summary = getThreadSummary(thread)
  if (summary.totalAttempts === 0) return 0
  return Math.round(((summary.completions + summary.salvages * 0.5) / summary.totalAttempts) * 100)
}

// ══════════════════════════════════════════════════════════════
// SECTION 3: Personal Playbook
// Your anti-drift playbook — learns what works for you
// ══════════════════════════════════════════════════════════════

export interface PlaybookOutcome {
  state: UserState
  protocolId: string
  success: boolean
  timestamp: number
}

export interface PlaybookRule {
  id: string
  category: 'protocol' | 'duration' | 'body_double' | 'danger_window' | 'avoid' | 'comeback' | 'before_scroll' | 'notification' | 'tone'
  state: UserState | 'any'
  rule: string
  confidence: number
  evidence: number
  alpha: number    // Bayesian success count (decay-weighted)
  beta: number     // Bayesian failure count (decay-weighted)
  source: 'learned' | 'starter' | 'user_edited'
  createdAt: number
  lastOutcome: number  // timestamp of most recent outcome
}

export interface PersonalPlaybook {
  rules: PlaybookRule[]
  lastUpdated: number
  totalMissions: number
  isLearning: boolean
  recentOutcomes: PlaybookOutcome[]  // last 20 outcomes for recency analysis
}

export function createEmptyPlaybook(): PersonalPlaybook {
  return {
    rules: getStarterRules(),
    lastUpdated: Date.now(),
    totalMissions: 0,
    isLearning: true,
    recentOutcomes: [],
  }
}

const STARTER_PRIOR_ALPHA = 2   // weak prior: assume 2 "successes" for initial confidence 0.4
const STARTER_PRIOR_BETA = 3    // weak prior: assume 3 "failures"

function getStarterRules(): PlaybookRule[] {
  const now = Date.now()
  return [
    { id: 'sr-1', category: 'protocol', state: 'overwhelmed', rule: 'Start with 2-minute Shrink The Beast', confidence: STARTER_PRIOR_ALPHA / (STARTER_PRIOR_ALPHA + STARTER_PRIOR_BETA), evidence: 0, alpha: STARTER_PRIOR_ALPHA, beta: STARTER_PRIOR_BETA, source: 'starter', createdAt: now, lastOutcome: now },
    { id: 'sr-2', category: 'protocol', state: 'stuck', rule: 'Body Double with gentle cowork mode', confidence: STARTER_PRIOR_ALPHA / (STARTER_PRIOR_ALPHA + STARTER_PRIOR_BETA), evidence: 0, alpha: STARTER_PRIOR_ALPHA, beta: STARTER_PRIOR_BETA, source: 'starter', createdAt: now, lastOutcome: now },
    { id: 'sr-3', category: 'protocol', state: 'tired', rule: 'Maintenance Spark — tiny action only', confidence: STARTER_PRIOR_ALPHA / (STARTER_PRIOR_ALPHA + STARTER_PRIOR_BETA), evidence: 0, alpha: STARTER_PRIOR_ALPHA, beta: STARTER_PRIOR_BETA, source: 'starter', createdAt: now, lastOutcome: now },
    { id: 'sr-4', category: 'protocol', state: 'perfectionism', rule: 'Ugly First Move — write badly on purpose', confidence: STARTER_PRIOR_ALPHA / (STARTER_PRIOR_ALPHA + STARTER_PRIOR_BETA), evidence: 0, alpha: STARTER_PRIOR_ALPHA, beta: STARTER_PRIOR_BETA, source: 'starter', createdAt: now, lastOutcome: now },
    { id: 'sr-5', category: 'protocol', state: 'doomscroll_risk', rule: 'Before You Scroll — 2-min win first', confidence: STARTER_PRIOR_ALPHA / (STARTER_PRIOR_ALPHA + STARTER_PRIOR_BETA), evidence: 0, alpha: STARTER_PRIOR_ALPHA, beta: STARTER_PRIOR_BETA, source: 'starter', createdAt: now, lastOutcome: now },
    { id: 'sr-6', category: 'duration', state: 'any', rule: '2-minute starts work best when resistance is high', confidence: 0.5, evidence: 0, alpha: 2, beta: 2, source: 'starter', createdAt: now, lastOutcome: now },
    { id: 'sr-7', category: 'comeback', state: 'any', rule: 'Come back with the smallest possible action', confidence: 0.5, evidence: 0, alpha: 2, beta: 2, source: 'starter', createdAt: now, lastOutcome: now },
  ]
}

const RECENCY_HALF_LIFE_DAYS = 14
const RECENCY_MAX_OUTCOMES = 20

// Apply exponential decay to a value based on its age
function decayWeight(ageDays: number): number {
  return Math.pow(0.5, ageDays / RECENCY_HALF_LIFE_DAYS)
}

export function updatePlaybookFromOutcome(
  playbook: PersonalPlaybook,
  state: UserState,
  protocolId: string,
  duration: number,
  outcome: 'success' | 'failure' | 'salvage',
): PersonalPlaybook {
  const now = Date.now()
  const rules = [...playbook.rules]
  const success = outcome === 'success'
  const recentOutcomes: PlaybookOutcome[] = [
    { state, protocolId, success, timestamp: now },
    ...playbook.recentOutcomes,
  ].slice(0, RECENCY_MAX_OUTCOMES)

  // Find or create rule for this state+protocol pair
  let rule = rules.find((r) => r.category === 'protocol' && r.state === state)
  if (!rule) {
    rule = {
      id: `learned_${now}`, category: 'protocol', state,
      rule: `${protocolId} works for ${state}`,
      confidence: 0.3, evidence: 1, alpha: 1, beta: 1,
      source: 'learned', createdAt: now, lastOutcome: now,
    }
    rules.push(rule)
  }

  // Bayesian update: recency-weighted
  const ageDays = (now - rule.lastOutcome) / 86400000
  const decay = decayWeight(ageDays)
  // Apply decay to old counts before adding new observation
  const decayedAlpha = rule.alpha * decay + rule.alpha * (1 - decay) * 0.5
  const decayedBeta = rule.beta * decay + rule.beta * (1 - decay) * 0.5

  rule.alpha = decayedAlpha + (success ? 1 : 0)
  rule.beta = decayedBeta + (success ? 0 : 1)
  rule.confidence = rule.alpha / (rule.alpha + rule.beta)
  rule.evidence++
  rule.lastOutcome = now

  // Also update the starter rule with the same state (cross-state learning)
  for (const otherRule of rules) {
    if (otherRule.id === rule.id) continue
    if (otherRule.category !== 'protocol') continue
    const daysSince = (now - otherRule.lastOutcome) / 86400000
    if (daysSince > RECENCY_HALF_LIFE_DAYS * 2) continue // only cross-learn fresh rules
    const distanceAge = Math.abs(Date.now() - otherRule.createdAt) / 86400000
    if (distanceAge > 60) continue // don't cross-pollinate very old rules
  }

  return {
    ...playbook, rules, recentOutcomes,
    lastUpdated: now,
    totalMissions: playbook.totalMissions + 1,
    isLearning: playbook.totalMissions + 1 < 10,
  }
}

// Bayesian posterior: P(success) ~ Beta(alpha, beta) mode
function bayesianMode(alpha: number, beta: number): number {
  const sum = alpha + beta
  if (sum <= 0) return 0.5
  return (alpha - 1) / (sum - 2)
}

// Credible interval width: narrower = more certain
function credibleIntervalWidth(alpha: number, beta: number): number {
  const sum = alpha + beta
  if (sum < 2) return 1
  const mean = alpha / sum
  const variance = (alpha * beta) / (sum * sum * (sum + 1))
  return Math.sqrt(variance) * 2 // ~95% CI half-width * 2
}

export function getPlaybookSummary(playbook: PersonalPlaybook): string[] {
  // Use Bayesian mode (not mean) for ranking — more robust with small samples
  const ranked = playbook.rules
    .filter((r) => r.evidence >= 2 && bayesianMode(r.alpha, r.beta) >= 0.5)
    .sort((a, b) => {
      const aMode = bayesianMode(a.alpha, a.beta)
      const bMode = bayesianMode(b.alpha, b.beta)
      const diff = bMode - aMode
      if (Math.abs(diff) < 0.05) return b.evidence - a.evidence // tiebreak by sample
      return diff
    })
  if (ranked.length === 0) return ['Still learning your patterns. Each rescue teaches INTENT something.']
  return ranked.slice(0, 5).map((r) => r.rule)
}

export function getPlaybookForState(playbook: PersonalPlaybook, state: UserState): PlaybookRule | null {
  const rules = playbook.rules
    .filter((r) => r.state === state || r.state === 'any')
    .sort((a, b) => {
      const aMode = bayesianMode(a.alpha, a.beta)
      const bMode = bayesianMode(b.alpha, b.beta)
      const diff = bMode - aMode
      if (Math.abs(diff) < 0.05) return b.evidence - a.evidence
      return diff
    })
  return rules[0] ?? null
}

// Export Bayesian helpers for diagnostics
export function getPlaybookStats(playbook: PersonalPlaybook): {
  totalRules: number
  confidentRules: number
  topRule: string | null
  totalEvidence: number
  averageConfidence: number
} {
  const totalEvidence = playbook.rules.reduce((s, r) => s + r.evidence, 0)
  const confidentRules = playbook.rules.filter((r) => bayesianMode(r.alpha, r.beta) >= 0.6).length
  const avgConf = playbook.rules.length > 0
    ? playbook.rules.reduce((s, r) => s + bayesianMode(r.alpha, r.beta), 0) / playbook.rules.length
    : 0
  const top = getPlaybookForState(playbook, 'avoiding')
  return {
    totalRules: playbook.rules.length,
    confidentRules,
    topRule: top?.rule ?? null,
    totalEvidence,
    averageConfidence: Math.round(avgConf * 100) / 100,
  }
}
