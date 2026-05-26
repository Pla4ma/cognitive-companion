// ══════════════════════════════════════════════════════════════
// INTENT — Suggestion Scheduler
// Determines when to check for ambient suggestions
// ══════════════════════════════════════════════════════════════

import type { AmbientModeSettings, AmbientIntensity } from '../../types/ambient'

interface ScheduleConfig {
  checkIntervalMinutes: number
  preWindowMinutes: number
  postWindowMinutes: number
}

const INTENSITY_SCHEDULE: Record<AmbientIntensity, ScheduleConfig> = {
  low: {
    checkIntervalMinutes: 60,
    preWindowMinutes: 15,
    postWindowMinutes: 15,
  },
  balanced: {
    checkIntervalMinutes: 30,
    preWindowMinutes: 20,
    postWindowMinutes: 10,
  },
  active: {
    checkIntervalMinutes: 15,
    preWindowMinutes: 30,
    postWindowMinutes: 15,
  },
}

export function getScheduleConfig(intensity: AmbientIntensity): ScheduleConfig {
  return INTENSITY_SCHEDULE[intensity]
}

export function getNextCheckTime(settings: AmbientModeSettings, now: Date = new Date()): Date {
  const config = getScheduleConfig(settings.intensity)
  return new Date(now.getTime() + config.checkIntervalMinutes * 60 * 1000)
}

export function shouldCheckNow(settings: AmbientModeSettings, lastCheckAt: string | null, now: Date = new Date()): boolean {
  if (!settings.enabled) return false
  if (!lastCheckAt) return true

  const config = getScheduleConfig(settings.intensity)
  const elapsed = now.getTime() - new Date(lastCheckAt).getTime()
  return elapsed >= config.checkIntervalMinutes * 60 * 1000
}

export function isWithinPreWindow(
  windowStartHHMM: string,
  preMinutes: number,
  now: Date = new Date(),
): boolean {
  const [h, m] = windowStartHHMM.split(':').map(Number)
  const windowStart = new Date(now)
  windowStart.setHours(h, m, 0, 0)

  const preStart = new Date(windowStart.getTime() - preMinutes * 60 * 1000)
  return now >= preStart && now < windowStart
}
