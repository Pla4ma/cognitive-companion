// ══════════════════════════════════════════════════════════════
// INTENT — AI Services Barrel Export
// ══════════════════════════════════════════════════════════════

import type { ChatMessage, UserState, AvoidanceState } from '../../types'
import type { ConsentLedger } from '../consent'
import type { UserPrivacySettings } from '../../types/privacy'
import { assessCrisis, filterShameLanguage } from '../../engine/safety'
import { hasConsented } from '../consent'
import { decideCoachResponse, getResponseTemplate } from './coachPolicy'
import { streamChat } from '../ai'

// Orchestrator — deterministic-first routing pipeline
export {
  routeAgent,
  shouldUseRemoteAI,
  passesQualityGate,
  sanitizeAgentOutput,
  clearCache,
} from './orchestrator'
export type {
  AgentId,
  AgentRequest,
  AgentResponse,
  PipelineSource,
} from './orchestrator'

// Coach Policy — persona, adaptation, templates
export {
  definePersona,
  adaptResponse,
  getResponseTemplate,
  getFullResponseTemplate,
  decideCoachResponse,
  validateCoachResponse,
} from './coachPolicy'
export type {
  CoachResponseType,
  CoachPolicyDecision,
  CoachPersona,
} from './coachPolicy'

// Validated AI — output validation, shame/crisis detection, sanitization
export {
  validateResponse,
  checkForShameLanguage,
  checkForCrisisContent,
  sanitizeOutput,
  enforceMaxLength,
  validateAIPipeline,
} from './validatedAI'
export type {
  ValidationFailureReason,
  ValidatedOutput,
  ValidationStep,
  ResponseValidationResult,
  CrisisCheckResult,
} from './validatedAI'

// Prompt Library — structured prompts for LLM integration
export {
  rescuePrompt,
  salvagePrompt,
  bodyDoublePrompt,
  brainDumpPrompt,
} from './promptLibrary'
export type { PromptPair } from './promptLibrary'

// ── Coach Stream Response (Orchestrated) ───────────────────

export interface CoachContext {
  userName: string
  pushStyle: 'gentle' | 'firm' | 'emergency'
  currentMomentum: number
  activeMissions: number
  todayMinutes: number
  currentStreak: number
  recentAvoidance: AvoidanceState | null
  driftRisk?: string
  dangerWindows?: number
}

/**
 * Orchestrated coach streaming response.
 *
 * Pipeline:
 *  1. Crisis check — if severe, return safety response immediately
 *  2. Deterministic coach policy — if confidence > 0.8, use template
 *  3. Consent / privacy gate — check ai_personalization consent, remoteAiEnabled, localOnlyMode
 *  4. If cannot use remote AI, fall back to template response
 *  5. Call streamChat with shame-language filtering on output
 */
export async function coachStreamResponse(
  conversationHistory: ChatMessage[],
  userMessage: string,
  context: CoachContext,
  consentLedger: ConsentLedger | null,
  privacySettings: UserPrivacySettings,
  onChunk: (text: string) => void,
  onComplete: (fullText: string) => void,
): Promise<void> {
  // ── Step 1: Crisis check ──
  const crisis = assessCrisis(userMessage)
  if (crisis.level === 'severe') {
    const safetyResponse = 'I hear you, and I want you to know you\'re not alone. Please reach out to someone who can help right now.\n\n🆘 Crisis Text Line: Text HOME to 741741\n📞 National Suicide Prevention Lifeline: 988\n\nYou matter. Please talk to someone.'
    onChunk(safetyResponse)
    onComplete(safetyResponse)
    return
  }

  // ── Step 2: Deterministic coach policy ──
  // Infer UserState from user message keywords for the policy engine
  const inferredState = inferUserState(userMessage, context.recentAvoidance)
  const policy = decideCoachResponse(inferredState, userMessage, context.activeMissions > 0, 0)
  if (policy.responseType !== 'safety_redirect') {
    const template = getResponseTemplate(policy.responseType, inferredState)
    // Only use template directly if it's a high-confidence deterministic match
    // and the user hasn't opted into personalization (i.e., keep it simple)
    const hasPersonalizationConsent = consentLedger
      ? hasConsented(consentLedger, 'ai_analysis')
      : false

    // If no personalization consent and not in remote mode, use template
    if (!hasPersonalizationConsent && (privacySettings.localOnlyMode || !privacySettings.remoteAiEnabled)) {
      const response = template || 'What is one tiny thing you can do right now?'
      onChunk(response)
      onComplete(response)
      return
    }
  }

  // ── Step 3: Consent / privacy gate for remote AI ──
  const hasAIConsent = consentLedger
    ? hasConsented(consentLedger, 'ai_analysis')
    : false

  const canUseRemote = hasAIConsent
    && privacySettings.remoteAiEnabled
    && !privacySettings.localOnlyMode

  // ── Step 4: If can't use remote AI, fall back to template ──
  if (!canUseRemote) {
    const template = getResponseTemplate(policy.responseType, inferredState)
    const fallbackResponse = template || 'What is one tiny thing you can do right now?'
    onChunk(fallbackResponse)
    onComplete(fallbackResponse)
    return
  }

  // ── Step 5: Call streamChat with shame-language filtering ──
  await streamChat(
    conversationHistory,
    userMessage,
    context,
    (text) => onChunk(text),
    (fullText) => {
      // Filter shame language from AI output
      const shameResult = filterShameLanguage(fullText)
      onComplete(shameResult.filtered)
    },
  )
}

/**
 * Infer a UserState from the user's message text and recent avoidance data.
 * Used to feed the deterministic coach policy engine.
 */
function inferUserState(message: string, recentAvoidance: AvoidanceState | null): UserState {
  const lower = message.toLowerCase()

  if (lower.includes('hate myself') || lower.includes('worthless') || lower.includes('kill myself')) {
    return 'shame_spiral'
  }
  if (lower.includes('overwhelm') || lower.includes('too much') || lower.includes('can\'t handle')) {
    return 'overwhelmed'
  }
  if (lower.includes('avoid') || lower.includes('procrastinat') || lower.includes('can\'t start') || lower.includes('don\'t want to')) {
    return 'avoiding'
  }
  if (lower.includes('stuck') || lower.includes('don\'t know') || lower.includes('no idea')) {
    return 'stuck'
  }
  if (lower.includes('tired') || lower.includes('exhausted') || lower.includes('no energy')) {
    return 'tired'
  }
  if (lower.includes('distract') || lower.includes('lost focus') || lower.includes('went off')) {
    return 'distracted'
  }
  if (lower.includes('anxious') || lower.includes('worried') || lower.includes('nervous')) {
    return 'anxious'
  }
  if (lower.includes('scattered') || lower.includes('all over') || lower.includes('unfocused')) {
    return 'scattered'
  }

  // Fall back to recent avoidance state or 'ready'
  return (recentAvoidance as UserState) || 'ready'
}
