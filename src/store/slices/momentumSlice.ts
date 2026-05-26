// ══════════════════════════════════════════════════════════════
// INTENT — Momentum Slice
// Momentum events, scoring, and weekly tracking
// ══════════════════════════════════════════════════════════════

import { StateCreator } from 'zustand'
import type { MomentumEvent } from '../../types'
import { uid } from '../../utils/uid'

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
    const thirtyDaysAgo = Date.now() - 30 * 86_400_000
    const events = get().momentumEvents
    // Prune events older than 30 days to bound memory and keep score relevant.
    // This mutates state via set() so the pruning persists.
    const recent = events.filter((e) => new Date(e.created_at).getTime() >= thirtyDaysAgo)
    if (recent.length < events.length) {
      set({ momentumEvents: recent })
    }
    // Score still uses 7-day window for display
    const weekAgo = Date.now() - 7 * 86_400_000
    return recent
      .filter((e) => new Date(e.created_at).getTime() >= weekAgo)
      .reduce((sum, e) => sum + e.points, 0)
  },

  getMomentumEvents: (days = 7) => {
    const cutoff = Date.now() - days * 86400000
    return get().momentumEvents.filter((e) => new Date(e.created_at).getTime() >= cutoff)
  },
})
