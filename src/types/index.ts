// ══════════════════════════════════════════════════════════════
// INTENT — Complete Type System v4 (Anti-Drift Agent)
// Deep domain model for the personal anti-drift agent
// Single source of truth: deep modules + legacy compat
// ══════════════════════════════════════════════════════════════

// ── Deep Type Modules (v4) ──────────────────────────────────
export * from './moment'
export * from './drift'
export * from './rescue'
export * from './mission'
export * from './agentAction'
export * from './contextCapsule'
export * from './privacy'
export * from './systemSurface'
export * from './memory'
export * from './ambient'
export * from './contextInbox'
export * from './actionHandoff'
export * from './deepLink'
export * from './agentRun'
export * from './voice'

// ── Legacy Compatibility Layer ──────────────────────────────
// These types are kept for backward compat with existing code.
// New code should import from the deep modules directly.

export type MissionStatus = 'active' | 'completed' | 'abandoned' | 'salvaged'
export type ResistanceLevel = 'low' | 'medium' | 'high' | 'critical'
export type BodyDoubleMode = 'none' | 'presence' | 'voice' | 'screen_share'
export type PushStyle = 'gentle' | 'firm' | 'emergency'

export interface CoachPersona {
  id: PushStyle
  emoji: string
  name: string
  description: string
}

export const COACH_PERSONAS: CoachPersona[] = [
  { id: 'gentle', emoji: '🌱', name: 'Sage', description: 'Patient, nurturing, empathetic' },
  { id: 'firm', emoji: '🔥', name: 'Coach', description: 'Direct, motivating, no-nonsense' },
  { id: 'emergency', emoji: '⚡', name: 'Spark', description: 'Urgent, high-energy, breaking through' },
]

export function getCoachPersona(id: PushStyle): CoachPersona {
  return COACH_PERSONAS.find(p => p.id === id) ?? COACH_PERSONAS[0]
}

export type PlanTier = 'free' | 'pro' | 'lifetime'
export type OnboardingStep = 0 | 1 | 2 | 3 | 4 | 5
export type AvoidanceState = import('./moment').UserState

// ── State Chip Configuration ────────────────────────────────

export interface StateChip {
  id: string
  label: string
  emoji: string
  color: string
  description: string
  rescue_strategy: string
  suggested_duration: number
  body_double_mode: BodyDoubleMode
}

export const STATE_CHIPS: Record<string, StateChip> = {
  avoiding: { id: 'avoiding', label: 'Avoiding', emoji: '🙈', color: '#EF4444', description: 'I know what I need to do but I can\'t start', rescue_strategy: '2-minute rule', suggested_duration: 2, body_double_mode: 'presence' },
  overwhelmed: { id: 'overwhelmed', label: 'Overwhelmed', emoji: '🌊', color: '#F59E0B', description: 'Too much on my plate', rescue_strategy: 'Brain dump, then smallest action', suggested_duration: 5, body_double_mode: 'voice' },
  stuck: { id: 'stuck', label: 'Stuck', emoji: '🫠', color: '#8B5CF6', description: 'Want to move but don\'t know how', rescue_strategy: 'Next physical action', suggested_duration: 10, body_double_mode: 'presence' },
  tired: { id: 'tired', label: 'Tired', emoji: '😴', color: '#6366F1', description: 'Low energy', rescue_strategy: 'Low-energy version', suggested_duration: 5, body_double_mode: 'presence' },
  distracted: { id: 'distracted', label: 'Distracted', emoji: '🦋', color: '#EC4899', description: 'Kept getting pulled away', rescue_strategy: 'Capture distraction, return', suggested_duration: 15, body_double_mode: 'screen_share' },
  anxious: { id: 'anxious', label: 'Anxious', emoji: '😰', color: '#F97316', description: 'Stressed and worried', rescue_strategy: 'Name the fear, start before ready', suggested_duration: 5, body_double_mode: 'voice' },
  scattered: { id: 'scattered', label: 'Scattered', emoji: '🌪️', color: '#14B8A6', description: 'Jumping between things', rescue_strategy: 'Close all, pick ONE', suggested_duration: 10, body_double_mode: 'presence' },
  ready: { id: 'ready', label: 'Ready', emoji: '🚀', color: '#10B981', description: 'Ready to go', rescue_strategy: 'Protect this state, start now', suggested_duration: 25, body_double_mode: 'none' },
  bored: { id: 'bored', label: 'Bored', emoji: '😑', color: '#64748B', description: 'Task feels mind-numbing', rescue_strategy: 'Add a constraint', suggested_duration: 10, body_double_mode: 'none' },
  perfectionism: { id: 'perfectionism', label: 'Perfectionism', emoji: '✨', color: '#A855F7', description: 'Can\'t start until perfect', rescue_strategy: 'Ugly first draft', suggested_duration: 5, body_double_mode: 'presence' },
  unclear: { id: 'unclear', label: 'Unclear', emoji: '❓', color: '#64748B', description: 'Don\'t know the first step', rescue_strategy: 'Name the confusion', suggested_duration: 5, body_double_mode: 'voice' },
  time_pressure: { id: 'time_pressure', label: 'Time Pressure', emoji: '⏰', color: '#DC2626', description: 'Running out of time', rescue_strategy: 'Define enough', suggested_duration: 5, body_double_mode: 'none' },
  low_confidence: { id: 'low_confidence', label: 'Low Confidence', emoji: '😔', color: '#78716C', description: 'Don\'t think I can do this', rescue_strategy: 'Smallest version, proof first', suggested_duration: 2, body_double_mode: 'presence' },
  shame_spiral: { id: 'shame_spiral', label: 'Shame Spiral', emoji: '🌀', color: '#991B1B', description: 'Avoided so long I feel terrible', rescue_strategy: 'One tiny reset', suggested_duration: 2, body_double_mode: 'voice' },
  fake_productivity: { id: 'fake_productivity', label: 'Fake Productivity', emoji: '📋', color: '#CA8A04', description: 'Planning but not doing', rescue_strategy: 'Close planning, do one action', suggested_duration: 5, body_double_mode: 'presence' },
  planning_loop: { id: 'planning_loop', label: 'Planning Loop', emoji: '🔄', color: '#7C3AED', description: 'Planning but never executing', rescue_strategy: 'Timer + first physical action', suggested_duration: 5, body_double_mode: 'presence' },
  doomscroll_risk: { id: 'doomscroll_risk', label: 'Doomscroll Risk', emoji: '📱', color: '#DB2777', description: 'About to lose time scrolling', rescue_strategy: '2 minutes before scrolling', suggested_duration: 2, body_double_mode: 'presence' },
}

// ── Legacy Domain Models ────────────────────────────────────

export interface UserProfile {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  push_style: PushStyle
  onboarding_complete: boolean
  onboarding_step: OnboardingStep
  plan: PlanTier
  timezone: string
  body_double_enabled: boolean
  vault_enabled: boolean
  local_only: boolean
  created_at: string
  updated_at: string
}

export interface Mission {
  id: string
  user_id: string
  title: string
  description: string
  status: MissionStatus
  resistance_level: ResistanceLevel
  avoidance_state: string | null
  color: string
  icon: string
  deadline: string | null
  completed_at: string | null
  salvaged_at: string | null
  salvage_notes: string | null
  created_at: string
  updated_at: string
}

export interface MissionSession {
  id: string
  user_id: string
  mission_id: string | null
  micro_mission_id: string | null
  mode: 'focus' | 'salvage' | 'body_double'
  planned_minutes: number
  actual_seconds: number
  status: 'active' | 'paused' | 'completed' | 'salvaged' | 'abandoned'
  started_at: string
  ended_at: string | null
  distractions_captured: number
  resistance_start: ResistanceLevel | null
  resistance_end: ResistanceLevel | null
  notes: string | null
  created_at: string
}

export interface MomentumEvent {
  id: string
  user_id: string
  type: string
  mission_id: string | null
  micro_mission_id: string | null
  points: number
  note: string | null
  created_at: string
}

export interface MomentumScore {
  current: number
  best: number
  this_week: number
  last_week: number
  trend: 'up' | 'down' | 'stable'
  events: MomentumEvent[]
}

export interface ResistancePattern {
  id: string
  user_id: string
  avoidance_state: string
  mission_type: string
  frequency: number
  last_occurred: string
  typical_duration_minutes: number
  successful_strategy: string | null
  created_at: string
  updated_at: string
}

// NOTE: The old MicroMission interface (snake_case fields) has been replaced
// by the new MicroMission in types/mission.ts (camelCase fields).
// Existing code using the old interface must migrate.

export interface Distraction {
  id: string
  user_id: string
  session_id: string | null
  content: string
  category: 'thought' | 'urge' | 'notification' | 'environment' | 'emotion' | 'other'
  intensity: number
  captured_at: string
  processed: boolean
  brain_dump_id: string | null
}

export interface BrainDump {
  id: string
  user_id: string
  content: string
  items: string[]
  processed: boolean
  created_at: string
  cleared_at: string | null
}

export interface ChatMessage {
  id: string
  user_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface AIActionPlan {
  state: string
  blocker: string | null
  reasoning: string
  immediate_action: string
  micro_mission: string
  follow_up: string | null
  push_style: PushStyle
}

export interface AISalvagePlan {
  original_mission_id: string
  reason: string
  partial_credit_minutes: number
  adjusted_mission: string
  encouragement: string
  salvageable: boolean
  new_duration_minutes?: number
}

export type FeatureGate =
  | 'CORE' | 'MISSIONS' | 'RESISTANCE_TRACKING' | 'BRAIN_DUMP'
  | 'BODY_DOUBLE' | 'VAULT' | 'AI_SALVAGE' | 'PATTERN_INSIGHTS' | 'EXPORT'

export function getFeatureGates(sessionCount: number, plan: PlanTier): Record<FeatureGate, boolean> {
  const isPro = plan === 'pro' || plan === 'lifetime'
  return {
    CORE: true, MISSIONS: true,
    RESISTANCE_TRACKING: sessionCount >= 1 || isPro,
    BRAIN_DUMP: sessionCount >= 3 || isPro,
    BODY_DOUBLE: isPro, VAULT: isPro,
    AI_SALVAGE: sessionCount >= 5 || isPro,
    PATTERN_INSIGHTS: isPro, EXPORT: isPro,
  }
}

export type FocusType = 'deep_work' | 'quick_win' | 'creative' | 'admin' | 'learning' | 'rest'

export const FOCUS_TYPES: Record<FocusType, { label: string; emoji: string; color: string; description: string; defaultMinutes: number }> = {
  deep_work: { label: 'Deep Work', emoji: '🧠', color: '#6366F1', description: 'Intense concentration', defaultMinutes: 45 },
  quick_win: { label: 'Quick Win', emoji: '⚡', color: '#10B981', description: 'Small task, finish fast', defaultMinutes: 10 },
  creative: { label: 'Creative', emoji: '🎨', color: '#EC4899', description: 'Brainstorming, creating', defaultMinutes: 30 },
  admin: { label: 'Admin', emoji: '📋', color: '#F59E0B', description: 'Email, messages, planning', defaultMinutes: 15 },
  learning: { label: 'Learning', emoji: '📚', color: '#8B5CF6', description: 'Reading, studying', defaultMinutes: 25 },
  rest: { label: 'Rest', emoji: '😌', color: '#14B8A6', description: 'Intentional recovery', defaultMinutes: 10 },
}
