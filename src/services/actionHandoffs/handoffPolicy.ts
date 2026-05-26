// ══════════════════════════════════════════════════════════════
// INTENT — Handoff Policy Engine
// Determines what actions INTENT can prepare and propose
// ══════════════════════════════════════════════════════════════

import type {
  ActionHandoff,
  ActionHandoffType,
  HandoffRiskLevel,
  AuditEntry,
} from '../../types/actionHandoff'
import { HANDOFF_RISK_MATRIX, HANDOFF_REQUIRES_CONFIRMATION } from '../../types/actionHandoff'

// ── Policy Decisions ───────────────────────────────────────

export interface HandoffPolicyDecision {
  allowed: boolean
  requiresConfirmation: boolean
  riskLevel: HandoffRiskLevel
  reason: string
  auditLevel: 'low' | 'medium' | 'high'
}

export function evaluateHandoffPolicy(type: ActionHandoffType): HandoffPolicyDecision {
  const riskLevel = HANDOFF_RISK_MATRIX[type]
  const requiresConfirmation = HANDOFF_REQUIRES_CONFIRMATION[type]

  if (riskLevel === 'critical_blocked') {
    return {
      allowed: false,
      requiresConfirmation: true,
      riskLevel,
      reason: 'This action type is blocked by default',
      auditLevel: 'high',
    }
  }

  return {
    allowed: true,
    requiresConfirmation,
    riskLevel,
    reason: requiresConfirmation ? 'Requires user confirmation' : 'Safe for internal use',
    auditLevel: riskLevel === 'external_review' ? 'high' : riskLevel === 'system_review' ? 'medium' : 'low',
  }
}

// ── Audit Logging ──────────────────────────────────────────

export function createAuditEntry(action: string, details?: string): AuditEntry {
  return {
    action,
    timestamp: new Date().toISOString(),
    details: details ?? null,
  }
}

export function addAuditEntry(handoff: ActionHandoff, action: string, details?: string): ActionHandoff {
  return {
    ...handoff,
    auditLog: [...handoff.auditLog, createAuditEntry(action, details)],
  }
}

// ── Review Copy ────────────────────────────────────────────

export function generateReviewCopy(handoff: ActionHandoff): string {
  const parts: string[] = []

  parts.push('INTENT prepared this. Review before anything happens.')

  if (handoff.requiresConfirmation) {
    parts.push('Nothing will be sent without your confirmation.')
  }

  switch (handoff.type) {
    case 'email_draft':
      parts.push('This uses your context to draft an email. You can edit before approving.')
      break
    case 'message_draft':
      parts.push('This drafts a message. You copy and send manually.')
      break
    case 'reminder':
      parts.push('This creates a local reminder at the suggested time.')
      break
    case 'calendar_block':
      parts.push('This prepares a calendar block. Review the details.')
      break
    case 'checklist':
      parts.push('This converts your context into a checklist.')
      break
    case 'study_plan':
      parts.push('This creates a study micro-plan from your assignment.')
      break
  }

  return parts.join(' ')
}

// ── Risk Assessment ────────────────────────────────────────

export function assessHandoffRisk(handoff: ActionHandoff): {
  canProceed: boolean
  warnings: string[]
  requiredPermissions: string[]
} {
  const warnings: string[] = []
  const requiredPermissions: string[] = []

  switch (handoff.riskLevel) {
    case 'critical_blocked':
      return { canProceed: false, warnings: ['This action is blocked'], requiredPermissions: [] }
    case 'external_review':
      warnings.push('This prepares an external action')
      requiredPermissions.push('confirm_external_action')
      break
    case 'system_review':
      warnings.push('This creates a system-level reminder')
      requiredPermissions.push('notification_permission')
      break
    default:
      break
  }

  return { canProceed: true, warnings, requiredPermissions }
}
