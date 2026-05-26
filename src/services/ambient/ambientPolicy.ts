// ══════════════════════════════════════════════════════════════
// INTENT — Ambient Policy Engine
// Controls when, how often, and whether to suggest
// ══════════════════════════════════════════════════════════════

import type {
  AmbientModeSettings,
  AmbientSuggestion,
  AmbientTrigger,
  AmbientSurface,
  AmbientPromptType,
  DangerWindow,
  QuietHoursConfig,
} from '../../types/ambient'
import { INTENSITY_DEFAULTS, UNSAFE_NOTIFICATION_PATTERNS } from '../../types/ambient'

// ── Policy Checks ──────────────────────────────────────────

export function isWithinQuietHours(quietHours: QuietHoursConfig, now: Date = new Date()): boolean {
  if (!quietHours.enabled) return false
  const hour = now.getHours()
  const minute = now.getMinutes()
  const currentMinutes = hour * 60 + minute
  const startMinutes = quietHours.startHour * 60 + quietHours.startMinute
  const endMinutes = quietHours.endHour * 60 + quietHours.endMinute

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes
  }
  // Wraps midnight
  return currentMinutes >= startMinutes || currentMinutes < endMinutes
}

export function isDayDisabled(disabledDays: number[], now: Date = new Date()): boolean {
  return disabledDays.includes(now.getDay())
}

export function hasReachedMaxPrompts(suggestionsToday: number, settings: AmbientModeSettings): boolean {
  const intensityMax = INTENSITY_DEFAULTS[settings.intensity].maxPrompts
  const effectiveMax = Math.min(settings.maxPromptsPerDay, intensityMax)
  return suggestionsToday >= effectiveMax
}

export function isInCooldown(consecutiveDismissals: number, lastDismissalAt: string | null): boolean {
  if (consecutiveDismissals < 2 || !lastDismissalAt) return false
  const lastDismissal = new Date(lastDismissalAt).getTime()
  const cooldownMinutes = Math.min(consecutiveDismissals * 30, 240) // 30min per dismissal, max 4hr
  return Date.now() - lastDismissal < cooldownMinutes * 60 * 1000
}

export function isSurfaceAllowed(surface: AmbientSurface, settings: AmbientModeSettings): boolean {
  return settings.allowedSurfaces.includes(surface)
}

export function isTriggerAllowed(trigger: AmbientTrigger, settings: AmbientModeSettings): boolean {
  const triggerToPrompt: Record<AmbientTrigger, AmbientPromptType> = {
    danger_window: 'rescue',
    missed_rescue: 'comeback',
    abandoned_mission: 'comeback',
    comeback: 'comeback',
    before_scroll_window: 'before_scroll',
    context_due_soon: 'context_to_mission',
    user_pattern: 'rescue',
  }
  // All triggers are allowed if ambient is enabled; prompt type filtering happens at copy generation
  return true
}

// ── Should Send Decision ───────────────────────────────────

export interface AmbientPolicyDecision {
  allowed: boolean
  reason: string
  adjustedFrequency?: 'normal' | 'reduced' | 'suppressed'
}

export function evaluateAmbientPolicy(
  settings: AmbientModeSettings,
  suggestionsToday: number,
  consecutiveDismissals: number,
  lastDismissalAt: string | null,
  now: Date = new Date(),
): AmbientPolicyDecision {
  if (!settings.enabled) {
    return { allowed: false, reason: 'Ambient mode is disabled' }
  }

  if (isWithinQuietHours(settings.quietHours, now)) {
    return { allowed: false, reason: 'Within quiet hours' }
  }

  if (isDayDisabled(settings.disabledDays, now)) {
    return { allowed: false, reason: 'Today is a disabled day' }
  }

  if (hasReachedMaxPrompts(suggestionsToday, settings)) {
    return { allowed: false, reason: 'Max prompts reached for today' }
  }

  if (isInCooldown(consecutiveDismissals, lastDismissalAt)) {
    return { allowed: false, reason: 'In cooldown after repeated dismissals', adjustedFrequency: 'suppressed' }
  }

  if (consecutiveDismissals >= 1) {
    return { allowed: true, reason: 'Allowed with reduced frequency', adjustedFrequency: 'reduced' }
  }

  return { allowed: true, reason: 'Allowed', adjustedFrequency: 'normal' }
}

// ── Copy Safety ────────────────────────────────────────────

export function isSafeNotificationCopy(text: string): boolean {
  return !UNSAFE_NOTIFICATION_PATTERNS.some((pattern) => pattern.test(text))
}

export function sanitizeNotificationCopy(text: string, sensitiveMode: boolean): string {
  if (!sensitiveMode) return text

  let sanitized = text
  for (const pattern of UNSAFE_NOTIFICATION_PATTERNS) {
    sanitized = sanitized.replace(pattern, 'tiny action')
  }
  return sanitized
}

// ── Danger Window Matching ─────────────────────────────────

export function isWithinDangerWindow(
  dangerWindows: DangerWindow[],
  now: Date = new Date(),
): DangerWindow | null {
  const currentDay = now.getDay()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  for (const window of dangerWindows) {
    if (!window.enabled) continue
    if (!window.daysOfWeek.includes(currentDay)) continue

    const [startH, startM] = window.startTime.split(':').map(Number)
    const [endH, endM] = window.endTime.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      return window
    }
  }

  return null
}
