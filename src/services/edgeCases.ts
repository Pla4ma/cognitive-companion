// ══════════════════════════════════════════════════════════════
// INTENT — Edge Case Handlers
// Handles unusual states, empty data, and behavioral anomalies.
// All messages are warm, encouraging, and non-judgmental.
// No store imports — data is passed in as parameters.
// ══════════════════════════════════════════════════════════════

import type { MissionSession } from '../types'

// ── Response Types ───────────────────────────────────────────

export interface OnboardingHint {
  showOnboarding: boolean
  message: string
}

export interface DangerWindowFallback {
  message: string
  usePopulationPrior: boolean
}

export interface RapidCompletionResult {
  suspicious: boolean
  message?: string
}

export interface AbandonRateAlert {
  alert: boolean
  message?: string
  suggestedAction?: string
}

export interface AbsenceResult {
  message: string
  suggestedMinutes: number
}

export interface NoPatternsResult {
  message: string
}

// ── Day 0 User ───────────────────────────────────────────────

/**
 * Handles a user who has never completed a session.
 * Returns onboarding guidance without making them feel behind.
 */
export function handleNoSessionsYet(): OnboardingHint {
  return {
    showOnboarding: true,
    message: 'Welcome. INTENT is not about being productive all the time — it is about rescuing the moments when drift starts. Your first rescue is the only one that matters right now.',
  }
}

// ── Danger Window Without Personal Data ──────────────────────

/**
 * When a danger window is detected (by time-of-day) but the user
 * has no personal history to back it up. Falls back to population priors.
 */
export function handleDangerWindowWithNoData(hour: number): DangerWindowFallback {
  // Common population-level danger windows
  const isAfternoonSlump = hour >= 14 && hour <= 16
  const isLateNight = hour >= 21 && hour <= 23
  const isDeepNight = hour >= 0 && hour <= 4

  if (isAfternoonSlump) {
    return {
      message: 'This time of day is tough for a lot of people. Your patterns will sharpen with a few more sessions — for now, a quick 2-minute reset might help.',
      usePopulationPrior: true,
    }
  }

  if (isLateNight) {
    return {
      message: 'Evenings can be a tricky time. We are still learning your patterns — a tiny action now can set up tomorrow.',
      usePopulationPrior: true,
    }
  }

  if (isDeepNight) {
    return {
      message: 'Late night. Rest is a rescue too. If you are up and need a win, a 2-minute action is enough.',
      usePopulationPrior: true,
    }
  }

  return {
    message: 'We are still learning when your tough moments happen. Every session helps us understand you better.',
    usePopulationPrior: true,
  }
}

// ── Rapid Completion Detection ───────────────────────────────

/**
 * Flags sessions completed suspiciously fast (< 30 seconds).
 * Not accusatory — just notes it and suggests the user might have
 * been interrupted or misclicked.
 */
export function handleRapidCompletion(sessionDurationSeconds: number): RapidCompletionResult {
  if (sessionDurationSeconds >= 30) {
    return { suspicious: false }
  }

  if (sessionDurationSeconds < 5) {
    return {
      suspicious: true,
      message: 'That was super quick — did something interrupt you? No worries either way. Every attempt counts.',
    }
  }

  return {
    suspicious: true,
    message: 'Fast finish! If that was a genuine win, nice. If something came up, the data still helps us learn your patterns.',
  }
}

// ── High Abandon Rate ────────────────────────────────────────

/**
 * Detects when more than 50% of sessions in the past 7 days were abandoned.
 * Returns an alert with a suggested action — never shaming.
 */
export function handleHighAbandonRate(sessions: MissionSession[]): AbandonRateAlert {
  const sevenDaysAgo = Date.now() - 7 * 86_400_000
  const recent = sessions.filter(s => new Date(s.started_at).getTime() >= sevenDaysAgo)

  if (recent.length < 3) {
    // Not enough data to judge
    return { alert: false }
  }

  const abandoned = recent.filter(s => s.status === 'abandoned')
  const abandonRate = abandoned.length / recent.length

  if (abandonRate <= 0.5) {
    return { alert: false }
  }

  // High abandon rate — suggest shorter sessions
  const suggestions = [
    'Your sessions might be too long. Try 2-minute rescues — small wins build momentum.',
    'Starting is the hardest part. What if the goal was just showing up for 60 seconds?',
    'The resistance you feel is normal. Shorter missions lower the bar just enough to get moving.',
    'Abandoning sessions is data, not failure. It tells us when to try a different approach.',
  ]

  return {
    alert: true,
    message: suggestions[Math.floor(Math.random() * suggestions.length)],
    suggestedAction: 'Try a 2-minute rescue with no pressure to finish.',
  }
}

// ── Long Absence ─────────────────────────────────────────────

/**
 * Handles a user returning after 30+ days away.
 * Warm welcome, no guilt, suggests a gentle re-entry.
 */
export function handleLongAbsence(daysAway: number): AbsenceResult {
  if (daysAway >= 90) {
    return {
      message: 'It has been a while. Welcome back — genuinely. No catch-up needed. One tiny action today is a fresh start.',
      suggestedMinutes: 2,
    }
  }

  if (daysAway >= 60) {
    return {
      message: 'Welcome back. Two months is a long time, and returning takes courage. Start small — your patterns are still here.',
      suggestedMinutes: 2,
    }
  }

  // 30-59 days
  return {
    message: 'You are back. That is the hardest part done. A quick 2-minute rescue is the perfect way to restart.',
    suggestedMinutes: 2,
  }
}

// ── No Patterns Detected ─────────────────────────────────────

/**
 * When a user has 100+ sessions but the pattern engine cannot find clear trends.
 * Reassures them that variety is not a problem.
 */
export function handleNoPatternsDetected(sessions: MissionSession[]): NoPatternsResult {
  const completed = sessions.filter(s => s.status === 'completed' || s.status === 'salvaged')

  if (completed.length < 10) {
    return {
      message: 'We need a few more sessions to find your patterns. Keep going — every rescue teaches us something.',
    }
  }

  if (completed.length >= 100) {
    return {
      message: 'Your patterns are unique — you are not a creature of habit, and that is a strength. We will keep looking for what works best for you.',
    }
  }

  return {
    message: 'Your patterns are still forming. Each session sharpens the picture — you are building something even if it does not feel like it yet.',
  }
}

// ── Session Quality Helpers ──────────────────────────────────

/**
 * Determines if a session is too short to generate meaningful insights.
 * Minimum meaningful session: 60 seconds.
 */
export function isSessionTooShort(actualSeconds: number): boolean {
  return actualSeconds < 60
}

/**
 * Checks if a user's session history shows a potential burnout pattern:
 * very active periods followed by long gaps.
 */
export function detectBurnoutPattern(sessions: MissionSession[]): {
  detected: boolean
  message?: string
} {
  if (sessions.length < 10) return { detected: false }

  // Sort by date
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
  )

  // Look for sequential high activity → gap patterns (burnout cycles)
  let burnoutCycles = 0
  const dayCounts: Record<string, number> = {}

  for (const s of sorted) {
    const day = s.started_at.slice(0, 10)
    dayCounts[day] = (dayCounts[day] ?? 0) + 1
  }

  const days = Object.keys(dayCounts).sort()
  let inHighPhase = false
  let highPhaseDays = 0

  for (let i = 0; i < days.length; i++) {
    const isHigh = dayCounts[days[i]] >= 5

    if (isHigh) {
      inHighPhase = true
      highPhaseDays++
    } else if (inHighPhase && i > 0) {
      // We were in a high phase — check if this is a gap (3+ days since last active day)
      const gap = (new Date(days[i]).getTime() - new Date(days[i - 1]).getTime()) / 86_400_000
      if (gap >= 3) {
        burnoutCycles++
      }
      inHighPhase = false
      highPhaseDays = 0
    }
  }

  if (burnoutCycles >= 2) {
    return {
      detected: true,
      message: 'You tend to go hard, then need a break. That is human. What if the goal was consistency over intensity — even one tiny action per day?',
    }
  }

  return { detected: false }
}
