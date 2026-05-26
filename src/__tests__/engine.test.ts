// ══════════════════════════════════════════════════════════════
// INTENT — Engine Tests
// Tests for the core intelligence: mission compiler, drift graph, salvage, safety
// ══════════════════════════════════════════════════════════════

import { compileMission, scoreMission, rejectMission, estimateSuccessProbability } from '../engine/missionCompiler'
import { createEmptyGraph, recordEvent, computeInsights, getBestProtocol, getBestDuration } from '../engine/personalDriftGraph'
import { generateSalvagePlan } from '../engine/missionEngines'
import { classifyInput, rewriteShameLanguage, isMissionSafe, buildSafetyStatus } from '../agents/antiDriftAgent/safety'
import { RESCUE_PROTOCOLS, getProtocolForState, getFallbackProtocol } from '../types/rescue'
import type { MissionCompilationInput, UserState, EnergyLevel, BlockerType } from '../types'
import type { GraphEvent } from '../engine/personalDriftGraph'

// ── Mission Compiler Tests ──────────────────────────────────

describe('Mission Compiler', () => {
  const baseInput: MissionCompilationInput = {
    state: 'avoiding',
    blocker: 'too_big',
    energy: 'medium',
    availableMinutes: 5,
    contextText: null,
    threadId: null,
    previousFailures: [],
    previousSuccesses: [],
    protocolId: 'two_minute_ignition',
    privacyPolicy: 'local_only',
  }

  test('generates a mission for avoiding state', () => {
    const result = compileMission(baseInput)
    expect(result.primaryMission).toBeDefined()
    expect(result.primaryMission.exactAction.length).toBeGreaterThan(0)
    expect(result.primaryMission.estimatedMinutes).toBe(5)
  })

  test('generates fallback mission', () => {
    const result = compileMission(baseInput)
    expect(result.tinyFallbackMission).toBeDefined()
    expect(result.tinyFallbackMission.estimatedMinutes).toBeLessThanOrEqual(2)
  })

  test('generates salvage mission', () => {
    const result = compileMission(baseInput)
    expect(result.salvageMission).toBeDefined()
    expect(result.salvageMission.estimatedMinutes).toBe(1)
  })

  test('generates body double script', () => {
    const result = compileMission(baseInput)
    expect(result.bodyDoubleScript).toBeDefined()
  })

  test('generates completion criteria', () => {
    const result = compileMission(baseInput)
    expect(result.completionCriteria.length).toBeGreaterThan(0)
  })

  test('generates anti-drift plan', () => {
    const result = compileMission(baseInput)
    expect(result.antiDriftPlan.length).toBeGreaterThan(0)
  })

  test('scores mission quality', () => {
    const result = compileMission(baseInput)
    expect(result.missionQualityScore.overall).toBeGreaterThan(0)
    expect(result.missionQualityScore.overall).toBeLessThanOrEqual(1)
  })

  test('estimates success probability', () => {
    const result = compileMission(baseInput)
    expect(result.successProbability).toBeGreaterThan(0)
    expect(result.successProbability).toBeLessThanOrEqual(1)
  })

  test('rejects vague missions', () => {
    const result = rejectMission('Study biology')
    expect(result.rejected).toBe(true)
  })

  test('rejects shame-based missions', () => {
    const result = rejectMission('Stop being lazy and work')
    expect(result.rejected).toBe(true)
  })

  test('accepts concrete missions', () => {
    const result = rejectMission('Open your biology notes and make 3 flashcards from the first heading.')
    expect(result.rejected).toBe(false)
  })

  test('generates different missions for different states', () => {
    const states: UserState[] = ['avoiding', 'overwhelmed', 'stuck', 'tired', 'perfectionism']
    const missions = states.map(state =>
      compileMission({ ...baseInput, state }).primaryMission.exactAction
    )
    // All missions should be different
    const unique = new Set(missions)
    expect(unique.size).toBe(states.length)
  })

  test('generates contextual mission when context provided', () => {
    const input = {
      ...baseInput,
      contextText: 'I have a biology test Friday and I haven\'t started.',
    }
    const result = compileMission(input)
    expect(result.primaryMission.exactAction.toLowerCase()).toContain('read')
  })
})

// ── Personal Drift Graph Tests ──────────────────────────────

describe('Personal Drift Graph', () => {
  test('creates empty graph', () => {
    const graph = createEmptyGraph('user1')
    expect(graph.userId).toBe('user1')
    expect(graph.totalEvents).toBe(0)
    expect(Object.keys(graph.nodes).length).toBe(0)
  })

  test('records events and updates nodes', () => {
    let graph = createEmptyGraph('user1')
    const event: GraphEvent = {
      state: 'avoiding',
      blocker: 'too_big',
      protocolId: 'two_minute_ignition',
      durationMinutes: 2,
      outcome: 'completed',
      energy: 'medium',
      surface: 'app',
      timestamp: new Date().toISOString(),
    }
    graph = recordEvent(graph, event)
    expect(graph.totalEvents).toBe(1)
    expect('state:avoiding' in graph.nodes).toBe(true)
    expect('protocol:two_minute_ignition' in graph.nodes).toBe(true)
    expect(graph.edges.length).toBeGreaterThan(0)
  })

  test('computes insights after enough events', () => {
    let graph = createEmptyGraph('user1')
    const protocols = ['two_minute_ignition', 'shrink_the_beast', 'ugly_first_move'] as const

    for (let i = 0; i < 10; i++) {
      graph = recordEvent(graph, {
        state: 'avoiding',
        blocker: 'too_big',
        protocolId: protocols[i % 3],
        durationMinutes: 5,
        outcome: i % 2 === 0 ? 'completed' : 'abandoned',
        energy: 'medium',
        surface: 'app',
        timestamp: new Date().toISOString(),
      })
    }

    const insights = computeInsights(graph)
    expect(insights.length).toBeGreaterThan(0)
  })

  test('returns null for best protocol with insufficient data', () => {
    const graph = createEmptyGraph('user1')
    const best = getBestProtocol(graph, 'avoiding')
    expect(best).toBeNull()
  })

  test('returns null for best duration with insufficient data', () => {
    const graph = createEmptyGraph('user1')
    const best = getBestDuration(graph, 'avoiding')
    expect(best).toBeNull()
  })
})

// ── Salvage Engine Tests ────────────────────────────────────

describe('Salvage Engine', () => {
  test('generates no-shame message', () => {
    const plan = generateSalvagePlan({
      mission: {
        id: 'm1',
        threadId: null,
        title: 'Test mission',
        exactAction: 'Test action',
        status: 'pending',
        estimatedMinutes: 5,
        actualMinutes: null,
        resistanceBefore: null,
        resistanceAfter: null,
        distractionCaptured: null,
        completionCriteria: '',
        fallbackMission: null,
        salvageMission: null,
        protocolId: 'two_minute_ignition',
        state: 'avoiding',
        energy: 'medium',
        blocker: 'too_big',
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        completedAt: null,
        privacyClassification: 'local_only',
      },
      thread: null,
      abandonmentReason: 'canceled_early',
      sessionDurationSeconds: 120,
      distractionCount: 2,
      state: 'avoiding',
      energy: 'medium',
      blocker: 'too_big',
    })

    expect(plan.noShameMessage).toBeDefined()
    expect(plan.noShameMessage).not.toContain('failed')
    expect(plan.noShameMessage).not.toContain('lazy')
  })

  test('offers smaller version', () => {
    const plan = generateSalvagePlan({
      mission: {
        id: 'm1', threadId: null, title: 'Test', exactAction: 'Test action',
        status: 'pending', estimatedMinutes: 25, actualMinutes: null,
        resistanceBefore: null, resistanceAfter: null, distractionCaptured: null,
        completionCriteria: '', fallbackMission: null, salvageMission: null,
        protocolId: 'shrink_the_beast', state: 'overwhelmed', energy: 'low',
        blocker: 'too_big', sortOrder: 0, createdAt: new Date().toISOString(),
        completedAt: null, privacyClassification: 'local_only',
      },
      thread: null,
      abandonmentReason: 'timer_ended_incomplete',
      sessionDurationSeconds: 600,
      distractionCount: 0,
      state: 'overwhelmed',
      energy: 'low',
      blocker: 'too_big',
    })

    expect(plan.smallerVersion).toBeDefined()
    expect(plan.newProtocolId).toBeDefined()
  })

  test('gives partial credit', () => {
    const plan = generateSalvagePlan({
      mission: {
        id: 'm1', threadId: null, title: 'Test', exactAction: 'Test action',
        status: 'pending', estimatedMinutes: 10, actualMinutes: null,
        resistanceBefore: null, resistanceAfter: null, distractionCaptured: null,
        completionCriteria: '', fallbackMission: null, salvageMission: null,
        protocolId: 'two_minute_ignition', state: 'avoiding', energy: 'medium',
        blocker: null, sortOrder: 0, createdAt: new Date().toISOString(),
        completedAt: null, privacyClassification: 'local_only',
      },
      thread: null,
      abandonmentReason: 'canceled_early',
      sessionDurationSeconds: 300, // 5 minutes of 10
      distractionCount: 0,
      state: 'avoiding',
      energy: 'medium',
      blocker: null,
    })

    expect(plan.partialCredit).toContain('50%')
  })
})

// ── Safety Engine Tests ─────────────────────────────────────

describe('Safety Engine', () => {
  test('classifies normal input as safe', () => {
    expect(classifyInput('I need to study for my test')).toBe('safe')
  })

  test('classifies crisis input', () => {
    expect(classifyInput('I want to hurt myself')).toBe('crisis')
    expect(classifyInput('I can\'t go on anymore')).toBe('crisis')
  })

  test('classifies high distress input', () => {
    expect(classifyInput('I\'m so stressed I can\'t handle this')).toBe('caution')
  })

  test('rewrites shame language', () => {
    const result = rewriteShameLanguage('You failed again. You\'re lazy.')
    expect(result.wasRewritten).toBe(true)
    expect(result.rewritten).not.toContain('failed')
    expect(result.rewritten).not.toContain('lazy')
  })

  test('does not rewrite clean text', () => {
    const result = rewriteShameLanguage('Let\'s try a smaller version.')
    expect(result.wasRewritten).toBe(false)
  })

  test('rejects unsafe missions', () => {
    expect(isMissionSafe('Exercise until exhaustion').safe).toBe(false)
    expect(isMissionSafe('Open your notes and write 3 flashcards').safe).toBe(true)
  })

  test('blocks external actions in crisis', () => {
    const status = buildSafetyStatus('I want to die', ['draft_email', 'create_mission'])
    expect(status.level).toBe('crisis')
    expect(status.actionsBlocked.length).toBeGreaterThan(0)
  })
})

// ── Protocol Tests ──────────────────────────────────────────

describe('Rescue Protocols', () => {
  test('all rescue protocols exist', () => {
    expect(Object.keys(RESCUE_PROTOCOLS).length).toBeGreaterThanOrEqual(12)
  })

  test('overwhelmed selects shrink_the_beast', () => {
    expect(getProtocolForState('overwhelmed')).toBe('shrink_the_beast')
  })

  test('perfectionism selects ugly_first_move', () => {
    expect(getProtocolForState('perfectionism')).toBe('ugly_first_move')
  })

  test('tired selects maintenance_spark', () => {
    expect(getProtocolForState('tired')).toBe('maintenance_spark')
  })

  test('doomscroll_risk selects doomscroll_intercept', () => {
    expect(getProtocolForState('doomscroll_risk')).toBe('doomscroll_intercept')
  })

  test('shame_spiral selects comeback_seed', () => {
    expect(getProtocolForState('shame_spiral')).toBe('comeback_seed')
  })

  test('scattered selects clear_the_fog', () => {
    expect(getProtocolForState('scattered')).toBe('clear_the_fog')
  })

  test('each protocol has fallback', () => {
    for (const id of Object.keys(RESCUE_PROTOCOLS)) {
      const fallback = getFallbackProtocol(id as import('../types/rescue').RescueProtocolId)
      expect(RESCUE_PROTOCOLS[fallback]).toBeDefined()
    }
  })
})

// ── Comprehensive Mission Compiler Tests ───────────────────

describe('Mission Compiler — All UserStates', () => {
  const allStates: UserState[] = [
    'avoiding', 'overwhelmed', 'stuck', 'tired', 'distracted',
    'anxious', 'scattered', 'ready', 'bored', 'perfectionism',
    'unclear', 'time_pressure', 'low_confidence', 'shame_spiral',
    'fake_productivity', 'planning_loop', 'doomscroll_risk',
  ]

  const baseInput: MissionCompilationInput = {
    state: 'avoiding',
    blocker: 'too_big',
    energy: 'medium',
    availableMinutes: 5,
    contextText: null,
    threadId: null,
    previousFailures: [],
    previousSuccesses: [],
    protocolId: 'two_minute_ignition',
    privacyPolicy: 'local_only',
  }

  test.each(allStates)('compileMission returns valid mission for state: %s', (state) => {
    const protocolId = getProtocolForState(state)
    const result = compileMission({ ...baseInput, state, protocolId })

    expect(result.primaryMission).toBeDefined()
    expect(result.primaryMission.exactAction).toBeDefined()
    expect(typeof result.primaryMission.exactAction).toBe('string')
    expect(result.primaryMission.exactAction.length).toBeGreaterThan(10)
  })

  test('exactAction length > 10 chars for every state', () => {
    allStates.forEach(state => {
      const protocolId = getProtocolForState(state)
      const result = compileMission({ ...baseInput, state, protocolId })
      expect(result.primaryMission.exactAction.length).toBeGreaterThan(10)
    })
  })

  test('all missions have non-empty completionCriteria', () => {
    allStates.forEach(state => {
      const protocolId = getProtocolForState(state)
      const result = compileMission({ ...baseInput, state, protocolId })
      expect(result.completionCriteria.length).toBeGreaterThan(0)
    })
  })

  test('all missions have tinyFallbackMission with <= 2 min', () => {
    allStates.forEach(state => {
      const protocolId = getProtocolForState(state)
      const result = compileMission({ ...baseInput, state, protocolId })
      expect(result.tinyFallbackMission).toBeDefined()
      expect(result.tinyFallbackMission.estimatedMinutes).toBeLessThanOrEqual(2)
    })
  })
})

// ── Comprehensive Protocol Mapping Tests ────────────────────

describe('getProtocolForState — All States', () => {
  test('returns valid protocol for every UserState', () => {
    const allStates: UserState[] = [
      'avoiding', 'overwhelmed', 'stuck', 'tired', 'distracted',
      'anxious', 'scattered', 'ready', 'bored', 'perfectionism',
      'unclear', 'time_pressure', 'low_confidence', 'shame_spiral',
      'fake_productivity', 'planning_loop', 'doomscroll_risk',
    ]

    allStates.forEach(state => {
      const protocolId = getProtocolForState(state)
      expect(protocolId).toBeDefined()
      expect(typeof protocolId).toBe('string')
      expect(protocolId.length).toBeGreaterThan(0)
      expect(RESCUE_PROTOCOLS[protocolId]).toBeDefined()
    })
  })

  test('each returned protocol has required fields', () => {
    const allStates: UserState[] = [
      'avoiding', 'overwhelmed', 'stuck', 'tired', 'distracted',
      'anxious', 'scattered', 'ready', 'bored', 'perfectionism',
      'unclear', 'time_pressure', 'low_confidence', 'shame_spiral',
      'fake_productivity', 'planning_loop', 'doomscroll_risk',
    ]

    allStates.forEach(state => {
      const protocolId = getProtocolForState(state)
      const protocol = RESCUE_PROTOCOLS[protocolId]
      expect(protocol.id).toBe(protocolId)
      expect(protocol.name).toBeDefined()
      expect(protocol.name.length).toBeGreaterThan(0)
    })
  })

  test('known state-to-protocol mappings are correct', () => {
    expect(getProtocolForState('avoiding')).toBe('two_minute_ignition')
    expect(getProtocolForState('overwhelmed')).toBe('shrink_the_beast')
    expect(getProtocolForState('stuck')).toBe('body_double_start')
    expect(getProtocolForState('tired')).toBe('maintenance_spark')
    expect(getProtocolForState('distracted')).toBe('lock_the_door')
    expect(getProtocolForState('anxious')).toBe('pressure_valve')
    expect(getProtocolForState('scattered')).toBe('clear_the_fog')
    expect(getProtocolForState('perfectionism')).toBe('ugly_first_move')
    expect(getProtocolForState('shame_spiral')).toBe('comeback_seed')
    expect(getProtocolForState('doomscroll_risk')).toBe('doomscroll_intercept')
    expect(getProtocolForState('fake_productivity')).toBe('planning_loop_breaker')
    expect(getProtocolForState('planning_loop')).toBe('planning_loop_breaker')
  })
})
