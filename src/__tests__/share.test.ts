// ══════════════════════════════════════════════════════════════
// INTENT — Share Service Tests
// Tests for weekly summary card, share text, rescue share text
// ══════════════════════════════════════════════════════════════

import {
  generateWeeklySummaryCard,
  buildShareText,
  buildRescueShareText,
} from '../services/share'

// ── Mock react-native Share ─────────────────────────────────

jest.mock('react-native', () => ({
  Share: {
    share: jest.fn(() => Promise.resolve({ action: 'sharedAction' })),
    sharedAction: 'sharedAction',
  },
  Platform: { OS: 'ios' },
}))

// ── generateWeeklySummaryCard Tests ─────────────────────────

describe('generateWeeklySummaryCard', () => {
  test('returns a valid card with all required fields', () => {
    const card = generateWeeklySummaryCard({
      sessions: 5,
      minutes: 120,
      streak: 3,
      rescues: 7,
      topState: 'avoiding',
    })

    expect(card.weekOf).toBeDefined()
    expect(typeof card.weekOf).toBe('string')
    expect(card.weekOf).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(card.sessions).toBe(5)
    expect(card.minutes).toBe(120)
    expect(card.streak).toBe(3)
    expect(card.rescues).toBe(7)
    expect(card.topState).toBe('avoiding')
  })

  test('defaults optional fields when not provided', () => {
    const card = generateWeeklySummaryCard({
      sessions: 3,
      minutes: 45,
    })

    expect(card.streak).toBe(0)
    expect(card.rescues).toBe(3) // defaults to sessions
    expect(card.topState).toBe('avoiding')
    expect(card.completionRate).toBeUndefined()
    expect(card.salvageRate).toBeUndefined()
  })

  test('includes completionRate and salvageRate when provided', () => {
    const card = generateWeeklySummaryCard({
      sessions: 10,
      minutes: 200,
      completionRate: 0.8,
      salvageRate: 0.2,
    })

    expect(card.completionRate).toBe(0.8)
    expect(card.salvageRate).toBe(0.2)
  })

  test('weekOf is a valid date string', () => {
    const card = generateWeeklySummaryCard({ sessions: 1, minutes: 10 })
    const date = new Date(card.weekOf)
    expect(date.toString()).not.toBe('Invalid Date')
  })
})

// ── buildShareText Tests ────────────────────────────────────

describe('buildShareText', () => {
  const sampleCard = generateWeeklySummaryCard({
    sessions: 8,
    minutes: 160,
    streak: 5,
    rescues: 10,
    topState: 'overwhelmed',
    completionRate: 0.75,
    salvageRate: 0.15,
  })

  test('produces a non-empty string', () => {
    const text = buildShareText(sampleCard)
    expect(text.length).toBeGreaterThan(0)
  })

  test('contains expected content keywords', () => {
    const text = buildShareText(sampleCard)
    expect(text).toContain('INTENT')
    expect(text).toContain('160 minutes rescued')
    expect(text).toContain('8 sessions completed')
    expect(text).toContain('overwhelmed')
    expect(text).toContain('intent.app')
  })

  test('includes streak when > 0', () => {
    const text = buildShareText(sampleCard)
    expect(text).toContain('5-day momentum')
  })

  test('includes rescues when different from sessions', () => {
    const text = buildShareText(sampleCard)
    expect(text).toContain('10 total rescues')
  })

  test('includes completion rate', () => {
    const text = buildShareText(sampleCard)
    expect(text).toContain('75% completion rate')
  })

  test('includes salvage rate when > 0', () => {
    const text = buildShareText(sampleCard)
    expect(text).toContain('15% salvage rate')
  })

  test('includes tagline', () => {
    const text = buildShareText(sampleCard)
    expect(text).toContain('No streaks. No shame. Just rescues.')
  })

  test('does not include streak when 0', () => {
    const card = generateWeeklySummaryCard({ sessions: 1, minutes: 10 })
    const text = buildShareText(card)
    expect(text).not.toContain('momentum')
  })

  test('does not include salvage rate when 0', () => {
    const card = generateWeeklySummaryCard({
      sessions: 1,
      minutes: 10,
      salvageRate: 0,
    })
    const text = buildShareText(card)
    expect(text).not.toContain('salvage rate')
  })
})

// ── buildRescueShareText Tests ──────────────────────────────

describe('buildRescueShareText', () => {
  test('includes state and minutes', () => {
    const text = buildRescueShareText({
      state: 'avoiding',
      minutes: 15,
    })

    expect(text).toContain('15 minutes')
    expect(text).toContain('avoiding')
  })

  test('includes protocol when provided', () => {
    const text = buildRescueShareText({
      state: 'overwhelmed',
      minutes: 10,
      protocol: 'shrink_the_beast',
    })

    expect(text).toContain('shrink_the_beast')
    expect(text).toContain('Using:')
  })

  test('does not include protocol line when not provided', () => {
    const text = buildRescueShareText({
      state: 'stuck',
      minutes: 5,
    })

    expect(text).not.toContain('Using:')
  })

  test('includes tagline and app link', () => {
    const text = buildRescueShareText({
      state: 'tired',
      minutes: 20,
    })

    expect(text).toContain('No streaks. No shame. Just rescues.')
    expect(text).toContain('intent.app')
  })

  test('produces non-empty string', () => {
    const text = buildRescueShareText({
      state: 'avoiding',
      minutes: 1,
    })

    expect(text.length).toBeGreaterThan(10)
  })

  test('contains the rescue emoji', () => {
    const text = buildRescueShareText({
      state: 'distracted',
      minutes: 8,
    })

    expect(text).toContain('🎯')
  })
})
