// ══════════════════════════════════════════════════════════════
// INTENT — Action Handoff Generators
// Creates specific handoff types from context
// ══════════════════════════════════════════════════════════════

import type {
  ActionHandoff,
  ActionHandoffType,
  ReminderPayload,
  CalendarBlockPayload,
  EmailDraftPayload,
  MessageDraftPayload,
  ChecklistPayload,
  ChecklistItem,
  StudyPlanPayload,
  StudyTopic,
} from '../../types/actionHandoff'
import { HANDOFF_RISK_MATRIX, HANDOFF_REQUIRES_CONFIRMATION } from '../../types/actionHandoff'
import { evaluateHandoffPolicy } from './handoffPolicy'

// ── Factory ────────────────────────────────────────────────

function createHandoff(
  type: ActionHandoffType,
  title: string,
  preview: string,
  payload: Record<string, unknown>,
  sourceContextId?: string,
  sourceMissionId?: string,
): ActionHandoff {
  const policy = evaluateHandoffPolicy(type)
  return {
    id: uid(),
    type,
    sourceContextId: sourceContextId ?? null,
    sourceMissionId: sourceMissionId ?? null,
    title,
    preview,
    editablePayload: payload,
    riskLevel: policy.riskLevel,
    requiresConfirmation: policy.requiresConfirmation,
    status: 'proposed',
    auditLog: [{ action: 'created', timestamp: new Date().toISOString(), details: null }],
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    completedAt: null,
  }
}

// ── Reminder Handoff ───────────────────────────────────────

export function createReminderHandoff(
  title: string,
  body: string,
  scheduledTime: string,
  sourceContextId?: string,
): ActionHandoff {
  const payload: ReminderPayload = { title, body, scheduledTime, repeat: 'none' }
  return createHandoff('reminder', title, `Reminder: ${title} at ${formatTime(scheduledTime)}`, payload, sourceContextId)
}

// ── Calendar Block Handoff ─────────────────────────────────

export function createCalendarBlockHandoff(
  title: string,
  startTime: string,
  endTime: string,
  notes?: string,
  sourceContextId?: string,
): ActionHandoff {
  const payload: CalendarBlockPayload = { title, startTime, endTime, notes: notes ?? null, location: null }
  return createHandoff('calendar_block', title, `Block: ${title} (${formatTime(startTime)} – ${formatTime(endTime)})`, payload, sourceContextId)
}

// ── Email Draft Handoff ────────────────────────────────────

export function createEmailDraftHandoff(
  to: string,
  subject: string,
  body: string,
  sourceContextId?: string,
): ActionHandoff {
  const payload: EmailDraftPayload = { to, subject, body, cc: null }
  return createHandoff('email_draft', `Email: ${subject}`, `To: ${to}\nSubject: ${subject}`, payload, sourceContextId)
}

// ── Message Draft Handoff ──────────────────────────────────

export function createMessageDraftHandoff(
  body: string,
  to?: string,
  sourceContextId?: string,
): ActionHandoff {
  const payload: MessageDraftPayload = { to: to ?? null, body, platform: 'sms' }
  return createHandoff('message_draft', 'Draft message', body.substring(0, 100), payload, sourceContextId)
}

// ── Checklist Handoff ──────────────────────────────────────

export function createChecklistHandoff(
  title: string,
  items: string[],
  sourceContextId?: string,
): ActionHandoff {
  const checklistItems: ChecklistItem[] = items.map((text, i) => ({
    id: uid(),
    text,
    checked: false,
    order: i,
  }))
  const payload: ChecklistPayload = { title, items: checklistItems }
  return createHandoff('checklist', title, `${items.length} items`, payload, sourceContextId)
}

// ── Study Plan Handoff ─────────────────────────────────────

export function createStudyPlanHandoff(
  subject: string,
  topics: { name: string; minutes: number; priority: number }[],
  examDate?: string,
  sourceContextId?: string,
): ActionHandoff {
  const studyTopics: StudyTopic[] = topics.map((t, i) => ({
    id: uid(),
    name: t.name,
    estimatedMinutes: t.minutes,
    priority: t.priority,
    completed: false,
  }))
  const totalMinutes = topics.reduce((sum, t) => sum + t.minutes, 0)
  const payload: StudyPlanPayload = { subject, examDate: examDate ?? null, topics: studyTopics, totalMinutes }
  return createHandoff('study_plan', `Study: ${subject}`, `${topics.length} topics, ${totalMinutes} min total`, payload, sourceContextId)
}

// ── Generate from Context ──────────────────────────────────

export function generateHandoffsFromContext(
  rawText: string,
  obligations: { text: string; deadline: string | null }[],
  sourceContextId?: string,
): ActionHandoff[] {
  const handoffs: ActionHandoff[] = []
  const lower = rawText.toLowerCase()

  // Email detection
  if (lower.includes('email') || lower.includes('send')) {
    const emailObl = obligations.find((o) => o.text.toLowerCase().includes('email'))
    if (emailObl) {
      handoffs.push(createEmailDraftHandoff(
        '', // to be filled by user
        extractSubject(emailObl.text),
        generateEmailBody(emailObl.text),
        sourceContextId,
      ))
    }
  }

  // Reminder for deadlines
  for (const ob of obligations) {
    if (ob.deadline) {
      handoffs.push(createReminderHandoff(
        ob.text,
        `Reminder: ${ob.text}`,
        ob.deadline,
        sourceContextId,
      ))
    }
  }

  // Checklist for multi-item
  if (obligations.length >= 3) {
    handoffs.push(createChecklistHandoff(
      'Action items',
      obligations.map((o) => o.text),
      sourceContextId,
    ))
  }

  return handoffs
}

// ── Helpers ────────────────────────────────────────────────

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return isoString
  }
}

function extractSubject(text: string): string {
  // Try to extract a subject from the obligation text
  const match = text.match(/(?:about|regarding|re:)\s+(.+)/i)
  return match ? match[1] : text.substring(0, 50)
}

function generateEmailBody(obligationText: string): string {
  return `Hi,\n\nI wanted to follow up about ${obligationText.toLowerCase()}.\n\n[Edit this draft]\n\nBest regards`
}
