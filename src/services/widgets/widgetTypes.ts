// ══════════════════════════════════════════════════════════════
// INTENT — Widget Data Types
// Type definitions and display formatting for home screen widgets
// ══════════════════════════════════════════════════════════════

// ── Core Widget Data ────────────────────────────────────────

export interface WidgetData {
  riskLevel: string
  weeklyMinutes: number
  nextDangerHour: number
  userName: string
  lastSync: string
  momentumTrend: 'building' | 'stable' | 'cooling'
}

export type WidgetSize = 'small' | 'medium' | 'large'

// ── Display Data by Size ────────────────────────────────────

export interface SmallWidgetDisplay {
  riskLabel: string
  riskEmoji: string
  headline: string
}

export interface MediumWidgetDisplay {
  riskLabel: string
  riskEmoji: string
  headline: string
  subline: string
  actionLabel: string
}

export interface LargeWidgetDisplay {
  riskLabel: string
  riskEmoji: string
  headline: string
  subline: string
  actionLabel: string
  weeklyMinutesLabel: string
  nextDangerLabel: string
  momentumLabel: string
}

export type WidgetDisplayData =
  | { size: 'small'; data: SmallWidgetDisplay }
  | { size: 'medium'; data: MediumWidgetDisplay }
  | { size: 'large'; data: LargeWidgetDisplay }

// ── Risk Level Helpers ──────────────────────────────────────

const RISK_EMOJIS: Record<string, string> = {
  low: '🟢',
  moderate: '🟡',
  high: '🟠',
  critical: '🔴',
}

const RISK_LABELS: Record<string, string> = {
  low: 'All clear',
  moderate: 'Stay aware',
  high: 'High risk',
  critical: 'Rescue now',
}

function getRiskEmoji(riskLevel: string): string {
  return RISK_EMOJIS[riskLevel] ?? '⚪'
}

function getRiskLabel(riskLevel: string): string {
  return RISK_LABELS[riskLevel] ?? 'Unknown'
}

// ── Momentum Helpers ────────────────────────────────────────

const MOMENTUM_LABELS: Record<string, string> = {
  building: '🔥 Building momentum',
  stable: '➡️ Steady',
  cooling: '❄️ Cooling off',
}

function getMomentumLabel(trend: 'building' | 'stable' | 'cooling'): string {
  return MOMENTUM_LABELS[trend] ?? '➡️ Steady'
}

// ── Time Helpers ────────────────────────────────────────────

function formatDangerHour(hour: number): string {
  if (hour < 0) return 'No danger window detected'
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour} ${period}`
}

function formatWeeklyMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min this week`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m this week` : `${hours}h this week`
}

// ── Display Data Generator ──────────────────────────────────

export function getWidgetDisplayData(
  widgetData: WidgetData,
  size: WidgetSize,
): WidgetDisplayData {
  const { riskLevel, weeklyMinutes, nextDangerHour, userName, momentumTrend } = widgetData
  const riskEmoji = getRiskEmoji(riskLevel)
  const riskLabel = getRiskLabel(riskLevel)

  if (size === 'small') {
    return {
      size: 'small',
      data: {
        riskLabel,
        riskEmoji,
        headline: weeklyMinutes > 0
          ? `${weeklyMinutes}m rescued`
          : riskLabel,
      },
    }
  }

  if (size === 'medium') {
    const greeting = userName ? `${userName}, ` : ''
    return {
      size: 'medium',
      data: {
        riskLabel,
        riskEmoji,
        headline: `${greeting}${riskLabel.toLowerCase()}`,
        subline: weeklyMinutes > 0
          ? formatWeeklyMinutes(weeklyMinutes)
          : nextDangerHour >= 0
            ? `Next risk: ${formatDangerHour(nextDangerHour)}`
            : 'Start your first rescue',
        actionLabel: riskLevel === 'critical' || riskLevel === 'high'
          ? 'Rescue me'
          : 'Start focus',
      },
    }
  }

  // Large widget
  const greeting = userName ? `${userName}, ` : ''
  return {
    size: 'large',
    data: {
      riskLabel,
      riskEmoji,
      headline: `${greeting}${riskLabel.toLowerCase()}`,
      subline: weeklyMinutes > 0
        ? formatWeeklyMinutes(weeklyMinutes)
        : 'Start your first rescue',
      actionLabel: riskLevel === 'critical' || riskLevel === 'high'
        ? 'Rescue me'
        : 'Start focus session',
      weeklyMinutesLabel: formatWeeklyMinutes(weeklyMinutes),
      nextDangerLabel: nextDangerHour >= 0
        ? `⚠️ Next danger: ${formatDangerHour(nextDangerHour)}`
        : '✅ No danger windows detected',
      momentumLabel: getMomentumLabel(momentumTrend),
    },
  }
}
