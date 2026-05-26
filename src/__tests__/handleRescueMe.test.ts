// ══════════════════════════════════════════════════════════════
// INTENT — handleRescueMe Integration Test
// Tests the full rescue flow: state → mission → session
// ══════════════════════════════════════════════════════════════

jest.mock('../store/storage', () => ({
  mmkvStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}))

const EMPTY_RETENTION = {
  totalRescues: 0,
  rescueHistory: [],
  momentumWindows: { last7Days: 0, last30Days: 0 },
  activationData: null,
  activated: false,
  dayTracking: { firstSeen: null, lastSeen: null, daysActive: 0, consecutiveDays: 0 },
  loopStatuses: {},
  socialProof: { lastShown: null, timesShown: 0 },
}

jest.mock('../services/retention/retentionEngine', () => ({
  createEmptyRetentionState: jest.fn(() => ({ ...EMPTY_RETENTION })),
  loadRetentionState: jest.fn(() => ({ ...EMPTY_RETENTION })),
  saveRetentionState: jest.fn(),
  recordRetentionEvent: jest.fn((state: any) => state),
  computeMomentumWindows: jest.fn((s: any) => ({ ...s, momentumWindows: { last7Days: 0, last30Days: 0 } })),
  detectComeback: jest.fn(() => ({ isComeback: false, daysAway: 0, lastState: null })),
  checkActivationMilestone: jest.fn(() => null),
  getSocialProofStat: jest.fn(() => null),
  updateMomentumWindows: jest.fn((s: any) => s),
}))

import { useAppStore } from '../store/index'
import { compileMission } from '../engine/missionCompiler'
import { resetDriftDetectionState } from '../engine/agent'

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

beforeEach(() => {
  resetDriftDetectionState()
  resetStore()
})

describe('handleRescueMe flow', () => {
  it('compiles mission and creates session with full exactAction', () => {
    const store = useAppStore.getState()
    store.setUser({
      id: 'test',
      email: 'test@test.com',
      display_name: 'Test',
      avatar_url: null,
      push_style: 'gentle',
      onboarding_complete: true,
      onboarding_step: 5,
      plan: 'free',
      timezone: 'America/New_York',
      body_double_enabled: false,
      vault_enabled: false,
      local_only: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    const result = compileMission({
      state: 'avoiding',
      blocker: null,
      energy: 'medium',
      availableMinutes: 5,
      contextText: null,
      threadId: null,
      previousFailures: [],
      previousSuccesses: [],
      protocolId: 'ugly_first_move',
      privacyPolicy: 'local_only',
    })

    expect(result.primaryMission.exactAction).toBeTruthy()
    expect(result.primaryMission.exactAction.length).toBeGreaterThan(10)

    const mission = store.addMission(
      result.primaryMission.title,
      result.primaryMission.exactAction,
      '#8B5CF6',
    )

    expect(mission).toBeTruthy()
    expect(mission.id).toBeTruthy()

    const micro = store.addMicroMission(
      mission.id,
      result.primaryMission.exactAction,
      result.primaryMission.completionCriteria ?? undefined,
      5,
    )

    expect(micro).toBeTruthy()

    store.startSession(mission.id, micro.id, 'focus', 5)

    const state = useAppStore.getState()
    expect(state.activeSession).not.toBeNull()
    expect(state.activeSession!.status).toBe('active')
    expect(state.missions).toHaveLength(1)
    expect(state.missions[0].status).toBe('active')
    expect(state.microMissions).toHaveLength(1)
    expect(state.microMissions[0].exactAction).toBe(result.primaryMission.exactAction)
  })

  it('salvages previous session on concurrent start', () => {
    const store = useAppStore.getState()
    store.setUser({
      id: 'test',
      email: 'test@test.com',
      display_name: 'Test',
      avatar_url: null,
      push_style: 'gentle',
      onboarding_complete: true,
      onboarding_step: 5,
      plan: 'free',
      timezone: 'America/New_York',
      body_double_enabled: false,
      vault_enabled: false,
      local_only: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    store.startSession('m1', 'mm1', 'focus', 25)
    const firstId = useAppStore.getState().activeSession!.id

    store.startSession('m2', 'mm2', 'focus', 10)

    const finalState = useAppStore.getState()
    expect(finalState.activeSession!.id).not.toBe(firstId)
    expect(finalState.sessions.find((s) => s.id === firstId)?.status).toBe('salvaged')
  })
})
