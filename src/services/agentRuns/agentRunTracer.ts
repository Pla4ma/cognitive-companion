// ══════════════════════════════════════════════════════════════
// INTENT — Agent Run Store & Tracer
// Records and manages agent run traces
// ══════════════════════════════════════════════════════════════

import type {
  AgentRun,
  AgentRunTrigger,
  AgentRunStep,
  AgentRunStepDetail,
  AgentRunStepStatus,
} from '../../types/agentRun'
import { AGENT_STEPS, EXPLANATION_TEMPLATES } from '../../types/agentRun'

// ── Agent Run Store ────────────────────────────────────────

export class AgentRunStore {
  private runs: AgentRun[] = []
  private maxRuns: number

  constructor(maxRuns: number = 50) {
    this.maxRuns = maxRuns
  }

  addRun(run: AgentRun): void {
    this.runs.unshift(run)
    if (this.runs.length > this.maxRuns) {
      this.runs = this.runs.slice(0, this.maxRuns)
    }
  }

  getRun(id: string): AgentRun | undefined {
    return this.runs.find((r) => r.id === id)
  }

  getRecentRuns(limit: number = 10): AgentRun[] {
    return this.runs.slice(0, limit)
  }

  getRunsByTrigger(trigger: AgentRunTrigger): AgentRun[] {
    return this.runs.filter((r) => r.trigger === trigger)
  }

  getRunsByDate(date: string): AgentRun[] {
    return this.runs.filter((r) => r.startedAt.startsWith(date))
  }

  getStats(): {
    totalRuns: number
    avgLatency: number
    remoteAICount: number
    localFallbackCount: number
    errorRate: number
  } {
    const total = this.runs.length
    if (total === 0) {
      return { totalRuns: 0, avgLatency: 0, remoteAICount: 0, localFallbackCount: 0, errorRate: 0 }
    }

    const latencies = this.runs.filter((r) => r.latencyMs !== null).map((r) => r.latencyMs!)
    const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0
    const remoteAI = this.runs.filter((r) => r.usedRemoteAI).length
    const localFallback = this.runs.filter((r) => r.usedLocalFallback).length
    const errors = this.runs.filter((r) => r.errors.length > 0).length

    return {
      totalRuns: total,
      avgLatency: Math.round(avgLatency),
      remoteAICount: remoteAI,
      localFallbackCount: localFallback,
      errorRate: errors / total,
    }
  }

  clear(): void {
    this.runs = []
  }
}

// ── Agent Run Tracer ───────────────────────────────────────

export class AgentRunTracer {
  private currentRun: AgentRun | null = null
  private store: AgentRunStore
  private stepTimers: Map<AgentRunStep, number> = new Map()

  constructor(store: AgentRunStore) {
    this.store = store
  }

  // ── Lifecycle ──────────────────────────────────────────

  startRun(trigger: AgentRunTrigger, inputsSummary: string): AgentRun {
    const run: AgentRun = {
      id: uid(),
      startedAt: new Date().toISOString(),
      endedAt: null,
      trigger,
      inputsSummary,
      privacyClassification: 'local_only',
      steps: AGENT_STEPS.map((step) => ({
        step,
        status: 'pending',
        startedAt: '',
        completedAt: null,
        input: null,
        output: null,
        durationMs: null,
        reason: null,
      })),
      selectedProtocol: null,
      rejectedOptions: [],
      finalMissionId: null,
      proposedActions: [],
      usedRemoteAI: false,
      usedLocalFallback: false,
      latencyMs: null,
      errors: [],
      userVisibleExplanation: '',
      confidence: 0,
    }

    this.currentRun = run
    return run
  }

  startStep(step: AgentRunStep, input?: Record<string, unknown>): void {
    if (!this.currentRun) return

    const stepDetail = this.currentRun.steps.find((s) => s.step === step)
    if (!stepDetail) return

    stepDetail.status = 'running'
    stepDetail.startedAt = new Date().toISOString()
    stepDetail.input = input ?? null
    this.stepTimers.set(step, Date.now())
  }

  completeStep(step: AgentRunStep, output?: Record<string, unknown>, reason?: string): void {
    if (!this.currentRun) return

    const stepDetail = this.currentRun.steps.find((s) => s.step === step)
    if (!stepDetail) return

    const startTime = this.stepTimers.get(step)
    stepDetail.status = 'completed'
    stepDetail.completedAt = new Date().toISOString()
    stepDetail.output = output ?? null
    stepDetail.reason = reason ?? null
    stepDetail.durationMs = startTime ? Date.now() - startTime : null
    this.stepTimers.delete(step)
  }

  skipStep(step: AgentRunStep, reason: string): void {
    if (!this.currentRun) return

    const stepDetail = this.currentRun.steps.find((s) => s.step === step)
    if (!stepDetail) return

    stepDetail.status = 'skipped'
    stepDetail.reason = reason
  }

  failStep(step: AgentRunStep, error: string): void {
    if (!this.currentRun) return

    const stepDetail = this.currentRun.steps.find((s) => s.step === step)
    if (!stepDetail) return

    stepDetail.status = 'failed'
    stepDetail.reason = error
    this.currentRun.errors.push(`${step}: ${error}`)
  }

  // ── Metadata ───────────────────────────────────────────

  setProtocol(protocol: string): void {
    if (this.currentRun) this.currentRun.selectedProtocol = protocol
  }

  addRejectedOption(option: string): void {
    if (this.currentRun) this.currentRun.rejectedOptions.push(option)
  }

  setMission(missionId: string): void {
    if (this.currentRun) this.currentRun.finalMissionId = missionId
  }

  addProposedAction(action: string): void {
    if (this.currentRun) this.currentRun.proposedActions.push(action)
  }

  setUsedRemoteAI(used: boolean): void {
    if (this.currentRun) this.currentRun.usedRemoteAI = used
  }

  setUsedLocalFallback(used: boolean): void {
    if (this.currentRun) this.currentRun.usedLocalFallback = used
  }

  setPrivacyClassification(classification: 'local_only' | 'remote_allowed'): void {
    if (this.currentRun) this.currentRun.privacyClassification = classification
  }

  setConfidence(confidence: number): void {
    if (this.currentRun) this.currentRun.confidence = confidence
  }

  setExplanation(explanation: string): void {
    if (this.currentRun) this.currentRun.userVisibleExplanation = explanation
  }

  // ── Completion ─────────────────────────────────────────

  endRun(): AgentRun | null {
    if (!this.currentRun) return null

    this.currentRun.endedAt = new Date().toISOString()
    const startTime = new Date(this.currentRun.startedAt).getTime()
    this.currentRun.latencyMs = Date.now() - startTime

    // Generate explanation if not set
    if (!this.currentRun.userVisibleExplanation) {
      this.currentRun.userVisibleExplanation = this.generateExplanation(this.currentRun)
    }

    this.store.addRun(this.currentRun)
    const completed = this.currentRun
    this.currentRun = null
    return completed
  }

  getCurrentRun(): AgentRun | null {
    return this.currentRun
  }

  // ── Explanation Generation ─────────────────────────────

  private generateExplanation(run: AgentRun): string {
    const parts: string[] = []

    // Protocol selection reason
    if (run.selectedProtocol) {
      parts.push(`Selected ${run.selectedProtocol} protocol.`)
    }

    // Quality gate
    const qualityStep = run.steps.find((s) => s.step === 'quality_gate')
    if (qualityStep?.status === 'completed') {
      parts.push('Mission passed quality checks.')
    }

    // Privacy
    const privacyStep = run.steps.find((s) => s.step === 'privacy_gate')
    if (privacyStep?.status === 'completed') {
      if (run.privacyClassification === 'local_only') {
        parts.push('Processing stayed local.')
      }
    }

    // Fallback
    if (run.usedLocalFallback) {
      parts.push('Used local fallback (remote AI not available).')
    }

    return parts.length > 0 ? parts.join(' ') : 'Mission compiled.'
  }
}

// ── Helpers ────────────────────────────────────────────────

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

// ── Factory ────────────────────────────────────────────────

export function createAgentRunTracer(): { tracer: AgentRunTracer; store: AgentRunStore } {
  const store = new AgentRunStore()
  const tracer = new AgentRunTracer(store)
  return { tracer, store }
}
