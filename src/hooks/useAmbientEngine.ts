import { useEffect, useRef } from 'react'
import { useAppStore } from '../store'
import { getRecommendedNotificationSchedule, processSystemEvent } from '../services/systemBridge'
import type { QuietHoursConfig } from '../types/ambient'
import { scheduleDangerWindowNotifications, scheduleWeeklyNarrative, scheduleComebackNotification } from '../services/notifications'
import type { UserIntelligenceProfile } from '../engine/predictiveEngine'
import { getDaysSinceActivation } from '../services/retention/retentionEngine'
import { generateWeeklyNarrative } from '../engine/insights'
import { MMKV } from 'react-native-mmkv'

const storage = new MMKV()

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
  const user = useAppStore(s => s.user)
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

      // ── FIX 6: Day 14 paywall trigger ──
      const plan = user?.plan ?? 'free'
      const daysSince = getDaysSinceActivation(state.retentionState)
      if (daysSince === 14 && plan === 'free' && !storage.getBoolean('day14_paywall_seen')) {
        // Flag for next app open — the home screen or a dedicated paywall modal
        // can read this flag and show the upgrade prompt
        storage.set('day14_paywall_ready', true)
        if (__DEV__) {
          console.log('[AmbientEngine] Day 14 paywall triggered for free user')
        }
      }

      // ── FIX 7: Weekly narrative notification scheduling ──
      // Runs here so it fires even if user never visits Progress screen
      if (sessionCount >= 7 && sessionCount % 7 === 0) {
        const weekKey = `narrative_ambient_${Math.floor(Date.now() / (7 * 86400000))}`
        if (!storage.getBoolean(weekKey)) {
          try {
            const narrative = generateWeeklyNarrative(
              state.sessions,
              state.resistancePatterns,
              state.distractions,
              user?.display_name ?? '',
            )
            scheduleWeeklyNarrative(narrative, user?.display_name ?? null)
              .then(() => { storage.set(weekKey, true) })
              .catch(() => {})
          } catch {
            // Best-effort
          }
        }
      }

      // ── Comeback notification scheduling ──
      // If user abandoned a session without completing/salvaging, schedule a gentle comeback
      const abandonedSession = state.sessions.find(
        (s) => s.status === 'abandoned' || (s.started_at && !s.ended_at && s.status === 'active'),
      )
      if (abandonedSession) {
        const hoursSinceAbandon = (Date.now() - new Date(abandonedSession.started_at).getTime()) / 3600000
        if (hoursSinceAbandon >= 2) {
          const comebackKey = `comeback_${abandonedSession.id}`
          if (!storage.getBoolean(comebackKey)) {
            try {
              scheduleComebackNotification({
                missionTitle: abandonedSession.title ?? undefined,
                abandonedAfterMinutes: abandonedSession.actual_seconds
                  ? Math.round(abandonedSession.actual_seconds / 60)
                  : undefined,
                state: (abandonedSession.mode as any) ?? undefined,
              }).then((id) => {
                if (id) storage.set(comebackKey, true)
              }).catch(() => {})
            } catch {
              // Best-effort
            }
          }
        }
      }
    } catch {
      // Never crash from ambient engine
    }
  }, [sessionCount])
}
