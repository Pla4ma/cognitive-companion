// ══════════════════════════════════════════════════════════════
// INTENT — Types v4: Moment
// The atomic unit of drift and rescue
// ══════════════════════════════════════════════════════════════

import type { PrivacyClassification } from './privacy'

export type MomentSource =
  | 'app_open'
  | 'manual_state_select'
  | 'widget'
  | 'notification_action'
  | 'shortcut'
  | 'share_extension'
  | 'live_activity'
  | 'session_drift'
  | 'comeback'
  | 'voice_shortcut'
  | 'coach'
  | 'imported_text'
  | 'brain_dump'
  | 'calendar_context'
  | 'reminder_context'
  | 'unknown'

export type UserState =
  | 'avoiding'
  | 'overwhelmed'
  | 'stuck'
  | 'tired'
  | 'distracted'
  | 'anxious'
  | 'scattered'
  | 'ready'
  | 'bored'
  | 'perfectionism'
  | 'unclear'
  | 'time_pressure'
  | 'low_confidence'
  | 'shame_spiral'
  | 'fake_productivity'
  | 'planning_loop'
  | 'doomscroll_risk'

export type EnergyLevel = 'depleted' | 'low' | 'medium' | 'high'

export type BlockerType =
  | 'too_big'
  | 'unclear'
  | 'boring'
  | 'scary'
  | 'perfectionism'
  | 'tired'
  | 'distracted'
  | 'no_deadline'
  | 'too_many_choices'
  | 'emotional_resistance'
  | 'environment'
  | 'unknown'

export interface Moment {
  id: string
  created_at: string
  updated_at: string
  source: MomentSource
  user_state: UserState
  intensity: number // 1-5
  available_minutes: number
  energy_level: EnergyLevel
  context_text: string | null
  selected_blocker: BlockerType | null
  related_mission_id: string | null
  related_goal_id: string | null
  related_context_capsule_id: string | null
  detected_drift_signals: string[]
  avoidance_risk: number // 0-1
  recommended_protocol_id: string | null
  converted_mission_id: string | null
  privacy_classification: PrivacyClassification
}
