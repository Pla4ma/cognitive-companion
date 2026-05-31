// ══════════════════════════════════════════════════════════════
// INTENT — Store Integrity Checker
// Validates persisted MMKV state on startup and attempts recovery
// ══════════════════════════════════════════════════════════════

import type { AppState } from './index'
import type { MissionSession, Mission, MicroMission } from '../types'
import type { RetentionState } from '../services/retention/retentionEngine'

// ── Validation Result ───────────────────────────────────────

export interface IntegrityResult {
  valid: boolean
  errors: string[]
  repaired: Partial<AppState> | null
}

// ── Type Guards ─────────────────────────────────────────────

function isArray(val: unknown): val is unknown[] {
  return Array.isArray(val)
}

function isString(val: unknown): val is string {
  return typeof val === 'string'
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val)
}

function isValidSessionStatus(s: unknown): s is MissionSession['status'] {
  return s === 'active' || s === 'paused' || s === 'completed' || s === 'salvaged' || s === 'abandoned'
}

// ── Core Validation ─────────────────────────────────────────

/**
 * Validates a deserialized store snapshot for structural integrity.
 * Returns errors found and optional repairs for auto-fixable issues.
 */
export function validateStoreIntegrity(state: unknown): IntegrityResult {
  const errors: string[] = []
  const repaired: Partial<Record<string, unknown>> = {}

  if (!isRecord(state)) {
    return { valid: false, errors: ['Store state is not an object'], repaired: null }
  }

  // ── Array fields ──────────────────────────────────────────
  const requiredArrays = [
    'sessions', 'missions', 'microMissions', 'momentumEvents',
    'resistancePatterns', 'distractions', 'brainDumps',
  ] as const

  for (const key of requiredArrays) {
    if (state[key] !== undefined && !isArray(state[key])) {
      errors.push(`${key} is not an array`)
      repaired[key] = []
    }
  }

  // ── Session integrity ─────────────────────────────────────
  const sessions = state.sessions
  if (isArray(sessions)) {
    const validSessions: MissionSession[] = []
    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i] as Record<string, unknown>
      if (!isRecord(s)) {
        errors.push(`sessions[${i}] is not an object`)
        continue
      }
      const sessionIssues: string[] = []
      if (!isString(s.id)) sessionIssues.push('missing id')
      if (!isString(s.started_at)) sessionIssues.push('missing started_at')
      if (!isValidSessionStatus(s.status)) sessionIssues.push(`invalid status: ${String(s.status)}`)

      if (sessionIssues.length > 0) {
        errors.push(`sessions[${i}] ${sessionIssues.join(', ')}`)
        // Drop invalid sessions rather than corrupt the store
      } else {
        validSessions.push(s as unknown as MissionSession)
      }
    }
    if (validSessions.length !== (sessions as unknown[]).length) {
      repaired.sessions = validSessions
    }
  }

  // ── Mission integrity ─────────────────────────────────────
  const missions = state.missions
  if (isArray(missions)) {
    const validMissions: Mission[] = []
    for (let i = 0; i < missions.length; i++) {
      const m = missions[i] as Record<string, unknown>
      if (!isRecord(m)) {
        errors.push(`missions[${i}] is not an object`)
        continue
      }
      if (!isString(m.id)) {
        errors.push(`missions[${i}] missing id`)
      } else {
        validMissions.push(m as unknown as Mission)
      }
    }
    if (validMissions.length !== (missions as unknown[]).length) {
      repaired.missions = validMissions
    }
  }

  // ── MicroMission orphan check ─────────────────────────────
  const microMissions = state.microMissions
  if (isArray(microMissions) && isArray(missions)) {
    const missionIds = new Set(
      (missions as Record<string, unknown>[])
        .filter((m) => isRecord(m) && isString(m.id))
        .map((m) => m.id as string),
    )
    // MicroMission uses threadId to reference its parent mission
    const orphaned: number[] = []
    for (let i = 0; i < microMissions.length; i++) {
      const mm = microMissions[i] as Record<string, unknown>
      if (!isRecord(mm)) {
        errors.push(`microMissions[${i}] is not an object`)
        continue
      }
      if (!isString(mm.id)) {
        errors.push(`microMissions[${i}] missing id`)
      }
      // threadId can be null (standalone micro-mission) or must reference a valid mission
      if (mm.threadId != null && isString(mm.threadId) && !missionIds.has(mm.threadId)) {
        orphaned.push(i)
      }
    }
    if (orphaned.length > 0) {
      errors.push(`${orphaned.length} orphaned micro-mission(s) with invalid threadId`)
      repaired.microMissions = (microMissions as Record<string, unknown>[])
        .filter((_, i) => !orphaned.includes(i))
    }
  }

  // ── activeSession validity ────────────────────────────────
  const activeSession = state.activeSession as Record<string, unknown> | null | undefined
  if (activeSession != null) {
    if (!isRecord(activeSession)) {
      errors.push('activeSession is not an object')
      repaired.activeSession = null
    } else {
      if (!isString(activeSession.id)) {
        errors.push('activeSession missing id')
        repaired.activeSession = null
      } else if (!isValidSessionStatus(activeSession.status)) {
        errors.push('activeSession has invalid status')
        repaired.activeSession = null
      } else if (isArray(sessions)) {
        // activeSession should also exist in the sessions array or have status 'active'/'paused'
        const status = activeSession.status as string
        if (status !== 'active' && status !== 'paused') {
          errors.push(`activeSession has terminal status '${status}', clearing`)
          repaired.activeSession = null
        }
      }
    }
  }

  // ── retentionState integrity ──────────────────────────────
  const retentionState = state.retentionState as Record<string, unknown> | undefined
  if (retentionState !== undefined) {
    if (!isRecord(retentionState)) {
      errors.push('retentionState is not an object')
      repaired.retentionState = null // Will be re-initialized by store
    } else {
      const requiredFields = ['totalRescues', 'totalSalvages', 'totalComebacks', 'totalAbandons', 'activated']
      for (const field of requiredFields) {
        if (retentionState[field] === undefined) {
          errors.push(`retentionState missing required field: ${field}`)
        }
      }
      // Validate momentumWindows sub-object
      if (!isRecord(retentionState.momentumWindows)) {
        errors.push('retentionState.momentumWindows is not an object')
      }
      // Validate loopsActive sub-object
      if (!isRecord(retentionState.loopsActive)) {
        errors.push('retentionState.loopsActive is not an object')
      }
    }
  }

  const valid = errors.length === 0
  const hasRepairs = Object.keys(repaired).length > 0

  return {
    valid,
    errors,
    repaired: hasRepairs ? repaired as Partial<AppState> : null,
  }
}

// ── Store Recovery ──────────────────────────────────────────

export type RecoveryResult =
  | { status: 'ok' }
  | { status: 'repaired'; errors: string[] }
  | { status: 'wiped'; errors: string[] }

const STORE_KEY = 'intent-storage'

let _storeStorage: any = null

function getStoreStorage() {
  if (!_storeStorage) {
    const { MMKV } = require('react-native-mmkv')
    _storeStorage = new MMKV({ id: 'intent-store' })
  }
  return _storeStorage
}

/**
 * Attempts to read and validate the persisted store from MMKV.
 * If the store is corrupt beyond repair, wipes it so the app can
 * start fresh. Returns a discriminated union describing what happened.
 */
export function attemptStoreRecovery(): RecoveryResult {
  try {
    // Lazy import: MMKV may not be available in test environment
    const storage = getStoreStorage()
    const raw = storage.getString(STORE_KEY)

    if (!raw) {
      // No persisted state — fresh start, nothing to recover
      return { status: 'ok' }
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      // Unparseable JSON — wipe and restart
      console.warn('[integrity] Store JSON is unparseable, wiping')
      storage.delete(STORE_KEY)
      return { status: 'wiped', errors: ['Unparseable JSON'] }
    }

    const result = validateStoreIntegrity(parsed)

    if (result.valid) {
      return { status: 'ok' }
    }

    if (result.repaired) {
      // Apply repairs: merge repaired fields back into the stored JSON
      console.warn('[integrity] Store had issues, applying repairs:', result.errors)
      const repairedState = { ...(parsed as Record<string, unknown>), ...result.repaired }
      storage.set(STORE_KEY, JSON.stringify(repairedState))
      return { status: 'repaired', errors: result.errors }
    }

    // Corrupt and unrepairable — wipe
    console.warn('[integrity] Store corrupt beyond repair, wiping. Errors:', result.errors)
    storage.delete(STORE_KEY)
    return { status: 'wiped', errors: result.errors }
  } catch (err) {
    // MMKV not available or other hard failure — treat as clean start
    console.warn('[integrity] Recovery failed (MMKV unavailable?):', err)
    return { status: 'ok' }
  }
}
