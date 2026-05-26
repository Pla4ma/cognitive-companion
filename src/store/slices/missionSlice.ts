// ══════════════════════════════════════════════════════════════
// INTENT — Mission Slice
// Missions and micro-missions CRUD
// ══════════════════════════════════════════════════════════════

import { StateCreator } from 'zustand'
import type { Mission, MicroMission, MissionStatus, MicroMissionStatus } from '../../types'

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

export interface MissionSlice {
  missions: Mission[]
  microMissions: MicroMission[]
  addMission: (title: string, description?: string, color?: string) => Mission
  updateMission: (id: string, updates: Partial<Mission>) => void
  completeMission: (id: string) => void
  abandonMission: (id: string) => void
  salvageMission: (id: string, notes?: string) => void
  deleteMission: (id: string) => void
  getActiveMissions: () => Mission[]
  getMissionById: (id: string) => Mission | undefined
  getMissionProgress: (missionId: string) => number
  addMicroMission: (missionId: string, title: string, description?: string, estimatedMinutes?: number) => MicroMission
  addMicroMissions: (missionId: string, missions: { title: string; description?: string; estimated_minutes?: number }[]) => void
  completeMicroMission: (id: string) => void
  skipMicroMission: (id: string) => void
  getMicroMissionsForMission: (missionId: string) => MicroMission[]
  getNextPendingMicro: () => MicroMission | undefined
}

export const createMissionSlice: StateCreator<MissionSlice, [], [], MissionSlice> = (set, get) => ({
  missions: [],
  microMissions: [],

  addMission: (title, description = '', color = '#6C3AED') => {
    const mission: Mission = {
      id: uid(), user_id: '',
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

  addMicroMission: (missionId, title, description = '', estimatedMinutes = 10) => {
    const micro: MicroMission = {
      id: uid(), threadId: missionId,
      title, exactAction: title, status: 'pending',
      estimatedMinutes, actualMinutes: null,
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
})
