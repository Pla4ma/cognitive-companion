// ══════════════════════════════════════════════════════════════
// INTENT — System Bridge
// Connects the seven islands of intelligence:
// Retention Engine ↔ Predictive Engine ↔ Notification Scheduler
// ↔ Coach AI ↔ Home Screen ↔ Onboarding ↔ Analytics
//
// This is the nervous system. Without it, each module is smart
// but disconnected. With it, the app feels alive.
// ══════════════════════════════════════════════════════════════

import type { MissionSession, ResistancePattern, Distraction, MomentumEvent, Mission, MicroMission, BrainDump, UserState } from '../types'
import type { RetentionState } from './retention/retentionEngine'
import { detectComeback, getSocialProofStat, getActivationCelebration, generateWeeklyNarrative } from './retention/retentionEngine'
import type { DriftPrediction, DangerWindow, UserIntelligenceProfile } from '../engine/predictiveEngine'
import { predictDrift, buildIntelligenceProfile } from '../engine/predictiveEngine'
import { scheduleOptimalTime, type NotificationType, type UserNotificationPatterns } from './notificationScheduler'
import type { QuietHoursConfig } from '../types/ambient'

// ── Prescription Types ─────────────────────────────────────

export type PrescriptionAction =
  | { type: 'show_ui_surface'; surface: string; data: Record<string, unknown> }
  | { type: 'schedule_notification'; notificationType: NotificationType }
  | { type: 'show_celebration'; message: string; submessage: string }
  | { type: 'show_social_proof'; proof: string }
  | { type: 'show_comeback'; message: string; daysAway: number }
  | { type: 'show_weekly_narrative'; narrative: string }
  | { type: 'suggest_brain_dump' }
  | { type: 'no_action' }

export interface RetentionPrescription {
  primary: PrescriptionAction
  secondary: PrescriptionAction | null
  shouldScheduleNotification: boolean
  notificationCopy: string | null
  reasoning: string
}

// ── System Event Types ─────────────────────────────────────

export type SystemEvent =
  | { type: 'session_completed'; session: MissionSession }
  | { type: 'session_abandoned'; session: MissionSession }
  | { type: 'session_salvaged'; session: MissionSession }
  | { type: 'app_opened'; source: 'cold_start' | 'warm_start' | 'notification' }
  | { type: 'comeback_detected'; daysAway: number }
  | { type: 'brain_dump_captured'; items: string[] }
  | { type: 'state_selected'; state: UserState }
  | { type: 'day_milestone'; day: 1 | 2 | 3 | 7 | 30 }

export interface SystemResponse {
  prescription: RetentionPrescription
  prediction: DriftPrediction | null
  notificationToSchedule: {
    type: NotificationType
    copy: string
    optimalTime: Date | null
  } | null
  uiInstruction: {
    surface: string
    data: Record<string, unknown>
    priority: number
  } | null
  analyticsEvent: {
    name: string
    properties: Record<string, unknown>
  } | null
}

// ── System Context (all data needed for decisions) ─────────

export interface SystemContext {
  retentionState: RetentionState
  sessions: MissionSession[]
  patterns: ResistancePattern[]
  distractions: Distraction[]
  momentumEvents: MomentumEvent[]
  missions: Mission[]
  microMissions: MicroMission[]
  brainDumps: BrainDump[]
  userPatterns: UserNotificationPatterns | null
  quietHours: QuietHoursConfig | null
  userName: string | null
}

// ── Internal: Prescribe Next Action ────────────────────────
// (Builds retention-aware prescriptions based on current state)

function prescribeNextAction(
  state: RetentionState,
  sessions: MissionSession[],
  brainDumps: BrainDump[],
  context: { event: string; isPostSession: boolean; isComeback: boolean; isAppOpen: boolean },
): RetentionPrescription {
  // ── Comeback detection ──
  if (context.isComeback) {
    const comeback = detectComeback(sessions, state.lastRescueDate)
    if (comeback.isComeback) {
      return {
        primary: { type: 'show_comeback', message: comeback.message, daysAway: comeback.daysAway },
        secondary: null,
        shouldScheduleNotification: false,
        notificationCopy: null,
        reasoning: `Comeback after ${comeback.daysAway} days away`,
      }
    }
  }

  // ── Activation celebration ──
  if (state.activated && state.activationData) {
    const celebration = getActivationCelebration(state)
    if (celebration.show && context.isPostSession) {
      return {
        primary: { type: 'show_celebration', message: celebration.message, submessage: celebration.submessage },
        secondary: state.totalRescues >= 3 ? { type: 'show_social_proof', proof: getSocialProofStat(null, true) ?? '' } : null,
        shouldScheduleNotification: true,
        notificationCopy: 'Your brain just learned a new pattern. Want to try again tomorrow?',
        reasoning: 'First rescue celebration + social proof',
      }
    }
  }

  // ── Post-session: social proof after 3+ rescues ──
  if (context.isPostSession && state.totalRescues >= 3 && !state.loopsActive.socialProofLoop) {
    const proof = getSocialProofStat(null, true)
    if (proof) {
      return {
        primary: { type: 'show_social_proof', proof },
        secondary: null,
        shouldScheduleNotification: true,
        notificationCopy: `${state.currentStreak}-day streak building. One more?`,
        reasoning: 'Social proof loop activation',
      }
    }
  }

  // ── Weekly narrative (revelation loop) ──
  if (context.isAppOpen && state.loopsActive.revelationLoop) {
    const narrative = generateWeeklyNarrative(sessions, [], null)
    if (narrative) {
      return {
        primary: { type: 'show_weekly_narrative', narrative },
        secondary: null,
        shouldScheduleNotification: false,
        notificationCopy: null,
        reasoning: 'Weekly narrative ready (revelation loop)',
      }
    }
  }

  // ── Brain dump suggestion (context loop) ──
  if (context.isAppOpen && !state.loopsActive.contextLoop) {
    const unprocessed = brainDumps.filter(bd => !bd.processed)
    if (unprocessed.length > 0) {
      return {
        primary: { type: 'suggest_brain_dump' },
        secondary: null,
        shouldScheduleNotification: false,
        notificationCopy: null,
        reasoning: 'Unprocessed brain dumps available',
      }
    }
  }

  // ── Streak at risk: schedule rescue notification ──
  if (state.currentStreak > 0 && context.isAppOpen) {
    const today = new Date().toISOString().slice(0, 10)
    const hadRescueToday = sessions.some(
      s => s.started_at.slice(0, 10) === today && (s.status === 'completed' || s.status === 'salvaged'),
    )
    if (!hadRescueToday) {
      return {
        primary: { type: 'no_action' },
        secondary: null,
        shouldScheduleNotification: true,
        notificationCopy: `${state.currentStreak}-day streak at risk. One tiny rescue?`,
        reasoning: 'Streak protection: no rescue today',
      }
    }
  }

  // ── Day 2 habit seeding ──
  if (state.activated && !state.day2.habitSeeded && context.isAppOpen) {
    return {
      primary: { type: 'no_action' },
      secondary: null,
      shouldScheduleNotification: true,
      notificationCopy: 'Your brain is learning a new pattern. Two minutes today?',
      reasoning: 'Day 2 habit seed notification',
    }
  }

  // ── Default: no special action ──
  return {
    primary: { type: 'no_action' },
    secondary: null,
    shouldScheduleNotification: false,
    notificationCopy: null,
    reasoning: 'No retention action needed',
  }
}

// ── Main Bridge Function ───────────────────────────────────

export function processSystemEvent(
  event: SystemEvent,
  context: SystemContext,
): SystemResponse {
  const { retentionState, sessions, patterns, distractions, momentumEvents, missions, microMissions, brainDumps, userPatterns, quietHours, userName } = context

  // 1. Get prescription from retention engine
  const prescriptionContext = {
    event: event.type,
    isPostSession: event.type === 'session_completed' || event.type === 'session_salvaged',
    isComeback: event.type === 'comeback_detected',
    isAppOpen: event.type === 'app_opened',
  }
  const prescription = prescribeNextAction(
    retentionState,
    sessions,
    brainDumps,
    prescriptionContext,
  )

  // 2. Run predictive engine (if enough data)
  let prediction: DriftPrediction | null = null
  if (sessions.length >= 5) {
    try {
      prediction = predictDrift({
        sessions,
        patterns,
        distractions,
        momentumEvents,
        missions,
        microMissions,
        brainDumps,
      })
    } catch {
      // Never crash from prediction
    }
  }

  // 3. Determine notification scheduling
  let notificationToSchedule: SystemResponse['notificationToSchedule'] = null
  if (prescription.shouldScheduleNotification && prescription.notificationCopy) {
    // Use predictive engine's danger windows for optimal timing
    let optimalTime: Date | null = null
    if (prediction?.nextDangerWindow) {
      const window = prediction.nextDangerWindow
      const now = new Date()
      const scheduled = new Date(now)
      scheduled.setHours(window.startHour, 0, 0, 0)
      if (scheduled <= now) scheduled.setDate(scheduled.getDate() + 1)
      // 10 minutes before danger window
      scheduled.setMinutes(scheduled.getMinutes() - 10)
      optimalTime = scheduled
    } else {
      const result = scheduleOptimalTime('rescue', userPatterns, quietHours)
      optimalTime = result.scheduledFor
    }
    notificationToSchedule = {
      type: 'rescue',
      copy: prescription.notificationCopy,
      optimalTime,
    }
  }

  // 4. UI instruction
  let uiInstruction: SystemResponse['uiInstruction'] = null
  if (prescription.primary.type === 'show_ui_surface') {
    uiInstruction = {
      surface: prescription.primary.surface,
      data: prescription.primary.data,
      priority: 1,
    }
  }

  // 5. Analytics event
  let analyticsEvent: SystemResponse['analyticsEvent'] = null
  if (event.type === 'session_completed') {
    analyticsEvent = {
      name: 'session_completed_with_system_response',
      properties: {
        prescriptionType: prescription.primary.type,
        riskLevel: prediction?.currentRiskLevel ?? 'unknown',
        loopsActive: Object.values(retentionState.loopsActive).filter(Boolean).length,
        momentumWindows: retentionState.momentumWindows,
      },
    }
  } else if (event.type === 'comeback_detected') {
    analyticsEvent = {
      name: 'comeback_with_system_response',
      properties: {
        daysAway: event.type === 'comeback_detected' ? event.daysAway : 0,
        prescriptionType: prescription.primary.type,
      },
    }
  }

  return {
    prescription,
    prediction,
    notificationToSchedule,
    uiInstruction,
    analyticsEvent,
  }
}

// ── Convenience: Get home screen intelligence ──────────────

export interface HomeIntelligence {
  greeting: string
  comebackMessage: string | null
  riskLevel: 'low' | 'moderate' | 'high' | 'critical' | null
  riskMessage: string | null
  nextDangerWindow: DangerWindow | null
  momentumSummary: { last7Days: number; trend: 'building' | 'stable' | 'cooling' }
  pendingBrainDumps: number
  loopStatus: { active: number; total: 7; nextToActivate: string }
  recommendedAction: string | null
  dayMilestone: number | null
  weeklyNarrative: string | null
}

export function getHomeIntelligence(context: SystemContext): HomeIntelligence {
  const { retentionState, sessions, brainDumps, patterns, distractions, momentumEvents, missions, microMissions, userName } = context

  // Greeting
  const hour = new Date().getHours()
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const greeting = `${timeGreeting}${userName ? `, ${userName}` : ''}`

  // Comeback
  const comeback = detectComeback(sessions, retentionState.lastRescueDate)

  // Prediction
  let riskLevel: HomeIntelligence['riskLevel'] = null
  let riskMessage: string | null = null
  let nextDangerWindow: DangerWindow | null = null
  let recommendedAction: string | null = null
  if (sessions.length >= 5) {
    try {
      const pred = predictDrift({ sessions, patterns, distractions, momentumEvents, missions, microMissions, brainDumps })
      riskLevel = pred.currentRiskLevel
      riskMessage = pred.recommendedAction
      nextDangerWindow = pred.nextDangerWindow
      recommendedAction = pred.recommendedAction
    } catch {}
  }

  // Momentum
  const last7Days = retentionState.momentumWindows.last7Days
  const trend = last7Days > 0 ? (last7Days >= 3 ? 'building' as const : 'stable' as const) : 'cooling' as const

  // Pending brain dumps
  const pendingBDs = brainDumps.filter(bd => !bd.processed).length

  // Loop status
  const activeLoops = Object.values(retentionState.loopsActive).filter(Boolean).length
  const nextLoop = !retentionState.loopsActive.rescueLoop ? 'Complete your first rescue'
    : !retentionState.loopsActive.momentumLoop ? 'Build momentum'
    : !retentionState.loopsActive.socialProofLoop ? '3 rescues for social proof'
    : !retentionState.loopsActive.insightLoop ? '5 sessions for insights'
    : !retentionState.loopsActive.revelationLoop ? 'Weekly summary coming'
    : !retentionState.loopsActive.comebackLoop ? 'Come back after a break'
    : !retentionState.loopsActive.contextLoop ? 'Use a brain dump'
    : 'All loops active!'

  // Day milestone
  const dayMilestone = retentionState.day1.activated ? null : 1

  // Weekly narrative (only if revelation loop is active)
  let weeklyNarrative: string | null = null
  if (retentionState.loopsActive.revelationLoop) {
    weeklyNarrative = generateWeeklyNarrative(sessions, patterns, userName)
  }

  return {
    greeting,
    comebackMessage: comeback.isComeback ? comeback.message : null,
    riskLevel,
    riskMessage,
    nextDangerWindow,
    momentumSummary: { last7Days, trend },
    pendingBrainDumps: pendingBDs,
    loopStatus: { active: activeLoops, total: 7, nextToActivate: nextLoop },
    recommendedAction,
    dayMilestone,
    weeklyNarrative,
  }
}

// ── Convenience: Get notification schedule recommendation ──

export function getRecommendedNotificationSchedule(
  context: SystemContext,
): { type: NotificationType; copy: string; scheduleFor: Date }[] {
  const { retentionState, sessions, patterns, distractions, momentumEvents, missions, microMissions, brainDumps, userPatterns, quietHours } = context
  const recommendations: { type: NotificationType; copy: string; scheduleFor: Date }[] = []

  // 1. If danger window approaching, schedule pre-window alert
  if (sessions.length >= 5) {
    try {
      const prediction = predictDrift({ sessions, patterns, distractions, momentumEvents, missions, microMissions, brainDumps })
      if (prediction.nextDangerWindow && prediction.timeToNextDanger > 0 && prediction.timeToNextDanger < 1440) {
        const window = prediction.nextDangerWindow
        const scheduleFor = new Date()
        scheduleFor.setHours(window.startHour - 1, 50, 0, 0)
        if (scheduleFor <= new Date()) scheduleFor.setDate(scheduleFor.getDate() + 1)
        recommendations.push({
          type: 'danger_window',
          copy: `Your ${window.primaryState} window is coming. ${prediction.mostLikelyBlocker !== 'unknown' ? `Watch for ${prediction.mostLikelyBlocker}.` : 'Stay ready.'}`,
          scheduleFor,
        })
      }
    } catch {}
  }

  // 2. If streak at risk (no rescue today), schedule evening nudge
  if (retentionState.currentStreak > 0) {
    const today = new Date().toISOString().slice(0, 10)
    const hadRescueToday = sessions.some(s => s.started_at.slice(0, 10) === today && (s.status === 'completed' || s.status === 'salvaged'))
    if (!hadRescueToday) {
      const result = scheduleOptimalTime('streak_protection', userPatterns, quietHours)
      if (result.scheduledFor) {
        recommendations.push({
          type: 'streak_protection',
          copy: `${retentionState.currentStreak}-day streak at risk. One tiny rescue?`,
          scheduleFor: result.scheduledFor,
        })
      }
    }
  }

  // 3. If day 2+ and no habit seeded, schedule gentle reminder
  if (retentionState.activated && !retentionState.day2.habitSeeded) {
    const result = scheduleOptimalTime('rescue', userPatterns, quietHours)
    if (result.scheduledFor) {
      recommendations.push({
        type: 'rescue',
        copy: 'Your brain is learning a new pattern. Two minutes today?',
        scheduleFor: result.scheduledFor,
      })
    }
  }

  return recommendations
}
