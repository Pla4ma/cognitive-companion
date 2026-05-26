// ══════════════════════════════════════════════════════════════
// INTENT — Momentum Slice
// Momentum events, scoring, and weekly tracking
// ══════════════════════════════════════════════════════════════

import { StateCreator } from 'zustand'
import type { MomentumEvent } from '../../types'

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

export interface MomentumSlice {
  momentumEvents: MomentumEvent[]
  addMomentumEvent: (type: MomentumEvent['type'], points: number, note?: string, missionId?: string) => void
  getMomentumScore: () => number
  getMomentumEvents: (days?: number) => MomentumEvent[]
}

export const createMomentumSlice: StateCreator<MomentumSlice, [], [], MomentumSlice> = (set, get) => ({
  momentumEvents: [],

  addMomentumEvent: (type, points, note, missionId) => {
    const event: MomentumEvent = {
      id: uid(), user_id: '',
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
})
