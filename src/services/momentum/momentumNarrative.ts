// ══════════════════════════════════════════════════════════════
// INTENT — Momentum Identity Engine
// Momentum is about identity, not vanity
// "I am someone who can restart."
// ══════════════════════════════════════════════════════════════

export interface MomentumIdentity {
  narratives: string[]
  strongestPattern: string
  comebackCount: number
  rescuedMoments: number
  averageTimeToStart: number // seconds
  bestProtocol: string | null
  strongestSurface: string | null
  planningLoopsAvoided: number
  beforeScrollWins: number
}

// ── Generate Identity ──────────────────────────────────────

export function generateMomentumIdentity(data: {
  totalRescues: number
  totalSalvages: number
  totalComebacks: number
  avgTimeToStart: number
  bestProtocol: string | null
  strongestSurface: string | null
  planningLoopsAvoided: number
  beforeScrollWins: number
}): MomentumIdentity {
  const narratives: string[] = []

  if (data.totalComebacks >= 5) narratives.push('You restart quickly.')
  if (data.totalRescues >= 10) narratives.push('You show up consistently.')
  if (data.avgTimeToStart < 10) narratives.push('You start fast when it matters.')
  if (data.totalSalvages >= 3) narratives.push('You recover after distraction.')
  if (data.beforeScrollWins >= 5) narratives.push('You choose intentional over autopilot.')
  if (data.planningLoopsAvoided >= 3) narratives.push('You act instead of over-planning.')

  if (narratives.length === 0) {
    narratives.push('You are building comeback strength.')
  }

  return {
    narratives,
    strongestPattern: narratives[0] ?? 'Starting to move',
    comebackCount: data.totalComebacks,
    rescuedMoments: data.totalRescues,
    averageTimeToStart: data.avgTimeToStart,
    bestProtocol: data.bestProtocol,
    strongestSurface: data.strongestSurface,
    planningLoopsAvoided: data.planningLoopsAvoided,
    beforeScrollWins: data.beforeScrollWins,
  }
}

// ── Identity Copy ──────────────────────────────────────────

export function getIdentityHeadline(identity: MomentumIdentity): string {
  return identity.narratives[0] ?? 'Building momentum'
}

export function getIdentitySubcopy(identity: MomentumIdentity): string {
  if (identity.rescuedMoments === 0) return 'Your first rescue starts your story.'
  if (identity.rescuedMoments < 5) return `${identity.rescuedMoments} moments rescued so far.`
  return `${identity.rescuedMoments} moments rescued. ${identity.strongestPattern}`
}

export function getMomentumMetricLabel(metric: string): string {
  const labels: Record<string, string> = {
    rescuedMoments: 'Rescued moments',
    comebackCount: 'Comebacks',
    averageTimeToStart: 'Avg time to start',
    beforeScrollWins: 'Before-scroll wins',
    planningLoopsAvoided: 'Planning loops avoided',
  }
  return labels[metric] ?? metric
}

export function getMomentumMetricValue(metric: string, value: number): string {
  if (metric === 'averageTimeToStart') return `${Math.round(value)}s`
  return String(value)
}
