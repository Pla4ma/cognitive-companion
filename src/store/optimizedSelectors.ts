// ══════════════════════════════════════════════════════════════
// INTENT — Optimized Store Selectors
// Selector hooks with shallow comparison to prevent re-renders
// ══════════════════════════════════════════════════════════════

import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../store'
import type { AppState } from '../store'
import type { MissionSession } from '../types'

// ── Primitive / Slice Selectors ──────────────────────────────
// These return a single store value (primitive or stable object),
// so Zustand's default referential equality check is sufficient.

export const useSessions = (): AppState['sessions'] =>
  useAppStore((s) => s.sessions)

export const useActiveSession = (): AppState['activeSession'] =>
  useAppStore((s) => s.activeSession)

export const useUser = (): AppState['user'] =>
  useAppStore((s) => s.user)

export const useRetentionState = (): AppState['retentionState'] =>
  useAppStore((s) => s.retentionState)

export const useMissions = (): AppState['missions'] =>
  useAppStore((s) => s.missions)

export const useBrainDumps = (): AppState['brainDumps'] =>
  useAppStore((s) => s.brainDumps)

// ── Derived / Memoized Selectors ─────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function weekStartStr(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1 // Monday-start
  d.setDate(d.getDate() - diff)
  return d.toISOString().slice(0, 10)
}

export interface TodayStats {
  sessionsToday: number
  minutesToday: number
  completionRate: number
}

/**
 * Memoized derivation of today's session statistics.
 * Only recomputes when `sessions` changes.
 */
export function useTodayStats(): TodayStats {
  const sessions = useAppStore((s) => s.sessions)

  return useMemo(() => {
    const today = todayStr()
    const todaySessions = sessions.filter(
      (s) => s.started_at.slice(0, 10) === today,
    )
    const done = todaySessions.filter(
      (s) => s.status === 'completed' || s.status === 'salvaged',
    )

    return {
      sessionsToday: todaySessions.length,
      minutesToday: Math.round(
        done.reduce((sum, s) => sum + s.actual_seconds, 0) / 60,
      ),
      completionRate:
        todaySessions.length > 0 ? done.length / todaySessions.length : 0,
    }
  }, [sessions])
}

export interface WeeklyStats {
  sessionsThisWeek: number
  minutesThisWeek: number
  completionRate: number
  uniqueDays: number
}

/**
 * Memoized derivation of this week's statistics (Mon–Sun).
 * Only recomputes when `sessions` changes.
 */
export function useWeeklyStats(): WeeklyStats {
  const sessions = useAppStore((s) => s.sessions)

  return useMemo(() => {
    const weekStart = weekStartStr()
    const weekSessions = sessions.filter(
      (s) => s.started_at.slice(0, 10) >= weekStart,
    )
    const done = weekSessions.filter(
      (s) => s.status === 'completed' || s.status === 'salvaged',
    )

    const activeDays = new Set<string>()
    for (const s of done) {
      activeDays.add(s.started_at.slice(0, 10))
    }

    return {
      sessionsThisWeek: weekSessions.length,
      minutesThisWeek: Math.round(
        done.reduce((sum, s) => sum + s.actual_seconds, 0) / 60,
      ),
      completionRate:
        weekSessions.length > 0 ? done.length / weekSessions.length : 0,
      uniqueDays: activeDays.size,
    }
  }, [sessions])
}

// ── Multi-Field Selectors (shallow compare) ───────────────────
// For components that need multiple slice values — useShallow
// prevents re-renders when unrelated store fields change.

/**
 * Select multiple session-related fields with shallow equality.
 * Usage: const { sessions, activeSession, sessionCount } = useSessionSlice()
 */
export function useSessionSlice() {
  return useAppStore(
    useShallow((s) => ({
      sessions: s.sessions,
      activeSession: s.activeSession,
      sessionCount: s.sessionCount,
    })),
  )
}

/**
 * Select user + auth fields with shallow equality.
 */
export function useUserSlice() {
  return useAppStore(
    useShallow((s) => ({
      user: s.user,
      isAuthenticated: s.isAuthenticated,
    })),
  )
}

/**
 * Select distraction-related fields with shallow equality.
 */
export function useDistractionSlice() {
  return useAppStore(
    useShallow((s) => ({
      distractions: s.distractions,
      brainDumps: s.brainDumps,
      resistancePatterns: s.resistancePatterns,
    })),
  )
}

/**
 * Select mission-related fields with shallow equality.
 */
export function useMissionSlice() {
  return useAppStore(
    useShallow((s) => ({
      missions: s.missions,
      microMissions: s.microMissions,
    })),
  )
}
