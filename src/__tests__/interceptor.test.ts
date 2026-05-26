// ══════════════════════════════════════════════════════════════
// INTENT — Drift Interception Orchestrator Tests
// Tests for the core drift detection and interception engine
// ══════════════════════════════════════════════════════════════

import { DriftInterceptionOrchestrator } from '../engine/interceptor'
import type {
  DriftSignal, DriftSignalType, OrchestratorConfig,
  InterceptionType, UserPatternProfile,
} from '../engine/interceptor'
import type {
  UserProfile, Mission, MissionSession, MomentumEvent,
  Distraction, UserState,
} from '../types'
import type { AgentInterception, SurfaceType } from '../engine/agent'

// ── Test Helpers ────────────────────────────────────────────

function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user1',
    display_name: 'TestUser',
    plan: 'free',
    onboarding_complete: true,
    onboarding_step: 5,
    preferred_push_style: 'gentle',
    energy_default: 'medium',
    timezone: 'America/New_York',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as UserProfile
}

function makeSession(overrides: Partial<MissionSession> = {}): MissionSession {
  return {
    id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    user_id: 'user1',
    mission_id: null,
    micro_mission_id: null,
    mode: 'focus',
    planned_minutes: 25,
    actual_seconds: 0,
    status: 'active',
    started_at: new Date().toISOString(),
    ended_at: null,
    distractions_captured: 0,
    resistance_start: null,
    resistance_end: null,
    notes: null,
    created_at: new Date().toISOString(),
    ...overrides,
  } as MissionSession
}

function makeMission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: `mission_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    user_id: 'user1',
    title: 'Test Mission',
    description: 'Test',
    status: 'active',
    resistance_level: 'medium',
    avoidance_state: null,
    color: '#6C3AED',
    icon: 'target',
    deadline: null,
    completed_at: null,
    salvaged_at: null,
    salvage_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as Mission
}

function makeDistraction(overrides: Partial<Distraction> = {}): Distraction {
  return {
    id: `dist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    user_id: 'user1',
    session_id: null,
    content: 'random thought',
    category: 'thought',
    intensity: 5,
    captured_at: new Date().toISOString(),
    processed: false,
    brain_dump_id: null,
    ...overrides,
  } as Distraction
}

function makePatternProfile(overrides: Partial<UserPatternProfile> = {}): UserPatternProfile {
  return {
    userId: 'user1',
    averageSessionStartHour: 10,
    averageSessionDuration: 15,
    mostCommonDriftTime: 14,
    driftFrequencyByDay: { Mon: 0.5, Tue: 0.4, Wed: 0.6, Thu: 0.3, Fri: 0.5, Sat: 0.2, Sun: 0.3 },
    resistanceByMissionType: {},
    recoverySpeed: 0.6,
    preferredPushStyle: 'gentle',
    effectivenessByType: {} as Record<InterceptionType, number>,
    lastUpdated: new Date().toISOString(),
    ...overrides,
  }
}

// ── Orchestrator Construction Tests ─────────────────────────

describe('DriftInterceptionOrchestrator', () => {
  describe('constructor and config', () => {
    test('creates with default config', () => {
      const orch = new DriftInterceptionOrchestrator()
      const config = orch.getConfig()
      expect(config.maxInterceptionsPerHour).toBe(3)
      expect(config.minInterceptionIntervalMinutes).toBe(20)
      expect(config.respectQuietHours).toBe(true)
      expect(config.quietHoursStart).toBe(22)
      expect(config.quietHoursEnd).toBe(7)
    })

    test('merges partial config with defaults', () => {
      const orch = new DriftInterceptionOrchestrator({ maxInterceptionsPerHour: 5 })
      const config = orch.getConfig()
      expect(config.maxInterceptionsPerHour).toBe(5)
      expect(config.respectQuietHours).toBe(true) // default preserved
    })

    test('initializes agent state in ambient mode', () => {
      const orch = new DriftInterceptionOrchestrator()
      const state = orch.getAgentState()
      expect(state.mode).toBe('ambient')
      expect(state.confidence).toBe('low')
      expect(state.userIsInApp).toBe(false)
      expect(state.userIsInSession).toBe(false)
      expect(state.activeInterceptions).toEqual([])
    })
  })

  // ── DETECT Phase: Signal Generation ───────────────────────

  describe('analyze - signal generation', () => {
    test('returns empty signals when user is null', () => {
      const orch = new DriftInterceptionOrchestrator()
      const signals = orch.analyze(null, [], [], [], [], [])
      expect(signals).toEqual([])
    })

    test('generates session_inactivity signal after 2+ hours', () => {
      const orch = new DriftInterceptionOrchestrator()
      orch.updateAgentState({ timeSinceLastSession: 300 })
      const user = makeUser()
      const signals = orch.analyze(user, [], [], [], [], [])
      const inactivity = signals.find(s => s.type === 'session_inactivity')
      expect(inactivity).toBeDefined()
      expect(inactivity!.confidence).toBeGreaterThan(0)
      expect(inactivity!.state).toBeDefined()
    })

    test('generates time_of_day_pattern signal at high-risk hour', () => {
      const orch = new DriftInterceptionOrchestrator()
      const profile = makePatternProfile({ mostCommonDriftTime: new Date().getHours() })
      orch.setPatternProfile(profile)
      const user = makeUser()
      const signals = orch.analyze(user, [], [], [], [], [])
      const pattern = signals.find(s => s.type === 'time_of_day_pattern')
      expect(pattern).toBeDefined()
      expect(pattern!.confidence).toBe(0.75)
    })

    test('generates abandoned_streak signal with 2+ recent abandons', () => {
      const orch = new DriftInterceptionOrchestrator()
      const sessions = [
        makeSession({ status: 'abandoned', started_at: new Date().toISOString() }),
        makeSession({ status: 'abandoned', started_at: new Date(Date.now() - 3600000).toISOString() }),
      ]
      const user = makeUser()
      const signals = orch.analyze(user, sessions, [], [], [], [])
      const streak = signals.find(s => s.type === 'abandoned_streak')
      expect(streak).toBeDefined()
      expect(streak!.metadata.abandonedCount).toBe(2)
    })

    test('generates mission_stall signal for 3+ day old active missions', () => {
      const orch = new DriftInterceptionOrchestrator()
      const fourDaysAgo = new Date(Date.now() - 4 * 86400000).toISOString()
      const missions = [makeMission({ status: 'active', created_at: fourDaysAgo })]
      const user = makeUser()
      const signals = orch.analyze(user, [], missions, [], [], [])
      const stall = signals.find(s => s.type === 'mission_stall')
      expect(stall).toBeDefined()
      expect(stall!.metadata.stalledCount).toBe(1)
    })

    test('generates distraction_cluster signal with 3+ recent distractions', () => {
      const orch = new DriftInterceptionOrchestrator()
      const distractions = Array.from({ length: 4 }, () =>
        makeDistraction({ captured_at: new Date().toISOString() }),
      )
      const user = makeUser()
      const signals = orch.analyze(user, [], [], [], distractions, [])
      const cluster = signals.find(s => s.type === 'distraction_cluster')
      expect(cluster).toBeDefined()
      expect(cluster!.severity).toBe('urgent')
    })

    test('generates overload_detected signal with 6+ active missions', () => {
      const orch = new DriftInterceptionOrchestrator()
      const missions = Array.from({ length: 7 }, () => makeMission({ status: 'active' }))
      const user = makeUser()
      const signals = orch.analyze(user, [], missions, [], [], [])
      const overload = signals.find(s => s.type === 'overload_detected')
      expect(overload).toBeDefined()
      expect(overload!.state).toBe('overwhelmed')
      expect(overload!.confidence).toBe(0.9)
    })

    test('sorts signals by confidence descending', () => {
      const orch = new DriftInterceptionOrchestrator()
      orch.updateAgentState({ timeSinceLastSession: 300 })
      const profile = makePatternProfile({ mostCommonDriftTime: new Date().getHours() })
      orch.setPatternProfile(profile)
      const user = makeUser()
      const signals = orch.analyze(user, [], [], [], [], [])
      for (let i = 1; i < signals.length; i++) {
        expect(signals[i - 1].confidence).toBeGreaterThanOrEqual(signals[i].confidence)
      }
    })

    test('tracks signal history up to 100', () => {
      const orch = new DriftInterceptionOrchestrator()
      orch.updateAgentState({ timeSinceLastSession: 300 })
      const user = makeUser()
      // Run analyze multiple times
      for (let i = 0; i < 5; i++) {
        orch.analyze(user, [], [], [], [], [])
      }
      const history = orch.getSignalHistory()
      expect(history.length).toBeLessThanOrEqual(100)
    })
  })

  // ── DECIDE Phase: Interception Decision ────────────────────

  describe('shouldIntercept - decision logic', () => {
    test('blocks interception during quiet hours', () => {
      const orch = new DriftInterceptionOrchestrator({ respectQuietHours: true, quietHoursStart: 0, quietHoursEnd: 23 })
      const signal: DriftSignal = {
        id: 'sig1',
        type: 'session_inactivity',
        confidence: 0.8,
        severity: 'warning',
        state: 'avoiding',
        message: 'Test',
        suggestedInterception: {
          type: 'gentle_nudge', message: 'Test', action: {} as any,
          fallbackType: 'gentle_nudge', escalationCount: 0, lastAttempt: null, cooldownMinutes: 20,
        },
        surfacePriority: ['app'],
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        metadata: {},
      }
      const result = orch.shouldIntercept(signal)
      expect(result.should).toBe(false)
      expect(result.reason).toContain('Quiet')
    })

    test('allows interception outside quiet hours', () => {
      const orch = new DriftInterceptionOrchestrator({ respectQuietHours: false })
      const signal: DriftSignal = {
        id: 'sig1',
        type: 'session_inactivity',
        confidence: 0.8,
        severity: 'warning',
        state: 'avoiding',
        message: 'Test',
        suggestedInterception: {
          type: 'gentle_nudge', message: 'Test', action: {} as any,
          fallbackType: 'gentle_nudge', escalationCount: 0, lastAttempt: null, cooldownMinutes: 20,
        },
        surfacePriority: ['app'],
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        metadata: {},
      }
      const result = orch.shouldIntercept(signal)
      expect(result.should).toBe(true)
      // Side effects are now applied separately
      orch.prepareInterception(signal)
    })

    test('rate limits when recent interceptions exist', () => {
      const orch = new DriftInterceptionOrchestrator({ respectQuietHours: false })
      // Simulate a recent interception
      orch.updateAgentState({
        activeInterceptions: [{
          id: 'int1',
          type: 'drift_warning',
          confidence: 'medium',
          state: 'avoiding',
          message: 'test',
          suggestedAction: {} as any,
          surface: 'app',
          shown: false,
          dismissed: false,
          actedUpon: false,
          created_at: new Date().toISOString(),
        }],
      })
      const signal: DriftSignal = {
        id: 'sig1',
        type: 'session_inactivity',
        confidence: 0.8,
        severity: 'warning',
        state: 'avoiding',
        message: 'Test',
        suggestedInterception: {
          type: 'gentle_nudge', message: 'Test', action: {} as any,
          fallbackType: 'gentle_nudge', escalationCount: 0, lastAttempt: null, cooldownMinutes: 20,
        },
        surfacePriority: ['app'],
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        metadata: {},
      }
      const result = orch.shouldIntercept(signal)
      expect(result.should).toBe(false)
      expect(result.reason).toContain('rate limited')
    })

    test('blocks when max per hour reached', () => {
      const orch = new DriftInterceptionOrchestrator({
        respectQuietHours: false,
        maxInterceptionsPerHour: 2,
        minInterceptionIntervalMinutes: 0, // disable interval check
      })
      const interceptions: AgentInterception[] = [
        {
          id: 'int1', type: 'drift_warning', confidence: 'medium', state: 'avoiding',
          message: 'test', suggestedAction: {} as any, surface: 'app',
          shown: false, dismissed: false, actedUpon: false,
          created_at: new Date(Date.now() - 60000).toISOString(),
        },
        {
          id: 'int2', type: 'drift_warning', confidence: 'medium', state: 'avoiding',
          message: 'test', suggestedAction: {} as any, surface: 'app',
          shown: false, dismissed: false, actedUpon: false,
          created_at: new Date(Date.now() - 60000).toISOString(),
        },
      ]
      orch.updateAgentState({ activeInterceptions: interceptions })
      const signal: DriftSignal = {
        id: 'sig1',
        type: 'session_inactivity',
        confidence: 0.8,
        severity: 'warning',
        state: 'avoiding',
        message: 'Test',
        suggestedInterception: {
          type: 'gentle_nudge', message: 'Test', action: {} as any,
          fallbackType: 'gentle_nudge', escalationCount: 0, lastAttempt: null, cooldownMinutes: 20,
        },
        surfacePriority: ['app'],
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        metadata: {},
      }
      const result = orch.shouldIntercept(signal)
      expect(result.should).toBe(false)
      expect(result.reason).toContain('Max per hour')
    })
  })

  // ── DELIVER Phase: Surface Formatting ─────────────────────

  describe('formatForSurface', () => {
    const orch = new DriftInterceptionOrchestrator()
    const interception: AgentInterception = {
      id: 'int1',
      type: 'drift_warning',
      confidence: 'high',
      state: 'avoiding',
      message: 'You might be avoiding something. Open it for just 2 minutes.',
      suggestedAction: {
        id: 'a1', type: 'start_micro_mission', title: 'Start 2 min',
        description: 'Open the file', estimated_minutes: 2,
        mission_id: null, micro_mission_id: null,
        requires_approval: false, auto_execute: false,
        priority: 'medium', created_at: new Date().toISOString(),
      },
      surface: 'app',
      shown: false,
      dismissed: false,
      actedUpon: false,
      created_at: new Date().toISOString(),
    }

    test('formats for notification surface', () => {
      const result = orch.formatForSurface(interception, 'notification')
      expect(result.title).toBe('Start 2 min')
      expect(result.body).toContain('avoiding')
      expect(result.actions).toContain('Start Session')
      expect(result.actions).toContain('Snooze')
    })

    test('formats for widget surface with truncated body', () => {
      const longMessage = 'A'.repeat(200)
      const longInterception = { ...interception, message: longMessage }
      const result = orch.formatForSurface(longInterception, 'widget')
      expect(result.title).toBe('INTENT')
      expect(result.body.length).toBeLessThanOrEqual(80)
      expect(result.actions).toEqual(['Tap to focus'])
    })

    test('formats for live_activity surface', () => {
      const result = orch.formatForSurface(interception, 'live_activity')
      expect(result.title).toBe('Drift Check')
      expect(result.body.length).toBeLessThanOrEqual(120)
      expect(result.actions).toContain('Take Action')
    })

    test('formats for lock_screen surface with short body', () => {
      const result = orch.formatForSurface(interception, 'lock_screen')
      expect(result.title).toBe('INTENT')
      expect(result.body.length).toBeLessThanOrEqual(60)
      expect(result.actions).toContain('Focus Now')
    })

    test('formats for app surface (default)', () => {
      const result = orch.formatForSurface(interception, 'app')
      expect(result.title).toBe('Quick Check-In')
      expect(result.actions).toContain('Start a session')
      expect(result.actions).toContain('Capture distraction')
    })
  })

  // ── LEARN Phase: Outcome Recording ────────────────────────

  describe('recordInterceptionOutcome', () => {
    test('marks interception as acted and boosts pattern confidence', () => {
      const orch = new DriftInterceptionOrchestrator()
      const interception: AgentInterception = {
        id: 'int1', type: 'drift_warning', confidence: 'medium', state: 'avoiding',
        message: 'test', suggestedAction: {} as any, surface: 'app',
        shown: false, dismissed: false, actedUpon: false,
        created_at: new Date().toISOString(),
      }
      orch.updateAgentState({ activeInterceptions: [interception], patternConfidence: 0.5 })
      orch.recordInterceptionOutcome('int1', 'acted')
      const state = orch.getAgentState()
      expect(state.patternConfidence).toBeGreaterThan(0.5)
    })

    test('marks interception as dismissed', () => {
      const orch = new DriftInterceptionOrchestrator()
      const interception: AgentInterception = {
        id: 'int1', type: 'drift_warning', confidence: 'medium', state: 'avoiding',
        message: 'test', suggestedAction: {} as any, surface: 'app',
        shown: false, dismissed: false, actedUpon: false,
        created_at: new Date().toISOString(),
      }
      orch.updateAgentState({ activeInterceptions: [interception] })
      orch.recordInterceptionOutcome('int1', 'dismissed')
      const state = orch.getAgentState()
      const updated = state.activeInterceptions.find(i => i.id === 'int1')
      expect(updated!.dismissed).toBe(true)
    })

    test('ignores unknown interception id', () => {
      const orch = new DriftInterceptionOrchestrator()
      orch.recordInterceptionOutcome('nonexistent', 'acted')
      // Should not throw
      expect(orch.getAgentState().patternConfidence).toBe(0)
    })
  })

  // ── createInterception ────────────────────────────────────

  describe('createInterception', () => {
    test('creates an AgentInterception from a signal', () => {
      const orch = new DriftInterceptionOrchestrator()
      const signal: DriftSignal = {
        id: 'sig1',
        type: 'session_inactivity',
        confidence: 0.85,
        severity: 'warning',
        state: 'avoiding',
        message: 'You have been away',
        suggestedInterception: {
          type: 'gentle_nudge', message: 'Come back', action: {
            id: 'a1', type: 'start_micro_mission', title: 'Start',
            description: 'desc', estimated_minutes: 2,
            mission_id: null, micro_mission_id: null,
            requires_approval: false, auto_execute: false,
            priority: 'medium', created_at: new Date().toISOString(),
          },
          fallbackType: 'gentle_nudge', escalationCount: 0, lastAttempt: null, cooldownMinutes: 20,
        },
        surfacePriority: ['notification', 'app'],
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        metadata: {},
      }
      const interception = orch.createInterception(signal)
      expect(interception.id).toBeDefined()
      expect(interception.type).toBe('drift_warning')
      expect(interception.state).toBe('avoiding')
      expect(interception.surface).toBe('notification')
      expect(interception.shown).toBe(false)
      expect(interception.actedUpon).toBe(false)
    })

    test('maps signal types to interception types correctly', () => {
      const orch = new DriftInterceptionOrchestrator()
      const typeMap: Array<[DriftSignalType, AgentInterception['type']]> = [
        ['session_inactivity', 'drift_warning'],
        ['time_of_day_pattern', 'pattern_match'],
        ['abandoned_streak', 'avoidance_detected'],
        ['mission_stall', 'avoidance_detected'],
        ['comeback_window', 'comeback_opportunity'],
        ['overload_detected', 'energy_mismatch'],
      ]
      for (const [signalType, expectedType] of typeMap) {
        const signal: DriftSignal = {
          id: `sig_${signalType}`,
          type: signalType,
          confidence: 0.8,
          severity: 'warning',
          state: 'avoiding',
          message: 'test',
          suggestedInterception: {
            type: 'gentle_nudge', message: 'test', action: {
              id: 'a1', type: 'start_micro_mission', title: 't',
              description: 'd', estimated_minutes: 2,
              mission_id: null, micro_mission_id: null,
              requires_approval: false, auto_execute: false,
              priority: 'medium', created_at: new Date().toISOString(),
            },
            fallbackType: 'gentle_nudge', escalationCount: 0, lastAttempt: null, cooldownMinutes: 20,
          },
          surfacePriority: ['app'],
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          metadata: {},
        }
        const interception = orch.createInterception(signal)
        expect(interception.type).toBe(expectedType)
      }
    })
  })
})
