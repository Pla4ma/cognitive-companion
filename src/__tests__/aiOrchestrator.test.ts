// ══════════════════════════════════════════════════════════════
// INTENT — AI Orchestrator Tests
// Tests for the deterministic-first routing pipeline
// ══════════════════════════════════════════════════════════════

import {
  routeAgent,
  clearCache,
  shouldUseRemoteAI,
  passesQualityGate,
  sanitizeAgentOutput,
} from '../services/ai/orchestrator'
import type {
  AgentRequest, AgentResponse, AgentId,
} from '../services/ai/orchestrator'
import type { UserPrivacySettings } from '../types/privacy'
import type { ConsentLedger } from '../services/consent'

// ── Test Helpers ────────────────────────────────────────────

const defaultPrivacy: UserPrivacySettings = {
  analyticsEnabled: true,
  aiPersonalizationEnabled: false,
  memoryEnabled: true,
  localOnlyMode: false,
  contextProcessingEnabled: true,
  remoteAiEnabled: false,
  systemSurfacesEnabled: true,
  shareAnalyticsEnabled: false,
  crashReportingEnabled: true,
}

function makeRequest(overrides: Partial<AgentRequest> = {}): AgentRequest {
  return {
    agentId: 'coach_pulse',
    input: { state: 'avoiding', energy: 'medium' },
    timeoutMs: 5000,
    useRemoteAI: false,
    privacySettings: defaultPrivacy,
    ...overrides,
  }
}

// ── Deterministic Pipeline Tests ────────────────────────────

describe('AI Orchestrator', () => {
  beforeEach(() => {
    clearCache()
  })

  describe('deterministic-first pipeline', () => {
    test('safety agent returns deterministic result', async () => {
      const response = await routeAgent(makeRequest({
        agentId: 'safety',
        input: { text: 'I need to study for my test' },
      }))
      expect(response.agentId).toBe('safety')
      expect(response.output).toBeDefined()
      expect(response.safetyPassed).toBe(true)
    })

    test('protocol_selector returns deterministic result', async () => {
      const response = await routeAgent(makeRequest({
        agentId: 'protocol_selector',
        input: { state: 'overwhelmed' },
      }))
      expect(response.output).toBeDefined()
      expect(response.output.protocolId).toBe('shrink_the_beast')
    })

    test('moment_interpreter computes urgency deterministically', async () => {
      const response = await routeAgent(makeRequest({
        agentId: 'moment_interpreter',
        input: { state: 'avoiding', energy: 'depleted' },
      }))
      expect(response.output).toBeDefined()
      expect(response.output.urgency).toBeDefined()
      expect(response.output.recommendedAction).toBeDefined()
    })

    test('coach_pulse uses deterministic coach policy', async () => {
      const response = await routeAgent(makeRequest({
        agentId: 'coach_pulse',
        input: { state: 'stuck', energy: 'medium', userMessage: '' },
      }))
      expect(response.output).toBeDefined()
      expect(response.safetyPassed).toBe(true)
    })
  })

  // ── Safety Gate ────────────────────────────────────────────

  describe('safety gate', () => {
    test('blocks crisis content', async () => {
      const response = await routeAgent(makeRequest({
        agentId: 'coach_pulse',
        input: { state: 'avoiding', userMessage: 'I want to hurt myself' },
      }))
      expect(response.safetyPassed).toBe(false)
      expect(response.output.safetyBlocked).toBe(true)
      expect(response.output.crisis).toBe(true)
      expect(response.fallbackTier).toBe('safety_override')
    })

    test('passes normal content through safety gate', async () => {
      const response = await routeAgent(makeRequest({
        agentId: 'coach_pulse',
        input: { state: 'avoiding', userMessage: 'I need to study biology' },
      }))
      expect(response.safetyPassed).toBe(true)
    })
  })

  // ── Consent Gate ──────────────────────────────────────────

  describe('consent gate', () => {
    test('safety agent always runs regardless of consent', async () => {
      const ledger: ConsentLedger = { receipts: [], lastUpdated: new Date().toISOString(), version: '1.0.0' }
      const response = await routeAgent(makeRequest({
        agentId: 'safety',
        input: { text: 'test' },
        consentLedger: ledger,
      }))
      expect(response.safetyPassed).toBe(true)
    })

    test('falls back to deterministic when consent denies remote AI', async () => {
      const ledger: ConsentLedger = { receipts: [], lastUpdated: new Date().toISOString(), version: '1.0.0' }
      const response = await routeAgent(makeRequest({
        agentId: 'protocol_selector',
        input: { state: 'stuck' },
        useRemoteAI: true,
        consentLedger: ledger,
      }))
      // Should still get a response (deterministic)
      expect(response.output).toBeDefined()
      expect(response.usedRemoteAI).toBe(false)
    })
  })

  // ── Response Caching ──────────────────────────────────────

  describe('response caching', () => {
    test('caches deterministic responses and returns from cache', async () => {
      const req = makeRequest({
        agentId: 'protocol_selector',
        input: { state: 'avoiding' },
      })
      const first = await routeAgent(req)
      const second = await routeAgent(req)
      // Both should return the same protocol
      expect(first.output.protocolId).toBe(second.output.protocolId)
    })

    test('clearCache clears the cache', async () => {
      await routeAgent(makeRequest({
        agentId: 'protocol_selector',
        input: { state: 'tired' },
      }))
      clearCache()
      // After clearing, a new request should still work
      const response = await routeAgent(makeRequest({
        agentId: 'protocol_selector',
        input: { state: 'tired' },
      }))
      expect(response.output.protocolId).toBe('maintenance_spark')
    })
  })

  // ── Fallback Chain ────────────────────────────────────────

  describe('fallback', () => {
    test('returns fallback output for unknown agent scenarios', async () => {
      const response = await routeAgent(makeRequest({
        agentId: 'coach_pulse',
        input: {}, // empty input, no state
      }))
      expect(response.fallbackUsed).toBe(true)
      expect(response.output).toBeDefined()
    })

    test('fallback includes meaningful message for coach_pulse', async () => {
      const response = await routeAgent(makeRequest({
        agentId: 'coach_pulse',
        input: {},
      }))
      // Should get either deterministic or fallback response
      expect(response.output).toBeDefined()
    })
  })

  // ── Quality and Sanitization ──────────────────────────────

  describe('passesQualityGate', () => {
    test('passes high quality safe responses', () => {
      const response: AgentResponse = {
        agentId: 'coach_pulse',
        output: { message: 'You can do this' },
        usedRemoteAI: false,
        fallbackUsed: false,
        fallbackTier: 'deterministic_rules',
        latencyMs: 5,
        safetyPassed: true,
        qualityScore: 0.9,
        error: null,
      }
      expect(passesQualityGate(response)).toBe(true)
    })

    test('fails low quality responses', () => {
      const response: AgentResponse = {
        agentId: 'coach_pulse',
        output: {},
        usedRemoteAI: false,
        fallbackUsed: true,
        fallbackTier: 'fallback',
        latencyMs: 5,
        safetyPassed: true,
        qualityScore: 0.3,
        error: null,
      }
      expect(passesQualityGate(response)).toBe(false)
    })

    test('fails responses that did not pass safety', () => {
      const response: AgentResponse = {
        agentId: 'coach_pulse',
        output: {},
        usedRemoteAI: false,
        fallbackUsed: false,
        fallbackTier: 'deterministic_rules',
        latencyMs: 5,
        safetyPassed: false,
        qualityScore: 0.9,
        error: null,
      }
      expect(passesQualityGate(response)).toBe(false)
    })
  })

  // ── Sanitize Output ───────────────────────────────────────

  describe('sanitizeAgentOutput', () => {
    test('removes internal fields', () => {
      const output = { message: 'hello', _internal: 'debug', _debug: true, _raw: 'data' }
      const sanitized = sanitizeAgentOutput(output)
      expect(sanitized.message).toBe('hello')
      expect((sanitized as any)._internal).toBeUndefined()
      expect((sanitized as any)._debug).toBeUndefined()
      expect((sanitized as any)._raw).toBeUndefined()
    })

    test('preserves safe fields', () => {
      const output = { message: 'Keep going', responseType: 'tiny_action' }
      const sanitized = sanitizeAgentOutput(output)
      expect(sanitized.message).toBe('Keep going')
      expect(sanitized.responseType).toBe('tiny_action')
    })
  })

  // ── shouldUseRemoteAI ─────────────────────────────────────

  describe('shouldUseRemoteAI', () => {
    test('returns false in local-only mode', () => {
      const settings: UserPrivacySettings = { ...defaultPrivacy, localOnlyMode: true, remoteAiEnabled: true }
      expect(shouldUseRemoteAI('coach_pulse', settings, 0.3)).toBe(false)
    })

    test('returns false when remote AI not enabled', () => {
      const settings: UserPrivacySettings = { ...defaultPrivacy, remoteAiEnabled: false }
      expect(shouldUseRemoteAI('coach_pulse', settings, 0.3)).toBe(false)
    })

    test('returns false for safety agent', () => {
      const settings: UserPrivacySettings = { ...defaultPrivacy, remoteAiEnabled: true }
      expect(shouldUseRemoteAI('safety', settings, 0.3)).toBe(false)
    })

    test('returns false when local quality is high', () => {
      const settings: UserPrivacySettings = { ...defaultPrivacy, remoteAiEnabled: true }
      expect(shouldUseRemoteAI('coach_pulse', settings, 0.9)).toBe(false)
    })
  })
})
