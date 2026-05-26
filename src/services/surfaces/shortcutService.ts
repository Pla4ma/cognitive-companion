// ══════════════════════════════════════════════════════════════
// INTENT — Shortcut Service
// Registers quick actions (3D Touch / long-press) and dynamic
// shortcuts based on user state. Consent-gated.
// ══════════════════════════════════════════════════════════════

import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  checkPermission,
  type ConsentLedger,
  type PermissionCheck,
} from '../consent'
import { handleDeepLink } from '../deeplinks/deepLinkService'
import type { UserProfile, MissionSession } from '../../types'
import type { DEFAULT_SHORTCUTS, ShortcutDefinition } from '../../types/systemSurface'
import type {
  ShortcutType,
  ShortcutItem,
  ShortcutHandleResult,
  ShortcutBridgeModule,
} from '../../types/surfaces'

// ── Storage Keys ────────────────────────────────────────────

const SHORTCUTS_STATE_KEY = 'intent-shortcuts-state'

// ── Native Bridge ───────────────────────────────────────────

let shortcutBridge: ShortcutBridgeModule | null = null

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { requireNativeModule } = require('expo-modules-core')
  shortcutBridge = requireNativeModule('IntentShortcuts') as ShortcutBridgeModule
} catch {
  // Not available in Expo Go
}

// ── Static Shortcut Definitions ─────────────────────────────

interface StaticShortcutDef {
  id: string
  type: ShortcutType
  title: string
  subtitle: string
  icon: string
  deepLink: string
}

const STATIC_SHORTCUTS: StaticShortcutDef[] = [
  {
    id: 'rescue',
    type: 'rescue',
    title: 'Rescue Me',
    subtitle: 'Start a rescue mission',
    icon: 'bolt.fill',
    deepLink: 'intent://rescue?source=shortcut',
  },
  {
    id: '5min',
    type: 'focus',
    title: '5-Minute Mission',
    subtitle: 'Quick focus session',
    icon: 'timer',
    deepLink: 'intent://rescue?duration=5&source=shortcut',
  },
  {
    id: 'distract',
    type: 'capture',
    title: 'Capture Distraction',
    subtitle: 'Save the thought, return to work',
    icon: 'brain.head.profile',
    deepLink: 'intent://capture-distraction?source=shortcut',
  },
  {
    id: 'braindump',
    type: 'brain_dump',
    title: 'Brain Dump',
    subtitle: 'Dump your thoughts',
    icon: 'text.bubble.fill',
    deepLink: 'intent://paste-chaos?source=shortcut',
  },
  {
    id: 'momentum',
    type: 'momentum',
    title: 'Show Momentum',
    subtitle: 'See your progress',
    icon: 'chart.line.uptrend.xyaxis',
    deepLink: 'intent://rescue?source=shortcut',
  },
  {
    id: 'scroll',
    type: 'before_scroll',
    title: 'Before I Scroll',
    subtitle: '2 minutes first',
    icon: 'iphone.and.arrow.forward',
    deepLink: 'intent://before-scroll?source=shortcut',
  },
  {
    id: 'salvage',
    type: 'salvage',
    title: 'Salvage Mission',
    subtitle: 'Shrink and restart',
    icon: 'arrow.uturn.left.circle.fill',
    deepLink: 'intent://salvage-current?source=shortcut',
  },
  {
    id: 'body_double',
    type: 'body_double',
    title: 'Body Double',
    subtitle: 'Start a body double session',
    icon: 'person.2.fill',
    deepLink: 'intent://body-double?source=shortcut',
  },
]

// ── Consent Check ───────────────────────────────────────────

export function checkShortcutConsent(
  ledger: ConsentLedger,
  user: UserProfile | null,
): PermissionCheck {
  return checkPermission('siri_shortcuts', ledger, user)
}

// ── Registration ────────────────────────────────────────────

/**
 * Register static shortcuts as quick actions.
 * These appear on long-press of the app icon.
 */
export async function registerShortcuts(
  ledger: ConsentLedger,
  user: UserProfile | null,
): Promise<boolean> {
  const consent = checkShortcutConsent(ledger, user)
  if (!consent.permitted) return false

  if (!shortcutBridge) return false

  const items: ShortcutItem[] = STATIC_SHORTCUTS.map(s => ({
    id: s.id,
    type: s.type,
    title: s.title,
    subtitle: s.subtitle,
    icon: s.icon,
    deepLink: s.deepLink,
    isDynamic: false,
  }))

  try {
    await shortcutBridge.setDynamicShortcuts(items)
    return true
  } catch {
    return false
  }
}

/**
 * Update dynamic shortcuts based on current user state.
 * Shows contextually relevant shortcuts (e.g., "Protect streak" when active).
 */
export async function updateDynamicShortcuts(
  context: {
    activeSession?: MissionSession | null
    streakDays?: number
    lastRescueAt?: string | null
    hasDangerWindow?: boolean
  },
  ledger: ConsentLedger,
  user: UserProfile | null,
): Promise<boolean> {
  const consent = checkShortcutConsent(ledger, user)
  if (!consent.permitted) return false

  if (!shortcutBridge) return false

  const dynamicItems: ShortcutItem[] = []

  // If there's an active session, show salvage + capture
  if (context.activeSession?.status === 'active') {
    dynamicItems.push({
      id: 'dynamic-salvage',
      type: 'salvage',
      title: 'Salvage Mission',
      subtitle: context.activeSession.mission_id
        ? 'Shrink current mission'
        : 'Make it smaller',
      icon: 'arrow.uturn.left.circle.fill',
      deepLink: 'intent://salvage-current?source=shortcut',
      isDynamic: true,
    })
    dynamicItems.push({
      id: 'dynamic-capture',
      type: 'capture',
      title: 'Capture Distraction',
      subtitle: 'Save it, come back',
      icon: 'brain.head.profile',
      deepLink: 'intent://capture-distraction?source=shortcut',
      isDynamic: true,
    })
  }

  // If streak is active, show protect option
  if (context.streakDays && context.streakDays > 0) {
    dynamicItems.push({
      id: 'dynamic-streak',
      type: 'focus',
      title: `${context.streakDays}-Day Streak`,
      subtitle: 'Protect it — start a session',
      icon: 'flame.fill',
      deepLink: 'intent://rescue?source=shortcut',
      isDynamic: true,
    })
  }

  // If danger window detected, show urgent rescue
  if (context.hasDangerWindow) {
    dynamicItems.push({
      id: 'dynamic-danger',
      type: 'rescue',
      title: 'Drift Alert',
      subtitle: 'You might be drifting — rescue now',
      icon: 'exclamationmark.triangle.fill',
      deepLink: 'intent://rescue?source=shortcut',
      isDynamic: true,
    })
  }

  // Always add the core rescue shortcut
  dynamicItems.push({
    id: 'dynamic-rescue',
    type: 'rescue',
    title: 'Rescue Me',
    subtitle: '2-minute mission',
    icon: 'bolt.fill',
    deepLink: 'intent://rescue?source=shortcut',
    isDynamic: true,
  })

  try {
    await shortcutBridge.setDynamicShortcuts(dynamicItems)
    await saveShortcutsState(dynamicItems)
    return true
  } catch {
    return false
  }
}

/**
 * Check if shortcut bridge is available.
 */
export async function isShortcutsAvailable(): Promise<boolean> {
  if (!shortcutBridge) return false
  try {
    return await shortcutBridge.isAvailable()
  } catch {
    return false
  }
}

// ── Shortcut Handling ───────────────────────────────────────

/**
 * Handle a shortcut action (e.g., from quick actions menu tap).
 * Routes through the deep link service.
 */
export function handleShortcut(type: ShortcutType): ShortcutHandleResult {
  const shortcut = STATIC_SHORTCUTS.find(s => s.type === type)
  if (!shortcut) {
    return { handled: false, route: '/', params: {} }
  }

  const result = handleDeepLink(shortcut.deepLink)

  return {
    handled: result.success,
    route: result.route,
    params: result.params,
  }
}

/**
 * Handle a shortcut by its ID.
 * Used when the system delivers a specific shortcut identifier.
 */
export function handleShortcutById(shortcutId: string): ShortcutHandleResult {
  const shortcut = STATIC_SHORTCUTS.find(s => s.id === shortcutId)
  if (!shortcut) {
    return { handled: false, route: '/', params: {} }
  }

  const result = handleDeepLink(shortcut.deepLink)

  return {
    handled: result.success,
    route: result.route,
    params: result.params,
  }
}

/**
 * Get all available static shortcuts.
 */
export function getStaticShortcuts(): ShortcutItem[] {
  return STATIC_SHORTCUTS.map(s => ({
    id: s.id,
    type: s.type,
    title: s.title,
    subtitle: s.subtitle,
    icon: s.icon,
    deepLink: s.deepLink,
    isDynamic: false,
  }))
}

// ── Storage ─────────────────────────────────────────────────

async function saveShortcutsState(items: ShortcutItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SHORTCUTS_STATE_KEY, JSON.stringify(items))
  } catch {
    // Silent fail
  }
}

export async function loadShortcutsState(): Promise<ShortcutItem[]> {
  try {
    const stored = await AsyncStorage.getItem(SHORTCUTS_STATE_KEY)
    if (stored) return JSON.parse(stored) as ShortcutItem[]
  } catch {
    // Fall through
  }
  return []
}
