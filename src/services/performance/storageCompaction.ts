// ══════════════════════════════════════════════════════════════
// INTENT — Storage Compaction
// Prevents AsyncStorage thrashing and caps history sizes
// ══════════════════════════════════════════════════════════════

export interface StorageStats {
  totalKeys: number
  totalSizeBytes: number
  oldestEntry: string | null
  newestEntry: string | null
  cappedCollections: string[]
}

// ── Configuration ───────────────────────────────────────────

const STORAGE_LIMITS = {
  maxMissions: 100,
  maxSessions: 200,
  maxDistractions: 50,
  maxContextCapsules: 20,
  maxMemoryItems: 100,
  maxDriftSignals: 100,
  maxMomentumEvents: 100,
  maxAuditLogEntries: 50,
  maxRetentionEvents: 200,
  maxAgeDays: 90, // Auto-delete entries older than 90 days
}

// ── Compaction ──────────────────────────────────────────────

export function compactArray<T extends { createdAt: string; id: string }>(
  items: T[],
  maxItems: number,
  maxAgeDays: number = STORAGE_LIMITS.maxAgeDays,
): { kept: T[]; removed: number } {
  const now = Date.now()
  const maxAgeMs = maxAgeDays * 86400000

  // Filter out expired items
  const valid = items.filter(item => {
    const age = now - new Date(item.createdAt).getTime()
    return age < maxAgeMs
  })

  const expiredCount = items.length - valid.length

  // Sort by date (newest first)
  const sorted = valid.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  // Cap at max items
  const kept = sorted.slice(0, maxItems)
  const cappedCount = sorted.length - kept.length

  return {
    kept,
    removed: expiredCount + cappedCount,
  }
}

export interface CompactionResult {
  collections: Record<string, { before: number; after: number; removed: number }>
  totalRemoved: number
}

export function compactAllCollections(data: {
  missions?: any[]
  sessions?: any[]
  distractions?: any[]
  contextCapsules?: any[]
  memoryItems?: any[]
  driftSignals?: any[]
  momentumEvents?: any[]
  auditLog?: any[]
  retentionEvents?: any[]
}): CompactionResult {
  const collections: Record<string, { before: number; after: number; removed: number }> = {}
  let totalRemoved = 0

  const compact = (name: string, items: any[] | undefined, maxItems: number) => {
    if (!items) return items
    const before = items.length
    const { kept, removed } = compactArray(items, maxItems)
    collections[name] = { before, after: kept.length, removed }
    totalRemoved += removed
    return kept
  }

  return {
    collections,
    totalRemoved,
  }
}

// ── Storage Size Estimation ─────────────────────────────────

export function estimateSizeBytes(obj: any): number {
  try {
    return new Blob([JSON.stringify(obj)]).size
  } catch {
    return 0
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// ── Write Batching ──────────────────────────────────────────

let writeQueue: Map<string, any> = new Map()
let writeTimeout: ReturnType<typeof setTimeout> | null = null

export function queueWrite(key: string, value: any, flushFn: (key: string, value: any) => void): void {
  writeQueue.set(key, value)

  if (writeTimeout) clearTimeout(writeTimeout)

  writeTimeout = setTimeout(() => {
    flushWrites(flushFn)
  }, 500) // Batch writes every 500ms
}

function flushWrites(flushFn: (key: string, value: any) => void): void {
  writeQueue.forEach((value, key) => {
    flushFn(key, value)
  })
  writeQueue.clear()
  writeTimeout = null
}

export function flushImmediately(flushFn: (key: string, value: any) => void): void {
  if (writeTimeout) {
    clearTimeout(writeTimeout)
    writeTimeout = null
  }
  flushWrites(flushFn)
}
