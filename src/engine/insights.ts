// INTENT — User Insights Engine
// Behavioral insights derived from user patterns:
//   - Drift Mirror (what saved the moment)
//   - Commandless Agent (context-based recommendations)
//   - Planning Loop Detector (planning vs. doing)

import type { UserState } from '../types/moment'
import type { MissionOutcome } from './missionEngines'

// ══════════════════════════════════════════════════════════════
// SECTION 1: Drift Mirror
// "The moment you almost lost and what saved it"
// ══════════════════════════════════════════════════════════════

export interface DriftMirrorInsight {
  id: string
  beforeState: UserState
  situation: string
  whatSavedIt: string
  newRule: string
  confidence: number
  shareSafeVersion: string
  createdAt: number
  rejected: boolean
}

export function generateDriftMirrorInsight(params: {
  state: UserState
  situation: string
  protocol: string
  outcome: MissionOutcome
  duration: number
}): DriftMirrorInsight {
  const stateLabel = stateToMirrorLabel(params.state)
  const outcomeGood = ['completed', 'partially_completed', 'started', 'salvaged'].includes(params.outcome)
  return {
    id: `mirror_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    beforeState: params.state,
    situation: `${stateLabel} + ${params.duration} min + ${params.situation}`,
    whatSavedIt: params.protocol,
    newRule: generateMirrorRule(params.state, params.protocol, outcomeGood),
    confidence: outcomeGood ? 0.6 : 0.3,
    shareSafeVersion: generateShareSafeMirror(stateLabel, params.protocol, outcomeGood),
    createdAt: Date.now(),
    rejected: false,
  }
}

function stateToMirrorLabel(state: UserState): string {
  const labels: Record<string, string> = {
    overwhelmed: 'Overwhelmed', stuck: 'Stuck', avoiding: 'About to avoid',
    tired: 'Low energy', anxious: 'Tense', doomscroll_risk: 'About to scroll',
    perfectionism: 'Overthinking', scattered: 'Scattered',
    shame_spiral: 'Hard moment', ready: 'Ready',
  }
  return labels[state] ?? 'In a moment'
}

function generateMirrorRule(state: UserState, protocol: string, success: boolean): string {
  if (!success) return `When ${state.toLowerCase()}, try a smaller version next time.`
  const rules: Partial<Record<UserState, string>> = {
    overwhelmed: `When overwhelmed, ${protocol.toLowerCase()} breaks the freeze`,
    stuck: `When stuck, ${protocol.toLowerCase()} gets motion going`,
    avoiding: `When avoiding, ${protocol.toLowerCase()} reduces the friction`,
    tired: `When tired, ${protocol.toLowerCase()} works without willpower`,
    doomscroll_risk: `Before scrolling, ${protocol.toLowerCase()} redirects momentum`,
    perfectionism: `When overthinking, ${protocol.toLowerCase()} bypasses the inner critic`,
  }
  return rules[state] ?? `${protocol.toLowerCase()} works in this kind of moment`
}

function generateShareSafeMirror(state: string, protocol: string, success: boolean): string {
  if (success) return `I was ${state.toLowerCase()} and a tiny action broke the pattern.`
  return `I was ${state.toLowerCase()} and tried. That matters.`
}

export function getMirrorTitle(): string { return 'Drift Mirror' }
export function getMirrorSubcopy(): string { return 'The moment you almost lost and what saved it' }
export function getMirrorRejectionCopy(): string { return 'Rule removed. INTENT will not suggest this again.' }
export function getMirrorAcceptanceCopy(): string { return 'Added to your playbook.' }

export function getCommonMirrorPatterns(): string[] {
  return [
    'You tend to plan when scared to start. Starting ugly works.',
    'You almost opened social apps, but a 2-minute mission broke the loop.',
    'You did not finish, but you came back. That pattern matters.',
    'Tiny starts work better for you than big sessions.',
    'Body double mode gets you moving when nothing else does.',
  ]
}

// ══════════════════════════════════════════════════════════════
// SECTION 2: Commandless Agent
// No state selection needed — recommends based on context
// ══════════════════════════════════════════════════════════════

export type DisplayMode = 'strong_recommendation' | 'gentle_suggestion' | 'ask_state' | 'comeback' | 'no_recommendation'
export type RecommendedSurface = 'app' | 'widget' | 'notification' | 'live_activity' | 'shortcut'

export interface CommandlessRecommendation {
  mission: string
  protocol: string
  confidence: number
  reason: string
  fallback: string
  displayMode: DisplayMode
  recommendedSurface: RecommendedSurface
  shouldUseAIEnhancement: boolean
  shouldShowStats: boolean
  shouldShowStateChips: boolean
  shouldShowPlanningLoopWarning: boolean
}

export const DAY_PART = {
  EARLY: { start: 5, end: 8, label: 'early_morning' },
  MORNING: { start: 8, end: 12, label: 'morning' },
  AFTERNOON: { start: 12, end: 17, label: 'afternoon' },
  EVENING: { start: 17, end: 21, label: 'evening' },
  NIGHT: { start: 21, end: 23, label: 'night' },
  DEEP_NIGHT: { start: 23, end: 5, label: 'deep_night' },
} as const

function getDayPart(hour: number): string {
  if (hour >= 5 && hour < 8) return 'early_morning'
  if (hour >= 8 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  if (hour >= 21 && hour < 23) return 'night'
  return 'deep_night'
}

function getDayPartRecommendation(dayPart: string): {
  mission: string; protocol: string; reason: string; surface: RecommendedSurface
} | null {
  const map: Record<string, { mission: string; protocol: string; reason: string; surface: RecommendedSurface }> = {
    early_morning: { mission: 'Start with one tiny action before the day begins', protocol: 'gentle_start', reason: 'Early morning sets the tone', surface: 'app' },
    morning: { mission: 'One clear action before the day takes over', protocol: 'focus_one', reason: 'Mornings have the highest completion rates', surface: 'widget' },
    afternoon: { mission: 'Reset focus with a 5-minute mission', protocol: 'shrink_the_beast', reason: 'Afternoon dip is common', surface: 'app' },
    evening: { mission: 'Close one open loop before the night', protocol: 'comeback', reason: 'Evenings are good for closure', surface: 'notification' },
    night: { mission: 'One tiny win before winding down', protocol: 'maintenance_spark', reason: 'Night rescues build momentum', surface: 'live_activity' },
    deep_night: { mission: 'Rest is productive too', protocol: 'rest', reason: 'Deep night is for recovery', surface: 'app' },
  }
  return map[dayPart] ?? null
}

// Weekday recommendations differ from weekend
function isWeekend(hour: number, totalMissions: number): boolean {
  const d = new Date().getDay()
  return (d === 0 || d === 6) && totalMissions > 0
}

interface CommandlessInput {
  state: UserState | null
  currentHour: number
  totalMissions: number
  totalDays: number
  lastOutcome: string | null
  hasActiveMission: boolean
  planningLoopDetected: boolean
  pendingContextCapsule: boolean
  recentRescueCount: number
  lastKnownState?: UserState | null   // state from the user's most recent session
  planningLoopCount?: number          // how many times planning loop was detected in last 7 days
  recentStreakDays?: number           // current streak length
}

export function generateCommandlessRecommendation(input: CommandlessInput): CommandlessRecommendation {
  const dayPart = getDayPart(input.currentHour)
  const isWknd = isWeekend(input.currentHour, input.totalMissions)

  // Active mission = always continue
  if (input.hasActiveMission) {
    return { mission: 'Continue your current mission', protocol: 'continue', confidence: 0.9, reason: 'You have an active mission', fallback: 'Start a new 2-minute mission', displayMode: 'strong_recommendation', recommendedSurface: 'app', shouldUseAIEnhancement: false, shouldShowStats: false, shouldShowStateChips: false, shouldShowPlanningLoopWarning: false }
  }

  // Escalated planning loop — frequent loop detector triggers
  if (input.planningLoopDetected && (input.planningLoopCount ?? 0) >= 3) {
    return { mission: 'Drop everything. Do one physical action. Now.', protocol: 'emergency_start', confidence: 0.9, reason: 'Recurring planning loop detected', fallback: 'Stand up. Walk 10 steps. That is the action.', displayMode: 'strong_recommendation', recommendedSurface: 'app', shouldUseAIEnhancement: false, shouldShowStats: false, shouldShowStateChips: false, shouldShowPlanningLoopWarning: true }
  }
  if (input.planningLoopDetected) {
    return { mission: 'One tiny action. No planning.', protocol: 'emergency_start', confidence: 0.8, reason: 'You have been planning without starting', fallback: '2-minute timer, any action', displayMode: 'strong_recommendation', recommendedSurface: 'app', shouldUseAIEnhancement: false, shouldShowStats: false, shouldShowStateChips: false, shouldShowPlanningLoopWarning: true }
  }

  // Pending context
  if (input.pendingContextCapsule) {
    return { mission: 'Start the first step from your context', protocol: 'context_to_mission', confidence: 0.7, reason: 'You have pending context to act on', fallback: 'Review context and pick one action', displayMode: 'gentle_suggestion', recommendedSurface: 'app', shouldUseAIEnhancement: true, shouldShowStats: false, shouldShowStateChips: false, shouldShowPlanningLoopWarning: false }
  }

  // Not enough data
  if (input.totalMissions < 3) {
    return { mission: '', protocol: '', confidence: 0, reason: 'Not enough data yet', fallback: 'Start with a 2-minute rescue', displayMode: 'ask_state', recommendedSurface: 'app', shouldUseAIEnhancement: false, shouldShowStats: false, shouldShowStateChips: true, shouldShowPlanningLoopWarning: false }
  }

  // Streak protection: if they have a streak, protect it
  if ((input.recentStreakDays ?? 0) >= 3 && input.recentRescueCount === 0 && input.currentHour >= 16) {
    return { mission: `Protect your ${input.recentStreakDays}-day streak with one tiny action`, protocol: 'comeback', confidence: 0.75, reason: 'Streak protection mode', fallback: '2-minute anything counts', displayMode: 'strong_recommendation', recommendedSurface: 'notification', shouldUseAIEnhancement: false, shouldShowStats: false, shouldShowStateChips: false, shouldShowPlanningLoopWarning: false }
  }

  // Time-of-day based recommendation (morning/afternoon/evening/night)
  const dayRec = getDayPartRecommendation(dayPart)
  if (dayRec && input.totalMissions >= 5) {
    return { mission: dayRec.mission, protocol: dayRec.protocol, confidence: 0.6, reason: dayRec.reason, fallback: '2-minute rescue', displayMode: 'gentle_suggestion', recommendedSurface: dayRec.surface, shouldUseAIEnhancement: true, shouldShowStats: true, shouldShowStateChips: dayPart === 'afternoon' || dayPart === 'evening', shouldShowPlanningLoopWarning: false }
  }

  // No rescues today in the evening
  if (input.currentHour >= 20 && input.recentRescueCount === 0) {
    return { mission: 'One tiny win before the night', protocol: 'comeback', confidence: 0.6, reason: 'No rescues today yet', fallback: '2-minute anything', displayMode: 'comeback', recommendedSurface: 'notification', shouldUseAIEnhancement: false, shouldShowStats: false, shouldShowStateChips: false, shouldShowPlanningLoopWarning: false }
  }

  // Weekend mode — less pressure, more maintenance
  if (isWknd && input.totalMissions >= 10) {
    return { mission: 'Weekend maintenance: one small reset', protocol: 'maintenance_spark', confidence: 0.5, reason: 'Weekend mode', fallback: '5-minute tidy or rest', displayMode: 'gentle_suggestion', recommendedSurface: 'app', shouldUseAIEnhancement: false, shouldShowStats: true, shouldShowStateChips: true, shouldShowPlanningLoopWarning: false }
  }

  // Default: state-aware time-of-day recommendation
  return { mission: 'Your easiest next move', protocol: 'default', confidence: 0.5, reason: 'Based on your patterns', fallback: '2-minute rescue', displayMode: 'gentle_suggestion', recommendedSurface: 'app', shouldUseAIEnhancement: true, shouldShowStats: true, shouldShowStateChips: true, shouldShowPlanningLoopWarning: false }
}

export function getCommandlessCopy(mode: DisplayMode): string {
  const copies: Record<DisplayMode, string> = {
    strong_recommendation: 'Start here?',
    gentle_suggestion: 'Your easiest next move',
    ask_state: 'What kind of moment is this?',
    comeback: 'Welcome back. One tiny win?',
    no_recommendation: '',
  }
  return copies[mode]
}

export function getCommandlessReasonCopy(reason: string): string {
  return `Based on: ${reason}`
}

// ══════════════════════════════════════════════════════════════
// SECTION 3: Planning Loop Detector
// Detects when planning replaces execution
// ══════════════════════════════════════════════════════════════

export interface PlanningLoopSignal {
  detected: boolean
  severity: 'low' | 'medium' | 'high'
  indicators: string[]
  timeInAppWithoutAction: number
  suggestedIntervention: string
  cycleCount: number
  escalationLevel: number
  urgentWindowTriggered: boolean
}

interface AppActivity {
  type: 'mission_edit' | 'goal_create' | 'coach_chat' | 'momentum_view' | 'mission_start' | 'mission_complete' | 'app_open'
  timestamp: number
}

// Persistent loop history for escalation tracking
let loopDetectionHistory: number[] = []

export function resetLoopHistory(): void { loopDetectionHistory = [] }
export function getLoopDetectionCount(days: number = 7): number {
  const cutoff = Date.now() - days * 86400000
  return loopDetectionHistory.filter((t) => t >= cutoff).length
}

const LOOP_INDICATORS = {
  missionEditsWithoutStart: 3,
  goalCreatesWithoutAction: 2,
  coachMessagesWithoutStart: 4,
  momentumViews: 3,
  minutesWithoutAction: 5,
}

export function detectPlanningLoop(activities: AppActivity[]): PlanningLoopSignal {
  const now = Date.now()
  const indicators: string[] = []
  let severity: 'low' | 'medium' | 'high' = 'low'

  // Dual-window detection: 5-min urgent window + 30-min subtle window
  const urgentWindow = 5 * 60 * 1000
  const subtleWindow = 30 * 60 * 1000
  const recentUrgent = activities.filter((a) => now - a.timestamp < urgentWindow)
  const recentSubtle = activities.filter((a) => now - a.timestamp < subtleWindow)
  const missionStartsUrgent = recentUrgent.filter((a) => a.type === 'mission_start').length
  const hasStartedUrgent = missionStartsUrgent > 0
  const hasStartedSubtle = recentSubtle.filter((a) => a.type === 'mission_start').length > 0

  // Urgent window signals (faster to detect, higher severity)
  const urgentEdits = recentUrgent.filter((a) => a.type === 'mission_edit').length
  const urgentGoals = recentUrgent.filter((a) => a.type === 'goal_create').length
  const urgentCoaching = recentUrgent.filter((a) => a.type === 'coach_chat').length

  if (urgentEdits >= 2 && !hasStartedUrgent) {
    indicators.push(`Edited ${urgentEdits}x in 5 min, no start`)
    if (urgentEdits >= 4) severity = 'high'; else severity = 'medium'
  }
  if (urgentGoals >= 2 && !hasStartedUrgent) {
    indicators.push(`Created ${urgentGoals} goals in 5 min, no action`)
    severity = 'medium'
  }
  if (urgentCoaching >= 3 && !hasStartedUrgent) {
    indicators.push(`${urgentCoaching} coach messages in 5 min, no start`)
    severity = 'high'
  }

  // Subtle window signals (slower accumulation, lower severity)
  const subtleEdits = recentSubtle.filter((a) => a.type === 'mission_edit').length
  const subtleGoals = recentSubtle.filter((a) => a.type === 'goal_create').length
  const subtleCoaching = recentSubtle.filter((a) => a.type === 'coach_chat').length
  const subtleMomentum = recentSubtle.filter((a) => a.type === 'momentum_view').length

  if (subtleEdits >= LOOP_INDICATORS.missionEditsWithoutStart && !hasStartedSubtle && indicators.length < 3) {
    indicators.push(`${subtleEdits} mission edits without starting (30m)`)
    if (severity === 'low') severity = 'medium'
  }
  if (subtleGoals >= LOOP_INDICATORS.goalCreatesWithoutAction && !hasStartedSubtle && indicators.length < 3) {
    indicators.push(`${subtleGoals} goals created without action (30m)`)
    if (severity === 'low') severity = 'medium'
  }
  if (subtleCoaching >= LOOP_INDICATORS.coachMessagesWithoutStart && !hasStartedSubtle && indicators.length < 3) {
    indicators.push(`${subtleCoaching} coach messages without starting (30m)`)
    severity = 'high'
  }
  if (subtleMomentum >= LOOP_INDICATORS.momentumViews) {
    indicators.push(`${subtleMomentum} momentum checks without action`)
  }

  // Time without any action
  const lastAction = recentSubtle.find((a) => a.type === 'mission_start' || a.type === 'mission_complete')
  const timeSinceAction = lastAction ? (now - lastAction.timestamp) / 60000 : 999
  if (timeSinceAction >= LOOP_INDICATORS.minutesWithoutAction) {
    indicators.push(`${Math.round(timeSinceAction)} minutes without starting`)
    if (timeSinceAction > 10) severity = 'high'
  }

  const detected = indicators.length >= 2
  const urgentWindowTriggered = indicators.length >= 2 && severity === 'high'

  // Escalation tracking
  if (detected) {
    loopDetectionHistory.push(now)
    // Trim old entries
    const cutoff = now - 7 * 86400000
    loopDetectionHistory = loopDetectionHistory.filter((t) => t >= cutoff)
  }
  const cycleCount = loopDetectionHistory.length
  const escalationLevel = Math.min(Math.floor(cycleCount / 3), 3)

  return {
    detected, severity, indicators,
    timeInAppWithoutAction: Math.round(timeSinceAction),
    suggestedIntervention: getIntervention(detected, severity, escalationLevel),
    cycleCount,
    escalationLevel,
    urgentWindowTriggered,
  }
}

function getIntervention(detected: boolean, severity: string, escalationLevel: number): string {
  if (!detected) return ''
  if (escalationLevel >= 2) return 'Pick for me. Now.'
  if (severity === 'high' && escalationLevel >= 1) return 'Close everything. Do one physical thing.'
  if (severity === 'high') return 'Pick for me'
  if (severity === 'medium') return 'Start 2-minute mission'
  return 'Want a tiny action?'
}

export function generatePlanningLoopCopy(signal: PlanningLoopSignal): string {
  if (!signal.detected) return ''
  if (signal.escalationLevel >= 2) {
    return 'You have been planning for a while across multiple sessions. Drop it. One physical action right now.'
  }
  if (signal.escalationLevel >= 1) {
    return 'This keeps happening. The pattern is planning without starting. Pick the tiniest action. Do only that.'
  }
  const copies = [
    'Planning might be replacing starting. Want a 2-minute action?',
    'You have been organizing for a while. Ready for one tiny step?',
    'The best plan is one tiny action. Start now?',
    'Enough planning. One small move?',
    'You are in a planning loop. Time to execute, not plan.',
  ]
  return copies[Math.floor(Math.random() * copies.length)]
}
