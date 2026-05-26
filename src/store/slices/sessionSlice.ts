// ══════════════════════════════════════════════════════════════
// INTENT — Session Slice
// Focus sessions: start, timer, complete, salvage, abandon
// ══════════════════════════════════════════════════════════════

import { StateCreator } from 'zustand'
import type { MissionSession } from '../../types'
import type { CrossSliceActions } from '../types'
import { uid } from '../../utils/uid'
import { updateSessionAnalytics } from '../../services/analytics'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export interface SessionSlice {
  sessions: MissionSession[]
  activeSession: MissionSession | null
  sessionCount: number
  startSession: (missionId?: string, microMissionId?: string, mode?: MissionSession['mode'], plannedMinutes?: number) => string
  updateSessionTimer: (sessionId: string, seconds: number) => void
  pauseSession: () => void
  resumeSession: () => void
  completeSession: (notes?: string) => void
  abandonSession: () => void
  cancelSession: () => void
  salvageSession: (notes?: string) => void
  getSessionsToday: () => MissionSession[]
  getTotalMinutesToday: () => number
}

type SessionGet = () => SessionSlice & CrossSliceActions

export const createSessionSlice: StateCreator<SessionSlice, [], [], SessionSlice> = (set, get) => {
  const cross = () => (get as SessionGet)()

  return {
    sessions: [],
    activeSession: null,
    sessionCount: 0,

    startSession: (missionId, microMissionId, mode = 'focus', plannedMinutes = 25) => {
      // Guard: salvage existing active session before starting new one
      const existing = get().activeSession
      if (existing && existing.status === 'active') {
        get().salvageSession()
      }
      const session: MissionSession = {
        id: uid(), user_id: '',
        mission_id: missionId ?? null, micro_mission_id: microMissionId ?? null,
        mode, planned_minutes: plannedMinutes, actual_seconds: 0, status: 'active',
        started_at: new Date().toISOString(), ended_at: null,
        distractions_captured: 0, resistance_start: null, resistance_end: null,
        notes: null, created_at: new Date().toISOString(),
      }
      set({ activeSession: session })
      return session.id
    },

    updateSessionTimer: (sessionId, seconds) => set((s) => ({
      activeSession: s.activeSession?.id === sessionId ? { ...s.activeSession, actual_seconds: seconds } : s.activeSession,
    }), false),  // false = don't trigger persist middleware on every timer tick

    pauseSession: () => set((s) => ({
      activeSession: s.activeSession ? { ...s.activeSession, status: 'paused' } : null,
    })),

    resumeSession: () => set((s) => ({
      activeSession: s.activeSession ? { ...s.activeSession, status: 'active' } : null,
    })),

    completeSession: (notes) => {
      const state = cross()
      const session = state.activeSession
      if (!session) return
      const completed: MissionSession = {
        ...session, status: 'completed', actual_seconds: session.actual_seconds,
        ended_at: new Date().toISOString(), notes: notes ?? null,
      }
      set((s) => ({
        sessions: [completed, ...s.sessions],
        activeSession: null,
        sessionCount: s.sessionCount + 1,
        // ⚠️ CROSS-SLICE MUTATION: directly updating `missions` (owned by missionSlice)
        // inside the session slice's `set()`. This works because zustand composes all
        // slices into a single flat state, but it creates a hidden dependency.
        // TODO: consider moving mission-status updates to missionSlice via CrossSliceActions.
        // Update linked mission to completed
        missions: session.mission_id
          ? s.missions.map(m =>
              m.id === session.mission_id
                ? { ...m, status: 'completed' as const, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }
                : m
            )
          : s.missions,
      }))
      state.addMomentumEvent('session_completed', 15, undefined, session.mission_id ?? undefined)
      const minutes = Math.round(session.actual_seconds / 60)
      state.recordRetention('rescue_completed', { state: session.mode, minutes: minutes || session.planned_minutes, protocol: 'session' })
      updateSessionAnalytics(true, session.mode, 'session', minutes || session.planned_minutes)
      // Fire analytics feedback event
      try {
        const { trackSystemEvent } = require('../../services/analytics')
        const { processSystemEvent } = require('../../services/systemBridge')
        const s = cross()
        const latestSession = s.sessions[0]
        if (latestSession) {
          const response = processSystemEvent(
            { type: 'session_completed', session: latestSession },
            {
              retentionState: s.retentionState,
              sessions: s.sessions,
              patterns: s.resistancePatterns,
              distractions: s.distractions,
              momentumEvents: s.momentumEvents,
              missions: s.missions,
              microMissions: s.microMissions,
              brainDumps: s.brainDumps,
              userPatterns: null,
              quietHours: null,
              userName: s.user?.display_name ?? null,
            },
          )
          trackSystemEvent({ type: 'session_completed', session: latestSession }, response)
        }
      } catch {}
    },

    abandonSession: () => {
      const state = get()
      const session = state.activeSession
      if (!session) return
      const abandoned: MissionSession = {
        ...session, status: 'abandoned', actual_seconds: session.actual_seconds,
        ended_at: new Date().toISOString(),
      }
      set((s) => ({
        sessions: [abandoned, ...s.sessions],
        activeSession: null,
      }))
    },

    cancelSession: () => {
      get().abandonSession()
    },

    salvageSession: (notes) => {
      const state = cross()
      const session = state.activeSession
      if (!session) return
      const salvaged: MissionSession = {
        ...session, status: 'salvaged', actual_seconds: session.actual_seconds,
        ended_at: new Date().toISOString(), notes: notes ?? null,
      }
      set((s) => ({
        sessions: [salvaged, ...s.sessions],
        activeSession: null,
        sessionCount: s.sessionCount + 1,
        // ⚠️ CROSS-SLICE MUTATION: directly updating `missions` (owned by missionSlice).
        // See comment in completeSession above.
        // Update linked mission to salvaged
        missions: session.mission_id
          ? s.missions.map(m =>
              m.id === session.mission_id
                ? { ...m, status: 'salvaged' as const, salvaged_at: new Date().toISOString(), updated_at: new Date().toISOString() }
                : m
            )
          : s.missions,
      }))
      state.addMomentumEvent('session_salvaged', 20, notes ?? undefined, session.mission_id ?? undefined)
      const minutes = Math.round(session.actual_seconds / 60)
      state.recordRetention('rescue_salvaged', { state: session.mode, minutes: minutes || session.planned_minutes, protocol: 'salvage' })
      updateSessionAnalytics(false, session.mode, 'salvage', minutes || session.planned_minutes)
    },

    getSessionsToday: () => {
      const today = todayStr()
      return get().sessions.filter((s) => s.started_at.slice(0, 10) === today && (s.status === 'completed' || s.status === 'salvaged'))
    },

    getTotalMinutesToday: () => Math.round(
      get().getSessionsToday().reduce((sum, s) => sum + s.actual_seconds, 0) / 60
    ),
  }
}
