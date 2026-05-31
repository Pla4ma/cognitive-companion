// ══════════════════════════════════════════════════════════════
// INTENT — Connectivity Service
// Tracks network state and provides offline-capable feature gates
// Core rescue loop works offline; AI coach is the only internet-dependent feature
// ══════════════════════════════════════════════════════════════

// (React imports removed — hook moved to src/hooks/useOfflineCapable.ts)

// ── Module State ────────────────────────────────────────────

let _isOnline = true // Assume online until proven otherwise
let _initialized = false
let _unsubscribe: (() => void) | null = null

// ── Public API ──────────────────────────────────────────────

/**
 * Returns the current connectivity state.
 * Defaults to `true` until initConnectivity() is called.
 */
export function isOnline(): boolean {
  return _isOnline
}

/**
 * Initializes the connectivity listener using @react-native-community/netinfo.
 * Safe to call multiple times (idempotent). Uses lazy import so tests
 * don't require the native module.
 */
export function initConnectivity(): void {
  if (_initialized) return
  _initialized = true

  try {
    // Lazy import — native module may not be available in test/web
    const NetInfo = require('@react-native-community/netinfo')

    // Set initial state
    NetInfo.fetch().then((state: { isConnected: boolean | null; isInternetReachable: boolean | null }) => {
      _isOnline = state.isConnected === true && state.isInternetReachable !== false
    }).catch(() => {
      // If fetch fails, assume online
      _isOnline = true
    })

    // Subscribe to changes
    _unsubscribe = NetInfo.addEventListener(
      (state: { isConnected: boolean | null; isInternetReachable: boolean | null }) => {
        _isOnline = state.isConnected === true && state.isInternetReachable !== false
      },
    )
  } catch {
    // NetInfo not available — assume always online (web, tests, etc.)
    _isOnline = true
  }
}

/**
 * Tears down the connectivity listener. Useful for cleanup.
 */
export function destroyConnectivity(): void {
  if (_unsubscribe) {
    _unsubscribe()
    _unsubscribe = null
  }
  _initialized = false
  _isOnline = true
}

// ── React Hook ──────────────────────────────────────────────

// The useOfflineCapable hook has been moved to src/hooks/useOfflineCapable.ts
// for proper separation of concerns (event-driven, no polling).
