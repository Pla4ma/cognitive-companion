// ══════════════════════════════════════════════════════════════
// INTENT — Surface-Specific Types
// Types for widgets, Live Activities, App Intents, shortcuts
// ══════════════════════════════════════════════════════════════

import type { PermissionId } from '../services/consent'
import type { AppIntentAction, WidgetData, LiveActivityState } from './systemSurface'

// ── Widget Service Types ────────────────────────────────────

export type WidgetType =
  | 'rescue_quick_action'
  | 'momentum_display'
  | 'danger_window_alert'
  | 'streak_counter'

export interface WidgetDataContext {
  type: WidgetType
  data: WidgetData
  updatedAt: string
  privacyMode: 'private' | 'standard' | 'detailed'
}

export interface WidgetUpdatePayload {
  type: WidgetType
  data: Record<string, unknown>
  timestamp: string
}

/** iOS WidgetKit timeline entry */
export interface WidgetKitEntry {
  date: string
  data: Record<string, unknown>
}

/** Android AppWidget RemoteViews data */
export interface AndroidWidgetData {
  layoutId: string
  texts: Record<string, string>
  clickActions: Record<string, string> // viewId -> deep link URL
  visibility: Record<string, number>  // viewId -> View.VISIBLE / View.GONE
}

// ── Live Activity Service Types ─────────────────────────────

export type LiveActivityType =
  | 'focus_session'
  | 'rescue_mission'
  | 'body_double'

export type LiveActivityOutcome =
  | 'completed'
  | 'salvaged'
  | 'abandoned'
  | 'timed_out'

export interface LiveActivityProgress {
  elapsed: number       // seconds
  remaining: number     // seconds
  state: LiveActivityState['state']
  actionCount: number
}

export interface LiveActivityStartRequest {
  type: LiveActivityType
  missionId: string
  missionTitle: string
  exactAction: string
  totalDuration: number  // seconds
}

export interface LiveActivityUpdateRequest {
  activityId: string
  progress: LiveActivityProgress
}

export interface LiveActivityEndRequest {
  activityId: string
  outcome: LiveActivityOutcome
}

export interface ActiveLiveActivity {
  id: string
  type: LiveActivityType
  missionId: string
  startedAt: string
  state: LiveActivityState
}

// ── App Intent Service Types ────────────────────────────────

export interface IntentParameter {
  name: string
  type: 'string' | 'number' | 'boolean'
  required: boolean
  defaultValue?: string | number | boolean
  description: string
}

export interface IntentDefinition {
  id: AppIntentAction
  title: string
  description: string
  parameters: IntentParameter[]
  triggerPhrase: string
  deepLink: string
}

export interface IntentResult {
  success: boolean
  intentId: AppIntentAction
  message: string
  route?: string
  params?: Record<string, string>
  error?: string
}

export type IntentExecuteParams = Record<string, string | number | boolean>

// ── Shortcut Service Types ──────────────────────────────────

export type ShortcutType =
  | 'rescue'
  | 'focus'
  | 'capture'
  | 'brain_dump'
  | 'momentum'
  | 'body_double'
  | 'before_scroll'
  | 'salvage'

export interface ShortcutItem {
  id: string
  type: ShortcutType
  title: string
  subtitle: string
  icon: string
  deepLink: string
  isDynamic: boolean
}

export interface ShortcutHandleResult {
  handled: boolean
  route: string
  params: Record<string, string>
}

// ── Native Bridge Interfaces ────────────────────────────────

/** Bridge to iOS WidgetKit / Android AppWidget native module */
export interface WidgetBridgeModule {
  updateWidget(data: WidgetUpdatePayload): Promise<void>
  isAvailable(): Promise<boolean>
}

/** Bridge to iOS ActivityKit native module */
export interface LiveActivityBridgeModule {
  startActivity(request: LiveActivityStartRequest): Promise<string>
  updateActivity(id: string, state: Record<string, unknown>): Promise<void>
  endActivity(id: string, state: Record<string, unknown>): Promise<void>
  isAvailable(): Promise<boolean>
}

/** Bridge to iOS App Intents native module */
export interface AppIntentsBridgeModule {
  registerIntents(intents: IntentDefinition[]): Promise<void>
  isAvailable(): Promise<boolean>
}

/** Bridge to platform shortcut manager */
export interface ShortcutBridgeModule {
  setDynamicShortcuts(shortcuts: ShortcutItem[]): Promise<void>
  isAvailable(): Promise<boolean>
}

// ── Consent Permission Map ──────────────────────────────────

export const SURFACE_CONSENT_MAP: Record<string, PermissionId> = {
  widget: 'widget_data',
  live_activity: 'live_activity_data',
  app_intent: 'siri_shortcuts',
  shortcut: 'siri_shortcuts',
}
