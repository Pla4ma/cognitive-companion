// ══════════════════════════════════════════════════════════════
// INTENT — Notification Copy Templates
// State-aware, warm, non-shaming notification content
// Each function returns { title, body, data } for scheduling
// ══════════════════════════════════════════════════════════════

import type { UserState } from '../types/moment'
import type { RescueProtocolId, RescueProtocol } from '../types/rescue'
import type { DangerWindow } from '../types/ambient'
import type { DangerWindow as PredictiveDangerWindow } from '../engine/predictiveEngine'

// ── Shared Types ─────────────────────────────────────────────

export interface NotificationCopy {
  title: string
  body: string
  data: Record<string, unknown>
}

// ── Rescue Copy ──────────────────────────────────────────────
// State-aware rescue messages for mission follow-ups

const STATE_RESCUE_TITLES: Record<UserState, string[]> = {
  avoiding: ['Tiny restart?', 'One small move?', 'Ready to begin?'],
  overwhelmed: ['Shrink it down?', 'One piece only?', 'Make it tiny?'],
  stuck: ['Start together?', 'First step ready?', 'A gentle push?'],
  tired: ['Low-energy start?', 'Just 1 minute?', 'Easy does it?'],
  distracted: ['Back to it?', 'One focus moment?', 'Return to your mission?'],
  anxious: ['Breathe first?', 'One tiny step?', 'Lower the bar?'],
  scattered: ['Pick one thing?', 'One clear move?', 'Focus the fog?'],
  ready: ['Time to go!', 'Your mission awaits!', 'Let\'s build momentum!'],
  bored: ['Tiny challenge?', '2-minute spark?', 'Something new?'],
  perfectionism: ['Make it ugly?', 'Rough draft first?', 'Done > perfect?'],
  unclear: ['Name one step?', 'What\'s next?', 'One clear action?'],
  time_pressure: ['Define "enough"?', 'Smallest version?', 'Quick win?'],
  low_confidence: ['You\'ve done harder.', 'Tiny is enough.', 'Start anyway.'],
  shame_spiral: ['No guilt. Just start.', 'You\'re here now.', 'One small thing.'],
  fake_productivity: ['Do the real thing.', 'One action, not a plan.', 'Execute now?'],
  planning_loop: ['Stop planning. Start.', 'One action now.', 'Close the notebook.'],
  doomscroll_risk: ['Before you scroll...', '2 minutes first?', 'One tiny win?'],
}

const STATE_RESCUE_BODIES: Record<UserState, string[]> = {
  avoiding: [
    'Just open the file. That counts.',
    'The smallest possible version is waiting.',
    'You don\'t need to finish. Just start.',
  ],
  overwhelmed: [
    'What\'s the ONE thing that matters most right now?',
    'Ignore everything else. One piece.',
    'Pick the smallest piece and ignore the rest.',
  ],
  stuck: [
    'I\'ll stay with you. Just begin.',
    'You don\'t have to figure it all out.',
    'One physical action. I\'ll wait.',
  ],
  tired: [
    'Even 30 seconds of effort counts.',
    'Low energy? Match it with a tiny task.',
    'Rest is valid. But if you want to try...',
  ],
  distracted: [
    'Write down the distraction. Return to mission.',
    'Your mission is still there when you\'re ready.',
    'Lock back in. You were making progress.',
  ],
  anxious: [
    'Lower the bar until it feels doable.',
    'You don\'t have to do it well. Just do it.',
    'One breath. One small action.',
  ],
  scattered: [
    'Write down 3 things. Pick one.',
    'What\'s pulling your attention? Name it, then choose.',
    'One clear next step is all you need.',
  ],
  ready: [
    'You\'re in a good state. Use it!',
    'Channel this energy into your mission.',
    'Start now while the momentum is here.',
  ],
  bored: [
    'A tiny challenge might help.',
    'What if you tried it differently?',
    '2 minutes of something new?',
  ],
  perfectionism: [
    'Make a bad version on purpose.',
    'Ugly first. Polish later.',
    'What would "good enough" look like?',
  ],
  unclear: [
    'What\'s the very next physical action?',
    'Describe it in one sentence.',
    'If you could only do ONE thing...',
  ],
  time_pressure: [
    'What does "done" look like in 5 minutes?',
    'Reduce scope. Define enough.',
    'Smallest version that still counts.',
  ],
  low_confidence: [
    'You\'ve started before. You can again.',
    'Tiny steps build confidence.',
    'No one is watching. Just try.',
  ],
  shame_spiral: [
    'You\'re here. That\'s the win.',
    'No judgment. One tiny restart.',
    'The past doesn\'t matter. Right now does.',
  ],
  fake_productivity: [
    'Planning feels productive. Is it?',
    'Close the planner. Open the work.',
    'One real action > 10 planned ones.',
  ],
  planning_loop: [
    'You have a plan. Execute one step.',
    'Stop planning. Start doing.',
    'The plan is good enough. Go.',
  ],
  doomscroll_risk: [
    'One tiny win before you scroll?',
    '2 minutes. Then scroll if you want.',
    'Choose to scroll. Don\'t fall into it.',
  ],
}

const PROTOCOL_RESCUE_TITLES: Partial<Record<RescueProtocolId, string>> = {
  two_minute_ignition: '2-Minute Ignition',
  ugly_first_move: 'Ugly First Move',
  clear_the_fog: 'Clear the Fog',
  shrink_the_beast: 'Shrink the Beast',
  lock_the_door: 'Lock the Door',
  maintenance_spark: 'Maintenance Spark',
  pressure_valve: 'Pressure Valve',
  body_double_start: 'Body Double Start',
  decision_breaker: 'Decision Breaker',
  comeback_seed: 'Comeback Seed',
  planning_loop_breaker: 'Planning Loop Breaker',
  doomscroll_intercept: 'Doomscroll Intercept',
}

export function rescueCopy(
  state: UserState,
  protocolId: RescueProtocolId,
  missionTitle?: string,
): NotificationCopy {
  const titles = STATE_RESCUE_TITLES[state] ?? STATE_RESCUE_TITLES.avoiding
  const bodies = STATE_RESCUE_BODIES[state] ?? STATE_RESCUE_BODIES.avoiding

  const title = pickRandom(titles)
  let body = pickRandom(bodies)

  // Personalize with mission title if available
  if (missionTitle) {
    body = `${body} (${missionTitle})`
  }

  return {
    title,
    body,
    data: {
      type: 'rescue',
      state,
      protocolId,
      missionTitle: missionTitle ?? null,
      timestamp: new Date().toISOString(),
    },
  }
}

// ── Streak Copy ──────────────────────────────────────────────
// Streak protection and celebration messages

interface StreakMilestone {
  threshold: number
  title: string
  body: string
}

const STREAK_MILESTONES: StreakMilestone[] = [
  { threshold: 0, title: 'Start Your Streak', body: 'Complete one focus session today to begin your streak!' },
  { threshold: 1, title: 'Streak Started! 🔥', body: '1 day down. Keep it going tomorrow!' },
  { threshold: 3, title: '3-Day Streak! 🔥', body: 'You\'re building momentum. Don\'t stop now!' },
  { threshold: 7, title: '1-Week Streak! 🔥🔥', body: 'A full week! You\'re making this a habit.' },
  { threshold: 14, title: '2-Week Streak! 🔥🔥🔥', body: 'Two weeks strong. You\'re proving something.' },
  { threshold: 30, title: '30-Day Streak! 🏆', body: 'A month of consistency. Incredible.' },
  { threshold: 60, title: '60-Day Streak! 🏆🏆', body: 'Two months! This is who you are now.' },
  { threshold: 100, title: '100-Day Streak! 💎', body: 'Triple digits. You\'re unstoppable.' },
]

const STREAK_PROTECTION_TITLES = [
  'Streak Needs You! 🔥',
  'Don\'t Break the Chain!',
  'Your Streak is Waiting',
  'One Session Saves It',
]

const STREAK_PROTECTION_BODIES = [
  'Complete one focus session today to keep your streak alive.',
  'You haven\'t focused yet today. Your streak is counting on you.',
  'A quick session is all it takes to protect your streak.',
  'Don\'t let yesterday\'s effort go to waste.',
]

export function streakCopy(days: number): NotificationCopy {
  // Find the highest matching milestone
  const milestone = [...STREAK_MILESTONES]
    .reverse()
    .find((m) => days >= m.threshold) ?? STREAK_MILESTONES[0]

  return {
    title: milestone.title,
    body: milestone.body,
    data: {
      type: 'streak',
      days,
      milestone: milestone.threshold,
      timestamp: new Date().toISOString(),
    },
  }
}

export function streakProtectionCopy(days: number): NotificationCopy {
  const title = pickRandom(STREAK_PROTECTION_TITLES)
  let body = pickRandom(STREAK_PROTECTION_BODIES)

  if (days > 0) {
    body = `${days}-day streak at risk! ${body}`
  }

  return {
    title,
    body,
    data: {
      type: 'streak_protection',
      currentStreak: days,
      timestamp: new Date().toISOString(),
    },
  }
}

// ── Daily Summary Copy ───────────────────────────────────────

export interface DailyStats {
  sessionsCompleted: number
  totalMinutes: number
  streak: number
  missionsCompleted: number
  rescuesUsed: number
  bestSessionMinutes: number | null
}

const SUMMARY_ENCOURAGEMENTS = [
  'Keep building momentum.',
  'Every session counts.',
  'Progress, not perfection.',
  'You showed up today.',
  'Small steps, big results.',
]

export function summaryCopy(stats: DailyStats): NotificationCopy {
  const { sessionsCompleted, totalMinutes, streak, missionsCompleted } = stats

  // Build title based on activity level
  let title: string
  if (sessionsCompleted === 0) {
    title = 'Ready for Tomorrow? 📋'
  } else if (sessionsCompleted === 1) {
    title = 'Daily Summary 📊'
  } else if (sessionsCompleted >= 3) {
    title = `${sessionsCompleted} Sessions Today! 🎉`
  } else {
    title = 'Daily Summary 📊'
  }

  // Build body with stats
  const parts: string[] = []

  if (sessionsCompleted === 0) {
    parts.push('No sessions today — that\'s okay.')
    parts.push('Tomorrow is a fresh start.')
  } else {
    parts.push(`${sessionsCompleted} session${sessionsCompleted > 1 ? 's' : ''}, ${totalMinutes} min focused.`)
  }

  if (missionsCompleted > 0) {
    parts.push(`${missionsCompleted} mission${missionsCompleted > 1 ? 's' : ''} completed.`)
  }

  if (streak > 0) {
    parts.push(`🔥 ${streak}-day streak!`)
  }

  if (stats.rescuesUsed > 0) {
    parts.push(`Used ${stats.rescuesUsed} rescue${stats.rescuesUsed > 1 ? 's' : ''} — smart.`)
  }

  parts.push(pickRandom(SUMMARY_ENCOURAGEMENTS))

  return {
    title,
    body: parts.join(' '),
    data: {
      type: 'daily_summary',
      stats,
      timestamp: new Date().toISOString(),
    },
  }
}

// ── Danger Window Copy ───────────────────────────────────────
// Alerts for upcoming danger windows (drift-prone times)

const DANGER_WINDOW_TITLES = [
  'Heads Up ⏰',
  'Your Usual Drift Time',
  'Stay Ahead of It',
  'Danger Window Alert',
]

const DANGER_WINDOW_BODIES_BY_STATE: Partial<Record<UserState, string[]>> = {
  avoiding: [
    'This is usually when you start avoiding. Want a tiny mission?',
    'Your drift pattern suggests this is a risky time. Ready to stay ahead?',
  ],
  tired: [
    'You usually feel tired around now. Low-energy task instead?',
    'Energy dip incoming? Plan something easy.',
  ],
  doomscroll_risk: [
    'Scrolling usually wins at this time. Want to try 2 minutes first?',
    'This is your usual scroll zone. One tiny win before?',
  ],
  overwhelmed: [
    'Overwhelm tends to hit around now. Shrink your task.',
    'This time usually feels heavy. What\'s the smallest version?',
  ],
  anxious: [
    'Anxiety often shows up now. Breathe first, then one small step.',
    'This is usually a tense time. Lower the bar.',
  ],
}

export function dangerWindowCopy(window: DangerWindow): NotificationCopy {
  const title = pickRandom(DANGER_WINDOW_TITLES)

  let body: string
  const state = window.usualState
  if (state && DANGER_WINDOW_BODIES_BY_STATE[state]) {
    body = pickRandom(DANGER_WINDOW_BODIES_BY_STATE[state]!)
  } else {
    body = `Your "${window.label}" window is starting. Want a rescue mission?`
  }

  return {
    title,
    body,
    data: {
      type: 'danger_window',
      windowId: window.id,
      windowLabel: window.label,
      usualState: window.usualState,
      preferredProtocol: window.preferredProtocol,
      startTime: window.startTime,
      endTime: window.endTime,
      timestamp: new Date().toISOString(),
    },
  }
}

// ── Comeback Copy ────────────────────────────────────────────
// Messages for users who abandoned a session

export interface ComebackSessionInfo {
  missionTitle?: string
  abandonedAfterMinutes?: number
  protocolId?: string
  state?: UserState
}

const COMEBACK_TITLES = [
  'Still there? 👋',
  'Miss you already',
  'Quick restart?',
  'Your mission is waiting',
  'No judgment — ready to retry?',
]

const COMEBACK_BODIES = [
  'Your focus session ended early. Ready to try again?',
  'No judgment — want a tiny restart?',
  'Even 2 minutes counts. Come back?',
  'Your work is still waiting. One small step?',
  'Stepping away is fine. Coming back is the win.',
]

export function comebackCopy(sessionInfo: ComebackSessionInfo): NotificationCopy {
  const title = pickRandom(COMEBACK_TITLES)
  let body = pickRandom(COMEBACK_BODIES)

  if (sessionInfo.missionTitle) {
    body = `${body} (${sessionInfo.missionTitle})`
  }

  return {
    title,
    body,
    data: {
      type: 'comeback',
      missionTitle: sessionInfo.missionTitle ?? null,
      abandonedAfterMinutes: sessionInfo.abandonedAfterMinutes ?? null,
      protocolId: sessionInfo.protocolId ?? null,
      timestamp: new Date().toISOString(),
    },
  }
}

// ── Predictive Danger Window Copy ─────────────────────────────
// Alerts based on the predictive engine's DangerWindow (not user-defined)

const PREDICTIVE_DANGER_TITLES = [
  'Heads up — drift zone approaching',
  'Your pattern says danger ahead',
  'Stay sharp — risky time incoming',
  'Prevention mode: activate',
  'Your data says be careful',
]

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function predictiveDangerWindowCopy(window: PredictiveDangerWindow): NotificationCopy {
  const title = pickRandom(PREDICTIVE_DANGER_TITLES)
  const dayName = DAY_NAMES[window.dayOfWeek] ?? 'Unknown'
  const riskPercent = Math.round(window.riskScore * 100)
  const body = `Around ${window.startHour}:00 on ${dayName}, you tend to drift (${riskPercent}% risk). Want a rescue mission ready?`

  return {
    title,
    body,
    data: {
      type: 'danger_window',
      source: 'predictive_engine',
      startHour: window.startHour,
      endHour: window.endHour,
      dayOfWeek: window.dayOfWeek,
      riskScore: window.riskScore,
      riskLevel: window.riskLevel,
      primaryState: window.primaryState,
      primaryBlocker: window.primaryBlocker,
      confidence: window.confidence,
      sampleSize: window.sampleSize,
      timestamp: new Date().toISOString(),
    },
  }
}

// ── Helpers ──────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
