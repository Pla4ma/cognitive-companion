// ══════════════════════════════════════════════════════════════
// INTENT — Crash Reporting Service
// Consent-gated Sentry integration. Zero data leaves the device
// unless the user explicitly grants crash_reporting permission.
// ══════════════════════════════════════════════════════════════

import * as Sentry from '@sentry/react-native'
import { Platform } from 'react-native'

// ── State ───────────────────────────────────────────────────

let _initialized = false
let _consentGranted = false
let _dsn: string | null = null

// ── PII Scrubbing ───────────────────────────────────────────

/** Keys that may contain personally identifiable information */
const PII_KEYS = [
  'email', 'phone', 'address', 'name', 'display_name',
  'avatar_url', 'password', 'ssn', 'credit_card',
  'bank_account', 'ip_address', 'location', 'lat', 'lng',
  'latitude', 'longitude', 'raw_content', 'brain_dump',
  'context_text', 'distraction_content', 'message_body',
]

/**
 * Deep-scrub PII from an object. Returns a new object with
 * sensitive keys redacted and long strings truncated.
 */
function scrubPII(obj: unknown, depth = 0): unknown {
  if (depth > 10) return '[max depth]'
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'string') {
    return obj.length > 200 ? obj.slice(0, 200) + '…[truncated]' : obj
  }
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(item => scrubPII(item, depth + 1))

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase()
    if (PII_KEYS.some(pii => lowerKey.includes(pii))) {
      result[key] = '[redacted]'
    } else {
      result[key] = scrubPII(value, depth + 1)
    }
  }
  return result
}

// ── beforeSend Hook ─────────────────────────────────────────

function beforeSendHook(event: Sentry.ErrorEvent, _hint: unknown): Sentry.ErrorEvent | null {
  if (!_consentGranted) return null

  // Scrub PII from all relevant fields
  if (event.extra) {
    event.extra = scrubPII(event.extra) as Record<string, unknown>
  }
  if (event.tags) {
    event.tags = scrubPII(event.tags) as Record<string, string>
  }
  if (event.user) {
    // Keep only anonymized ID, strip everything else
    event.user = event.user.id ? { id: event.user.id } : undefined
  }
  if (event.contexts) {
    event.contexts = scrubPII(event.contexts) as typeof event.contexts
  }
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map(bc => ({
      ...bc,
      data: bc.data ? scrubPII(bc.data) as Record<string, unknown> : bc.data,
    }))
  }

  return event
}

// ── Initialization ──────────────────────────────────────────

/**
 * Initialize Sentry crash reporting.
 * Must be called early in app lifecycle (before React renders).
 * Reports are ONLY sent if consent has been granted.
 */
export function initCrashReporting(dsn: string): void {
  if (_initialized) return

  _dsn = dsn

  Sentry.init({
    dsn,
    tracesSampleRate: 0.2,
    enableAutoSessionTracking: true,
    maxBreadcrumbs: 50,
    beforeSend: beforeSendHook,
    environment: __DEV__ ? 'development' : 'production',
    // Default to disabled until consent is confirmed
    enabled: false,
    attachStacktrace: true,
    // Don't send PII fields that Sentry might auto-collect
    sendDefaultPii: false,
  })

  _initialized = true
}

// ── Consent Mode ────────────────────────────────────────────

/**
 * Enable or disable crash reporting based on user consent.
 * When consent is revoked: disables Sentry, clears user context,
 * and ensures zero data leaves the device.
 */
export function setConsentMode(hasConsent: boolean): void {
  _consentGranted = hasConsent

  if (!_initialized) return

  if (hasConsent) {
    // Re-enable client transport
    Sentry.getCurrentScope().clear()
    // Re-init with enabled flag by closing and reopening
    Sentry.close().then(() => {
      if (_dsn) {
        Sentry.init({
          dsn: _dsn,
          tracesSampleRate: 0.2,
          enableAutoSessionTracking: true,
          maxBreadcrumbs: 50,
          beforeSend: beforeSendHook,
          environment: __DEV__ ? 'development' : 'production',
          enabled: true,
          sendDefaultPii: false,
          attachStacktrace: true,
        })
      }
    })
  } else {
    // Disable all reporting and clear any stored data
    Sentry.getCurrentScope().clear()
    Sentry.close()
  }
}

// ── User Context ────────────────────────────────────────────

/**
 * Set anonymized user context for crash reports.
 * Only an anonymized hash of the user ID is sent —
 * no email, name, or other identifying information.
 */
export function setUserContext(user: { id: string } | null): void {
  if (!_consentGranted || !_initialized) return

  if (!user) {
    Sentry.getCurrentScope().setUser(null)
    return
  }

  // Send only an anonymized hash of the user ID
  const anonymizedId = `user_${hashString(user.id)}`

  Sentry.getCurrentScope().setUser({
    id: anonymizedId,
  })
}

// ── Breadcrumbs ─────────────────────────────────────────────

/**
 * Add a navigation/action breadcrumb for debugging context.
 * Breadcrumbs are only recorded when consent is granted.
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
): void {
  if (!_consentGranted || !_initialized) return

  Sentry.addBreadcrumb({
    category,
    message,
    data: data ? scrubPII(data) as Record<string, unknown> : undefined,
    level: 'info',
    timestamp: Date.now() / 1000,
  })
}

// ── Error Capture ───────────────────────────────────────────

type ErrorContext = Record<string, unknown>

/**
 * Report an error with additional context.
 * All context is scrubbed for PII before sending.
 */
export function captureError(
  error: Error,
  context?: ErrorContext,
): void {
  if (!_consentGranted || !_initialized) return

  Sentry.withScope(scope => {
    if (context) {
      const scrubbed = scrubPII(context) as Record<string, unknown>
      for (const [key, value] of Object.entries(scrubbed)) {
        scope.setExtra(key, value)
      }
    }
    scope.setLevel('error')
    Sentry.captureException(error)
  })
}

// ── Message Capture ─────────────────────────────────────────

type MessageLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug'

/**
 * Report a message (non-error) with a severity level.
 */
export function captureMessage(
  message: string,
  level: MessageLevel = 'info',
): void {
  if (!_consentGranted || !_initialized) return

  Sentry.captureMessage(message, level)
}

// ── Utilities ───────────────────────────────────────────────

/**
 * Simple non-cryptographic hash for anonymizing user IDs.
 * Produces a short hex string from an input string.
 */
function hashString(input: string): string {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return Math.abs(hash).toString(36)
}
