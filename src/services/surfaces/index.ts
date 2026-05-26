// ══════════════════════════════════════════════════════════════
// INTENT — Surface Services Barrel Export
// ══════════════════════════════════════════════════════════════

// ── Widget Service ──────────────────────────────────────────
export {
  getWidgetData,
  updateWidget,
  isWidgetAvailable,
  formatForPlatform,
  checkWidgetConsent,
  setWidgetPrivacySettings,
  loadWidgetData,
} from './widgetService'

// ── Live Activity Service ───────────────────────────────────
export {
  startActivity,
  updateActivity,
  endActivity,
  getActiveActivity,
  isLiveActivityAvailable,
  checkLiveActivityConsent,
  getActivityHistory,
} from './liveActivityService'

// ── App Intents Service ─────────────────────────────────────
export {
  registerIntents,
  executeIntent,
  isIntentsAvailable,
  checkIntentConsent,
  getIntentDefinition,
  getAllIntentDefinitions,
  INTENT_DEFINITIONS,
} from './appIntentsService'

// ── Shortcut Service ────────────────────────────────────────
export {
  registerShortcuts,
  updateDynamicShortcuts,
  isShortcutsAvailable,
  checkShortcutConsent,
  handleShortcut,
  handleShortcutById,
  getStaticShortcuts,
  loadShortcutsState,
} from './shortcutService'
