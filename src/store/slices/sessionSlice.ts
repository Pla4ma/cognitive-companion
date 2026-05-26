// ══════════════════════════════════════════════════════════════
// INTENT — Session Slice
// Focus sessions: start, timer, complete, salvage, abandon
// ══════════════════════════════════════════════════════════════

import { StateCreator } from 'zustand'
import type { MissionSession } from '../../types'
import type { CrossSliceActions } from '../types'

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

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
    })),

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
      }))
      state.addMomentumEvent('session_completed', 15, undefined, session.mission_id ?? undefined)
      const minutes = Math.round(session.actual_seconds / 60)
      state.recordRetention('rescue_completed', { state: session.mode, minutes: minutes || session.planned_minutes, protocol: 'session' })
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
      }))
      state.addMomentumEvent('session_salvaged', 20, notes ?? undefined, session.mission_id ?? undefined)
      const minutes = Math.round(session.actual_seconds / 60)
      state.recordRetention('rescue_salvaged', { state: session.mode, minutes: minutes || session.planned_minutes, protocol: 'salvage' })
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
