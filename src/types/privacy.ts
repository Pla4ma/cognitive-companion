// ══════════════════════════════════════════════════════════════
// INTENT — Privacy Types
// Privacy-first data classification and user control types
// ══════════════════════════════════════════════════════════════

export type PrivacyClassification = 'local_only' | 'safe_for_ai' | 'sensitive' | 'never_send' | 'public' | 'personal'

export type DataCategory =
  | 'moments'
  | 'missions'
  | 'drift_signals'
  | 'resistance_patterns'
  | 'distractions'
  | 'coach_history'
  | 'momentum_events'
  | 'context_capsules'
  | 'memory_items'
  | 'agent_actions'
  | 'body_double_sessions'

export type DataStorageLocation = 'local_only' | 'cloud_allowed' | 'ai_allowed' | 'never_send'

export interface DataCategoryInfo {
  category: DataCategory
  description: string
  storageLocation: DataStorageLocation
  userVisible: boolean
  userEditable: boolean
  userDeletable: boolean
  retentionPolicy: string
  example: string
}

export const DATA_CATEGORIES: DataCategoryInfo[] = [
  {
    category: 'moments',
    description: 'Your state selections, energy levels, and time available',
    storageLocation: 'local_only',
    userVisible: true,
    userEditable: false,
    userDeletable: true,
    retentionPolicy: 'Kept until you delete it',
    example: 'State: Overwhelmed, Energy: Low, Time: 5 min',
  },
  {
    category: 'missions',
    description: 'Missions created and their outcomes',
    storageLocation: 'local_only',
    userVisible: true,
    userEditable: true,
    userDeletable: true,
    retentionPolicy: 'Kept until you delete it',
    example: 'Open your essay and write one ugly sentence',
  },
  {
    category: 'drift_signals',
    description: 'Behavioral patterns that suggest you might be drifting',
    storageLocation: 'local_only',
    userVisible: true,
    userEditable: false,
    userDeletable: true,
    retentionPolicy: 'Kept for 90 days, then auto-deleted',
    example: 'App opened 5 times without starting a mission',
  },
  {
    category: 'resistance_patterns',
    description: 'What usually blocks you and what helps',
    storageLocation: 'local_only',
    userVisible: true,
    userEditable: true,
    userDeletable: true,
    retentionPolicy: 'Kept until you delete it',
    example: 'When overwhelmed, 5-min missions work 2.1x better',
  },
  {
    category: 'distractions',
    description: 'Distractions you captured during sessions',
    storageLocation: 'local_only',
    userVisible: true,
    userEditable: true,
    userDeletable: true,
    retentionPolicy: 'Kept for 30 days, then auto-deleted',
    example: 'Wanted to check Instagram',
  },
  {
    category: 'coach_history',
    description: 'Coach conversation history',
    storageLocation: 'local_only',
    userVisible: true,
    userEditable: false,
    userDeletable: true,
    retentionPolicy: 'Kept until you delete it',
    example: 'Coach: "What\'s the tiniest first step?"',
  },
  {
    category: 'momentum_events',
    description: 'Momentum score changes and events',
    storageLocation: 'local_only',
    userVisible: true,
    userEditable: false,
    userDeletable: true,
    retentionPolicy: 'Kept for 90 days',
    example: '+10 points: Completed 5-min mission',
  },
  {
    category: 'context_capsules',
    description: 'Text you pasted or shared into INTENT',
    storageLocation: 'local_only',
    userVisible: true,
    userEditable: true,
    userDeletable: true,
    retentionPolicy: 'Based on your retention setting per capsule',
    example: 'I have a biology test Friday and haven\'t started',
  },
  {
    category: 'memory_items',
    description: 'What INTENT learned about your patterns',
    storageLocation: 'local_only',
    userVisible: true,
    userEditable: true,
    userDeletable: true,
    retentionPolicy: 'Kept until you delete it',
    example: 'Gentle check-ins work better than firm prompts when anxious',
  },
  {
    category: 'agent_actions',
    description: 'Actions INTENT prepared or executed',
    storageLocation: 'local_only',
    userVisible: true,
    userEditable: false,
    userDeletable: true,
    retentionPolicy: 'Kept for 90 days',
    example: 'Drafted reminder for biology test',
  },
  {
    category: 'body_double_sessions',
    description: 'Body double session history',
    storageLocation: 'local_only',
    userVisible: true,
    userEditable: false,
    userDeletable: true,
    retentionPolicy: 'Kept for 30 days',
    example: '10-min session, 3 check-ins, completed',
  },
]

// ── User Privacy Settings ───────────────────────────────────

export interface UserPrivacySettings {
  analyticsEnabled: boolean
  aiPersonalizationEnabled: boolean
  memoryEnabled: boolean
  localOnlyMode: boolean
  contextProcessingEnabled: boolean
  remoteAiEnabled: boolean
  systemSurfacesEnabled: boolean
  shareAnalyticsEnabled: boolean
  crashReportingEnabled: boolean
}

export const DEFAULT_PRIVACY_SETTINGS: UserPrivacySettings = {
  analyticsEnabled: true,
  aiPersonalizationEnabled: false,
  memoryEnabled: true,
  localOnlyMode: false,
  contextProcessingEnabled: true,
  remoteAiEnabled: false,
  systemSurfacesEnabled: true,
  shareAnalyticsEnabled: false,
  crashReportingEnabled: true,
}
