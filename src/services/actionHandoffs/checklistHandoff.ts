// ══════════════════════════════════════════════════════════════
// INTENT — Checklist Handoff Generator
// Extracts action items, exports as markdown / plain text
// ══════════════════════════════════════════════════════════════

import * as Clipboard from 'expo-clipboard'
import type {
  ActionHandoff,
  ChecklistPayload,
  ChecklistItem,
} from '../../types/actionHandoff'
import { HANDOFF_RISK_MATRIX, HANDOFF_REQUIRES_CONFIRMATION } from '../../types/actionHandoff'

// ── Types ────────────────────────────────────────────────────

export interface Checklist {
  title: string
  items: ChecklistItem[]
}

// ── UID ─────────────────────────────────────────────────────

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

// ── Action Extraction ───────────────────────────────────────

const ACTION_VERBS = [
  'call', 'email', 'send', 'write', 'read', 'review', 'check',
  'buy', 'get', 'pick up', 'submit', 'finish', 'complete', 'fix',
  'clean', 'organize', 'schedule', 'book', 'pay', 'return', 'update',
  'create', 'prepare', 'draft', 'research', 'find', 'download',
  'install', 'set up', 'confirm', 'cancel', 'delete', 'move',
]

function isActionableLine(line: string): boolean {
  const lower = line.toLowerCase().trim()
  if (lower.length < 3) return false

  const startsWithVerb = ACTION_VERBS.some((v) => lower.startsWith(v))
  const hasNumberPrefix = /^\d+[.)]\s/.test(lower)
  const hasDashPrefix = /^[-*•]\s/.test(lower)
  const hasTodoMarker = /☐|□|\[[ ]?\]/.test(line)

  return startsWithVerb || hasNumberPrefix || hasDashPrefix || hasTodoMarker
}

function cleanActionText(line: string): string {
  return line
    .replace(/^\d+[.)]\s*/, '')
    .replace(/^[-*•]\s*/, '')
    .replace(/☐|□|\[[ ]?\]/, '')
    .trim()
}

function extractActionsFromText(rawText: string): string[] {
  const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
  const actions = lines
    .filter(isActionableLine)
    .map(cleanActionText)
    .filter((a) => a.length > 2)

  if (actions.length === 0) {
    return lines
      .filter((l) => l.length > 5 && l.length < 120)
      .slice(0, 8)
      .map(cleanActionText)
  }

  return actions.slice(0, 15)
}

// ── Checklist Title ─────────────────────────────────────────

function generateTitle(rawText: string): string {
  const firstLine = rawText.split('\n')[0]?.trim() ?? ''
  if (firstLine.length > 0 && firstLine.length <= 60) return firstLine
  return 'Action items'
}

// ── Public API ──────────────────────────────────────────────

export function createChecklist(items: string[]): Checklist {
  return {
    title: 'Checklist',
    items: items.map((text, i) => ({
      id: uid(),
      text,
      checked: false,
      order: i,
    })),
  }
}

export function exportAsMarkdown(checklist: Checklist): string {
  const header = `# ${checklist.title}\n`
  const body = checklist.items
    .sort((a, b) => a.order - b.order)
    .map((item) => `- [${item.checked ? 'x' : ' '}] ${item.text}`)
    .join('\n')
  return `${header}\n${body}\n`
}

export function exportAsPlainText(checklist: Checklist): string {
  const header = checklist.title
  const separator = '─'.repeat(Math.min(header.length, 40))
  const body = checklist.items
    .sort((a, b) => a.order - b.order)
    .map((item, i) => {
      const mark = item.checked ? '✓' : '○'
      return `${i + 1}. ${mark} ${item.text}`
    })
    .join('\n')
  return `${header}\n${separator}\n${body}\n`
}

export async function copyChecklistToClipboard(
  checklist: Checklist,
  format: 'markdown' | 'plaintext' = 'markdown',
): Promise<void> {
  const content = format === 'markdown'
    ? exportAsMarkdown(checklist)
    : exportAsPlainText(checklist)
  await Clipboard.setStringAsync(content)
}

// ── Legacy Handoff Builders ─────────────────────────────────

export function createChecklistHandoff(
  contextCapsuleId: string,
  extractedActions: string[],
): ActionHandoff {
  const title = 'Checklist from context'

  const items: ChecklistItem[] = extractedActions.map((text, i) => ({
    id: uid(),
    text,
    checked: false,
    order: i,
  }))

  const payload: ChecklistPayload = { title, items }

  const riskLevel = HANDOFF_RISK_MATRIX.checklist
  const requiresConfirmation = HANDOFF_REQUIRES_CONFIRMATION.checklist

  return {
    id: uid(),
    type: 'checklist',
    sourceContextId: contextCapsuleId,
    sourceMissionId: null,
    title,
    preview: `${items.length} action items`,
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

export function createChecklistFromText(
  contextCapsuleId: string,
  rawText: string,
): ActionHandoff {
  const actions = extractActionsFromText(rawText)
  return createChecklistHandoff(contextCapsuleId, actions)
}
