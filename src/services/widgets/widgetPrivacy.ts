// ── Widget Privacy ──────────────────────────────────────────
// Filters widget data based on privacy settings

export interface WidgetData {
  title: string;
  subtitle: string;
  action: string;
  missionText: string | null;
  stateLabel: string | null;
  category: string;
}

export interface WidgetPrivacySettings {
  mode: 'private' | 'detailed';
  hideOnLockScreen: boolean;
  hideSensitiveStates: boolean;
  hideMissionText: boolean;
}

export function getDefaultWidgetPrivacy(): WidgetPrivacySettings {
  return {
    mode: 'private',
    hideOnLockScreen: true,
    hideSensitiveStates: true,
    hideMissionText: true,
  };
}

export function filterWidgetData(data: WidgetData, settings: WidgetPrivacySettings): WidgetData {
  if (settings.mode === 'detailed') {
    return { ...data };
  }

  // Private mode — hide sensitive information
  return {
    title: 'Rescue ready',
    subtitle: settings.hideOnLockScreen ? '' : data.subtitle,
    action: data.action,
    missionText: settings.hideMissionText ? null : data.missionText,
    stateLabel: settings.hideSensitiveStates ? null : data.stateLabel,
    category: data.category,
  };
}
