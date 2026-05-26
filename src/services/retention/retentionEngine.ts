// ══════════════════════════════════════════════════════════════
// INTENT — Retention Engine
// Real retention loops based on emotional value, not streaks
// ══════════════════════════════════════════════════════════════

import type { UserState } from '../../types'

export type RetentionEvent =
  | 'rescue_started'
  | 'rescue_completed'
  | 'rescue_salvaged'
  | 'comeback_started'
  | 'comeback_completed'
  | 'drift_insight_viewed'
  | 'experiment_selected'
  | 'body_double_started'
  | 'context_capsule_created'
  | 'before_scroll_started'
  | 'weekly_story_viewed'
  | 'notification_action_used'
  | 'widget_rescue_started'

export interface RetentionState {
  totalRescues: number
  totalSalvages: number
  totalComebacks: number
  currentStreak: number // Days with at least 1 rescue (not shame-based)
  longestStreak: number
  lastRescueDate: string | null
  retentionEvents: RetentionEvent[]
  activated: boolean // First rescue completed
  activationDate: string | null
}

export function createEmptyRetentionState(): RetentionState {
  return {
    totalRescues: 0,
    totalSalvages: 0,
    totalComebacks: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastRescueDate: null,
    retentionEvents: [],
    activated: false,
    activationDate: null,
  }
}

export function recordRetentionEvent(
  state: RetentionState,
  event: RetentionEvent,
): RetentionState {
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const newEvents = [...state.retentionEvents, event]

  let newState = { ...state, retentionEvents: newEvents }

  if (event === 'rescue_completed' || event === 'rescue_salvaged') {
    newState.totalRescues += 1

    // Activation
    if (!newState.activated) {
      newState.activated = true
      newState.activationDate = todayStr
    }

    // Streak (not shame-based — just a fact)
    if (newState.lastRescueDate) {
      const lastDate = new Date(newState.lastRescueDate)
      const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / 86400000)
      if (daysDiff === 1) {
        newState.currentStreak += 1
      } else if (daysDiff > 1) {
        newState.currentStreak = 1 // Reset without shame
      }
    } else {
      newState.currentStreak = 1
    }

    newState.longestStreak = Math.max(newState.longestStreak, newState.currentStreak)
    newState.lastRescueDate = todayStr
  }

  if (event === 'rescue_salvaged') {
    newState.totalSalvages += 1
  }

  if (event === 'comeback_completed') {
    newState.totalComebacks += 1
  }

  return newState
}

/**
 * Get the best comeback message based on user's history.
 */
export function getComebackMessage(state: RetentionState): string {
  if (state.totalRescues === 0) {
    return "Welcome to INTENT. Let's rescue your first moment."
  }

  if (state.totalComebacks > 0) {
    return `You've come back ${state.totalComebacks} time${state.totalComebacks > 1 ? 's' : ''}. That's resilience.`
  }

  if (state.currentStreak > 0) {
    return `You're on a ${state.currentStreak}-day streak. But even if that breaks, you can always come back.`
  }

  if (state.lastRescueDate) {
    const daysSince = Math.floor((Date.now() - new Date(state.lastRescueDate).getTime()) / 86400000)
    if (daysSince > 7) {
      return `It's been ${daysSince} days. No guilt. Just one tiny thing.`
    }
    if (daysSince > 1) {
      return `Welcome back. One tiny thing. No pressure.`
    }
  }

  return `Let's find one small thing you can do right now.`
}

/**
 * Determine if we should show the paywall.
 * Only after value has been experienced.
 */
export function shouldShowPaywall(state: RetentionState, featureAttempt: string): boolean {
  // Never show before first rescue
  if (!state.activated) return false

  // Show after 3 rescues if trying a premium feature
  if (state.totalRescues >= 3 && featureAttempt.startsWith('premium_')) {
    return true
  }

  // Show after weekly story preview
  if (featureAttempt === 'weekly_story_full') return true

  // Show after 5 rescues for advanced features
  if (state.totalRescues >= 5) return true

  return false
}
