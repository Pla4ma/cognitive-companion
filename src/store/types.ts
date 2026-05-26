// ══════════════════════════════════════════════════════════════
// INTENT — Store Types
// Shared types for cross-slice communication (avoids `as any`)
// ══════════════════════════════════════════════════════════════

import type { MomentumEvent } from '../types'
import type { RetentionEvent, RetentionState } from '../services/retention/retentionEngine'

/**
 * Minimal interface for cross-slice dependencies.
 * Used by slices that need to call into other slices (e.g., session → momentum).
 * Import this instead of casting `get()` to `any`.
 */
export interface CrossSliceActions {
  addMomentumEvent: (type: MomentumEvent['type'], points: number, note?: string, missionId?: string) => void
  recordRetention: (event: RetentionEvent, meta?: { state?: string; minutes?: number; protocol?: string }) => void
  resetState: () => void
}

/**
 * Minimal state needed from other slices (read-only).
 */
export interface CrossSliceState {
  user: { id: string } | null
  activeSession: { id: string } | null
}
