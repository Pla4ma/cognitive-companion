// ══════════════════════════════════════════════════════════════
// INTENT — Email Draft Handoff Generator
// Parses context for recipient hints, subject, body draft
// Opens system email via mailto: deep link
// ══════════════════════════════════════════════════════════════

import * as Linking from 'expo-linking'
import type {
  ActionHandoff,
  EmailDraftPayload,
} from '../../types/actionHandoff'
import { HANDOFF_RISK_MATRIX, HANDOFF_REQUIRES_CONFIRMATION } from '../../types/actionHandoff'
import type { Mission } from '../../types'

// ── Types ────────────────────────────────────────────────────

export interface EmailDraft {
  to: string
  subject: string
  body: string
  cc?: string
}

// ── UID ─────────────────────────────────────────────────────

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

// ── Email Parsing ───────────────────────────────────────────

function extractRecipient(rawText: string): string {
  const emailMatch = rawText.match(/[\w.+-]+@[\w-]+\.[\w.]+/)
  if (emailMatch) return emailMatch[0]

  const toMatch = rawText.match(/(?:to|email|send to|write to|contact)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i)
  if (toMatch) return toMatch[1]

  return ''
}

function extractSubject(rawText: string, missionTitle: string): string {
  const reMatch = rawText.match(/(?:about|regarding|re:|subject:)\s+(.+?)(?:\.|$)/i)
  if (reMatch) return reMatch[1].trim().slice(0, 100)

  const firstSentence = rawText.split(/[.!?\n]/)[0]?.trim() ?? ''
  if (firstSentence.length > 5 && firstSentence.length <= 100) return firstSentence

  return missionTitle.slice(0, 100) || 'Quick update'
}

function generateBody(rawText: string, missionTitle: string): string {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 3)

  const keyPoints = lines.slice(0, 4).map((l) => `• ${l}`)
  const contextSection = keyPoints.length > 0
    ? `Based on your context:\n${keyPoints.join('\n')}\n\n`
    : ''

  return `Hi,\n\n${contextSection}I wanted to follow up on ${missionTitle.toLowerCase()}.\n\n[Edit this draft to add your message]\n\nBest regards`
}

// ── URL Encoding ────────────────────────────────────────────

function encodeMailtoParam(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, '+')
}

// ── Public API ──────────────────────────────────────────────

export async function openEmailDraft(
  to: string,
  subject: string,
  body: string,
  cc?: string,
): Promise<boolean> {
  const params = [
    `subject=${encodeMailtoParam(subject)}`,
    `body=${encodeMailtoParam(body)}`,
  ]
  if (cc) params.push(`cc=${encodeMailtoParam(cc)}`)

  const url = `mailto:${encodeURIComponent(to)}?${params.join('&')}`
  const supported = await Linking.canOpenURL(url)
  if (supported) {
    await Linking.openURL(url)
    return true
  }

  // Fallback: plain mailto without params
  await Linking.openURL(`mailto:${encodeURIComponent(to)}`)
  return true
}

export function formatMissionAsEmail(mission: Mission): EmailDraft {
  const to = ''
  const subject = mission.title.slice(0, 100)
  const body = [
    mission.description || '',
    '',
    mission.deadline ? `Deadline: ${new Date(mission.deadline).toLocaleDateString()}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  return { to, subject, body }
}

// ── Legacy Handoff Builder ──────────────────────────────────

export function createEmailDraftHandoff(
  contextCapsuleId: string,
  rawText: string,
  missionTitle: string,
): ActionHandoff {
  const to = extractRecipient(rawText)
  const subject = extractSubject(rawText, missionTitle)
  const body = generateBody(rawText, missionTitle)

  const payload: EmailDraftPayload = {
    to,
    subject,
    body,
    cc: null,
  }

  const riskLevel = HANDOFF_RISK_MATRIX.email_draft
  const requiresConfirmation = HANDOFF_REQUIRES_CONFIRMATION.email_draft

  const recipientLabel = to ? `To: ${to}` : 'No recipient detected'
  return {
    id: uid(),
    type: 'email_draft',
    sourceContextId: contextCapsuleId,
    sourceMissionId: null,
    title: `Email: ${subject}`,
    preview: `${recipientLabel}\nSubject: ${subject}`,
    editablePayload: payload as unknown as Record<string, unknown>,
    riskLevel,
    requiresConfirmation,
    status: 'proposed',
    auditLog: [{ action: 'created', timestamp: new Date().toISOString(), details: null }],
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    completedAt: null,
  }
}
