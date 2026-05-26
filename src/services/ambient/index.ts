// ══════════════════════════════════════════════════════════════
// INTENT — Ambient Services Barrel Export
// ══════════════════════════════════════════════════════════════

export { AmbientAgent, createAmbientAgent } from './ambientAgent'
export {
  evaluateAmbientPolicy,
  isWithinQuietHours,
  isDayDisabled,
  hasReachedMaxPrompts,
  isInCooldown,
  isSurfaceAllowed,
  isSafeNotificationCopy,
  sanitizeNotificationCopy,
  isWithinDangerWindow,
} from './ambientPolicy'
export {
  generateAmbientCopy,
  generateWhyExplanation,
} from './ambientCopy'
export {
  detectDriftPatterns,
  validateDangerWindow,
  DANGER_WINDOW_PRESETS,
} from './dangerWindowEngine'
export {
  getScheduleConfig,
  getNextCheckTime,
  shouldCheckNow,
  isWithinPreWindow,
} from './suggestionScheduler'
export {
  createDefaultQuietHours,
  formatQuietHours,
  getQuietHoursSummary,
  getQuietDurationMinutes,
  getNextQuietHoursEnd,
} from './quietHours'
