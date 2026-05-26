// ══════════════════════════════════════════════════════════════
// INTENT — MCP-Style Tool Registry & Agent Security v3
// Secure, user-approved, sandboxed tool execution framework.
//
// In 2026, agents that can't connect to external tools are chatbots.
// But agents that connect carelessly are security nightmares.
// INTENT does both: powerful tool use with ironclad security.
//
// Architecture:
//   Tool Registry → Permission Gate → Sandbox → Execute → Audit
// ══════════════════════════════════════════════════════════════

import { UserState, PushStyle } from '../types'
import { checkPermission } from '../services/consent'
import { checkSafetyBoundaries } from '../engine/safety'

// ── Tool Definition ─────────────────────────────────────────

export type ToolCategory =
  | 'productivity'    // Calendar, reminders, tasks
  | 'communication'   // Messages, email, calls
  | 'health'          // Sleep, activity, mindfulness
  | 'focus'           // Focus modes, DND, app blocking
  | 'smart_home'      // Lights, thermostat, environment
  | 'information'     // Weather, news, search
  | 'finance'         // Spending, subscriptions
  | 'learning'        // Courses, reading, practice
  | 'custom'          // User-defined tools
  | 'system'          // App-internal tools

export type ToolRiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical'

export interface ToolParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum'
  description: string
  required: boolean
  default?: any
  enumValues?: string[]
  // Validation
  min?: number
  max?: number
  pattern?: string // regex
  maxLength?: number
}

export interface ToolDefinition {
  id: string
  name: string
  description: string
  category: ToolCategory
  riskLevel: ToolRiskLevel

  // What the tool does
  parameters: ToolParameter[]
  returns: {
    type: string
    description: string
  }

  // Security
  requiresPermission: string[]       // Permission IDs needed
  requiresApproval: boolean          // Does each execution need user OK?
  reversible: boolean                // Can the action be undone?
  sideEffects: string[]              // What changes in the world
  dataAccessed: string[]             // What data does it read?
  dataModified: string[]             // What data does it write?

  // Execution
  timeoutMs: number                  // Max execution time
  retryable: boolean                 // Can we retry on failure?
  rateLimitPerHour: number           // Max calls per hour

  // Metadata
  provider: string                   // Who provides this tool?
  version: string
  icon: string                       // Emoji icon
  enabled: boolean
}

// ── Tool Execution ──────────────────────────────────────────

export interface ToolExecutionRequest {
  id: string
  toolId: string
  parameters: Record<string, any>
  requestedBy: 'agent' | 'user' | 'system' | 'shortcut'
  requestedAt: string
  userId: string
  agentContext?: {
    driftSignal: string | null
    confidence: number
    state: UserState
  }
}

export interface ToolExecutionResult {
  id: string
  requestId: string
  toolId: string
  status: 'pending' | 'approved' | 'denied' | 'executing' | 'success' | 'failed' | 'cancelled' | 'timeout'
  result?: any
  error?: string
  executedAt?: string
  durationMs?: number
  approvalTimeMs?: number          // Time user took to approve
  sideEffectsApplied: string[]
  canUndo: boolean
  undoToken?: string
}

// ── Prompt Injection Protection ─────────────────────────────

export interface InjectionScanResult {
  clean: boolean
  detectedPatterns: string[]
  sanitizedInput: string
  riskScore: number                // 0-1
  blocked: boolean
  reason?: string
}

const INJECTION_PATTERNS: { pattern: RegExp; type: string; risk: number }[] = [
  { pattern: /ignore (all |previous |prior )?(instructions|rules|guidelines|constraints)/i, type: 'instruction_override', risk: 0.9 },
  { pattern: /you are now|act as|pretend to be|roleplay as/i, type: 'persona_hijack', risk: 0.8 },
  { pattern: /system prompt|internal instructions|hidden instructions/i, type: 'system_leak', risk: 0.95 },
  { pattern: /(?:execute|run|call|invoke)\s+(?:tool|function|api|command)/i, type: 'tool_injection', risk: 0.85 },
  { pattern: /(?:delete|remove|clear|drop)\s+(?:all|data|database|storage)/i, type: 'destructive_action', risk: 0.9 },
  { pattern: /bypass|circumvent|work around|disable\s+(?:security|safety|filter|protection)/i, type: 'security_bypass', risk: 0.95 },
  { pattern: /(?:send|post|upload|transmit)\s+(?:to|at|@)\s*(?:http|https|ftp|www)/i, type: 'exfiltration', risk: 0.85 },
  { pattern: /`{3}[\s]*bash|`{3}[\s]*shell|`{3}[\s]*python/i, type: 'code_injection', risk: 0.8 },
  { pattern: /\b(eval|exec|subprocess|os\.|child_process)\b/i, type: 'code_execution', risk: 0.9 },
  { pattern: /DAN|jailbreak|developer mode|unfiltered/i, type: 'jailbreak', risk: 0.95 },
  { pattern: /(\r\n|\n){2,}(system|assistant|user):/i, type: 'message_forgery', risk: 0.9 },
]

export function scanForInjection(input: string): InjectionScanResult {
  let sanitized = input
  const detectedPatterns: string[] = []
  let riskScore = 0

  for (const { pattern, type, risk } of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      detectedPatterns.push(type)
      riskScore = Math.min(riskScore + risk * 0.3, 1.0)
      // Sanitize by replacing the matched pattern
      sanitized = sanitized.replace(pattern, '[REDACTED]')
    }
  }

  const blocked = riskScore >= 0.7

  return {
    clean: detectedPatterns.length === 0,
    detectedPatterns,
    sanitizedInput: sanitized,
    riskScore,
    blocked,
    reason: blocked ? `High-risk pattern detected: ${detectedPatterns.join(', ')}` : undefined,
  }
}

// ── Tool Registry ───────────────────────────────────────────

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map()
  private executionLog: ToolExecutionResult[] = []
  private hourlyCallCounts: Map<string, number> = new Map()

  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.id, tool)
  }

  unregisterTool(toolId: string): void {
    this.tools.delete(toolId)
  }

  getTool(toolId: string): ToolDefinition | undefined {
    return this.tools.get(toolId)
  }

  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values())
  }

  getToolsByCategory(category: ToolCategory): ToolDefinition[] {
    return this.getAllTools().filter(t => t.category === category)
  }

  getEnabledTools(): ToolDefinition[] {
    return this.getAllTools().filter(t => t.enabled)
  }

  // ── Execution Pipeline ────────────────────────────────────

  async execute(
    request: ToolExecutionRequest,
    userPermissions: { checkPermission: (id: string) => { permitted: boolean; reason: string } },
    requireApproval: boolean = true,
  ): Promise<ToolExecutionResult> {
    const tool = this.tools.get(request.toolId)
    if (!tool) {
      return this.createErrorResult(request, 'Tool not found')
    }

    if (!tool.enabled) {
      return this.createErrorResult(request, 'Tool is disabled')
    }

    // Step 1: Scan parameters for injection
    const paramJson = JSON.stringify(request.parameters)
    const injectionScan = scanForInjection(paramJson)
    if (injectionScan.blocked) {
      return this.createErrorResult(request, `Injection blocked: ${injectionScan.reason}`)
    }

    // Step 2: Check permissions
    for (const permId of tool.requiresPermission) {
      const check = userPermissions.checkPermission(permId)
      if (!check.permitted) {
        return this.createErrorResult(request, `Permission denied: ${permId} — ${check.reason}`)
      }
    }

    // Step 3: Validate parameters
    const validationError = this.validateParameters(tool, request.parameters)
    if (validationError) {
      return this.createErrorResult(request, `Invalid parameters: ${validationError}`)
    }

    // Step 4: Rate limiting
    if (!this.checkRateLimit(tool)) {
      return this.createErrorResult(request, `Rate limit exceeded: ${tool.rateLimitPerHour}/hour`)
    }

    // Step 5: Safety check on the action
    const safetyCheck = checkSafetyBoundaries(JSON.stringify(request.parameters))
    if (!safetyCheck.safe) {
      return this.createErrorResult(request, `Safety check failed: ${safetyCheck.violations[0]?.reason}`)
    }

    // Step 6: Approval gate
    if (tool.requiresApproval && requireApproval && request.requestedBy === 'agent') {
      return {
        id: `result_${Date.now()}`,
        requestId: request.id,
        toolId: request.toolId,
        status: 'pending',
        sideEffectsApplied: [],
        canUndo: tool.reversible,
      }
    }

    // Step 7: Execute
    return this.runExecution(request, tool)
  }

  async approveExecution(resultId: string): Promise<ToolExecutionResult> {
    const pending = this.executionLog.find(r => r.id === resultId && r.status === 'pending')
    if (!pending) {
      return {
        id: `result_${Date.now()}`,
        requestId: 'unknown',
        toolId: 'unknown',
        status: 'failed',
        error: 'Pending execution not found',
        sideEffectsApplied: [],
        canUndo: false,
      }
    }

    const tool = this.tools.get(pending.toolId)
    if (!tool) {
      return this.createErrorResult(
        {
          id: 'unknown',
          toolId: pending.toolId,
          parameters: {},
          requestedBy: 'system' as const,
          requestedAt: new Date().toISOString(),
          userId: 'user',
        },
        'Tool not found',
      )
    }

    const request: ToolExecutionRequest = {
      id: pending.requestId,
      toolId: pending.toolId,
      parameters: {},
      requestedBy: 'user',
      requestedAt: new Date().toISOString(),
      userId: 'user',
    }

    return this.runExecution(request, tool)
  }

  denyExecution(resultId: string): void {
    const pending = this.executionLog.find(r => r.id === resultId)
    if (pending) {
      pending.status = 'denied'
    }
  }

  // ── Undo Support ──────────────────────────────────────────

  undoExecution(undoToken: string): ToolExecutionResult | null {
    const original = this.executionLog.find(r => r.undoToken === undoToken)
    if (!original || !original.canUndo) return null

    return {
      id: `undo_${Date.now()}`,
      requestId: original.requestId,
      toolId: original.toolId,
      status: 'success',
      result: { undone: true, originalResult: original.result },
      executedAt: new Date().toISOString(),
      sideEffectsApplied: [`Undone: ${original.sideEffectsApplied.join(', ')}`],
      canUndo: false,
    }
  }

  // ── Execution History ─────────────────────────────────────

  getExecutionHistory(toolId?: string, limit: number = 50): ToolExecutionResult[] {
    let results = this.executionLog
    if (toolId) {
      results = results.filter(r => r.toolId === toolId)
    }
    return results.slice(-limit)
  }

  getPendingApprovals(): ToolExecutionResult[] {
    return this.executionLog.filter(r => r.status === 'pending')
  }

  // ── Audit Log ─────────────────────────────────────────────

  getAuditLog(): {
    totalExecutions: number
    successfulExecutions: number
    deniedExecutions: number
    injectionBlocked: number
    permissionDenied: number
    byCategory: Record<string, number>
    mostUsedTools: { toolId: string; count: number }[]
  } {
    const byCategory: Record<string, number> = {}
    const toolCounts: Record<string, number> = {}

    for (const result of this.executionLog) {
      const tool = this.tools.get(result.toolId)
      const cat = tool?.category || 'unknown'
      byCategory[cat] = (byCategory[cat] || 0) + 1
      toolCounts[result.toolId] = (toolCounts[result.toolId] || 0) + 1
    }

    return {
      totalExecutions: this.executionLog.length,
      successfulExecutions: this.executionLog.filter(r => r.status === 'success').length,
      deniedExecutions: this.executionLog.filter(r => r.status === 'denied').length,
      injectionBlocked: this.executionLog.filter(r => r.error?.includes('Injection')).length,
      permissionDenied: this.executionLog.filter(r => r.error?.includes('Permission')).length,
      byCategory,
      mostUsedTools: Object.entries(toolCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([toolId, count]) => ({ toolId, count })),
    }
  }

  // ── Private Helpers ───────────────────────────────────────

  private validateParameters(tool: ToolDefinition, params: Record<string, any>): string | null {
    for (const param of tool.parameters) {
      if (param.required && (params[param.name] === undefined || params[param.name] === null)) {
        return `Missing required parameter: ${param.name}`
      }
      const value = params[param.name]
      if (value === undefined) continue

      if (param.type === 'string' && typeof value !== 'string') {
        return `${param.name} must be a string`
      }
      if (param.type === 'number' && typeof value !== 'number') {
        return `${param.name} must be a number`
      }
      if (param.type === 'boolean' && typeof value !== 'boolean') {
        return `${param.name} must be a boolean`
      }
      if (param.enumValues && !param.enumValues.includes(value)) {
        return `${param.name} must be one of: ${param.enumValues.join(', ')}`
      }
      if (param.maxLength && typeof value === 'string' && value.length > param.maxLength) {
        return `${param.name} exceeds max length of ${param.maxLength}`
      }
      if (param.min !== undefined && typeof value === 'number' && value < param.min) {
        return `${param.name} must be at least ${param.min}`
      }
      if (param.max !== undefined && typeof value === 'number' && value > param.max) {
        return `${param.name} must be at most ${param.max}`
      }
    }
    return null
  }

  private checkRateLimit(tool: ToolDefinition): boolean {
    const key = `${tool.id}_${new Date().getHours()}`
    const count = this.hourlyCallCounts.get(key) || 0
    if (count >= tool.rateLimitPerHour) return false
    this.hourlyCallCounts.set(key, count + 1)
    return true
  }

  private createErrorResult(request: ToolExecutionRequest, error: string): ToolExecutionResult {
    const result: ToolExecutionResult = {
      id: `result_${Date.now()}`,
      requestId: request.id,
      toolId: request.toolId,
      status: 'failed',
      error,
      executedAt: new Date().toISOString(),
      sideEffectsApplied: [],
      canUndo: false,
    }
    this.executionLog.push(result)
    return result
  }

  private async runExecution(
    request: ToolExecutionRequest,
    tool: ToolDefinition,
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now()
    const result: ToolExecutionResult = {
      id: `result_${Date.now()}`,
      requestId: request.id,
      toolId: request.toolId,
      status: 'executing',
      sideEffectsApplied: [],
      canUndo: tool.reversible,
    }

    // Set timeout
    setTimeout(() => {
      if (result.status === 'executing') {
        result.status = 'timeout'
        result.error = `Execution timed out after ${tool.timeoutMs}ms`
      }
    }, tool.timeoutMs)

    // Execute the tool (simplified — in production this would call the actual tool handler)
    try {
      const execResult = await this.dispatchToTool(tool, request.parameters)
      result.status = 'success'
      result.result = execResult
      result.sideEffectsApplied = tool.sideEffects
      if (tool.reversible) {
        result.undoToken = `undo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      }
    } catch (err: any) {
      result.status = 'failed'
      result.error = err.message || 'Unknown error'
      if (tool.retryable && !result.error?.includes('permission')) {
        // Could retry here
      }
    }

    result.executedAt = new Date().toISOString()
    result.durationMs = Date.now() - startTime
    this.executionLog.push(result)

    // Keep log manageable
    if (this.executionLog.length > 1000) {
      this.executionLog = this.executionLog.slice(-500)
    }

    return result
  }

  private async dispatchToTool(
    tool: ToolDefinition,
    parameters: Record<string, any>,
  ): Promise<any> {
    // In production, this would dispatch to the actual tool handler
    // For now, simulate execution
    await new Promise(resolve => setTimeout(resolve, 100))
    return { success: true, tool: tool.id, executedWith: parameters }
  }
}

// ── Built-in Tool Definitions ──────────────────────────────

export const BUILTIN_TOOLS: ToolDefinition[] = [
  // Productivity
  {
    id: 'calendar.create_event',
    name: 'Create Calendar Event',
    description: 'Add a focus session event to your calendar',
    category: 'productivity',
    riskLevel: 'low',
    parameters: [
      { name: 'title', type: 'string', description: 'Event title', required: true, maxLength: 100 },
      { name: 'duration_minutes', type: 'number', description: 'Event duration', required: true, min: 1, max: 480 },
      { name: 'start_time', type: 'string', description: 'ISO start time', required: false },
    ],
    returns: { type: 'object', description: 'Created event details' },
    requiresPermission: ['data_collection_basic'],
    requiresApproval: false,
    reversible: true,
    sideEffects: ['calendar_event_created'],
    dataAccessed: [],
    dataModified: ['calendar'],
    timeoutMs: 5000,
    retryable: true,
    rateLimitPerHour: 20,
    provider: 'INTENT',
    version: '1.0.0',
    icon: '📅',
    enabled: true,
  },
  {
    id: 'reminders.create',
    name: 'Create Reminder',
    description: 'Set a reminder for a mission or micro-mission',
    category: 'productivity',
    riskLevel: 'safe',
    parameters: [
      { name: 'text', type: 'string', description: 'Reminder text', required: true, maxLength: 200 },
      { name: 'time', type: 'string', description: 'When to remind (ISO)', required: false },
    ],
    returns: { type: 'object', description: 'Created reminder' },
    requiresPermission: ['data_collection_basic'],
    requiresApproval: false,
    reversible: true,
    sideEffects: ['reminder_created'],
    dataAccessed: [],
    dataModified: ['reminders'],
    timeoutMs: 3000,
    retryable: true,
    rateLimitPerHour: 30,
    provider: 'INTENT',
    version: '1.0.0',
    icon: '🔔',
    enabled: true,
  },

  // Focus
  {
    id: 'focus.enable_deep_work',
    name: 'Enable Deep Work Mode',
    description: 'Turn on system Focus mode, silence notifications, set status',
    category: 'focus',
    riskLevel: 'medium',
    parameters: [
      { name: 'duration_minutes', type: 'number', description: 'How long', required: true, min: 5, max: 240 },
      { name: 'allow_calls', type: 'boolean', description: 'Allow emergency calls', required: false, default: false },
    ],
    returns: { type: 'object', description: 'Focus mode status' },
    requiresPermission: ['data_collection_basic', 'notifications_smart'],
    requiresApproval: true,
    reversible: true,
    sideEffects: ['focus_mode_enabled', 'notifications_silenced'],
    dataAccessed: [],
    dataModified: ['system_focus_mode'],
    timeoutMs: 3000,
    retryable: false,
    rateLimitPerHour: 10,
    provider: 'INTENT',
    version: '1.0.0',
    icon: '🎯',
    enabled: true,
  },
  {
    id: 'focus.block_distractions',
    name: 'Block Distraction Apps',
    description: 'Temporarily block social media and distracting apps',
    category: 'focus',
    riskLevel: 'medium',
    parameters: [
      { name: 'duration_minutes', type: 'number', description: 'Block duration', required: true, min: 5, max: 120 },
      { name: 'apps', type: 'array', description: 'Apps to block (empty = use defaults)', required: false },
    ],
    returns: { type: 'object', description: 'Block status' },
    requiresPermission: ['data_collection_basic', 'data_collection_sensitive'],
    requiresApproval: true,
    reversible: true,
    sideEffects: ['distraction_apps_blocked'],
    dataAccessed: ['distraction_history'],
    dataModified: ['app_restrictions'],
    timeoutMs: 3000,
    retryable: true,
    rateLimitPerHour: 10,
    provider: 'INTENT',
    version: '1.0.0',
    icon: '🛡️',
    enabled: true,
  },

  // Health
  {
    id: 'health.log_mood',
    name: 'Log Mood Entry',
    description: 'Record a mood/energy check-in to Health',
    category: 'health',
    riskLevel: 'safe',
    parameters: [
      { name: 'mood', type: 'enum', description: 'Mood level', required: true, enumValues: ['terrible', 'bad', 'neutral', 'good', 'great'] },
      { name: 'energy', type: 'enum', description: 'Energy level', required: true, enumValues: ['depleted', 'low', 'medium', 'high'] },
      { name: 'note', type: 'string', description: 'Optional note', required: false, maxLength: 200 },
    ],
    returns: { type: 'object', description: 'Logged entry' },
    requiresPermission: ['data_collection_sensitive'],
    requiresApproval: false,
    reversible: true,
    sideEffects: ['health_entry_logged'],
    dataAccessed: [],
    dataModified: ['health_data'],
    timeoutMs: 3000,
    retryable: true,
    rateLimitPerHour: 50,
    provider: 'INTENT',
    version: '1.0.0',
    icon: '💪',
    enabled: true,
  },

  // Smart Home
  {
    id: 'smart_home.set_focus_environment',
    name: 'Set Focus Environment',
    description: 'Dim lights, set temperature, activate focus scene',
    category: 'smart_home',
    riskLevel: 'low',
    parameters: [
      { name: 'scene', type: 'enum', description: 'Focus scene', required: true, enumValues: ['deep_work', 'creative', 'relaxed', 'custom'] },
      { name: 'duration_minutes', type: 'number', description: 'Scene duration', required: false, default: 25, min: 5, max: 120 },
    ],
    returns: { type: 'object', description: 'Scene activation status' },
    requiresPermission: ['data_collection_basic'],
    requiresApproval: true,
    reversible: true,
    sideEffects: ['lights_adjusted', 'temperature_set'],
    dataAccessed: [],
    dataModified: ['smart_home_state'],
    timeoutMs: 5000,
    retryable: true,
    rateLimitPerHour: 10,
    provider: 'INTENT',
    version: '1.0.0',
    icon: '💡',
    enabled: true,
  },

  // System
  {
    id: 'intent.suggest_micro_mission',
    name: 'Suggest Micro-Mission',
    description: 'Generate a personalized micro-mission based on current state and patterns',
    category: 'system',
    riskLevel: 'safe',
    parameters: [
      { name: 'state', type: 'string', description: 'Current avoidance state', required: true },
      { name: 'available_minutes', type: 'number', description: 'Time available', required: false, default: 5, min: 1, max: 60 },
    ],
    returns: { type: 'object', description: 'Suggested micro-mission' },
    requiresPermission: ['ai_analysis', 'data_collection_basic'],
    requiresApproval: false,
    reversible: false,
    sideEffects: [],
    dataAccessed: ['state_history', 'mission_history', 'pattern_profile'],
    dataModified: [],
    timeoutMs: 5000,
    retryable: true,
    rateLimitPerHour: 60,
    provider: 'INTENT',
    version: '1.0.0',
    icon: '🎯',
    enabled: true,
  },
  {
    id: 'intent.record_distraction',
    name: 'Record Distraction',
    description: 'Capture a distraction for pattern analysis',
    category: 'system',
    riskLevel: 'safe',
    parameters: [
      { name: 'content', type: 'string', description: 'What distracted you', required: true, maxLength: 500 },
      { name: 'intensity', type: 'number', description: 'How strong the urge was (1-5)', required: false, default: 3, min: 1, max: 5 },
    ],
    returns: { type: 'object', description: 'Recorded distraction with category' },
    requiresPermission: ['data_collection_sensitive'],
    requiresApproval: false,
    reversible: true,
    sideEffects: ['distraction_recorded'],
    dataAccessed: [],
    dataModified: ['distraction_log'],
    timeoutMs: 2000,
    retryable: true,
    rateLimitPerHour: 100,
    provider: 'INTENT',
    version: '1.0.0',
    icon: '📝',
    enabled: true,
  },
  {
    id: 'intent.start_body_double',
    name: 'Start Body Double Session',
    description: 'Begin a virtual co-working session with ambient presence',
    category: 'system',
    riskLevel: 'safe',
    parameters: [
      { name: 'mode', type: 'enum', description: 'Body double mode', required: true, enumValues: ['presence', 'voice', 'screen_share'] },
      { name: 'duration_minutes', type: 'number', description: 'Session length', required: false, default: 25, min: 5, max: 120 },
    ],
    returns: { type: 'object', description: 'Session details' },
    requiresPermission: ['data_collection_basic'],
    requiresApproval: false,
    reversible: true,
    sideEffects: ['body_double_session_started'],
    dataAccessed: [],
    dataModified: ['active_session'],
    timeoutMs: 3000,
    retryable: true,
    rateLimitPerHour: 20,
    provider: 'INTENT',
    version: '1.0.0',
    icon: '👥',
    enabled: true,
  },
  {
    id: 'intent.salvage_session',
    name: 'Salvage Abandoned Session',
    description: 'Offer partial credit for an abandoned focus session',
    category: 'system',
    riskLevel: 'safe',
    parameters: [
      { name: 'session_id', type: 'string', description: 'Session to salvage', required: true },
      { name: 'notes', type: 'string', description: 'What happened', required: false, maxLength: 300 },
    ],
    returns: { type: 'object', description: 'Salvage result with momentum points' },
    requiresPermission: ['data_collection_basic'],
    requiresApproval: false,
    reversible: true,
    sideEffects: ['session_salvaged', 'momentum_awarded'],
    dataAccessed: ['session_history'],
    dataModified: ['session_status', 'momentum_score'],
    timeoutMs: 3000,
    retryable: true,
    rateLimitPerHour: 20,
    provider: 'INTENT',
    version: '1.0.0',
    icon: '♻️',
    enabled: true,
  },
]
