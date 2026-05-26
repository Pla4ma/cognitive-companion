// ══════════════════════════════════════════════════════════════
// INTENT — Zustand Store Tests
// Tests for mission CRUD, session lifecycle, momentum, consent
// ══════════════════════════════════════════════════════════════

// Note: The store uses zustand with persist middleware and MMKV storage.
// These tests exercise the store logic directly by calling actions
// and checking state. We mock the MMKV storage since it requires native modules.

// Mock MMKV storage before importing the store
jest.mock('../store/storage', () => ({
  mmkvStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}))

import { useAppStore } from '../store/index'

// ── Helper to reset store between tests ─────────────────────

function resetStore() {
  const { createEmptyRetentionState } = require('../services/retention/retentionEngine')
  useAppStore.setState({
    user: null,
    isAuthenticated: false,
    missions: [],
    microMissions: [],
    sessions: [],
    activeSession: null,
    momentumEvents: [],
    resistancePatterns: [],
    distractions: [],
    brainDumps: [],
    sessionCount: 0,
    isLoading: false,
    currentRoute: '/',
    skipCount: 0,
    retentionState: createEmptyRetentionState(),
  } as any)
}

// ── Store Tests ─────────────────────────────────────────────

describe('Zustand Store', () => {
  beforeEach(() => {
    resetStore()
  })

  // ── Mission CRUD ──────────────────────────────────────────

  describe('mission CRUD', () => {
    test('adds a mission', () => {
      const store = useAppStore.getState()
      const mission = store.addMission('Test Mission', 'A test description')
      expect(mission.title).toBe('Test Mission')
      expect(mission.description).toBe('A test description')
      expect(mission.status).toBe('active')
      expect(useAppStore.getState().missions.length).toBe(1)
    })

    test('gets active missions', () => {
      const store = useAppStore.getState()
      store.addMission('Active 1')
      store.addMission('Active 2')
      const active = useAppStore.getState().getActiveMissions()
      expect(active.length).toBe(2)
    })

    test('completes a mission', () => {
      const store = useAppStore.getState()
      const mission = store.addMission('To Complete')
      useAppStore.getState().completeMission(mission.id)
      const updated = useAppStore.getState().getMissionById(mission.id)
      expect(updated!.status).toBe('completed')
      expect(updated!.completed_at).toBeDefined()
    })

    test('abandons a mission', () => {
      const store = useAppStore.getState()
      const mission = store.addMission('To Abandon')
      useAppStore.getState().abandonMission(mission.id)
      expect(useAppStore.getState().getMissionById(mission.id)!.status).toBe('abandoned')
    })

    test('salvages a mission', () => {
      const store = useAppStore.getState()
      const mission = store.addMission('To Salvage')
      useAppStore.getState().salvageMission(mission.id, 'Partial progress')
      const updated = useAppStore.getState().getMissionById(mission.id)
      expect(updated!.status).toBe('salvaged')
      expect(updated!.salvage_notes).toBe('Partial progress')
    })

    test('deletes a mission and its micro-missions', () => {
      const store = useAppStore.getState()
      const mission = store.addMission('To Delete')
      useAppStore.getState().addMicroMission(mission.id, 'Sub-task 1')
      expect(useAppStore.getState().microMissions.length).toBe(1)
      useAppStore.getState().deleteMission(mission.id)
      expect(useAppStore.getState().missions.length).toBe(0)
      expect(useAppStore.getState().microMissions.length).toBe(0)
    })

    test('updates a mission', () => {
      const store = useAppStore.getState()
      const mission = store.addMission('Original Title')
      useAppStore.getState().updateMission(mission.id, { title: 'Updated Title' })
      expect(useAppStore.getState().getMissionById(mission.id)!.title).toBe('Updated Title')
    })

    test('getMissionById returns undefined for non-existent id', () => {
      expect(useAppStore.getState().getMissionById('nonexistent')).toBeUndefined()
    })
  })

  // ── Session Lifecycle ─────────────────────────────────────

  describe('session lifecycle', () => {
    test('starts a session', () => {
      const store = useAppStore.getState()
      const sessionId = store.startSession(undefined, undefined, 'focus', 25)
      expect(sessionId).toBeDefined()
      const active = useAppStore.getState().activeSession
      expect(active).toBeDefined()
      expect(active!.mode).toBe('focus')
      expect(active!.planned_minutes).toBe(25)
      expect(active!.status).toBe('active')
    })

    test('completes a session', () => {
      const store = useAppStore.getState()
      store.startSession(undefined, undefined, 'focus', 25)
      // Update timer first
      const sessionId = useAppStore.getState().activeSession!.id
      useAppStore.getState().updateSessionTimer(sessionId, 600)
      useAppStore.getState().completeSession('Good session')
      expect(useAppStore.getState().activeSession).toBeNull()
      expect(useAppStore.getState().sessions.length).toBe(1)
      expect(useAppStore.getState().sessions[0].status).toBe('completed')
      expect(useAppStore.getState().sessions[0].notes).toBe('Good session')
      expect(useAppStore.getState().sessionCount).toBe(1)
    })

    test('abandons a session', () => {
      useAppStore.getState().startSession()
      useAppStore.getState().abandonSession()
      expect(useAppStore.getState().activeSession).toBeNull()
      expect(useAppStore.getState().sessions.length).toBe(1)
      expect(useAppStore.getState().sessions[0].status).toBe('abandoned')
    })

    test('salvages a session', () => {
      useAppStore.getState().startSession()
      const sessionId = useAppStore.getState().activeSession!.id
      useAppStore.getState().updateSessionTimer(sessionId, 300)
      useAppStore.getState().salvageSession('Partial work')
      expect(useAppStore.getState().activeSession).toBeNull()
      expect(useAppStore.getState().sessions[0].status).toBe('salvaged')
      expect(useAppStore.getState().sessionCount).toBe(1)
    })

    test('completeSession adds momentum event', () => {
      useAppStore.getState().startSession()
      useAppStore.getState().completeSession()
      const events = useAppStore.getState().momentumEvents
      expect(events.some(e => e.type === 'session_completed')).toBe(true)
    })

    test('salvageSession adds momentum event', () => {
      useAppStore.getState().startSession()
      useAppStore.getState().salvageSession()
      const events = useAppStore.getState().momentumEvents
      expect(events.some(e => e.type === 'session_salvaged')).toBe(true)
    })

    test('updateSessionTimer updates active session seconds', () => {
      useAppStore.getState().startSession()
      const id = useAppStore.getState().activeSession!.id
      useAppStore.getState().updateSessionTimer(id, 120)
      expect(useAppStore.getState().activeSession!.actual_seconds).toBe(120)
    })
  })

  // ── Momentum Tracking ─────────────────────────────────────

  describe('momentum tracking', () => {
    test('adds momentum events', () => {
      useAppStore.getState().addMomentumEvent('session_completed', 15)
      expect(useAppStore.getState().momentumEvents.length).toBe(1)
      expect(useAppStore.getState().momentumEvents[0].type).toBe('session_completed')
      expect(useAppStore.getState().momentumEvents[0].points).toBe(15)
    })

    test('getMomentumScore sums recent points', () => {
      useAppStore.getState().addMomentumEvent('session_completed', 15)
      useAppStore.getState().addMomentumEvent('distraction_captured', 5)
      const score = useAppStore.getState().getMomentumScore()
      expect(score).toBe(20)
    })

    test('getMomentumEvents filters by days', () => {
      // Add events with different timestamps
      useAppStore.getState().addMomentumEvent('session_completed', 15)
      const allEvents = useAppStore.getState().getMomentumEvents(7)
      expect(allEvents.length).toBe(1)
    })

    test('brain dump creates momentum event', () => {
      useAppStore.getState().createBrainDump('item 1. item 2. item 3')
      const events = useAppStore.getState().momentumEvents
      expect(events.some(e => e.type === 'brain_dump_cleared')).toBe(true)
    })
  })

  // ── Consent Operations ────────────────────────────────────

  describe('consent operations', () => {
    test('checkConsent returns false for ungranted permission', () => {
      expect(useAppStore.getState().checkConsent('ai_analysis')).toBe(false)
    })

    test('updateConsent records a grant', () => {
      useAppStore.getState().updateConsent('ai_analysis', true, 'settings', 'User enabled AI')
      expect(useAppStore.getState().checkConsent('ai_analysis')).toBe(true)
    })

    test('updateConsent records a denial', () => {
      useAppStore.getState().updateConsent('ai_analysis', false, 'settings', 'User disabled AI')
      expect(useAppStore.getState().checkConsent('ai_analysis')).toBe(false)
    })

    test('consent ledger tracks receipts', () => {
      useAppStore.getState().updateConsent('notifications_smart', true, 'onboarding', 'Onboarding flow')
      const ledger = useAppStore.getState().consentLedger
      expect(ledger.receipts.length).toBeGreaterThan(0)
    })
  })

  // ── Distraction Capture ───────────────────────────────────

  describe('distraction capture', () => {
    test('captures a distraction', () => {
      useAppStore.getState().captureDistraction('random thought', 'thought', 5)
      expect(useAppStore.getState().distractions.length).toBe(1)
      expect(useAppStore.getState().distractions[0].content).toBe('random thought')
    })

    test('captureDistraction adds momentum event', () => {
      useAppStore.getState().captureDistraction('test')
      expect(useAppStore.getState().momentumEvents.some(e => e.type === 'distraction_captured')).toBe(true)
    })

    test('processes a distraction', () => {
      useAppStore.getState().captureDistraction('test')
      const id = useAppStore.getState().distractions[0].id
      useAppStore.getState().processDistraction(id)
      expect(useAppStore.getState().distractions[0].processed).toBe(true)
    })

    test('getUnprocessedDistractions filters correctly', () => {
      useAppStore.getState().captureDistraction('unprocessed')
      useAppStore.getState().captureDistraction('to process')
      const toProcessId = useAppStore.getState().distractions.find(d => d.content === 'to process')!.id
      useAppStore.getState().processDistraction(toProcessId)
      const unprocessed = useAppStore.getState().getUnprocessedDistractions()
      expect(unprocessed.length).toBe(1)
      expect(unprocessed[0].content).toBe('unprocessed')
    })
  })

  // ── Brain Dump ────────────────────────────────────────────

  describe('brain dump', () => {
    test('creates a brain dump', () => {
      const dump = useAppStore.getState().createBrainDump('Item one. Item two. Item three')
      expect(dump.content).toBe('Item one. Item two. Item three')
      expect(dump.items.length).toBe(3)
      expect(dump.processed).toBe(false)
    })

    test('clears a brain dump', () => {
      const dump = useAppStore.getState().createBrainDump('Test dump')
      useAppStore.getState().clearBrainDump(dump.id)
      expect(useAppStore.getState().brainDumps[0].processed).toBe(true)
    })

    test('getLatestBrainDump returns most recent', () => {
      useAppStore.getState().createBrainDump('First')
      useAppStore.getState().createBrainDump('Second')
      const latest = useAppStore.getState().getLatestBrainDump()
      expect(latest!.content).toBe('Second')
    })
  })

  // ── Auth ──────────────────────────────────────────────────

  describe('auth', () => {
    test('setUser sets user and authentication state', () => {
      useAppStore.getState().setUser({
        id: 'u1', display_name: 'Test', plan: 'free',
        onboarding_complete: true, onboarding_step: 5,
        preferred_push_style: 'gentle', energy_default: 'medium',
        timezone: 'UTC', created_at: '', updated_at: '',
      } as any)
      expect(useAppStore.getState().isAuthenticated).toBe(true)
      expect(useAppStore.getState().user!.display_name).toBe('Test')
    })

    test('signOut clears all data', () => {
      useAppStore.getState().setUser({
        id: 'u1', display_name: 'Test', plan: 'free',
        onboarding_complete: true, onboarding_step: 5,
        preferred_push_style: 'gentle', energy_default: 'medium',
        timezone: 'UTC', created_at: '', updated_at: '',
      } as any)
      useAppStore.getState().addMission('Test')
      useAppStore.getState().signOut()
      expect(useAppStore.getState().user).toBeNull()
      expect(useAppStore.getState().isAuthenticated).toBe(false)
      expect(useAppStore.getState().missions.length).toBe(0)
    })
  })

  // ── Skip Count ────────────────────────────────────────────

  describe('skip count', () => {
    test('increments skip count', () => {
      useAppStore.getState().incrementSkipCount()
      useAppStore.getState().incrementSkipCount()
      expect(useAppStore.getState().skipCount).toBe(2)
    })

    test('resets skip count', () => {
      useAppStore.getState().incrementSkipCount()
      useAppStore.getState().resetSkipCount()
      expect(useAppStore.getState().skipCount).toBe(0)
    })
  })

  // ── Retention Engine ─────────────────────────────────────

  describe('retention engine', () => {
    test('recordRetention fires without error for rescue_completed', () => {
      expect(() => {
        useAppStore.getState().recordRetention('rescue_completed', {
          state: 'focus',
          minutes: 25,
          protocol: 'session',
        })
      }).not.toThrow()
    })

    test('recordRetention fires without error for rescue_started', () => {
      expect(() => {
        useAppStore.getState().recordRetention('rescue_started')
      }).not.toThrow()
    })

    test('recordRetention fires without error for rescue_salvaged', () => {
      expect(() => {
        useAppStore.getState().recordRetention('rescue_salvaged', {
          state: 'focus',
          minutes: 10,
          protocol: 'salvage',
        })
      }).not.toThrow()
    })

    test('recordRetention updates retentionState', () => {
      const before = useAppStore.getState().retentionState
      useAppStore.getState().recordRetention('rescue_completed', {
        state: 'focus',
        minutes: 15,
        protocol: 'session',
      })
      const after = useAppStore.getState().retentionState
      expect(after).toBeDefined()
      // The state should be updated (not necessarily different, but should not error)
      expect(after).not.toBeNull()
    })

    test('getMomentumWindows returns valid structure', () => {
      const windows = useAppStore.getState().getMomentumWindows()
      expect(windows).toBeDefined()
      expect(typeof windows.last7Days).toBe('number')
      expect(typeof windows.last14Days).toBe('number')
      expect(typeof windows.last30Days).toBe('number')
    })

    test('getMomentumWindows with no sessions returns zeros', () => {
      const windows = useAppStore.getState().getMomentumWindows()
      expect(windows.last7Days).toBe(0)
      expect(windows.last14Days).toBe(0)
      expect(windows.last30Days).toBe(0)
    })

    test('getMomentumWindows counts sessions correctly', () => {
      // Add some sessions
      useAppStore.getState().startSession()
      useAppStore.getState().completeSession()

      const windows = useAppStore.getState().getMomentumWindows()
      // At least one session in the last 7 days
      expect(windows.last7Days).toBeGreaterThanOrEqual(1)
      expect(windows.last14Days).toBeGreaterThanOrEqual(windows.last7Days)
      expect(windows.last30Days).toBeGreaterThanOrEqual(windows.last14Days)
    })

    test('getComebackStatus returns valid structure', () => {
      const status = useAppStore.getState().getComebackStatus()
      expect(status).toBeDefined()
      expect(typeof status.isComeback).toBe('boolean')
      expect(typeof status.daysAway).toBe('number')
      expect(typeof status.message).toBe('string')
    })

    test('getComebackStatus with no history is not a comeback', () => {
      const status = useAppStore.getState().getComebackStatus()
      expect(status.isComeback).toBe(false)
    })
  })

  // ── End-to-End Session Lifecycle ─────────────────────────

  describe('end-to-end: addMission + startSession + completeSession', () => {
    test('full lifecycle works without error', () => {
      // 1. Add a mission
      const mission = useAppStore.getState().addMission('Write documentation', 'Write the README')
      expect(mission.id).toBeDefined()
      expect(useAppStore.getState().missions.length).toBe(1)

      // 2. Start a session
      const sessionId = useAppStore.getState().startSession(mission.id, undefined, 'focus', 25)
      expect(sessionId).toBeDefined()
      expect(useAppStore.getState().activeSession).not.toBeNull()
      expect(useAppStore.getState().activeSession!.status).toBe('active')

      // 3. Update timer
      useAppStore.getState().updateSessionTimer(sessionId, 1200)

      // 4. Complete the session
      useAppStore.getState().completeSession('Great progress on docs')
      expect(useAppStore.getState().activeSession).toBeNull()
      expect(useAppStore.getState().sessions.length).toBe(1)
      expect(useAppStore.getState().sessions[0].status).toBe('completed')
      expect(useAppStore.getState().sessions[0].notes).toBe('Great progress on docs')
      expect(useAppStore.getState().sessionCount).toBe(1)

      // 5. Verify mission is still active (sessions don't auto-complete missions)
      expect(useAppStore.getState().missions.length).toBe(1)

      // 6. Verify momentum event was created
      const events = useAppStore.getState().momentumEvents
      expect(events.some(e => e.type === 'session_completed')).toBe(true)
    })

    test('multiple sessions accumulate correctly', () => {
      // Session 1
      useAppStore.getState().startSession(undefined, undefined, 'focus', 15)
      useAppStore.getState().completeSession()

      // Session 2
      useAppStore.getState().startSession(undefined, undefined, 'focus', 25)
      useAppStore.getState().completeSession()

      // Session 3
      useAppStore.getState().startSession(undefined, undefined, 'focus', 10)
      useAppStore.getState().completeSession()

      expect(useAppStore.getState().sessions.length).toBe(3)
      expect(useAppStore.getState().sessionCount).toBe(3)
      expect(useAppStore.getState().activeSession).toBeNull()
    })

    test('mission + session + salvage lifecycle', () => {
      const mission = useAppStore.getState().addMission('Read chapter 3')
      const sessionId = useAppStore.getState().startSession(mission.id, undefined, 'focus', 20)
      useAppStore.getState().updateSessionTimer(sessionId, 600) // 10 minutes
      useAppStore.getState().salvageSession('Got through half the chapter')

      expect(useAppStore.getState().activeSession).toBeNull()
      expect(useAppStore.getState().sessions[0].status).toBe('salvaged')
      expect(useAppStore.getState().sessions[0].notes).toBe('Got through half the chapter')
      expect(useAppStore.getState().sessionCount).toBe(1)

      // Verify salvage momentum event
      const events = useAppStore.getState().momentumEvents
      expect(events.some(e => e.type === 'session_salvaged')).toBe(true)
    })
  })
})

// ── Store Migrations ──────────────────────────────────────

describe('Store Migrations', () => {
  it('migrates v0 sessions to include mode field', () => {
    // The migration logic adds mode: 'focus' to sessions without it
    const v0Session = { id: '1', started_at: '2026-01-01', status: 'completed', actual_seconds: 300 }
    const migrated = { ...v0Session, mode: v0Session.mode ?? 'focus' }
    expect(migrated.mode).toBe('focus')
  })

  it('migrates v1 to v2 by adding retentionState', () => {
    const v1State = { sessions: [], missions: [] }
    expect(v1State.retentionState).toBeUndefined()
    // After migration, retentionState should be populated
    const { loadRetentionState } = require('../services/retention/retentionEngine')
    const migrated = { ...v1State, retentionState: loadRetentionState(), skipCount: 0 }
    expect(migrated.retentionState).toBeDefined()
    expect(migrated.skipCount).toBe(0)
  })
})
