// ══════════════════════════════════════════════════════════════
// INTENT — useSessionStats
// Computes today's session stats and consecutive-day streak
// ══════════════════════════════════════════════════════════════

import { useMemo } from 'react'
import { useAppStore } from '../store'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export interface SessionStats {
  totalMinutesToday: number
  sessionCountToday: number
  completionRateToday: number
  streak: number
  todaySessions: ReturnType<typeof useAppStore.getState>['sessions']
  completedToday: number
}

export function useSessionStats(): SessionStats {
  const sessions = useAppStore((s) => s.sessions)

  return useMemo(() => {
    const today = todayStr()
    const todaySessions = sessions.filter(
      (s) => s.started_at.slice(0, 10) === today,
    )
    const completedSalvaged = todaySessions.filter(
      (s) => s.status === 'completed' || s.status === 'salvaged',
    )
    const completedToday = todaySessions.filter(
      (s) => s.status === 'completed',
    ).length

    const totalMinutesToday = Math.round(
      completedSalvaged.reduce((sum, s) => sum + s.actual_seconds, 0) / 60,
    )

    const sessionCountToday = todaySessions.length
    const completionRateToday =
      sessionCountToday > 0
        ? completedSalvaged.length / sessionCountToday
        : 0

    // ── Streak: consecutive days with completed/salvaged sessions ──
    // O(n) using a Set of active date strings
    const activeDays = new Set<string>()
    for (const s of sessions) {
      if (s.status === 'completed' || s.status === 'salvaged') {
        activeDays.add(s.started_at.slice(0, 10))
      }
    }

    let streak = 0
    // Check today first; if no activity today, start counting from yesterday
    let offset = activeDays.has(today) ? 0 : 1
    while (activeDays.has(daysAgo(offset))) {
      streak++
      offset++
    }

    return {
      totalMinutesToday,
      sessionCountToday,
      completionRateToday,
      streak,
      todaySessions,
      completedToday,
    }
  }, [sessions])
}
