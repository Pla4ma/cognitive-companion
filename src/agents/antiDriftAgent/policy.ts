// ══════════════════════════════════════════════════════════════
// INTENT — Anti-Drift Agent: Policy Engine
// Decision policies: when to show/hide things, when to use AI, etc.
// ══════════════════════════════════════════════════════════════

import type { UserState, EnergyLevel } from '../../types/moment'
import type { DriftSignal } from '../../types/drift'
import type { InterventionDecisions } from './types'

/**
 * Should we hide stats (momentum, streaks) for this user right now?
 * Yes when: shame_spiral, low_confidence, many abandons, high anxiety
 */
export function shouldHideStats(
  state: UserState,
  abandonCountToday: number,
  signals: DriftSignal[],
): { hide: boolean; reason: string | null } {
  if (state === 'shame_spiral') {
    return { hide: true, reason: 'User is in a shame spiral. Stats could worsen it.' }
  }
  if (state === 'low_confidence') {
    return { hide: true, reason: 'Low confidence. Stats may feel discouraging.' }
  }
  if (abandonCountToday >= 3) {
    return { hide: true, reason: `${abandonCountToday} abandons today. Hide stats to reduce pressure.` }
  }
  const recentAbandonSignals = signals.filter(s => s.type === 'canceled_early' && s.severity >= 3)
  if (recentAbandonSignals.length >= 2) {
    return { hide: true, reason: 'Multiple recent abandons. Reduce pressure.' }
  }
  return { hide: false, reason: null }
}

/**
 * Should we start body double mode?
 */
export function shouldStartBodyDouble(
  state: UserState,
  signals: DriftSignal[],
  abandonCountToday: number,
): { start: boolean; reason: string | null } {
  const bodyDoubleStates: UserState[] = ['stuck', 'low_confidence', 'avoiding', 'shame_spiral']
  if (bodyDoubleStates.includes(state)) {
    return { start: true, reason: `State "${state}" benefits from guided presence.` }
  }
  if (abandonCountToday >= 2) {
    return { start: true, reason: 'Multiple abandons. Body double may help.' }
  }
  const stuckSignals = signals.filter(s => s.type === 'stuck_button_tapped')
  if (stuckSignals.length >= 2) {
    return { start: true, reason: 'User tapped stuck multiple times.' }
  }
  return { start: false, reason: null }
}

/**
 * Should we offer salvage?
 */
export function shouldOfferSalvage(
  signals: DriftSignal[],
  hasActiveSession: boolean,
): { offer: boolean; reason: string | null } {
  if (!hasActiveSession) return { offer: false, reason: null }

  const salvageSignals: DriftSignal['type'][] = [
    'canceled_early',
    'backgrounded_during_session',
    'pause_too_long',
    'stuck_button_tapped',
  ]

  for (const signal of signals) {
    if (salvageSignals.includes(signal.type)) {
      return { offer: true, reason: `Drift signal: ${signal.type}` }
    }
  }
  return { offer: false, reason: null }
}

/**
 * Should we use remote AI for mission compilation?
 */
export function shouldUseRemoteAI(context: {
  localOnlyMode: boolean
  remoteAiEnabled: boolean
  hasContextText: boolean
  hasComplexBlocker: boolean
  deterministicOutputQuality: number // 0-1
}): { use: boolean; reason: string | null } {
  if (context.localOnlyMode) {
    return { use: false, reason: 'Local-only mode. Remote AI disabled.' }
  }
  if (!context.remoteAiEnabled) {
    return { use: false, reason: 'Remote AI not enabled by user.' }
  }
  if (context.deterministicOutputQuality >= 0.8) {
    return { use: false, reason: 'Deterministic output is high quality. No AI needed.' }
  }
  if (context.hasContextText || context.hasComplexBlocker) {
    return { use: true, reason: 'Complex context benefits from AI enhancement.' }
  }
  return { use: false, reason: 'Simple case. Deterministic output sufficient.' }
}

/**
 * Should we suggest a brain dump?
 */
export function shouldSuggestBrainDump(
  state: UserState,
  signals: DriftSignal[],
): boolean {
  if (state === 'overwhelmed' || state === 'scattered') return true
  const thoughtDistractions = signals.filter(s => s.type === 'many_distractions')
  if (thoughtDistractions.length >= 2) return true
  return false
}

/**
 * Should we suggest rest?
 */
export function shouldSuggestRest(
  state: UserState,
  energy: EnergyLevel,
  focusMinutesToday: number,
): boolean {
  if (state === 'tired' || energy === 'depleted') return true
  if (focusMinutesToday >= 120 && ((state as string) === 'tired' || energy === 'low')) return true
  return false
}

/**
 * Should we intercept doomscrolling?
 */
export function shouldInterceptDoomscroll(
  state: UserState,
  signals: DriftSignal[],
): boolean {
  if (state === 'doomscroll_risk') return true
  if (state === 'avoiding' && signals.some(s => s.type === 'app_open_no_start')) return true
  return false
}

/**
 * Build all intervention decisions at once
 */
export function buildInterventionDecisions(context: {
  state: UserState
  energy: EnergyLevel
  signals: DriftSignal[]
  abandonCountToday: number
  hasActiveSession: boolean
  missionsCompletedToday: number
  focusMinutesToday: number
  localOnlyMode: boolean
  remoteAiEnabled: boolean
  hasContextText: boolean
  hasComplexBlocker: boolean
  deterministicOutputQuality: number
}): InterventionDecisions {
  const hideStats = shouldHideStats(context.state, context.abandonCountToday, context.signals)
  const bodyDouble = shouldStartBodyDouble(context.state, context.signals, context.abandonCountToday)
  const salvage = shouldOfferSalvage(context.signals, context.hasActiveSession)
  const remoteAI = shouldUseRemoteAI({
    localOnlyMode: context.localOnlyMode,
    remoteAiEnabled: context.remoteAiEnabled,
    hasContextText: context.hasContextText,
    hasComplexBlocker: context.hasComplexBlocker,
    deterministicOutputQuality: context.deterministicOutputQuality,
  })

  return {
    shouldStartBodyDouble: bodyDouble.start,
    bodyDoubleReason: bodyDouble.reason,
    shouldHideStats: hideStats.hide,
    hideStatsReason: hideStats.reason,
    shouldOfferSalvage: salvage.offer,
    salvageReason: salvage.reason,
    shouldUseRemoteAI: remoteAI.use,
    useRemoteAIReason: remoteAI.reason,
    shouldSuggestBrainDump: shouldSuggestBrainDump(context.state, context.signals),
    shouldSuggestRest: shouldSuggestRest(context.state, context.energy, context.focusMinutesToday),
    shouldInterceptDoomscroll: shouldInterceptDoomscroll(context.state, context.signals),
  }
}
