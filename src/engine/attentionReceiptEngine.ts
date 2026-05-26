// ══════════════════════════════════════════════════════════════
// INTENT — Attention Receipt Engine
// "What did I do with the moment I almost lost?"
// ══════════════════════════════════════════════════════════════

import type { AttentionReceipt, AttentionReceiptOutcome } from '../../types/attentionReceipt'
import type { UserState } from '../../types/moment'
import type { DriftSignal } from '../../types/drift'

function generateId(): string {
  return `receipt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

// ── Create Receipt ─────────────────────────────────────────

export function createAttentionReceipt(params: {
  beforeState: UserState
  driftSignal: DriftSignal | null
  missionTitle: string
  missionAction: string
  duration: number
  outcome: AttentionReceiptOutcome
  whatChanged: string
  nextMicroStep: string
}): AttentionReceipt {
  const driftRisk = params.driftSignal?.riskLevel ?? 'medium'
  const stateLabel = stateToLabel(params.beforeState)

  return {
    id: generateId(),
    beforeState: stateLabel,
    driftRisk,
    missionTitle: params.missionTitle,
    missionAction: params.missionAction,
    duration: params.duration,
    outcome: params.outcome,
    whatChanged: params.whatChanged,
    nextMicroStep: params.nextMicroStep,
    privacySafeSummary: buildPrivacySafeSummary(params.outcome, params.duration),
    shareableVersion: buildShareableVersion(params.outcome, params.duration, stateLabel),
    createdAt: Date.now(),
  }
}

// ── Labels ─────────────────────────────────────────────────

function stateToLabel(state: UserState): string {
  const map: Record<UserState, string> = {
    overwhelmed: 'Overwhelmed',
    stuck: 'Stuck',
    avoiding: 'Avoiding',
    tired: 'Low energy',
    anxious: 'Tense',
    doomscroll_risk: 'About to scroll',
    perfectionism: 'Overthinking',
    scattered: 'Scattered',
    shame_spiral: 'Hard moment',
    ready: 'Ready',
  }
  return map[state] ?? 'In a moment'
}

// ── Privacy-safe summaries ─────────────────────────────────

function buildPrivacySafeSummary(outcome: AttentionReceiptOutcome, duration: number): string {
  const action = outcomeToAction(outcome)
  return `Rescued ${duration} minutes. ${action}.`
}

function buildShareableVersion(outcome: AttentionReceiptOutcome, duration: number, state: string): string {
  const action = outcomeToAction(outcome)
  return `I rescued ${duration} minutes instead of disappearing. ${action}.`
}

function outcomeToAction(outcome: AttentionReceiptOutcome): string {
  const map: Record<AttentionReceiptOutcome, string> = {
    completed: 'Completed the mission',
    salvaged: 'Salvaged something useful',
    partial: 'Made partial progress',
    skipped: 'Chose to rest instead',
  }
  return map[outcome]
}

// ── Receipt Display Copy ───────────────────────────────────

export function getReceiptTitle(outcome: AttentionReceiptOutcome): string {
  const titles: Record<AttentionReceiptOutcome, string> = {
    completed: 'Moment rescued',
    salvaged: 'Something saved',
    partial: 'Progress made',
    skipped: 'Rest chosen',
  }
  return titles[outcome]
}

export function getReceiptEmoji(outcome: AttentionReceiptOutcome): string {
  const emojis: Record<AttentionReceiptOutcome, string> = {
    completed: '✓',
    salvaged: '↻',
    partial: '→',
    skipped: '○',
  }
  return emojis[outcome]
}

export function getReceiptNextCopy(receipt: AttentionReceipt): string {
  if (receipt.nextMicroStep) {
    return `Next: ${receipt.nextMicroStep}`
  }
  return 'You can come back to this later'
}
