// ══════════════════════════════════════════════════════════════
// INTENT — Notification Scheduler
// Smart timing, debouncing, quiet hours, outcome tracking
// ══════════════════════════════════════════════════════════════

import type { QuietHoursConfig } from '../types/ambient'

// ── Types ────────────────────────────────────────────────────

export type NotificationType =
  | 'rescue'
  | 'streak_protection'
  | 'daily_summary'
  | 'danger_window'
  | 'focus_reminder'
  | 'comeback'

export type NotificationAction =
  | 'tapped'
  | 'dismissed'
  | 'action_pressed'
  | 'expired'
  | 'suppressed'

export interface UserNotificationPatterns {
  /** Hours (0-23) when user typically engages with notifications */
  activeHours: number[]
  /** Average response time in minutes */
  avgResponseMinutes: number
  /** Most common action after rescue notification */
  rescueActionRate: number // 0-1, how often they act on rescue notifs
  /** Hours to avoid (user consistently dismisses) */
  lowEngagementHours: number[]
}

export interface ScheduledNotificationRecord {
  id: string
  type: NotificationType
  scheduledFor: Date
  sentAt: Date | null
  outcome: NotificationAction | null
  outcomeAt: Date | null
}

export interface NotificationScheduleResult {
  shouldSchedule: boolean
  scheduledFor: Date | null
  reason: string
}

// ── In-Memory State ──────────────────────────────────────────

/** Map of notificationType -> last sent timestamp (ms) */
const lastSentMap = new Map<NotificationType, number>()

/** Outcome tracking log */
const outcomeLog: ScheduledNotificationRecord[] = []

/** Debounce minimum interval: 20 minutes in ms */
const DEBOUNCE_MS = 20 * 60 * 1000

/** Max tracked outcomes in memory */
const MAX_OUTCOME_LOG = 500

// ── Schedule Optimal Time ────────────────────────────────────
// Picks the best time to send a notification based on user patterns

export function scheduleOptimalTime(
  type: NotificationType,
  userPatterns: UserNotificationPatterns | null,
  quietHours: QuietHoursConfig | null,
  preferredHour?: number,
): NotificationScheduleResult {
  const now = new Date()

  // If we have a preferred hour and it's in the future today, use it
  if (preferredHour !== undefined) {
    const preferred = new Date(now)
    preferred.setHours(preferredHour, 0, 0, 0)

    if (preferred > now && isWithinQuietHours(preferred, quietHours) === false) {
      return {
        shouldSchedule: true,
        scheduledFor: preferred,
        reason: `Scheduled for preferred hour ${preferredHour}`,
      }
    }
  }

  // Use user patterns if available
  if (userPatterns && userPatterns.activeHours.length > 0) {
    const bestHour = findBestHour(type, userPatterns, quietHours, now)
    if (bestHour !== null) {
      const scheduled = new Date(now)
      scheduled.setHours(bestHour, Math.floor(Math.random() * 30), 0, 0)

      // If that time already passed today, schedule for tomorrow
      if (scheduled <= now) {
        scheduled.setDate(scheduled.getDate() + 1)
      }

      return {
        shouldSchedule: true,
        scheduledFor: scheduled,
        reason: `Optimized for user pattern at hour ${bestHour}`,
      }
    }
  }

  // Fallback: schedule based on notification type defaults
  const defaultHour = getDefaultHour(type)
  const scheduled = new Date(now)
  scheduled.setHours(defaultHour, 0, 0, 0)

  if (scheduled <= now) {
    scheduled.setDate(scheduled.getDate() + 1)
  }

  // Check quiet hours
  if (isWithinQuietHours(scheduled, quietHours)) {
    // Push to after quiet hours
    if (quietHours) {
      scheduled.setHours(quietHours.endHour, quietHours.endMinute, 0, 0)
      if (scheduled <= now) {
        scheduled.setDate(scheduled.getDate() + 1)
      }
    }
  }

  return {
    shouldSchedule: true,
    scheduledFor: scheduled,
    reason: `Default scheduling for ${type}`,
  }
}

// ── Debounce ─────────────────────────────────────────────────
// Ensures minimum 20 minutes between same-type notifications

export function debounceNotification(type: NotificationType): boolean {
  const lastSent = lastSentMap.get(type)
  if (lastSent === undefined) return true

  const elapsed = Date.now() - lastSent
  return elapsed >= DEBOUNCE_MS
}

/** Call this when a notification is actually sent */
export function markNotificationSent(type: NotificationType): void {
  lastSentMap.set(type, Date.now())
}

// ── Quiet Hours ──────────────────────────────────────────────

export function isWithinQuietHours(
  time: Date,
  quietHours: QuietHoursConfig | null,
): boolean {
  if (!quietHours || !quietHours.enabled) return false

  const hour = time.getHours()
  const minute = time.getMinutes()
  const timeMinutes = hour * 60 + minute

  const startMinutes = quietHours.startHour * 60 + quietHours.startMinute
  const endMinutes = quietHours.endHour * 60 + quietHours.endMinute

  // Handle overnight quiet hours (e.g., 22:00 - 07:00)
  if (startMinutes > endMinutes) {
    return timeMinutes >= startMinutes || timeMinutes < endMinutes
  }

  // Normal range (e.g., 12:00 - 14:00)
  return timeMinutes >= startMinutes && timeMinutes < endMinutes
}

export function respectsQuietHours(
  time: Date,
  settings: QuietHoursConfig | null,
): boolean {
  return !isWithinQuietHours(time, settings)
}

// ── Outcome Tracking ─────────────────────────────────────────

export function trackNotificationOutcome(
  id: string,
  action: NotificationAction,
): void {
  const record = outcomeLog.find((r) => r.id === id)
  if (record) {
    record.outcome = action
    record.outcomeAt = new Date()
  } else {
    // Create a record even if we don't have the original schedule
    outcomeLog.push({
      id,
      type: 'rescue', // unknown, placeholder
      scheduledFor: new Date(),
      sentAt: new Date(),
      outcome: action,
      outcomeAt: new Date(),
    })
  }

  // Trim log if too large
  if (outcomeLog.length > MAX_OUTCOME_LOG) {
    outcomeLog.splice(0, outcomeLog.length - MAX_OUTCOME_LOG)
  }
}

export function trackNotificationSent(
  id: string,
  type: NotificationType,
  scheduledFor: Date,
): void {
  outcomeLog.push({
    id,
    type,
    scheduledFor,
    sentAt: new Date(),
    outcome: null,
    outcomeAt: null,
  })

  markNotificationSent(type)
}

export function getOutcomeStats(type?: NotificationType): {
  total: number
  tapped: number
  dismissed: number
  actionRate: number
} {
  const filtered = type
    ? outcomeLog.filter((r) => r.type === type && r.outcome !== null)
    : outcomeLog.filter((r) => r.outcome !== null)

  const total = filtered.length
  const tapped = filtered.filter((r) => r.outcome === 'tapped' || r.outcome === 'action_pressed').length
  const dismissed = filtered.filter((r) => r.outcome === 'dismissed').length

  return {
    total,
    tapped,
    dismissed,
    actionRate: total > 0 ? tapped / total : 0,
  }
}

export function getUserPatternsFromHistory(): UserNotificationPatterns | null {
  if (outcomeLog.length < 10) return null // Need minimum data

  const actedOn = outcomeLog.filter(
    (r) => r.outcome === 'tapped' || r.outcome === 'action_pressed',
  )

  if (actedOn.length === 0) return null

  // Find active hours (hours where user tends to engage)
  const hourCounts = new Map<number, number>()
  for (const record of actedOn) {
    const hour = record.sentAt?.getHours() ?? record.scheduledFor.getHours()
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1)
  }

  const activeHours = Array.from(hourCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([hour]) => hour)

  // Find low-engagement hours
  const dismissed = outcomeLog.filter((r) => r.outcome === 'dismissed')
  const dismissedHourCounts = new Map<number, number>()
  for (const record of dismissed) {
    const hour = record.sentAt?.getHours() ?? record.scheduledFor.getHours()
    dismissedHourCounts.set(hour, (dismissedHourCounts.get(hour) ?? 0) + 1)
  }

  const lowEngagementHours = Array.from(dismissedHourCounts.entries())
    .filter(([_, count]) => count >= 3)
    .map(([hour]) => hour)

  return {
    activeHours,
    avgResponseMinutes: 5, // TODO: compute from actual tap timing
    rescueActionRate: actedOn.length / outcomeLog.length,
    lowEngagementHours,
  }
}

// ── Helpers ──────────────────────────────────────────────────

function findBestHour(
  type: NotificationType,
  patterns: UserNotificationPatterns,
  quietHours: QuietHoursConfig | null,
  now: Date,
): number | null {
  // Filter out low-engagement hours and quiet hours
  const candidates = patterns.activeHours.filter((hour) => {
    if (patterns.lowEngagementHours.includes(hour)) return false
    const testTime = new Date(now)
    testTime.setHours(hour, 0, 0, 0)
    if (isWithinQuietHours(testTime, quietHours)) return false
    return true
  })

  if (candidates.length === 0) return null

  // For rescue/danger_window, prefer the soonest good hour
  if (type === 'rescue' || type === 'danger_window') {
    const currentHour = now.getHours()
    const futureHours = candidates.filter((h) => h > currentHour)
    if (futureHours.length > 0) return futureHours[0]
    return candidates[0] // Wrap to tomorrow
  }

  // For daily summary, prefer evening hours
  if (type === 'daily_summary') {
    const evening = candidates.filter((h) => h >= 18)
    if (evening.length > 0) return evening[0]
  }

  // For streak protection, prefer afternoon/evening
  if (type === 'streak_protection') {
    const afternoon = candidates.filter((h) => h >= 14)
    if (afternoon.length > 0) return afternoon[0]
  }

  // Default: pick the most active hour
  return candidates[0]
}

function getDefaultHour(type: NotificationType): number {
  switch (type) {
    case 'rescue': return 10 // 10 AM
    case 'streak_protection': return 20 // 8 PM
    case 'daily_summary': return 21 // 9 PM
    case 'danger_window': return 9 // 9 AM (adjusted per window)
    case 'focus_reminder': return 9 // 9 AM
    case 'comeback': return 11 // 11 AM
    default: return 10
  }
}
