// ══════════════════════════════════════════════════════════════
// INTENT — Siri Shortcuts Integration
// Registers "Rescue me" and "Brain dump" shortcuts.
// Uses expo-siri-shortcuts when available, falls back gracefully.
// ══════════════════════════════════════════════════════════════

// ── Shortcut Definitions ────────────────────────────────────

export interface ShortcutDefinition {
  identifier: string
  phrase: string
  title: string
  description: string
  action: string
  params?: Record<string, unknown>
}

export const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  {
    identifier: 'com.intent.rescue-me',
    phrase: 'Rescue me',
    title: 'Rescue Me',
    description: 'Start a quick rescue session when you feel stuck',
    action: 'rescue_me',
    params: { source: 'siri_shortcut' },
  },
  {
    identifier: 'com.intent.brain-dump',
    phrase: 'Brain dump',
    title: 'Brain Dump',
    description: 'Capture what is on your mind right now',
    action: 'brain_dump',
    params: { source: 'siri_shortcut' },
  },
]

// ── Siri Shortcuts Registration ─────────────────────────────

let siriAvailable: boolean | null = null

/**
 * Registers INTENT's Siri shortcuts with the system.
 * Uses expo-siri-shortcuts if available, otherwise stores
 * definitions for future use (e.g., when the package is installed).
 */
export async function registerShortcuts(): Promise<void> {
  try {
    const SiriShortcuts = require('expo-siri-shortcuts')

    for (const shortcut of SHORTCUT_DEFINITIONS) {
      await SiriShortcuts.createShortcutAsync({
        identifier: shortcut.identifier,
        phrase: shortcut.phrase,
        title: shortcut.title,
        description: shortcut.description,
        suggestedInvocationPhrase: shortcut.phrase,
        isEligibleForPrediction: true,
        persistentIdentifier: shortcut.identifier,
      })
    }

    siriAvailable = true
  } catch {
    // expo-siri-shortcuts not available — store definitions for future use
    siriAvailable = false
  }
}

/**
 * Donates a shortcut to Siri so it appears in suggestions.
 * Called when the user performs the action naturally (not just via shortcut).
 */
export async function donateShortcut(action: 'rescue_me' | 'brain_dump'): Promise<void> {
  if (siriAvailable === false) return

  try {
    const SiriShortcuts = require('expo-siri-shortcuts')
    const definition = SHORTCUT_DEFINITIONS.find((d) => d.action === action)
    if (!definition) return

    await SiriShortcuts.donateShortcutAsync({
      identifier: definition.identifier,
      phrase: definition.phrase,
      title: definition.title,
      description: definition.description,
      suggestedInvocationPhrase: definition.phrase,
      isEligibleForPrediction: true,
      persistentIdentifier: definition.identifier,
    })
  } catch {
    // Silent fail — donation is best-effort
  }
}

// ── Shortcut Handler ────────────────────────────────────────

export interface ShortcutResult {
  action: string
  params?: Record<string, unknown>
}

/**
 * Handles an incoming shortcut activity (from Siri or system).
 * Returns the action and params to execute, or null if unrecognised.
 */
export function handleShortcut(
  activityType: string,
): ShortcutResult | null {
  const definition = SHORTCUT_DEFINITIONS.find(
    (d) => d.identifier === activityType,
  )

  if (!definition) return null

  return {
    action: definition.action,
    params: definition.params,
  }
}

/**
 * Returns the stored shortcut definitions.
 * Useful for displaying available shortcuts in settings.
 */
export function getShortcutDefinitions(): ShortcutDefinition[] {
  return [...SHORTCUT_DEFINITIONS]
}

/**
 * Checks if Siri shortcuts are available on this device.
 * Returns null if not yet determined (call registerShortcuts first).
 */
export function isSiriAvailable(): boolean | null {
  return siriAvailable
}
