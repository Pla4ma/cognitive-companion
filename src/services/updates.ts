// ══════════════════════════════════════════════════════════════
// INTENT — OTA Updates Service
// Silently checks for and fetches OTA updates via expo-updates
// ══════════════════════════════════════════════════════════════

import * as Updates from 'expo-updates'

export async function checkForUpdates(): Promise<void> {
  if (!Updates.isEnabled) return
  try {
    const update = await Updates.checkForUpdateAsync()
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync()
    }
  } catch { /* non-fatal */ }
}
