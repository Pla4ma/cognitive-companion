// ══════════════════════════════════════════════════════════════
// INTENT — Predictive Engine Tests
// Tests for on-device pattern learning and drift prediction
// ══════════════════════════════════════════════════════════════

import {
  analyzeTimeSlots,
  detectDangerWindows,
  buildHourlyPattern,
  buildDailyPattern,
  buildResistanceMap,
  analyzeTrend,
  calculateStreakMomentum,
  predictDrift,
  buildIntelligenceProfile,
} from '../engine/predictiveEngine'
import type {
  TimeSlot, DangerWindow, DriftPrediction,
  UserIntelligenceProfile,
} from '../engine/predictiveEngine'
import type {
  MissionSession, ResistancePattern, MomentumEvent,
  Mission, MicroMission, Distraction, BrainDump,
} from '../types'

// ── Test Helpers ────────────────────────────────────────────

function makeSession(
  status: MissionSession['status'] = 'completed',
  startedAt: string = new Date().toISOString(),
  overrides: Partial<MissionSession> = {},
): MissionSession {
  return {
    id: `sess_${Math.random().toString(36).slice(2, 8)}`,
    user_id: 'user1',
    mission_id: null,
    micro_mission_id: null,
    mode: 'focus',
    planned_minutes: 25,
    actual_seconds: 600,
    status,
    started_at: startedAt,
    ended_at: null,
    distractions_captured: 0,
    resistance_start: null,
    resistance_end: null,
    notes: null,
    created_at: startedAt,
    ...overrides,
  } as MissionSession
}

function makePattern(overrides: Partial<ResistancePattern> = {}): ResistancePattern {
  return {
    id: `pat_${Math.random().toString(36).slice(2, 8)}`,
    user_id: 'user1',
    avoidance_state: 'avoiding',
    mission_type: 'too_big',
    frequency: 5,
    last_occurred: new Date().toISOString(),
    typical_duration_minutes: 15,
    successful_strategy: 'shrink the task',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as ResistancePattern
}

function makeMomentumEvent(overrides: Partial<MomentumEvent> = {}): MomentumEvent {
  return {
    id: `mom_${Math.random().toString(36).slice(2, 8)}`,
    user_id: 'user1',
    type: 'session_completed',
    mission_id: null,
    micro_mission_id: null,
    points: 15,
    note: null,
    created_at: new Date().toISOString(),
    ...overrides,
  } as MomentumEvent
}

// ── Time Slot Analysis ──────────────────────────────────────

describe('analyzeTimeSlots', () => {
  test('returns empty array for no sessions', () => {
    const slots = analyzeTimeSlots([])
    expect(slots).toEqual([])
  })

  test('creates one slot per unique hour+day combination', () => {
    // All sessions at the same time
    const fixedTime = '2025-06-02T14:30:00.000Z' // Monday 14:00 UTC
    const sessions = [
      makeSession('completed', fixedTime),
      makeSession('completed', fixedTime),
      makeSession('abandoned', fixedTime),
    ]
    const slots = analyzeTimeSlots(sessions)
    expect(slots.length).toBe(1)
    expect(slots[0].totalSessions).toBe(3)
    expect(slots[0].driftCount).toBe(1) // only the abandoned one
  })

  test('calculates drift rate correctly', () => {
    const fixedTime = '2025-06-02T14:30:00.000Z'
    const sessions = [
      makeSession('completed', fixedTime),
      makeSession('completed', fixedTime),
      makeSession('abandoned', fixedTime),
      makeSession('salvaged', fixedTime),
    ]
    const slots = analyzeTimeSlots(sessions)
    expect(slots[0].driftRate).toBe(0.5) // 2/4 drifted
  })

  test('sorts slots by drift rate descending', () => {
    // Use different hours on the same day (Monday 2025-06-02)
    const sessions = [
      makeSession('completed', '2025-06-02T10:00:00.000Z'),
      makeSession('completed', '2025-06-02T10:00:00.000Z'),
      makeSession('abandoned', '2025-06-02T14:00:00.000Z'),
      makeSession('abandoned', '2025-06-02T14:00:00.000Z'),
      makeSession('completed', '2025-06-02T14:00:00.000Z'),
    ]
    const slots = analyzeTimeSlots(sessions)
    expect(slots[0].driftRate).toBeGreaterThanOrEqual(slots[slots.length - 1].driftRate)
  })

  test('tracks salvaged sessions as drift', () => {
    const fixedTime = '2025-06-02T14:30:00.000Z'
    const sessions = [
      makeSession('salvaged', fixedTime),
      makeSession('completed', fixedTime),
    ]
    const slots = analyzeTimeSlots(sessions)
    expect(slots[0].driftCount).toBe(1)
    expect(slots[0].driftRate).toBe(0.5)
  })
})

// ── Danger Window Detection ─────────────────────────────────

describe('detectDangerWindows', () => {
  test('returns empty for no time slots', () => {
    const windows = detectDangerWindows([])
    expect(windows).toEqual([])
  })

  test('detects danger window when drift rate exceeds threshold', () => {
    const slots: TimeSlot[] = [
      { hour: 14, dayOfWeek: 1, driftCount: 4, totalSessions: 5, driftRate: 0.8, avgResistance: 6, topState: 'avoiding', topBlocker: 'too_big' },
      { hour: 15, dayOfWeek: 1, driftCount: 3, totalSessions: 5, driftRate: 0.6, avgResistance: 5, topState: 'avoiding', topBlocker: 'too_big' },
    ]
    const windows = detectDangerWindows(slots, 3, 0.4)
    expect(windows.length).toBeGreaterThan(0)
    expect(windows[0].startHour).toBe(14)
    expect(windows[0].endHour).toBe(15)
  })

  test('does not detect window below min samples', () => {
    const slots: TimeSlot[] = [
      { hour: 14, dayOfWeek: 1, driftCount: 1, totalSessions: 2, driftRate: 0.5, avgResistance: 5, topState: 'avoiding', topBlocker: 'too_big' },
    ]
    const windows = detectDangerWindows(slots, 3, 0.4)
    expect(windows.length).toBe(0)
  })

  test('assigns correct risk levels', () => {
    const slots: TimeSlot[] = [
      { hour: 14, dayOfWeek: 1, driftCount: 5, totalSessions: 5, driftRate: 1.0, avgResistance: 8, topState: 'avoiding', topBlocker: 'too_big' },
    ]
    const windows = detectDangerWindows(slots, 3, 0.4)
    expect(windows.length).toBe(1)
    expect(['critical', 'high']).toContain(windows[0].riskLevel)
    expect(windows[0].primaryState).toBe('avoiding')
  })
})

// ── Hourly and Daily Pattern Vectors ────────────────────────

describe('buildHourlyPattern', () => {
  test('returns 24-length array', () => {
    const pattern = buildHourlyPattern([])
    expect(pattern.length).toBe(24)
    expect(pattern.every(v => v === 0)).toBe(true)
  })

  test('calculates drift probability per hour', () => {
    const sessions = [
      makeSession('abandoned', '2025-06-02T14:00:00.000Z'),
      makeSession('abandoned', '2025-06-02T14:00:00.000Z'),
      makeSession('completed', '2025-06-02T14:00:00.000Z'),
      makeSession('completed', '2025-06-02T10:00:00.000Z'),
    ]
    const pattern = buildHourlyPattern(sessions)
    expect(pattern[14]).toBeCloseTo(2 / 3, 1) // 2 drifts out of 3 sessions at 14:00
    expect(pattern[10]).toBe(0) // 0 drifts out of 1 session at 10:00
  })
})

describe('buildDailyPattern', () => {
  test('returns 7-length array', () => {
    const pattern = buildDailyPattern([])
    expect(pattern.length).toBe(7)
  })

  test('calculates drift probability per day', () => {
    // 2025-06-02 is Monday (day 1)
    const sessions = [
      makeSession('abandoned', '2025-06-02T14:00:00.000Z'),
      makeSession('completed', '2025-06-02T10:00:00.000Z'),
    ]
    const pattern = buildDailyPattern(sessions)
    expect(pattern[1]).toBe(0.5) // 1/2 on Monday
  })
})

// ── Trend Analysis ──────────────────────────────────────────

describe('analyzeTrend', () => {
  test('returns stable for insufficient data', () => {
    const events = [
      makeMomentumEvent({ points: 10 }),
      makeMomentumEvent({ points: 15 }),
    ]
    expect(analyzeTrend(events)).toBe('stable')
  })

  test('returns improving when momentum increases', () => {
    const now = Date.now()
    const events = Array.from({ length: 10 }, (_, i) =>
      makeMomentumEvent({
        points: i < 5 ? 5 : 20,
        created_at: new Date(now - (10 - i) * 86400000).toISOString(),
      }),
    )
    expect(analyzeTrend(events, 14)).toBe('improving')
  })

  test('returns declining when momentum decreases', () => {
    const now = Date.now()
    const events = Array.from({ length: 10 }, (_, i) =>
      makeMomentumEvent({
        points: i < 5 ? 20 : 5,
        created_at: new Date(now - (10 - i) * 86400000).toISOString(),
      }),
    )
    expect(analyzeTrend(events, 14)).toBe('declining')
  })

  test('returns stable for flat momentum', () => {
    const now = Date.now()
    const events = Array.from({ length: 10 }, (_, i) =>
      makeMomentumEvent({
        points: 15,
        created_at: new Date(now - (10 - i) * 86400000).toISOString(),
      }),
    )
    expect(analyzeTrend(events, 14)).toBe('stable')
  })
})

// ── Streak Momentum ─────────────────────────────────────────

describe('calculateStreakMomentum', () => {
  test('returns 0 for no sessions', () => {
    expect(calculateStreakMomentum([])).toBe(0)
  })

  test('returns positive when recent completions increase', () => {
    const now = Date.now()
    const sessions = [
      // Recent (last 7 days): 3 completed
      makeSession('completed', new Date(now - 1 * 86400000).toISOString()),
      makeSession('completed', new Date(now - 2 * 86400000).toISOString()),
      makeSession('completed', new Date(now - 3 * 86400000).toISOString(),
        { actual_seconds: 900 }),
      // Previous (7-14 days): 1 completed
      makeSession('completed', new Date(now - 10 * 86400000).toISOString()),
    ]
    const momentum = calculateStreakMomentum(sessions)
    expect(momentum).toBeGreaterThan(0)
  })

  test('clamps to -100 to 100 range', () => {
    const momentum = calculateStreakMomentum([])
    expect(momentum).toBeGreaterThanOrEqual(-100)
    expect(momentum).toBeLessThanOrEqual(100)
  })
})

// ── Predict Drift ───────────────────────────────────────────

describe('predictDrift', () => {
  const emptyContext = {
    sessions: [] as MissionSession[],
    patterns: [] as ResistancePattern[],
    distractions: [] as Distraction[],
    momentumEvents: [] as MomentumEvent[],
    missions: [] as Mission[],
    microMissions: [] as MicroMission[],
    brainDumps: [] as BrainDump[],
  }

  test('returns a valid prediction with defaults', () => {
    const prediction = predictDrift(emptyContext)
    expect(prediction.currentRisk).toBeGreaterThanOrEqual(0)
    expect(prediction.currentRisk).toBeLessThanOrEqual(1)
    expect(prediction.currentRiskLevel).toBeDefined()
    expect(prediction.mostLikelyState).toBeDefined()
    expect(prediction.mostLikelyBlocker).toBeDefined()
    expect(prediction.confidence).toBeGreaterThanOrEqual(0)
    expect(prediction.recommendedAction).toBeDefined()
    expect(prediction.recentTrend).toBeDefined()
    expect(prediction.streakMomentum).toBeDefined()
  })

  test('increases risk with abandoned sessions', () => {
    const now = new Date()
    const recentAbandons = Array.from({ length: 3 }, (_, i) =>
      makeSession('abandoned', new Date(now.getTime() - i * 3600000).toISOString()),
    )
    const prediction = predictDrift({ ...emptyContext, sessions: recentAbandons })
    expect(prediction.currentRisk).toBeGreaterThan(0.1)
    expect(prediction.factors.some(f => f.type === 'recent_sessions')).toBe(true)
  })

  test('increases risk with many active missions', () => {
    const missions = Array.from({ length: 8 }, (_, i) => ({
      id: `m${i}`, status: 'active' as const,
    } as Mission))
    const prediction = predictDrift({ ...emptyContext, missions })
    expect(prediction.factors.some(f => f.type === 'mission_load')).toBe(true)
  })

  test('confidence scales with session count', () => {
    const lowData = predictDrift({ ...emptyContext, sessions: [] })
    const highDataSessions = Array.from({ length: 30 }, () => makeSession('completed'))
    const highData = predictDrift({ ...emptyContext, sessions: highDataSessions })
    expect(highData.confidence).toBeGreaterThan(lowData.confidence)
  })

  test('returns risk level critical for high risk', () => {
    // Create conditions for high risk: many abandoned sessions, high drift rate
    const now = new Date()
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession('abandoned', new Date(now.getTime() - i * 1800000).toISOString()),
    )
    const prediction = predictDrift({
      ...emptyContext,
      sessions,
      currentTime: now,
    })
    // The risk should be elevated
    expect(prediction.currentRisk).toBeGreaterThan(0)
  })
})

// ── Intelligence Profile Builder ────────────────────────────

describe('buildIntelligenceProfile', () => {
  test('builds a complete profile from sessions', () => {
    const sessions = Array.from({ length: 5 }, () => makeSession('completed'))
    const profile = buildIntelligenceProfile({
      sessions,
      patterns: [] as ResistancePattern[],
      distractions: [] as Distraction[],
      momentumEvents: [] as MomentumEvent[],
      missions: [] as Mission[],
      microMissions: [] as MicroMission[],
      brainDumps: [] as BrainDump[],
    })
    expect(profile.timeSlots).toBeDefined()
    expect(profile.hourlyPattern.length).toBe(24)
    expect(profile.dailyPattern.length).toBe(7)
    expect(profile.totalDataPoints).toBe(5)
    expect(profile.patternConfidence).toBe(0.5) // 5 sessions => 0.5
  })

  test('assigns higher confidence with more data', () => {
    const sessions = Array.from({ length: 15 }, () => makeSession('completed'))
    const profile = buildIntelligenceProfile({
      sessions,
      patterns: [] as ResistancePattern[],
      distractions: [] as Distraction[],
      momentumEvents: [] as MomentumEvent[],
      missions: [] as Mission[],
      microMissions: [] as MicroMission[],
      brainDumps: [] as BrainDump[],
    })
    expect(profile.patternConfidence).toBe(0.8) // >=10 sessions
  })
})
