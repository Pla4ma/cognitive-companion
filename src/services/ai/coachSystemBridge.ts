// ══════════════════════════════════════════════════════════════
// INTENT — Coach ↔ System Bridge
// Gives the Coach AI full visibility into retention state,
// predictive engine data, loop status, and momentum trends.
// This is how the coach knows *everything* the system knows.
// ══════════════════════════════════════════════════════════════

import { useAppStore } from '../../store'
import type { UserState, EnergyLevel, PushStyle } from '../../types'
import type { RetentionState } from '../retention/retentionEngine'
import type { DriftPrediction } from '../../engine/predictiveEngine'
import { predictDrift } from '../../engine/predictiveEngine'
import { getHomeIntelligence } from '../systemBridge'
import type { HomeIntelligence } from '../systemBridge'

export interface CoachContext {
  retentionState: RetentionState
  totalRescues: number
  currentStreak: number
  riskLevel: 'low' | 'moderate' | 'high' | 'critical' | null
  momentumTrend: 'building' | 'stable' | 'cooling'
  isComeback: boolean
  comebackDays: number
  activeLoops: number
  lastSessionMinutes: number
  userName: string | null
  pushStyle: PushStyle
  homeIntelligence: HomeIntelligence | null
  prediction: DriftPrediction | null
}

export function getCoachContext(): CoachContext {
  const state = useAppStore.getState()
  const {
    retentionState,
    sessions,
    resistancePatterns,
    distractions,
    momentumEvents,
    missions,
    microMissions,
    brainDumps,
  } = state
  const userName = state.user?.display_name ?? null
  const pushStyle = (state.user?.push_style as PushStyle) ?? 'gentle'

  // Get home intelligence (bridges retention + predictive + loop data)
  let homeIntelligence: HomeIntelligence | null = null
  try {
    homeIntelligence = getHomeIntelligence({
      sessions,
      retentionState,
      patterns: resistancePatterns,
      distractions,
      momentumEvents,
      missions,
      microMissions,
      brainDumps,
      userPatterns: null,
      quietHours: null,
      userName,
    })
  } catch {
    // Never crash from intelligence gathering
  }

  // Get drift prediction if enough session data
  let prediction: DriftPrediction | null = null
  if (sessions.length >= 5) {
    try {
      prediction = predictDrift({
        sessions,
        patterns: resistancePatterns,
        distractions,
        momentumEvents,
        missions,
        microMissions,
        brainDumps,
      })
    } catch {
      // Never crash from prediction
    }
  }

  // Momentum trend from retention windows
  const last7Days = retentionState.momentumWindows.last7Days
  const momentumTrend = last7Days > 0
    ? (last7Days >= 3 ? 'building' as const : 'stable' as const)
    : 'cooling' as const

  // Last session duration
  const lastSession = sessions.length > 0 ? sessions[sessions.length - 1] : null
  const lastSessionMinutes = lastSession
    ? Math.round(lastSession.actual_seconds / 60)
    : 0

  // Comeback detection
  const comeback = state.getComebackStatus()

  return {
    retentionState,
    totalRescues: retentionState.totalRescues,
    currentStreak: retentionState.currentStreak,
    riskLevel: homeIntelligence?.riskLevel ?? null,
    momentumTrend,
    isComeback: comeback.isComeback,
    comebackDays: comeback.daysAway,
    activeLoops: homeIntelligence?.loopStatus.active ?? 0,
    lastSessionMinutes,
    userName,
    pushStyle,
    homeIntelligence,
    prediction,
  }
}
