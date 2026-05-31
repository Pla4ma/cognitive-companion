// ══════════════════════════════════════════════════════════════
// INTENT — Live Activity Service (Dynamic Island + Lock Screen)
// Shows focus session progress in the Dynamic Island and lock screen.
// Uses expo-live-activities when available, falls back to no-op.
// ══════════════════════════════════════════════════════════════

// ── Lazy Module Import ──────────────────────────────────────

let liveActivitiesModule: Record<string, (...args: unknown[]) => Promise<void>> | null = null
let liveActivitiesChecked = false

function getLiveActivities(): typeof liveActivitiesModule {
  if (!liveActivitiesChecked) {
    liveActivitiesChecked = true
    try {
      liveActivitiesModule = require('expo-live-activities')
    } catch {
      liveActivitiesModule = null
    }
  }
  return liveActivitiesModule
}

// ── Types ───────────────────────────────────────────────────

export interface FocusLiveActivityState {
  minutesRemaining: number
  totalMinutes: number
  mission: string
  status: 'active' | 'paused' | 'almost_done' | 'completed'
}

// ── Live Activity Functions ─────────────────────────────────

let currentActivityId: string | null = null

/**
 * Starts a Live Activity for a focus session.
 * Shows in Dynamic Island and on the lock screen.
 *
 * @param minutes - Total session duration in minutes
 * @param mission - Mission title or description to display
 */
export async function startFocusLiveActivity(
  minutes: number,
  mission: string,
): Promise<void> {
  const mod = getLiveActivities()
  if (!mod?.startLiveActivity) return

  try {
    const state: FocusLiveActivityState = {
      minutesRemaining: minutes,
      totalMinutes: minutes,
      mission,
      status: 'active',
    }

    const result = await mod.startLiveActivity(state)
    currentActivityId = typeof result === 'string' ? result : null
  } catch {
    // Live Activity not supported or permission denied — silent fail
  }
}

/**
 * Updates the Live Activity with current session state.
 *
 * @param minutesRemaining - Minutes left in the session
 * @param status - Current session status
 */
export async function updateLiveActivity(
  minutesRemaining: number,
  status: FocusLiveActivityState['status'] = 'active',
): Promise<void> {
  const mod = getLiveActivities()
  if (!mod?.updateLiveActivity) return

  try {
    const state: Partial<FocusLiveActivityState> = {
      minutesRemaining,
      status,
    }

    if (currentActivityId) {
      await mod.updateLiveActivity(currentActivityId, state)
    } else {
      await mod.updateLiveActivity(state)
    }
  } catch {
    // Silent fail
  }
}

/**
 * Ends the current Live Activity.
 * Called when the session completes, is abandoned, or is salvaged.
 */
export async function endLiveActivity(): Promise<void> {
  const mod = getLiveActivities()
  if (!mod?.endLiveActivity) return

  try {
    if (currentActivityId) {
      await mod.endLiveActivity(currentActivityId)
    } else {
      await mod.endLiveActivity()
    }
  } catch {
    // Silent fail
  } finally {
    currentActivityId = null
  }
}

/**
 * Checks if Live Activities are supported on this device.
 */
export function isLiveActivitySupported(): boolean {
  const mod = getLiveActivities()
  return mod?.startLiveActivity !== undefined
}
