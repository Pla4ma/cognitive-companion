// ══════════════════════════════════════════════════════════════
// INTENT — Quiet Hours Service
// Manages do-not-disturb periods
// ══════════════════════════════════════════════════════════════

import type { QuietHoursConfig } from '../../types/ambient'

export function createDefaultQuietHours(): QuietHoursConfig {
  return {
    enabled: true,
    startHour: 22,
    startMinute: 0,
    endHour: 7,
    endMinute: 0,
  }
}

export function formatQuietHours(qh: QuietHoursConfig): string {
  if (!qh.enabled) return 'Off'
  return `${formatTime(qh.startHour, qh.startMinute)} – ${formatTime(qh.endHour, qh.endMinute)}`
}

export function getQuietHoursSummary(qh: QuietHoursConfig): string {
  if (!qh.enabled) return 'Quiet hours disabled'
  const duration = getQuietDurationMinutes(qh)
  const hours = Math.floor(duration / 60)
  const mins = duration % 60
  return `${formatTime(qh.startHour, qh.startMinute)} to ${formatTime(qh.endHour, qh.endMinute)} (${hours}h${mins > 0 ? ` ${mins}m` : ''})`
}

export function getQuietDurationMinutes(qh: QuietHoursConfig): number {
  const start = qh.startHour * 60 + qh.startMinute
  const end = qh.endHour * 60 + qh.endMinute
  if (end > start) return end - start
  return (24 * 60 - start) + end // wraps midnight
}

export function getNextQuietHoursEnd(qh: QuietHoursConfig, now: Date = new Date()): Date | null {
  if (!qh.enabled) return null
  const end = new Date(now)
  end.setHours(qh.endHour, qh.endMinute, 0, 0)
  if (end <= now) {
    end.setDate(end.getDate() + 1)
  }
  return end
}

function formatTime(hour: number, minute: number): string {
  const h = hour % 12 || 12
  const m = minute.toString().padStart(2, '0')
  const ampm = hour < 12 ? 'AM' : 'PM'
  return `${h}:${m} ${ampm}`
}
