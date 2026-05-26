// ══════════════════════════════════════════════════════════════
// INTENT — Ambient Agent Types
// Permissioned proactive rescue system
// ══════════════════════════════════════════════════════════════

import type { UserState } from './moment'
import type { RescueProtocolId } from './rescue'

// ── Quiet Hours ─────────────────────────────────────────────

export interface QuietHoursConfig {
  enabled: boolean
  startHour: number // 0-23
  startMinute: number // 0-59
  endHour: number
  endMinute: number
}

// ── Danger Windows ─────────────────────────────────────────

export interface DangerWindow {
  id: string
  label: string
  startTime: string // HH:MM
  endTime: string // HH:MM
  daysOfWeek: number[] // 0=Sun, 1=Mon, etc.
  usualState: UserState | null
  preferredProtocol: RescueProtocolId | null
  preferredDuration: number | null // minutes
  enabled: boolean
  source: 'user_defined' | 'learned_pattern' | 'experiment'
  confidence: number // 0-1
  createdAt: string
  updatedAt: string
}
