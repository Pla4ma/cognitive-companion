// ══════════════════════════════════════════════════════════════
// INTENT — Anti-Drift Agent: Tools Registry
// Internal and external tool definitions with risk levels
// ══════════════════════════════════════════════════════════════

import type { ToolDefinition } from './types'

// ── Internal Tools (low risk) ───────────────────────────────

export const INTERNAL_TOOLS: ToolDefinition[] = [
  {
    id: 'create_mission',
    name: 'Create Mission',
    description: 'Create a new micro-mission in the local store',
    riskLevel: 'low',
    category: 'internal',
    requiresPermission: null,
    parameters: [
      { name: 'title', type: 'string', required: true, description: 'Mission title' },
      { name: 'exactAction', type: 'string', required: true, description: 'The concrete physical action' },
      { name: 'estimatedMinutes', type: 'number', required: true, description: 'Estimated duration' },
      { name: 'protocolId', type: 'string', required: true, description: 'Rescue protocol ID' },
    ],
  },
  {
    id: 'start_mission',
    name: 'Start Mission',
    description: 'Start a mission timer',
    riskLevel: 'low',
    category: 'internal',
    requiresPermission: null,
    parameters: [
      { name: 'missionId', type: 'string', required: true, description: 'Mission ID to start' },
    ],
  },
  {
    id: 'salvage_mission',
    name: 'Salvage Mission',
    description: 'Offer salvage options for an abandoned mission',
    riskLevel: 'low',
    category: 'internal',
    requiresPermission: null,
    parameters: [
      { name: 'missionId', type: 'string', required: true, description: 'Mission ID to salvage' },
      { name: 'fallbackMinutes', type: 'number', required: true, description: 'Reduced duration' },
    ],
  },
  {
    id: 'capture_distraction',
    name: 'Capture Distraction',
    description: 'Save a distraction to the local store',
    riskLevel: 'low',
    category: 'internal',
    requiresPermission: null,
    parameters: [
      { name: 'content', type: 'string', required: true, description: 'Distraction content' },
      { name: 'category', type: 'string', required: false, description: 'Distraction category' },
    ],
  },
  {
    id: 'create_context_capsule',
    name: 'Create Context Capsule',
    description: 'Create a context capsule from user text',
    riskLevel: 'low',
    category: 'internal',
    requiresPermission: 'context_processing',
    parameters: [
      { name: 'text', type: 'string', required: true, description: 'Raw text content' },
      { name: 'source', type: 'string', required: true, description: 'Source type' },
    ],
  },
  {
    id: 'create_momentum_event',
    name: 'Create Momentum Event',
    description: 'Record a momentum event',
    riskLevel: 'low',
    category: 'internal',
    requiresPermission: null,
    parameters: [
      { name: 'type', type: 'string', required: true, description: 'Event type' },
      { name: 'points', type: 'number', required: true, description: 'Points awarded' },
    ],
  },
  {
    id: 'create_reminder_local',
    name: 'Create Local Reminder',
    description: 'Create a local notification reminder',
    riskLevel: 'medium',
    category: 'internal',
    requiresPermission: 'notifications',
    parameters: [
      { name: 'title', type: 'string', required: true, description: 'Reminder title' },
      { name: 'triggerMinutes', type: 'number', required: true, description: 'Minutes from now' },
    ],
  },
  {
    id: 'schedule_notification',
    name: 'Schedule Notification',
    description: 'Schedule a local notification',
    riskLevel: 'medium',
    category: 'internal',
    requiresPermission: 'notifications',
    parameters: [
      { name: 'title', type: 'string', required: true, description: 'Notification title' },
      { name: 'body', type: 'string', required: true, description: 'Notification body' },
      { name: 'triggerMinutes', type: 'number', required: true, description: 'Minutes from now' },
    ],
  },
  {
    id: 'generate_share_card',
    name: 'Generate Share Card',
    description: 'Generate a shareable rescue card',
    riskLevel: 'low',
    category: 'internal',
    requiresPermission: null,
    parameters: [
      { name: 'state', type: 'string', required: true, description: 'User state' },
      { name: 'duration', type: 'number', required: true, description: 'Duration in minutes' },
      { name: 'outcome', type: 'string', required: true, description: 'Outcome type' },
    ],
  },
  {
    id: 'export_data',
    name: 'Export User Data',
    description: 'Export all user data as JSON',
    riskLevel: 'medium',
    category: 'internal',
    requiresPermission: null,
    parameters: [],
  },
  {
    id: 'delete_data',
    name: 'Delete User Data',
    description: 'Delete all user data',
    riskLevel: 'critical',
    category: 'internal',
    requiresPermission: null,
    parameters: [
      { name: 'confirmPhrase', type: 'string', required: true, description: 'Must type "DELETE ALL DATA"' },
    ],
  },
  {
    id: 'clear_memory',
    name: 'Clear Memory',
    description: 'Clear all learned memory items',
    riskLevel: 'high',
    category: 'internal',
    requiresPermission: null,
    parameters: [],
  },
  {
    id: 'update_privacy_setting',
    name: 'Update Privacy Setting',
    description: 'Update a privacy setting',
    riskLevel: 'low',
    category: 'internal',
    requiresPermission: null,
    parameters: [
      { name: 'key', type: 'string', required: true, description: 'Setting key' },
      { name: 'value', type: 'boolean', required: true, description: 'New value' },
    ],
  },
]

// ── External Tools (higher risk) ────────────────────────────

export const EXTERNAL_TOOLS: ToolDefinition[] = [
  {
    id: 'create_calendar_block',
    name: 'Create Calendar Block',
    description: 'Create a calendar event (requires confirmation)',
    riskLevel: 'high',
    category: 'external',
    requiresPermission: 'calendar_future',
    parameters: [
      { name: 'title', type: 'string', required: true, description: 'Event title' },
      { name: 'startTime', type: 'date', required: true, description: 'Start time' },
      { name: 'duration', type: 'number', required: true, description: 'Duration in minutes' },
    ],
  },
  {
    id: 'create_reminder',
    name: 'Create System Reminder',
    description: 'Create a system reminder (requires confirmation)',
    riskLevel: 'high',
    category: 'external',
    requiresPermission: 'reminders_future',
    parameters: [
      { name: 'title', type: 'string', required: true, description: 'Reminder title' },
      { name: 'dueDate', type: 'date', required: false, description: 'Due date' },
    ],
  },
  {
    id: 'draft_email',
    name: 'Draft Email',
    description: 'Draft an email (never sends automatically)',
    riskLevel: 'high',
    category: 'external',
    requiresPermission: 'email_future',
    parameters: [
      { name: 'to', type: 'string', required: true, description: 'Recipient' },
      { name: 'subject', type: 'string', required: true, description: 'Subject line' },
      { name: 'body', type: 'string', required: true, description: 'Email body' },
    ],
  },
  {
    id: 'draft_text',
    name: 'Draft Text Message',
    description: 'Draft a text message (never sends automatically)',
    riskLevel: 'high',
    category: 'external',
    requiresPermission: null,
    parameters: [
      { name: 'to', type: 'string', required: true, description: 'Recipient' },
      { name: 'body', type: 'string', required: true, description: 'Message body' },
    ],
  },
]

// ── MCP Tools (future) ──────────────────────────────────────

export const MCP_TOOLS: ToolDefinition[] = [
  {
    id: 'connect_mcp_server',
    name: 'Connect MCP Server',
    description: 'Connect to an MCP server (requires confirmation)',
    riskLevel: 'high',
    category: 'mcp',
    requiresPermission: 'mcp_connector_future',
    parameters: [
      { name: 'serverUrl', type: 'string', required: true, description: 'MCP server URL' },
      { name: 'serverName', type: 'string', required: true, description: 'Server name' },
    ],
  },
  {
    id: 'disconnect_mcp_server',
    name: 'Disconnect MCP Server',
    description: 'Disconnect from an MCP server',
    riskLevel: 'medium',
    category: 'mcp',
    requiresPermission: null,
    parameters: [
      { name: 'serverId', type: 'string', required: true, description: 'Server ID' },
    ],
  },
  {
    id: 'list_mcp_tools',
    name: 'List MCP Tools',
    description: 'List available tools from connected MCP servers',
    riskLevel: 'low',
    category: 'mcp',
    requiresPermission: null,
    parameters: [],
  },
  {
    id: 'call_mcp_tool_with_approval',
    name: 'Call MCP Tool (with approval)',
    description: 'Call an MCP tool (always requires user approval)',
    riskLevel: 'critical',
    category: 'mcp',
    requiresPermission: 'mcp_connector_future',
    parameters: [
      { name: 'serverId', type: 'string', required: true, description: 'Server ID' },
      { name: 'toolName', type: 'string', required: true, description: 'Tool name' },
      { name: 'parameters', type: 'string', required: true, description: 'JSON parameters' },
    ],
  },
]

// ── All Tools ───────────────────────────────────────────────

export const ALL_TOOLS: ToolDefinition[] = [
  ...INTERNAL_TOOLS,
  ...EXTERNAL_TOOLS,
  ...MCP_TOOLS,
]

export function getToolById(id: string): ToolDefinition | undefined {
  return ALL_TOOLS.find(t => t.id === id)
}

export function getToolsByRisk(riskLevel: string): ToolDefinition[] {
  return ALL_TOOLS.filter(t => t.riskLevel === riskLevel)
}

export function getAutoExecutableTools(): ToolDefinition[] {
  return INTERNAL_TOOLS.filter(t => t.riskLevel === 'low')
}

export function getToolsRequiringConfirmation(): ToolDefinition[] {
  return ALL_TOOLS.filter(t => t.riskLevel === 'high' || t.riskLevel === 'critical')
}
