// ══════════════════════════════════════════════════════════════
// INTENT — Default Change Explainer
// Human-readable explanations when personal defaults change
// ══════════════════════════════════════════════════════════════

const CONFIDENCE_THRESHOLD = 0.7
const MIN_EVIDENCE_COUNT = 3

export interface DefaultChangeParams {
  field: string
  oldValue: unknown
  newValue: unknown
  reason: string
  evidenceCount: number
  confidence: number
  state?: string
}

export interface ExplainResult {
  explanation: string
  meetsConfidenceThreshold: boolean
  meetsEvidenceThreshold: boolean
  shouldShow: boolean
}

// ── Main Explanation Generator ────────────────────────────

export function explainDefaultChange(params: DefaultChangeParams): ExplainResult {
  const meetsConfidence = params.confidence >= CONFIDENCE_THRESHOLD
  const meetsEvidence = params.evidenceCount >= MIN_EVIDENCE_COUNT
  const shouldShow = meetsConfidence && meetsEvidence

  const explanation = buildExplanation(params)

  return {
    explanation,
    meetsConfidenceThreshold: meetsConfidence,
    meetsEvidenceThreshold: meetsEvidence,
    shouldShow,
  }
}

// ── Explanation Builder ───────────────────────────────────

function buildExplanation(params: DefaultChangeParams): string {
  const { field, oldValue, newValue, reason, evidenceCount } = params
  const stateLabel = params.state ? capitalizeState(params.state) : 'your moments'

  switch (field) {
    case 'duration':
      return buildDurationExplanation(oldValue, newValue, reason, evidenceCount, stateLabel)
    case 'protocol':
      return buildProtocolExplanation(oldValue, newValue, reason, evidenceCount, stateLabel)
    case 'complexity':
      return buildComplexityExplanation(oldValue, newValue, evidenceCount)
    case 'tone':
      return buildToneExplanation(oldValue, newValue, evidenceCount, stateLabel)
    default:
      return `INTENT changed your ${field} from ${oldValue} to ${newValue} based on ${evidenceCount} data points.`
  }
}

function buildDurationExplanation(
  oldVal: unknown,
  newVal: unknown,
  reason: string,
  count: number,
  state: string,
): string {
  const oldMin = Number(oldVal)
  const newMin = Number(newVal)

  if (newMin < oldMin) {
    return `INTENT changed ${state} missions from ${oldMin} min to ${newMin} min because you complete shorter starts ${count}x more often.`
  }
  if (newMin > oldMin) {
    return `INTENT changed ${state} missions from ${oldMin} min to ${newMin} min because you've been consistently finishing on time.`
  }
  return `Your ${state} mission duration was adjusted based on your recent patterns.`
}

function buildProtocolExplanation(
  oldVal: unknown,
  newVal: unknown,
  reason: string,
  count: number,
  state: string,
): string {
  const oldProtocol = String(oldVal)
  const newProtocol = String(newVal)

  return `Your default protocol for ${state.toLowerCase()} moments changed from ${oldProtocol} to ${newProtocol} because it has your highest start rate (${count} successful starts).`
}

function buildComplexityExplanation(
  oldVal: unknown,
  newVal: unknown,
  count: number,
): string {
  const oldLevel = String(oldVal)
  const newLevel = String(newVal)

  const direction =
    complexityRank(newLevel) < complexityRank(oldLevel)
      ? 'simpler missions help you start more often'
      : 'you're ready for slightly bigger steps'

  return `INTENT adjusted mission complexity from ${oldLevel} to ${newLevel} because ${direction} (based on ${count} missions).`
}

function buildToneExplanation(
  oldVal: unknown,
  newVal: unknown,
  count: number,
  state: string,
): string {
  return `The tone for ${state.toLowerCase()} missions changed from ${oldVal} to ${newVal} because you respond better to that style (${count} completions).`
}

// ── Helpers ───────────────────────────────────────────────

function capitalizeState(state: string): string {
  const labels: Record<string, string> = {
    overwhelmed: 'Overwhelmed',
    stuck: 'Stuck',
    avoiding: 'Avoiding',
    tired: 'Low energy',
    anxious: 'Anxious',
    doomscroll_risk: 'Before-scroll',
    perfectionism: 'Overthinking',
    scattered: 'Scattered',
    shame_spiral: 'Hard moments',
    ready: 'Ready',
  }
  return labels[state] ?? state.charAt(0).toUpperCase() + state.slice(1)
}

function complexityRank(level: string): number {
  const ranks: Record<string, number> = { minimal: 0, simple: 1, standard: 2 }
  return ranks[level] ?? 1
}

// ── Quick Templates ──────────────────────────────────────

export function getQuickExplanationTemplate(
  field: string,
): ((params: DefaultChangeParams) => string) | null {
  const templates: Record<string, (p: DefaultChangeParams) => string> = {
    duration: (p) =>
      `${capitalizeState(p.state ?? 'default')} missions: ${p.oldValue} min → ${p.newValue} min. You complete shorter starts more often.`,
    protocol: (p) =>
      `Your protocol for ${capitalizeState(p.state ?? 'default')} changed to ${p.newValue}. It has the best start rate.`,
    complexity: (p) =>
      `Mission complexity changed from ${p.oldValue} to ${p.newValue} based on your completion patterns.`,
  }
  return templates[field] ?? null
}
