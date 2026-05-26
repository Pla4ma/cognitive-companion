// ══════════════════════════════════════════════════════════════
// INTENT — AI Services Barrel Export
// ══════════════════════════════════════════════════════════════

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
