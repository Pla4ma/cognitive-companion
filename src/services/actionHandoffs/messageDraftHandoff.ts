// ══════════════════════════════════════════════════════════════
// INTENT — Message Draft Handoff Generator
// Creates short message drafts, opens system SMS via sms: link
// ══════════════════════════════════════════════════════════════

import { Platform } from 'react-native'
import * as Linking from 'expo-linking'
import type {
  ActionHandoff,
  MessageDraftPayload,
} from '../../types/actionHandoff'
import { HANDOFF_RISK_MATRIX, HANDOFF_REQUIRES_CONFIRMATION } from '../../types/actionHandoff'
import type { Mission } from '../../types'

// ── Types ────────────────────────────────────────────────────

export interface MessageDraft {
  phone: string
  body: string
}

// ── UID ─────────────────────────────────────────────────────

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

// ── SMS Limits ──────────────────────────────────────────────

const SMS_MAX_LENGTH = 160

function truncateForSMS(text: string): string {
  if (text.length <= SMS_MAX_LENGTH) return text
  return text.slice(0, SMS_MAX_LENGTH - 3) + '...'
}

// ── Recipient Detection ─────────────────────────────────────

function extractRecipient(rawText: string): string {
  const phoneMatch = rawText.match(/\+?\d[\d\s()-]{7,}/)
  if (phoneMatch) return phoneMatch[0].replace(/\s/g, '')

  const nameMatch = rawText.match(/(?:text|message|send to|tell|remind)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i)
  if (nameMatch) return nameMatch[1]

  return ''
}

// ── Message Drafting ────────────────────────────────────────

function draftMessage(rawText: string): string {
  const sentences = rawText
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3)

  if (sentences.length === 0) return truncateForSMS(rawText)

  const core = sentences[0]
  if (core.length <= SMS_MAX_LENGTH) return core

  const words = core.split(' ')
  let draft = ''
  for (const word of words) {
    if ((draft + ' ' + word).trim().length > SMS_MAX_LENGTH - 3) break
    draft = draft ? `${draft} ${word}` : word
  }
  return draft || truncateForSMS(core)
}

// ── Public API ──────────────────────────────────────────────

export async function openMessageDraft(
  phone: string,
  body: string,
): Promise<boolean> {
  const separator = Platform.OS === 'ios' ? '&' : '?'
  const encoded = encodeURIComponent(body)

  // Try sms: scheme (iOS and Android both support this)
  const url = `sms:${phone}${separator}body=${encoded}`
  const supported = await Linking.canOpenURL(url)
  if (supported) {
    await Linking.openURL(url)
    return true
  }

  // Fallback: sms: without body
  await Linking.openURL(`sms:${phone}`)
  return true
}

export function formatMissionAsMessage(mission: Mission): MessageDraft {
  const parts: string[] = [mission.title]
  if (mission.deadline) {
    const dl = new Date(mission.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })
    parts.push(`(due ${dl})`)
  }
  const body = truncateForSMS(parts.join(' '))
  return { phone: '', body }
}

// ── Legacy Handoff Builder ──────────────────────────────────

export function createMessageDraftHandoff(
  contextCapsuleId: string,
  rawText: string,
  recipientHint?: string,
): ActionHandoff {
  const recipient = recipientHint?.trim() || extractRecipient(rawText)
  const body = draftMessage(rawText)

  const payload: MessageDraftPayload = {
    to: recipient || null,
    body,
    platform: 'sms',
  }

  const riskLevel = HANDOFF_RISK_MATRIX.message_draft
  const requiresConfirmation = HANDOFF_REQUIRES_CONFIRMATION.message_draft

  const recipientLabel = recipient ? `To: ${recipient}` : 'No recipient detected'
  const charCount = `${body.length}/${SMS_MAX_LENGTH}`

  return {
    id: uid(),
    type: 'message_draft',
    sourceContextId: contextCapsuleId,
    sourceMissionId: null,
    title: 'Draft message',
    preview: `${recipientLabel} (${charCount})\n${body}`,
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
