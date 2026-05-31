// ══════════════════════════════════════════════════════════════
// INTENT — Analytics Feedback Loop
//
// Detects meaningful signals in user behavior:
//   - Pattern changes (new avoidance patterns emerging)
//   - Anomalies (sudden behavior shifts)
//   - Milestones (streaks, completion records)
//   - Regressions (declining engagement)
//
// Only surfaces high-confidence insights. No noise.
// ══════════════════════════════════════════════════════════════

import type { UserState } from '../types/moment'
import type { MissionSession, ResistancePattern } from '../types'

// ── Types ────────────────────────────────────────────────────

export interface AnalyticsInsight {
  type: 'pattern' | 'anomaly' | 'milestone' | 'regression'
  message: string
  /** 0–1 confidence score. Only insights > 0.6 are surfaced. */
  confidence: number
  /** Whether the user can act on this insight */
  actionable: boolean
  /** Suggested next step, if actionable */
  suggestedAction?: string
}

const MIN_CONFIDENCE = 0.6

// ── Main: Generate Analytics Insights ────────────────────────

/**
 * Analyzes sessions and patterns to produce actionable insights.
 * Returns only insights with confidence > 0.6.
 */
export function generateAnalyticsInsights(
  sessions: MissionSession[],
  patterns: ResistancePattern[],
): AnalyticsInsight[] {
  if (sessions.length < 5) return []

  const insights: AnalyticsInsight[] = [
    ...detectDurationTrend(sessions),
    ...detectAbandonRateSpike(sessions),
    ...detectLongestStreak(sessions),
    ...detectNewPattern(sessions, patterns),
    ...detectTimeOfDayShift(sessions),
    ...detectStateEvolution(sessions, patterns),
    ...detectConsistencyMilestone(sessions),
    ...detectComebackPattern(sessions),
  ]

  // Filter by minimum confidence and deduplicate by type
  return insights
    .filter(i => i.confidence >= MIN_CONFIDENCE)
    .sort((a, b) => b.confidence - a.confidence)
}

// ── Detectors ────────────────────────────────────────────────

/**
 * Detects whether session durations are trending up or down.
 */
function detectDurationTrend(sessions: MissionSession[]): AnalyticsInsight[] {
  if (sessions.length < 8) return []

  const mid = Math.floor(sessions.length / 2)
  const older = sessions.slice(0, mid)
  const recent = sessions.slice(mid)

  const olderAvg = avg(older.map(s => s.actual_seconds ?? 0))
  const recentAvg = avg(recent.map(s => s.actual_seconds ?? 0))

  if (olderAvg === 0) return []

  const changeRatio = recentAvg / olderAvg

  if (changeRatio < 0.65) {
    return [{
      type: 'regression',
      message: `Your session durations have dropped by ${Math.round((1 - changeRatio) * 100)}% recently. Sessions are getting shorter — could be efficiency or could be fading focus.`,
      confidence: 0.7,
      actionable: true,
      suggestedAction: 'Try committing to one extra minute next session.',
    }]
  }

  if (changeRatio > 1.4) {
    return [{
      type: 'milestone',
      message: `Your session durations have grown by ${Math.round((changeRatio - 1) * 100)}%. You're building real endurance.`,
      confidence: 0.75,
      actionable: false,
    }]
  }

  return []
}

/**
 * Detects if abandon rate has spiked in recent sessions.
 */
function detectAbandonRateSpike(sessions: MissionSession[]): AnalyticsInsight[] {
  if (sessions.length < 8) return []

  const mid = Math.floor(sessions.length / 2)
  const older = sessions.slice(0, mid)
  const recent = sessions.slice(mid)

  const olderAbandonRate = older.filter(s => s.status === 'abandoned').length / older.length
  const recentAbandonRate = recent.filter(s => s.status === 'abandoned').length / recent.length

  const spike = recentAbandonRate - olderAbandonRate

  if (spike > 0.25) {
    return [{
      type: 'regression',
      message: `Abandon rate has increased from ${Math.round(olderAbandonRate * 100)}% to ${Math.round(recentAbandonRate * 100)}%. Something might be off — let's adjust.`,
      confidence: 0.75,
      actionable: true,
      suggestedAction: 'Shorten your next session target. Small wins rebuild momentum.',
    }]
  }

  return []
}

/**
 * Detects the user's longest completion streak.
 */
function detectLongestStreak(sessions: MissionSession[]): AnalyticsInsight[] {
  let currentStreak = 0
  let longestStreak = 0

  // Sort by date
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
  )

  for (const s of sorted) {
    if (s.status === 'completed' || s.status === 'salvaged') {
      currentStreak++
      longestStreak = Math.max(longestStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  }

  // Check if currently on a streak
  let activeStreak = 0
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].status === 'completed' || sorted[i].status === 'salvaged') {
      activeStreak++
    } else {
      break
    }
  }

  const insights: AnalyticsInsight[] = []

  if (activeStreak >= 3 && activeStreak === longestStreak) {
    insights.push({
      type: 'milestone',
      message: `You're on your longest streak ever — ${activeStreak} sessions without abandoning! Don't break the chain.`,
      confidence: 0.85,
      actionable: true,
      suggestedAction: 'Keep the streak alive. Even a 2-minute session counts.',
    })
  } else if (longestStreak >= 5) {
    insights.push({
      type: 'milestone',
      message: `Your best streak is ${longestStreak} sessions. You've proven you can do it.`,
      confidence: 0.7,
      actionable: false,
    })
  }

  return insights
}

/**
 * Detects if a new state pattern is emerging in recent sessions.
 */
function detectNewPattern(
  sessions: MissionSession[],
  patterns: ResistancePattern[],
): AnalyticsInsight[] {
  if (sessions.length < 10 || patterns.length < 3) return []

  // Split patterns by last_occurred into older and recent halves
  const sortedPatterns = [...patterns].sort(
    (a, b) => new Date(a.last_occurred).getTime() - new Date(b.last_occurred).getTime()
  )
  const mid = Math.floor(sortedPatterns.length / 2)
  const olderPatterns = sortedPatterns.slice(0, mid)
  const recentPatterns = sortedPatterns.slice(mid)

  const olderStates = stateDistribution(olderPatterns)
  const recentStates = stateDistribution(recentPatterns)

  // Find states that appeared significantly more in recent sessions
  for (const [state, recentPct] of Object.entries(recentStates)) {
    const olderPct = olderStates[state as UserState] ?? 0
    if (recentPct > 0.3 && olderPct < 0.15) {
      return [{
        type: 'pattern',
        message: `'${state}' is showing up more often lately (${Math.round(recentPct * 100)}% of recent sessions). It wasn't common before — worth paying attention to.`,
        confidence: 0.65,
        actionable: true,
        suggestedAction: `When '${state}' hits, try the 2-minute rule: just start, then decide.`,
      }]
    }
  }

  return []
}

/**
 * Detects if the user's productive time of day has shifted.
 */
function detectTimeOfDayShift(sessions: MissionSession[]): AnalyticsInsight[] {
  if (sessions.length < 10) return []

  const mid = Math.floor(sessions.length / 2)
  const older = sessions.slice(0, mid)
  const recent = sessions.slice(mid)

  const olderBestSlot = bestTimeSlot(older)
  const recentBestSlot = bestTimeSlot(recent)

  if (olderBestSlot && recentBestSlot && olderBestSlot !== recentBestSlot) {
    return [{
      type: 'pattern',
      message: `Your most productive time has shifted from ${olderBestSlot} to ${recentBestSlot}. Your rhythm is changing.`,
      confidence: 0.6,
      actionable: true,
      suggestedAction: `Try scheduling important sessions during ${recentBestSlot}.`,
    }]
  }

  return []
}

/**
 * Detects if the user's primary struggle state is evolving.
 */
function detectStateEvolution(sessions: MissionSession[], patterns: ResistancePattern[]): AnalyticsInsight[] {
  if (sessions.length < 12 || patterns.length < 4) return []

  // Split patterns into quarters by last_occurred
  const sortedPatterns = [...patterns].sort(
    (a, b) => new Date(a.last_occurred).getTime() - new Date(b.last_occurred).getTime()
  )
  const quarter = Math.floor(sortedPatterns.length / 4)
  const segments = [
    sortedPatterns.slice(0, quarter),
    sortedPatterns.slice(quarter, quarter * 2),
    sortedPatterns.slice(quarter * 2, quarter * 3),
    sortedPatterns.slice(quarter * 3),
  ]

  const dominantStates = segments.map(seg => {
    if (seg.length < 1) return null
    const dist = stateDistribution(seg)
    const sorted = Object.entries(dist).sort(([, a], [, b]) => b - a)
    return sorted[0]?.[0] as UserState | undefined
  })

  // Check if the dominant state has shifted across segments
  const firstDominant = dominantStates[0]
  const lastDominant = dominantStates[dominantStates.length - 1]

  if (
    firstDominant &&
    lastDominant &&
    firstDominant !== lastDominant &&
    dominantStates.filter(s => s === lastDominant).length >= 2
  ) {
    return [{
      type: 'pattern',
      message: `Your main challenge has shifted from '${firstDominant}' to '${lastDominant}'. You're evolving — new battles mean you've won old ones.`,
      confidence: 0.65,
      actionable: false,
    }]
  }

  return []
}

/**
 * Detects consistency milestones (e.g., showing up X days in a row).
 */
function detectConsistencyMilestone(sessions: MissionSession[]): AnalyticsInsight[] {
  // Count unique active days
  const uniqueDays = new Set(
    sessions.map(s => new Date(s.started_at).toISOString().split('T')[0])
  )

  const insights: AnalyticsInsight[] = []

  if (uniqueDays.size >= 30) {
    insights.push({
      type: 'milestone',
      message: `You've shown up across ${uniqueDays.size} different days. That's not motivation — that's discipline.`,
      confidence: 0.8,
      actionable: false,
    })
  } else if (uniqueDays.size >= 14) {
    insights.push({
      type: 'milestone',
      message: `${uniqueDays.size} active days and counting. You're building a real practice.`,
      confidence: 0.7,
      actionable: false,
    })
  }

  return insights
}

/**
 * Detects comeback patterns — returning after abandonments.
 */
function detectComebackPattern(sessions: MissionSession[]): AnalyticsInsight[] {
  if (sessions.length < 8) return []

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
  )

  let comebackCount = 0
  for (let i = 1; i < sorted.length; i++) {
    if (
      sorted[i - 1].status === 'abandoned' &&
      (sorted[i].status === 'completed' || sorted[i].status === 'salvaged')
    ) {
      comebackCount++
    }
  }

  if (comebackCount >= 3) {
    return [{
      type: 'milestone',
      message: `You've come back and succeeded ${comebackCount} times after abandoning a session. You don't let setbacks define you.`,
      confidence: 0.75,
      actionable: false,
    }]
  }

  return []
}

// ── Helpers ──────────────────────────────────────────────────

function avg(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function stateDistribution(patterns: ResistancePattern[]): Partial<Record<UserState, number>> {
  const counts: Partial<Record<UserState, number>> = {}
  for (const p of patterns) {
    counts[p.avoidance_state] = (counts[p.avoidance_state] ?? 0) + p.frequency
  }
  const total = Object.values(counts).reduce((sum, c) => sum + c, 0)
  if (total === 0) return {}
  const dist: Partial<Record<UserState, number>> = {}
  for (const [state, count] of Object.entries(counts)) {
    dist[state as UserState] = count / total
  }
  return dist
}

function bestTimeSlot(sessions: MissionSession[]): string | null {
  const slots: Record<string, { total: number; wins: number }> = {}

  for (const s of sessions) {
    const hour = new Date(s.started_at).getHours()
    let slot: string
    if (hour >= 5 && hour < 12) slot = 'morning'
    else if (hour >= 12 && hour < 17) slot = 'afternoon'
    else if (hour >= 17 && hour < 21) slot = 'evening'
    else slot = 'night'

    if (!slots[slot]) slots[slot] = { total: 0, wins: 0 }
    slots[slot].total++
    if (s.status === 'completed' || s.status === 'salvaged') {
      slots[slot].wins++
    }
  }

  let bestSlot: string | null = null
  let bestRate = 0
  for (const [slot, data] of Object.entries(slots)) {
    if (data.total >= 2) {
      const rate = data.wins / data.total
      if (rate > bestRate) {
        bestRate = rate
        bestSlot = slot
      }
    }
  }

  return bestSlot
}
