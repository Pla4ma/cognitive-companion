// ══════════════════════════════════════════════════════════════
// INTENT — Performance Marks
// Measure key performance indicators
// ══════════════════════════════════════════════════════════════

export type PerformanceMark =
  | 'app_start'
  | 'rescue_screen_ready'
  | 'mission_compile_duration'
  | 'ai_response_latency'
  | 'fallback_latency'
  | 'live_mission_frame_drops'
  | 'storage_write_latency'
  | 'graph_compute_latency'

const marks: Map<string, number> = new Map()
const measures: Map<string, number> = new Map()

export function mark(name: PerformanceMark): void {
  marks.set(name, Date.now())
}

export function measure(name: PerformanceMark, startMark: PerformanceMark, endMark?: PerformanceMark): number {
  const start = marks.get(startMark)
  const end = endMark ? marks.get(endMark) : Date.now()

  if (!start) return 0

  const duration = (end || Date.now()) - start
  measures.set(name, duration)
  return duration
}

export function getMeasure(name: PerformanceMark): number {
  return measures.get(name) || 0
}

export function getAllMeasures(): Record<string, number> {
  const result: Record<string, number> = {}
  measures.forEach((value, key) => {
    result[key] = value
  })
  return result
}

// Performance budgets (ms)
export const PERFORMANCE_BUDGETS: Record<PerformanceMark, number> = {
  app_start: 2000,
  rescue_screen_ready: 500,
  mission_compile_duration: 300,
  ai_response_latency: 3000,
  fallback_latency: 100,
  live_mission_frame_drops: 16, // 60fps = 16ms per frame
  storage_write_latency: 50,
  graph_compute_latency: 200,
}

export function isWithinBudget(name: PerformanceMark): boolean {
  const actual = getMeasure(name)
  const budget = PERFORMANCE_BUDGETS[name]
  return actual <= budget
}
