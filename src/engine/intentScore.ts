// ══════════════════════════════════════════════════════════════
// INTENT — Intent Score Engine
// "How often did you convert intention into action?"
// ══════════════════════════════════════════════════════════════

export interface IntentScoreComponents {
  startRate: number          // 0-1: how often user starts after rescue prompt
  rescueCompletion: number   // 0-1: rescue missions completed
  salvageRate: number        // 0-1: failed missions salvaged
  comebackRate: number       // 0-1: came back after drift
  reducedDrift: number       // 0-1: drift signals decreased over time
  planningLoopAvoidance: number // 0-1: avoided planning loops
  beforeScrollWins: number   // 0-1: before-scroll missions completed
  missionFit: number         // 0-1: missions rated "just right" or "helped"
  consistency: number        // 0-1: regular usage without streak shame
}

export interface IntentScore {
  total: number // 0-100
  components: IntentScoreComponents
  label: string
  description: string
  confidence: 'low' | 'medium' | 'high'
}

// ── Calculate Intent Score ─────────────────────────────────

export function calculateIntentScore(components: IntentScoreComponents): IntentScore {
  const weights = {
    startRate: 0.20,
    rescueCompletion: 0.15,
    salvageRate: 0.10,
    comebackRate: 0.15,
    reducedDrift: 0.10,
    planningLoopAvoidance: 0.05,
    beforeScrollWins: 0.10,
    missionFit: 0.10,
    consistency: 0.05,
  }

  const total = Math.round(
    (components.startRate * weights.startRate +
    components.rescueCompletion * weights.rescueCompletion +
    components.salvageRate * weights.salvageRate +
    components.comebackRate * weights.comebackRate +
    components.reducedDrift * weights.reducedDrift +
    components.planningLoopAvoidance * weights.planningLoopAvoidance +
    components.beforeScrollWins * weights.beforeScrollWins +
    components.missionFit * weights.missionFit +
    components.consistency * weights.consistency) * 100
  )

  return {
    total,
    components,
    label: getScoreLabel(total),
    description: getScoreDescription(total),
    confidence: getConfidence(components),
  }
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Strong converter'
  if (score >= 60) return 'Building momentum'
  if (score >= 40) return 'Finding rhythm'
  if (score >= 20) return 'Starting to move'
  return 'Early days'
}

function getScoreDescription(score: number): string {
  if (score >= 80) return 'You turn stuck moments into action most of the time.'
  if (score >= 60) return 'You are building a pattern of converting intention into movement.'
  if (score >= 40) return 'Some moments are turning into action. That matters.'
  if (score >= 20) return 'Every rescue teaches the app what works for you.'
  return 'This score learns from your first rescues. It gets more useful over time.'
}

function getConfidence(components: IntentScoreComponents): 'low' | 'medium' | 'high' {
  const avg = Object.values(components).reduce((a, b) => a + b, 0) / Object.values(components).length
  if (avg > 0.7) return 'high'
  if (avg > 0.3) return 'medium'
  return 'low'
}

// ── Score Copy ─────────────────────────────────────────────

export function getScoreDisclaimer(): string {
  return 'Intent Score is not your worth. It measures how often the app helped you turn stuck moments into action.'
}

export function getScoreTrend(current: number, previous: number): string {
  const diff = current - previous
  if (diff > 5) return 'Improving'
  if (diff < -5) return 'Shifting'
  return 'Stable'
}
