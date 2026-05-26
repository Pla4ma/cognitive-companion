// ══════════════════════════════════════════════════════════════
// INTENT — Deep Link Service
// Parses, validates, and routes all intent:// URLs
// ══════════════════════════════════════════════════════════════

import type {
  DeepLinkAction,
  DeepLinkSource,
  ParsedIntentUrl,
  ValidationResult,
  DeepLinkAction_,
  DeepLinkHandleResult,
} from '../../types/deepLink'
import {
  DEEP_LINK_ROUTES,
  VALID_STATES,
  VALID_DURATIONS,
  VALID_ENERGIES,
  VALID_MODES,
} from '../../types/deepLink'

// ── URL Parsing ────────────────────────────────────────────

const INTENT_URL_REGEX = /^intent:\/\/([\w-]+)(?:\?(.+))?$/

export function parseIntentUrl(url: string): ParsedIntentUrl {
  const match = url.match(INTENT_URL_REGEX)
  if (!match) {
    return { action: 'unknown', params: {}, source: 'unknown' }
  }

  const action = match[1] as DeepLinkAction
  const params: Record<string, string> = {}

  if (match[2]) {
    const searchParams = new URLSearchParams(match[2])
    searchParams.forEach((value, key) => {
      params[key] = value
    })
  }

  // Detect source from params
  const source = (params.source as DeepLinkSource) ?? 'deep_link'

  return { action, params, source }
}

// ── Validation ─────────────────────────────────────────────

export function validateDeepLink(parsed: ParsedIntentUrl): ValidationResult {
  const errors: string[] = []
  const sanitizedParams: Record<string, string> = {}

  // Validate action
  if (!(parsed.action in DEEP_LINK_ROUTES)) {
    errors.push(`Unknown action: ${parsed.action}`)
  }

  // Validate and sanitize params
  if (parsed.params.state) {
    const state = parsed.params.state.toLowerCase().trim()
    if ((VALID_STATES as readonly string[]).includes(state)) {
      sanitizedParams.state = state
    } else {
      errors.push(`Invalid state: ${parsed.params.state}`)
    }
  }

  if (parsed.params.duration) {
    const duration = parseInt(parsed.params.duration, 10)
    if (VALID_DURATIONS.includes(duration)) {
      sanitizedParams.duration = duration.toString()
    } else {
      errors.push(`Invalid duration: ${parsed.params.duration}`)
    }
  }

  if (parsed.params.energy) {
    const energy = parsed.params.energy.toLowerCase().trim()
    if ((VALID_ENERGIES as readonly string[]).includes(energy)) {
      sanitizedParams.energy = energy
    } else {
      errors.push(`Invalid energy: ${parsed.params.energy}`)
    }
  }

  if (parsed.params.mode) {
    const mode = parsed.params.mode.toLowerCase().trim()
    if (VALID_MODES.includes(mode)) {
      sanitizedParams.mode = mode
    }
  }

  // Sanitize text params (strip unsafe content)
  if (parsed.params.text) {
    sanitizedParams.text = sanitizeText(parsed.params.text)
  }

  // Pass through safe IDs
  if (parsed.params.actionId) {
    sanitizedParams.actionId = sanitizeId(parsed.params.actionId)
  }
  if (parsed.params.capsuleId) {
    sanitizedParams.capsuleId = sanitizeId(parsed.params.capsuleId)
  }

  // Copy source
  if (parsed.params.source) {
    sanitizedParams.source = parsed.params.source
  }

  return { valid: errors.length === 0, errors, sanitizedParams }
}

// ── Action Building ────────────────────────────────────────

export function buildDeepLinkAction(parsed: ParsedIntentUrl, validation: ValidationResult): DeepLinkAction_ {
  const action = validation.valid ? parsed.action : 'unknown'
  const route = DEEP_LINK_ROUTES[action]

  return {
    action,
    params: validation.sanitizedParams,
    source: parsed.source,
    momentSource: parsed.source,
    routeName: route,
    shouldCreateMoment: ['rescue', 'before_scroll', 'quick_mission', 'comeback', 'body_double'].includes(action),
    shouldRunAgent: ['rescue', 'quick_mission', 'comeback'].includes(action),
    requiresAuth: false, // Deep links should work without auth
    requiresReview: ['action_review', 'context_review'].includes(action),
    privacyClassification: 'local_only',
  }
}

// ── Moment Creation ────────────────────────────────────────

export function createMomentFromDeepLink(action: DeepLinkAction_): Record<string, unknown> | null {
  if (!action.shouldCreateMoment) return null

  return {
    source: action.momentSource,
    user_state: action.params.state ?? 'unclear',
    available_minutes: action.params.duration ? parseInt(action.params.duration, 10) : 5,
    energy_level: action.params.energy ?? 'medium',
    context_text: action.params.text ?? null,
  }
}

// ── Route Instruction ──────────────────────────────────────

export function routeDeepLink(action: DeepLinkAction_): { route: string; params: Record<string, string> } {
  return {
    route: action.routeName,
    params: action.params,
  }
}

// ── Main Handler ───────────────────────────────────────────

export function handleDeepLink(url: string): DeepLinkHandleResult {
  const parsed = parseIntentUrl(url)
  const validation = validateDeepLink(parsed)
  const action = buildDeepLinkAction(parsed, validation)
  const route = routeDeepLink(action)

  if (!validation.valid) {
    return {
      success: false,
      route: '/',
      params: {},
      action,
      error: validation.errors.join('; '),
    }
  }

  return {
    success: true,
    route: route.route,
    params: route.params,
    action,
  }
}

// ── URL Builders ───────────────────────────────────────────

export function buildIntentUrl(
  action: DeepLinkAction,
  params?: Record<string, string>,
): string {
  const searchParams = new URLSearchParams(params ?? {})
  const query = searchParams.toString()
  return `intent://${action}${query ? `?${query}` : ''}`
}

export function buildRescueUrl(state?: string, duration?: number, source?: string): string {
  const params: Record<string, string> = {}
  if (state) params.state = state
  if (duration) params.duration = duration.toString()
  if (source) params.source = source
  return buildIntentUrl('rescue', params)
}

export function buildBeforeScrollUrl(duration?: number): string {
  const params: Record<string, string> = {}
  if (duration) params.duration = duration.toString()
  return buildIntentUrl('before_scroll', params)
}

export function buildCaptureDistractionUrl(text?: string): string {
  const params: Record<string, string> = {}
  if (text) params.text = text
  return buildIntentUrl('capture_distraction', params)
}

// ── Sanitization ───────────────────────────────────────────

function sanitizeText(text: string): string {
  // Remove control characters, limit length
  return text
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/[<>]/g, '')
    .substring(0, 500)
    .trim()
}

function sanitizeId(id: string): string {
  // Only allow alphanumeric, hyphens, underscores
  return id.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 100)
}
