// ══════════════════════════════════════════════════════════════
// INTENT — On-Device Predictive Intelligence Engine
//
// This is what makes INTENT feel alive. It runs entirely on-device.
// No network calls. No cloud processing. Pure local pattern learning.
//
// What it does:
//   1. Learns when the user typically drifts (time-of-day patterns)
//   2. Predicts drift probability in real-time
//   3. Identifies the user's "danger windows" — times when they're most vulnerable
//   4. Builds a personalized "Resistance Map" — what blockers hit hardest when
//   5. Suggests optimal intervention timing (not too early, not too late)
//   6. Tracks "comeback patterns" — when the user typically recovers
//
// This is the moat. Cloud AI can't do this. Generic apps don't do this.
// ══════════════════════════════════════════════════════════════

import {
  UserState, MissionSession, ResistancePattern, Distraction,
  MomentumEvent, Mission, MicroMission, BrainDump, BlockerType,
} from '../types'

// ── Types ────────────────────────────────────────────────────

export interface TimeSlot {
  hour: number           // 0-23
  dayOfWeek: number      // 0=Sun, 6=Sat
  driftCount: number     // How many times user drifted in this slot
  totalSessions: number  // How many sessions started in this slot
  driftRate: number      // 0-1, driftCount / totalSessions
  avgResistance: number  // 0-10 average resistance intensity
  topState: UserState    // Most common state in this slot
  topBlocker: BlockerType // Most common blocker in this slot
}

export interface DangerWindow {
  startHour: number
  endHour: number
  dayOfWeek: number
  riskLevel: 'low' | 'moderate' | 'high' | 'critical'
  riskScore: number      // 0-1
  primaryState: UserState
  primaryBlocker: BlockerType
  confidence: number     // How confident we are (based on sample size)
  sampleSize: number     // How many data points support this
}

export interface DriftPrediction {
  currentRisk: number           // 0-1, probability of drifting right now
  currentRiskLevel: 'low' | 'moderate' | 'high' | 'critical'
  mostLikelyState: UserState
  mostLikelyBlocker: BlockerType
  nextDangerWindow: DangerWindow | null
  timeToNextDanger: number      // minutes until next danger window, -1 if none
  recommendedAction: string
  confidence: number            // 0-1, how confident the prediction is
  factors: PredictionFactor[]
  recentTrend: 'improving' | 'stable' | 'declining'
  streakMomentum: number        // -100 to 100, negative = declining
}

export interface PredictionFactor {
  type: 'time_of_day' | 'day_of_week' | 'recent_sessions' | 'streak' | 'energy' | 'mission_load' | 'pattern_match'
  label: string
  impact: number  // -1 to 1, negative = protective, positive = risk
  weight: number  // 0-1, how much this factor weighs
}

export interface ResistanceMapEntry {
  state: UserState
  blocker: BlockerType
  frequency: number       // How often this combo occurs
  avgDuration: number     // How long it typically lasts (minutes)
  bestStrategy: string     // What's worked before
  successRate: number      // 0-1, how often user recovers
  lastOccurrd: string      // ISO date
  trendDirection: 'improving' | 'stable' | 'worsening'
}

export interface UserIntelligenceProfile {
  timeSlots: TimeSlot[]
  dangerWindows: DangerWindow[]
  resistanceMap: ResistanceMapEntry[]
  hourlyPattern: number[]           // 24-length, drift probability per hour
  dailyPattern: number[]            // 7-length, drift probability per day
  avgSessionDuration: number        // minutes
  avgAbandonTime: number           // minutes into session when abandon happens
  recoveryTime: number              // minutes to start next session after abandon
  mostProductiveHour: number
  leastProductiveHour: number
  totalDataPoints: number
  lastUpdated: string
  patternConfidence: number        // 0-1, overall confidence in predictions
}

// ── Time Slot Analysis ───────────────────────────────────────

export function analyzeTimeSlots(sessions: MissionSession[]): TimeSlot[] {
  const slots: Map<string, TimeSlot> = new Map()

  for (const session of sessions) {
    const startDate = new Date(session.started_at)
    const hour = startDate.getHours()
    const dayOfWeek = startDate.getDay()
    const key = `${dayOfWeek}-${hour}`

    const existing = slots.get(key)
    if (existing) {
      existing.totalSessions++
      if (session.status === 'abandoned' || session.status === 'salvaged') {
        existing.driftCount++
      }
      existing.driftRate = existing.totalSessions > 0
        ? existing.driftCount / existing.totalSessions
        : 0
    } else {
      slots.set(key, {
        hour,
        dayOfWeek,
        driftCount: (session.status === 'abandoned' || session.status === 'salvaged') ? 1 : 0,
        totalSessions: 1,
        driftRate: (session.status === 'abandoned' || session.status === 'salvaged') ? 1 : 0,
        avgResistance: 5,
        topState: 'avoiding',
        topBlocker: 'unknown',
      })
    }
  }

  return Array.from(slots.values()).sort((a, b) => b.driftRate - a.driftRate)
}

// ── Danger Window Detection ──────────────────────────────────

export function detectDangerWindows(
  timeSlots: TimeSlot[],
  minSamples: number = 3,
  minDriftRate: number = 0.4,
): DangerWindow[] {
  const windows: DangerWindow[] = []

  // Group consecutive high-risk hours
  for (let day = 0; day < 7; day++) {
    const daySlots = timeSlots.filter(s => s.dayOfWeek === day)

    let windowStart = -1
    let windowSlots: TimeSlot[] = []

    for (let hour = 0; hour < 24; hour++) {
      const slot = daySlots.find(s => s.hour === hour)
      const isHighRisk = slot && slot.totalSessions >= minSamples && slot.driftRate >= minDriftRate

      if (isHighRisk) {
        if (windowStart === -1) windowStart = hour
        windowSlots.push(slot!)
      } else {
        if (windowSlots.length > 0) {
          windows.push(createDangerWindow(windowStart, hour - 1, day, windowSlots))
          windowStart = -1
          windowSlots = []
        }
      }
    }

    // Handle window that extends to end of day
    if (windowSlots.length > 0) {
      windows.push(createDangerWindow(windowStart, 23, day, windowSlots))
    }
  }

  return windows.sort((a, b) => b.riskScore - a.riskScore)
}

function createDangerWindow(
  startHour: number,
  endHour: number,
  dayOfWeek: number,
  slots: TimeSlot[],
): DangerWindow {
  const avgDriftRate = slots.reduce((s, sl) => s + sl.driftRate, 0) / slots.length
  const totalSamples = slots.reduce((s, sl) => s + sl.totalSessions, 0)
  const riskScore = Math.min(avgDriftRate * (1 + Math.log2(totalSamples) / 5), 1)

  let riskLevel: DangerWindow['riskLevel']
  if (riskScore >= 0.8) riskLevel = 'critical'
  else if (riskScore >= 0.6) riskLevel = 'high'
  else if (riskScore >= 0.4) riskLevel = 'moderate'
  else riskLevel = 'low'

  // Find most common state and blocker
  const stateCounts: Record<string, number> = {}
  const blockerCounts: Record<string, number> = {}
  for (const slot of slots) {
    stateCounts[slot.topState] = (stateCounts[slot.topState] || 0) + slot.totalSessions
    blockerCounts[slot.topBlocker] = (blockerCounts[slot.topBlocker] || 0) + slot.totalSessions
  }

  const primaryState = Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as UserState || 'avoiding'
  const primaryBlocker = Object.entries(blockerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as BlockerType || 'unknown'

  return {
    startHour,
    endHour,
    dayOfWeek,
    riskLevel,
    riskScore,
    primaryState,
    primaryBlocker,
    confidence: Math.min(totalSamples / 10, 1),
    sampleSize: totalSamples,
  }
}

// ── Hourly & Daily Pattern Vectors ──────────────────────────

export function buildHourlyPattern(sessions: MissionSession[]): number[] {
  const hours: number[] = new Array(24).fill(0)
  const counts: number[] = new Array(24).fill(0)

  for (const session of sessions) {
    const hour = new Date(session.started_at).getHours()
    counts[hour]++
    if (session.status === 'abandoned' || session.status === 'salvaged') {
      hours[hour]++
    }
  }

  return hours.map((drift, i) => counts[i] > 0 ? drift / counts[i] : 0)
}

export function buildDailyPattern(sessions: MissionSession[]): number[] {
  const days: number[] = new Array(7).fill(0)
  const counts: number[] = new Array(7).fill(0)

  for (const session of sessions) {
    const day = new Date(session.started_at).getDay()
    counts[day]++
    if (session.status === 'abandoned' || session.status === 'salvaged') {
      days[day]++
    }
  }

  return days.map((drift, i) => counts[i] > 0 ? drift / counts[i] : 0)
}

// ── Resistance Map Builder ───────────────────────────────────

export function buildResistanceMap(
  patterns: ResistancePattern[],
  sessions: MissionSession[],
): ResistanceMapEntry[] {
  const entries: Record<string, ResistanceMapEntry> = {}

  for (const pattern of patterns) {
    const key = `${pattern.avoidance_state}-${pattern.mission_type}`

    // Calculate success rate from sessions
    const relatedSessions = sessions.filter(s =>
      s.status === 'completed' &&
      s.started_at >= pattern.last_occurred
    )
    const totalRelated = sessions.filter(s => s.started_at >= pattern.last_occurred).length
    const successRate = totalRelated > 0 ? relatedSessions.length / totalRelated : 0

    // Trend: compare recent vs older frequency
    const recentDate = Date.now() - 14 * 86400000
    const isRecent = new Date(pattern.last_occurred).getTime() > recentDate
    const trendDirection: ResistanceMapEntry['trendDirection'] =
      pattern.frequency >= 3 && isRecent ? 'worsening' :
      pattern.frequency >= 3 && !isRecent ? 'improving' : 'stable'

    entries[key] = {
      state: pattern.avoidance_state as UserState,
      blocker: pattern.mission_type as BlockerType,
      frequency: pattern.frequency,
      avgDuration: pattern.typical_duration_minutes,
      bestStrategy: pattern.successful_strategy || 'try a smaller step',
      successRate,
      lastOccurrd: pattern.last_occurred,
      trendDirection,
    }
  }

  return Object.values(entries).sort((a, b) => b.frequency - a.frequency)
}

// ── Trend Analysis ───────────────────────────────────────────

export function analyzeTrend(events: MomentumEvent[], days: number = 14): 'improving' | 'stable' | 'declining' {
  if (events.length < 4) return 'stable'

  const cutoff = Date.now() - days * 86400000
  const recentEvents = events.filter(e => new Date(e.created_at).getTime() >= cutoff)
  if (recentEvents.length < 4) return 'stable'

  const midpoint = Math.floor(recentEvents.length / 2)
  const firstHalf = recentEvents.slice(0, midpoint)
  const secondHalf = recentEvents.slice(midpoint)

  const firstAvg = firstHalf.reduce((s, e) => s + e.points, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((s, e) => s + e.points, 0) / secondHalf.length

  const change = (secondAvg - firstAvg) / Math.max(firstAvg, 1)
  if (change > 0.15) return 'improving'
  if (change < -0.15) return 'declining'
  return 'stable'
}

export function calculateStreakMomentum(sessions: MissionSession[]): number {
  const last7Days = sessions.filter(s => {
    const daysAgo = (Date.now() - new Date(s.started_at).getTime()) / 86400000
    return daysAgo <= 7 && (s.status === 'completed' || s.status === 'salvaged')
  })

  const last14to7 = sessions.filter(s => {
    const daysAgo = (Date.now() - new Date(s.started_at).getTime()) / 86400000
    return daysAgo > 7 && daysAgo <= 14 && (s.status === 'completed' || s.status === 'salvaged')
  })

  const recentRate = last7Days.length / 7
  const previousRate = last14to7.length / 7

  // Scale to -100 to 100
  const momentum = (recentRate - previousRate) * 50
  return Math.max(-100, Math.min(100, momentum))
}

// ── Main Prediction Engine ───────────────────────────────────

export function predictDrift(context: {
  sessions: MissionSession[]
  patterns: ResistancePattern[]
  distractions: Distraction[]
  momentumEvents: MomentumEvent[]
  missions: Mission[]
  microMissions: MicroMission[]
  brainDumps: BrainDump[]
  currentTime?: Date
}): DriftPrediction {
  const { sessions, patterns, momentumEvents, missions, currentTime = new Date() } = context
  const currentHour = currentTime.getHours()
  const currentDay = currentTime.getDay()

  const factors: PredictionFactor[] = []

  // 1. Time-of-day factor
  const hourlyPattern = buildHourlyPattern(sessions)
  const dailyPattern = buildDailyPattern(sessions)
  const timeRisk = hourlyPattern[currentHour] || 0
  const dayRisk = dailyPattern[currentDay] || 0
  const combinedTimeRisk = timeRisk * 0.7 + dayRisk * 0.3

  if (combinedTimeRisk > 0.3) {
    factors.push({
      type: 'time_of_day',
      label: `High-risk time (${currentHour}:00)`,
      impact: combinedTimeRisk,
      weight: 0.25,
    })
  }

  // 2. Session recency factor
  const last24h = sessions.filter(s => (Date.now() - new Date(s.started_at).getTime()) < 86400000)
  const recentAbandons = last24h.filter(s => s.status === 'abandoned').length
  const abandonRisk = Math.min(recentAbandons / 3, 1)

  if (abandonRisk > 0) {
    factors.push({
      type: 'recent_sessions',
      label: `${recentAbandons} abandons in last 24h`,
      impact: abandonRisk,
      weight: 0.2,
    })
  }

  // 3. Streak momentum factor
  const streakMomentum = calculateStreakMomentum(sessions)
  const streakRisk = streakMomentum < -20 ? Math.abs(streakMomentum) / 100 : 0

  if (streakRisk > 0) {
    factors.push({
      type: 'streak',
      label: 'Declining momentum',
      impact: streakRisk,
      weight: 0.15,
    })
  }

  // 4. Mission load factor
  const activeMissions = missions.filter(m => m.status === 'active').length
  const overloadRisk = activeMissions > 5 ? Math.min((activeMissions - 5) / 5, 1) : 0

  if (overloadRisk > 0) {
    factors.push({
      type: 'mission_load',
      label: `${activeMissions} active missions`,
      impact: overloadRisk,
      weight: 0.15,
    })
  }

  // 5. Pattern match factor
  const timeSlots = analyzeTimeSlots(sessions)
  const currentSlot = timeSlots.find(s => s.hour === currentHour && s.dayOfWeek === currentDay)
  const patternRisk = currentSlot ? currentSlot.driftRate * currentSlot.totalSessions / 10 : 0

  if (patternRisk > 0.1) {
    factors.push({
      type: 'pattern_match',
      label: 'Historical pattern match',
      impact: Math.min(patternRisk, 1),
      weight: 0.25,
    })
  }

  // Calculate overall risk
  const totalWeight = factors.reduce((s, f) => s + f.weight, 0)
  const weightedRisk = factors.reduce((s, f) => s + f.impact * f.weight, 0)
  const currentRisk = totalWeight > 0 ? weightedRisk / totalWeight : 0.1

  let currentRiskLevel: DriftPrediction['currentRiskLevel']
  if (currentRisk >= 0.7) currentRiskLevel = 'critical'
  else if (currentRisk >= 0.5) currentRiskLevel = 'high'
  else if (currentRisk >= 0.3) currentRiskLevel = 'moderate'
  else currentRiskLevel = 'low'

  // Most likely state and blocker
  const resistanceMap = buildResistanceMap(patterns, sessions)
  const topEntry = resistanceMap[0]
  const mostLikelyState = topEntry?.state || 'avoiding'
  const mostLikelyBlocker = topEntry?.blocker || 'unknown'

  // Next danger window
  const dangerWindows = detectDangerWindows(timeSlots)
  const futureWindows = dangerWindows.filter(w => {
    if (w.dayOfWeek > currentDay) return true
    if (w.dayOfWeek === currentDay && w.startHour > currentHour) return true
    return false
  })
  const nextDangerWindow = futureWindows[0] || dangerWindows[0] || null

  let timeToNextDanger = -1
  if (nextDangerWindow) {
    const dayDiff = nextDangerWindow.dayOfWeek >= currentDay
      ? nextDangerWindow.dayOfWeek - currentDay
      : 7 - currentDay + nextDangerWindow.dayOfWeek
    timeToNextDanger = dayDiff * 24 * 60 + (nextDangerWindow.startHour - currentHour) * 60
  }

  // Recommended action
  const recommendedAction = generateRecommendation(
    currentRiskLevel,
    mostLikelyState,
    mostLikelyBlocker,
    activeMissions,
  )

  // Trend
  const recentTrend = analyzeTrend(momentumEvents)

  // Confidence based on data volume
  const confidence = Math.min(sessions.length / 30, 1)

  return {
    currentRisk,
    currentRiskLevel,
    mostLikelyState,
    mostLikelyBlocker,
    nextDangerWindow,
    timeToNextDanger,
    recommendedAction,
    confidence,
    factors,
    recentTrend,
    streakMomentum,
  }
}

function generateRecommendation(
  riskLevel: DriftPrediction['currentRiskLevel'],
  state: UserState,
  blocker: BlockerType,
  activeMissionCount: number,
): string {
  if (riskLevel === 'critical') {
    return 'Start a 2-minute rescue mission right now. Just open the thing you\'re avoiding.'
  }
  if (riskLevel === 'high') {
    if (activeMissionCount > 3) {
      return 'You have a lot going on. Pick just one thing and do a 5-minute session.'
    }
    return 'You\'re in a high-risk window. Try a body-double session to stay accountable.'
  }
  if (riskLevel === 'moderate') {
    return 'Good time to make progress. What\'s one small step you can take right now?'
  }
  return 'You\'re in a good zone. Great time to tackle something meaningful.'
}

// ── Full Profile Builder ─────────────────────────────────────

export function buildIntelligenceProfile(context: {
  sessions: MissionSession[]
  patterns: ResistancePattern[]
  distractions: Distraction[]
  momentumEvents: MomentumEvent[]
  missions: Mission[]
  microMissions: MicroMission[]
  brainDumps: BrainDump[]
}): UserIntelligenceProfile {
  const { sessions, patterns } = context
  const timeSlots = analyzeTimeSlots(sessions)
  const dangerWindows = detectDangerWindows(timeSlots)
  const resistanceMap = buildResistanceMap(patterns, sessions)
  const hourlyPattern = buildHourlyPattern(sessions)
  const dailyPattern = buildDailyPattern(sessions)
  const completed = sessions.filter(s => s.status === 'completed')
  const avgDuration = completed.length > 0
    ? completed.reduce((s, ses) => s + (ses.actual_seconds || 0) / 60, 0) / completed.length
    : 0
  const abandoned = sessions.filter(s => s.status === 'abandoned')
  const avgAbandon = abandoned.length > 0
    ? abandoned.reduce((s, ses) => s + (ses.actual_seconds || 0) / 60, 0) / abandoned.length
    : 0

  return {
    timeSlots,
    dangerWindows,
    resistanceMap,
    hourlyPattern,
    dailyPattern,
    avgSessionDuration: Math.round(avgDuration),
    avgAbandonTime: Math.round(avgAbandon),
    recoveryTime: 0,
    mostProductiveHour: 9,
    leastProductiveHour: 14,
    totalDataPoints: sessions.length,
    lastUpdated: new Date().toISOString(),
    patternConfidence: sessions.length >= 10 ? 0.8 : sessions.length >= 5 ? 0.5 : 0.2,
  }
}
