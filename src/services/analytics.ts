// ══════════════════════════════════════════════════════════════
// INTENT — Analytics (Stubbed)
//
// Events are tracked as no-ops. The write-only MMKV storage and
// feedback loop analysis were removed — data was never read back
// into any feature. Types preserved for downstream consumers.
//
// When analytics matter (100+ users), wire to PostHog or similar.
// ══════════════════════════════════════════════════════════════

import type { SystemEvent, SystemResponse } from './systemBridge'

// ── Types (preserved for consumers) ───────────────────────

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

// ── Stubbed Functions ─────────────────────────────────────

export function trackSystemEvent(
  _event: SystemEvent,
  _response: SystemResponse,
): string {
  // No-op: analytics not wired to any consumer
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
