// ══════════════════════════════════════════════════════════════
// INTENT — Anti-Drift Agent: Types
// Agent-specific input/output, decision, and configuration types
// ══════════════════════════════════════════════════════════════

import type {
  Moment,
  UserState,
  EnergyLevel,
  BlockerType,
} from '../../types/moment'

import type {
  DriftSignal,
  DriftSignalType,
  DriftSignalSeverity,
  DriftConfidence,
  PersonalDriftGraph,
} from '../../types/drift'

import type {
  RescueProtocolId,
  RescueProtocol,
  CoachToneRules,
  BodyDoubleRules,
  SalvageRules,
} from '../../types/rescue'

import type {
  MissionCompilationInput,
  CompiledMission,
} from '../../types/mission'

import type {
  AgentAction,
  AgentActionStatus,
  ActionRiskLevel,
  ToolRiskLevel,
  ToolDefinition,
  AuditLogEntry,
} from '../../types/agentAction'

import type {
  PrivacyClassification,
  UserPrivacySettings,
} from '../../types/privacy'

import type {
  MemoryItem,
  MemoryConfidence,
  MemoryItemType,
} from '../../types/memory'

import type {
  ContextCapsule,
} from '../../types/contextCapsule'

// ══════════════════════════════════════════════════════════════
// Agent Input / Output
// ══════════════════════════════════════════════════════════════

/**
 * The primary input to the Anti-Drift Agent.
 * Wraps a Moment with signals, graph state, and privacy settings.
 */
export interface AntiDriftInput {
  /** The current moment — user state, energy, context */
  moment: Moment | null

  /** Recent drift signals (last ~30 min window) */
  recentSignals: DriftSignal[]

  /** The user's personal drift graph (may be empty for new users) */
  driftGraph: PersonalDriftGraph | null

  /** User's privacy settings — gates remote AI, external tools, etc. */
  privacySettings: UserPrivacySettings

  /** Active context capsule (if user shared/pasted text) */
  activeContext: ContextCapsule | null

  /** Whether this is a comeback (user returning after inactivity) */
  isComeback: boolean

  /** Number of missions completed today (for fatigue / boredom detection) */
  missionsCompletedToday: number

  /** Total focus minutes today */
  focusMinutesToday: number

  /** How many times the user has abandoned today */
  abandonCountToday: number

  /** Agent invocation source */
  source: 'app_open' | 'notification' | 'widget' | 'voice' | 'automated'
}

/**
 * The complete output of the Anti-Drift Agent.
 * Deterministic-first: all fields are computable without remote AI.
 */
export interface AntiDriftOutput {
  /** The agent's top-level decision */
  decision: AgentDecision

  /** Recommended rescue protocol */
  recommendedProtocol: RescueProtocol

  /** Compiled mission (primary + fallback + salvage) */
  compiledMission: CompiledMission | null

  /** Coach pulse — immediate text the coach would say */
  coachPulse: CoachPulse

  /** Intervention decisions */
  interventions: InterventionDecisions

  /** Tools the agent proposes to use */
  proposedTools: ProposedTool[]

  /** Safety assessment */
  safetyStatus: SafetyStatus

  /** Whether remote AI was used (always false for pure deterministic path) */
  usedRemoteAI: boolean

  /** Which fallback tier was used */
  fallbackTierUsed: FallbackTier

  /** Audit entries generated this run */
  auditLog: AuditLogEntry[]

  /** Graph updates to apply */
  graphUpdates: GraphUpdate[]

  /** Memory items to create/update */
  memoryUpdates: MemoryItem[]

  /** Confidence in the overall output */
  confidence: number // 0-1
}

// ══════════════════════════════════════════════════════════════
// Agent Decision
// ══════════════════════════════════════════════════════════════

export type AgentDecisionType =
  | 'start_mission'
  | 'start_body_double'
  | 'offer_salvage'
  | 'capture_distraction'
  | 'brain_dump'
  | 'rest_suggestion'
  | 'stats_review'
  | 'planning_mode'
  | 'comeback_welcome'
  | 'doomscroll_intercept'
  | 'no_action_needed'

export interface AgentDecision {
  type: AgentDecisionType
  reason: string
  confidence: number // 0-1
  urgency: 'low' | 'medium' | 'high'
  /** Whether this decision requires user confirmation before executing */
  requiresConfirmation: boolean
  /** Human-readable explanation of why the agent chose this */
  explanation: string
}

// ══════════════════════════════════════════════════════════════
// Coach Pulse
// ══════════════════════════════════════════════════════════════

export interface CoachPulse {
  /** The primary message (short, 1-2 sentences) */
  message: string

  /** Emoji or visual indicator */
  emoji: string

  /** Tone used */
  tone: 'gentle' | 'firm' | 'urgent'

  /** Optional follow-up question */
  followUpQuestion: string | null

  /** Suggested quick actions the user can take */
  quickActions: CoachQuickAction[]

  /** Whether this pulse was generated deterministically or via AI */
  source: 'deterministic' | 'template' | 'cached' | 'on_device_ai' | 'remote_ai'
}

export interface CoachQuickAction {
  id: string
  label: string
  emoji: string
  action: AgentDecisionType
}

// ══════════════════════════════════════════════════════════════
// Intervention Decisions
// ══════════════════════════════════════════════════════════════

export interface InterventionDecisions {
  /** Should we start a body double session? */
  shouldStartBodyDouble: boolean
  bodyDoubleReason: string | null

  /** Should we hide stats (streak, momentum) to reduce shame? */
  shouldHideStats: boolean
  hideStatsReason: string | null

  /** Should we offer salvage for an in-progress mission? */
  shouldOfferSalvage: boolean
  salvageReason: string | null

  /** Should we use remote AI for mission compilation? */
  shouldUseRemoteAI: boolean
  useRemoteAIReason: string | null

  /** Should we suggest a brain dump? */
  shouldSuggestBrainDump: boolean

  /** Should we suggest rest? */
  shouldSuggestRest: boolean

  /** Should we intercept doomscrolling? */
  shouldInterceptDoomscroll: boolean
}

// ══════════════════════════════════════════════════════════════
// Proposed Tools
// ══════════════════════════════════════════════════════════════

export interface ProposedTool {
  toolId: string
  toolName: string
  riskLevel: ToolRiskLevel
  category: 'internal' | 'external' | 'mcp'
  /** Whether the tool will be auto-executed or needs confirmation */
  autoExecutable: boolean
  /** Parameters to pass to the tool */
  parameters: Record<string, unknown>
  /** Why the agent wants to use this tool */
  reason: string
}

// ══════════════════════════════════════════════════════════════
// Safety Status
// ══════════════════════════════════════════════════════════════

export type SafetyLevel = 'safe' | 'caution' | 'crisis'

export interface SafetyStatus {
  level: SafetyLevel
  /** Whether crisis language was detected in user input */
  crisisDetected: boolean
  /** Whether shame language was detected and rewritten */
  shameRewritten: boolean
  /** Whether any actions were blocked for safety */
  actionsBlocked: string[]
  /** Human-readable safety notes for logging */
  notes: string[]
}

// ══════════════════════════════════════════════════════════════
// Fallback Tiers
// ══════════════════════════════════════════════════════════════

export type FallbackTier =
  | 'deterministic_rules'   // Pure logic, no templates needed
  | 'local_templates'       // Pre-written templates
  | 'cached_patterns'       // Previously successful outputs
  | 'on_device_ai'          // On-device ML model
  | 'remote_ai'             // Remote LLM call
  | 'user_choice'           // Ask the user

// ══════════════════════════════════════════════════════════════
// Graph Updates
// ══════════════════════════════════════════════════════════════

export interface GraphUpdate {
  /** Type of update to apply */
  type: 'add_node' | 'update_edge' | 'add_insight' | 'increment_counter'
  /** The node ID or edge ID affected */
  targetId: string
  /** Payload for the update */
  payload: Record<string, unknown>
}

// ══════════════════════════════════════════════════════════════
// Agent Configuration
// ══════════════════════════════════════════════════════════════

export interface AntiDriftAgentConfig {
  /** Max signals to consider in the sliding window */
  maxSignalWindow: number
  /** Minimum confidence to recommend a protocol */
  minProtocolConfidence: number
  /** Whether body double is available (requires pro) */
  bodyDoubleAvailable: boolean
  /** Whether on-device AI is available */
  onDeviceAIAvailable: boolean
  /** Default coach tone */
  defaultTone: 'gentle' | 'firm' | 'urgent'
}

export const DEFAULT_AGENT_CONFIG: AntiDriftAgentConfig = {
  maxSignalWindow: 20,
  minProtocolConfidence: 0.3,
  bodyDoubleAvailable: false,
  onDeviceAIAvailable: false,
  defaultTone: 'gentle',
}

// ══════════════════════════════════════════════════════════════
// Re-exports for convenience
// ══════════════════════════════════════════════════════════════

export type {
  Moment,
  UserState,
  EnergyLevel,
  BlockerType,
  DriftSignal,
  DriftSignalType,
  DriftSignalSeverity,
  DriftConfidence,
  PersonalDriftGraph,
  RescueProtocolId,
  RescueProtocol,
  CoachToneRules,
  BodyDoubleRules,
  SalvageRules,
  MissionCompilationInput,
  CompiledMission,
  AgentAction,
  AgentActionStatus,
  ActionRiskLevel,
  ToolRiskLevel,
  ToolDefinition,
  AuditLogEntry,
  PrivacyClassification,
  UserPrivacySettings,
  MemoryItem,
  MemoryConfidence,
  MemoryItemType,
  ContextCapsule,
}
