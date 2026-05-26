// ══════════════════════════════════════════════════════════════
// INTENT — Component Snapshot Tests
// Verifies key components render correctly in different states
// ══════════════════════════════════════════════════════════════

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(() => null),
    set: jest.fn(),
    getBoolean: jest.fn(() => false),
    getNumber: jest.fn(() => 0),
  })),
}))

jest.mock('expo-blur', () => {
  const React = require('react')
  return {
    BlurView: (props: any) => React.createElement('BlurView', props, props.children),
  }
})

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}))

jest.mock('lucide-react-native', () => {
  const React = require('react')
  const iconNames = ['Brain', 'Clock', 'TrendingUp', 'AlertTriangle', 'Shield']
  const mocks: Record<string, any> = {}
  for (const name of iconNames) {
    mocks[name] = (props: any) => React.createElement(name, props)
  }
  return { __esModule: true, ...mocks }
})

import React from 'react'
import { render } from '@testing-library/react-native'
import { IntelligenceCard } from '../components/IntelligenceCard'
import { DangerWindowHeatmap } from '../components/DangerWindowHeatmap'
import type { UserIntelligenceProfile, DriftPrediction, TimeSlot } from '../engine/predictiveEngine'

// ── Mock Data ──────────────────────────────────────────────

const mockProfile: UserIntelligenceProfile = {
  timeSlots: [],
  dangerWindows: [
    {
      startHour: 14,
      endHour: 16,
      dayOfWeek: 3,
      riskLevel: 'high',
      riskScore: 0.72,
      primaryState: 'avoiding',
      primaryBlocker: 'unknown',
      confidence: 0.8,
      sampleSize: 12,
    },
  ],
  resistanceMap: [
    {
      state: 'avoiding',
      blocker: 'unknown',
      frequency: 8,
      avgDuration: 15,
      bestStrategy: 'action_initiation',
      successRate: 0.65,
      lastOccurred: new Date().toISOString(),
      trendDirection: 'improving',
    },
  ],
  hourlyPattern: Array(24).fill(0.1),
  dailyPattern: Array(7).fill(0.1),
  avgSessionDuration: 12,
  avgAbandonTime: 8,
  recoveryTime: 45,
  mostProductiveHour: 10,
  leastProductiveHour: 15,
  totalDataPoints: 25,
  lastUpdated: new Date().toISOString(),
  patternConfidence: 0.7,
}

const mockPrediction: DriftPrediction = {
  currentRisk: 0.35,
  currentRiskLevel: 'moderate',
  mostLikelyState: 'avoiding',
  mostLikelyBlocker: 'unknown',
  nextDangerWindow: mockProfile.dangerWindows[0],
  timeToNextDanger: 120,
  recommendedAction: 'Try a 5-minute rescue before your danger window opens.',
  confidence: 0.7,
  factors: [
    { type: 'time_of_day', label: 'Afternoon dip', impact: 0.3, weight: 0.5 },
    { type: 'pattern_match', label: 'Recurring avoidance', impact: 0.4, weight: 0.3 },
  ],
  recentTrend: 'stable',
  streakMomentum: 15,
}

const mockTimeSlots: TimeSlot[] = [
  { hour: 14, dayOfWeek: 3, driftCount: 5, totalSessions: 8, driftRate: 0.625, avgResistance: 6, topState: 'avoiding', topBlocker: 'unknown' },
  { hour: 10, dayOfWeek: 1, driftCount: 1, totalSessions: 6, driftRate: 0.167, avgResistance: 3, topState: 'ready', topBlocker: 'unknown' },
]

// ── Tests ──────────────────────────────────────────────────

describe('Component Snapshots', () => {
  it('IntelligenceCard matches snapshot with full profile and prediction', () => {
    const tree = render(
      <IntelligenceCard profile={mockProfile} prediction={mockPrediction} />,
    )
    expect(tree.toJSON()).toMatchSnapshot()
  })

  it('IntelligenceCard matches snapshot with empty data', () => {
    const emptyProfile: UserIntelligenceProfile = {
      ...mockProfile,
      dangerWindows: [],
      resistanceMap: [],
      totalDataPoints: 0,
      patternConfidence: 0,
    }
    const emptyPrediction: DriftPrediction = {
      ...mockPrediction,
      currentRisk: 0,
      currentRiskLevel: 'low',
      nextDangerWindow: null,
      confidence: 0,
      factors: [],
    }
    const tree = render(
      <IntelligenceCard profile={emptyProfile} prediction={emptyPrediction} />,
    )
    expect(tree.toJSON()).toMatchSnapshot()
  })

  it('DangerWindowHeatmap matches snapshot with populated timeSlots', () => {
    const tree = render(<DangerWindowHeatmap timeSlots={mockTimeSlots} />)
    expect(tree.toJSON()).toMatchSnapshot()
  })

  it('DangerWindowHeatmap matches snapshot with empty timeSlots', () => {
    const tree = render(<DangerWindowHeatmap timeSlots={[]} />)
    expect(tree.toJSON()).toMatchSnapshot()
  })
})
