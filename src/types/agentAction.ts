// ══════════════════════════════════════════════════════════════
// INTENT — Agent Action Types
// AgentAction, tool types, and action review types
// ══════════════════════════════════════════════════════════════

export type AgentActionType =
  | 'create_mission'
  | 'start_mission'
  | 'salvage_mission'
  | 'capture_distraction'
  | 'create_reminder'
  | 'draft_email'
  | 'draft_text'
  | 'create_calendar_block'
  | 'summarize_context'
  | 'parse_brain_dump'
  | 'generate_weekly_story'
  | 'suggest_app_block'
  | 'suggest_shortcut'
  | 'export_data'
  | 'delete_data'

export type ActionRiskLevel = 'safe' | 'review' | 'sensitive' | 'dangerous'

export type ActionProposedBy = 'local_engine' | 'ai_agent' | 'user' | 'system_surface'

export type AgentActionStatus = 'proposed' | 'approved' | 'executed' | 'canceled' | 'failed'

export interface AgentAction {
  id: string
  type: AgentActionType
  title: string
  description: string
  proposedBy: ActionProposedBy
  riskLevel: ActionRiskLevel
  requiresConfirmation: boolean
  permissionReceiptId: string | null
  status: AgentActionStatus
  payload: Record<string, unknown>
  createdAt: string
  executedAt: string | null
}

// ── Tool System ─────────────────────────────────────────────

export type ToolRiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface ToolDefinition {
  id: string
  name: string
  description: string
  riskLevel: ToolRiskLevel
  category: 'internal' | 'external' | 'mcp'
  requiresPermission: string | null
  parameters: ToolParameter[]
}

export interface ToolParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum'
  required: boolean
  description: string
  enumValues?: string[]
}

export interface ToolExecution {
  id: string
  toolId: string
  actionId: string
  parameters: Record<string, unknown>
  result: Record<string, unknown> | null
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'canceled'
  error: string | null
  startedAt: string
  completedAt: string | null
}

// ── Permission Receipts ─────────────────────────────────────

export interface PermissionReceipt {
  id: string
  permissionType: string
  grantedAt: string
  revokedAt: string | null
  scope: string
  explanationShown: boolean
  dataUsed: string[]
  userAction: 'granted' | 'revoked' | 'modified'
  version: string
  relatedActionId: string | null
}

// ── Action Review ───────────────────────────────────────────

export interface ActionReview {
  action: AgentAction
  whatWillHappen: string
  dataInvolved: string[]
  destinationService: string | null
  whatCanGoWrong: string
  editablePayload: Record<string, unknown>
  riskExplanation: string
}

// ── Audit Log ───────────────────────────────────────────────

export interface AuditLogEntry {
  id: string
  timestamp: string
  actionId: string
  actionType: AgentActionType
  proposedBy: ActionProposedBy
  userDecision: 'approved' | 'canceled' | 'modified'
  riskLevel: ActionRiskLevel
  dataAccessed: string[]
  externalService: string | null
  success: boolean
  errorMessage: string | null
}
