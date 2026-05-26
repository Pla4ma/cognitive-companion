// ══════════════════════════════════════════════════════════════
// INTENT — Time-to-Action Metrics
// Core metric: app open → mission start
// ══════════════════════════════════════════════════════════════

export type MetricType =
  | 'app_open_to_state_select'
  | 'state_select_to_mission_compile'
  | 'mission_compile_to_start'
  | 'total_time_to_action'
  | 'emergency_start_time'
  | 'onboarding_time_to_first_action'
  | 'notification_action_to_start'
  | 'widget_action_to_start'

export interface TimeMetric {
  type: MetricType
  durationMs: number
  timestamp: number
  source: string | null
}

// ── Targets ────────────────────────────────────────────────

const TARGETS: Record<MetricType, number> = {
  app_open_to_state_select: 3000,
  state_select_to_mission_compile: 5000,
  mission_compile_to_start: 2000,
  total_time_to_action: 10000,
  emergency_start_time: 3000,
  onboarding_time_to_first_action: 45000,
  notification_action_to_start: 5000,
  widget_action_to_start: 5000,
}

// ── Metric Store ───────────────────────────────────────────

const metrics: TimeMetric[] = []

export function recordMetric(type: MetricType, durationMs: number, source?: string): void {
  metrics.push({ type, durationMs, timestamp: Date.now(), source: source ?? null })
}

export function getMetrics(type: MetricType): TimeMetric[] {
  return metrics.filter((m) => m.type === type)
}

export function getAverageMetric(type: MetricType): number {
  const filtered = getMetrics(type)
  if (filtered.length === 0) return 0
  return Math.round(filtered.reduce((a, b) => a + b.durationMs, 0) / filtered.length)
}

export function meetsTarget(type: MetricType): boolean {
  const avg = getAverageMetric(type)
  return avg <= TARGETS[type]
}

export function getTarget(type: MetricType): number {
  return TARGETS[type]
}

// ── Session Timing ─────────────────────────────────────────

interface TimingSession {
  startMs: number
  marks: Map<string, number>
}

let currentSession: TimingSession | null = null

export function startTimingSession(): void {
  currentSession = { startMs: Date.now(), marks: new Map() }
}

export function markTiming(label: string): void {
  if (currentSession) {
    currentSession.marks.set(label, Date.now())
  }
}

export function endTimingSession(): Map<string, number> | null {
  if (!currentSession) return null
  const result = new Map<string, number>()
  for (const [label, markMs] of currentSession.marks) {
    result.set(label, markMs - currentSession.startMs)
  }
  currentSession = null
  return result
}
