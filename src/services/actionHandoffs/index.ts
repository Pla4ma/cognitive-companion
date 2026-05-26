// ══════════════════════════════════════════════════════════════
// INTENT — Action Handoff Services Barrel Export
// ══════════════════════════════════════════════════════════════

// ── Policy ──────────────────────────────────────────────────
export {
  evaluateHandoffPolicy,
  createAuditEntry,
  addAuditEntry,
  generateReviewCopy,
  assessHandoffRisk,
} from './handoffPolicy'
export type { HandoffPolicyDecision } from './handoffPolicy'

// ── Generators (legacy unified API) ─────────────────────────
export {
  createReminderHandoff,
  createCalendarBlockHandoff,
  createEmailDraftHandoff,
  createMessageDraftHandoff,
  createChecklistHandoff,
  createStudyPlanHandoff,
  generateHandoffsFromContext,
} from './handoffGenerators'

// ── Calendar (deep-link + ICS) ──────────────────────────────
export {
  createCalendarEvent,
  openCalendarForEvent,
  generateICSEvent,
  generateICSString,
  parseDeadlineFromMission,
  createCalendarHandoff,
} from './calendarHandoff'
export type { CalendarEventInput } from './calendarHandoff'

// ── Reminders (deep-link) ───────────────────────────────────
export {
  createReminder,
  openRemindersApp,
  openReminderDeepLink,
  parseTaskFromMission,
} from './reminderHandoff'
export type { ReminderInput } from './reminderHandoff'

// ── Checklists (export formats) ─────────────────────────────
export {
  createChecklist,
  exportAsMarkdown,
  exportAsPlainText,
  copyChecklistToClipboard,
  createChecklistFromText,
} from './checklistHandoff'
export type { Checklist } from './checklistHandoff'

// ── Email (mailto:) ─────────────────────────────────────────
export {
  openEmailDraft,
  formatMissionAsEmail,
} from './emailDraftHandoff'
export type { EmailDraft } from './emailDraftHandoff'

// ── Messages (sms:) ─────────────────────────────────────────
export {
  openMessageDraft,
  formatMissionAsMessage,
} from './messageDraftHandoff'
export type { MessageDraft } from './messageDraftHandoff'
