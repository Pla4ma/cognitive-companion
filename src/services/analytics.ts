// ══════════════════════════════════════════════════════════════
// INTENT — Analytics + Local Feedback Loop
//
// System-event tracking (stubbed, preserved for downstream consumers).
// Plus: a local-only analytics feedback loop backed by MMKV that
// tracks session completion rates by time-of-day, effective protocols,
// and average session duration — all read back into predictions.
// ══════════════════════════════════════════════════════════════

import { MMKV } from 'react-native-mmkv'
import type { SystemEvent, SystemResponse } from './systemBridge'

const analyticsStorage = new MMKV({ id: 'analytics' })

// ── Local Feedback Loop Types ─────────────────────────────

export interface LocalAnalyticsEvent {
  type: string
  timestamp: number
  data: Record<string, unknown>
}

export interface SessionAnalytics {
  completionRates: Record<string, number> // timeSlot -> rate
  effectiveProtocols: Record<string, string> // state -> best protocol
  avgSessionMinutes: number
  totalSessions: number
}

// ── Local Feedback Loop Functions ─────────────────────────

export function trackEvent(type: string, data: Record<string, unknown> = {}): void {
  try {
    const key = `event_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    analyticsStorage.set(key, JSON.stringify({ type, timestamp: Date.now(), data }))
  } catch { /* never crash */ }
}

export function getSessionAnalytics(): SessionAnalytics {
  try {
    const stored = analyticsStorage.getString('session_analytics')
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return { completionRates: {}, effectiveProtocols: {}, avgSessionMinutes: 0, totalSessions: 0 }
}

export function updateSessionAnalytics(completed: boolean, state: string, protocolId: string, minutes: number): void {
  try {
    const analytics = getSessionAnalytics()
    const hour = new Date().getHours()
    const timeSlot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
    // Update completion rates (exponential moving average)
    const prev = analytics.completionRates[timeSlot] ?? 0
    analytics.completionRates[timeSlot] = prev * 0.9 + (completed ? 1 : 0) * 0.1
    // Update effective protocols
    if (completed) analytics.effectiveProtocols[state] = protocolId
    // Update averages
    analytics.totalSessions += 1
    analytics.avgSessionMinutes = (analytics.avgSessionMinutes * (analytics.totalSessions - 1) + minutes) / analytics.totalSessions
    analyticsStorage.set('session_analytics', JSON.stringify(analytics))
  } catch { /* never crash */ }
}

// ── Types (preserved for system-event consumers) ──────────

export interface AnalyticsEvent {
  id: string
  timestamp: string
  event: string
  properties: Record<string, unknown>
  prescription: string | null
  outcome: 'positive' | 'negative' | 'neutral' | 'unknown'
  outcomeTimestamp: string | null
}

export interface PrescriptionOutcome {
  prescriptionId: string
  prescriptionType: string
  eventTrigger: string
  accepted: boolean
  timeToActionMs: number | null
  sessionCompletedAfter: boolean
  loopsActivated: string[]
}

// ── Stubbed System-Event Functions ────────────────────────

export function trackSystemEvent(
  _event: SystemEvent,
  _response: SystemResponse,
): string {
  // No-op: system-event analytics not wired to any consumer
  return Date.now().toString(36)
}

export function trackPrescriptionOutcome(
  _outcome: PrescriptionOutcome,
): void {
  // No-op
}

export function reportOutcome(
  _event: AnalyticsEvent,
  _outcome: 'positive' | 'negative' | 'neutral',
): void {
  // No-op
}

export function getRecentEvents(_limit: number = 50): AnalyticsEvent[] {
  return []
}

export function getPrescriptionOutcomes(_limit: number = 50): PrescriptionOutcome[] {
  return []
}

export function getLoopEffectiveness(): { loopName: string; activations: number; completionsAfterActivation: number; acceptanceRate: number; avgTimeToActionMs: number }[] {
  return []
}

export function getPrescriptionEffectiveness(): { type: string; total: number; positive: number; negative: number; neutral: number; effectivenessRate: number }[] {
  return []
}

export function clearAnalytics(): void {
  // No-op
}
