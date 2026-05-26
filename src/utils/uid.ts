// ══════════════════════════════════════════════════════════════
// Shared UID generator
// Counter-based to avoid Date.now() collisions when multiple
// IDs are generated in the same millisecond.
// ══════════════════════════════════════════════════════════════

let counter = 0

export function uid(): string {
  counter++
  return Date.now().toString(36) + counter.toString(36) + Math.random().toString(36).slice(2, 8)
}
