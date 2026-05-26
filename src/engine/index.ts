// ══════════════════════════════════════════════════════════════
// INTENT — Engine Barrel Export
// Single import point for all engine functions
// ══════════════════════════════════════════════════════════════

export {
  STATE_CHIPS,
  COACH_PERSONAS,
  FOCUS_TYPES,
  getFeatureGates,
} from '../types'
export type {
  UserState as AvoidanceState,
  UserState,
  BlockerType,
  BlockerType as BLOCKER_TYPES,
  EnergyLevel,
  PushStyle,
  CoachPersona,
  FocusType,
  AIActionPlan,
  AISalvagePlan,
  DriftSignal,
  UserProfile,
  Mission,
  MissionSession,
  MicroMission,
  MomentumScore,
  ResistancePattern,
  Distraction,
  BrainDump,
  ChatMessage,
  FeatureGate,
} from '../types'

// Core engine functions
export {
  detectAvoidanceState,
  generateMicroMission,
  shouldOfferSalvage,
  calculateMomentumScore,
  analyzeResistancePatterns,
  categorizeDistraction,
  processBrainDump,
  adaptMessageToPushStyle,
} from './antiAvoidance'

// Agent functions
export {
  detectDrift,
  generateAgentAction,
  formatInterceptionForSurface,
  calculateIntentionPulse,
} from './agent'

export type {
  AgentMode,
  AgentConfidence,
  SurfaceType,
  AgentState,
  AgentInterception,
  AgentAction,
  IntentionPulse,
} from './agent'

// Safety engine functions
export {
  assessCrisis,
  filterShameLanguage,
  classifyContent,
  checkSafetyBoundaries,
  isPushStyleSafe,
  sanitizePushMessage,
  SAFETY_BOUNDARIES,
} from './safety'

export type {
  CrisisLevel,
  CrisisAssessment,
  ShameFilterResult,
  ContentCategory,
  ContentClassification,
  SafetyBoundary,
} from './safety'

// Drift Interception Orchestrator
export { DriftInterceptionOrchestrator } from './interceptor'

export type {
  DriftSignalType,
  DriftSignal as DriftSignalFromInterceptor,
  InterceptionType,
  InterceptionStrategy,
  UserPatternProfile,
  OrchestratorConfig,
} from './interceptor'

// Tool Registry & Agent Security
export { ToolRegistry, BUILTIN_TOOLS, scanForInjection } from './toolRegistry'

export type {
  ToolCategory,
  ToolRiskLevel,
  ToolParameter,
  ToolDefinition,
  ToolExecutionRequest,
  ToolExecutionResult,
  InjectionScanResult,
} from './toolRegistry'

// Predictive Intelligence Engine
export {
  predictDrift,
  buildIntelligenceProfile,
  analyzeTimeSlots,
  detectDangerWindows,
  buildHourlyPattern,
  buildDailyPattern,
  buildResistanceMap,
  analyzeTrend,
  calculateStreakMomentum,
  calculateRecoveryTime,
  calculateDriftVelocity,
  detectOptimalHours,
  buildDecayWeightedHourlyPattern,
  analyzeWeekendPatterns,
  } from './predictiveEngine'

export type {
  TimeSlot,
  DangerWindow,
  DriftPrediction,
  PredictionFactor,
  ResistanceMapEntry,
  UserIntelligenceProfile,
} from './predictiveEngine'

// ── Merged Engine Modules ──────────────────────────────────

export {
  createAttentionReceipt,
  getReceiptTitle,
  getReceiptEmoji,
  getReceiptNextCopy,
} from './sessionEngines'
export type { AttentionReceipt, AttentionReceiptOutcome } from '../types/attentionReceipt'

export {
  createMissionThread,
  addThreadEvent,
  getThreadSummary,
  setCurrentNextAction,
  setBestProtocol,
  setLastBlocker,
  completeThread,
  getCurrentNextAction,
  getThreadProgressPercent,
  type MissionThread,
  type ThreadEvent,
} from './sessionEngines'

export {
  type PersonalPlaybook,
  type PlaybookRule,
  createEmptyPlaybook,
  updatePlaybookFromOutcome,
  getPlaybookForState,
  getPlaybookSummary,
  getPlaybookStats,
  type PlaybookOutcome,
} from './sessionEngines'

export {
  generateCandidates,
  selectBestCandidate,
  explainCandidateChoice,
  type MissionCandidate,
  type CandidateScores,
  recordOutcome,
  getActiveWeights,
  resetWeights,
  type WeightSet,
} from './missionEngines'

export {
  generateSalvagePlan,
  type SalvageInput,
  type SalvagePlan,
  SALVAGE_COPY,
} from './missionEngines'

export {
  getOutcomeMeta,
  isProgress,
  getOutcomeOptions,
  getOutcomeCopy,
  getOutcomePrompt,
  type MissionOutcome,
  type OutcomeRecord,
  type OutcomeMeta,
} from './missionEngines'

export {
  createIntentLockState,
  recordExitAttempt,
  shouldShowExitFriction,
  getExitFrictionCopy,
  getExitFrictionOptions,
  getExitOptionLabel,
  deactivateIntentLock,
  type IntentLockState,
  type ExitFrictionOption,
} from './stateEngines'

export {
  createOpenLoop,
  createLoopFromCapsule,
  createLoopFromFailure,
  createLoopFromDistraction,
  updateLoopStatus,
  touchLoop,
  detectRepeatedDistractions,
  getOpenLoopCopy,
  getOpenLoopsHeader,
  getOpenLoopReliefCopy,
} from './stateEngines'
export type { OpenLoop, OpenLoopSource, OpenLoopStatus } from '../types/openLoop'

export {
  calculateIntentScore,
  getScoreDisclaimer,
  getScoreTrend,
  type IntentScore,
  type IntentScoreComponents,
} from './stateEngines'

export {
  getEmergencyStartMission,
  getEmergencyStartForState,
  getEmergencyStartCopy,
  getEmergencyStartSubcopy,
  getEmergencyStartSuccessCopy,
  recordProtocolSuccess,
  getLastSuccessful,
} from './stateEngines'

export {
  type StarterDefault,
  type MissionFeedback,
  type FeedbackEvent,
  STARTER_DEFAULTS,
  getStarterDefault,
  processFeedback,
  isNewUser,
  getNewUserCopy,
  getDay0Copy,
} from './stateEngines'

export {
  generateDriftMirrorInsight,
  getMirrorTitle,
  getMirrorSubcopy,
  getMirrorRejectionCopy,
  getMirrorAcceptanceCopy,
  getCommonMirrorPatterns,
  type DriftMirrorInsight,
} from './insights'

export {
  generateCommandlessRecommendation,
  getCommandlessCopy,
  getCommandlessReasonCopy,
  type CommandlessRecommendation,
  type DisplayMode,
  type RecommendedSurface,
} from './insights'

export {
  detectPlanningLoop,
  generatePlanningLoopCopy,
  type PlanningLoopSignal,
  resetLoopHistory,
  getLoopDetectionCount,
  DAY_PART,
} from './insights'

// ── v4 Engines (Anti-Drift Agent) ───────────────────────────

export { runAntiDriftAgent } from '../agents/antiDriftAgent'
export { compileMission, scoreMission, rejectMission, estimateSuccessProbability, generateNextStep } from './missionCompiler'
export { createEmptyGraph, recordEvent, computeInsights, getBestProtocol, getBestDuration, getStrongestSignal, getBestComebackStrategy, getBestSurface, summarizeGraph, decayEdges, analyzeRecoverySequences, analyzeDriftChains } from './personalDriftGraph'
export { routeAgent, shouldUseRemoteAI } from '../services/ai/orchestrator'
export { recordRetentionEvent, getComebackMessage, shouldShowPaywall } from '../services/retention/retentionEngine'
export { mark, measure, getMeasure, getAllMeasures, isWithinBudget, PERFORMANCE_BUDGETS } from '../services/performance/performanceMarks'
export type { GraphEvent } from './personalDriftGraph'
