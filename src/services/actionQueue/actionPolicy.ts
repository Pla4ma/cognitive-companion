// ══════════════════════════════════════════════════════════════
// INTENT — Action Queue Policy
// Risk matrix: what INTENT can propose, review, or must block
// ══════════════════════════════════════════════════════════════

export type ActionRisk =
  | 'INTERNAL_SAFE'
  | 'INTERNAL_REVIEW'
  | 'SYSTEM_REVIEW'
  | 'EXTERNAL_REVIEW'
  | 'CRITICAL_BLOCKED'

export type ActionType =
  // INTERNAL_SAFE
  | 'create_mission' | 'update_mission' | 'create_moment' | 'capture_distraction'
  | 'create_momentum_event' | 'update_local_preference' | 'create_local_insight'
  // INTERNAL_REVIEW
  | 'delete_memory' | 'clear_history' | 'update_privacy_setting' | 'archive_mission_chain'
  // SYSTEM_REVIEW
  | 'schedule_notification' | 'create_local_reminder' | 'open_deep_link'
  | 'suggest_focus_mode' | 'create_share_card'
  // EXTERNAL_REVIEW
  | 'create_calendar_event' | 'modify_calendar_event' | 'draft_email'
  | 'draft_text' | 'send_data_to_connector' | 'connect_account'
  // CRITICAL_BLOCKED
  | 'send_email' | 'send_text' | 'make_purchase' | 'book_travel'
  | 'pay_bill' | 'delete_external_data' | 'message_contacts' | 'post_publicly'

export interface ActionPolicyDecision {
  allowed: boolean
  requiresReview: boolean
  requiresStrongConfirmation: boolean
  blocked: boolean
  risk: ActionRisk
  reason: string
  requiredPermission: string | null
  auditLevel: 'none' | 'log' | 'review' | 'critical'
}

// ── Risk Classification ────────────────────────────────────

const ACTION_RISK_MAP: Record<ActionType, ActionRisk> = {
  // INTERNAL_SAFE
  create_mission: 'INTERNAL_SAFE',
  update_mission: 'INTERNAL_SAFE',
  create_moment: 'INTERNAL_SAFE',
  capture_distraction: 'INTERNAL_SAFE',
  create_momentum_event: 'INTERNAL_SAFE',
  update_local_preference: 'INTERNAL_SAFE',
  create_local_insight: 'INTERNAL_SAFE',
  // INTERNAL_REVIEW
  delete_memory: 'INTERNAL_REVIEW',
  clear_history: 'INTERNAL_REVIEW',
  update_privacy_setting: 'INTERNAL_REVIEW',
  archive_mission_chain: 'INTERNAL_REVIEW',
  // SYSTEM_REVIEW
  schedule_notification: 'SYSTEM_REVIEW',
  create_local_reminder: 'SYSTEM_REVIEW',
  open_deep_link: 'SYSTEM_REVIEW',
  suggest_focus_mode: 'SYSTEM_REVIEW',
  create_share_card: 'SYSTEM_REVIEW',
  // EXTERNAL_REVIEW
  create_calendar_event: 'EXTERNAL_REVIEW',
  modify_calendar_event: 'EXTERNAL_REVIEW',
  draft_email: 'EXTERNAL_REVIEW',
  draft_text: 'EXTERNAL_REVIEW',
  send_data_to_connector: 'EXTERNAL_REVIEW',
  connect_account: 'EXTERNAL_REVIEW',
  // CRITICAL_BLOCKED
  send_email: 'CRITICAL_BLOCKED',
  send_text: 'CRITICAL_BLOCKED',
  make_purchase: 'CRITICAL_BLOCKED',
  book_travel: 'CRITICAL_BLOCKED',
  pay_bill: 'CRITICAL_BLOCKED',
  delete_external_data: 'CRITICAL_BLOCKED',
  message_contacts: 'CRITICAL_BLOCKED',
  post_publicly: 'CRITICAL_BLOCKED',
}

// ── Policy Decision ────────────────────────────────────────

export function evaluateAction(action: ActionType): ActionPolicyDecision {
  const risk = ACTION_RISK_MAP[action] ?? 'CRITICAL_BLOCKED'

  switch (risk) {
    case 'INTERNAL_SAFE':
      return {
        allowed: true, requiresReview: false, requiresStrongConfirmation: false,
        blocked: false, risk, reason: 'Safe internal action', requiredPermission: null, auditLevel: 'none',
      }
    case 'INTERNAL_REVIEW':
      return {
        allowed: true, requiresReview: true, requiresStrongConfirmation: false,
        blocked: false, risk, reason: 'Destructive internal action — review recommended', requiredPermission: null, auditLevel: 'log',
      }
    case 'SYSTEM_REVIEW':
      return {
        allowed: true, requiresReview: true, requiresStrongConfirmation: false,
        blocked: false, risk, reason: 'System action — user confirmation needed', requiredPermission: 'notifications', auditLevel: 'review',
      }
    case 'EXTERNAL_REVIEW':
      return {
        allowed: true, requiresReview: true, requiresStrongConfirmation: true,
        blocked: false, risk, reason: 'External action — explicit user approval required', requiredPermission: 'external_action', auditLevel: 'review',
      }
    case 'CRITICAL_BLOCKED':
      return {
        allowed: false, requiresReview: false, requiresStrongConfirmation: false,
        blocked: true, risk, reason: 'Critical action blocked — never auto-execute', requiredPermission: null, auditLevel: 'critical',
      }
    default:
      return {
        allowed: false, requiresReview: false, requiresStrongConfirmation: false,
        blocked: true, risk: 'CRITICAL_BLOCKED', reason: 'Unknown action — blocked', requiredPermission: null, auditLevel: 'critical',
      }
  }
}

// ── Review Copy ────────────────────────────────────────────

export function getReviewCopy(action: ActionType): string {
  const copies: Partial<Record<ActionType, string>> = {
    create_calendar_event: 'INTENT wants to create a calendar event. Review before anything happens.',
    draft_email: 'INTENT prepared an email draft. Nothing will be sent without your confirmation.',
    draft_text: 'INTENT prepared a message draft. You can edit before approving.',
    schedule_notification: 'INTENT wants to schedule a reminder. Review the details.',
    create_local_reminder: 'INTENT wants to create a local reminder.',
    delete_memory: 'INTENT wants to delete a memory item. This cannot be undone.',
  }
  return copies[action] ?? 'INTENT prepared this action. Review before proceeding.'
}
