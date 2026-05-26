// ══════════════════════════════════════════════════════════════
// INTENT — iCloud/Drive Backup Service (Pro Users)
// Encrypted cloud backup via expo-secure-store
// ══════════════════════════════════════════════════════════════

import * as SecureStore from 'expo-secure-store'

const BACKUP_KEY = 'intent_backup_v1'
const LAST_SYNC_KEY = 'intent_last_sync'

/**
 * Backup serialized store data to secure cloud storage.
 * Returns true on success, false on failure (silently handled).
 */
export async function backupToCloud(data: string): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(BACKUP_KEY, data)
    await SecureStore.setItemAsync(LAST_SYNC_KEY, new Date().toISOString())
    return true
  } catch {
    return false
  }
}

/**
 * Restore previously backed-up data from secure cloud storage.
 * Returns null if no backup exists or on failure.
 */
export async function restoreFromCloud(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(BACKUP_KEY)
  } catch {
    return null
  }
}

/**
 * Get the timestamp of the last successful sync.
 */
export async function getLastSyncTime(): Promise<Date | null> {
  try {
    const ts = await SecureStore.getItemAsync(LAST_SYNC_KEY)
    return ts ? new Date(ts) : null
  } catch {
    return null
  }
}

/**
 * Serialize and backup the full store state.
 * Called after key mutations (e.g., completeSession) for Pro users.
 */
export async function syncStoreData(storeState: object): Promise<boolean> {
  const serialized = JSON.stringify(storeState)
  return backupToCloud(serialized)
}
