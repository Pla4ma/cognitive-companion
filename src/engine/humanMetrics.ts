// ══════════════════════════════════════════════════════════════
// INTENT — Human-Readable Metrics
//
// Turns numbers into stories. Minutes into experiences.
// Data into narratives that actually mean something.
// ══════════════════════════════════════════════════════════════

import type { UserState } from '../types/moment'
import type { MissionSession, ResistancePattern } from '../types'

// ── Minutes → Human Experience ───────────────────────────────

interface TimeExperience {
  maxMinutes: number
  label: string
}

const TIME_EXPERIENCES: TimeExperience[] = [
  { maxMinutes: 1, label: 'a deep breath' },
  { maxMinutes: 2, label: 'brushing your teeth' },
  { maxMinutes: 5, label: 'a quick stretch' },
  { maxMinutes: 10, label: 'a short walk' },
  { maxMinutes: 15, label: 'a coffee break' },
  { maxMinutes: 20, label: 'a shower' },
  { maxMinutes: 25, label: 'a pomodoro' },
  { maxMinutes: 30, label: 'an episode of a sitcom' },
  { maxMinutes: 45, label: 'a yoga session' },
  { maxMinutes: 60, label: 'a movie episode' },
  { maxMinutes: 90, label: 'a movie' },
  { maxMinutes: 120, label: 'a long dinner' },
  { maxMinutes: 180, label: 'a concert' },
  { maxMinutes: Infinity, label: 'a marathon' },
]

/**
 * Converts a number of minutes into a relatable human experience.
 * Examples: 5 → "a quick stretch", 30 → "an episode of a sitcom"
 */
export function minutesToHumanExperience(minutes: number): string {
  if (minutes <= 0) return 'a moment'
  for (const exp of TIME_EXPERIENCES) {
    if (minutes <= exp.maxMinutes) return exp.label
  }
  return 'a marathon'
}

// ── Weekly Story ─────────────────────────────────────────────

export interface WeeklyStory {
  headline: string
  body: string
  highlight: string
  shareableText: string
}

/**
 * Generates a narrative weekly summary from session data.
 * Requires 3+ sessions in the week to generate.
 */
export function generateWeeklyStory(
  sessions: MissionSession[],
  patterns: ResistancePattern[],
  userName?: string,
): WeeklyStory | null {
  if (sessions.length < 3) return null

  const name = userName ?? 'You'
  const total = sessions.length
  const completed = sessions.filter(s => s.status === 'completed').length
  const salvaged = sessions.filter(s => s.status === 'salvaged').length
  const abandoned = sessions.filter(s => s.status === 'abandoned').length
  const wins = completed + salvaged

  // Find dominant state from resistance patterns
  const stateCounts: Partial<Record<UserState, number>> = {}
  for (const p of patterns) {
    stateCounts[p.avoidance_state] = (stateCounts[p.avoidance_state] ?? 0) + p.frequency
  }
  const sortedStates = Object.entries(stateCounts)
    .sort(([, a], [, b]) => b - a)
  const topState = sortedStates[0]?.[0] as UserState | undefined
  const topStateCount = sortedStates[0]?.[1] ?? 0

  // Total focused time
  const totalSeconds = sessions.reduce((sum, s) => sum + (s.actual_seconds ?? 0), 0)
  const totalMinutes = Math.round(totalSeconds / 60)

  // Find hardest moment (abandoned session or highest resistance)
  const hardestSession = sessions.find(s => s.status === 'abandoned') ?? sessions[sessions.length - 1]
  const hardestDay = hardestSession
    ? new Date(hardestSession.started_at).toLocaleDateString('en-US', { weekday: 'long', hour: 'numeric' })
    : null

  // Build headline
  const winRate = Math.round((wins / total) * 100)
  let headline: string
  if (winRate >= 80) {
    headline = `${name}'s Strong Week`
  } else if (winRate >= 50) {
    headline = `${name}'s Real Week`
  } else {
    headline = `${name}'s Tough Week — And That's Okay`
  }

  // Build body
  const bodyParts: string[] = []

  if (topState) {
    bodyParts.push(
      `This week you fought '${topState}' ${topStateCount} time${topStateCount > 1 ? 's' : ''} and won ${Math.min(topStateCount, wins)}.`
    )
  }

  if (hardestDay) {
    bodyParts.push(
      `${hardestDay} was your hardest moment — but you showed up anyway.`
    )
  }

  if (totalMinutes > 0) {
    const experience = minutesToHumanExperience(totalMinutes)
    bodyParts.push(
      `You focused for ${totalMinutes} minutes — that's about ${experience} of pure effort.`
    )
  }

  if (salvaged > 0) {
    bodyParts.push(
      `You salvaged ${salvaged} session${salvaged > 1 ? 's' : ''} that could have been lost. That's resilience.`
    )
  }

  // Highlight
  let highlight: string
  if (completed >= 3) {
    highlight = `${completed} sessions completed`
  } else if (salvaged > 0) {
    highlight = `${salvaged} sessions salvaged from tough moments`
  } else {
    highlight = `${total} sessions started — showing up is the hardest part`
  }

  // Shareable text (safe for social sharing — no sensitive state names)
  const shareableText = `This week I showed up ${total} times and focused for ${minutesToHumanExperience(totalMinutes)}. ${winRate >= 50 ? 'Progress over perfection.' : 'Every attempt counts.'} #INTENT`

  return {
    headline,
    body: bodyParts.join(' '),
    highlight,
    shareableText,
  }
}

// ── Comeback Message ─────────────────────────────────────────

export interface ComebackMessage {
  headline: string
  body: string
  tone: 'warm' | 'celebrating' | 'gentle'
}

/**
 * Generates a message for when the user returns after time away.
 * Tone adapts based on how long they've been gone.
 */
export function generateComebackMessage(daysAway: number): ComebackMessage {
  if (daysAway <= 3) {
    return {
      headline: 'Welcome back',
      body: `It's been ${daysAway} day${daysAway > 1 ? 's' : ''}. No judgment — life happens. Ready to pick up where you left off?`,
      tone: 'warm',
    }
  }

  if (daysAway <= 7) {
    return {
      headline: 'Hey, good to see you',
      body: `It's been ${daysAway} days. There's no penalty for taking a break. The fact that you're here now is what matters. Let's start small — what feels doable right now?`,
      tone: 'gentle',
    }
  }

  // 8+ days
  const weeks = Math.floor(daysAway / 7)
  const timeLabel = weeks >= 4
    ? `${Math.floor(daysAway / 30)} month${Math.floor(daysAway / 30) > 1 ? 's' : ''}`
    : `${weeks} week${weeks > 1 ? 's' : ''}`

  return {
    headline: "You're back! 🎉",
    body: `It's been ${timeLabel}. That took courage to open this app again. Most people never come back — but you did. Let's make this return count. What's the smallest thing you could do right now?`,
    tone: 'celebrating',
  }
}
