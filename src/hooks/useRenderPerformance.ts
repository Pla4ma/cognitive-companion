// ══════════════════════════════════════════════════════════════
// INTENT — useRenderPerformance
// Dev-only render timing hook; no-op in production
// ══════════════════════════════════════════════════════════════

import { useRef, useEffect } from 'react'

const RENDER_BUDGET_MS = 16 // 60 fps target

/**
 * Logs render time for a component in dev mode.
 * Warns if a single render exceeds the 16 ms frame budget.
 * Completely silent (no-op) in production builds.
 */
export function useRenderPerformance(componentName: string): void {
  const renderStart = useRef(0)

  // Record start time before each render
  // Using a ref set in the render body (before effects) gives us
  // the timestamp at the beginning of the current render cycle.
  renderStart.current = performance.now()

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!__DEV__) return
    const duration = performance.now() - renderStart.current
    if (duration > RENDER_BUDGET_MS) {
      console.warn(
        `⚠️ [Perf] ${componentName} render took ${duration.toFixed(2)} ms (budget: ${RENDER_BUDGET_MS} ms)`,
      )
    }
  })
}
