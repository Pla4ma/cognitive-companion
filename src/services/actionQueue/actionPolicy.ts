// ══════════════════════════════════════════════════════════════
// INTENT — Action Policy
// Controls which actions are allowed, blocked, or require review
// ══════════════════════════════════════════════════════════════

export interface ActionDecision {
  allowed: boolean
  blocked: boolean
  requiresReview: boolean
  requiresStrongConfirmation: boolean
  reason?: string
}

const INTERNAL_SAFE_ACTIONS = new Set([
  'create_mission',
  'save_draft',
  'capture_distraction',
  'brain_dump',
  'update_mission_status',
  'record_session',
  'set_reminder_internal',
])

const CRITICAL_BLOCKED_ACTIONS = new Set([
  'send_email',
  'send_message',
  'delete_all_data',
  'share_external',
  'make_payment',
])

const EXTERNAL_REVIEW_ACTIONS = new Set([
  'create_calendar_event',
  'draft_email',
  'open_external_app',
  'create_reminder_system',
])

const REVIEW_COPY_MAP: Record<string, string> = {
  draft_email: 'This will prepare an email draft for your review before sending.',
  send_email: 'This action would send an email on your behalf. This is currently blocked for safety.',
  create_calendar_event: 'This will add an event to your calendar after you confirm the details.',
  send_message: 'This would send a message. Please review before sending.',
  open_external_app: 'This will open an external app. Confirm to proceed.',
  create_reminder_system: 'This will create a system reminder on your device.',
}

export function evaluateAction(actionType: string): ActionDecision {
  if (INTERNAL_SAFE_ACTIONS.has(actionType)) {
    return {
      allowed: true,
      blocked: false,
      requiresReview: false,
      requiresStrongConfirmation: false,
    }
  }

  if (CRITICAL_BLOCKED_ACTIONS.has(actionType)) {
    return {
      allowed: false,
      blocked: true,
      requiresReview: false,
      requiresStrongConfirmation: false,
      reason: `Action "${actionType}" is blocked for safety.`,
    }
  }

  if (EXTERNAL_REVIEW_ACTIONS.has(actionType)) {
    return {
      allowed: true,
      blocked: false,
      requiresReview: true,
      requiresStrongConfirmation: true,
    }
  }

  // Default: require review
  return {
    allowed: true,
    blocked: false,
    requiresReview: true,
    requiresStrongConfirmation: false,
  }
}

export function getReviewCopy(actionType: string): string {
  return REVIEW_COPY_MAP[actionType] ?? `Review the details for "${actionType}" before proceeding.`
}
