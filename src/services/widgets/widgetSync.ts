// ══════════════════════════════════════════════════════════════
// INTENT — Widget Data Sync Service
// Writes key data to shared App Group container for widget access.
// Uses MMKV with shared App Group ID so iOS widgets can read it.
// ══════════════════════════════════════════════════════════════

import { predictDrift } from '../../engine/predictiveEngine'
import { computeMomentumTrend } from '../retention/retentionEngine'
import type { MissionSession, ResistancePattern, MomentumEvent, Mission } from '../../types'
import type { WidgetData } from './widgetTypes'

// ── Lazy MMKV Import ────────────────────────────────────────
// MMKV with a specific ID maps to the shared App Group container
// on iOS, enabling widget extension to read the data.

interface MMKVStorage {
  set(key: string, value: string): void
  getString(key: string): string | undefined
}

let widgetStorage: MMKVStorage | null = null

function getWidgetStorage(): MMKVStorage {
  if (!widgetStorage) {
    try {
      const { MMKV } = require('react-native-mmkv')
      widgetStorage = new MMKV({ id: 'intent-widget' })
    } catch {
      // Fallback for tests / SSR — in-memory store
      const mem = new Map<string, string>()
      widgetStorage = {
        set: (key: string, value: string) => { mem.set(key, value) },
        getString: (key: string) => mem.get(key),
      }
    }
  }
  return widgetStorage
}

// ── Sync State Interface ────────────────────────────────────

export interface WidgetSyncState {
  sessions: MissionSession[]
  patterns: ResistancePattern[]
  momentumEvents: MomentumEvent[]
  missions: Mission[]
  userName?: string
}

// ── Core Sync Function ──────────────────────────────────────

/**
 * Syncs key app data to the shared MMKV container for widget access.
 *
 * Call after:
 *   - Session completion (rescue_completed, rescue_salvaged)
 *   - App foreground (AppState change to 'active')
 *   - Retention event recording
 *
 * Computes:
 *   - currentRiskLevel: from predictDrift()
 *   - weeklyMinutes: sum of actual_minutes from last 7 days of sessions
 *   - nextDangerHour: from next danger window's startHour
 *   - userName: passed through from state
 *   - lastSyncTimestamp: ISO string of now
 *   - momentumTrend: from computeMomentumTrend()
 */
export function syncWidgetData(state: WidgetSyncState): void {
  try {
    const storage = getWidgetStorage()

    // ── Risk level from predictive engine ──
    const prediction = predictDrift({
      sessions: state.sessions,
      patterns: state.patterns,
      momentumEvents: state.momentumEvents,
      missions: state.missions,
    })
    const currentRiskLevel = prediction.currentRiskLevel

    // ── Weekly minutes: sum actual_seconds from last 7 days ──
    const now = Date.now()
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
    const weeklySessions = state.sessions.filter(
      (s) =>
        new Date(s.started_at).getTime() >= sevenDaysAgo &&
        (s.status === 'completed' || s.status === 'salvaged'),
    )
    const weeklyMinutes = Math.round(
      weeklySessions.reduce((sum, s) => sum + (s.actual_seconds || 0), 0) / 60,
    )

    // ── Next danger hour ──
    const nextDangerHour = prediction.nextDangerWindow?.startHour ?? -1

    // ── Momentum trend ──
    const momentumResult = computeMomentumTrend(state.sessions)
    const momentumTrend = momentumResult.trend

    // ── Write to shared storage ──
    const widgetData: WidgetData = {
      riskLevel: currentRiskLevel,
      weeklyMinutes,
      nextDangerHour,
      userName: state.userName ?? '',
      lastSync: new Date().toISOString(),
      momentumTrend,
    }

    storage.set('currentRiskLevel', currentRiskLevel)
    storage.set('weeklyMinutes', String(weeklyMinutes))
    storage.set('nextDangerHour', String(nextDangerHour))
    storage.set('userName', state.userName ?? '')
    storage.set('lastSyncTimestamp', widgetData.lastSync)
    storage.set('momentumTrend', momentumTrend)

    // Also store the full JSON blob for convenience
    storage.set('widgetData', JSON.stringify(widgetData))
  } catch {
    // Widget sync should never crash the app
  }
}

// ── Read Functions ──────────────────────────────────────────
// Useful for debugging or for the app itself to check what
// the widget will display.

export function readWidgetData(): WidgetData | null {
  try {
    const storage = getWidgetStorage()
    const blob = storage.getString('widgetData')
    if (blob) return JSON.parse(blob) as WidgetData
  } catch {
    // ignore
  }
  return null
}

export function getLastSyncTimestamp(): string | null {
  try {
    const storage = getWidgetStorage()
    return storage.getString('lastSyncTimestamp') ?? null
  } catch {
    return null
  }
}
