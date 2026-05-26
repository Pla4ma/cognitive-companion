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


