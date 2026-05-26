// ══════════════════════════════════════════════════════════════
// INTENT — Distraction Slice
// Distractions, brain dumps, resistance patterns
// ══════════════════════════════════════════════════════════════

import { StateCreator } from 'zustand'
import type { Distraction, BrainDump, ResistancePattern, AvoidanceState } from '../../types'
import type { CrossSliceActions, CrossSliceState } from '../types'

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

export interface DistractionSlice {
  distractions: Distraction[]
  brainDumps: BrainDump[]
  resistancePatterns: ResistancePattern[]
  captureDistraction: (content: string, category?: Distraction['category'], intensity?: number) => void
  processDistraction: (id: string) => void
  getUnprocessedDistractions: () => Distraction[]
  createBrainDump: (content: string) => BrainDump
  clearBrainDump: (id: string) => void
  getLatestBrainDump: () => BrainDump | undefined
  recordResistance: (state: AvoidanceState, missionType: string, duration: number, strategy: string | null) => void
  getResistancePatterns: () => ResistancePattern[]
}

type DistractionGet = () => DistractionSlice & CrossSliceActions & CrossSliceState

export const createDistractionSlice: StateCreator<DistractionSlice, [], [], DistractionSlice> = (set, get) => {
  const cross = () => (get as DistractionGet)()

  return {
    distractions: [],
    brainDumps: [],
    resistancePatterns: [],

    captureDistraction: (content, category = 'other', intensity = 5) => {
      const state = cross()
      const distraction: Distraction = {
        id: uid(), user_id: state.user?.id ?? '',
        session_id: state.activeSession?.id ?? null,
        content, category, intensity,
        captured_at: new Date().toISOString(), processed: false, brain_dump_id: null,
      }
      set((s) => ({
        distractions: [distraction, ...s.distractions],
      }))
      state.addMomentumEvent('distraction_captured', 5)
    },

    processDistraction: (id) => set((s) => ({
      distractions: s.distractions.map((d) => d.id === id ? { ...d, processed: true } : d),
    })),

    getUnprocessedDistractions: () => get().distractions.filter((d) => !d.processed),

    createBrainDump: (content) => {
      const state = cross()
      const dump: BrainDump = {
        id: uid(), user_id: state.user?.id ?? '',
        content, items: content.split(/[.\n]/).map(l => l.trim()).filter(l => l.length > 0),
        processed: false, created_at: new Date().toISOString(), cleared_at: null,
      }
      set((s) => ({ brainDumps: [dump, ...s.brainDumps] }))
      state.addMomentumEvent('brain_dump_cleared', 10)
      return dump
    },

    clearBrainDump: (id) => set((s) => ({
      brainDumps: s.brainDumps.map((bd) => bd.id === id ? { ...bd, processed: true, cleared_at: new Date().toISOString() } : bd),
    })),

    getLatestBrainDump: () => get().brainDumps[0],

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
          id: uid(), user_id: '',
          avoidance_state: state, mission_type: missionType,
          frequency: 1, last_occurred: new Date().toISOString(),
          typical_duration_minutes: duration, successful_strategy: strategy,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }
        set((s) => ({ resistancePatterns: [pattern, ...s.resistancePatterns] }))
      }
    },

    getResistancePatterns: () => get().resistancePatterns,
  }
}
