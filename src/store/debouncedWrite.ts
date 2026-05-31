// ══════════════════════════════════════════════════════════════
// INTENT — Debounced MMKV Writes
// Batches rapid storage writes to reduce I/O during high-frequency
// updates (e.g., session timer ticking).
// ══════════════════════════════════════════════════════════════

// ── Pending Write Buffer ────────────────────────────────────

const pendingWrites = new Map<string, string>()
const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>()

// ── Public API ──────────────────────────────────────────────

let _storage: any = null

function getStorage() {
  if (!_storage) {
    const { MMKV } = require('react-native-mmkv')
    _storage = new MMKV({ id: 'intent-store' })
  }
  return _storage
}

/**
 * Batches a storage write for `key` with `value`, debouncing by `delay` ms.
 * If called multiple times for the same key within the delay window,
 * only the last value is written. Uses lazy MMKV import for test compatibility.
 *
 * @param key   - The MMKV storage key
 * @param value - The string value to persist
 * @param delay - Debounce window in ms (default: 100)
 */
export function debouncedWrite(key: string, value: string, delay = 100): void {
  // Buffer the latest value
  pendingWrites.set(key, value)

  // Clear any existing timer for this key
  const existingTimer = pendingTimers.get(key)
  if (existingTimer !== undefined) {
    clearTimeout(existingTimer)
  }

  // Schedule a new write
  const timer = setTimeout(() => {
    pendingTimers.delete(key)
    const pendingValue = pendingWrites.get(key)
    if (pendingValue !== undefined) {
      pendingWrites.delete(key)
      try {
        getStorage().set(key, pendingValue)
      } catch {
        // MMKV not available — silently drop (tests, SSR, etc.)
      }
    }
  }, delay)

  pendingTimers.set(key, timer)
}

/**
 * Flushes all pending writes immediately (synchronous).
 * Useful before app background or when you need guaranteed persistence.
 */
export function flushPendingWrites(): void {
  // Clear all scheduled timers
  for (const timer of pendingTimers.values()) {
    clearTimeout(timer)
  }
  pendingTimers.clear()

  if (pendingWrites.size === 0) return

  try {
    const storage = getStorage()
    for (const [key, value] of pendingWrites) {
      storage.set(key, value)
    }
  } catch {
    // MMKV not available
  }

  pendingWrites.clear()
}

/**
 * Cancels all pending writes without flushing.
 * Discards any buffered values.
 */
export function cancelPendingWrites(): void {
  for (const timer of pendingTimers.values()) {
    clearTimeout(timer)
  }
  pendingTimers.clear()
  pendingWrites.clear()
}

/**
 * Returns the number of pending (not yet flushed) writes.
 * Useful for diagnostics.
 */
export function getPendingWriteCount(): number {
  return pendingWrites.size
}
