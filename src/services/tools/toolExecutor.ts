// ══════════════════════════════════════════════════════════════
// INTENT — Tool Executor + Permission Gate + Audit Log
// Safe action execution with confirmation and audit trail
// ══════════════════════════════════════════════════════════════

import type { AgentAction, AgentActionStatus, ActionRiskLevel, AuditLogEntry, PermissionReceipt } from '../../types'
import { ALL_TOOLS } from '../../agents/antiDriftAgent/tools'

// ── Permission Gate ─────────────────────────────────────────

const grantedPermissions: Set<string> = new Set(['create_mission', 'start_mission', 'capture_distraction'])

export function isPermissionGranted(permission: string): boolean {
  return grantedPermissions.has(permission)
}

export function grantPermission(permission: string, receipt: PermissionReceipt): void {
  grantedPermissions.add(permission)
}

export function revokePermission(permission: string): void {
  grantedPermissions.delete(permission)
}

export function getGrantedPermissions(): string[] {
  return Array.from(grantedPermissions)
}

// ── Tool Executor ───────────────────────────────────────────

export interface ExecutionResult {
  success: boolean
  actionId: string
  error: string | null
  auditEntry: AuditLogEntry
}

export function executeAction(action: AgentAction, confirmed: boolean = false): ExecutionResult {
  const tool = ALL_TOOLS.find(t => t.id === action.type)
  const now = new Date().toISOString()

  // Check if confirmation is required
  if (action.requiresConfirmation && !confirmed) {
    return {
      success: false,
      actionId: action.id,
      error: 'Confirmation required',
      auditEntry: createAuditEntry(action, 'canceled', false, 'Confirmation required'),
    }
  }

  // Check permission
  if (tool?.requiresPermission && !isPermissionGranted(tool.requiresPermission)) {
    return {
      success: false,
      actionId: action.id,
      error: `Permission not granted: ${tool.requiresPermission}`,
      auditEntry: createAuditEntry(action, 'canceled', false, `Missing permission: ${tool.requiresPermission}`),
    }
  }

  // Execute based on risk level
  try {
    switch (action.riskLevel) {
      case 'safe':
        return executeSafeAction(action)
      case 'review':
        return executeReviewAction(action, confirmed)
      case 'sensitive':
        return executeSensitiveAction(action, confirmed)
      case 'dangerous':
        return executeDangerousAction(action, confirmed)
      default:
        return executeSafeAction(action)
    }
  } catch (error) {
    return {
      success: false,
      actionId: action.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      auditEntry: createAuditEntry(action, 'canceled', false, 'Execution error'),
    }
  }
}

function executeSafeAction(action: AgentAction): ExecutionResult {
  // Safe internal actions execute immediately
  const now = new Date().toISOString()
  return {
    success: true,
    actionId: action.id,
    error: null,
    auditEntry: createAuditEntry(action, 'approved', true, null),
  }
}

function executeReviewAction(action: AgentAction, confirmed: boolean): ExecutionResult {
  if (!confirmed) {
    return {
      success: false,
      actionId: action.id,
      error: 'Review required',
      auditEntry: createAuditEntry(action, 'canceled', false, 'Pending review'),
    }
  }
  return {
    success: true,
    actionId: action.id,
    error: null,
    auditEntry: createAuditEntry(action, 'approved', true, null),
  }
}

function executeSensitiveAction(action: AgentAction, confirmed: boolean): ExecutionResult {
  if (!confirmed) {
    return {
      success: false,
      actionId: action.id,
      error: 'Explicit confirmation required for sensitive action',
      auditEntry: createAuditEntry(action, 'canceled', false, 'Pending explicit confirmation'),
    }
  }
  return {
    success: true,
    actionId: action.id,
    error: null,
    auditEntry: createAuditEntry(action, 'approved', true, null),
  }
}

function executeDangerousAction(action: AgentAction, confirmed: boolean): ExecutionResult {
  if (!confirmed) {
    return {
      success: false,
      actionId: action.id,
      error: 'CRITICAL: Explicit confirmation required. This action cannot be undone.',
      auditEntry: createAuditEntry(action, 'canceled', false, 'Pending critical confirmation'),
    }
  }
  return {
    success: true,
    actionId: action.id,
    error: null,
    auditEntry: createAuditEntry(action, 'approved', true, null),
  }
}

// ── Audit Log ───────────────────────────────────────────────

const auditLog: AuditLogEntry[] = []

function createAuditEntry(
  action: AgentAction,
  decision: 'approved' | 'canceled' | 'modified',
  success: boolean,
  errorMessage: string | null,
): AuditLogEntry {
  const entry: AuditLogEntry = {
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    actionId: action.id,
    actionType: action.type,
    proposedBy: action.proposedBy,
    userDecision: decision,
    riskLevel: action.riskLevel,
    dataAccessed: Object.keys(action.payload),
    externalService: action.type.startsWith('draft_') || action.type.startsWith('create_') ? action.type : null,
    success,
    errorMessage,
  }
  auditLog.push(entry)
  return entry
}

export function getAuditLog(): AuditLogEntry[] {
  return [...auditLog]
}

export function getAuditLogForAction(actionId: string): AuditLogEntry[] {
  return auditLog.filter(e => e.actionId === actionId)
}

export function clearAuditLog(): void {
  auditLog.length = 0
}

// ── Action Planner ──────────────────────────────────────────

export function planActions(context: {
  state: string
  hasContext: boolean
  hasActiveMission: boolean
  privacySettings: any
}): AgentAction[] {
  const actions: AgentAction[] = []
  const now = new Date().toISOString()

  // Always offer create_mission
  actions.push({
    id: `action_${Date.now()}_create`,
    type: 'create_mission',
    title: 'Create Mission',
    description: 'Create a new micro-mission',
    proposedBy: 'local_engine',
    riskLevel: 'safe',
    requiresConfirmation: false,
    permissionReceiptId: null,
    status: 'proposed',
    payload: {},
    createdAt: now,
    executedAt: null,
  })

  // Offer salvage if there's an active mission
  if (context.hasActiveMission) {
    actions.push({
      id: `action_${Date.now()}_salvage`,
      type: 'salvage_mission',
      title: 'Salvage Mission',
      description: 'Offer a smaller version of the current mission',
      proposedBy: 'local_engine',
      riskLevel: 'safe',
      requiresConfirmation: false,
      permissionReceiptId: null,
      status: 'proposed',
      payload: {},
      createdAt: now,
      executedAt: null,
    })
  }

  // Offer context processing if user has pasted text
  if (context.hasContext && context.privacySettings.contextProcessingEnabled) {
    actions.push({
      id: `action_${Date.now()}_context`,
      type: 'summarize_context',
      title: 'Turn Text Into Mission',
      description: 'Convert your pasted text into a mission',
      proposedBy: 'local_engine',
      riskLevel: 'safe',
      requiresConfirmation: false,
      permissionReceiptId: null,
      status: 'proposed',
      payload: {},
      createdAt: now,
      executedAt: null,
    })
  }

  return actions
}
