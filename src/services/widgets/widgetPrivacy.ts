// ══════════════════════════════════════════════════════════════
// INTENT — Widget Privacy Model
// Widgets can leak data on lock/home screens
// ══════════════════════════════════════════════════════════════

export type WidgetPrivacyMode = 'private' | 'standard' | 'detailed'

export interface WidgetPrivacySettings {
  mode: WidgetPrivacyMode
  hideOnLockScreen: boolean
  hideSensitiveStates: boolean
  hideMissionText: boolean
}

// ── Default Settings ───────────────────────────────────────

export function getDefaultWidgetPrivacy(): WidgetPrivacySettings {
  return {
    mode: 'private',
    hideOnLockScreen: true,
    hideSensitiveStates: true,
    hideMissionText: true,
  }
}

// ── Widget Data Filtering ──────────────────────────────────

export interface WidgetDisplayData {
  title: string
  subtitle: string
  action: string
  missionText: string | null
  stateLabel: string | null
  category: string | null
}

export function filterWidgetData(data: WidgetDisplayData, settings: WidgetPrivacySettings): WidgetDisplayData {
  switch (settings.mode) {
    case 'private':
      return {
        title: 'Rescue ready',
        subtitle: '2-minute mission',
        action: 'Start',
        missionText: null,
        stateLabel: null,
        category: null,
      }

    case 'standard':
      return {
        title: data.title,
        subtitle: data.category ? `${data.category} rescue` : data.subtitle,
        action: data.action,
        missionText: null,
        stateLabel: settings.hideSensitiveStates ? null : data.stateLabel,
        category: data.category,
      }

    case 'detailed':
      return {
        ...data,
        stateLabel: settings.hideSensitiveStates ? null : data.stateLabel,
        missionText: settings.hideMissionText ? null : data.missionText,
      }

    default:
      return filterWidgetData(data, getDefaultWidgetPrivacy())
  }
}

// ── Privacy Copy ───────────────────────────────────────────

export function getWidgetPrivacyDescription(mode: WidgetPrivacyMode): string {
  const descriptions: Record<WidgetPrivacyMode, string> = {
    private: 'Shows generic text only. No mission details, no state labels.',
    standard: 'Shows category and duration. Hides exact mission text.',
    detailed: 'Shows mission text if you allow. Requires explicit opt-in.',
  }
  return descriptions[mode]
}

export function getWidgetPrivacyRecommendation(): string {
  return 'Private mode is recommended for lock screen widgets.'
}

// ── Sensitive State Check ──────────────────────────────────

const SENSITIVE_STATES = ['shame_spiral', 'anxious', 'doomscroll_risk']

export function isSensitiveState(state: string): boolean {
  return SENSITIVE_STATES.includes(state)
}

export function getSafeStateLabel(state: string): string {
  if (isSensitiveState(state)) return 'In a moment'
  return state
}
