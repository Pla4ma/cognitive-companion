// ══════════════════════════════════════════════════════════════
// INTENT — Widget Service
// Prepares data for iOS WidgetKit and Android AppWidget.
// Privacy-aware: respects widget_data consent.
// ══════════════════════════════════════════════════════════════

import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  type ConsentLedger,
  type PermissionCheck,
  checkPermission,
} from '../consent'
import {
  filterWidgetData,
  getDefaultWidgetPrivacy,
  type WidgetPrivacySettings,
  type WidgetDisplayData,
} from '../widgets/widgetPrivacy'
import type { WidgetData, WidgetState } from '../../types/systemSurface'
import type { UserProfile, MomentumScore } from '../../types'
import type {
  WidgetType,
  WidgetDataContext,
  WidgetUpdatePayload,
  WidgetKitEntry,
  AndroidWidgetData,
  WidgetBridgeModule,
} from '../../types/surfaces'

// ── Storage Keys ────────────────────────────────────────────

const WIDGET_DATA_KEY = 'intent-widget-data'
const WIDGET_PRIVACY_KEY = 'intent-widget-privacy'

// ── Platform Detection ──────────────────────────────────────

function getPlatformOS(): 'ios' | 'android' | 'web' {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Platform } = require('react-native')
    return Platform?.OS ?? 'web'
  } catch {
    return 'web'
  }
}

// ── Native Bridge ───────────────────────────────────────────

let widgetBridge: WidgetBridgeModule | null = null

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { requireNativeModule } = require('expo-modules-core')
  widgetBridge = requireNativeModule('IntentWidget') as WidgetBridgeModule
} catch {
  // Not available in Expo Go or dev builds without native module
}

// ── Widget Type Configs ─────────────────────────────────────

interface WidgetTypeConfig {
  type: WidgetType
  title: string
  defaultState: WidgetState
  requiresActiveSession: boolean
}

const WIDGET_CONFIGS: Record<WidgetType, WidgetTypeConfig> = {
  rescue_quick_action: {
    type: 'rescue_quick_action',
    title: 'Rescue',
    defaultState: 'rescue_me',
    requiresActiveSession: false,
  },
  momentum_display: {
    type: 'momentum_display',
    title: 'Momentum',
    defaultState: 'momentum_today',
    requiresActiveSession: false,
  },
  danger_window_alert: {
    type: 'danger_window_alert',
    title: 'Drift Alert',
    defaultState: 'rescue_me',
    requiresActiveSession: false,
  },
  streak_counter: {
    type: 'streak_counter',
    title: 'Streak',
    defaultState: 'momentum_today',
    requiresActiveSession: false,
  },
}

// ── Consent Check ───────────────────────────────────────────

export function checkWidgetConsent(
  ledger: ConsentLedger,
  user: UserProfile | null,
): PermissionCheck {
  return checkPermission('widget_data', ledger, user)
}

// ── Data Builders ───────────────────────────────────────────

function buildRescueQuickActionWidget(
  privacy: WidgetPrivacySettings,
): WidgetData & { display: WidgetDisplayData } {
  const rawData: WidgetDisplayData = {
    title: 'Rescue Me',
    subtitle: '2-minute mission',
    action: 'Start',
    missionText: null,
    stateLabel: null,
    category: null,
  }

  return {
    state: 'rescue_me',
    missionTitle: null,
    missionAction: null,
    timerRemaining: null,
    momentumToday: 0,
    lastRescueAt: null,
    display: filterWidgetData(rawData, privacy),
  }
}

function buildMomentumDisplayWidget(
  momentum: MomentumScore,
  sessionsToday: number,
  privacy: WidgetPrivacySettings,
): WidgetData & { display: WidgetDisplayData } {
  const trend = momentum.trend === 'up' ? '↑' : momentum.trend === 'down' ? '↓' : '→'
  const rawData: WidgetDisplayData = {
    title: `${momentum.current} pts`,
    subtitle: `${trend} this week`,
    action: 'Keep going',
    missionText: null,
    stateLabel: sessionsToday > 0 ? `${sessionsToday} sessions today` : 'Start your first',
    category: null,
  }

  return {
    state: 'momentum_today',
    missionTitle: null,
    missionAction: null,
    timerRemaining: null,
    momentumToday: momentum.current,
    lastRescueAt: null,
    display: filterWidgetData(rawData, privacy),
  }
}

function buildDangerWindowAlertWidget(
  dangerLevel: number,
  windowLabel: string,
  privacy: WidgetPrivacySettings,
): WidgetData & { display: WidgetDisplayData } {
  const rawData: WidgetDisplayData = {
    title: 'Drift Alert',
    subtitle: dangerLevel >= 0.7 ? 'High risk window' : 'Watch out',
    action: 'Rescue now',
    missionText: null,
    stateLabel: windowLabel,
    category: null,
  }

  return {
    state: 'rescue_me',
    missionTitle: null,
    missionAction: null,
    timerRemaining: null,
    momentumToday: 0,
    lastRescueAt: null,
    display: filterWidgetData(rawData, privacy),
  }
}

function buildStreakCounterWidget(
  streakDays: number,
  bestStreak: number,
  privacy: WidgetPrivacySettings,
): WidgetData & { display: WidgetDisplayData } {
  const rawData: WidgetDisplayData = {
    title: `${streakDays} day streak`,
    subtitle: `Best: ${bestStreak} days`,
    action: streakDays > 0 ? 'Protect it' : 'Start one',
    missionText: null,
    stateLabel: null,
    category: null,
  }

  return {
    state: 'momentum_today',
    missionTitle: null,
    missionAction: null,
    timerRemaining: null,
    momentumToday: streakDays,
    lastRescueAt: null,
    display: filterWidgetData(rawData, privacy),
  }
}

// ── Main API ────────────────────────────────────────────────

/**
 * Get widget data for a specific widget type.
 * Returns privacy-filtered data ready for WidgetKit / AppWidget.
 * Returns null if consent is not granted.
 */
export async function getWidgetData(
  type: WidgetType,
  ledger: ConsentLedger,
  user: UserProfile | null,
  context?: {
    momentum?: MomentumScore
    sessionsToday?: number
    dangerLevel?: number
    dangerWindowLabel?: string
    streakDays?: number
    bestStreak?: number
  },
): Promise<WidgetDataContext | null> {
  const consent = checkWidgetConsent(ledger, user)
  if (!consent.permitted) return null

  const privacy = await getWidgetPrivacySettings()
  let widgetData: WidgetData & { display: WidgetDisplayData }

  switch (type) {
    case 'rescue_quick_action':
      widgetData = buildRescueQuickActionWidget(privacy)
      break

    case 'momentum_display':
      widgetData = buildMomentumDisplayWidget(
        context?.momentum ?? { current: 0, best: 0, this_week: 0, last_week: 0, trend: 'stable', events: [] },
        context?.sessionsToday ?? 0,
        privacy,
      )
      break

    case 'danger_window_alert':
      widgetData = buildDangerWindowAlertWidget(
        context?.dangerLevel ?? 0,
        context?.dangerWindowLabel ?? 'Unknown window',
        privacy,
      )
      break

    case 'streak_counter':
      widgetData = buildStreakCounterWidget(
        context?.streakDays ?? 0,
        context?.bestStreak ?? 0,
        privacy,
      )
      break
  }

  const result: WidgetDataContext = {
    type,
    data: {
      state: widgetData.state,
      missionTitle: widgetData.missionTitle,
      missionAction: widgetData.missionAction,
      timerRemaining: widgetData.timerRemaining,
      momentumToday: widgetData.momentumToday,
      lastRescueAt: widgetData.lastRescueAt,
    },
    updatedAt: new Date().toISOString(),
    privacyMode: privacy.mode,
  }

  // Persist for native bridge to read
  await saveWidgetData(type, result)

  return result
}

/**
 * Trigger a widget refresh for a specific widget type.
 * Writes updated data to shared storage and notifies native bridge.
 */
export async function updateWidget(
  type: WidgetType,
  ledger: ConsentLedger,
  user: UserProfile | null,
  context?: Parameters<typeof getWidgetData>[3],
): Promise<boolean> {
  const data = await getWidgetData(type, ledger, user, context)
  if (!data) return false

  // Notify native bridge if available
  if (widgetBridge) {
    try {
      const payload: WidgetUpdatePayload = {
        type,
        data: { ...formatForPlatform(data) },
        timestamp: data.updatedAt,
      }
      await widgetBridge.updateWidget(payload)
      return true
    } catch {
      // Native bridge failed, data still persisted in AsyncStorage
      return false
    }
  }

  return true
}

/**
 * Check if native widget bridge is available.
 * Returns false in Expo Go.
 */
export async function isWidgetAvailable(): Promise<boolean> {
  if (!widgetBridge) return false
  try {
    return await widgetBridge.isAvailable()
  } catch {
    return false
  }
}

// ── Platform Formatting ─────────────────────────────────────

/**
 * Format widget data for the current platform.
 * iOS uses WidgetKit timeline entries, Android uses RemoteViews data.
 */
export function formatForPlatform(
  context: WidgetDataContext,
): WidgetKitEntry | AndroidWidgetData {
  const platform = getPlatformOS()

  if (platform === 'ios') {
    return formatForWidgetKit(context)
  }

  return formatForAndroidWidget(context)
}

function formatForWidgetKit(context: WidgetDataContext): WidgetKitEntry {
  const entry: WidgetKitEntry = {
    date: context.updatedAt,
    data: {
      type: context.type,
      state: context.data.state,
      missionTitle: context.data.missionTitle,
      missionAction: context.data.missionAction,
      timerRemaining: context.data.timerRemaining,
      momentumToday: context.data.momentumToday,
      lastRescueAt: context.data.lastRescueAt,
    },
  }
  return entry
}

function formatForAndroidWidget(context: WidgetDataContext): AndroidWidgetData {
  const texts: Record<string, string> = {}
  const clickActions: Record<string, string> = {}
  const visibility: Record<string, number> = {}

  switch (context.type) {
    case 'rescue_quick_action':
      texts.title = 'Rescue Me'
      texts.subtitle = '2-minute mission'
      texts.action_label = 'Start'
      clickActions.action_button = 'intent://rescue?source=widget'
      visibility.timer = 0 // GONE
      break

    case 'momentum_display':
      texts.title = `${context.data.momentumToday} pts`
      texts.subtitle = 'Your momentum'
      texts.action_label = 'See details'
      clickActions.action_button = 'intent://rescue?source=widget'
      visibility.timer = 0
      break

    case 'danger_window_alert':
      texts.title = 'Drift Alert'
      texts.subtitle = 'You might be drifting'
      texts.action_label = 'Rescue now'
      clickActions.action_button = 'intent://rescue?source=widget'
      visibility.timer = 0
      break

    case 'streak_counter':
      texts.title = `${context.data.momentumToday} days`
      texts.subtitle = 'Current streak'
      texts.action_label = 'Protect it'
      clickActions.action_button = 'intent://rescue?source=widget'
      visibility.timer = 0
      break
  }

  return {
    layoutId: 'intent_widget_layout',
    texts,
    clickActions,
    visibility,
  }
}

// ── Privacy Settings ────────────────────────────────────────

async function getWidgetPrivacySettings(): Promise<WidgetPrivacySettings> {
  try {
    const stored = await AsyncStorage.getItem(WIDGET_PRIVACY_KEY)
    if (stored) return JSON.parse(stored) as WidgetPrivacySettings
  } catch {
    // Fall through to defaults
  }
  return getDefaultWidgetPrivacy()
}

export async function setWidgetPrivacySettings(
  settings: WidgetPrivacySettings,
): Promise<void> {
  await AsyncStorage.setItem(WIDGET_PRIVACY_KEY, JSON.stringify(settings))
}

// ── Storage ─────────────────────────────────────────────────

async function saveWidgetData(
  type: WidgetType,
  data: WidgetDataContext,
): Promise<void> {
  try {
    const key = `${WIDGET_DATA_KEY}-${type}`
    await AsyncStorage.setItem(key, JSON.stringify(data))
  } catch {
    // Silent fail — widget data is non-critical
  }
}

export async function loadWidgetData(
  type: WidgetType,
): Promise<WidgetDataContext | null> {
  try {
    const key = `${WIDGET_DATA_KEY}-${type}`
    const stored = await AsyncStorage.getItem(key)
    if (stored) return JSON.parse(stored) as WidgetDataContext
  } catch {
    // Fall through
  }
  return null
}
