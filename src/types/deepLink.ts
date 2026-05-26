// ══════════════════════════════════════════════════════════════
// INTENT — Deep Link Types & Routes
// Unified routing for all entry surfaces
// ══════════════════════════════════════════════════════════════

import type { UserState, EnergyLevel } from './moment'
import type { PrivacyClassification } from './privacy'

export type DeepLinkAction =
  | 'rescue'
  | 'before_scroll'
  | 'capture_distraction'
  | 'salvage_current'
  | 'body_double'
  | 'paste_chaos'
  | 'quick_mission'
  | 'comeback'
  | 'action_review'
  | 'context_review'
  | 'unknown'

export type DeepLinkSource =
  | 'deep_link'
  | 'widget'
  | 'notification_action'
  | 'shortcut'
  | 'share_extension'
  | 'app_intent'
  | 'unknown'

export interface ParsedIntentUrl {
  action: DeepLinkAction
  params: Record<string, string>
  source: DeepLinkSource
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  sanitizedParams: Record<string, string>
}

export interface DeepLinkAction_ {
  action: DeepLinkAction
  params: Record<string, string>
  source: DeepLinkSource
  momentSource: DeepLinkSource
  routeName: string
  shouldCreateMoment: boolean
  shouldRunAgent: boolean
  requiresAuth: boolean
  requiresReview: boolean
  privacyClassification: PrivacyClassification
}

export interface DeepLinkHandleResult {
  success: boolean
  route: string
  params: Record<string, string>
  action: DeepLinkAction_
  error?: string
}

// ── Route Mapping ──────────────────────────────────────────

export const DEEP_LINK_ROUTES: Record<DeepLinkAction, string> = {
  rescue: '/rescue',
  before_scroll: '/before-scroll',
  capture_distraction: '/capture-distraction',
  salvage_current: '/salvage',
  body_double: '/body-double',
  paste_chaos: '/context-inbox',
  quick_mission: '/rescue',
  comeback: '/rescue',
  action_review: '/action-review',
  context_review: '/context-inbox',
  unknown: '/',
}

// ── Valid States ───────────────────────────────────────────

export const VALID_STATES: UserState[] = [
  'avoiding', 'overwhelmed', 'stuck', 'tired', 'distracted', 'anxious',
  'scattered', 'ready', 'bored', 'perfectionism', 'unclear', 'time_pressure',
  'low_confidence', 'shame_spiral', 'fake_productivity', 'planning_loop', 'doomscroll_risk',
]

export const VALID_DURATIONS = [1, 2, 3, 5, 10, 15, 20, 25, 30, 45, 60]

export const VALID_ENERGIES: EnergyLevel[] = ['depleted', 'low', 'medium', 'high']

export const VALID_MODES = ['silent', 'gentle', 'direct', 'study', 'emergency', 'low_energy']
