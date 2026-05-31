// ══════════════════════════════════════════════════════════════
// INTENT — Pattern Naming System
//
// Gives the user's recurring patterns human-readable names.
// Turns abstract data into something they can recognize and relate to.
// Also generates daily insights — one per day, cache-friendly.
// ══════════════════════════════════════════════════════════════

import type { UserState } from '../types/moment'
import type { MissionSession, ResistancePattern } from '../types'

// ── Pattern Name Result ──────────────────────────────────────

export interface PatternName {
  /** Human-friendly pattern name */
  name: string
  /** Encouraging description of the pattern */
  description: string
  /** Emoji icon for the pattern */
  icon: string
}

// ── Named Pattern Definitions ────────────────────────────────

interface NamedPatternDef {
  state: UserState | 'mixed'
  name: string
  icon: string
  /** Returns description based on session stats */
  description: (dominantPercent: number, sessionCount: number) => string
  /** Minimum percentage of sessions in this state to qualify */
  threshold: number
}

const NAMED_PATTERNS: NamedPatternDef[] = [
  {
    state: 'avoiding',
    name: 'The Classic Avoider',
    icon: '🙈',
    threshold: 0.4,
    description: (pct, count) =>
      `${pct}% of your ${count} sessions started from avoidance — but you showed up anyway. That's the part that matters.`,
  },
  {
    state: 'overwhelmed',
    name: 'The Overwhelmed Achiever',
    icon: '🌊',
    threshold: 0.4,
    description: (pct, count) =>
      `You tend to start when things feel like too much. ${pct}% of recent sessions began overwhelmed — and you still pushed through.`,
  },
  {
    state: 'stuck',
    name: 'The Analytical Stuck',
    icon: '🫠',
    threshold: 0.4,
    description: (pct, count) =>
      `You get stuck not from laziness, but from thinking too hard. ${pct}% of sessions started in analysis paralysis.`,
  },
  {
    state: 'tired',
    name: 'The Persistent Tired',
    icon: '😴',
    threshold: 0.4,
    description: (pct, count) =>
      `You show up even when exhausted. ${pct}% of sessions started with low energy — that takes real grit.`,
  },
  {
    state: 'anxious',
    name: 'The Anxious Starter',
    icon: '😰',
    threshold: 0.4,
    description: (pct, count) =>
      `Anxiety is your starting signal, not your stop sign. ${pct}% of sessions began anxious — and starting is the hardest part.`,
  },
  {
    state: 'perfectionism',
    name: 'The Perfectionist Paradox',
    icon: '✨',
    threshold: 0.4,
    description: (pct, count) =>
      `Your standards are so high they sometimes freeze you. ${pct}% of sessions began in perfectionism mode.`,
  },
]

// ── Core: Generate Pattern Name ──────────────────────────────

/**
 * Analyzes session history and returns a named pattern if one qualifies.
 * Requires at least 7 sessions to have enough data.
 */
export function generatePatternName(
  sessions: MissionSession[],
  patterns: ResistancePattern[],
): PatternName | null {
  if (sessions.length < 7) return null

  // Count state occurrences across resistance patterns
  const stateCounts: Partial<Record<UserState, number>> = {}
  for (const p of patterns) {
    stateCounts[p.avoidance_state] = (stateCounts[p.avoidance_state] ?? 0) + p.frequency
  }

  const total = Object.values(stateCounts).reduce((sum, c) => sum + c, 0)

  // Find the dominant state
  let dominantState: UserState | null = null
  let dominantCount = 0
  for (const [state, count] of Object.entries(stateCounts)) {
    if (count > dominantCount) {
      dominantState = state as UserState
      dominantCount = count
    }
  }

  if (!dominantState) return null

  const dominantPct = Math.round((dominantCount / total) * 100)

  // Check against named patterns
  for (const def of NAMED_PATTERNS) {
    if (def.state === dominantState && dominantCount / total >= def.threshold) {
      return {
        name: def.name,
        description: def.description(dominantPct, total),
        icon: def.icon,
      }
    }
  }

  // Check for "multifighter" — no single state dominates > 35%
  const maxRatio = dominantCount / total
  if (maxRatio < 0.35 && total >= 10) {
    const topStates = Object.entries(stateCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([state]) => state)

    return {
      name: 'The Multifighter',
      icon: '🥊',
      description: `You don't have one pattern — you fight different battles every time. Your top states: ${topStates.join(', ')}. That's adaptability.`,
    }
  }

  return null
}

// ── Daily Insight ────────────────────────────────────────────

/**
 * Generates one daily insight based on session data.
 * Cache-friendly: same day + same data = same result.
 * Returns null if not enough data (need 5+ sessions).
 */
export function generateInsightOfTheDay(
  sessions: MissionSession[],
  patterns: ResistancePattern[] = [],
): string | null {
  if (sessions.length < 5) return null

  // Deterministic "pick" based on today's date so it rotates daily
  const today = new Date()
  const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()

  const insights: string[] = []

  // Insight: morning vs afternoon completion rates
  const morningSessions = sessions.filter(s => {
    const h = new Date(s.started_at).getHours()
    return h >= 6 && h < 12
  })
  const afternoonSessions = sessions.filter(s => {
    const h = new Date(s.started_at).getHours()
    return h >= 12 && h < 18
  })

  if (morningSessions.length >= 3 && afternoonSessions.length >= 3) {
    const morningSuccess = morningSessions.filter(s => s.status === 'completed').length / morningSessions.length
    const afternoonSuccess = afternoonSessions.filter(s => s.status === 'completed').length / afternoonSessions.length
    if (Math.abs(morningSuccess - afternoonSuccess) > 0.15) {
      const better = morningSuccess > afternoonSuccess ? 'before noon' : 'in the afternoon'
      const pct = Math.round(Math.max(morningSuccess, afternoonSuccess) * 100)
      insights.push(`You complete ${pct}% of sessions started ${better}.`)
    }
  }

  // Insight: hardest day of the week
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayStats: Record<number, { total: number; abandoned: number }> = {}
  for (const s of sessions) {
    const dow = new Date(s.started_at).getDay()
    if (!dayStats[dow]) dayStats[dow] = { total: 0, abandoned: 0 }
    dayStats[dow].total++
    if (s.status === 'abandoned') dayStats[dow].abandoned++
  }
  let worstDay: number | null = null
  let worstRate = 0
  for (const [dow, stats] of Object.entries(dayStats)) {
    if (stats.total >= 2) {
      const rate = stats.abandoned / stats.total
      if (rate > worstRate) {
        worstRate = rate
        worstDay = Number(dow)
      }
    }
  }
  if (worstDay !== null && worstRate > 0.3) {
    insights.push(`Your hardest day is ${dayNames[worstDay]}. It's okay — awareness is the first step.`)
  }

  // Insight: most common resistance state and overall resilience
  if (patterns.length > 0) {
    const patternStates: Partial<Record<UserState, number>> = {}
    for (const p of patterns) {
      patternStates[p.avoidance_state] = (patternStates[p.avoidance_state] ?? 0) + p.frequency
    }
    const sortedPatternEntries = Object.entries(patternStates)
      .sort(([, a], [, b]) => b - a)
    const topState = sortedPatternEntries[0]?.[0] as UserState | undefined

    if (topState) {
      const completedOrSalvaged = sessions.filter(s => s.status === 'completed' || s.status === 'salvaged').length
      const successRate = completedOrSalvaged / sessions.length
      if (successRate > 0.6) {
        const pct = Math.round(successRate * 100)
        insights.push(`Your most common state is '${topState}' — and you still succeed ${pct}% of the time. That's real strength.`)
      }
    }
  }

  // Insight: average session length trend
  const recentSessions = sessions.slice(-10)
  const olderSessions = sessions.slice(0, Math.max(0, sessions.length - 10))
  if (recentSessions.length >= 3 && olderSessions.length >= 3) {
    const recentAvg = recentSessions.reduce((sum, s) => sum + (s.actual_seconds ?? 0), 0) / recentSessions.length
    const olderAvg = olderSessions.reduce((sum, s) => sum + (s.actual_seconds ?? 0), 0) / olderSessions.length
    if (recentAvg > olderAvg * 1.3) {
      insights.push(`Your sessions are getting longer — you're building endurance.`)
    } else if (recentAvg < olderAvg * 0.7) {
      insights.push(`Your sessions are getting shorter. That's fine — consistency beats duration.`)
    }
  }

  // Insight: salvage rate
  const salvaged = sessions.filter(s => s.status === 'salvaged').length
  if (salvaged >= 2) {
    const salvagePct = Math.round((salvaged / sessions.length) * 100)
    insights.push(`${salvagePct}% of your sessions were salvaged — turning tough moments into partial wins.`)
  }

  if (insights.length === 0) return null

  // Deterministic daily rotation
  return insights[daySeed % insights.length]
}
