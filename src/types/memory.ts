// ══════════════════════════════════════════════════════════════
// INTENT — Memory Types
// Privacy-first behavioral memory system
// ══════════════════════════════════════════════════════════════

export type MemoryItemType =
  | 'preference'
  | 'blocker'
  | 'successful_protocol'
  | 'failed_protocol'
  | 'mission_pattern'
  | 'distraction_pattern'
  | 'comeback_pattern'
  | 'push_style_preference'
  | 'energy_pattern'
  | 'time_pattern'
  | 'context_pattern'
  | 'user_rule'
  | 'user_note'

export type MemoryConfidence = 'low' | 'emerging' | 'reliable' | 'strong'

export type MemorySensitivity = 'normal' | 'personal' | 'sensitive' | 'restricted'

export type MemoryStorageLocation = 'local_only' | 'cloud_allowed' | 'ai_allowed' | 'never_send'

export type MemoryRetentionPolicy = 'keep_until_deleted' | 'expire_7_days' | 'expire_30_days' | 'expire_90_days' | 'session_only'

export type MemorySource =
  | 'mission'
  | 'moment'
  | 'coach'
  | 'onboarding'
  | 'manual'
  | 'drift_graph'
  | 'context_capsule'
  | 'system_surface'

export interface MemoryItem {
  id: string
  type: MemoryItemType
  title: string
  summary: string
  source: MemorySource
  confidence: MemoryConfidence
  sensitivity: MemorySensitivity
  storageLocation: MemoryStorageLocation
  userVisible: boolean
  userEditable: boolean
  createdAt: string
  updatedAt: string
  expiresAt: string | null
  retentionPolicy: MemoryRetentionPolicy
  relatedIds: string[]
  rawEvidenceIds: string[]
  deletedAt: string | null
}

// ── Memory Controls ─────────────────────────────────────────

export interface MemoryControls {
  memoryEnabled: boolean
  aiUseEnabled: boolean
  cloudSyncEnabled: boolean
  autoDeleteDays: number | null // null = keep forever
}

export const DEFAULT_MEMORY_CONTROLS: MemoryControls = {
  memoryEnabled: true,
  aiUseEnabled: false,
  cloudSyncEnabled: false,
  autoDeleteDays: null,
}

// ── Memory Export ───────────────────────────────────────────

export interface MemoryExport {
  exportedAt: string
  items: MemoryItem[]
  format: 'json' | 'markdown'
  includesSensitive: boolean
}
