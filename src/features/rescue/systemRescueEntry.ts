// ══════════════════════════════════════════════════════════════
// INTENT — Outside-App Rescue Entry
// Widget/notification/shortcut → mission in under 2 taps
// ══════════════════════════════════════════════════════════════

import type { UserState } from '../../types/moment'
import type { DeepLinkSource } from '../../types/deepLink'

export interface SystemRescueEntry {
  source: DeepLinkSource
  title: string
  subtitle: string
  state: UserState | null
  duration: number
  energy: 'low' | 'medium' | 'high' | 'unknown'
  showDashboard: boolean
  showAuth: boolean
  showPaywall: boolean
  showNotificationPrompt: boolean
}

// ── Create Entry from Source ───────────────────────────────

export function createSystemRescueEntry(params: {
  source: DeepLinkSource
  state?: UserState
  duration?: number
}): SystemRescueEntry {
  const { source, state, duration } = params

  return {
    source,
    title: getTitle(source),
    subtitle: getSubtitle(source),
    state: state ?? null,
    duration: duration ?? 2,
    energy: 'unknown',
    showDashboard: false,  // NEVER show dashboard for system entry
    showAuth: false,       // NEVER require auth for rescue
    showPaywall: false,    // NEVER show paywall during rescue
    showNotificationPrompt: false, // NEVER ask for permissions during rescue
  }
}

// ── Source-Specific Copy ───────────────────────────────────

function getTitle(source: DeepLinkSource): string {
  const titles: Record<DeepLinkSource, string> = {
    widget: 'Rescue ready',
    notification_action: 'Tiny restart',
    shortcut: 'Shortcut rescue',
    share_extension: 'Shared context',
    app_intent: 'Rescue',
    deep_link: 'Rescue',
    unknown: 'Rescue',
  }
  return titles[source] ?? 'Rescue ready'
}

function getSubtitle(source: DeepLinkSource): string {
  const subtitles: Record<DeepLinkSource, string> = {
    widget: '2-minute mission',
    notification_action: 'Your easiest next move',
    shortcut: 'One tap to start',
    share_extension: 'Mission from shared text',
    app_intent: 'Ready when you are',
    deep_link: 'Ready to start',
    unknown: '2-minute mission',
  }
  return subtitles[source] ?? '2-minute mission'
}

// ── Entry Rules ────────────────────────────────────────────

export function shouldSkipOnboarding(entry: SystemRescueEntry): boolean {
  return true // System entries always skip onboarding
}

export function shouldShowMissionPreview(entry: SystemRescueEntry): boolean {
  return true // Always show what they are about to do
}

export function getMaxTapsToMission(): number {
  return 2 // Widget tap + Start button = 2 taps max
}
