// ══════════════════════════════════════════════════════════════
// INTENT — Phase 70: Deep Link Validation Tests
// ══════════════════════════════════════════════════════════════

import { parseIntentUrl, validateDeepLink, routeDeepLink } from '../services/deeplinks/deepLinkService'

describe('DeepLinkService', () => {
  // ── Parsing Tests ──────────────────────────────────────

  test('parses rescue link', () => {
    const result = parseIntentUrl('intent://rescue')
    expect(result.action).toBe('rescue')
  })

  test('parses rescue with state and duration', () => {
    const result = parseIntentUrl('intent://rescue?state=overwhelmed&duration=2')
    expect(result.action).toBe('rescue')
    expect(result.params.state).toBe('overwhelmed')
    expect(result.params.duration).toBe('2')
  })

  test('parses before-scroll link', () => {
    const result = parseIntentUrl('intent://before-scroll')
    expect(result.action).toBe('before_scroll')
  })

  test('parses capture-distraction with text', () => {
    const result = parseIntentUrl('intent://capture-distraction?text=biology%20exam')
    expect(result.action).toBe('capture_distraction')
    expect(result.params.text).toBe('biology exam')
  })

  test('parses body-double with mode', () => {
    const result = parseIntentUrl('intent://body-double?mode=gentle_cowork')
    expect(result.action).toBe('body_double')
    expect(result.params.mode).toBe('gentle_cowork')
  })

  test('parses salvage link', () => {
    const result = parseIntentUrl('intent://salvage-current')
    expect(result.action).toBe('salvage_current')
  })

  test('parses paste-chaos link', () => {
    const result = parseIntentUrl('intent://paste-chaos')
    expect(result.action).toBe('paste_chaos')
  })

  test('parses quick-mission with duration', () => {
    const result = parseIntentUrl('intent://quick-mission?duration=5')
    expect(result.action).toBe('quick_mission')
    expect(result.params.duration).toBe('5')
  })

  test('parses comeback link', () => {
    const result = parseIntentUrl('intent://comeback')
    expect(result.action).toBe('comeback')
  })

  test('parses action-review with id', () => {
    const result = parseIntentUrl('intent://action-review?actionId=abc123')
    expect(result.action).toBe('action_review')
    expect(result.params.actionId).toBe('abc123')
  })

  // ── Validation Tests ──────────────────────────────────

  test('rejects unknown action', () => {
    const parsed = parseIntentUrl('intent://unknown_action')
    const validation = validateDeepLink(parsed)
    expect(validation.valid).toBe(false)
  })

  test('rejects invalid state', () => {
    const parsed = parseIntentUrl('intent://rescue?state=invalid_state')
    const validation = validateDeepLink(parsed)
    expect(validation.valid).toBe(false)
  })

  test('rejects invalid duration', () => {
    const parsed = parseIntentUrl('intent://rescue?duration=999')
    const validation = validateDeepLink(parsed)
    expect(validation.valid).toBe(false)
  })

  test('accepts valid rescue link', () => {
    const parsed = parseIntentUrl('intent://rescue?state=overwhelmed&duration=2')
    const validation = validateDeepLink(parsed)
    expect(validation.valid).toBe(true)
  })

  // ── Routing Tests ─────────────────────────────────────

  test('routes rescue to rescue screen', () => {
    const parsed = parseIntentUrl('intent://rescue')
    const route = routeDeepLink(parsed)
    expect(route.screen).toBe('rescue')
  })

  test('routes before-scroll correctly', () => {
    const parsed = parseIntentUrl('intent://before-scroll')
    const route = routeDeepLink(parsed)
    expect(route.screen).toBe('before_scroll')
  })

  test('routes capture-distraction correctly', () => {
    const parsed = parseIntentUrl('intent://capture-distraction')
    const route = routeDeepLink(parsed)
    expect(route.screen).toBe('capture_distraction')
  })

  test('routes salvage-current correctly', () => {
    const parsed = parseIntentUrl('intent://salvage-current')
    const route = routeDeepLink(parsed)
    expect(route.screen).toBe('salvage')
  })

  test('routes body-double correctly', () => {
    const parsed = parseIntentUrl('intent://body-double')
    const route = routeDeepLink(parsed)
    expect(route.screen).toBe('body_double')
  })

  test('routes paste-chaos to context inbox', () => {
    const parsed = parseIntentUrl('intent://paste-chaos')
    const route = routeDeepLink(parsed)
    expect(route.screen).toBe('context_inbox')
  })

  test('routes unknown to rescue home', () => {
    const parsed = parseIntentUrl('intent://invalid')
    const route = routeDeepLink(parsed)
    expect(route.screen).toBe('rescue_home')
  })

  // ── Safety Tests ──────────────────────────────────────

  test('strips unsafe text from params', () => {
    const parsed = parseIntentUrl('intent://capture-distraction?text=<script>alert(1)</script>')
    expect(parsed.params.text).not.toContain('<script>')
  })

  test('handles malformed URL gracefully', () => {
    const parsed = parseIntentUrl('not-a-valid-url')
    expect(parsed.action).toBe('unknown')
  })

  test('handles empty URL', () => {
    const parsed = parseIntentUrl('')
    expect(parsed.action).toBe('unknown')
  })
})
