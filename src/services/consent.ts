// ══════════════════════════════════════════════════════════════
// INTENT — Permission & Consent Architecture
// Explicit permission receipts, consent management, data use transparency.
//
// In 2026, privacy is product design. Users must understand
// and control how their emotional/behavioral data is used.
// ══════════════════════════════════════════════════════════════

import { UserProfile } from '../types'

// ── Permission Types ────────────────────────────────────────

export type PermissionId =
  | 'data_collection_basic'       // Sessions, missions, focus data
  | 'data_collection_sensitive'   // Emotional states, blockers, distractions
  | 'data_collection_location'    // Location context for drift detection
  | 'ai_analysis'                 // AI processing of personal data
  | 'ai_training'                 // Using data to improve AI models
  | 'notifications_smart'         // Proactive (potentially interruptive) notifications
  | 'notifications_marketing'     // Product updates, tips, promotions
  | 'data_export'                 // Export personal data
  | 'data_sharing_anonymous'      // Anonymized aggregate analytics
  | 'data_sharing_research'       // Academic/product research participation
  | 'crash_reporting'             // Automatic crash/bug reports
  | 'on_device_only'              // Keep all data local, no cloud sync
  | 'cloud_sync'                  // Sync data across devices
  | 'backup_encrypted'            // Encrypted cloud backup
  | 'biometric_auth'              // Face ID / Touch ID for app access
  | 'widget_data'                 // Show personal data in widgets
  | 'live_activity_data'          // Show personal data in Live Activities
  | 'siri_shortcuts'              // Allow Siri to trigger app actions

export interface PermissionDefinition {
  id: PermissionId
  name: string
  description: string
  detail: string
  category: 'data' | 'ai' | 'notifications' | 'sharing' | 'device' | 'access'
  defaultGranted: boolean
  required: boolean // Can the user deny this?
  proOnly: boolean
  affectsFeatures: string[]
}

export const PERMISSION_DEFINITIONS: Record<PermissionId, PermissionDefinition> = {
  data_collection_basic: {
    id: 'data_collection_basic',
    name: 'Basic Activity Data',
    description: 'Track your focus sessions, missions, and progress.',
    detail: 'This includes session duration, completion status, mission titles, and streak counts. This data is essential for the app to work.',
    category: 'data',
    defaultGranted: true,
    required: true,
    proOnly: false,
    affectsFeatures: ['progress_tracking', 'session_history', 'streaks'],
  },
  data_collection_sensitive: {
    id: 'data_collection_sensitive',
    name: 'Emotional State Data',
    description: 'Record your emotional states, blockers, and avoidance patterns.',
    detail: 'This includes self-reported states (anxious, overwhelmed, etc.), identified blockers, distraction patterns, and resistance analysis. This data enables personalized interventions.',
    category: 'data',
    defaultGranted: true,
    required: false,
    proOnly: false,
    affectsFeatures: ['personalized_rescue', 'pattern_insights', 'resistance_tracking'],
  },
  data_collection_location: {
    id: 'data_collection_location',
    name: 'Location Context',
    description: 'Use location to detect context (home, work, gym).',
    detail: 'Location is used only for context detection (e.g., "you usually focus better at the library") and is never stored or transmitted.',
    category: 'data',
    defaultGranted: false,
    required: false,
    proOnly: false,
    affectsFeatures: ['context_aware_suggestions'],
  },
  ai_analysis: {
    id: 'ai_analysis',
    name: 'AI Personalization',
    description: 'Use AI to personalize your experience.',
    detail: 'AI processes your patterns to generate personalized micro-missions, tone adaptation, and intervention timing. Data is processed via secure API calls.',
    category: 'ai',
    defaultGranted: true,
    required: false,
    proOnly: false,
    affectsFeatures: ['ai_coach', 'smart_suggestions', 'salvage_system'],
  },
  ai_training: {
    id: 'ai_training',
    name: 'AI Model Improvement',
    description: 'Help improve AI features using anonymized patterns.',
    detail: 'Anonymized interaction patterns (never raw personal data) help improve features for all users. You can opt out without losing any functionality.',
    category: 'ai',
    defaultGranted: false,
    required: false,
    proOnly: false,
    affectsFeatures: [],
  },
  notifications_smart: {
    id: 'notifications_smart',
    name: 'Smart Notifications',
    description: 'Proactive notifications when you might be drifting.',
    detail: 'The app sends notifications based on your patterns — like a check-in when you usually get distracted, or a rescue prompt when you have been inactive.',
    category: 'notifications',
    defaultGranted: true,
    required: false,
    proOnly: false,
    affectsFeatures: ['drift_interception', 'rescue_notifications', 'streak_protection'],
  },
  notifications_marketing: {
    id: 'notifications_marketing',
    name: 'Product Updates',
    description: 'Tips, feature announcements, and motivational content.',
    detail: 'Occasional app tips, new feature announcements, and weekly motivation. Never spam. Always relevant.',
    category: 'notifications',
    defaultGranted: false,
    required: false,
    proOnly: false,
    affectsFeatures: [],
  },
  data_export: {
    id: 'data_export',
    name: 'Data Export',
    description: 'Export your data in standard formats.',
    detail: 'Download all your data as JSON or CSV at any time. Includes sessions, missions, patterns, and settings.',
    category: 'data',
    defaultGranted: true,
    required: false,
    proOnly: false,
    affectsFeatures: ['data_portability'],
  },
  data_sharing_anonymous: {
    id: 'data_sharing_anonymous',
    name: 'Anonymous Analytics',
    description: 'Share anonymized usage statistics.',
    detail: 'Only aggregate, fully anonymized counts (e.g., "87% of users complete more sessions with rescue prompts"). Never individual data.',
    category: 'sharing',
    defaultGranted: true,
    required: false,
    proOnly: false,
    affectsFeatures: [],
  },
  data_sharing_research: {
    id: 'data_sharing_research',
    name: 'Research Participation',
    description: 'Participate in focus/productivity research.',
    detail: 'Anonymized data contributes to academic research on productivity and focus. Fully opt-in. You can leave anytime.',
    category: 'sharing',
    defaultGranted: false,
    required: false,
    proOnly: false,
    affectsFeatures: [],
  },
  crash_reporting: {
    id: 'crash_reporting',
    name: 'Crash Reports',
    description: 'Automatically send crash/bug reports.',
    detail: 'When the app crashes, a report is sent to help fix the issue. Contains technical info (OS, device, stack trace) but no personal data.',
    category: 'sharing',
    defaultGranted: true,
    required: false,
    proOnly: false,
    affectsFeatures: [],
  },
  on_device_only: {
    id: 'on_device_only',
    name: 'On-Device Only Mode',
    description: 'Keep all data on this device. No cloud.',
    detail: 'All data stays on your device. AI features use on-device processing where available. You lose sync across devices and cloud backup.',
    category: 'data',
    defaultGranted: false,
    required: false,
    proOnly: false,
    affectsFeatures: ['local_only_mode', 'on_device_ai'],
  },
  cloud_sync: {
    id: 'cloud_sync',
    name: 'Cloud Sync',
    description: 'Sync data across your devices.',
    detail: 'Data is encrypted and synced across your devices via secure cloud storage. Required for multi-device use.',
    category: 'sharing',
    defaultGranted: true,
    required: false,
    proOnly: false,
    affectsFeatures: ['cross_device_sync'],
  },
  backup_encrypted: {
    id: 'backup_encrypted',
    name: 'Encrypted Backup',
    description: 'Encrypted cloud backup of all data.',
    detail: 'Full encrypted backup. Even the cloud provider cannot read your data. Recovery key is stored only on your devices.',
    category: 'sharing',
    defaultGranted: true,
    required: false,
    proOnly: false,
    affectsFeatures: ['data_recovery'],
  },
  biometric_auth: {
    id: 'biometric_auth',
    name: 'Biometric Lock',
    description: 'Require Face ID or Touch ID to open the app.',
    detail: 'Adds a layer of protection for your personal data. Uses system biometric authentication.',
    category: 'access',
    defaultGranted: false,
    required: false,
    proOnly: false,
    affectsFeatures: ['app_lock'],
  },
  widget_data: {
    id: 'widget_data',
    name: 'Widget Data Display',
    description: 'Show your data in Home Screen widgets.',
    detail: 'Widgets can display your current session, streak, or rescue prompt. Data is visible on your locked screen.',
    category: 'access',
    defaultGranted: true,
    required: false,
    proOnly: false,
    affectsFeatures: ['home_screen_widget'],
  },
  live_activity_data: {
    id: 'live_activity_data',
    name: 'Live Activity Display',
    description: 'Show active sessions in Live Activities.',
    detail: 'During a focus session, a Live Activity shows your timer and progress on the Lock Screen / Dynamic Island.',
    category: 'access',
    defaultGranted: true,
    required: false,
    proOnly: false,
    affectsFeatures: ['live_activities'],
  },
  siri_shortcuts: {
    id: 'siri_shortcuts',
    name: 'Siri & Shortcuts',
    description: 'Let Siri and Shortcuts trigger app actions.',
    detail: 'Say "Hey SirI, start a focus session" or create custom automations with the Shortcuts app.',
    category: 'access',
    defaultGranted: false,
    required: false,
    proOnly: false,
    affectsFeatures: ['siri_integration', 'shortcuts'],
  },
}

// ── Consent Receipt ──────────────────────────────────────────

export interface ConsentReceipt {
  permissionId: PermissionId
  granted: boolean
  timestamp: string
  version: string // Permission spec version
  source: 'onboarding' | 'settings' | 'prompt' | 'system' | 'post_rescue'
  contextDescription: string // What the user was doing when they consented
}

export interface ConsentLedger {
  receipts: ConsentReceipt[]
  lastUpdated: string
  version: string
}

export function createConsentLedger(): ConsentLedger {
  return {
    receipts: [],
    lastUpdated: new Date().toISOString(),
    version: '1.0.0',
  }
}

export function recordConsent(
  ledger: ConsentLedger,
  permissionId: PermissionId,
  granted: boolean,
  source: ConsentReceipt['source'],
  contextDescription: string,
): ConsentLedger {
  const receipt: ConsentReceipt = {
    permissionId,
    granted,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    source,
    contextDescription,
  }

  // Replace any existing receipt for this permission
  const filtered = ledger.receipts.filter(r => r.permissionId !== permissionId)

  return {
    receipts: [...filtered, receipt],
    lastUpdated: new Date().toISOString(),
    version: '1.0.0',
  }
}

export function hasConsented(ledger: ConsentLedger, permissionId: PermissionId): boolean {
  const receipt = ledger.receipts.find(r => r.permissionId === permissionId)
  return receipt?.granted ?? false
}

export function hasExplicitlyDenied(ledger: ConsentLedger, permissionId: PermissionId): boolean {
  const receipt = ledger.receipts.find(r => r.permissionId === permissionId)
  return receipt !== undefined && receipt.granted === false
}

// ── Permission Checker ──────────────────────────────────────

export interface PermissionCheck {
  permitted: boolean
  reason: string
  fallback?: string
  needsPrompt?: boolean
}

export function checkPermission(
  permissionId: PermissionId,
  ledger: ConsentLedger,
  user: UserProfile | null,
): PermissionCheck {
  const def = PERMISSION_DEFINITIONS[permissionId]

  if (!def) {
    return { permitted: false, reason: 'Unknown permission.' }
  }

  if (!user) {
    return { permitted: false, reason: 'Authentication required.', needsPrompt: true }
  }

  if (def.proOnly && user.plan === 'free') {
    return { permitted: false, reason: 'This feature requires Pro.', fallback: 'upgrade_prompt' }
  }

  if (def.required) {
    return { permitted: true, reason: 'Required permission — always granted.' }
  }

  const receipt = ledger.receipts.find(r => r.permissionId === permissionId)

  if (!receipt) {
    // Never been asked — use default
    if (def.defaultGranted) {
      return { permitted: true, reason: 'Default permission (not yet explicitly confirmed by user).' }
    }
    return { permitted: false, reason: 'Permission not yet requested.', needsPrompt: true }
  }

  if (receipt.granted) {
    return { permitted: true, reason: 'User granted permission.' }
  }

  return { permitted: false, reason: 'User denied permission.' }
}

// ── Data Use Transparency ───────────────────────────────────

export interface DataUseReport {
  dataType: string
  purpose: string
  storageLocation: 'device_only' | 'encrypted_cloud' | 'local_and_cloud'
  retentionPeriod: string
  sharedWith: string[]
  aiProcessed: boolean
  userControl: string
}

export const DATA_USE_REPORTS: DataUseReport[] = [
  {
    dataType: 'Focus Sessions',
    purpose: 'Track progress, calculate streaks, generate insights',
    storageLocation: 'local_and_cloud',
    retentionPeriod: 'Indefinitely (until user deletes)',
    sharedWith: [],
    aiProcessed: false,
    userControl: 'Export or delete anytime in Settings > Data',
  },
  {
    dataType: 'Emotional States & Blockers',
    purpose: 'Personalize rescue interventions and tone',
    storageLocation: 'device_only',
    retentionPeriod: '90 days rolling window',
    sharedWith: [],
    aiProcessed: true,
    userControl: 'Can disable collection in Settings > Privacy. Data never leaves device when on-device mode is enabled.',
  },
  {
    dataType: 'Distraction Patterns',
    purpose: 'Identify your most common distractions for proactive interception',
    storageLocation: 'local_and_cloud',
    retentionPeriod: '180 days',
    sharedWith: [],
    aiProcessed: false,
    userControl: 'View and delete individual entries. Clear all in Settings > Data.',
  },
  {
    dataType: 'AI Conversation Data',
    purpose: 'Coach responses, mission breakdown suggestions',
    storageLocation: 'device_only',
    retentionPeriod: '30 days',
    sharedWith: ['Anthropic API (with permission)'],
    aiProcessed: true,
    userControl: 'Can disable AI processing. Conversations not used for model training.',
  },
  {
    dataType: 'Crash Reports',
    purpose: 'Identify and fix bugs',
    storageLocation: 'encrypted_cloud',
    retentionPeriod: '1 year',
    sharedWith: [],
    aiProcessed: false,
    userControl: 'Opt-out in Settings > Privacy > Crash Reports',
  },
  {
    dataType: 'Anonymous Usage Stats',
    purpose: 'Understand feature usage to improve the app',
    storageLocation: 'encrypted_cloud',
    retentionPeriod: 'Indefinite (aggregate only)',
    sharedWith: [],
    aiProcessed: false,
    userControl: 'Opt-out in Settings > Privacy > Analytics',
  },
]

// ── Onboarding Consent Flow ─────────────────────────────────

export interface OnboardingConsentStep {
  permissionId: PermissionId
  title: string
  body: string
  detail: string
  icon: string
  isRequired: boolean
  recommendedValue: boolean
}

export const ONBOARDING_CONSENT_STEPS: OnboardingConsentStep[] = [
  {
    permissionId: 'data_collection_basic',
    title: 'Track Your Progress',
    body: 'INTENT tracks your focus sessions, missions, and streaks to show you how far you have come.',
    detail: 'This is the core functionality of the app. Without this, the app cannot work.',
    icon: '📊',
    isRequired: true,
    recommendedValue: true,
  },
  {
    permissionId: 'data_collection_sensitive',
    title: 'Understand Your Patterns',
    body: 'To help you at the right moment, INTENT learns about your emotional states, blockers, and what distracts you.',
    detail: 'This data stays on your device and is used only to personalize your experience.',
    icon: '🧠',
    isRequired: false,
    recommendedValue: true,
  },
  {
    permissionId: 'ai_analysis',
    title: 'AI-Powered Coaching',
    body: 'Let AI help generate personalized micro-missions, adapt to your tone, and suggest when you might be drifting.',
    detail: 'Your data is processed securely. Nothing is used to train models without your explicit permission.',
    icon: '✨',
    isRequired: false,
    recommendedValue: true,
  },
  {
    permissionId: 'notifications_smart',
    title: 'Smart Check-Ins',
    body: 'INTENT can notify you when you might be drifting or when your streak is at risk.',
    detail: 'These are thoughtful, not spammy. You control the frequency and timing.',
    icon: '🔔',
    isRequired: false,
    recommendedValue: true,
  },
  {
    permissionId: 'data_sharing_anonymous',
    title: 'Help Improve INTENT',
    body: 'Share anonymous usage data to help us understand what works and build better features.',
    detail: 'Only aggregate statistics. Never your personal data. You can opt out anytime.',
    icon: '🤝',
    isRequired: false,
    recommendedValue: true,
  },
]

// ── Data Rights (GDPR/CCPA-ready) ──────────────────────────

export interface DataRight {
  id: string
  name: string
  description: string
  actionLabel: string
}

export const DATA_RIGHTS: DataRight[] = [
  {
    id: 'right_to_access',
    name: 'Access Your Data',
    description: 'See all data INTENT has collected about you.',
    actionLabel: 'Download My Data',
  },
  {
    id: 'right_to_correction',
    name: 'Correct Your Data',
    description: 'Fix any inaccurate data.',
    actionLabel: 'Edit Data',
  },
  {
    id: 'right_to_deletion',
    name: 'Delete Your Data',
    description: 'Permanently delete all your data from INTENT servers.',
    actionLabel: 'Delete All Data',
  },
  {
    id: 'right_to_portability',
    name: 'Export Your Data',
    description: 'Download your data in JSON or CSV format.',
    actionLabel: 'Export Data',
  },
  {
    id: 'right_to_restrict',
    name: 'Restrict Processing',
    description: 'Stop AI analysis while keeping basic functionality.',
    actionLabel: 'Disable AI Processing',
  },
  {
    id: 'right_to_object',
    name: 'Object to Profiling',
    description: 'Opt out of automated profiling and pattern analysis.',
    actionLabel: 'Disable Pattern Analysis',
  },
]
