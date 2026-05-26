// ══════════════════════════════════════════════════════════════
// INTENT — Commandless Agent
// No state selection needed — agent recommends based on context
// ══════════════════════════════════════════════════════════════

import type { UserState } from '../../types/moment'

export type DisplayMode = 'strong_recommendation' | 'gentle_suggestion' | 'ask_state' | 'comeback' | 'no_recommendation'
export type RecommendedSurface = 'app' | 'widget' | 'notification' | 'live_activity' | 'shortcut'

export interface CommandlessRecommendation {
  mission: string
  protocol: string
  confidence: number
  reason: string
  fallback: string
  displayMode: DisplayMode
  recommendedSurface: RecommendedSurface
  shouldUseAIEnhancement: boolean
  shouldShowStats: boolean
  shouldShowStateChips: boolean
  shouldShowPlanningLoopWarning: boolean
}

interface CommandlessInput {
  state: UserState | null
  currentHour: number
  totalMissions: number
  totalDays: number
  lastOutcome: string | null
  hasActiveMission: boolean
  planningLoopDetected: boolean
  pendingContextCapsule: boolean
  recentRescueCount: number
}

// ── Generate Recommendation ────────────────────────────────

export function generateCommandlessRecommendation(input: CommandlessInput): CommandlessRecommendation {
  // Active mission → continue/salvage
  if (input.hasActiveMission) {
    return {
      mission: 'Continue your current mission',
      protocol: 'continue',
      confidence: 0.9,
      reason: 'You have an active mission',
      fallback: 'Start a new 2-minute mission',
      displayMode: 'strong_recommendation',
      recommendedSurface: 'app',
      shouldUseAIEnhancement: false,
      shouldShowStats: false,
      shouldShowStateChips: false,
      shouldShowPlanningLoopWarning: false,
    }
  }

  // Planning loop → zero dashboard mode
  if (input.planningLoopDetected) {
    return {
      mission: 'One tiny action. No planning.',
      protocol: 'emergency_start',
      confidence: 0.8,
      reason: 'You have been planning without starting',
      fallback: '2-minute timer, any action',
      displayMode: 'strong_recommendation',
      recommendedSurface: 'app',
      shouldUseAIEnhancement: false,
      shouldShowStats: false,
      shouldShowStateChips: false,
      shouldShowPlanningLoopWarning: true,
    }
  }

  // Pending context → first mission from capsule
  if (input.pendingContextCapsule) {
    return {
      mission: 'Start the first step from your context',
      protocol: 'context_to_mission',
      confidence: 0.7,
      reason: 'You have pending context to act on',
      fallback: 'Review context and pick one action',
      displayMode: 'gentle_suggestion',
      recommendedSurface: 'app',
      shouldUseAIEnhancement: true,
      shouldShowStats: false,
      shouldShowStateChips: false,
      shouldShowPlanningLoopWarning: false,
    }
  }

  // No data → ask state
  if (input.totalMissions < 3) {
    return {
      mission: '',
      protocol: '',
      confidence: 0,
      reason: 'Not enough data yet',
      fallback: 'Start with a 2-minute rescue',
      displayMode: 'ask_state',
      recommendedSurface: 'app',
      shouldUseAIEnhancement: false,
      shouldShowStats: false,
      shouldShowStateChips: true,
      shouldShowPlanningLoopWarning: false,
    }
  }

  // Evening comeback
  if (input.currentHour >= 20 && input.recentRescueCount === 0) {
    return {
      mission: 'One tiny win before the night',
      protocol: 'comeback',
      confidence: 0.6,
      reason: 'No rescues today yet',
      fallback: '2-minute anything',
      displayMode: 'comeback',
      recommendedSurface: 'notification',
      shouldUseAIEnhancement: false,
      shouldShowStats: false,
      shouldShowStateChips: false,
      shouldShowPlanningLoopWarning: false,
    }
  }

  // Default gentle suggestion
  return {
    mission: 'Your easiest next move',
    protocol: 'default',
    confidence: 0.5,
    reason: 'Based on your patterns',
    fallback: '2-minute rescue',
    displayMode: 'gentle_suggestion',
    recommendedSurface: 'app',
    shouldUseAIEnhancement: true,
    shouldShowStats: true,
    shouldShowStateChips: true,
    shouldShowPlanningLoopWarning: false,
  }
}

// ── Recommendation Copy ────────────────────────────────────

export function getCommandlessCopy(mode: DisplayMode): string {
  const copies: Record<DisplayMode, string> = {
    strong_recommendation: 'Start here?',
    gentle_suggestion: 'Your easiest next move',
    ask_state: 'What kind of moment is this?',
    comeback: 'Welcome back. One tiny win?',
    no_recommendation: '',
  }
  return copies[mode]
}

export function getCommandlessReasonCopy(reason: string): string {
  return `Based on: ${reason}`
}
