// ══════════════════════════════════════════════════════════════
// INTENT — Tool Executor
// Executes agent actions with permission and risk checks
// ══════════════════════════════════════════════════════════════

import type { AgentAction, PermissionReceipt, ActionRiskLevel } from '../../types/agentAction'

// ── Permission Store ──────────────────────────────────────

const permissionStore = new Map<string, PermissionReceipt>()

export function grantPermission(key: string, receipt: PermissionReceipt): void {
  permissionStore.set(key, receipt)
}

export function revokePermission(key: string): void {
  const receipt = permissionStore.get(key)
  if (receipt) {
    permissionStore.set(key, { ...receipt, revokedAt: new Date().toISOString(), userAction: 'revoked' })
  }
}

export function isPermissionGranted(key: string): boolean {
  const receipt = permissionStore.get(key)
  if (!receipt) return false
  return receipt.userAction === 'granted' && receipt.revokedAt === null
}

// ── Risk Policy ───────────────────────────────────────────

interface ExecutionResult {
  success: boolean
  error?: string
}

function requiresPermission(riskLevel: ActionRiskLevel): boolean {
  return riskLevel === 'sensitive' || riskLevel === 'dangerous'
}

// ── Action Executor ───────────────────────────────────────

export function executeAction(
  action: AgentAction,
  confirmed: boolean,
): ExecutionResult {
  // Safe actions always succeed
  if (action.riskLevel === 'safe' && !action.requiresConfirmation) {
    return { success: true }
  }

  // Sensitive actions need confirmation
  if (action.riskLevel === 'sensitive' && action.requiresConfirmation && !confirmed) {
    return { success: false, error: 'Confirmation is required for sensitive actions' }
  }

  // Dangerous actions need both confirmation and valid permission
  if (action.riskLevel === 'dangerous') {
    if (!confirmed) {
      return { success: false, error: 'Confirmation is required for dangerous actions' }
    }
    if (action.permissionReceiptId) {
      const receipt = permissionStore.get(action.permissionReceiptId)
        ?? Array.from(permissionStore.values()).find(r => r.id === action.permissionReceiptId)
      if (!receipt || receipt.revokedAt !== null) {
        return { success: false, error: 'Permission not granted or revoked' }
      }
    }
  }

  return { success: true }
}
