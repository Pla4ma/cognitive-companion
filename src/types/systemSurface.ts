// ══════════════════════════════════════════════════════════════
// INTENT — System Surface Types
// Widget, notification, shortcut, Live Activity types
// ══════════════════════════════════════════════════════════════

import type { UserState } from './moment'

export type SystemSurfaceType =
  | 'app'
  | 'widget'
  | 'notification'
  | 'live_activity'
  | 'shortcut'
  | 'app_intent'
  | 'share_extension'
  | 'voice_shortcut'
  | 'lock_screen'
  | 'action_button'
  | 'watch'

export interface SystemSurfaceEvent {
  id: string
  surface: SystemSurfaceType
  action: string
  payload: Record<string, unknown>
  timestamp: string
  handled: boolean
}

// ── Widget ──────────────────────────────────────────────────

export type WidgetState =
  | 'rescue_me'
  | 'start_2min'
  | 'im_stuck'
  | 'capture_distraction'
  | 'momentum_today'
  | 'current_mission'

export interface WidgetData {
  state: WidgetState
  missionTitle: string | null
  missionAction: string | null
  timerRemaining: number | null // seconds
  momentumToday: number
  lastRescueAt: string | null
}

// ── Notification ────────────────────────────────────────────

export type NotificationAction =
  | 'start_2min'
  | 'make_smaller'
  | 'im_stuck'
  | 'snooze'
  | 'not_today'
  | 'capture_distraction'
  | 'rescue_me'
  | 'comeback_start'

export interface NotificationConfig {
  id: string
  title: string
  body: string
  actions: NotificationAction[]
  trigger: NotificationTrigger
  enabled: boolean
}

export type NotificationTrigger =
  | { type: 'scheduled'; hour: number; minute: number; days: number[] }
  | { type: 'drift_signal'; signalType: string; minSeverity: number }
  | { type: 'comeback'; afterMinutes: number }
  | { type: 'inactivity'; afterHours: number }
  | { type: 'custom'; label: string }

// ── Live Activity ───────────────────────────────────────────

export interface LiveActivityState {
  missionTitle: string
  exactAction: string
  timerTotal: number // seconds
  timerRemaining: number // seconds
  state: 'active' | 'paused' | 'completed' | 'salvaged'
  availableActions: ('done' | 'salvage' | 'capture_distraction' | 'smaller' | 'stuck')[]
}

// ── App Intents / Shortcuts ─────────────────────────────────

export type AppIntentAction =
  | 'start_rescue'
  | 'start_5min_mission'
  | 'capture_distraction'
  | 'salvage_current'
  | 'get_next_tiny_action'
  | 'brain_dump'
  | 'show_momentum'
  | 'before_scroll'

export interface ShortcutDefinition {
  id: string
  intentAction: AppIntentAction
  title: string
  subtitle: string | null
  systemImage: string // SF Symbol name
  phrase: string // "Hey Siri, ..."
}

export const DEFAULT_SHORTCUTS: ShortcutDefinition[] = [
  { id: 'rescue', intentAction: 'start_rescue', title: 'Rescue Me', subtitle: 'Start a rescue mission', systemImage: 'bolt.fill', phrase: 'Rescue me' },
  { id: '5min', intentAction: 'start_5min_mission', title: '5-Minute Mission', subtitle: 'Quick focus session', systemImage: 'timer', phrase: 'Start a tiny mission' },
  { id: 'distract', intentAction: 'capture_distraction', title: 'Capture Distraction', subtitle: 'Save the thought, return to work', systemImage: 'brain.head.profile', phrase: 'Capture distraction' },
  { id: 'salvage', intentAction: 'salvage_current', title: 'Salvage Mission', subtitle: 'Shrink and restart', systemImage: 'arrow.uturn.left.circle.fill', phrase: 'Salvage my mission' },
  { id: 'next', intentAction: 'get_next_tiny_action', title: 'Next Tiny Action', subtitle: 'What should I do?', systemImage: 'arrow.right.circle.fill', phrase: 'Give me the smallest step' },
  { id: 'braindump', intentAction: 'brain_dump', title: 'Brain Dump', subtitle: 'Dump your thoughts', systemImage: 'text.bubble.fill', phrase: 'Brain dump' },
  { id: 'momentum', intentAction: 'show_momentum', title: 'Show Momentum', subtitle: 'See your progress', systemImage: 'chart.line.uptrend.xyaxis', phrase: 'Show my momentum' },
  { id: 'scroll', intentAction: 'before_scroll', title: 'Before I Scroll', subtitle: '2 minutes first', systemImage: 'iphone.and.arrow.forward', phrase: 'Before I scroll' },
]

// ── Share Extension ─────────────────────────────────────────

export interface SharedContent {
  text: string
  sourceApp: string | null
  url: string | null
  timestamp: string
}

// ── Surface Availability ────────────────────────────────────

export interface SurfaceAvailability {
  surface: SystemSurfaceType
  available: boolean
  requiresNativeBuild: boolean
  requiresEntitlement: boolean
  notes: string
}

export const SURFACE_AVAILABILITY: SurfaceAvailability[] = [
  { surface: 'app', available: true, requiresNativeBuild: false, requiresEntitlement: false, notes: 'Always available' },
  { surface: 'widget', available: false, requiresNativeBuild: true, requiresEntitlement: false, notes: 'Requires expo-widgets or config plugin' },
  { surface: 'notification', available: true, requiresNativeBuild: false, requiresEntitlement: false, notes: 'expo-notifications supports actions' },
  { surface: 'live_activity', available: false, requiresNativeBuild: true, requiresEntitlement: true, notes: 'Requires ActivityKit native module + entitlement' },
  { surface: 'shortcut', available: false, requiresNativeBuild: true, requiresEntitlement: false, notes: 'Requires App Intents native module' },
  { surface: 'app_intent', available: false, requiresNativeBuild: true, requiresEntitlement: false, notes: 'Requires App Intents native module' },
  { surface: 'share_extension', available: false, requiresNativeBuild: true, requiresEntitlement: false, notes: 'Requires share extension native module' },
  { surface: 'voice_shortcut', available: false, requiresNativeBuild: true, requiresEntitlement: false, notes: 'Requires App Intents + SiriKit' },
  { surface: 'lock_screen', available: false, requiresNativeBuild: true, requiresEntitlement: true, notes: 'Requires Live Activity + entitlement' },
  { surface: 'action_button', available: false, requiresNativeBuild: true, requiresEntitlement: false, notes: 'iPhone 15+ Action Button, requires native module' },
  { surface: 'watch', available: false, requiresNativeBuild: true, requiresEntitlement: false, notes: 'Apple Watch companion via WatchConnectivity, requires native module + watchOS app' },
]
