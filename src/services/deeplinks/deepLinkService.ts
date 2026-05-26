// ══════════════════════════════════════════════════════════════
// INTENT — Deep Link Service
// Parses, validates, and routes intent:// deep links
// ══════════════════════════════════════════════════════════════

import type {
  DeepLinkAction,
  ParsedIntentUrl,
  ValidationResult,
} from '../../types/deepLink'
import { VALID_STATES, VALID_DURATIONS } from '../../types/deepLink'
import type { UserState } from '../../types/moment'

// ── Action Path Mapping ────────────────────────────────────

const PATH_TO_ACTION: Record<string, DeepLinkAction> = {
  rescue: 'rescue',
  'before-scroll': 'before_scroll',
  'capture-distraction': 'capture_distraction',
  'salvage-current': 'salvage_current',
  'body-double': 'body_double',
  'paste-chaos': 'paste_chaos',
  'quick-mission': 'quick_mission',
  comeback: 'comeback',
  'action-review': 'action_review',
  'context-review': 'context_review',
}

// ── Route Mapping ──────────────────────────────────────────

const ACTION_TO_SCREEN: Record<DeepLinkAction, string> = {
  rescue: 'rescue',
  before_scroll: 'before_scroll',
  capture_distraction: 'capture_distraction',
  salvage_current: 'salvage',
  body_double: 'body_double',
  paste_chaos: 'context_inbox',
  quick_mission: 'quick_mission',
  comeback: 'comeback',
  action_review: 'action_review',
  context_review: 'context_review',
  unknown: 'rescue_home',
}

// ── Sanitization ───────────────────────────────────────────

function sanitizeValue(value: string): string {
  // Strip HTML tags
  let sanitized = value.replace(/<[^>]*>/g, '')
  // Decode URI components
  try {
    sanitized = decodeURIComponent(sanitized)
  } catch {
    // If decoding fails, use as-is
  }
  // Strip any remaining HTML after decode
  sanitized = sanitized.replace(/<[^>]*>/g, '')
  return sanitized.trim()
}

function sanitizeParams(params: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {}
  for (const [key, value] of Object.entries(params)) {
    sanitized[key] = sanitizeValue(value)
  }
  return sanitized
}

// ── Parsing ────────────────────────────────────────────────

function parseQueryParams(queryString: string): Record<string, string> {
  const params: Record<string, string> = {}
  if (!queryString) return params

  const pairs = queryString.split('&')
  for (const pair of pairs) {
    const [key, value] = pair.split('=')
    if (key) {
      params[key] = value ?? ''
    }
  }
  return params
}

export function parseIntentUrl(url: string): ParsedIntentUrl {
  if (!url || typeof url !== 'string') {
    return { action: 'unknown', params: {}, source: 'deep_link' }
  }

  // Check for intent:// prefix
  if (!url.startsWith('intent://')) {
    return { action: 'unknown', params: {}, source: 'deep_link' }
  }

  // Remove intent:// prefix
  const remainder = url.slice('intent://'.length)

  // Split path and query
  const [pathPart, queryPart] = remainder.split('?')
  const actionPath = pathPart.replace(/\/$/, '') // strip trailing slash

  // Map path to action
  const action = PATH_TO_ACTION[actionPath] ?? 'unknown'

  // Parse and sanitize query params
  const rawParams = parseQueryParams(queryPart ?? '')
  const params = sanitizeParams(rawParams)

  return { action, params, source: 'deep_link' }
}

// ── Validation ─────────────────────────────────────────────

export function validateDeepLink(parsed: ParsedIntentUrl): ValidationResult {
  const errors: string[] = []

  // Check action is known
  if (parsed.action === 'unknown') {
    errors.push(`Unknown action: ${JSON.stringify(parsed)}`)
    return { valid: false, errors, sanitizedParams: parsed.params }
  }

  // Validate state param if present
  if (parsed.params.state && !VALID_STATES.includes(parsed.params.state as UserState)) {
    errors.push(`Invalid state: ${parsed.params.state}`)
  }

  // Validate duration param if present
  if (parsed.params.duration) {
    const duration = parseInt(parsed.params.duration, 10)
    if (isNaN(duration) || !VALID_DURATIONS.includes(duration)) {
      errors.push(`Invalid duration: ${parsed.params.duration}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitizedParams: parsed.params,
  }
}

// ── Routing ────────────────────────────────────────────────

export function routeDeepLink(parsed: ParsedIntentUrl): { screen: string; params?: Record<string, string> } {
  const screen = ACTION_TO_SCREEN[parsed.action] ?? 'rescue_home'
  return { screen, params: parsed.params }
}
