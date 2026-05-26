// ══════════════════════════════════════════════════════════════
// INTENT — App Intents Service
// Registers and executes Siri / Shortcuts intents.
// Maps each intent to a deep link action. Consent-gated.
// ══════════════════════════════════════════════════════════════

import {
  checkPermission,
  type ConsentLedger,
  type PermissionCheck,
} from '../consent'
import {
  buildIntentUrl,
  buildRescueUrl,
  buildBeforeScrollUrl,
  buildCaptureDistractionUrl,
  handleDeepLink,
} from '../deeplinks/deepLinkService'
import type { UserProfile } from '../../types'
import type { AppIntentAction, DEFAULT_SHORTCUTS } from '../../types/systemSurface'
import type {
  IntentDefinition,
  IntentParameter,
  IntentResult,
  IntentExecuteParams,
  AppIntentsBridgeModule,
} from '../../types/surfaces'

// ── Native Bridge ───────────────────────────────────────────

let intentsBridge: AppIntentsBridgeModule | null = null

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { requireNativeModule } = require('expo-modules-core')
  intentsBridge = requireNativeModule('IntentAppIntents') as AppIntentsBridgeModule
} catch {
  // Not available in Expo Go
}

// ── Intent Definitions ──────────────────────────────────────

export const INTENT_DEFINITIONS: IntentDefinition[] = [
  {
    id: 'start_rescue',
    title: 'Start Rescue',
    description: 'Begin a tiny rescue mission with optional state and duration',
    parameters: [
      { name: 'state', type: 'string', required: false, defaultValue: 'unclear', description: 'Your current drift state' },
      { name: 'duration', type: 'number', required: false, defaultValue: 5, description: 'Mission duration in minutes' },
      { name: 'energy', type: 'string', required: false, defaultValue: 'medium', description: 'Energy level' },
    ],
    triggerPhrase: 'Rescue me with Intent',
    deepLink: 'intent://rescue?source=app_intent',
  },
  {
    id: 'start_5min_mission',
    title: 'Start Focus Session',
    description: 'Start a timed focus session',
    parameters: [
      { name: 'duration', type: 'number', required: false, defaultValue: 25, description: 'Focus duration in minutes' },
    ],
    triggerPhrase: 'Start a focus session',
    deepLink: 'intent://rescue?source=app_intent',
  },
  {
    id: 'capture_distraction',
    title: 'Capture Distraction',
    description: 'Save a distraction thought without losing focus',
    parameters: [
      { name: 'text', type: 'string', required: false, description: 'The distraction text' },
    ],
    triggerPhrase: 'Capture distraction',
    deepLink: 'intent://capture-distraction?source=app_intent',
  },
  {
    id: 'brain_dump',
    title: 'Brain Dump',
    description: 'Capture messy thoughts and get a mission',
    parameters: [
      { name: 'text', type: 'string', required: true, description: 'Your messy thoughts' },
    ],
    triggerPhrase: 'Brain dump',
    deepLink: 'intent://paste-chaos?source=app_intent',
  },
  {
    id: 'show_momentum',
    title: 'Show Momentum',
    description: 'See your current momentum score and identity',
    parameters: [],
    triggerPhrase: 'Show my momentum',
    deepLink: 'intent://rescue?source=app_intent',
  },
  {
    id: 'salvage_current',
    title: 'Salvage Current Mission',
    description: 'Get a smaller version of the current mission',
    parameters: [],
    triggerPhrase: 'Salvage my mission',
    deepLink: 'intent://salvage-current?source=app_intent',
  },
  {
    id: 'get_next_tiny_action',
    title: 'Get Next Tiny Action',
    description: 'Get the next small action to take',
    parameters: [
      { name: 'context', type: 'string', required: false, description: 'Additional context' },
    ],
    triggerPhrase: 'Give me the smallest step',
    deepLink: 'intent://rescue?source=app_intent',
  },
  {
    id: 'before_scroll',
    title: 'Before You Scroll',
    description: 'Start a tiny win before scrolling',
    parameters: [
      { name: 'duration', type: 'number', required: false, defaultValue: 2, description: 'Duration in minutes' },
    ],
    triggerPhrase: 'Before I scroll',
    deepLink: 'intent://before-scroll?source=app_intent',
  },
]

// ── Consent Check ───────────────────────────────────────────

export function checkIntentConsent(
  ledger: ConsentLedger,
  user: UserProfile | null,
): PermissionCheck {
  return checkPermission('siri_shortcuts', ledger, user)
}

// ── Registration ────────────────────────────────────────────

/**
 * Register all intents with the native App Intents framework.
 * Called on app startup when consent is granted.
 */
export async function registerIntents(
  ledger: ConsentLedger,
  user: UserProfile | null,
): Promise<boolean> {
  const consent = checkIntentConsent(ledger, user)
  if (!consent.permitted) return false

  if (!intentsBridge) return false

  try {
    await intentsBridge.registerIntents(INTENT_DEFINITIONS)
    return true
  } catch {
    return false
  }
}

/**
 * Check if App Intents native bridge is available.
 */
export async function isIntentsAvailable(): Promise<boolean> {
  if (!intentsBridge) return false
  try {
    return await intentsBridge.isAvailable()
  } catch {
    return false
  }
}

// ── Execution ───────────────────────────────────────────────

/**
 * Execute an intent by ID with parameters.
 * Builds the appropriate deep link and routes it.
 */
export async function executeIntent(
  intentId: AppIntentAction,
  params: IntentExecuteParams,
  ledger: ConsentLedger,
  user: UserProfile | null,
): Promise<IntentResult> {
  const consent = checkIntentConsent(ledger, user)
  if (!consent.permitted) {
    return {
      success: false,
      intentId,
      message: 'Siri & Shortcuts permission not granted.',
      error: 'consent_denied',
    }
  }

  const definition = INTENT_DEFINITIONS.find(d => d.id === intentId)
  if (!definition) {
    return {
      success: false,
      intentId,
      message: `Unknown intent: ${intentId}`,
      error: 'unknown_intent',
    }
  }

  // Validate and fill defaults
  const resolvedParams = resolveParameters(definition, params)

  // Build the deep link URL
  const deepLink = buildIntentDeepLink(intentId, resolvedParams)

  // Route through deep link service
  const handleResult = handleDeepLink(deepLink)

  if (!handleResult.success) {
    return {
      success: false,
      intentId,
      message: handleResult.error ?? 'Failed to route intent.',
      error: 'routing_failed',
    }
  }

  return {
    success: true,
    intentId,
    message: `Executing ${definition.title}...`,
    route: handleResult.route,
    params: handleResult.params,
  }
}

/**
 * Look up an intent definition by ID.
 */
export function getIntentDefinition(intentId: AppIntentAction): IntentDefinition | undefined {
  return INTENT_DEFINITIONS.find(d => d.id === intentId)
}

/**
 * Get all available intent definitions.
 */
export function getAllIntentDefinitions(): IntentDefinition[] {
  return [...INTENT_DEFINITIONS]
}

// ── Deep Link Building ──────────────────────────────────────

function buildIntentDeepLink(
  intentId: AppIntentAction,
  params: Record<string, string | number | boolean>,
): string {
  const stringParams: Record<string, string> = {}
  for (const [key, value] of Object.entries(params)) {
    stringParams[key] = String(value)
  }
  stringParams.source = 'app_intent'

  switch (intentId) {
    case 'start_rescue':
      return buildRescueUrl(
        typeof params.state === 'string' ? params.state : undefined,
        typeof params.duration === 'number' ? params.duration : undefined,
        'app_intent',
      )

    case 'capture_distraction':
      return buildCaptureDistractionUrl(
        typeof params.text === 'string' ? params.text : undefined,
      )

    case 'before_scroll':
      return buildBeforeScrollUrl(
        typeof params.duration === 'number' ? params.duration : undefined,
      )

    case 'start_5min_mission':
      return buildIntentUrl('rescue', { ...stringParams, mode: 'focus' })

    case 'brain_dump':
      return buildIntentUrl('paste_chaos', stringParams)

    case 'salvage_current':
      return buildIntentUrl('salvage_current', { source: 'app_intent' })

    case 'show_momentum':
      return buildIntentUrl('rescue', { source: 'app_intent' })

    case 'get_next_tiny_action':
      return buildIntentUrl('rescue', { source: 'app_intent' })

    default:
      return buildIntentUrl('rescue', { source: 'app_intent' })
  }
}

// ── Parameter Resolution ────────────────────────────────────

function resolveParameters(
  definition: IntentDefinition,
  params: IntentExecuteParams,
): Record<string, string | number | boolean> {
  const resolved: Record<string, string | number | boolean> = {}

  for (const param of definition.parameters) {
    if (params[param.name] !== undefined) {
      resolved[param.name] = params[param.name]
    } else if (param.defaultValue !== undefined) {
      resolved[param.name] = param.defaultValue
    } else if (param.required) {
      // Required param missing — this should be caught by caller
      throw new Error(`Missing required parameter: ${param.name}`)
    }
  }

  return resolved
}
