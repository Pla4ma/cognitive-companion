// ══════════════════════════════════════════════════════════════
// INTENT — Attention Receipt Types
// "What did I do with the moment I almost lost?"
// ══════════════════════════════════════════════════════════════

export type AttentionReceiptOutcome = 'completed' | 'salvaged' | 'partial' | 'skipped'

export interface AttentionReceipt {
  id: string
  beforeState: string
  driftRisk: 'low' | 'medium' | 'high'
  missionTitle: string
  missionAction: string
  duration: number
  outcome: AttentionReceiptOutcome
  whatChanged: string
  nextMicroStep: string
  privacySafeSummary: string
  shareableVersion: string
  createdAt: number
}
