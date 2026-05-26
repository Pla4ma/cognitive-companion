// ══════════════════════════════════════════════════════════════
// INTENT — Danger Window Engine
// Learns and manages user drift patterns
// ══════════════════════════════════════════════════════════════

import type { DangerWindow, DangerWindowSource } from '../../types/ambient'
import type { UserState } from '../../types/moment'

interface DriftEvent {
  timestamp: string
  state: UserState
  dayOfWeek: number
  hour: number
  minute: number
  outcome: 'drifted' | 'rescued' | 'salvaged'
}

// ── Pattern Detection ──────────────────────────────────────

export function detectDriftPatterns(events: DriftEvent[]): Partial<DangerWindow>[] {
  if (events.length < 5) return [] // Need minimum data

  // Group by day + hour bucket
  const buckets = new Map<string, DriftEvent[]>()
  for (const event of events) {
    const key = `${event.dayOfWeek}-${Math.floor(event.hour / 2) * 2}`
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(event)
  }

  const patterns: Partial<DangerWindow>[] = []

  for (const [key, bucketEvents] of buckets) {
    const [dayStr, hourStr] = key.split('-')
    const day = parseInt(dayStr, 10)
    const hour = parseInt(hourStr, 10)

    // Need at least 3 events in bucket to call it a pattern
    if (bucketEvents.length < 3) continue

    const driftRate = bucketEvents.filter((e) => e.outcome === 'drifted').length / bucketEvents.length
    if (driftRate < 0.4) continue // Not a strong enough pattern

    // Find most common state
    const stateCounts = new Map<UserState, number>()
    for (const e of bucketEvents) {
      stateCounts.set(e.state, (stateCounts.get(e.state) ?? 0) + 1)
    }
    const topState = [...stateCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]

    // Find best protocol from rescues
    const rescued = bucketEvents.filter((e) => e.outcome === 'rescued')

    patterns.push({
      label: `${dayName(day)} ${formatHour(hour)}`,
      startTime: `${hour.toString().padStart(2, '0')}:00`,
      endTime: `${(hour + 2).toString().padStart(2, '0')}:00`,
      daysOfWeek: [day],
      usualState: topState,
      enabled: true,
      source: 'learned_pattern' as DangerWindowSource,
      confidence: Math.min(driftRate, 0.95),
    })
  }

  return patterns
}

// ── Danger Window Validation ───────────────────────────────

export function validateDangerWindow(window: Partial<DangerWindow>): string[] {
  const errors: string[] = []

  if (!window.label || window.label.trim().length === 0) {
    errors.push('Label is required')
  }
  if (!window.startTime || !/^\d{2}:\d{2}$/.test(window.startTime)) {
    errors.push('Start time must be HH:MM format')
  }
  if (!window.endTime || !/^\d{2}:\d{2}$/.test(window.endTime)) {
    errors.push('End time must be HH:MM format')
  }
  if (!window.daysOfWeek || window.daysOfWeek.length === 0) {
    errors.push('At least one day must be selected')
  }
  if (window.daysOfWeek && window.daysOfWeek.some((d) => d < 0 || d > 6)) {
    errors.push('Days must be 0-6 (Sun-Sat)')
  }

  // Validate time range
  if (window.startTime && window.endTime) {
    const [sh, sm] = window.startTime.split(':').map(Number)
    const [eh, em] = window.endTime.split(':').map(Number)
    if (sh === eh && sm === em) {
      errors.push('Start and end time cannot be the same')
    }
  }

  return errors
}

// ── Quick Danger Window Presets ────────────────────────────

export const DANGER_WINDOW_PRESETS: Partial<DangerWindow>[] = [
  {
    label: 'Morning drift',
    startTime: '09:00',
    endTime: '11:00',
    daysOfWeek: [1, 2, 3, 4, 5],
    usualState: 'avoiding',
    source: 'user_defined',
    confidence: 0.5,
  },
  {
    label: 'Afternoon slump',
    startTime: '14:00',
    endTime: '16:00',
    daysOfWeek: [1, 2, 3, 4, 5],
    usualState: 'tired',
    source: 'user_defined',
    confidence: 0.5,
  },
  {
    label: 'Evening doomscroll',
    startTime: '20:00',
    endTime: '22:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    usualState: 'doomscroll_risk',
    source: 'user_defined',
    confidence: 0.5,
  },
  {
    label: 'Weekend avoidance',
    startTime: '10:00',
    endTime: '13:00',
    daysOfWeek: [0, 6],
    usualState: 'overwhelmed',
    source: 'user_defined',
    confidence: 0.5,
  },
  {
    label: 'Late night spiral',
    startTime: '23:00',
    endTime: '01:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    usualState: 'anxious',
    source: 'user_defined',
    confidence: 0.5,
  },
]

// ── Helpers ────────────────────────────────────────────────

function dayName(day: number): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day] ?? 'Day'
}

function formatHour(hour: number): string {
  const h = hour % 12 || 12
  const ampm = hour < 12 ? 'AM' : 'PM'
  return `${h}${ampm}`
}
