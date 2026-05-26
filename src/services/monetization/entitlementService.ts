// ══════════════════════════════════════════════════════════════
// INTENT — Entitlement Service
// Feature gating and paywall timing for monetization
// ══════════════════════════════════════════════════════════════

import type { PlanTier } from '../../types'

// ── Types ─────────────────────────────────────────────────

export interface PaywallContext {
  plan: PlanTier
  featureId: string
  rescueCount: number
  daysSinceInstall: number
  lastPaywallShown: string | null
  paywallDismissCount: number
}

export interface PaywallDecision {
  show: boolean
  reason?: string
}

// ── Feature Availability ──────────────────────────────────

const FREE_FEATURES = new Set([
  'rescue_mode',
  'privacy_controls',
  'core_sessions',
  'basic_insights',
  'manual_state_select',
  'brain_dump',
])

const PRO_FEATURES = new Set([
  'ai_missions',
  'ai_coach',
  'weekly_story',
  'advanced_insights',
  'export_data',
  'body_double',
  'custom_protocols',
  'pattern_detection',
])

const LIFETIME_FEATURES = new Set([
  'ai_missions',
  'ai_coach',
  'weekly_story',
  'advanced_insights',
  'export_data',
  'body_double',
  'custom_protocols',
  'pattern_detection',
  'priority_support',
  'early_access',
])

export function isFeatureAvailable(featureId: string, plan: PlanTier): boolean {
  // Free features are always available
  if (FREE_FEATURES.has(featureId)) return true

  // Pro features require pro or lifetime
  if (PRO_FEATURES.has(featureId)) {
    return plan === 'pro' || plan === 'lifetime'
  }

  // Lifetime-only features
  if (LIFETIME_FEATURES.has(featureId)) {
    return plan === 'lifetime'
  }

  // Unknown features default to free
  return true
}

// ── Paywall Timing ────────────────────────────────────────

export function shouldShowPaywall(context: PaywallContext): PaywallDecision {
  const { plan, featureId, rescueCount, daysSinceInstall, lastPaywallShown, paywallDismissCount } = context

  // Never show paywall to paid users
  if (plan === 'pro' || plan === 'lifetime') {
    return { show: false, reason: 'user_is_paid' }
  }

  // Never show before first rescue
  if (rescueCount === 0) {
    return { show: false, reason: 'no_rescues_yet' }
  }

  // Don't show if dismissed too many times recently
  if (paywallDismissCount >= 3) {
    // Allow after cooldown period
    if (lastPaywallShown) {
      const daysSincePaywall = Math.floor(
        (Date.now() - new Date(lastPaywallShown).getTime()) / 86400000,
      )
      if (daysSincePaywall < 7) {
        return { show: false, reason: 'too_many_dismissals' }
      }
    }
  }

  // Show after sufficient engagement signals
  if (rescueCount >= 3 && daysSinceInstall >= 2) {
    return { show: true, reason: 'engagement_threshold_met' }
  }

  // Show for premium feature attempts
  if (PRO_FEATURES.has(featureId) && rescueCount >= 1) {
    return { show: true, reason: 'premium_feature_attempt' }
  }

  return { show: false, reason: 'not_ready' }
}
