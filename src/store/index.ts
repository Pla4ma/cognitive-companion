// ══════════════════════════════════════════════════════════════
// INTENT — Zustand Store v3 (Sliced)
// Composed from 6 domain slices with migration support
// ══════════════════════════════════════════════════════════════

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mmkvStorage } from './storage'
import type { FeatureGate } from '../types'
import { getFeatureGates } from '../types'
import {
  loadRetentionState, saveRetentionState, recordRetentionEvent,
  computeMomentumWindows, detectComeback,
  type RetentionState as RetentionEngineState,
} from '../services/retention/retentionEngine'

import { createUserSlice, UserSlice } from './slices/userSlice'
import { createSessionSlice, SessionSlice } from './slices/sessionSlice'
import { createMissionSlice, MissionSlice } from './slices/missionSlice'
import { createMomentumSlice, MomentumSlice } from './slices/momentumSlice'
import { createDistractionSlice, DistractionSlice } from './slices/distractionSlice'
import { createUISlice, UISlice } from './slices/uiSlice'

// ── Retention (cross-slice, not a standalone slice) ──────────
interface RetentionSlice {
  retentionState: RetentionEngineState
  recordRetention: (event: import('../services/retention/retentionEngine').RetentionEvent, meta?: { state?: string; minutes?: number; protocol?: string }) => void
  getMomentumWindows: () => { last7Days: number; last14Days: number; last30Days: number }
  getComebackStatus: () => { isComeback: boolean; daysAway: number; message: string }
  getFeatures: () => Record<FeatureGate, boolean>
  resetState: () => void
}

// ── Full AppState ────────────────────────────────────────────
export type AppState =
  & UserSlice
  & SessionSlice
  & MissionSlice
  & MomentumSlice
  & DistractionSlice
  & UISlice
  & RetentionSlice

export const useAppStore = create<AppState>()(
  persist(
    (set, get, api) => ({
      // ── Compose all slices ──
      ...createUserSlice(set, get, api),
      ...createSessionSlice(set, get, api),
      ...createMissionSlice(set, get, api),
      ...createMomentumSlice(set, get, api),
      ...createDistractionSlice(set, get, api),
      ...createUISlice(set, get, api),

      // ── Retention Engine ────────────────────────────────────
      retentionState: loadRetentionState(),

      recordRetention: (event, meta) => {
        const state = get()
        const sessions = state.sessions
        const installDate = state.user?.created_at
        const newState = recordRetentionEvent(state.retentionState, event, sessions, {
          ...meta,
          installDate,
        })
        set({ retentionState: newState })
        saveRetentionState(newState)
      },

      getMomentumWindows: () => computeMomentumWindows(get().sessions),

      getComebackStatus: () => detectComeback(get().sessions, get().retentionState.lastRescueDate),

      getFeatures: () => {
        const state = get()
        return getFeatureGates(state.sessionCount, state.user?.plan ?? 'free')
      },

      resetState: () => {
        set({
          user: null, isAuthenticated: false,
          missions: [], microMissions: [], sessions: [], momentumEvents: [],
          resistancePatterns: [], distractions: [], brainDumps: [],
          sessionCount: 0, skipCount: 0, activeSession: null,
          retentionState: loadRetentionState(),
        })
      },
    }),
    {
      name: 'intent-storage',
      storage: createJSONStorage(() => mmkvStorage),
      version: 2,
      migrate: (persistedState: any, version: number) => {
        const state = { ...persistedState }
        if (version < 1) {
          // v0 → v1: sessions had no 'mode' field
          state.sessions = (state.sessions ?? []).map((s: any) => ({
            ...s,
            mode: s.mode ?? 'focus',
          }))
        }
        if (version < 2) {
          // v1 → v2: add retentionState and skipCount
          if (!state.retentionState) {
            state.retentionState = loadRetentionState()
          }
          if (state.skipCount === undefined) {
            state.skipCount = 0
          }
        }
        return state
      },
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        missions: state.missions,
        microMissions: state.microMissions,
        sessions: state.sessions,
        activeSession: state.activeSession,
        momentumEvents: state.momentumEvents,
        resistancePatterns: state.resistancePatterns,
        distractions: state.distractions,
        brainDumps: state.brainDumps,
        sessionCount: state.sessionCount,
        consentLedger: state.consentLedger,
        skipCount: state.skipCount,
        retentionState: state.retentionState,
        // NOT persisted: isLoading, currentRoute
      }),
    },
  ),
)
