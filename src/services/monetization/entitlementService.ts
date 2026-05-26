// ══════════════════════════════════════════════════════════════
// INTENT — Premium / Monetization Engine
// Paywall timing, entitlement checking, premium feature map
// ══════════════════════════════════════════════════════════════

export type PlanTier = 'free' | 'pro' | 'lifetime'

export interface PremiumFeature {
  id: string
  name: string
  description: string
  tier: PlanTier
  gateBehavior: 'soft' | 'hard' // soft = show preview, hard = block entirely
}

export const PREMIUM_FEATURES: PremiumFeature[] = [
  // Free features
  { id: 'rescue_mode', name: 'Rescue Mode', description: 'Core rescue experience', tier: 'free', gateBehavior: 'hard' },
  { id: 'basic_missions', name: 'Basic Missions', description: 'Deterministic mission generation', tier: 'free', gateBehavior: 'hard' },
  { id: 'basic_drift_graph', name: 'Basic Drift Graph', description: 'Simple pattern tracking', tier: 'free', gateBehavior: 'hard' },
  { id: 'basic_body_double', name: 'Basic Body Double', description: 'Silent Room mode', tier: 'free', gateBehavior: 'hard' },
  { id: 'before_scroll', name: 'Before You Scroll', description: '2-minute intercept', tier: 'free', gateBehavior: 'hard' },
  { id: 'basic_salvage', name: 'Basic Salvage', description: 'Simple salvage options', tier: 'free', gateBehavior: 'hard' },
  { id: 'privacy_controls', name: 'Privacy Controls', description: 'Full privacy settings', tier: 'free', gateBehavior: 'hard' },
  { id: 'export_data', name: 'Export Data', description: 'Export your data', tier: 'free', gateBehavior: 'hard' },
  { id: 'delete_data', name: 'Delete Data', description: 'Delete your data', tier: 'free', gateBehavior: 'hard' },

  // Pro features
  { id: 'ai_missions', name: 'AI Mission Compiler', description: 'AI-enhanced mission generation', tier: 'pro', gateBehavior: 'soft' },
  { id: 'advanced_drift_graph', name: 'Advanced Drift Graph', description: 'Deep pattern analysis + insights', tier: 'pro', gateBehavior: 'soft' },
  { id: 'weekly_story', name: 'Weekly Story', description: 'Personal momentum narrative', tier: 'pro', gateBehavior: 'soft' },
  { id: 'experiments', name: 'Experiments', description: 'Self-experimentation system', tier: 'pro', gateBehavior: 'soft' },
  { id: 'advanced_body_double', name: 'Advanced Body Double', description: 'All 6 modes + custom check-ins', tier: 'pro', gateBehavior: 'soft' },
  { id: 'context_parser', name: 'Context-to-Mission', description: 'AI parsing of pasted text', tier: 'pro', gateBehavior: 'soft' },
  { id: 'custom_protocols', name: 'Custom Protocols', description: 'Create your own rescue protocols', tier: 'pro', gateBehavior: 'hard' },
  { id: 'advanced_salvage', name: 'Advanced Salvage', description: 'AI-generated salvage plans', tier: 'pro', gateBehavior: 'soft' },
  { id: 'premium_widgets', name: 'Premium Widgets', description: 'Advanced widget configurations', tier: 'pro', gateBehavior: 'hard' },
  { id: 'premium_share_cards', name: 'Premium Share Cards', description: 'Beautiful shareable cards', tier: 'pro', gateBehavior: 'soft' },
  { id: 'cloud_sync', name: 'Cloud Sync', description: 'Sync across devices', tier: 'pro', gateBehavior: 'hard' },
  { id: 'advanced_comeback', name: 'Advanced Comeback Plans', description: 'AI-generated comeback strategies', tier: 'pro', gateBehavior: 'soft' },
  { id: 'mcp_connectors', name: 'MCP Connectors', description: 'Connect to external tools', tier: 'pro', gateBehavior: 'hard' },
  { id: 'priority_support', name: 'Priority Support', description: 'Fast support response', tier: 'pro', gateBehavior: 'hard' },
]

// ── Entitlement Checking ────────────────────────────────────

export function isFeatureAvailable(featureId: string, plan: PlanTier): boolean {
  const feature = PREMIUM_FEATURES.find(f => f.id === featureId)
  if (!feature) return false

  if (feature.tier === 'free') return true
  if (plan === 'lifetime') return true
  if (plan === 'pro' && feature.tier === 'pro') return true
  return false
}

export function getFeatureGateBehavior(featureId: string): 'soft' | 'hard' {
  const feature = PREMIUM_FEATURES.find(f => f.id === featureId)
  return feature?.gateBehavior || 'hard'
}

export function getFeaturesForTier(plan: PlanTier): PremiumFeature[] {
  return PREMIUM_FEATURES.filter(f =>
    f.tier === 'free' || plan === 'pro' || plan === 'lifetime'
  )
}

export function getPremiumFeatures(): PremiumFeature[] {
  return PREMIUM_FEATURES.filter(f => f.tier !== 'free')
}

// ── Paywall Timing ──────────────────────────────────────────

export function shouldShowPaywall(context: {
  plan: PlanTier
  featureId: string
  rescueCount: number
  daysSinceInstall: number
  lastPaywallShown: string | null
  paywallDismissCount: number
}): { show: boolean; reason: string | null } {
  // Never show for free features
  if (isFeatureAvailable(context.featureId, context.plan)) {
    return { show: false, reason: null }
  }

  // Never show before first rescue
  if (context.rescueCount < 1) {
    return { show: false, reason: 'Wait for first rescue' }
  }

  // Show after 3 rescues if trying a premium feature
  if (context.rescueCount >= 3) {
    // But not too frequently
    if (context.lastPaywallShown) {
      const daysSinceLastPaywall = Math.floor(
        (Date.now() - new Date(context.lastPaywallShown).getTime()) / 86400000
      )
      if (daysSinceLastPaywall < 3 && context.paywallDismissCount > 0) {
        return { show: false, reason: 'Too soon since last paywall' }
      }
    }
    return { show: true, reason: 'User has experienced value, trying premium feature' }
  }

  // Show after 7 days if user is active
  if (context.daysSinceInstall >= 7 && context.rescueCount >= 5) {
    return { show: true, reason: 'Active user, week 1 complete' }
  }

  return { show: false, reason: 'Not enough value experienced yet' }
}

// ── Paywall Copy ────────────────────────────────────────────

export const PAYWALL_COPY = {
  title: 'INTENT helped you rescue a moment.',
  subtitle: 'Premium helps it learn your patterns and rescue you faster.',
  features: {
    aiMissions: 'AI-generated missions that get smarter over time',
    driftGraph: 'Deep pattern analysis — learn what really works for you',
    weeklyStory: 'Your personal momentum story, not generic stats',
    experiments: 'Run self-experiments on your productivity',
    bodyDouble: 'All 6 body double modes with custom check-ins',
    contextParser: 'Paste any text — get a mission instantly',
    customProtocols: 'Create your own rescue playbooks',
    cloudSync: 'Your patterns, on all your devices',
  },
  cta: 'Start 7-Day Free Trial',
  restore: 'Restore Purchases',
  terms: 'Terms & Conditions',
  privacy: 'Privacy Policy',
  noCommitment: 'Cancel anytime. No guilt.',
  later: 'Maybe Later',
}
