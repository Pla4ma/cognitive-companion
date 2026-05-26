// ══════════════════════════════════════════════════════════════
// INTENT — Notification Copy Template Tests
// Tests for state-aware notification content generation
// ══════════════════════════════════════════════════════════════

import {
  rescueCopy,
  streakCopy,
  streakProtectionCopy,
  summaryCopy,
  dangerWindowCopy,
} from '../services/notificationCopy'
import type { NotificationCopy, DailyStats } from '../services/notificationCopy'
import type { UserState } from '../types/moment'
import type { RescueProtocolId } from '../types/rescue'
import type { DangerWindow } from '../types/ambient'

// ── Rescue Copy Tests ───────────────────────────────────────

describe('notificationCopy', () => {
  describe('rescueCopy', () => {
    const allStates: UserState[] = [
      'avoiding', 'overwhelmed', 'stuck', 'tired', 'distracted',
      'anxious', 'scattered', 'ready', 'bored', 'perfectionism',
      'unclear', 'time_pressure', 'low_confidence', 'shame_spiral',
      'fake_productivity', 'planning_loop', 'doomscroll_risk',
    ]

    test.each(allStates)('returns valid copy for state: %s', (state) => {
      const copy = rescueCopy(state, 'two_minute_ignition')
      expect(copy.title).toBeDefined()
      expect(copy.title.length).toBeGreaterThan(0)
      expect(copy.body).toBeDefined()
      expect(copy.body.length).toBeGreaterThan(0)
      expect(copy.data.type).toBe('rescue')
      expect(copy.data.state).toBe(state)
      expect(copy.data.protocolId).toBe('two_minute_ignition')
    })

    test('includes mission title when provided', () => {
      const copy = rescueCopy('avoiding', 'two_minute_ignition', 'Biology Essay')
      expect(copy.body).toContain('Biology Essay')
    })

    test('data includes protocol and mission info', () => {
      const copy = rescueCopy('stuck', 'shrink_the_beast', 'Test Mission')
      expect(copy.data.protocolId).toBe('shrink_the_beast')
      expect(copy.data.missionTitle).toBe('Test Mission')
    })

    test('data has timestamp', () => {
      const copy = rescueCopy('avoiding', 'two_minute_ignition')
      expect(copy.data.timestamp).toBeDefined()
      expect(typeof copy.data.timestamp).toBe('string')
    })
  })

  // ── Streak Copy Tests ─────────────────────────────────────

  describe('streakCopy', () => {
    test('returns start streak message for 0 days', () => {
      const copy = streakCopy(0)
      expect(copy.title).toContain('Start')
      expect(copy.data.type).toBe('streak')
      expect(copy.data.days).toBe(0)
    })

    test('returns 1-day milestone', () => {
      const copy = streakCopy(1)
      expect(copy.title).toBeTruthy()
      expect(copy.data.milestone).toBe(1)
    })

    test('returns 3-day milestone', () => {
      const copy = streakCopy(3)
      expect(copy.title).toContain('3')
      expect(copy.data.milestone).toBe(3)
    })

    test('returns 7-day milestone', () => {
      const copy = streakCopy(7)
      expect(copy.title).toContain('Week')
      expect(copy.data.milestone).toBe(7)
    })

    test('returns 30-day milestone', () => {
      const copy = streakCopy(30)
      expect(copy.title).toContain('30')
      expect(copy.data.milestone).toBe(30)
    })

    test('returns 100-day milestone', () => {
      const copy = streakCopy(100)
      expect(copy.title).toContain('100')
      expect(copy.data.milestone).toBe(100)
    })

    test('returns highest matching milestone for intermediate values', () => {
      const copy = streakCopy(10)
      expect(copy.data.milestone).toBe(7)
    })

    test('streakProtectionCopy includes streak count', () => {
      const copy = streakProtectionCopy(5)
      expect(copy.data.type).toBe('streak_protection')
      expect(copy.body).toContain('5')
      expect(copy.title).toBeDefined()
    })

    test('streakProtectionCopy works with 0 days', () => {
      const copy = streakProtectionCopy(0)
      expect(copy.data.type).toBe('streak_protection')
    })
  })

  // ── Summary Copy Tests ────────────────────────────────────

  describe('summaryCopy', () => {
    test('generates summary for active day', () => {
      const stats: DailyStats = {
        sessionsCompleted: 3,
        totalMinutes: 45,
        streak: 5,
        missionsCompleted: 2,
        rescuesUsed: 1,
        bestSessionMinutes: 25,
      }
      const copy = summaryCopy(stats)
      expect(copy.title).toContain('3')
      expect(copy.body).toContain('45 min')
      expect(copy.body).toContain('5-day streak')
      expect(copy.data.type).toBe('daily_summary')
    })

    test('generates gentle summary for zero sessions', () => {
      const stats: DailyStats = {
        sessionsCompleted: 0,
        totalMinutes: 0,
        streak: 0,
        missionsCompleted: 0,
        rescuesUsed: 0,
        bestSessionMinutes: null,
      }
      const copy = summaryCopy(stats)
      expect(copy.title).toContain('Tomorrow')
      expect(copy.body).toContain('okay')
    })

    test('includes rescue count when rescues used', () => {
      const stats: DailyStats = {
        sessionsCompleted: 2,
        totalMinutes: 20,
        streak: 3,
        missionsCompleted: 1,
        rescuesUsed: 2,
        bestSessionMinutes: 15,
      }
      const copy = summaryCopy(stats)
      expect(copy.body).toContain('2 rescue')
    })

    test('includes mission count when missions completed', () => {
      const stats: DailyStats = {
        sessionsCompleted: 1,
        totalMinutes: 10,
        streak: 1,
        missionsCompleted: 1,
        rescuesUsed: 0,
        bestSessionMinutes: 10,
      }
      const copy = summaryCopy(stats)
      expect(copy.body).toContain('1 mission')
    })

    test('celebrates high session count', () => {
      const stats: DailyStats = {
        sessionsCompleted: 5,
        totalMinutes: 60,
        streak: 10,
        missionsCompleted: 3,
        rescuesUsed: 0,
        bestSessionMinutes: 20,
      }
      const copy = summaryCopy(stats)
      expect(copy.title).toContain('5')
      expect(copy.title).toContain('Sessions')
    })
  })

  // ── Danger Window Copy Tests ──────────────────────────────

  describe('dangerWindowCopy', () => {
    test('generates copy for avoiding danger window', () => {
      const window: DangerWindow = {
        id: 'dw1',
        label: 'Afternoon Slump',
        startTime: '14:00',
        endTime: '16:00',
        daysOfWeek: [1, 2, 3, 4, 5],
        usualState: 'avoiding',
        preferredProtocol: 'two_minute_ignition',
        preferredDuration: 5,
        enabled: true,
        source: 'learned_pattern',
        confidence: 0.8,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const copy = dangerWindowCopy(window)
      expect(copy.title).toBeDefined()
      expect(copy.body).toBeDefined()
      expect(copy.data.type).toBe('danger_window')
      expect(copy.data.windowId).toBe('dw1')
      expect(copy.data.windowLabel).toBe('Afternoon Slump')
    })

    test('generates copy for tired danger window', () => {
      const window: DangerWindow = {
        id: 'dw2',
        label: 'Evening Fatigue',
        startTime: '20:00',
        endTime: '22:00',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        usualState: 'tired',
        preferredProtocol: 'maintenance_spark',
        preferredDuration: 5,
        enabled: true,
        source: 'learned_pattern',
        confidence: 0.7,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const copy = dangerWindowCopy(window)
      expect(copy.body).toBeDefined()
      expect(copy.body.length).toBeGreaterThan(0)
    })

    test('falls back to generic body when state has no specific copy', () => {
      const window: DangerWindow = {
        id: 'dw3',
        label: 'Morning',
        startTime: '08:00',
        endTime: '10:00',
        daysOfWeek: [1, 2, 3, 4, 5],
        usualState: null,
        preferredProtocol: null,
        preferredDuration: null,
        enabled: true,
        source: 'user_defined',
        confidence: 0.5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const copy = dangerWindowCopy(window)
      expect(copy.body).toContain('Morning')
    })

    test('data includes all window metadata', () => {
      const window: DangerWindow = {
        id: 'dw4',
        label: 'Scroll Zone',
        startTime: '21:00',
        endTime: '23:00',
        daysOfWeek: [5, 6],
        usualState: 'doomscroll_risk',
        preferredProtocol: 'doomscroll_intercept',
        preferredDuration: 2,
        enabled: true,
        source: 'learned_pattern',
        confidence: 0.9,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const copy = dangerWindowCopy(window)
      expect(copy.data.windowId).toBe('dw4')
      expect(copy.data.usualState).toBe('doomscroll_risk')
      expect(copy.data.preferredProtocol).toBe('doomscroll_intercept')
      expect(copy.data.startTime).toBe('21:00')
      expect(copy.data.endTime).toBe('23:00')
    })
  })
})
