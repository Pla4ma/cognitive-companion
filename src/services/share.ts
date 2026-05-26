// ══════════════════════════════════════════════════════════════
// INTENT — Share Service
// Weekly summary card generation + native share
// ══════════════════════════════════════════════════════════════

import { Share, Platform } from 'react-native'

export interface WeeklySummaryCard {
  weekOf: string
  sessions: number
  minutes: number
  streak: number
  rescues: number
  topState: string
  completionRate?: number
  salvageRate?: number
  narrative?: string
}

/**
 * Generate a weekly summary card from session data
 */
export function generateWeeklySummaryCard(data: {
  sessions: number
  minutes: number
  streak?: number
  rescues?: number
  topState?: string
  completionRate?: number
  salvageRate?: number
}): WeeklySummaryCard {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  const weekOf = weekStart.toISOString().slice(0, 10)

  return {
    weekOf,
    sessions: data.sessions,
    minutes: data.minutes,
    streak: data.streak ?? 0,
    rescues: data.rescues ?? data.sessions,
    topState: data.topState ?? 'avoiding',
    completionRate: data.completionRate,
    salvageRate: data.salvageRate,
  }
}

/**
 * Build share text from a weekly card
 */
export function buildShareText(card: WeeklySummaryCard): string {
  const lines: string[] = [
    `📊 INTENT — Week of ${card.weekOf}`,
    '',
    `⚡ ${card.minutes} minutes rescued`,
    `✅ ${card.sessions} sessions completed`,
    `💪 Fought "${card.topState}" all week`,
  ]

  if (card.streak > 0) {
    lines.push(`🔥 ${card.streak}-day momentum`)
  }

  if (card.rescues > 0 && card.rescues !== card.sessions) {
    lines.push(`🛡️ ${card.rescues} total rescues`)
  }

  if (card.completionRate !== undefined) {
    lines.push(`📈 ${Math.round(card.completionRate * 100)}% completion rate`)
  }

  if (card.salvageRate !== undefined && card.salvageRate > 0) {
    lines.push(`♻️ ${Math.round(card.salvageRate * 100)}% salvage rate`)
  }

  lines.push('')
  lines.push('No streaks. No shame. Just rescues.')
  lines.push('intent.app')

  return lines.join('\n')
}

/**
 * Share a weekly summary card via native share sheet
 */
export async function shareCard(card: WeeklySummaryCard): Promise<boolean> {
  try {
    const message = buildShareText(card)
    const result = await Share.share(
      {
        message,
        title: 'My INTENT Week',
      },
      {
        dialogTitle: 'Share your weekly progress',
        subject: 'My INTENT Week', // email subject on Android
      },
    )
    return result.action === Share.sharedAction
  } catch {
    return false
  }
}

/**
 * Share plain text
 */
export async function shareText(text: string, title?: string): Promise<boolean> {
  try {
    const result = await Share.share(
      { message: text, title },
      { dialogTitle: title ?? 'Share' },
    )
    return result.action === Share.sharedAction
  } catch {
    return false
  }
}

/**
 * Build a shareable rescue completion message
 */
export function buildRescueShareText(params: {
  state: string
  minutes: number
  protocol?: string
}): string {
  return [
    `🎯 Just rescued ${params.minutes} minutes from "${params.state}"`,
    params.protocol ? `Using: ${params.protocol}` : '',
    '',
    'No streaks. No shame. Just rescues.',
    'intent.app',
  ]
    .filter(Boolean)
    .join('\n')
}
