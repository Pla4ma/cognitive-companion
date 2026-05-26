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
  } from './predictiveEngine'

export type {
  TimeSlot,
  DangerWindow,
  DriftPrediction,
  PredictionFactor,
  ResistanceMapEntry,
  UserIntelligenceProfile,
} from './predictiveEngine'

// ── v4 Engines (Anti-Drift Agent) ───────────────────────────

export { runAntiDriftAgent } from '../agents/antiDriftAgent'
export { compileMission, scoreMission, rejectMission, estimateSuccessProbability } from './missionCompiler'
export { createEmptyGraph, recordEvent, computeInsights, getBestProtocol, getBestDuration, getStrongestSignal, getBestComebackStrategy, getBestSurface, summarizeGraph } from './personalDriftGraph'
export { generateSalvagePlan } from './salvageEngine'
export { routeAgent, shouldUseRemoteAI } from '../services/ai/orchestrator'
export { recordRetentionEvent, getComebackMessage, shouldShowPaywall } from '../services/retention/retentionEngine'
export { mark, measure, getMeasure, getAllMeasures, isWithinBudget, PERFORMANCE_BUDGETS } from '../services/performance/performanceMarks'
export type { GraphEvent } from './personalDriftGraph'
export type { SalvageInput, SalvagePlan } from './salvageEngine'
