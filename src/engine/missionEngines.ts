// INTENT — Mission Lifecycle Engines
// Mission candidate selection, salvage, and outcome labeling.
// All the machinery for picking, saving, and naming what happens.

import type { UserState } from '../types/moment'
import type { MicroMission, MissionThread, BlockerType, EnergyLevel } from '../types'
import type { RescueProtocol } from '../types/rescue'
import { RESCUE_PROTOCOLS, getFallbackProtocol } from '../types/rescue'

// ══════════════════════════════════════════════════════════════
// SECTION 1: Multi-Candidate Mission Selection
// ══════════════════════════════════════════════════════════════

export interface MissionCandidate {
  mission: MicroMission
  source: 'deterministic' | 'drift_graph' | 'ai_enhanced' | 'previous_success' | 'fallback'
  scores: CandidateScores
  totalScore: number
}

export interface CandidateScores {
  quality: number
  successProbability: number
  stateFit: number
  novelty: number
  confidence: number
  privacySafety: number
  priorSuccess: number
  friction: number
}

const DEFAULT_WEIGHTS = {
  quality: 0.20, successProbability: 0.20, stateFit: 0.15,
  novelty: 0.10, confidence: 0.10, privacySafety: 0.10,
  priorSuccess: 0.10, friction: 0.05,
}

export interface WeightSet {
  quality: number; successProbability: number; stateFit: number
  novelty: number; confidence: number; privacySafety: number
  priorSuccess: number; friction: number
}

let activeWeights: WeightSet = { ...DEFAULT_WEIGHTS }

export function resetWeights(): void { activeWeights = { ...DEFAULT_WEIGHTS } }

export function getActiveWeights(): WeightSet { return { ...activeWeights } }

type ScoreDimension = keyof CandidateScores

// Tracks whether each dimension was above-average for successful vs failed outcomes
const outcomeHistory: Array<{ scores: CandidateScores; success: boolean }> = []

export function recordOutcome(scores: CandidateScores, success: boolean): void {
  outcomeHistory.push({ scores, success })
  if (outcomeHistory.length > 50) outcomeHistory.shift()
  if (outcomeHistory.length >= 6) relearnWeights()
}

function relearnWeights(): void {
  if (outcomeHistory.length < 6) return

  // Split into successful and failed groups
  const successes = outcomeHistory.filter((o) => o.success)
  const failures = outcomeHistory.filter((o) => !o.success)
  if (successes.length < 3 || failures.length < 3) return

  const dimensions: ScoreDimension[] = [
    'quality', 'successProbability', 'stateFit', 'novelty',
    'confidence', 'privacySafety', 'priorSuccess', 'friction',
  ]

  // For each dimension, compute how much it discriminates success from failure
  const discriminators: { dim: ScoreDimension; power: number }[] = []

  for (const dim of dimensions) {
    const successAvg = successes.reduce((s, o) => s + o.scores[dim], 0) / successes.length
    const failureAvg = failures.reduce((s, o) => s + o.scores[dim], 0) / failures.length
    // Effect size: difference in means relative to pooled std dev
    const successVar = successes.reduce((s, o) => s + (o.scores[dim] - successAvg) ** 2, 0) / successes.length
    const failureVar = failures.reduce((s, o) => s + (o.scores[dim] - failureAvg) ** 2, 0) / failures.length
    const pooledStd = Math.sqrt((successVar + failureVar) / 2) || 0.01
    const effectSize = (successAvg - failureAvg) / pooledStd
    discriminators.push({ dim, power: Math.max(0, effectSize) })
  }

  // Convert discrimination powers to weights
  const totalPower = discriminators.reduce((s, d) => s + d.power, 0)
  if (totalPower <= 0) return

  // Blend learned weights with defaults (smooth adaptation, not sudden)
  for (const { dim, power } of discriminators) {
    const learnedWeight = power / totalPower
    activeWeights[dim] = DEFAULT_WEIGHTS[dim] * 0.7 + learnedWeight * 0.3
  }
}

export function calculateTotalScore(scores: CandidateScores, adaptive: boolean = true): number {
  const w = adaptive ? activeWeights : DEFAULT_WEIGHTS
  return Math.round(
    (scores.quality * w.quality +
    scores.successProbability * w.successProbability +
    scores.stateFit * w.stateFit +
    scores.novelty * w.novelty +
    scores.confidence * w.confidence +
    scores.privacySafety * w.privacySafety +
    scores.priorSuccess * w.priorSuccess +
    scores.friction * w.friction) * 100
  )
}

export function generateCandidates(
  state: UserState,
  duration: number,
  deterministicMission: MicroMission,
  previousSuccess: MicroMission | null,
): MissionCandidate[] {
  const candidates: MissionCandidate[] = []
  candidates.push({
    mission: deterministicMission,
    source: 'deterministic',
    scores: { quality: 0.7, successProbability: 0.6, stateFit: 0.7, novelty: 0.5, confidence: 0.8, privacySafety: 1.0, priorSuccess: 0.5, friction: 0.7 },
    totalScore: 0,
  })
  if (previousSuccess) {
    candidates.push({
      mission: previousSuccess,
      source: 'previous_success',
      scores: { quality: 0.8, successProbability: 0.8, stateFit: 0.7, novelty: 0.3, confidence: 0.9, privacySafety: 1.0, priorSuccess: 0.9, friction: 0.8 },
      totalScore: 0,
    })
  }
  candidates.push({
    mission: {
      id: `fallback_${Date.now()}`, threadId: null,
      title: 'Do the smallest possible thing',
      exactAction: 'Open it and read for 2 minutes',
      status: 'pending', estimatedMinutes: 2, actualMinutes: null,
      resistanceBefore: null, resistanceAfter: null, distractionCaptured: null,
      completionCriteria: 'Read for 2 minutes',
      fallbackMission: 'Just open the app',
      salvageMission: 'You showed up. That counts.',
      protocolId: 'fallback', state: 'overwhelmed', energy: 'medium',
      blocker: null, sortOrder: 0,
      createdAt: new Date().toISOString(), completedAt: null,
      privacyClassification: 'local_only',
    },
    source: 'fallback',
    scores: { quality: 0.6, successProbability: 0.7, stateFit: 0.5, novelty: 0.8, confidence: 0.5, privacySafety: 1.0, priorSuccess: 0.3, friction: 0.9 },
    totalScore: 0,
  })
  for (const c of candidates) { c.totalScore = calculateTotalScore(c.scores) }
  return candidates
}

export function selectBestCandidate(candidates: MissionCandidate[]): {
  best: MissionCandidate | null
  fallback: MissionCandidate | null
  rejected: MissionCandidate[]
} {
  if (candidates.length === 0) return { best: null, fallback: null, rejected: [] }
  const safe = candidates.filter((c) => c.scores.privacySafety >= 0.8)
  if (safe.length === 0) {
    const fallback = candidates.find((c) => c.source === 'fallback') ?? candidates[0]
    return { best: null, fallback, rejected: candidates }
  }
  const sorted = [...safe].sort((a, b) => b.totalScore - a.totalScore)
  return { best: sorted[0], fallback: sorted.find((c) => c.source === 'fallback') ?? sorted[sorted.length - 1], rejected: sorted.slice(1) }
}

export function explainCandidateChoice(candidate: MissionCandidate): string {
  const reasons: string[] = []
  if (candidate.scores.priorSuccess > 0.7) reasons.push('worked before')
  if (candidate.scores.stateFit > 0.7) reasons.push('matches your state')
  if (candidate.scores.friction > 0.7) reasons.push('low friction')
  if (candidate.scores.successProbability > 0.7) reasons.push('high success chance')
  return reasons.length > 0 ? reasons.join(', ') : 'best available option'
}

// ══════════════════════════════════════════════════════════════
// SECTION 2: Salvage Engine — Failure Intelligence
// ══════════════════════════════════════════════════════════════

export interface SalvageInput {
  mission: MicroMission
  thread: MissionThread | null
  abandonmentReason: 'canceled_early' | 'pause_too_long' | 'backgrounded' | 'user_tapped_stuck' | 'timer_ended_incomplete' | 'many_distractions' | 'never_started'
  sessionDurationSeconds: number
  distractionCount: number
  state: UserState
  energy: EnergyLevel
  blocker: BlockerType | null
}

export interface SalvagePlan {
  noShameMessage: string
  partialCredit: string
  smallerVersion: string
  newProtocolId: string
  comebackWhen: string
  bodyDoubleOffer: boolean
  captureBlocker: boolean
  momentumEvent: { type: string; points: number; note: string }
  threadUpdate: { dominantResistance: BlockerType | null; bestProtocol: string | null; needsRecompile: boolean }
}

export function generateSalvagePlan(input: SalvageInput): SalvagePlan {
  const protocol = RESCUE_PROTOCOLS[input.mission.protocolId]
  const fallbackProtocolId = getFallbackProtocol(input.mission.protocolId)
  const fallbackProtocol = RESCUE_PROTOCOLS[fallbackProtocolId]
  return {
    noShameMessage: getNoShameMessage(input.abandonmentReason, input.sessionDurationSeconds),
    partialCredit: getPartialCredit(input.sessionDurationSeconds, input.mission.estimatedMinutes),
    smallerVersion: getSmallerVersion(input.mission, fallbackProtocol),
    newProtocolId: fallbackProtocolId,
    comebackWhen: getComebackTiming(input.state, input.energy),
    bodyDoubleOffer: protocol.bodyDoubleRules.defaultMode !== 'silent_room',
    captureBlocker: !!input.blocker,
    momentumEvent: { type: 'salvage', points: Math.max(1, Math.round(input.sessionDurationSeconds / 60)), note: `Salvaged: ${input.mission.title}` },
    threadUpdate: { dominantResistance: input.blocker, bestProtocol: input.mission.protocolId, needsRecompile: input.abandonmentReason === 'never_started' },
  }
}

function getNoShameMessage(reason: string, durationSeconds: number): string {
  const minutes = Math.round(durationSeconds / 60)
  const messages: Record<string, string> = {
    canceled_early: minutes > 0
      ? `You did ${minutes} minutes. That counts. Want to try a smaller version?`
      : 'Starting is the hardest part. Want to try just 1 minute?',
    pause_too_long: 'You paused. That\'s okay. The mission is still here. Want to restart with less time?',
    backgrounded: 'Life happens. You\'re back. Want the 2-minute version?',
    user_tapped_stuck: 'You\'re stuck. That\'s data. Let\'s try a different approach.',
    timer_ended_incomplete: 'The timer ended. That\'s okay. What did you accomplish? Even a little counts.',
    many_distractions: 'Lots of distractions. That\'s useful to know. Want to try with a shorter timer?',
    never_started: 'You didn\'t start. No judgment. What\'s the smallest possible first step?',
  }
  return messages[reason] || 'This still counts if we learn from it.'
}

function getPartialCredit(durationSeconds: number, estimatedMinutes: number): string {
  const minutes = Math.round(durationSeconds / 60)
  const percent = estimatedMinutes > 0 ? Math.round((minutes / estimatedMinutes) * 100) : 0
  if (percent >= 75) return `You did ${minutes} minutes (${percent}% of the mission). Almost there!`
  if (percent >= 50) return `You did ${minutes} minutes (${percent}%). Solid progress.`
  if (percent >= 25) return `You did ${minutes} minutes (${percent}%). That\'s a start.`
  if (minutes > 0) return `You did ${minutes} minutes. Every minute counts.`
  return 'You showed up. That\'s the first step.'
}

function getSmallerVersion(mission: MicroMission, fallbackProtocol: RescueProtocol): string {
  const fbMinutes = fallbackProtocol.salvageRules.maxFallbackMinutes
  if (fbMinutes <= 1) return 'Open the document. That\'s it. Just open it.'
  if (fbMinutes <= 2) return `Set a 2-minute timer. Do the absolute smallest version of: ${mission.exactAction.slice(0, 50)}`
  return `Set a ${fbMinutes}-minute timer. Do a smaller version of: ${mission.exactAction.slice(0, 50)}`
}

function getComebackTiming(state: UserState, energy: EnergyLevel): string {
  if (state === 'tired' || energy === 'depleted') return 'When you have a bit more energy. Even 5 minutes later.'
  if (state === 'shame_spiral') return 'Right now. No guilt. One tiny thing.'
  if (state === 'avoiding') return 'In 10 minutes. Set a reminder.'
  return 'Whenever you\'re ready. The mission will be here.'
}

export const SALVAGE_COPY = {
  title: 'This still counts.',
  subtitle: 'Failure is data. Let\'s learn from it.',
  partialCredit: 'Partial progress is real progress.',
  noShame: 'No guilt. No shame. Just a smaller restart.',
  options: {
    smaller: 'Try the 2-minute version',
    different: 'Try a different approach',
    blocker: 'Tell me what\'s blocking you',
    reschedule: 'Remind me later',
    rest: 'I need a break',
    done: 'I\'m done for now',
  },
}

// ══════════════════════════════════════════════════════════════
// SECTION 3: Mission Outcome Labels
// Completion is not binary
// ══════════════════════════════════════════════════════════════

export type MissionOutcome =
  | 'completed' | 'partially_completed' | 'started' | 'clarified'
  | 'reduced' | 'delegated' | 'postponed_intentionally' | 'abandoned'
  | 'salvaged' | 'switched' | 'blocked'

export interface OutcomeRecord {
  missionId: string
  outcome: MissionOutcome
  notes: string
  nextAction: string
  timestamp: number
}

export interface OutcomeMeta {
  label: string
  description: string
  countsAsProgress: boolean
  emoji: string
  momentumWeight: number
}

export const OUTCOME_META: Record<MissionOutcome, OutcomeMeta> = {
  completed:                    { label: 'Done', description: 'Mission completed', countsAsProgress: true, emoji: '✓', momentumWeight: 1.0 },
  partially_completed:         { label: 'Partially done', description: 'Made some progress', countsAsProgress: true, emoji: '◐', momentumWeight: 0.7 },
  started:                     { label: 'Started', description: 'Began the action', countsAsProgress: true, emoji: '→', momentumWeight: 0.5 },
  clarified:                   { label: 'Clarified', description: 'Now you know what to do', countsAsProgress: true, emoji: '◎', momentumWeight: 0.4 },
  reduced:                     { label: 'Made smaller', description: 'Reduced to something doable', countsAsProgress: true, emoji: '↘', momentumWeight: 0.3 },
  delegated:                   { label: 'Delegated', description: 'Passed to someone else', countsAsProgress: true, emoji: '↗', momentumWeight: 0.4 },
  postponed_intentionally:     { label: 'Postponed', description: 'Chose to do it later', countsAsProgress: true, emoji: '⏱', momentumWeight: 0.2 },
  abandoned:                   { label: 'Let go', description: 'Decided not to do it', countsAsProgress: false, emoji: '○', momentumWeight: 0.0 },
  salvaged:                    { label: 'Salvaged', description: 'Saved something from it', countsAsProgress: true, emoji: '↻', momentumWeight: 0.6 },
  switched:                    { label: 'Switched', description: 'Moved to a different task', countsAsProgress: false, emoji: '↔', momentumWeight: 0.2 },
  blocked:                     { label: 'Blocked', description: 'Needs something else first', countsAsProgress: false, emoji: '■', momentumWeight: 0.1 },
}

export function getOutcomeMeta(outcome: MissionOutcome): OutcomeMeta { return OUTCOME_META[outcome] }
export function isProgress(outcome: MissionOutcome): boolean { return OUTCOME_META[outcome].countsAsProgress }

export function getOutcomeOptions(): MissionOutcome[] {
  return ['completed', 'partially_completed', 'started', 'clarified', 'reduced', 'salvaged', 'postponed_intentionally', 'abandoned', 'blocked', 'switched']
}

export function getOutcomeCopy(outcome: MissionOutcome): string {
  const meta = OUTCOME_META[outcome]
  return `${meta.emoji} ${meta.label} — ${meta.description}`
}

export function getOutcomePrompt(): string { return 'What happened?' }
