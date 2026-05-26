// ══════════════════════════════════════════════════════════════
// INTENT — Agent Orchestrator (Production)
// Routes to local and remote agents with safety/privacy/quality gates.
// Deterministic-first: local engine → templates → cached → on-device → remote
// ══════════════════════════════════════════════════════════════

import type { UserPrivacySettings } from '../../types/privacy'
import type { UserState, EnergyLevel, PushStyle } from '../../types'
import { assessCrisis, filterShameLanguage, checkSafetyBoundaries, classifyContent } from '../../engine/safety'
import { hasConsented } from '../consent'
import type { ConsentLedger } from '../consent'
import type { UserProfile } from '../../types'
import {
  decideCoachResponse,
  getResponseTemplate,
  adaptResponse,
} from './coachPolicy'
import {
  checkForShameLanguage,
  checkForCrisisContent,
  sanitizeOutput,
} from './validatedAI'
import {
  rescuePrompt,
  salvagePrompt,
  brainDumpPrompt,
} from './promptLibrary'

// ── Types ─────────────────────────────────────────────────────

export type AgentId =
  | 'moment_interpreter'
  | 'mission_compiler'
  | 'protocol_selector'
  | 'salvage'
  | 'coach_pulse'
  | 'drift_insight'
  | 'context_extractor'
  | 'safety'
  | 'monetization_timing'
  | 'system_surface'

export type PipelineSource =
  | 'deterministic_rules'
  | 'template'
  | 'cached_pattern'
  | 'on_device_ai'
  | 'remote_ai'
  | 'safety_override'
  | 'consent_denied'
  | 'fallback'

export interface AgentRequest {
  agentId: AgentId
  input: Record<string, unknown>
  timeoutMs: number
  useRemoteAI: boolean
  privacySettings: UserPrivacySettings
  consentLedger?: ConsentLedger
  userProfile?: UserProfile | null
}

export interface AgentResponse {
  agentId: AgentId
  output: Record<string, unknown>
  usedRemoteAI: boolean
  fallbackUsed: boolean
  fallbackTier: PipelineSource
  latencyMs: number
  safetyPassed: boolean
  qualityScore: number
  error: string | null
}

interface PipelineStepResult {
  response: Record<string, unknown>
  source: PipelineSource
  confidence: number
  latencyMs: number
}

// ── Response Cache ────────────────────────────────────────────

interface CacheEntry {
  output: Record<string, unknown>
  qualityScore: number
  cachedAt: number
  ttlMs: number
}

const responseCache = new Map<string, CacheEntry>()

const CACHE_TTL_DYNAMIC_MS = 5 * 60 * 1000   // 5 min for dynamic content
const CACHE_TTL_STATIC_MS = 24 * 60 * 60 * 1000 // 24h for static content

function buildCacheKey(agentId: AgentId, input: Record<string, unknown>): string {
  // Stable key from agentId + sorted input keys
  const sorted = Object.keys(input).sort().map(k => `${k}:${JSON.stringify(input[k])}`).join('|')
  return `${agentId}::${sorted}`
}

function getCached(agentId: AgentId, input: Record<string, unknown>): PipelineStepResult | null {
  const key = buildCacheKey(agentId, input)
  const entry = responseCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.cachedAt > entry.ttlMs) {
    responseCache.delete(key)
    return null
  }
  return {
    response: entry.output,
    source: 'cached_pattern',
    confidence: 0.85,
    latencyMs: 0,
  }
}

function setCache(
  agentId: AgentId,
  input: Record<string, unknown>,
  output: Record<string, unknown>,
  qualityScore: number,
  isStatic: boolean,
): void {
  const key = buildCacheKey(agentId, input)
  responseCache.set(key, {
    output,
    qualityScore,
    cachedAt: Date.now(),
    ttlMs: isStatic ? CACHE_TTL_STATIC_MS : CACHE_TTL_DYNAMIC_MS,
  })
}

/** Clear the response cache. Useful for testing. */
export function clearCache(): void {
  responseCache.clear()
}

// ── Rate Limiter ──────────────────────────────────────────────

const REMOTE_RATE_LIMIT = 10 // max requests per minute
const REMOTE_RATE_WINDOW_MS = 60 * 1000

const remoteRequestTimestamps: number[] = []

function canMakeRemoteRequest(): boolean {
  const now = Date.now()
  // Purge expired timestamps
  while (remoteRequestTimestamps.length > 0 && remoteRequestTimestamps[0] < now - REMOTE_RATE_WINDOW_MS) {
    remoteRequestTimestamps.shift()
  }
  return remoteRequestTimestamps.length < REMOTE_RATE_LIMIT
}

function recordRemoteRequest(): void {
  remoteRequestTimestamps.push(Date.now())
}

// ── Safety Gate ───────────────────────────────────────────────

function runSafetyGate(
  agentId: AgentId,
  input: Record<string, unknown>,
): { safe: boolean; reason: string; modifiedInput?: Record<string, unknown> } {
  // Extract text fields for safety checking
  const textFields = extractTextFromInput(input)
  const combinedText = textFields.join(' ')

  if (!combinedText) return { safe: true, reason: '' }

  // Check for severe crisis — block and override with safety response
  const crisis = assessCrisis(combinedText)
  if (crisis.level === 'severe') {
    return {
      safe: false,
      reason: crisis.recommendedAction,
    }
  }

  // Check safety boundaries
  const boundary = checkSafetyBoundaries(combinedText)
  if (!boundary.safe) {
    const blockViolation = boundary.violations.find(v => v.reason && !v.modifiedInput)
    if (blockViolation) {
      return { safe: false, reason: blockViolation.reason }
    }
  }

  // Filter shame language from user input
  const shameResult = filterShameLanguage(combinedText)
  if (shameResult.wasModified) {
    // Shame in user input is okay — we just log it. We filter shame from *our output*.
  }

  return { safe: true, reason: '' }
}

function extractTextFromInput(input: Record<string, unknown>): string[] {
  const texts: string[] = []
  for (const value of Object.values(input)) {
    if (typeof value === 'string' && value.length > 0) {
      texts.push(value)
    }
  }
  return texts
}

// ── Consent Gate ──────────────────────────────────────────────

function runConsentGate(
  request: AgentRequest,
): { permitted: boolean; reason: string } {
  // Safety agent always runs locally regardless of consent
  if (request.agentId === 'safety') {
    return { permitted: true, reason: 'Safety agent always runs.' }
  }

  // Check AI analysis consent if a ledger is provided
  if (request.consentLedger) {
    const hasAIConsent = hasConsented(request.consentLedger, 'ai_analysis')
    if (!hasAIConsent && request.useRemoteAI) {
      return {
        permitted: false,
        reason: 'User has not consented to AI analysis. Using deterministic path only.',
      }
    }
  }

  return { permitted: true, reason: '' }
}

// ── Pipeline Steps ────────────────────────────────────────────

/** Step 1: Deterministic local logic per agent */
function tryDeterministicLocal(
  agentId: AgentId,
  input: Record<string, unknown>,
): PipelineStepResult | null {
  const startTime = Date.now()

  try {
    let output: Record<string, unknown> | null = null

    switch (agentId) {
      case 'safety': {
        const text = (input.text as string) || ''
        const crisis = assessCrisis(text)
        const classification = classifyContent(text)
        const boundary = checkSafetyBoundaries(text)
        output = {
          crisis,
          classification,
          boundary,
          safe: boundary.safe && crisis.level !== 'severe',
        }
        break
      }

      case 'protocol_selector': {
        const state = input.state as UserState
        if (state) {
          // Dynamic import of getProtocolForState is synchronous
          const { getProtocolForState } = require('../../types/rescue')
          const protocolId = getProtocolForState(state)
          output = { protocolId, state, source: 'deterministic' }
        }
        break
      }

      case 'moment_interpreter': {
        const state = input.state as UserState
        const energy = input.energy as EnergyLevel
        if (state && energy) {
          const urgency = computeUrgency(state, energy)
          const recommendedAction = computeRecommendedAction(state, energy)
          output = { state, energy, urgency, recommendedAction, source: 'deterministic' }
        }
        break
      }

      case 'coach_pulse': {
        const state = input.state as UserState
        const userMessage = (input.userMessage as string) || ''
        if (state) {
          const policy = decideCoachResponse(state, userMessage, false, 0)
          const template = getResponseTemplate(policy.responseType, state)
          output = { ...policy, template, source: 'deterministic' }
        }
        break
      }

      case 'salvage': {
        const session = input.session as { actual_seconds: number; planned_minutes: number; status: string } | undefined
        if (session) {
          const { shouldOfferSalvage, generateSalvagePlan } = require('../../engine/antiAvoidance')
          const offer = shouldOfferSalvage(session)
          if (offer) {
            const plan = generateSalvagePlan(session, input.mission ?? null)
            output = { ...plan, offerSalvage: true, source: 'deterministic' }
          } else {
            output = { offerSalvage: false, source: 'deterministic' }
          }
        }
        break
      }

      case 'drift_insight': {
        const sessions = input.sessions as unknown[]
        if (sessions && sessions.length > 0) {
          output = {
            hasData: true,
            sessionCount: sessions.length,
            source: 'deterministic',
            insight: `Based on ${sessions.length} sessions, your patterns are being tracked.`,
          }
        }
        break
      }

      case 'context_extractor': {
        const text = (input.text as string) || ''
        if (text) {
          const { processBrainDump } = require('../../engine/antiAvoidance')
          const processed = processBrainDump(text)
          output = { ...processed, source: 'deterministic' }
        }
        break
      }

      case 'mission_compiler': {
        // The mission compiler is fully deterministic — it's in its own module
        output = { needsCompilation: true, source: 'deterministic', note: 'Use compileMission directly.' }
        break
      }

      case 'monetization_timing': {
        output = { source: 'deterministic', suggestUpgrade: false }
        break
      }

      case 'system_surface': {
        output = { source: 'deterministic', surface: 'default' }
        break
      }
    }

    if (!output) return null

    return {
      response: output,
      source: 'deterministic_rules',
      confidence: 0.95,
      latencyMs: Date.now() - startTime,
    }
  } catch {
    return null
  }
}

/** Step 2: Template-based responses for common scenarios */
function tryTemplate(
  agentId: AgentId,
  input: Record<string, unknown>,
): PipelineStepResult | null {
  const startTime = Date.now()

  try {
    if (agentId === 'coach_pulse') {
      const state = (input.state as UserState) || 'ready'
      const responseType = input.responseType as string

      // Map response types to template types
      const templateType = responseType || 'tiny_action'
      const template = getResponseTemplate(templateType as Parameters<typeof getResponseTemplate>[0], state)

      if (template) {
        return {
          response: { message: template, source: 'template', state },
          source: 'template',
          confidence: 0.75,
          latencyMs: Date.now() - startTime,
        }
      }
    }

    if (agentId === 'salvage') {
      return {
        response: {
          message: 'That still counts. Want the 1-minute version?',
          source: 'template',
          offerSalvage: true,
        },
        source: 'template',
        confidence: 0.7,
        latencyMs: Date.now() - startTime,
      }
    }

    if (agentId === 'moment_interpreter') {
      const state = (input.state as UserState) || 'ready'
      const chip = getTemplateForState(state)
      if (chip) {
        return {
          response: { ...chip, source: 'template' },
          source: 'template',
          confidence: 0.7,
          latencyMs: Date.now() - startTime,
        }
      }
    }

    return null
  } catch {
    return null
  }
}

/** Step 3: Cached patterns from previous responses */
function tryCached(
  agentId: AgentId,
  input: Record<string, unknown>,
): PipelineStepResult | null {
  return getCached(agentId, input)
}

/** Step 4: On-device AI (predictive engine, pattern matching) */
function tryOnDeviceAI(
  agentId: AgentId,
  input: Record<string, unknown>,
): PipelineStepResult | null {
  const startTime = Date.now()

  try {
    if (agentId === 'drift_insight') {
      const sessions = input.sessions as Record<string, unknown>[] | undefined
      if (sessions && sessions.length >= 5) {
        const {
          buildHourlyPattern,
          buildDailyPattern,
          detectDangerWindows,
          analyzeTimeSlots,
        } = require('../../engine/predictiveEngine')

        const hourlyPattern = buildHourlyPattern(sessions)
        const dailyPattern = buildDailyPattern(sessions)
        const timeSlots = analyzeTimeSlots(sessions)
        const dangerWindows = detectDangerWindows(timeSlots)

        return {
          response: {
            hourlyPattern,
            dailyPattern,
            dangerWindows: dangerWindows.slice(0, 3),
            timeSlotsCount: timeSlots.length,
            source: 'on_device_ai',
          },
          source: 'on_device_ai',
          confidence: 0.8,
          latencyMs: Date.now() - startTime,
        }
      }
    }

    if (agentId === 'coach_pulse') {
      const state = input.state as UserState
      const userMessage = (input.userMessage as string) || ''
      if (state) {
        const policy = decideCoachResponse(state, userMessage, false, 0)
        const baseMessage = getResponseTemplate(policy.responseType, state) || ''
        const pushStyle = (input.pushStyle as PushStyle) || 'gentle'
        const energy = (input.energy as EnergyLevel) || 'medium'
        const resistance = (input.resistance as number) || 3

        const adapted = adaptResponse(baseMessage, state, energy, resistance, pushStyle)

        return {
          response: {
            message: adapted,
            policy,
            source: 'on_device_ai',
          },
          source: 'on_device_ai',
          confidence: 0.8,
          latencyMs: Date.now() - startTime,
        }
      }
    }

    return null
  } catch {
    return null
  }
}

/** Step 5: Remote AI — last resort, rate-limited */
async function tryRemoteAI(
  agentId: AgentId,
  input: Record<string, unknown>,
  timeoutMs: number,
): Promise<PipelineStepResult | null> {
  const startTime = Date.now()

  // Rate limit check
  if (!canMakeRemoteRequest()) {
    return null
  }

  // Safety agent never uses remote AI
  if (agentId === 'safety') return null

  try {
    recordRemoteRequest()

    // Build prompt from input context
    const prompt = buildRemotePrompt(agentId, input)

    // Remote AI call — placeholder for actual API integration.
    // When an API key is configured, this would call the LLM.
    // For now, return null to let the pipeline fall through to fallback.
    //
    // To integrate: replace this block with actual API call:
    //   const response = await callLLMAPI(prompt.system, prompt.user, timeoutMs)
    //   return { response, source: 'remote_ai', confidence: 0.9, latencyMs: Date.now() - startTime }

    return null
  } catch {
    return null
  }
}

function buildRemotePrompt(
  agentId: AgentId,
  input: Record<string, unknown>,
): { system: string; user: string } {
  const state = (input.state as UserState) || 'ready'
  const energy = (input.energy as EnergyLevel) || 'medium'

  switch (agentId) {
    case 'coach_pulse': {
      const protocol = input.protocol as string || 'two_minute_ignition'
      const context = input.context as string || ''
      return rescuePrompt(state, protocol, context)
    }
    case 'salvage': {
      const reason = (input.reason as string) || 'session abandoned'
      const progress = (input.partialProgress as number) || 0
      return salvagePrompt(reason, progress)
    }
    case 'context_extractor': {
      const text = (input.text as string) || ''
      return brainDumpPrompt(text)
    }
    default: {
      return {
        system: 'You are a supportive productivity coach for people with ADHD/executive function challenges. Be concise, actionable, and never use shame language.',
        user: JSON.stringify(input).slice(0, 500),
      }
    }
  }
}

// ── Main Orchestrator ─────────────────────────────────────────

/**
 * Route an agent request through the deterministic-first orchestrator.
 *
 * Pipeline: safety → consent → deterministic → template → cached → on-device → remote → fallback
 * Each step returns { response, source, confidence, latency }.
 * If any step fails, the next step is tried.
 */
export async function routeAgent(request: AgentRequest): Promise<AgentResponse> {
  const startTime = Date.now()

  // ── Step 1: Safety Gate (always runs, always local) ──
  const safetyResult = runSafetyGate(request.agentId, request.input)
  if (!safetyResult.safe) {
    // Crisis or safety block — return safety response immediately
    return {
      agentId: request.agentId,
      output: {
        safetyBlocked: true,
        reason: safetyResult.reason,
        crisis: true,
      },
      usedRemoteAI: false,
      fallbackUsed: true,
      fallbackTier: 'safety_override',
      latencyMs: Date.now() - startTime,
      safetyPassed: false,
      qualityScore: 1.0, // Safety responses are always high quality
      error: null,
    }
  }

  // ── Step 2: Consent Gate ──
  const consentResult = runConsentGate(request)
  if (!consentResult.permitted) {
    // Consent denied — try deterministic only, skip remote
    const deterministic = tryDeterministicLocal(request.agentId, request.input)
    if (deterministic) {
      return buildSuccessResponse(request, deterministic, startTime)
    }
    // Return minimal response when consent blocks everything
    return {
      agentId: request.agentId,
      output: { consentDenied: true, reason: consentResult.reason },
      usedRemoteAI: false,
      fallbackUsed: true,
      fallbackTier: 'consent_denied',
      latencyMs: Date.now() - startTime,
      safetyPassed: true,
      qualityScore: 0.3,
      error: null,
    }
  }

  // ── Step 3: Deterministic Local ──
  const deterministic = tryDeterministicLocal(request.agentId, request.input)
  if (deterministic && deterministic.confidence >= 0.8) {
    const response = buildSuccessResponse(request, deterministic, startTime)
    // Cache high-confidence deterministic responses as static
    setCache(request.agentId, request.input, response.output, response.qualityScore, true)
    return response
  }

  // ── Step 4: Templates ──
  const template = tryTemplate(request.agentId, request.input)
  if (template) {
    const response = buildSuccessResponse(request, template, startTime)
    // If deterministic result exists, merge with template
    if (deterministic) {
      response.output = { ...deterministic.response, ...response.output }
      response.qualityScore = Math.max(deterministic.confidence, template.confidence)
    }
    return response
  }

  // ── Step 5: Cached Patterns ──
  const cached = tryCached(request.agentId, request.input)
  if (cached) {
    return buildSuccessResponse(request, cached, startTime)
  }

  // ── Step 6: On-Device AI ──
  const onDevice = tryOnDeviceAI(request.agentId, request.input)
  if (onDevice) {
    const response = buildSuccessResponse(request, onDevice, startTime)
    // Cache on-device results as dynamic
    setCache(request.agentId, request.input, response.output, response.qualityScore, false)
    return response
  }

  // ── Step 7: Remote AI (if allowed) ──
  if (request.useRemoteAI && request.privacySettings.remoteAiEnabled && !request.privacySettings.localOnlyMode) {
    const remote = await tryRemoteAI(request.agentId, request.input, request.timeoutMs)
    if (remote) {
      const response = buildSuccessResponse(request, remote, startTime)
      response.usedRemoteAI = true
      // Cache remote results as dynamic
      setCache(request.agentId, request.input, response.output, response.qualityScore, false)
      return response
    }
  }

  // ── Step 8: Fallback — use deterministic if we have it, otherwise empty ──
  if (deterministic) {
    const response = buildSuccessResponse(request, deterministic, startTime)
    response.fallbackUsed = true
    response.fallbackTier = 'deterministic_rules'
    return response
  }

  // Last resort: generic fallback
  return {
    agentId: request.agentId,
    output: buildFallbackOutput(request.agentId),
    usedRemoteAI: false,
    fallbackUsed: true,
    fallbackTier: 'fallback',
    latencyMs: Date.now() - startTime,
    safetyPassed: true,
    qualityScore: 0.3,
    error: null,
  }
}

// ── Response Builders ─────────────────────────────────────────

function buildSuccessResponse(
  request: AgentRequest,
  stepResult: PipelineStepResult,
  pipelineStartTime: number,
): AgentResponse {
  // Safety-check the output text
  const outputTexts = extractTextFromInput(stepResult.response)
  const outputText = outputTexts.join(' ')

  let safetyPassed = true
  if (outputText) {
    // Check for shame language in AI output
    if (checkForShameLanguage(outputText)) {
      const shameResult = filterShameLanguage(outputText)
      // Replace shame text in output
      stepResult.response = applyShameFilter(stepResult.response, shameResult.filtered)
    }

    // Check for crisis content in output
    const crisisCheck = checkForCrisisContent(outputText)
    if (crisisCheck.isCrisis) {
      safetyPassed = false
    }
  }

  return {
    agentId: request.agentId,
    output: stepResult.response,
    usedRemoteAI: stepResult.source === 'remote_ai',
    fallbackUsed: stepResult.source === 'fallback',
    fallbackTier: stepResult.source,
    latencyMs: Date.now() - pipelineStartTime,
    safetyPassed,
    qualityScore: stepResult.confidence,
    error: null,
  }
}

function applyShameFilter(
  output: Record<string, unknown>,
  filteredText: string,
): Record<string, unknown> {
  // Find text fields and replace with filtered version
  const result = { ...output }
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string') {
      const shameCheck = filterShameLanguage(value)
      if (shameCheck.wasModified) {
        result[key] = shameCheck.filtered
      }
    }
  }
  return result
}

function buildFallbackOutput(agentId: AgentId): Record<string, unknown> {
  switch (agentId) {
    case 'coach_pulse':
      return {
        message: 'What is one tiny thing you can do right now?',
        responseType: 'tiny_action',
        maxSentences: 1,
        cta: 'Start this',
        buttons: ['Start this', 'Make smaller'],
        source: 'fallback',
      }
    case 'salvage':
      return {
        offerSalvage: true,
        message: 'You showed up. That counts. Want a 1-minute version?',
        source: 'fallback',
      }
    case 'moment_interpreter':
      return {
        urgency: 'medium',
        recommendedAction: 'Take one small step.',
        source: 'fallback',
      }
    case 'protocol_selector':
      return {
        protocolId: 'two_minute_ignition',
        source: 'fallback',
      }
    default:
      return { source: 'fallback' }
  }
}

// ── Deterministic Helpers ─────────────────────────────────────

function computeUrgency(state: UserState, energy: EnergyLevel): 'low' | 'medium' | 'high' | 'critical' {
  const stateUrgency: Record<UserState, number> = {
    ready: 0,
    bored: 1,
    tired: 2,
    scattered: 2,
    unclear: 2,
    low_confidence: 3,
    planning_loop: 3,
    fake_productivity: 3,
    stuck: 3,
    distracted: 3,
    overwhelmed: 4,
    anxious: 4,
    avoiding: 4,
    time_pressure: 4,
    doomscroll_risk: 4,
    perfectionism: 3,
    shame_spiral: 5,
  }

  const energyPenalty: Record<EnergyLevel, number> = {
    high: 0,
    medium: 0,
    low: 1,
    depleted: 2,
  }

  const score = (stateUrgency[state] || 3) + (energyPenalty[energy] || 0)

  if (score >= 6) return 'critical'
  if (score >= 4) return 'high'
  if (score >= 2) return 'medium'
  return 'low'
}

function computeRecommendedAction(state: UserState, energy: EnergyLevel): string {
  if (state === 'shame_spiral') return 'One tiny reset. No guilt.'
  if (state === 'avoiding' && energy === 'depleted') return 'Open the thing. Just open it.'
  if (state === 'overwhelmed') return 'Brain dump, then pick one thing.'
  if (state === 'stuck') return 'Name the next physical action out loud.'
  if (state === 'tired') return 'Do a 2-minute low-energy version.'
  if (state === 'ready') return 'You are ready. Start now.'
  if (state === 'doomscroll_risk') return 'Give me 2 minutes before you scroll.'
  return 'What is one tiny step you can take right now?'
}

function getTemplateForState(state: UserState): Record<string, unknown> | null {
  const templates: Partial<Record<UserState, Record<string, unknown>>> = {
    avoiding: { message: 'Open the thing you are avoiding. That is it.', duration: 2 },
    overwhelmed: { message: 'Write down everything. Pick one.', duration: 5 },
    stuck: { message: 'What is the next physical action?', duration: 10 },
    tired: { message: 'Low-energy version. Or rest. Both count.', duration: 5 },
    anxious: { message: 'Name the fear. Start before you feel ready.', duration: 5 },
    ready: { message: 'You are ready. Protect this. Start now.', duration: 25 },
    shame_spiral: { message: 'You are here now. That is the win.', duration: 2 },
    doomscroll_risk: { message: '2 minutes. One tiny action. Then scroll if you want.', duration: 2 },
  }
  return templates[state] || null
}

// ── Public Utility: Check Remote AI Availability ──────────────

/**
 * Check if remote AI should be used for this request.
 */
export function shouldUseRemoteAI(
  agentId: AgentId,
  privacySettings: UserPrivacySettings,
  localQuality: number,
): boolean {
  // Never use remote AI in local-only mode
  if (privacySettings.localOnlyMode) return false

  // Never use remote AI if user hasn't enabled it
  if (!privacySettings.remoteAiEnabled) return false

  // Safety agent always runs locally
  if (agentId === 'safety') return false

  // If local quality is high enough, don't bother with remote
  if (localQuality >= 0.8) return false

  // Rate limit check
  if (!canMakeRemoteRequest()) return false

  // Context extractor needs remote AI for complex text
  if (agentId === 'context_extractor') return true

  // Mission compiler benefits from remote AI for complex context
  if (agentId === 'mission_compiler') return true

  // Coach pulse can use remote AI for personalization
  if (agentId === 'coach_pulse') return true

  return false
}

/**
 * Validate that an agent response passes quality gate.
 */
export function passesQualityGate(response: AgentResponse): boolean {
  return response.qualityScore >= 0.5 && response.safetyPassed
}

/**
 * Sanitize agent output before displaying to user.
 */
export function sanitizeAgentOutput(output: Record<string, unknown>): Record<string, unknown> {
  // Remove any internal fields
  const safe = { ...output }
  delete safe['_internal']
  delete safe['_debug']
  delete safe['_raw']

  // Sanitize text fields
  for (const [key, value] of Object.entries(safe)) {
    if (typeof value === 'string') {
      safe[key] = sanitizeOutput(value)
    }
  }

  return safe
}
