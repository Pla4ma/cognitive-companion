// ══════════════════════════════════════════════════════════════
// INTENT — useOfflineCapable Hook
// Subscribes to NetInfo changes for reactive connectivity state
// ══════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback } from 'react'
import { initConnectivity, isOnline } from '../services/connectivity'

// ── Types ────────────────────────────────────────────────────

export interface OfflineCapableState {
  /** Whether the AI coach can respond (requires internet) */
  canUseAI: boolean
  /** Whether the user can start a rescue session (always true) */
  canRescue: boolean
  /** Whether cloud sync can proceed (requires internet) */
  canSync: boolean
  /** Whether the device currently has connectivity */
  isOnline: boolean
  /** Human-readable message for the current offline state */
  offlineMessage: string | null
}

// ── Hook ─────────────────────────────────────────────────────

/**
 * React hook that returns feature availability based on connectivity.
 * Subscribes directly to NetInfo changes via addEventListener.
 *
 * Core rescue loop (state select → compile → timer → complete) always works offline.
 * AI coach is the only feature requiring internet.
 */
export function useOfflineCapable(): OfflineCapableState {
  const [online, setOnline] = useState(isOnline())

  useEffect(() => {
    // Ensure NetInfo listener is running
    initConnectivity()

    // Subscribe directly to NetInfo changes
    let unsubscribe: (() => void) | null = null
    try {
      const NetInfo = require('@react-native-community/netinfo')
      unsubscribe = NetInfo.addEventListener(
        (state: { isConnected: boolean | null; isInternetReachable: boolean | null }) => {
          const connected = state.isConnected === true && state.isInternetReachable !== false
          setOnline(connected)
        },
      )
    } catch {
      // NetInfo not available — use module-level state as fallback
      const interval = setInterval(() => {
        setOnline((prev) => {
          const current = isOnline()
          return prev !== current ? current : prev
        })
      }, 5000)
      return () => clearInterval(interval)
    }

    return () => {
      unsubscribe?.()
    }
  }, [])

  const getOfflineMessage = useCallback((): string | null => {
    if (online) return null
    return "You're offline. Rescue sessions and timers work perfectly — AI coaching will resume when you reconnect."
  }, [online])

  return {
    canUseAI: online,
    canRescue: true, // Always available — core offline feature
    canSync: online,
    isOnline: online,
    offlineMessage: getOfflineMessage(),
  }
}
