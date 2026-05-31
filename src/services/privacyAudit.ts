// ══════════════════════════════════════════════════════════════
// INTENT — Privacy Audit Trail
// Append-only log of privacy-relevant user actions
// ══════════════════════════════════════════════════════════════

// ── Types ───────────────────────────────────────────────────

export type PrivacyAuditAction =
  | 'consent_granted'
  | 'consent_revoked'
  | 'data_exported'
  | 'data_deleted'
  | 'data_shared'

export interface PrivacyAuditEntry {
  timestamp: string
  action: PrivacyAuditAction
  detail: string
  source: string
}

// ── Constants ───────────────────────────────────────────────

const AUDIT_LOG_KEY = 'privacy-audit-log'
const MAX_ENTRIES = 200

// ── Lazy MMKV accessor (cached) ───────────────────────────

let _storage: any = null

function getStorage() {
  if (!_storage) {
    const { MMKV } = require('react-native-mmkv')
    _storage = new MMKV({ id: 'intent-store' })
  }
  return _storage
}

// ── Read audit log ──────────────────────────────────────────

/**
 * Returns the full privacy audit log, newest entries last.
 * Returns an empty array if no log exists yet.
 */
export function getPrivacyAuditLog(): PrivacyAuditEntry[] {
  try {
    const storage = getStorage()
    const raw = storage.getString(AUDIT_LOG_KEY)
    if (!raw) return []
    return JSON.parse(raw) as PrivacyAuditEntry[]
  } catch {
    return []
  }
}

// ── Append to audit log ─────────────────────────────────────

/**
 * Appends a new entry to the privacy audit log.
 * Trims to the most recent MAX_ENTRIES (200) if the limit is exceeded.
 */
export function appendPrivacyAudit(entry: Omit<PrivacyAuditEntry, 'timestamp'>): void {
  const log = getPrivacyAuditLog()

  const fullEntry: PrivacyAuditEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  }

  log.push(fullEntry)

  // Trim oldest entries if over the cap
  const trimmed = log.length > MAX_ENTRIES ? log.slice(log.length - MAX_ENTRIES) : log

  try {
    const storage = getStorage()
    storage.set(AUDIT_LOG_KEY, JSON.stringify(trimmed))
  } catch (err) {
    console.warn('[privacyAudit] Failed to write audit log:', err)
  }
}
