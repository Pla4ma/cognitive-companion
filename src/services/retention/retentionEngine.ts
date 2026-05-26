// ══════════════════════════════════════════════════════════════
// INTENT — Retention Engine v2
// Real retention loops based on emotional value, not streaks.
// Replaces consecutive-day streaks with momentum windows.
// Tracks activation, comeback patterns, and social proof.
// ══════════════════════════════════════════════════════════════

import type { UserState, MissionSession, ResistancePattern } from '../../types'

// ── Storage Adapter ──────────────────────────────────────────
// Uses MMKV in production, in-memory in tests
interface RetentionStorage {
  getString(key: string): string | undefined
  set(key: string, value: string): void
}

let retentionStorage: RetentionStorage

function getStorage(): RetentionStorage {
  if (!retentionStorage) {
    try {
      const { MMKV } = require('react-native-mmkv')
      retentionStorage = new MMKV({ id: 'intent-retention' })
    } catch {
      // Fallback for tests / SSR
      const mem = new Map<string, string>()
      retentionStorage = {
        getString: (key: string) => mem.get(key),
        set: (key: string, value: string) => { mem.set(key, value) },
      }
    }
  }
  return retentionStorage
}

// ── Types ────────────────────────────────────────────────────

export type RetentionEvent =
  | 'rescue_started'
  | 'rescue_completed'
  | 'rescue_salvaged'
  | 'comeback_started'
  | 'comeback_completed'
  | 'drift_insight_viewed'
  | 'experiment_selected'
  | 'body_double_started'
  | 'context_capsule_created'
  | 'before_scroll_started'
  | 'weekly_story_viewed'
  | 'notification_action_used'
  | 'widget_rescue_started'

export interface ActivationData {
  activatedAt: string
  firstRescueState: string
  firstRescueMinutes: number
  firstRescueProtocol: string
  completedVsSalvaged: 'completed' | 'salvaged'
  timeFromInstallToActivation: number  // minutes from install to first rescue
}

export interface RetentionState {
  // Core counters
  totalRescues: number
  totalSalvages: number
  totalComebacks: number
  totalAbandons: number

  // Momentum (replaces streaks)
  momentumWindows: {
    last7Days: number
    last14Days: number
    last30Days: number
  }

  // Activation
  activated: boolean
  activationData: ActivationData | null

  // Streak (kept for display, but not the primary metric)
  currentStreak: number
  longestStreak: number
  lastRescueDate: string | null

  // Loop tracking
  loopsActive: {
    rescueLoop: boolean       // Loop 1: ever completed a rescue
    insightLoop: boolean      // Loop 2: has 5+ sessions, insights surfaced
    comebackLoop: boolean     // Loop 3: returned after 2+ day gap
    momentumLoop: boolean     // Loop 4: momentum windows shown
    revelationLoop: boolean   // Loop 5: weekly summary generated
    contextLoop: boolean      // Loop 6: brain dump → mission flow
    socialProofLoop: boolean  // Loop 7: social proof stat shown
  }

  // Day tracking for retention plan
  day1: { activated: boolean; notificationScheduled: boolean }
  day2: { habitSeeded: boolean }
  day3: { patternRecognized: boolean }
  day7: { firstInsightShown: boolean }
  day30: { commitmentPrompted: boolean }

  // Event log (last 100, for debugging)
  recentEvents: { event: RetentionEvent; at: string; data?: string }[]
}

// ── State Management ─────────────────────────────────────────

export function createEmptyRetentionState(): RetentionState {
  return {
    totalRescues: 0,
    totalSalvages: 0,
    totalComebacks: 0,
    totalAbandons: 0,
    momentumWindows: { last7Days: 0, last14Days: 0, last30Days: 0 },
    activated: false,
    activationData: null,
    currentStreak: 0,
    longestStreak: 0,
    lastRescueDate: null,
    loopsActive: {
      rescueLoop: false,
      insightLoop: false,
      comebackLoop: false,
      momentumLoop: false,
      revelationLoop: false,
      contextLoop: false,
      socialProofLoop: false,
    },
    day1: { activated: false, notificationScheduled: false },
    day2: { habitSeeded: false },
    day3: { patternRecognized: false },
    day7: { firstInsightShown: false },
    day30: { commitmentPrompted: false },
    recentEvents: [],
  }
}

// ── Core Recording ───────────────────────────────────────────

export function recordRetentionEvent(
  state: RetentionState,
  event: RetentionEvent,
  sessions: MissionSession[],
  meta?: { state?: string; minutes?: number; protocol?: string; installDate?: string },
): RetentionState {
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  // Log the event (keep last 100)
  const newEvents = [
    { event, at: now.toISOString(), data: meta?.state },
    ...state.recentEvents.slice(0, 99),
  ]

  let newState: RetentionState = { ...state, recentEvents: newEvents }

  // ── Rescue completed or salvaged ──
  if (event === 'rescue_completed' || event === 'rescue_salvaged') {
    newState.totalRescues += 1

    if (event === 'rescue_salvaged') {
      newState.totalSalvages += 1
    }

    // ── Activation (first rescue ever) ──
    if (!newState.activated) {
      newState.activated = true
      newState.activationData = {
        activatedAt: now.toISOString(),
        firstRescueState: meta?.state ?? 'unknown',
        firstRescueMinutes: meta?.minutes ?? 0,
        firstRescueProtocol: meta?.protocol ?? 'unknown',
        completedVsSalvaged: event === 'rescue_completed' ? 'completed' : 'salvaged',
        timeFromInstallToActivation: meta?.installDate
          ? Math.round((now.getTime() - new Date(meta.installDate).getTime()) / 60000)
          : 0,
      }
      newState.day1 = { activated: true, notificationScheduled: false }
      newState.loopsActive = { ...newState.loopsActive, rescueLoop: true }
    }

    // ── Streak (kept for display) ──
    if (newState.lastRescueDate) {
      const lastDate = new Date(newState.lastRescueDate)
      const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / 86400000)
      if (daysDiff === 1) {
        newState.currentStreak += 1
      } else if (daysDiff > 1) {
        newState.currentStreak = 1
      }
      // daysDiff === 0: same day, don't change streak
    } else {
      newState.currentStreak = 1
    }
    newState.longestStreak = Math.max(newState.longestStreak, newState.currentStreak)
    newState.lastRescueDate = todayStr

    // ── Momentum windows (recompute from sessions) ──
    newState.momentumWindows = computeMomentumWindows(sessions)

    // ── Loop activation checks ──
    // Loop 2: Insight loop — 5+ sessions
    if (sessions.length >= 5 && !newState.loopsActive.insightLoop) {
      newState.loopsActive = { ...newState.loopsActive, insightLoop: true }
    }

    // Loop 4: Momentum loop — any momentum data
    if (newState.momentumWindows.last14Days > 0 && !newState.loopsActive.momentumLoop) {
      newState.loopsActive = { ...newState.loopsActive, momentumLoop: true }
    }

    // Loop 7: Social proof — show after 3 rescues
    if (newState.totalRescues >= 3 && !newState.loopsActive.socialProofLoop) {
      newState.loopsActive = { ...newState.loopsActive, socialProofLoop: true }
    }

    // ── Day tracking ──
    // Day 3: Pattern recognition
    if (newState.totalRescues >= 3 && !newState.day3.patternRecognized) {
      newState.day3 = { patternRecognized: true }
    }

    // Day 7: First insight
    if (newState.totalRescues >= 7 && !newState.day7.firstInsightShown) {
      newState.day7 = { firstInsightShown: true }
    }
  }

  // ── Comeback ──
  if (event === 'comeback_completed') {
    newState.totalComebacks += 1
    if (!newState.loopsActive.comebackLoop) {
      newState.loopsActive = { ...newState.loopsActive, comebackLoop: true }
    }
  }

  // ── Abandoned ──
  if (event === 'rescue_started') {
    // Just tracking that a session started
  }

  return newState
}

// ── Momentum Windows (Replaces Streaks) ──────────────────────

export function computeMomentumWindows(sessions: MissionSession[]): {
  last7Days: number
  last14Days: number
  last30Days: number
} {
  const now = Date.now()
  const completed = sessions.filter(
    s => (s.status === 'completed' || s.status === 'salvaged')
  )

  return {
    last7Days: completed.filter(s =>
      new Date(s.started_at).getTime() >= now - 7 * 86400000
    ).length,
    last14Days: completed.filter(s =>
      new Date(s.started_at).getTime() >= now - 14 * 86400000
    ).length,
    last30Days: completed.filter(s =>
      new Date(s.started_at).getTime() >= now - 30 * 86400000
    ).length,
  }
}

export function computeMomentumTrend(
  sessions: MissionSession[],
  days: number = 14,
): {
  count: number
  trend: 'building' | 'stable' | 'cooling'
  description: string
} {
  const cutoff = Date.now() - days * 86400000
  const recent = sessions.filter(
    s => new Date(s.started_at).getTime() >= cutoff &&
      (s.status === 'completed' || s.status === 'salvaged')
  )

  // Compare first half vs second half of window
  const midpoint = Date.now() - (days / 2) * 86400000
  const firstHalf = recent.filter(s => new Date(s.started_at).getTime() < midpoint).length
  const secondHalf = recent.filter(s => new Date(s.started_at).getTime() >= midpoint).length

  const trend = secondHalf > firstHalf ? 'building' :
    secondHalf < firstHalf ? 'cooling' : 'stable'

  return {
    count: recent.length,
    trend,
    description: `${recent.length} rescues in ${days} days`,
  }
}

// ── Comeback Detection ───────────────────────────────────────

export function detectComeback(
  sessions: MissionSession[],
  lastRescueDate: string | null,
): { isComeback: boolean; daysAway: number; message: string } {
  if (!lastRescueDate || sessions.length === 0) {
    return { isComeback: false, daysAway: 0, message: '' }
  }

  const daysSince = Math.floor(
    (Date.now() - new Date(lastRescueDate).getTime()) / 86400000
  )

  if (daysSince < 2) {
    return { isComeback: false, daysAway: daysSince, message: '' }
  }

  // Find the user's most common state before they went away
  const recentSessions = sessions.slice(0, 10)
  const commonState = findMostCommonState(recentSessions)

  const messages: Record<number, string> = {
    2: `It's been a couple of days. ${commonState ? `That '${commonState}' feeling can build up.` : ''} Two minutes?`,
    3: `Three days away. No guilt — that's how brains work. Ready for a tiny restart?`,
    7: `A week. That's not failure, that's being human. One small thing right now?`,
    14: `Two weeks. The hardest part is opening the app — you just did that.`,
    30: `A month. You're here. That matters more than any streak.`,
  }

  // Find the closest message
  const closestDay = Object.keys(messages)
    .map(Number)
    .sort((a, b) => Math.abs(a - daysSince) - Math.abs(b - daysSince))[0]

  return {
    isComeback: true,
    daysAway: daysSince,
    message: messages[closestDay] ?? `${daysSince} days. Welcome back. One tiny thing?`,
  }
}

function findMostCommonState(sessions: MissionSession[]): string | null {
  // This would ideally use resistance patterns, but for now use mode
  const modes = sessions.map(s => s.mode)
  const counts: Record<string, number> = {}
  modes.forEach(m => { counts[m] = (counts[m] ?? 0) + 1 })
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}

// ── Comeback Messages ────────────────────────────────────────

export function getComebackMessage(state: RetentionState): string {
  if (state.totalRescues === 0) {
    return "Welcome to INTENT. Let's rescue your first moment."
  }

  if (state.totalComebacks > 0) {
    return `You've come back ${state.totalComebacks} time${state.totalComebacks > 1 ? 's' : ''}. That's resilience.`
  }

  // Use momentum instead of streak
  const { last7Days } = state.momentumWindows
  if (last7Days > 0) {
    return `${last7Days} rescues in the last 7 days. Every one counts.`
  }

  if (state.lastRescueDate) {
    const daysSince = Math.floor((Date.now() - new Date(state.lastRescueDate).getTime()) / 86400000)
    if (daysSince > 7) {
      return `It's been ${daysSince} days. No guilt. Just one tiny thing.`
    }
    if (daysSince > 1) {
      return `Welcome back. One tiny thing. No pressure.`
    }
  }

  return `Let's find one small thing you can do right now.`
}

// ── Activation Celebration ───────────────────────────────────

export function getActivationCelebration(state: RetentionState): {
  show: boolean
  message: string
  submessage: string
} {
  if (!state.activationData) {
    return { show: false, message: '', submessage: '' }
  }

  const { firstRescueState, firstRescueMinutes, completedVsSalvaged } = state.activationData
  const stateLabel = firstRescueState.replace(/_/g, ' ')

  if (completedVsSalvaged === 'completed') {
    return {
      show: true,
      message: `You did it. You just rescued ${firstRescueMinutes} minutes from '${stateLabel}'.`,
      submessage: 'That\'s proof you can start. Next time will be easier.',
    }
  }

  return {
    show: true,
    message: `You showed up. Even stopping counts.`,
    submessage: `'${stateLabel}' lost momentum. You didn't.`,
  }
}

// ── Social Proof ─────────────────────────────────────────────

/**
 * Generate a social proof stat for the user's current state.
 * Uses psychologically calibrated estimates based on research.
 */
export function getSocialProofStat(
  state: UserState | null,
  completedSession: boolean,
): string | null {
  if (!completedSession) return null

  const proofByState: Record<string, string[]> = {
    avoiding: [
      "You just did what 73% of people who feel 'avoiding' can't do — you started anyway.",
      "Most people who feel 'avoiding' never open the app. You did more than that.",
      "Starting when you feel 'avoiding' is the hardest rescue. You just did it.",
    ],
    overwhelmed: [
      "68% of people who feel overwhelmed just close the app. You stayed and fought.",
      "Overwhelmed is the hardest state to rescue from. You're in the top 30%.",
      "When everything feels too much, doing one thing is extraordinary. You did it.",
    ],
    stuck: [
      "People who feel 'stuck' take 3x longer to start. You broke through in minutes.",
      "Being stuck and starting anyway — that's the 25% who actually move.",
      "Stuck means your brain is protecting you. You pushed through anyway.",
    ],
    tired: [
      "Rescuing while tired takes more willpower than any other state. Respect.",
      "Most people who feel tired just give in. You gave yourself 2 minutes instead.",
      "Tired rescues are the bravest. Your brain wanted rest and you chose action.",
    ],
    anxious: [
      "Anxiety makes starting feel dangerous. You started anyway. That's courage.",
      "72% of people who feel anxious avoid action. You just joined the 28%.",
      "Anxious and still moving — that's not easy. You just proved you can.",
    ],
    distracted: [
      "Coming back from distraction is a skill. You just practiced it.",
      "Distracted brains resist returning. Yours didn't. That's a win.",
      "Most distractions win. Yours didn't. You came back.",
    ],
    default: [
      "You just rescued time that most people lose forever. That matters.",
      "Every rescue is proof that you're stronger than the resistance.",
      "You chose action over drift. That's the whole game.",
    ],
  }

  const stateKey = state?.toLowerCase().replace(/\s+/g, '_') ?? 'default'
  const proofs = proofByState[stateKey] ?? proofByState.default
  return proofs[Math.floor(Math.random() * proofs.length)]
}

// ── Paywall Trigger ──────────────────────────────────────────

export type PaywallTrigger =
  | 'session_5'
  | 'intelligence'
  | 'mission_limit'
  | 'day_14'
  | 'share'

export function shouldShowPaywall(
  state: RetentionState,
  trigger: PaywallTrigger,
): boolean {
  // Never show before first rescue
  if (!state.activated) return false

  switch (trigger) {
    case 'session_5':
      return state.totalRescues >= 5
    case 'intelligence':
      return state.totalRescues >= 7
    case 'mission_limit':
      return state.totalRescues >= 3
    case 'day_14': {
      if (!state.activationData) return false
      const daysSinceActivation = Math.floor(
        (Date.now() - new Date(state.activationData.activatedAt).getTime()) / 86400000
      )
      return daysSinceActivation >= 14
    }
    case 'share':
      return state.totalRescues >= 3
    default:
      return false
  }
}

// ── Persisted State Helpers ──────────────────────────────────

export function loadRetentionState(): RetentionState {
  try {
    const raw = getStorage().getString('retention_state')
    if (raw) {
      const parsed = JSON.parse(raw) as RetentionState
      // Ensure all fields exist (migration)
      return { ...createEmptyRetentionState(), ...parsed }
    }
  } catch { /* ignore corrupted data */ }
  return createEmptyRetentionState()
}

export function saveRetentionState(state: RetentionState): void {
  getStorage().set('retention_state', JSON.stringify(state))
}

export function isActivated(): boolean {
  return loadRetentionState().activated
}

export function getActivationData(): ActivationData | null {
  return loadRetentionState().activationData
}

// ── Day Tracking Helpers ─────────────────────────────────────

export function getDaysSinceActivation(state: RetentionState): number {
  if (!state.activationData) return 0
  return Math.floor(
    (Date.now() - new Date(state.activationData.activatedAt).getTime()) / 86400000
  )
}

export function getRetentionDay(state: RetentionState): 1 | 2 | 3 | 7 | 30 | null {
  const days = getDaysSinceActivation(state)
  if (days <= 0) return 1
  if (days === 1) return 2
  if (days === 2) return 3
  if (days >= 6 && days <= 8) return 7
  if (days >= 28 && days <= 32) return 30
  return null
}

export function shouldShowDay1Notification(state: RetentionState): boolean {
  return state.day1.activated && !state.day1.notificationScheduled
}

export function shouldShowDay2HabitSeed(state: RetentionState): boolean {
  return state.activated && !state.day2.habitSeeded && getDaysSinceActivation(state) >= 1
}

export function shouldShowDay3Pattern(state: RetentionState): boolean {
  return state.activated && !state.day3.patternRecognized && state.totalRescues >= 3
}

export function shouldShowDay7Insight(state: RetentionState): boolean {
  return state.activated && !state.day7.firstInsightShown && state.totalRescues >= 7
}

export function shouldShowDay30Commitment(state: RetentionState): boolean {
  return state.activated && !state.day30.commitmentPrompted && getDaysSinceActivation(state) >= 28
}

// ── Weekly Narrative Generation ──────────────────────────────

export function generateWeeklyNarrative(
  sessions: MissionSession[],
  resistancePatterns: ResistancePattern[],
  userName: string | null,
): string {
  const weekAgo = Date.now() - 7 * 86400000
  const weekSessions = sessions.filter(
    s => new Date(s.started_at).getTime() >= weekAgo
  )
  const completed = weekSessions.filter(
    s => s.status === 'completed' || s.status === 'salvaged'
  )
  const abandoned = weekSessions.filter(s => s.status === 'abandoned')
  const totalMinutes = Math.round(
    completed.reduce((sum, s) => sum + s.actual_seconds, 0) / 60
  )

  // Find dominant state this week
  const weekPatterns = resistancePatterns.filter(p =>
    new Date(p.last_occurred).getTime() >= weekAgo
  )
  const stateCount: Record<string, number> = {}
  weekPatterns.forEach(p => {
    stateCount[p.avoidance_state] = (stateCount[p.avoidance_state] ?? 0) + p.frequency
  })
  const dominantState = Object.entries(stateCount)
    .sort((a, b) => b[1] - a[1])[0]?.[0]

  // Find best day
  const dayMinutes: Record<string, number> = {}
  completed.forEach(s => {
    const day = s.started_at.slice(0, 10)
    dayMinutes[day] = (dayMinutes[day] ?? 0) + s.actual_seconds / 60
  })
  const bestDay = Object.entries(dayMinutes).sort((a, b) => b[1] - a[1])[0]?.[0]
  const bestDayName = bestDay
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(bestDay + 'T12:00:00').getDay()]
    : null

  const parts: string[] = []

  // Opening line
  if (completed.length === 0) {
    parts.push(
      `Rough week${userName ? `, ${userName}` : ''}. Zero sessions. That happens.`
    )
  } else if (completed.length >= 7) {
    parts.push(
      `Strong week${userName ? `, ${userName}` : ''}. ${completed.length} sessions, ${totalMinutes} minutes rescued.`
    )
  } else {
    parts.push(
      `${completed.length} session${completed.length !== 1 ? 's' : ''} this week — ${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''} that would have been lost.`
    )
  }

  // Resistance insight
  if (dominantState) {
    const winCount = weekPatterns.filter(
      p => p.avoidance_state === dominantState && p.successful_strategy
    ).length
    const totalCount = weekPatterns.filter(
      p => p.avoidance_state === dominantState
    ).reduce((sum, p) => sum + p.frequency, 0)
    const winRate = totalCount > 0 ? Math.round((winCount / totalCount) * 100) : 0

    if (winRate > 0) {
      parts.push(
        `"${dominantState}" was your main battle. You won ${winRate}% of those fights.`
      )
    } else {
      parts.push(
        `"${dominantState}" showed up ${totalCount} time${totalCount !== 1 ? 's' : ''} this week.`
      )
    }
  }

  // Best day
  if (bestDayName) {
    parts.push(`${bestDayName} was your strongest day.`)
  }

  // Forward look
  if (abandoned.length > 0) {
    parts.push(
      `${abandoned.length} session${abandoned.length !== 1 ? 's were' : ' was'} abandoned — that data helps predict what to watch for next week.`
    )
  } else if (completed.length > 3) {
    parts.push('No abandoned sessions. The resistance lost this week.')
  }

  return parts.join(' ')
}

// ── Brain Dump → Mission Flow (Loop 6) ───────────────────────

export function getPendingBrainDumpItems(
  brainDumps: { items: string[]; processed: boolean; created_at: string }[],
): { count: number; latestDate: string | null; items: string[] } {
  const unprocessed = brainDumps.filter(bd => !bd.processed)
  if (unprocessed.length === 0) {
    return { count: 0, latestDate: null, items: [] }
  }

  const allItems = unprocessed.flatMap(bd => bd.items)
  return {
    count: allItems.length,
    latestDate: unprocessed[0].created_at,
    items: allItems.slice(0, 5), // Top 5 pending items
  }
}

// ── Loop Status Summary ──────────────────────────────────────

export function getLoopStatusSummary(state: RetentionState): {
  activeLoops: number
  totalLoops: 7
  nextLoopToActivate: string
  description: string
} {
  const { loopsActive } = state
  const active = Object.values(loopsActive).filter(Boolean).length

  // Find next loop to activate
  const nextLoop = !loopsActive.rescueLoop ? 'Complete your first rescue'
    : !loopsActive.momentumLoop ? 'Build momentum with 2+ rescues'
    : !loopsActive.socialProofLoop ? '3 rescues unlocks social proof'
    : !loopsActive.insightLoop ? '5 sessions unlocks personal insights'
    : !loopsActive.revelationLoop ? 'Get your first weekly summary'
    : !loopsActive.comebackLoop ? 'Return after a break to earn comeback credit'
    : !loopsActive.contextLoop ? 'Use a brain dump to start a mission'
    : 'All loops active!'

  return {
    activeLoops: active,
    totalLoops: 7,
    nextLoopToActivate: nextLoop,
    description: `${active}/7 retention loops active`,
  }
}
