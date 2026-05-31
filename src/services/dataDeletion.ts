// ══════════════════════════════════════════════════════════════
// INTENT — Data Deletion Service
// Complete data wipe: MMKV stores, notifications, in-memory state
// ══════════════════════════════════════════════════════════════

// ⚠️ No top-level store imports — use useAppStore.getState() inside functions

// ── Lazy MMKV accessors (cached) ───────────────────────────

let _mainStorage: any = null
let _retentionStorage: any = null
let _widgetStorage: any = null

function getMainStorage() {
  if (!_mainStorage) {
    const { MMKV } = require('react-native-mmkv')
    _mainStorage = new MMKV({ id: 'intent-store' })
  }
  return _mainStorage
}

function getRetentionStorage() {
  if (!_retentionStorage) {
    const { MMKV } = require('react-native-mmkv')
    _retentionStorage = new MMKV({ id: 'intent-retention' })
  }
  return _retentionStorage
}

function getWidgetStorage() {
  if (!_widgetStorage) {
    const { MMKV } = require('react-native-mmkv')
    _widgetStorage = new MMKV({ id: 'intent-widget' })
  }
  return _widgetStorage
}

// ── Delete All Data ─────────────────────────────────────────

/**
 * Performs a complete data deletion:
 * 1. Clears main app MMKV storage
 * 2. Clears retention engine MMKV storage
 * 3. Clears widget MMKV storage (if present)
 * 4. Cancels all scheduled notifications
 * 5. Resets in-memory Zustand store to defaults
 *
 * This is irreversible. Callers should prompt for confirmation
 * and log the action via privacyAudit before calling.
 */
export async function deleteAllData(): Promise<void> {
  // 1. Clear main storage
  try {
    const main = getMainStorage()
    main.clearAll()
  } catch (err) {
    console.warn('[dataDeletion] Failed to clear main storage:', err)
  }

  // 2. Clear retention storage
  try {
    const retention = getRetentionStorage()
    retention.clearAll()
  } catch (err) {
    console.warn('[dataDeletion] Failed to clear retention storage:', err)
  }

  // 3. Clear widget storage (may not exist)
  try {
    const widget = getWidgetStorage()
    widget.clearAll()
  } catch {
    // Widget storage may not be initialised — safe to ignore
  }

  // 4. Cancel all scheduled notifications
  try {
    const Notifications = require('expo-notifications')
    await Notifications.cancelAllScheduledNotificationsAsync()
  } catch (err) {
    console.warn('[dataDeletion] Failed to cancel notifications:', err)
  }

  // 5. Reset in-memory store
  try {
    const { useAppStore } = require('../store')
    useAppStore.getState().resetState()
  } catch (err) {
    console.warn('[dataDeletion] Failed to reset store:', err)
  }
}
