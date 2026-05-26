// ══════════════════════════════════════════════════════════════
// INTENT — Context Capsule Types
// User-approved context that produces missions
// ══════════════════════════════════════════════════════════════

export type ContextSource =
  | 'manual_text'
  | 'paste_text'
  | 'brain_dump'
  | 'share_text'
  | 'notification_action'
  | 'selected_mission'
  | 'user_goal'
  | 'captured_distraction'
  | 'coach_excerpt'
  | 'calendar_event'
  | 'reminder'
  | 'note'
  | 'email_draft'
  | 'screenshot_ocr'
  | 'voice_note'

export type ContextSensitivity = 'public' | 'personal' | 'sensitive' | 'restricted'

export type ContextRetentionPolicy = 'keep' | 'auto_delete_7_days' | 'auto_delete_30_days' | 'delete_after_mission'

export interface ExtractedObligation {
  text: string
  deadline: string | null
  people: string[]
  actionVerbs: string[]
  urgency: 'low' | 'medium' | 'high'
  category: 'school' | 'work' | 'cleaning' | 'admin' | 'creative' | 'health' | 'social' | 'finance' | 'personal' | 'unknown'
}

export interface ContextCapsule {
  id: string
  source: ContextSource
  rawContent: string
  summary: string
  extractedObligations: ExtractedObligation[]
  extractedDeadlines: string[]
  extractedPeople: string[]
  extractedActions: string[]
  sensitivity: ContextSensitivity
  aiProcessingAllowed: boolean
  analyticsAllowed: boolean
  retentionPolicy: ContextRetentionPolicy
  createdMissions: string[] // mission IDs
  createdAt: string
  expiresAt: string | null
}

// ── Context Inbox ───────────────────────────────────────────

export interface ContextInboxItem {
  id: string
  capsuleId: string
  preview: string
  source: ContextSource
  createdAt: string
  processed: boolean
  missionGenerated: boolean
}
