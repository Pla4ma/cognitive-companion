// ══════════════════════════════════════════════════════════════
// INTENT — Drift Types
// DriftSignal, DriftGraph, and drift detection types
// ══════════════════════════════════════════════════════════════

import type { UserState } from './moment'
import type { PrivacyClassification } from './privacy'

export type DriftSignalType =
  | 'app_open_no_start'
  | 'repeated_screen_switch'
  | 'repeated_state_switch'
  | 'mission_switching'
  | 'pause_too_long'
  | 'backgrounded_during_session'
  | 'canceled_early'
  | 'stuck_button_tapped'
  | 'many_distractions'
  | 'coach_open_no_start'
  | 'momentum_view_no_start'
  | 'vault_browsing_no_start'
  | 'inactivity_after_plan'
  | 'missed_usual_start_time'
  | 'abandoned_onboarding'
  | 'notification_ignored'
  | 'returned_after_inactivity'

export type DriftSignalSeverity = 1 | 2 | 3 | 4 | 5

export type DriftConfidence = 'low' | 'emerging' | 'reliable' | 'strong'

export interface DriftSignal {
  id: string
  timestamp: string
  type: DriftSignalType
  severity: DriftSignalSeverity
  confidence: DriftConfidence
  relatedMomentId: string | null
  relatedMissionId: string | null
  metadata: Record<string, unknown>
  privacyClassification: PrivacyClassification
}

// ── Personal Drift Graph ────────────────────────────────────

export type DriftGraphNode =
  | { kind: 'state'; value: UserState }
  | { kind: 'blocker'; value: string }
  | { kind: 'protocol'; value: string }
  | { kind: 'duration'; value: number }
  | { kind: 'time_of_day'; value: string }
  | { kind: 'push_style'; value: string }
  | { kind: 'distraction'; value: string }
  | { kind: 'outcome'; value: 'completed' | 'salvaged' | 'abandoned' }
  | { kind: 'surface'; value: string }
  | { kind: 'energy'; value: string }
  | { kind: 'context_type'; value: string }

export interface DriftGraphEdge {
  id: string
  from: string
  to: string
  label: string
  weight: number
  eventCount: number
  lastUpdated: string
}

export interface DriftGraphInsight {
  id: string
  text: string
  confidence: DriftConfidence
  eventCount: number
  category: 'best_duration' | 'best_protocol' | 'worst_task' | 'strongest_signal' | 'best_comeback' | 'best_surface' | 'best_push_tone' | 'high_risk_pattern' | 'mission_quality_trend' | 'recovery_sequence' | 'drift_chain'
  relatedNodeIds: string[]
  generatedAt: string
}

export interface PersonalDriftGraph {
  userId: string
  nodes: Map<string, DriftGraphNode>
  edges: DriftGraphEdge[]
  insights: DriftGraphInsight[]
  lastComputed: string
  totalEvents: number
}

// ── Drift Radar (active detection) ──────────────────────────

export interface DriftRadarState {
  recentSignals: DriftSignal[]
  currentRisk: number
  recommendedIntervention: string | null
  lastAssessment: string
}
