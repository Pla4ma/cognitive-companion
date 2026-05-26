// ══════════════════════════════════════════════════════════════
// INTENT — UI Slice
// Loading state, route tracking, skip count (NOT persisted)
// ══════════════════════════════════════════════════════════════

import { StateCreator } from 'zustand'

export interface UISlice {
  isLoading: boolean
  currentRoute: string
  skipCount: number
  setIsLoading: (v: boolean) => void
  setCurrentRoute: (route: string) => void
  incrementSkipCount: () => void
  resetSkipCount: () => void
}

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set) => ({
  isLoading: false,
  currentRoute: '/',
  skipCount: 0,

  setIsLoading: (v) => set({ isLoading: v }),
  setCurrentRoute: (route) => set({ currentRoute: route }),
  incrementSkipCount: () => set((s) => ({ skipCount: s.skipCount + 1 })),
  resetSkipCount: () => set({ skipCount: 0 }),
})
