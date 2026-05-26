// ══════════════════════════════════════════════════════════════
// INTENT — User Slice
// Auth, profile, onboarding, consent
// ══════════════════════════════════════════════════════════════

import { StateCreator } from 'zustand'
import type { UserProfile } from '../../types'
import { ConsentLedger, PermissionId, createConsentLedger, recordConsent, hasConsented } from '../../services/consent'

export interface UserSlice {
  user: UserProfile | null
  isAuthenticated: boolean
  consentLedger: ConsentLedger
  setUser: (user: UserProfile | null) => void
  updateProfile: (updates: Partial<UserProfile>) => void
  completeOnboarding: () => void
  signOut: () => void
  updateConsent: (permissionId: PermissionId, granted: boolean, source: 'onboarding' | 'settings' | 'prompt' | 'system', context: string) => void
  checkConsent: (permissionId: PermissionId) => boolean
}

export const createUserSlice: StateCreator<UserSlice, [], [], UserSlice> = (set, get) => ({
  user: null,
  isAuthenticated: false,
  consentLedger: createConsentLedger(),

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  updateProfile: (updates) => set((s) => ({
    user: s.user ? { ...s.user, ...updates, updated_at: new Date().toISOString() } : null,
  })),

  completeOnboarding: () => set((s) => ({
    user: s.user ? { ...s.user, onboarding_complete: true, onboarding_step: 5 } : null,
  })),

  signOut: () => {
    // Cross-slice: resetState is injected by the composed store
    const store = get() as UserSlice & { resetState?: () => void }
    if (store.resetState) {
      store.resetState()
    } else {
      set({ user: null, isAuthenticated: false })
    }
  },

  updateConsent: (permissionId, granted, source, context) => set((s) => ({
    consentLedger: recordConsent(s.consentLedger, permissionId, granted, source, context),
  })),

  checkConsent: (permissionId) => {
    return hasConsented(get().consentLedger, permissionId)
  },
})
