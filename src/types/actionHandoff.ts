// ══════════════════════════════════════════════════════════════
// INTENT — Action Handoff Types
// Real-world action preparation with human approval
// ══════════════════════════════════════════════════════════════

export type ActionHandoffType =
  | 'reminder'
  | 'calendar_block'
  | 'email_draft'
  | 'message_draft'
  | 'checklist'
  | 'study_plan'

export type ActionHandoffStatus =
  | 'proposed'
  | 'reviewed'
  | 'copied'
  | 'opened'
  | 'completed'
  | 'canceled'

export type HandoffRiskLevel = 'internal_safe' | 'internal_review' | 'system_review' | 'external_review' | 'critical_blocked'

export interface ActionHandoff {
  id: string
  type: ActionHandoffType
  sourceContextId: string | null
  sourceMissionId: string | null
  title: string
  preview: string
  editablePayload: Record<string, unknown>
  riskLevel: HandoffRiskLevel
  requiresConfirmation: boolean
  status: ActionHandoffStatus
  auditLog: AuditEntry[]
  createdAt: string
  reviewedAt: string | null
  completedAt: string | null
}

export interface AuditEntry {
  action: string
  timestamp: string
  details: string | null
}

// ── Specific Handoff Payloads ──────────────────────────────

export interface ReminderPayload {
  title: string
  body: string
  scheduledTime: string // ISO
  repeat: 'none' | 'daily' | 'weekly'
}

export interface CalendarBlockPayload {
  title: string
  startTime: string
  endTime: string
  notes: string | null
  location: string | null
}

export interface EmailDraftPayload {
  to: string
  subject: string
  body: string
  cc: string | null
}

export interface MessageDraftPayload {
  to: string | null
  body: string
  platform: 'sms' | 'imessage' | 'other'
}

export interface ChecklistPayload {
  title: string
  items: ChecklistItem[]
}

export interface ChecklistItem {
  id: string
  text: string
  checked: boolean
  order: number
}

export interface StudyPlanPayload {
  subject: string
  examDate: string | null
  topics: StudyTopic[]
  totalMinutes: number
}

export interface StudyTopic {
  id: string
  name: string
  estimatedMinutes: number
  priority: number
  completed: boolean
}

// ── Handoff Policy ─────────────────────────────────────────

export const HANDOFF_RISK_MATRIX: Record<ActionHandoffType, HandoffRiskLevel> = {
  reminder: 'system_review',
  calendar_block: 'external_review',
  email_draft: 'external_review',
  message_draft: 'external_review',
  checklist: 'internal_safe',
  study_plan: 'internal_safe',
}

export const HANDOFF_REQUIRES_CONFIRMATION: Record<ActionHandoffType, boolean> = {
  reminder: true,
  calendar_block: true,
  email_draft: true,
  message_draft: true,
  checklist: false,
  study_plan: false,
}

export const RISK_LEVEL_COPY: Record<HandoffRiskLevel, { label: string; description: string; color: string }> = {
  internal_safe: { label: 'Safe', description: 'Internal only, no external action', color: '#10B981' },
  internal_review: { label: 'Review', description: 'Internal action, review recommended', color: '#3B82F6' },
  system_review: { label: 'System', description: 'Creates system notification/reminder', color: '#F59E0B' },
  external_review: { label: 'External', description: 'Prepares external action, requires approval', color: '#F97316' },
  critical_blocked: { label: 'Blocked', description: 'Cannot execute without explicit approval', color: '#EF4444' },
}
