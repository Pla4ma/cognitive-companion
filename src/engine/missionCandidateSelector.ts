// ══════════════════════════════════════════════════════════════
// INTENT — Multi-Candidate Mission Selection
// Generate candidates, score, choose the best safe option
// ══════════════════════════════════════════════════════════════

import type { UserState } from '../../types/moment'
import type { MicroMission } from '../../types/mission'

export interface MissionCandidate {
  mission: MicroMission
  source: 'deterministic' | 'drift_graph' | 'ai_enhanced' | 'previous_success' | 'fallback'
  scores: CandidateScores
  totalScore: number
}

export interface CandidateScores {
  quality: number         // 0-1: how good the mission is
  successProbability: number // 0-1: likely to complete
  stateFit: number        // 0-1: matches current state
  novelty: number         // 0-1: not same as last 5
  confidence: number      // 0-1: how confident in this pick
  privacySafety: number   // 0-1: no sensitive data exposed
  priorSuccess: number    // 0-1: worked before
  friction: number        // 0-1: lower friction = higher score
}

// ── Score Weights ──────────────────────────────────────────

const WEIGHTS = {
  quality: 0.20,
  successProbability: 0.20,
  stateFit: 0.15,
  novelty: 0.10,
  confidence: 0.10,
  privacySafety: 0.10,
  priorSuccess: 0.10,
  friction: 0.05,
}

// ── Calculate Total Score ──────────────────────────────────

export function calculateTotalScore(scores: CandidateScores): number {
  return Math.round(
    (scores.quality * WEIGHTS.quality +
    scores.successProbability * WEIGHTS.successProbability +
    scores.stateFit * WEIGHTS.stateFit +
    scores.novelty * WEIGHTS.novelty +
    scores.confidence * WEIGHTS.confidence +
    scores.privacySafety * WEIGHTS.privacySafety +
    scores.priorSuccess * WEIGHTS.priorSuccess +
    scores.friction * WEIGHTS.friction) * 100
  )
}

// ── Select Best Candidate ──────────────────────────────────

export function selectBestCandidate(candidates: MissionCandidate[]): {
  best: MissionCandidate | null
  fallback: MissionCandidate | null
  rejected: MissionCandidate[]
} {
  if (candidates.length === 0) return { best: null, fallback: null, rejected: [] }

  // Filter out unsafe candidates
  const safe = candidates.filter((c) => c.scores.privacySafety >= 0.8)
  if (safe.length === 0) {
    // All candidates failed privacy — use fallback
    const fallback = candidates.find((c) => c.source === 'fallback') ?? candidates[0]
    return { best: null, fallback, rejected: candidates }
  }

  // Sort by total score
  const sorted = [...safe].sort((a, b) => b.totalScore - a.totalScore)
  const best = sorted[0]
  const fallback = sorted.find((c) => c.source === 'fallback') ?? sorted[sorted.length - 1]
  const rejected = sorted.slice(1)

  return { best, fallback, rejected }
}

// ── Generate Default Candidates ────────────────────────────

export function generateDefaultCandidates(
  state: UserState,
  duration: number,
  deterministicMission: MicroMission,
  previousSuccess: MicroMission | null,
): MissionCandidate[] {
  const candidates: MissionCandidate[] = []

  // Deterministic template
  candidates.push({
    mission: deterministicMission,
    source: 'deterministic',
    scores: { quality: 0.7, successProbability: 0.6, stateFit: 0.7, novelty: 0.5, confidence: 0.8, privacySafety: 1.0, priorSuccess: 0.5, friction: 0.7 },
    totalScore: 0,
  })

  // Previous success
  if (previousSuccess) {
    candidates.push({
      mission: previousSuccess,
      source: 'previous_success',
      scores: { quality: 0.8, successProbability: 0.8, stateFit: 0.7, novelty: 0.3, confidence: 0.9, privacySafety: 1.0, priorSuccess: 0.9, friction: 0.8 },
      totalScore: 0,
    })
  }

  // Fallback (universal safe)
  candidates.push({
    mission: {
      id: `fallback_${Date.now()}`,
      title: 'Do the smallest possible thing',
      exactAction: 'Open it and read for 2 minutes',
      duration: 2,
      protocolId: 'fallback',
      fallbackAction: 'Just open the app',
      salvageAction: 'You showed up. That counts.',
      bodyDoubleMode: null,
      category: 'rescue',
      createdAt: Date.now(),
    },
    source: 'fallback',
    scores: { quality: 0.6, successProbability: 0.7, stateFit: 0.5, novelty: 0.8, confidence: 0.5, privacySafety: 1.0, priorSuccess: 0.3, friction: 0.9 },
    totalScore: 0,
  })

  // Calculate total scores
  for (const c of candidates) {
    c.totalScore = calculateTotalScore(c.scores)
  }

  return candidates
}

// ── Candidate Explanation ──────────────────────────────────

export function explainCandidateChoice(candidate: MissionCandidate): string {
  const reasons: string[] = []
  if (candidate.scores.priorSuccess > 0.7) reasons.push('worked before')
  if (candidate.scores.stateFit > 0.7) reasons.push('matches your state')
  if (candidate.scores.friction > 0.7) reasons.push('low friction')
  if (candidate.scores.successProbability > 0.7) reasons.push('high success chance')
  return reasons.length > 0 ? reasons.join(', ') : 'best available option'
}
