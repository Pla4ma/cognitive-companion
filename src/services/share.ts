// ══════════════════════════════════════════════════════════════
// INTENT — Shareable Proof Generator
//
// Generates beautiful shareable images/cards for:
//   - Momentum milestones (7-day streak, 100 points, etc.)
//   - Rescue completions ("I just rescued 5 minutes")
//   - Weekly summaries
//   - Comeback stories
//
// Uses React Native's built-in Share API + generates text-based
// share cards (since we can't use canvas/SVG in RN without deps).
//
// The share card is a formatted text + emoji card that looks great
// in iMessage, Twitter, Instagram Stories, etc.
// ══════════════════════════════════════════════════════════════

import { Share } from 'react-native'
import { useAppStore } from '../store'
import { colors } from '../theme'

// ── Types ────────────────────────────────────────────────────

export type ShareCardType =
  | 'daily_rescue'
  | 'streak_milestone'
  | 'momentum_milestone'
  | 'comeback_story'
  | 'weekly_summary'
  | 'mission_complete'
  | 'focus_session'

export interface ShareCardData {
  type: ShareCardType
  title: string
  subtitle: string
  stats: { label: string; value: string }[]
  message: string
  emoji: string
  color: string
  appUrl: string
}

// ── Card Generators ──────────────────────────────────────────

export function generateStreakCard(streakDays: number): ShareCardData {
  const milestones: Record<number, { title: string; emoji: string }> = {
    3: { title: '3-Day Streak!', emoji: '🔥' },
    7: { title: '7-Day Streak!', emoji: '⚡' },
    14: { title: '14-Day Streak!', emoji: '💎' },
    21: { title: '21-Day Streak!', emoji: '🏆' },
    30: { title: '30-Day Streak!', emoji: '👑' },
    60: { title: '60-Day Streak!', emoji: '🌟' },
    100: { title: '100-Day Streak!', emoji: '🚀' },
  }

  const milestone = milestones[streakDays] || { title: `${streakDays}-Day Streak!`, emoji: '🔥' }

  return {
    type: 'streak_milestone',
    title: milestone.title,
    subtitle: "I haven't broken my focus streak",
    stats: [
      { label: 'Days', value: `${streakDays}` },
      { label: 'App', value: 'INTENT' },
    ],
    message: `${milestone.emoji} ${streakDays} days of showing up. No excuses. No breaks.\n\nBuilt with INTENT — the anti-procrastination app that actually works.`,
    emoji: milestone.emoji,
    color: colors.accent.orange,
    appUrl: 'https://intentapp.com',
  }
}

export function generateRescueCard(minutes: number, state: string): ShareCardData {
  return {
    type: 'daily_rescue',
    title: 'Rescue Mission Complete',
    subtitle: `I was feeling ${state}. I did it anyway.`,
    stats: [
      { label: 'Time', value: `${minutes}m` },
      { label: 'State', value: state },
    ],
    message: `🆘 I was feeling ${state.toLowerCase()} — but I rescued ${minutes} minutes of focus.\n\nINTENT catches me when I'm about to drift. It's like having a coach in your pocket.\n\nTry it: https://intentapp.com`,
    emoji: '🆘',
    color: colors.brand[500],
    appUrl: 'https://intentapp.com',
  }
}

export function generateMomentumCard(points: number, trend: 'up' | 'down' | 'stable'): ShareCardData {
  const trendEmoji = trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️'
  const trendText = trend === 'up' ? 'climbing' : trend === 'down' ? 'building back' : 'steady'

  return {
    type: 'momentum_milestone',
    title: `${points} Momentum Points`,
    subtitle: `My momentum is ${trendText}`,
    stats: [
      { label: 'Points', value: `${points}` },
      { label: 'Trend', value: `${trendEmoji} ${trend}` },
    ],
    message: `${trendEmoji} ${points} momentum points this week. My focus is ${trendText}.\n\nINTENT tracks your anti-avoidance patterns and helps you build real momentum.\n\nhttps://intentapp.com`,
    emoji: trendEmoji,
    color: trend === 'up' ? colors.accent.green : colors.brand[500],
    appUrl: 'https://intentapp.com',
  }
}

export function generateWeeklySummaryCard(data: {
  sessions: number
  minutes: number
  streak: number
  rescues: number
  topState: string
}): ShareCardData {
  return {
    type: 'weekly_summary',
    title: 'My Week in Focus',
    subtitle: `${data.sessions} sessions · ${data.minutes} minutes`,
    stats: [
      { label: 'Sessions', value: `${data.sessions}` },
      { label: 'Minutes', value: `${data.minutes}` },
      { label: 'Streak', value: `${data.streak}d` },
      { label: 'Rescues', value: `${data.rescues}` },
    ],
    message: `📊 My week with INTENT:\n\n🎯 ${data.sessions} focus sessions\n⏱ ${data.minutes} minutes of deep work\n🔥 ${data.streak}-day streak\n🆘 ${data.rescues} rescue missions\n\nTop challenge: ${data.topState}\n\nStop procrastinating. Start rescuing.\nhttps://intentapp.com`,
    emoji: '📊',
    color: colors.brand[500],
    appUrl: 'https://intentapp.com',
  }
}

export function generateComebackCard(abandonedCount: number, recoveredCount: number): ShareCardData {
  const rate = abandonedCount > 0 ? Math.round((recoveredCount / abandonedCount) * 100) : 0

  return {
    type: 'comeback_story',
    title: 'Comeback Story',
    subtitle: `I turned ${recoveredCount} abandoned sessions into progress`,
    stats: [
      { label: 'Abandoned', value: `${abandonedCount}` },
      { label: 'Recovered', value: `${recoveredCount}` },
      { label: 'Rate', value: `${rate}%` },
    ],
    message: `💪 Comeback story:\n\nI abandoned ${abandonedCount} sessions. But I recovered ${recoveredCount} of them (${rate}%).\n\nIn most apps, quitting = failure. In INTENT, salvaging = growth.\n\nhttps://intentapp.com`,
    emoji: '💪',
    color: colors.accent.orange,
    appUrl: 'https://intentapp.com',
  }
}

export function generateMissionCompleteCard(missionTitle: string, minutes: number, microsCompleted: number): ShareCardData {
  return {
    type: 'mission_complete',
    title: 'Mission Complete 🎯',
    subtitle: missionTitle,
    stats: [
      { label: 'Time', value: `${minutes}m` },
      { label: 'Steps', value: `${microsCompleted}` },
    ],
    message: `🎯 Mission complete: "${missionTitle}"\n\n⏱ ${minutes} minutes of focused work\n📋 ${microsCompleted} micro-steps completed\n\nINTENT helped me break it down and actually finish.\n\nhttps://intentapp.com`,
    emoji: '🎯',
    color: colors.accent.green,
    appUrl: 'https://intentapp.com',
  }
}

// ── Share Functions ──────────────────────────────────────────

export async function shareCard(card: ShareCardData): Promise<boolean> {
  try {
    const result = await Share.share({
      message: card.message,
      title: card.title,
    })
    return result.action !== Share.dismissedAction
  } catch {
    return false
  }
}

export async function shareStreak(streakDays: number): Promise<boolean> {
  const card = generateStreakCard(streakDays)
  return shareCard(card)
}

export async function shareRescue(minutes: number, state: string): Promise<boolean> {
  const card = generateRescueCard(minutes, state)
  return shareCard(card)
}

export async function shareWeeklySummary(): Promise<boolean> {
  // This would pull from the store in a real implementation
  const card = generateWeeklySummaryCard({
    sessions: 5,
    minutes: 120,
    streak: 3,
    rescues: 2,
    topState: 'avoiding',
  })
  return shareCard(card)
}

// ── Milestone Detection ──────────────────────────────────────

export function checkMilestones(context: {
  streakDays: number
  weeklyPoints: number
  totalSessions: number
  rescuedSessions: number
  abandonedSessions: number
}): ShareCardData | null {
  const { streakDays, weeklyPoints, rescuedSessions, abandonedSessions } = context

  // Streak milestones
  const streakMilestones = [3, 7, 14, 21, 30, 60, 100]
  if (streakMilestones.includes(streakDays)) {
    return generateStreakCard(streakDays)
  }

  // Momentum milestones
  if (weeklyPoints >= 100 && weeklyPoints % 50 === 0) {
    return generateMomentumCard(weeklyPoints, 'up')
  }

  // Comeback milestone
  if (rescuedSessions >= 5 && rescuedSessions % 5 === 0) {
    return generateComebackCard(abandonedSessions, rescuedSessions)
  }

  return null
}
