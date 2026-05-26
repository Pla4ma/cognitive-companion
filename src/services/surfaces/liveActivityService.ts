// ══════════════════════════════════════════════════════════════
// INTENT — Live Activity Service
// Manages iOS Live Activities for focus sessions, rescue missions,
// and body double sessions. Consent-gated.
// ══════════════════════════════════════════════════════════════

import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  checkPermission,
  type ConsentLedger,
  type PermissionCheck,
} from '../consent'
import type { UserProfile } from '../../types'
import type {
  LiveActivityState,
} from '../../types/systemSurface'
import type {
  LiveActivityType,
  LiveActivityOutcome,
  LiveActivityProgress,
  LiveActivityStartRequest,
  LiveActivityUpdateRequest,
  LiveActivityEndRequest,
  ActiveLiveActivity,
  LiveActivityBridgeModule,
} from '../../types/surfaces'

// ── Storage Keys ────────────────────────────────────────────

const ACTIVE_ACTIVITIES_KEY = 'intent-active-live-activities'
const ACTIVITY_HISTORY_KEY = 'intent-activity-history'

// ── Native Bridge ───────────────────────────────────────────

let activityBridge: LiveActivityBridgeModule | null = null

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { requireNativeModule } = require('expo-modules-core')
  activityBridge = requireNativeModule('IntentLiveActivity') as LiveActivityBridgeModule
} catch {
  // Not available in Expo Go
}

// ── Activity Type Configs ───────────────────────────────────

interface ActivityTypeConfig {
  type: LiveActivityType
  label: string
  defaultActions: LiveActivityState['availableActions']
}

const ACTIVITY_CONFIGS: Record<LiveActivityType, ActivityTypeConfig> = {
  focus_session: {
    type: 'focus_session',
    label: 'Focus Session',
    defaultActions: ['done', 'salvage', 'capture_distraction', 'smaller', 'stuck'],
  },
  rescue_mission: {
    type: 'rescue_mission',
    label: 'Rescue Mission',
    defaultActions: ['done', 'salvage', 'capture_distraction', 'smaller', 'stuck'],
  },
  body_double: {
    type: 'body_double',
    label: 'Body Double',
    defaultActions: ['done', 'capture_distraction', 'stuck'],
  },
}

// ── Consent Check ───────────────────────────────────────────

export function checkLiveActivityConsent(
  ledger: ConsentLedger,
  user: UserProfile | null,
): PermissionCheck {
  return checkPermission('live_activity_data', ledger, user)
}

// ── Active Activity Tracking ────────────────────────────────

async function getActiveActivities(): Promise<ActiveLiveActivity[]> {
  try {
    const stored = await AsyncStorage.getItem(ACTIVE_ACTIVITIES_KEY)
    if (stored) return JSON.parse(stored) as ActiveLiveActivity[]
  } catch {
    // Fall through
  }
  return []
}

async function saveActiveActivities(activities: ActiveLiveActivity[]): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_ACTIVITIES_KEY, JSON.stringify(activities))
}

// ── Main API ────────────────────────────────────────────────

/**
 * Start a new Live Activity for a mission.
 * Returns the activity ID if successful, null if consent denied or unavailable.
 */
export async function startActivity(
  type: LiveActivityType,
  request: Omit<LiveActivityStartRequest, 'type'>,
  ledger: ConsentLedger,
  user: UserProfile | null,
): Promise<string | null> {
  const consent = checkLiveActivityConsent(ledger, user)
  if (!consent.permitted) return null

  // Only one active activity at a time
  const existing = await getActiveActivities()
  if (existing.length > 0) {
    // End existing activity first
    await endActivity(existing[0].id, 'abandoned', ledger, user)
  }

  const config = ACTIVITY_CONFIGS[type]
  const activityId = generateActivityId()

  const initialState: LiveActivityState = {
    missionTitle: request.missionTitle,
    exactAction: request.exactAction,
    timerTotal: request.totalDuration,
    timerRemaining: request.totalDuration,
    state: 'active',
    availableActions: config.defaultActions,
  }

  const activity: ActiveLiveActivity = {
    id: activityId,
    type,
    missionId: request.missionId,
    startedAt: new Date().toISOString(),
    state: initialState,
  }

  // Persist locally
  await saveActiveActivities([activity])

  // Notify native bridge if available
  if (activityBridge) {
    try {
      const startRequest: LiveActivityStartRequest = {
        type,
        missionId: request.missionId,
        missionTitle: request.missionTitle,
        exactAction: request.exactAction,
        totalDuration: request.totalDuration,
      }
      await activityBridge.startActivity(startRequest)
    } catch {
      // Native bridge failed — data still tracked locally
    }
  }

  return activityId
}

/**
 * Update an active Live Activity with current progress.
 * Called by the timer service on tick / state change.
 */
export async function updateActivity(
  activityId: string,
  progress: LiveActivityProgress,
  ledger: ConsentLedger,
  user: UserProfile | null,
): Promise<boolean> {
  const consent = checkLiveActivityConsent(ledger, user)
  if (!consent.permitted) return false

  const activities = await getActiveActivities()
  const activity = activities.find(a => a.id === activityId)
  if (!activity) return false

  // Update state
  activity.state = {
    ...activity.state,
    timerRemaining: progress.remaining,
    state: progress.state,
  }

  await saveActiveActivities(activities)

  // Notify native bridge
  if (activityBridge) {
    try {
      await activityBridge.updateActivity(activityId, {
        missionId: activity.missionId,
        exactAction: activity.state.exactAction,
        remaining: progress.remaining,
        elapsed: progress.elapsed,
        state: progress.state,
      })
    } catch {
      // Silent fail
    }
  }

  return true
}

/**
 * End a Live Activity with a result.
 * Removes from active list and archives to history.
 */
export async function endActivity(
  activityId: string,
  outcome: LiveActivityOutcome,
  ledger: ConsentLedger,
  user: UserProfile | null,
): Promise<boolean> {
  const consent = checkLiveActivityConsent(ledger, user)
  if (!consent.permitted) return false

  const activities = await getActiveActivities()
  const activityIndex = activities.findIndex(a => a.id === activityId)
  if (activityIndex === -1) return false

  const activity = activities[activityIndex]

  // Map outcome to state
  const stateMap: Record<LiveActivityOutcome, LiveActivityState['state']> = {
    completed: 'completed',
    salvaged: 'salvaged',
    abandoned: 'completed',
    timed_out: 'completed',
  }

  const finalState: LiveActivityState = {
    ...activity.state,
    state: stateMap[outcome],
    timerRemaining: 0,
    availableActions: [],
  }

  // Remove from active
  activities.splice(activityIndex, 1)
  await saveActiveActivities(activities)

  // Archive to history
  await archiveActivity(activity, outcome)

  // Notify native bridge
  if (activityBridge) {
    try {
      await activityBridge.endActivity(activityId, {
        state: finalState.state,
        outcome,
      })
    } catch {
      // Silent fail
    }
  }

  return true
}

/**
 * Get the current active activity, if any.
 */
export async function getActiveActivity(): Promise<ActiveLiveActivity | null> {
  const activities = await getActiveActivities()
  return activities[0] ?? null
}

/**
 * Check if native Live Activity bridge is available.
 */
export async function isLiveActivityAvailable(): Promise<boolean> {
  if (!activityBridge) return false
  try {
    return await activityBridge.isAvailable()
  } catch {
    return false
  }
}

// ── History ─────────────────────────────────────────────────

interface ActivityHistoryEntry {
  activity: ActiveLiveActivity
  outcome: LiveActivityOutcome
  endedAt: string
  durationSeconds: number
}

async function archiveActivity(
  activity: ActiveLiveActivity,
  outcome: LiveActivityOutcome,
): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(ACTIVITY_HISTORY_KEY)
    const history: ActivityHistoryEntry[] = stored ? JSON.parse(stored) : []

    const elapsed = Math.floor(
      (Date.now() - new Date(activity.startedAt).getTime()) / 1000,
    )

    history.push({
      activity,
      outcome,
      endedAt: new Date().toISOString(),
      durationSeconds: elapsed,
    })

    // Keep last 50 entries
    const trimmed = history.slice(-50)
    await AsyncStorage.setItem(ACTIVITY_HISTORY_KEY, JSON.stringify(trimmed))
  } catch {
    // Silent fail — history is non-critical
  }
}

/**
 * Get recent activity history for display/insights.
 */
export async function getActivityHistory(
  limit = 10,
): Promise<ActivityHistoryEntry[]> {
  try {
    const stored = await AsyncStorage.getItem(ACTIVITY_HISTORY_KEY)
    if (stored) {
      const history: ActivityHistoryEntry[] = JSON.parse(stored)
      return history.slice(-limit).reverse()
    }
  } catch {
    // Fall through
  }
  return []
}

// ── Helpers ─────────────────────────────────────────────────

function generateActivityId(): string {
  return 'la_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
