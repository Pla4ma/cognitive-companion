// ══════════════════════════════════════════════════════════════
// INTENT — Render Tracking
// Detects unnecessary re-renders in Zustand selectors
// ══════════════════════════════════════════════════════════════

interface RenderRecord {
  componentName: string
  timestamp: number
  renderCount: number
  durationMs: number
}

const renderLog = new Map<string, RenderRecord>()

export function trackRender(componentName: string): void {
  const existing = renderLog.get(componentName)
  if (existing) {
    existing.renderCount += 1
    existing.timestamp = Date.now()
  } else {
    renderLog.set(componentName, {
      componentName,
      timestamp: Date.now(),
      renderCount: 1,
      durationMs: 0,
    })
  }
}

export function trackRenderDuration(componentName: string, durationMs: number): void {
  const existing = renderLog.get(componentName)
  if (existing) {
    existing.durationMs = durationMs
    existing.timestamp = Date.now()
  }
}

export function getRenderLog(): RenderRecord[] {
  return Array.from(renderLog.values()).sort((a, b) => b.renderCount - a.renderCount)
}

export function getExcessiveRenders(threshold: number = 10): RenderRecord[] {
  return getRenderLog().filter(r => r.renderCount > threshold)
}

export function clearRenderLog(): void {
  renderLog.clear()
}

// ── Re-render Storm Detection ───────────────────────────────

let frameRenderCount = 0
let frameStartTime = 0
const STORM_THRESHOLD = 5

export function detectRenderStorm(): { isStorm: boolean; count: number } {
  const now = Date.now()

  if (now - frameStartTime > 16) {
    frameStartTime = now
    frameRenderCount = 1
    return { isStorm: false, count: 1 }
  }

  frameRenderCount += 1
  return { isStorm: frameRenderCount > STORM_THRESHOLD, count: frameRenderCount }
}

export function resetFrameCounter(): void {
  frameRenderCount = 0
  frameStartTime = Date.now()
}
