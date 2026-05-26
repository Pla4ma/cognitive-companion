// ══════════════════════════════════════════════════════════════
// INTENT — Agent Run Types
// Trace of what INTENT decided and why
// ══════════════════════════════════════════════════════════════

export type AgentRunTrigger =
  | 'manual_rescue'
  | 'ambient_suggestion'
  | 'context_capsule'
  | 'notification_action'
  | 'before_scroll'
  | 'salvage'
  | 'body_double'
  | 'emergency_start'
  | 'comeback'
  | 'deep_link'

export type AgentRunStep =
  | 'safety_check'
  | 'moment_classification'
  | 'protocol_selection'
  | 'mission_compilation'
  | 'quality_gate'
  | 'privacy_gate'
  | 'tool_proposal'
  | 'final_recommendation'

export type AgentRunStepStatus = 'pending' | 'running' | 'completed' | 'skipped' | 'failed'

export interface AgentRunStepDetail {
  step: AgentRunStep
  status: AgentRunStepStatus
  startedAt: string
  completedAt: string | null
  input: Record<string, unknown> | null
  output: Record<string, unknown> | null
  durationMs: number | null
  reason: string | null
}

export interface AgentRun {
  id: string
  startedAt: string
  endedAt: string | null
  trigger: AgentRunTrigger
  inputsSummary: string
  privacyClassification: 'local_only' | 'remote_allowed'
  steps: AgentRunStepDetail[]
  selectedProtocol: string | null
  rejectedOptions: string[]
  finalMissionId: string | null
  proposedActions: string[]
  usedRemoteAI: boolean
  usedLocalFallback: boolean
  latencyMs: number | null
  errors: string[]
  userVisibleExplanation: string
  confidence: number // 0-1
}

// ── Explanation Templates ──────────────────────────────────

export const EXPLANATION_TEMPLATES: Record<string, string> = {
  state_based: 'You selected {state}. This protocol works best for similar moments.',
  time_based: 'You had {minutes} minutes. The mission was sized to fit.',
  pattern_based: 'Based on your history, {protocol} works best when you feel {state}.',
  graph_based: 'Your drift graph shows {signal}. This mission addresses that.',
  shrink_based: 'The mission was shrunk to reduce friction.',
  fallback_based: 'The primary mission was too hard. This is the easier version.',
  safety_based: 'Content was checked for safety. Nothing sensitive was sent to AI.',
  privacy_based: 'Processing stayed local because of your privacy settings.',
}

// ── Step Definitions ───────────────────────────────────────

export const AGENT_STEPS: AgentRunStep[] = [
  'safety_check',
  'moment_classification',
  'protocol_selection',
  'mission_compilation',
  'quality_gate',
  'privacy_gate',
  'tool_proposal',
  'final_recommendation',
]

export const STEP_LABELS: Record<AgentRunStep, string> = {
  safety_check: 'Safety Check',
  moment_classification: 'Moment Classification',
  protocol_selection: 'Protocol Selection',
  mission_compilation: 'Mission Compilation',
  quality_gate: 'Quality Gate',
  privacy_gate: 'Privacy Gate',
  tool_proposal: 'Tool Proposal',
  final_recommendation: 'Final Recommendation',
}
