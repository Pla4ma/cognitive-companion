// ══════════════════════════════════════════════════════════════
// INTENT — Ambient Agent Types
// Permissioned proactive rescue system
// ══════════════════════════════════════════════════════════════

import type { UserState } from './moment'
import type { RescueProtocolId } from './rescue'
import type { PrivacyClassification } from './privacy'

// ── Ambient Mode Settings ──────────────────────────────────

export type AmbientIntensity = 'low' | 'balanced' | 'active'

export type AmbientSurface =
  | 'in_app'
  | 'notification'
  | 'widget'
  | 'shortcut'
  | 'live_activity_future'

export type AmbientPromptType =
  | 'rescue'
  | 'before_scroll'
  | 'comeback'
  | 'body_double'
  | 'context_to_mission'

export interface AmbientModeSettings {
  enabled: boolean
  intensity: AmbientIntensity
  quietHours: QuietHoursConfig
  maxPromptsPerDay: number
  allowedSurfaces: AmbientSurface[]
  preferredPromptTypes: AmbientPromptType[]
  dangerWindows: DangerWindow[]
  disabledDays: number[] // 0=Sun, 1=Mon, etc.
  sensitiveMode: boolean // never mention state labels in notifications
  requireUserInitiatedFirst: boolean // true by default
}

export interface QuietHoursConfig {
  enabled: boolean
  startHour: number // 0-23
  startMinute: number // 0-59
  endHour: number
  endMinute: number
}

// ── Danger Windows ─────────────────────────────────────────

export type DangerWindowSource = 'user_defined' | 'learned_pattern' | 'experiment'

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
  source: DangerWindowSource
  confidence: number // 0-1
  createdAt: string
  updatedAt: string
}

// ── Ambient Suggestions ────────────────────────────────────

export type AmbientTrigger =
  | 'danger_window'
  | 'missed_rescue'
  | 'abandoned_mission'
  | 'comeback'
  | 'before_scroll_window'
  | 'context_due_soon'
  | 'user_pattern'

export interface AmbientSuggestion {
  id: string
  trigger: AmbientTrigger
  surface: AmbientSurface
  copy: string
  title: string
  body: string
  recommendedAction: string
  protocolId: RescueProtocolId | null
  missionSeed: string | null
  privacyLevel: PrivacyClassification
  dangerWindowId: string | null
  confidence: number
  expiresAt: string
  createdAt: string
  dismissedAt: string | null
  actedAt: string | null
  actionTaken: string | null
}

// ── Ambient Agent State ────────────────────────────────────

export type AmbientAgentStatus = 'inactive' | 'watching' | 'suggestion_ready' | 'quiet_hours' | 'cooldown'

export interface AmbientAgentState {
  status: AmbientAgentStatus
  suggestionsToday: number
  lastSuggestionAt: string | null
  consecutiveDismissals: number
  lastDismissalAt: string | null
  activeDangerWindowId: string | null
  nextScheduledCheck: string | null
}

// ── Default Settings ───────────────────────────────────────

export const DEFAULT_AMBIENT_SETTINGS: AmbientModeSettings = {
  enabled: false,
  intensity: 'low',
  quietHours: {
    enabled: true,
    startHour: 22,
    startMinute: 0,
    endHour: 7,
    endMinute: 0,
  },
  maxPromptsPerDay: 3,
  allowedSurfaces: ['in_app', 'notification'],
  preferredPromptTypes: ['rescue', 'comeback'],
  dangerWindows: [],
  disabledDays: [],
  sensitiveMode: true,
  requireUserInitiatedFirst: true,
}

export const INTENSITY_DEFAULTS: Record<AmbientIntensity, { maxPrompts: number; surfaces: AmbientSurface[] }> = {
  low: { maxPrompts: 2, surfaces: ['in_app', 'notification'] },
  balanced: { maxPrompts: 4, surfaces: ['in_app', 'notification', 'widget'] },
  active: { maxPrompts: 6, surfaces: ['in_app', 'notification', 'widget', 'shortcut'] },
}

// ── Safe Notification Copy ─────────────────────────────────

export const SAFE_NOTIFICATION_COPY: Record<string, string[]> = {
  rescue: [
    'Tiny restart available.',
    'Want a 2-minute reset?',
    'Your easiest next move is ready.',
    'Before you scroll: one tiny win?',
    'A small step is waiting.',
    'Two minutes can make a difference.',
  ],
  before_scroll: [
    'Before you scroll: one tiny win?',
    'Two minutes first?',
    'A small start before you scroll.',
    'Tiny win, then scroll?',
  ],
  comeback: [
    'Ready for a tiny restart?',
    'Your next small win is ready.',
    'One small step today?',
    'A 2-minute comeback?',
  ],
  body_double: [
    'Want company for a tiny task?',
    'Start together for 2 minutes?',
    'A gentle start with support?',
  ],
  context_to_mission: [
    'A tiny mission from your notes is ready.',
    'One action from your list is waiting.',
    'Your next step is prepared.',
  ],
}

export const UNSAFE_NOTIFICATION_PATTERNS = [
  /avoiding/i,
  /anxious/i,
  /shame/i,
  /doomscroll/i,
  /procrastinating/i,
  /lazy/i,
  /failing/i,
  /behind/i,
  /wasting time/i,
  /you usually/i,
  /you always/i,
]
