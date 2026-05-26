// ══════════════════════════════════════════════════════════════
// INTENT — Zustand Store v2
// Missions, micro-missions, resistance, momentum, distractions, brain dumps
// ══════════════════════════════════════════════════════════════

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mmkvStorage } from './storage'
import {
  UserProfile, Mission, MicroMission, MissionSession, MomentumEvent,
  ResistancePattern, Distraction, BrainDump, MomentumScore,
  AvoidanceState, ResistanceLevel, BodyDoubleMode, PushStyle,
  FeatureGate, getFeatureGates, MissionStatus, MicroMissionStatus,
  FocusType,
} from '../types'
import { ConsentLedger, PermissionId, createConsentLedger, recordConsent, hasConsented } from '../services/consent'

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

interface AppState {
  // ── Auth ───────────────────────────────────────────────
  user: UserProfile | null
  isAuthenticated: boolean
  setUser: (user: UserProfile | null) => void
  updateProfile: (updates: Partial<UserProfile>) => void
  completeOnboarding: () => void
  signOut: () => void

  // ── Features ───────────────────────────────────────────
  sessionCount: number
  getFeatures: () => Record<FeatureGate, boolean>

  // ── Missions ───────────────────────────────────────────
  missions: Mission[]
  addMission: (title: string, description?: string, color?: string) => Mission
  updateMission: (id: string, updates: Partial<Mission>) => void
  completeMission: (id: string) => void
  abandonMission: (id: string) => void
  salvageMission: (id: string, notes?: string) => void
  deleteMission: (id: string) => void
  getActiveMissions: () => Mission[]
  getMissionById: (id: string) => Mission | undefined
  getMissionProgress: (missionId: string) => number

  // ── Micro-Missions ─────────────────────────────────────
  microMissions: MicroMission[]
  addMicroMission: (missionId: string, title: string, description?: string, estimatedMinutes?: number) => MicroMission
  addMicroMissions: (missionId: string, missions: { title: string; description?: string; estimated_minutes?: number }[]) => void
  completeMicroMission: (id: string) => void
  skipMicroMission: (id: string) => void
  getMicroMissionsForMission: (missionId: string) => MicroMission[]
  getNextPendingMicro: () => MicroMission | undefined

  // ── Sessions ───────────────────────────────────────────
  sessions: MissionSession[]
  activeSession: MissionSession | null
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

  // ── Resistance ─────────────────────────────────────────
  resistancePatterns: ResistancePattern[]
  recordResistance: (state: AvoidanceState, missionType: string, duration: number, strategy: string | null) => void
  getResistancePatterns: () => ResistancePattern[]

  // ── Distractions ───────────────────────────────────────
  distractions: Distraction[]
  captureDistraction: (content: string, category?: Distraction['category'], intensity?: number) => void
  processDistraction: (id: string) => void
  getUnprocessedDistractions: () => Distraction[]

  // ── Brain Dump ─────────────────────────────────────────
  brainDumps: BrainDump[]
  createBrainDump: (content: string) => BrainDump
  clearBrainDump: (id: string) => void
  getLatestBrainDump: () => BrainDump | undefined

  // ── Momentum ───────────────────────────────────────────
  momentumEvents: MomentumEvent[]
  addMomentumEvent: (type: MomentumEvent['type'], points: number, note?: string, missionId?: string) => void
  getMomentumScore: () => number
  getMomentumEvents: (days?: number) => MomentumEvent[]

  // ── UI State ───────────────────────────────────────────
  isLoading: boolean
  setIsLoading: (v: boolean) => void
  currentRoute: string
  setCurrentRoute: (route: string) => void

  // ── Consent ─────────────────────────────────────────────
  consentLedger: ConsentLedger
  updateConsent: (permissionId: PermissionId, granted: boolean, source: 'onboarding' | 'settings' | 'prompt' | 'system', context: string) => void
  checkConsent: (permissionId: PermissionId) => boolean

  // ── Before You Scroll ───────────────────────────────────
  skipCount: number
  incrementSkipCount: () => void
  resetSkipCount: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({

      // ── Auth ─────────────────────────────────────────────
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      updateProfile: (updates) => set((s) => ({
        user: s.user ? { ...s.user, ...updates, updated_at: new Date().toISOString() } : null,
      })),
      completeOnboarding: () => set((s) => ({
        user: s.user ? { ...s.user, onboarding_complete: true, onboarding_step: 5 } : null,
      })),
      signOut: () => set({
        user: null, isAuthenticated: false,
        missions: [], microMissions: [], sessions: [], momentumEvents: [],
        resistancePatterns: [], distractions: [], brainDumps: [],
      }),

      // ── Features ─────────────────────────────────────────
      sessionCount: 0,
      getFeatures: () => {
        const state = get()
        return getFeatureGates(state.sessionCount, state.user?.plan ?? 'free')
      },

      // ── Missions ────────────────────────────────────────
      missions: [],
      addMission: (title, description = '', color = '#6C3AED') => {
        const mission: Mission = {
          id: uid(), user_id: get().user?.id ?? '',
          title, description, status: 'active',
          resistance_level: 'medium', avoidance_state: null,
          color, icon: 'target', deadline: null,
          completed_at: null, salvaged_at: null, salvage_notes: null,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }
        set((s) => ({ missions: [mission, ...s.missions] }))
        return mission
      },
      updateMission: (id, updates) => set((s) => ({
        missions: s.missions.map((m) => m.id === id ? { ...m, ...updates, updated_at: new Date().toISOString() } : m),
      })),
      completeMission: (id) => set((s) => ({
        missions: s.missions.map((m) => m.id === id ? {
          ...m, status: 'completed' as MissionStatus, completed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        } : m),
      })),
      abandonMission: (id) => set((s) => ({
        missions: s.missions.map((m) => m.id === id ? {
          ...m, status: 'abandoned' as MissionStatus, updated_at: new Date().toISOString(),
        } : m),
      })),
      salvageMission: (id, notes) => set((s) => ({
        missions: s.missions.map((m) => m.id === id ? {
          ...m, status: 'salvaged' as MissionStatus, salvaged_at: new Date().toISOString(), salvage_notes: notes ?? null, updated_at: new Date().toISOString(),
        } : m),
      })),
      deleteMission: (id) => set((s) => ({
        missions: s.missions.filter((m) => m.id !== id),
        microMissions: s.microMissions.filter((mm) => mm.threadId !== id),
      })),
      getActiveMissions: () => get().missions.filter((m) => m.status === 'active'),
      getMissionById: (id) => get().missions.find((m) => m.id === id),
      getMissionProgress: (missionId) => {
        const micros = get().microMissions.filter((mm) => mm.threadId === missionId)
        if (micros.length === 0) return 0
        return micros.filter((mm) => mm.status === 'completed').length / micros.length
      },

      // ── Micro-Missions ───────────────────────────────────
      microMissions: [],
      addMicroMission: (missionId, title, description = '', estimatedMinutes = 10) => {
        const micro: MicroMission = {
          id: uid(), threadId: missionId,
          title, exactAction: title, status: 'pending',
          estimatedMinutes: estimatedMinutes, actualMinutes: null,
          resistanceBefore: null, resistanceAfter: null, distractionCaptured: null,
          completionCriteria: 'Complete the action', fallbackMission: null, salvageMission: null,
          protocolId: 'two_minute_ignition', state: 'ready', energy: 'medium', blocker: null,
          sortOrder: get().microMissions.filter((mm) => mm.threadId === missionId).length,
          createdAt: new Date().toISOString(), completedAt: null,
          privacyClassification: 'local_only',
        }
        set((s) => ({ microMissions: [micro, ...s.microMissions] }))
        return micro
      },
      addMicroMissions: (missionId, missionList) => {
        const newMicros: MicroMission[] = missionList.map((m, i) => ({
          id: uid(), threadId: missionId,
          title: m.title, exactAction: m.title, status: 'pending' as MicroMissionStatus,
          estimatedMinutes: 10, actualMinutes: null,
          resistanceBefore: null, resistanceAfter: null, distractionCaptured: null,
          completionCriteria: 'Complete the action', fallbackMission: null, salvageMission: null,
          protocolId: 'two_minute_ignition', state: 'ready', energy: 'medium', blocker: null,
          sortOrder: get().microMissions.filter((mm) => mm.threadId === missionId).length + i,
          createdAt: new Date().toISOString(), completedAt: null,
          privacyClassification: 'local_only',
        }))
        set((s) => ({ microMissions: [...newMicros, ...s.microMissions] }))
      },
      completeMicroMission: (id) => set((s) => ({
        microMissions: s.microMissions.map((mm) => mm.id === id ? {
          ...mm, status: 'completed' as MicroMissionStatus, completedAt: new Date().toISOString(),
        } : mm),
      })),
      skipMicroMission: (id) => set((s) => ({
        microMissions: s.microMissions.map((mm) => mm.id === id ? {
          ...mm, status: 'skipped' as MicroMissionStatus,
        } : mm),
      })),
      getMicroMissionsForMission: (missionId) =>
        get().microMissions.filter((mm) => mm.threadId === missionId).sort((a, b) => a.sortOrder - b.sortOrder),
      getNextPendingMicro: () =>
        get().microMissions.filter((mm) => mm.status === 'pending').sort((a, b) => a.sortOrder - b.sortOrder)[0],

      // ── Sessions ─────────────────────────────────────────
      sessions: [],
      activeSession: null,
      startSession: (missionId, microMissionId, mode = 'focus', plannedMinutes = 25) => {
        const session: MissionSession = {
          id: uid(), user_id: get().user?.id ?? '',
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
        const state = get()
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
        get().addMomentumEvent('session_completed', 15, undefined, session.mission_id ?? undefined)
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
        const state = get()
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
        get().addMomentumEvent('session_salvaged', 20, notes ?? undefined, session.mission_id ?? undefined)
      },
      getSessionsToday: () => {
        const today = todayStr()
        return get().sessions.filter((s) => s.started_at.slice(0, 10) === today && (s.status === 'completed' || s.status === 'salvaged'))
      },
      getTotalMinutesToday: () => Math.round(
        get().getSessionsToday().reduce((sum, s) => sum + s.actual_seconds, 0) / 60
      ),

      // ── Resistance ───────────────────────────────────────
      resistancePatterns: [],
      recordResistance: (state, missionType, duration, strategy) => {
        const existing = get().resistancePatterns.find(
          (p) => p.avoidance_state === state && p.mission_type === missionType
        )
        if (existing) {
          set((s) => ({
            resistancePatterns: s.resistancePatterns.map((p) =>
              p.id === existing.id ? {
                ...p, frequency: p.frequency + 1, last_occurred: new Date().toISOString(),
                typical_duration_minutes: Math.round((p.typical_duration_minutes + duration) / 2),
                successful_strategy: strategy ?? p.successful_strategy,
                updated_at: new Date().toISOString(),
              } : p
            ),
          }))
        } else {
          const pattern: ResistancePattern = {
            id: uid(), user_id: get().user?.id ?? '',
            avoidance_state: state, mission_type: missionType,
            frequency: 1, last_occurred: new Date().toISOString(),
            typical_duration_minutes: duration, successful_strategy: strategy,
            created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
          }
          set((s) => ({ resistancePatterns: [pattern, ...s.resistancePatterns] }))
        }
      },
      getResistancePatterns: () => get().resistancePatterns,

      // ── Distractions ─────────────────────────────────────
      distractions: [],
      captureDistraction: (content, category = 'other', intensity = 5) => {
        const distraction: Distraction = {
          id: uid(), user_id: get().user?.id ?? '',
          session_id: get().activeSession?.id ?? null,
          content, category, intensity,
          captured_at: new Date().toISOString(), processed: false, brain_dump_id: null,
        }
        set((s) => ({
          distractions: [distraction, ...s.distractions],
          activeSession: s.activeSession ? { ...s.activeSession, distractions_captured: s.activeSession.distractions_captured + 1 } : null,
        }))
        get().addMomentumEvent('distraction_captured', 5)
      },
      processDistraction: (id) => set((s) => ({
        distractions: s.distractions.map((d) => d.id === id ? { ...d, processed: true } : d),
      })),
      getUnprocessedDistractions: () => get().distractions.filter((d) => !d.processed),

      // ── Brain Dump ───────────────────────────────────────
      brainDumps: [],
      createBrainDump: (content) => {
        const dump: BrainDump = {
          id: uid(), user_id: get().user?.id ?? '',
          content, items: content.split(/[.\n]/).map(l => l.trim()).filter(l => l.length > 0),
          processed: false, created_at: new Date().toISOString(), cleared_at: null,
        }
        set((s) => ({ brainDumps: [dump, ...s.brainDumps] }))
        get().addMomentumEvent('brain_dump_cleared', 10)
        return dump
      },
      clearBrainDump: (id) => set((s) => ({
        brainDumps: s.brainDumps.map((bd) => bd.id === id ? { ...bd, processed: true, cleared_at: new Date().toISOString() } : bd),
      })),
      getLatestBrainDump: () => get().brainDumps[0],

      // ── Momentum ─────────────────────────────────────────
      momentumEvents: [],
      addMomentumEvent: (type, points, note, missionId) => {
        const event: MomentumEvent = {
          id: uid(), user_id: get().user?.id ?? '',
          type, mission_id: missionId ?? null, micro_mission_id: null,
          points, note: note ?? null, created_at: new Date().toISOString(),
        }
        set((s) => ({ momentumEvents: [event, ...s.momentumEvents] }))
      },
      getMomentumScore: () => {
        const weekAgo = Date.now() - 7 * 86400000
        return get().momentumEvents
          .filter((e) => new Date(e.created_at).getTime() >= weekAgo)
          .reduce((sum, e) => sum + e.points, 0)
      },
      getMomentumEvents: (days = 7) => {
        const cutoff = Date.now() - days * 86400000
        return get().momentumEvents.filter((e) => new Date(e.created_at).getTime() >= cutoff)
      },

      // ── UI State ─────────────────────────────────────────
      isLoading: false,
      setIsLoading: (v) => set({ isLoading: v }),
      currentRoute: '/',
      setCurrentRoute: (route) => set({ currentRoute: route }),

      // ── Consent ─────────────────────────────────────────────
      consentLedger: createConsentLedger(),
      updateConsent: (permissionId, granted, source, context) => set((s) => ({
consentLedger: recordConsent(s.consentLedger, permissionId, granted, source, context),
      })),
      checkConsent: (permissionId) => {
        const state = get()
return hasConsented(state.consentLedger, permissionId)
      },

      // ── Before You Scroll ───────────────────────────────────
      skipCount: 0,
      incrementSkipCount: () => set((s) => ({ skipCount: s.skipCount + 1 })),
      resetSkipCount: () => set({ skipCount: 0 }),
    }),
    {
      name: 'intent-storage',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        user: state.user,
        missions: state.missions,
        microMissions: state.microMissions,
        sessions: state.sessions,
        momentumEvents: state.momentumEvents,
        resistancePatterns: state.resistancePatterns,
        distractions: state.distractions,
        brainDumps: state.brainDumps,
        sessionCount: state.sessionCount,
        consentLedger: state.consentLedger,
        skipCount: state.skipCount,
      }),
    },
  ),
)
