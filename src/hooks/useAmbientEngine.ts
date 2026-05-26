import { useEffect, useRef } from 'react'
import { useAppStore } from '../store'
import { getRecommendedNotificationSchedule, processSystemEvent } from '../services/systemBridge'
import type { QuietHoursConfig } from '../types/ambient'
import { scheduleDangerWindowNotifications } from '../services/notifications'
import type { UserIntelligenceProfile } from '../engine/predictiveEngine'

/** Create a minimal valid UserIntelligenceProfile when full profile data isn't available. */
function createFallbackProfile(totalDataPoints: number): UserIntelligenceProfile {
  return {
    timeSlots: [],
    dangerWindows: [],
    resistanceMap: [],
    hourlyPattern: Array.from({ length: 24 }, () => 0),
    dailyPattern: Array.from({ length: 7 }, () => 0),
    avgSessionDuration: 0,
    avgAbandonTime: 0,
    recoveryTime: 0,
    mostProductiveHour: 9,
    leastProductiveHour: 3,
    totalDataPoints,
    lastUpdated: new Date().toISOString(),
    patternConfidence: 0,
  }
}

/**
 * Ambient engine hook — runs the predictive engine silently on app open.
 * Uses the system bridge to coordinate retention, prediction, and notifications.
 * Throttled to once per 5 minutes. Never crashes the app.
 */
export function useAmbientEngine() {
  const sessionCount = useAppStore(s => s.sessions.length)
  const lastRunRef = useRef(0)

  useEffect(() => {
    const now = Date.now()
    if (now - lastRunRef.current < 5 * 60 * 1000) return
    if (sessionCount < 3) return // Lowered from 5 to 3

    lastRunRef.current = now

    try {
      const state = useAppStore.getState()

      // Use system bridge for coordinated response
      const response = processSystemEvent(
        { type: 'app_opened', source: 'warm_start' },
        {
          retentionState: state.retentionState,
          sessions: state.sessions,
          patterns: state.resistancePatterns,
          distractions: state.distractions,
          momentumEvents: state.momentumEvents,
          missions: state.missions,
          microMissions: state.microMissions,
          brainDumps: state.brainDumps,
          userPatterns: null,
          quietHours: null,
          userName: state.user?.display_name ?? null,
        },
      )

      // Schedule notifications based on system response
      if (response.notificationToSchedule?.optimalTime) {
        try {
          if (response.prediction?.nextDangerWindow) {
            void scheduleDangerWindowNotifications(
              [response.prediction.nextDangerWindow],
              createFallbackProfile(sessionCount),
            )
          }
        } catch {
          // Notification scheduling is best-effort
        }
      }

      // Get recommended notification schedule
      const schedule = getRecommendedNotificationSchedule({
        retentionState: state.retentionState,
        sessions: state.sessions,
        patterns: state.resistancePatterns,
        distractions: state.distractions,
        momentumEvents: state.momentumEvents,
        missions: state.missions,
        microMissions: state.microMissions,
        brainDumps: state.brainDumps,
        userPatterns: null,
        quietHours: null,
        userName: state.user?.display_name ?? null,
      })

      // Log schedule recommendations for debugging
      if (__DEV__ && schedule.length > 0) {
        console.log('[AmbientEngine] Recommended notifications:', schedule.length)
      }
    } catch {
      // Never crash from ambient engine
    }
  }, [sessionCount])
}
