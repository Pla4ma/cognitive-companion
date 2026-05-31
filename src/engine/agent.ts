// ══════════════════════════════════════════════════════════════
// INTENT — Agent Architecture v3
// Always-on ambient agent, tool-connected, on-device inference
// This is the core IP that makes INTENT a 10/10 app in May 2026
// ══════════════════════════════════════════════════════════════

import { 
  AvoidanceState, Mission, MicroMission, MissionSession, 
  MomentumEvent, Distraction, BrainDump, ResistancePattern,
  StateChip, STATE_CHIPS, PushStyle, BodyDoubleMode
} from '../types'
import { colors } from '../theme'

// ══════════════════════════════════════════════════════════════
// AGENT CORE — Always-on ambient intelligence
// ════════════════════════════════════════════════════════────══

export type AgentMode = 'ambient' | 'active' | 'intercept' | 'approval'
export type AgentConfidence = 'low' | 'medium' | 'high' | 'certain'
export type SurfaceType = 'app' | 'widget' | 'notification' | 'live_activity' | 'shortcut' | 'siri' | 'lock_screen' | 'watch'

export interface AgentState {
  mode: AgentMode
  confidence: AgentConfidence
  lastDriftDetected: string | null
  lastInterception: string | null
  currentSurface: SurfaceType
  userIsInApp: boolean
  userIsInSession: boolean
  timeSinceLastSession: number // minutes
  activeInterceptions: AgentInterception[]
  queuedActions: AgentAction[]
  patternConfidence: number // 0-1, how well we know this user
}

export interface AgentInterception {
  id: string
  type: 'drift_warning' | 'avoidance_detected' | 'energy_mismatch' | 'pattern_match' | 'comeback_opportunity'
  confidence: AgentConfidence
  state: AvoidanceState
  message: string
  suggestedAction: AgentAction
  surface: SurfaceType
  shown: boolean
  dismissed: boolean
  actedUpon: boolean
  created_at: string
}

export interface AgentAction {
  id: string
  type: 'start_micro_mission' | 'brain_dump' | 'salvage_offer' | 'resistance_check' | 'energy_adjust' | 'pattern_alert' | 'comeback_prompt' | 'body_double_invite'
  title: string
  description: string
  estimated_minutes: number
  mission_id: string | null
  micro_mission_id: string | null
  requires_approval: boolean
  auto_execute: boolean
  priority: 'low' | 'medium' | 'high' | 'critical'
  created_at: string
}

// ══════════════════════════════════════════════════════════════
// DRIFT DETECTOR v4 — Weighted multi-signal detection engine
// ══════════════════════════════════════════════════════════════

// Signal definitions with calibrated weights and thresholds
interface SignalDef {
  weight: number           // How much this signal contributes
  minConfidence: number    // Minimum data points needed
  decayHours: number       // Signal half-life in hours
}

const SIGNAL_WEIGHTS: Record<string, SignalDef> = {
  timeGap:          { weight: 0.22, minConfidence: 1,   decayHours: 4 },
  abandonRate:      { weight: 0.19, minConfidence: 2,   decayHours: 6 },
  distractionRate:  { weight: 0.12, minConfidence: 2,   decayHours: 8 },
  timeProfile:      { weight: 0.10, minConfidence: 1,   decayHours: 12 },
  patternRecurrence:{ weight: 0.15, minConfidence: 3,   decayHours: 24 },
  frictionLevel:    { weight: 0.10, minConfidence: 1,   decayHours: 4 },
  sessionQuality:   { weight: 0.12, minConfidence: 2,   decayHours: 12 },
}

// Time-of-day profiles — what state is common at what hour
const TIME_PROFILES: Record<string, { state: AvoidanceState; urgencyBoost: number }> = {
  late_night:   { state: 'tired',    urgencyBoost: 0.0 },
  early_morning:{ state: 'avoiding',  urgencyBoost: 0.1 },
  morning:      { state: 'avoiding',  urgencyBoost: 0.0 },
  afternoon:    { state: 'stuck',     urgencyBoost: 0.1 },
  evening:      { state: 'scattered', urgencyBoost: 0.0 },
  deep_night:   { state: 'shame_spiral', urgencyBoost: 0.2 },
}

function getTimeProfile(hour: number): { state: AvoidanceState; urgencyBoost: number } {
  if (hour >= 1 && hour < 5) return TIME_PROFILES.deep_night
  if (hour >= 5 && hour < 8) return TIME_PROFILES.early_morning
  if (hour >= 8 && hour < 12) return TIME_PROFILES.morning
  if (hour >= 12 && hour < 17) return TIME_PROFILES.afternoon
  if (hour >= 17 && hour < 22) return TIME_PROFILES.evening
  return TIME_PROFILES.late_night
}

// Per-state signal accumulators for escalation tracking.
// ⚠️ WARNING: Module-level mutable state. Persists across JS bundle lifetime.
// Intentional — drift detection accumulates across sessions in production.
// Module-level because drift detection runs across invocations and needs to
// remember the previous detected state to track consecutive same-state patterns.
// Use `resetDriftDetectionState()` (exported) to clear between test runs.
// In production, hot-reload may reset this — acceptable since detection rebuilds.
let lastDetectedState: AvoidanceState | null = null
let consecutiveSameStateCount = 0
let lastDetectionHour = -1

export function resetDriftDetectionState(): void {
  lastDetectedState = null
  consecutiveSameStateCount = 0
  lastDetectionHour = -1
}

export function detectDrift(
  sessions: MissionSession[],
  distractions: Distraction[],
  resistanceHistory: ResistancePattern[],
  userProfile: { timezone: string; push_style: PushStyle }
): {
  isDrifting: boolean
  confidence: AgentConfidence
  detectedState: AvoidanceState
  urgency: 'low' | 'medium' | 'high'
  reasoning: string
} {
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const hour = now.getHours()
  const dayOfWeek = now.getDay()

  const todaySessions = sessions.filter(s => s.started_at.slice(0, 10) === todayStr)
  const completedToday = todaySessions.filter(s => s.status === 'completed' || s.status === 'salvaged')
  const abandonedToday = todaySessions.filter(s => s.status === 'abandoned')
  const lastSession = sessions[0]
  const timeSinceLast = lastSession
    ? (now.getTime() - new Date(lastSession.ended_at || lastSession.started_at).getTime()) / 60000
    : Infinity

  const todayDistractions = distractions.filter(d => d.captured_at.slice(0, 10) === todayStr)

  // ── Signal 1: Time gap ──────────────────────────────────
  const gapHours = timeSinceLast / 60
  const gapScore = Math.min(gapHours / 6, 1) // 6 hours = full signal
  const gapConfidence = sessions.length > 0 ? Math.min(sessions.length / 5, 1) : 0

  // ── Signal 2: Abandon rate ──────────────────────────────
  const abandonRate = todaySessions.length > 0
    ? abandonedToday.length / todaySessions.length
    : 0
  const abandonScore = abandonRate

  // ── Signal 3: Distraction rate ──────────────────────────
  const avgDistractions = completedToday.length > 0
    ? todayDistractions.length / completedToday.length
    : 0
  const distractionScore = Math.min(avgDistractions / 5, 1)

  // ── Signal 4: Time-of-day profile ───────────────────────
  const timeProfile = getTimeProfile(hour)
  const timeProfileScore = timeProfile.urgencyBoost + (completedToday.length === 0 ? 0.2 : 0)

  // ── Signal 5: Pattern recurrence ────────────────────────
  let patternScore = 0
  let patternState: AvoidanceState | null = null
  for (const p of resistanceHistory) {
    if (p.frequency >= 2 && (now.getTime() - new Date(p.last_occurred).getTime()) < 7 * 86400000) {
      patternScore += Math.min(p.frequency / 5, 1) * 0.3
      patternState = p.avoidance_state as AvoidanceState
    }
  }

  // ── Signal 6: Session quality ────────────────────────────
  const recentSessions = sessions.filter(s =>
    (now.getTime() - new Date(s.started_at).getTime()) < 3 * 86400000
  )
  const qualityRatio = recentSessions.length > 0
    ? recentSessions.filter(s => s.status === 'completed').length / recentSessions.length
    : 0.5
  const frictionScore = Math.max(0, 1 - qualityRatio * 2) // Low quality = high friction

  // ── Weighted state candidates ─────────────────────────────
  type StateCandidate = { state: AvoidanceState; score: number; reasons: string[] }
  const candidates: StateCandidate[] = [
    { state: 'avoiding',  score: 0, reasons: [] },
    { state: 'overwhelmed',score: 0, reasons: [] },
    { state: 'stuck',     score: 0, reasons: [] },
    { state: 'tired',     score: 0, reasons: [] },
    { state: 'scattered', score: 0, reasons: [] },
    { state: 'anxious',   score: 0, reasons: [] },
    { state: 'distracted',score: 0, reasons: [] },
    { state: 'shame_spiral',score: 0, reasons: [] },
    { state: 'ready',     score: 0, reasons: [] },
  ]

  // Feed signals into state candidates
  if (gapScore > 0.3 && completedToday.length === 0) {
    const c = candidates.find(c => c.state === 'avoiding')!
    c.score += gapScore * SIGNAL_WEIGHTS.timeGap.weight
    c.reasons.push(`No sessions in ${Math.round(gapHours * 10) / 10}h`)
  }

  if (abandonScore > 0.4) {
    const overwhelmed = candidates.find(c => c.state === 'overwhelmed')!
    overwhelmed.score += abandonScore * SIGNAL_WEIGHTS.abandonRate.weight
    overwhelmed.reasons.push(`${abandonedToday.length}/${todaySessions.length} sessions abandoned`)
  }

  if (distractionScore > 0.4) {
    const distracted = candidates.find(c => c.state === 'distracted')!
    distracted.score += distractionScore * SIGNAL_WEIGHTS.distractionRate.weight
    distracted.reasons.push(`${avgDistractions.toFixed(1)} avg distractions/session`)
    if (todayDistractions.filter(d => d.category === 'thought').length > 5) {
      const scattered = candidates.find(c => c.state === 'scattered')!
      scattered.score += distractionScore * 0.3
      scattered.reasons.push('High thought-distraction count')
    }
    if (todayDistractions.filter(d => d.category === 'emotion').length > 2) {
      const anxious = candidates.find(c => c.state === 'anxious')!
      anxious.score += distractionScore * 0.25
      anxious.reasons.push('Emotional distractions detected')
    }
  }

  if (timeProfileScore > 0) {
    const c = candidates.find(c => c.state === timeProfile.state)!
    c.score += timeProfileScore * SIGNAL_WEIGHTS.timeProfile.weight
    c.reasons.push(`Time-of-day (${hour}:00) suggests ${timeProfile.state}`)
  }

  if (patternScore > 0 && patternState) {
    const c = candidates.find(c => c.state === patternState)!
    c.score += patternScore * SIGNAL_WEIGHTS.patternRecurrence.weight
    c.reasons.push(`Historical pattern match: ${patternState}`)
  }

  if (frictionScore > 0.3 && recentSessions.length >= 2) {
    const stuck = candidates.find(c => c.state === 'stuck')!
    stuck.score += frictionScore * SIGNAL_WEIGHTS.frictionLevel.weight
    stuck.reasons.push('Recent sessions show high friction')
  }

  // ── Rank and select ───────────────────────────────────────
  const sorted = candidates
    .filter(c => c.score > 0.01)
    .sort((a, b) => b.score - a.score)

  const topCandidate = sorted[0]
  const isDrifting = topCandidate && topCandidate.score >= 0.12 && topCandidate.state !== 'ready'

  let detectedState: AvoidanceState = 'ready'
  let confidence: AgentConfidence = 'low'
  let urgency: 'low' | 'medium' | 'high' = 'low'
  let reasoning = ''

  if (isDrifting && topCandidate) {
    detectedState = topCandidate.state
    const rawConfidence = Math.min(topCandidate.score * 2.5, 1)
    confidence = rawConfidence >= 0.7 ? 'high' : rawConfidence >= 0.4 ? 'medium' : 'low'

    // Urgency: base on score + escalation
    urgency = rawConfidence >= 0.6 ? 'high' : rawConfidence >= 0.35 ? 'medium' : 'low'

    // Escalation: same state detected consecutively?
    if (detectedState === lastDetectedState && hour === lastDetectionHour) {
      consecutiveSameStateCount++
    } else if (detectedState === lastDetectedState) {
      consecutiveSameStateCount = Math.max(1, consecutiveSameStateCount)
    } else {
      consecutiveSameStateCount = 0
    }
    lastDetectedState = detectedState
    lastDetectionHour = hour

    if (consecutiveSameStateCount >= 2) {
      urgency = 'high'
    }

    // Urgency boost from time profile
    if (timeProfile.urgencyBoost > 0.1 && completedToday.length === 0) {
      const c = candidates.find(c => c.state === timeProfile.state)
      if (c && c.state === detectedState) urgency = 'high'
    }

    reasoning = topCandidate.reasons.join('; ')
    if (consecutiveSameStateCount >= 1) {
      reasoning += `. Pattern repeated ${consecutiveSameStateCount + 1}x (escalated).`
    }
  }

  // Weekend dampening
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    if (urgency === 'high') urgency = 'medium'
  }

  return { isDrifting, confidence, detectedState, urgency, reasoning }
}

// ════════════════════════════════════════════════════════════──
// ACTION GENERATOR — What should the agent do?
// ════════════════════════════════════════════════════════──────

export function generateAgentAction(
  drift: ReturnType<typeof detectDrift>,
  missions: Mission[],
  microMissions: MicroMission[],
  userPushStyle: PushStyle,
): AgentAction | null {
  if (!drift.isDrifting) return null

  const chip = STATE_CHIPS[drift.detectedState]
  const activeMission = missions.find(m => m.status === 'active')
  const pendingMicro = microMissions.find(mm => mm.status === 'pending')

  const actions: Record<AvoidanceState, () => AgentAction> = {
    avoiding: () => ({
      id: `action_${Date.now()}`,
      type: 'start_micro_mission',
      title: `2-min start: ${activeMission?.title ?? 'something small'}`,
      description: `Set a 2-minute timer. Open the thing you're avoiding. That's it.`,
      estimated_minutes: 2,
      mission_id: activeMission?.id ?? null,
      micro_mission_id: pendingMicro?.id ?? null,
      requires_approval: false,
      auto_execute: false,
      priority: drift.urgency === 'high' ? 'critical' : 'high',
      created_at: new Date().toISOString(),
    }),
    overwhelmed: () => ({
      id: `action_${Date.now()}`,
      type: 'brain_dump',
      title: 'Brain dump — clear the fog',
      description: 'Write down everything on your mind. 3 minutes. No organizing. Just dump.',
      estimated_minutes: 3,
      mission_id: null,
      micro_mission_id: null,
      requires_approval: false,
      auto_execute: false,
      priority: 'high',
      created_at: new Date().toISOString(),
    }),
    stuck: () => ({
      id: `action_${Date.now()}`,
      type: 'start_micro_mission',
      title: 'Find the next physical action',
      description: 'What\'s the very next physical action? Not "work on project" — "open laptop." Do that.',
      estimated_minutes: 5,
      mission_id: activeMission?.id ?? null,
      micro_mission_id: pendingMicro?.id ?? null,
      requires_approval: false,
      auto_execute: false,
      priority: 'high',
      created_at: new Date().toISOString(),
    }),
    tired: () => ({
      id: `action_${Date.now()}`,
      type: 'energy_adjust',
      title: 'Low-energy mode',
      description: 'Pick the easiest possible task. Or rest intentionally — 10 min, no phone.',
      estimated_minutes: 5,
      mission_id: null,
      micro_mission_id: null,
      requires_approval: false,
      auto_execute: false,
      priority: 'medium',
      created_at: new Date().toISOString(),
    }),
    distracted: () => ({
      id: `action_${Date.now()}`,
      type: 'start_micro_mission',
      title: 'Capture + focus sprint',
      description: 'Write down every distraction. Phone in another room. 15-min sprint.',
      estimated_minutes: 15,
      mission_id: activeMission?.id ?? null,
      micro_mission_id: null,
      requires_approval: false,
      auto_execute: false,
      priority: 'medium',
      created_at: new Date().toISOString(),
    }),
    anxious: () => ({
      id: `action_${Date.now()}`,
      type: 'resistance_check',
      title: 'Name the fear',
      description: 'Write exactly what you\'re afraid of. Then set a 5-min timer. Start before ready.',
      estimated_minutes: 5,
      mission_id: activeMission?.id ?? null,
      micro_mission_id: null,
      requires_approval: false,
      auto_execute: false,
      priority: 'high',
      created_at: new Date().toISOString(),
    }),
    scattered: () => ({
      id: `action_${Date.now()}`,
      type: 'start_micro_mission',
      title: 'Close everything + one mission',
      description: 'Close all tabs. Pick ONE thing. Set a timer. Everything else can wait.',
      estimated_minutes: 10,
      mission_id: activeMission?.id ?? null,
      micro_mission_id: null,
      requires_approval: false,
      auto_execute: false,
      priority: 'medium',
      created_at: new Date().toISOString(),
    }),
    ready: () => ({
      id: `action_${Date.now()}`,
      type: 'start_micro_mission',
      title: `Full focus: ${activeMission?.title ?? 'your mission'}`,
      description: 'You\'re in the zone. Protect this state. Set a timer. Full focus.',
      estimated_minutes: 25,
      mission_id: activeMission?.id ?? null,
      micro_mission_id: pendingMicro?.id ?? null,
      requires_approval: false,
      auto_execute: false,
      priority: 'medium',
      created_at: new Date().toISOString(),
    }),
    bored: () => ({
      id: `action_${Date.now()}`,
      type: 'start_micro_mission',
      title: 'Make it interesting',
      description: 'Add a constraint: do it in 10 minutes, do it badly on purpose, or do it standing up.',
      estimated_minutes: 10,
      mission_id: activeMission?.id ?? null,
      micro_mission_id: pendingMicro?.id ?? null,
      requires_approval: false,
      auto_execute: false,
      priority: 'medium',
      created_at: new Date().toISOString(),
    }),
    perfectionism: () => ({
      id: `action_${Date.now()}`,
      type: 'start_micro_mission',
      title: 'Ugly first version',
      description: 'Make the worst possible version on purpose. Write the worst first sentence.',
      estimated_minutes: 5,
      mission_id: activeMission?.id ?? null,
      micro_mission_id: pendingMicro?.id ?? null,
      requires_approval: false,
      auto_execute: false,
      priority: 'high',
      created_at: new Date().toISOString(),
    }),
    unclear: () => ({
      id: `action_${Date.now()}`,
      type: 'start_micro_mission',
      title: 'Name the confusion',
      description: 'Write one sentence: "I don\'t know how to start because _______."',
      estimated_minutes: 5,
      mission_id: activeMission?.id ?? null,
      micro_mission_id: null,
      requires_approval: false,
      auto_execute: false,
      priority: 'medium',
      created_at: new Date().toISOString(),
    }),
    time_pressure: () => ({
      id: `action_${Date.now()}`,
      type: 'start_micro_mission',
      title: 'Define "enough"',
      description: 'Write down: "Done means _______." Not perfect. Done.',
      estimated_minutes: 5,
      mission_id: activeMission?.id ?? null,
      micro_mission_id: null,
      requires_approval: false,
      auto_execute: false,
      priority: 'high',
      created_at: new Date().toISOString(),
    }),
    low_confidence: () => ({
      id: `action_${Date.now()}`,
      type: 'start_micro_mission',
      title: '2-minute proof',
      description: 'Do the smallest possible version. 2 minutes. Proof before perfection.',
      estimated_minutes: 2,
      mission_id: activeMission?.id ?? null,
      micro_mission_id: pendingMicro?.id ?? null,
      requires_approval: false,
      auto_execute: false,
      priority: 'high',
      created_at: new Date().toISOString(),
    }),
    shame_spiral: () => ({
      id: `action_${Date.now()}`,
      type: 'start_micro_mission',
      title: 'Reset, not punish',
      description: 'You\'re not behind. You\'re human. Pick one tiny thing. Do it.',
      estimated_minutes: 2,
      mission_id: null,
      micro_mission_id: null,
      requires_approval: false,
      auto_execute: false,
      priority: 'critical',
      created_at: new Date().toISOString(),
    }),
    fake_productivity: () => ({
      id: `action_${Date.now()}`,
      type: 'start_micro_mission',
      title: 'Stop planning, start doing',
      description: 'Close the planning app. Open the real work. Do one physical action.',
      estimated_minutes: 5,
      mission_id: activeMission?.id ?? null,
      micro_mission_id: null,
      requires_approval: false,
      auto_execute: false,
      priority: 'high',
      created_at: new Date().toISOString(),
    }),
    planning_loop: () => ({
      id: `action_${Date.now()}`,
      type: 'start_micro_mission',
      title: 'Planning loop breaker',
      description: 'You\'ve planned enough. Set a 5-minute timer. Do the first physical action.',
      estimated_minutes: 5,
      mission_id: activeMission?.id ?? null,
      micro_mission_id: null,
      requires_approval: false,
      auto_execute: false,
      priority: 'high',
      created_at: new Date().toISOString(),
    }),
    doomscroll_risk: () => ({
      id: `action_${Date.now()}`,
      type: 'start_micro_mission',
      title: '2 minutes before you scroll',
      description: 'Give me 2 minutes before you disappear. One tiny action.',
      estimated_minutes: 2,
      mission_id: null,
      micro_mission_id: null,
      requires_approval: false,
      auto_execute: false,
      priority: 'high',
      created_at: new Date().toISOString(),
    }),
  }

  return actions[drift.detectedState]()
}

// ══════════════════════════════════════════════════════════════
// INTERCEPTION FORMATTER — Per-surface message formatting
// ══════════════════════════════════════════════════════════════

export function formatInterceptionForSurface(
  interception: AgentInterception,
  surface: SurfaceType,
  pushStyle: PushStyle
): { title: string; body: string; actions: { label: string; action: string }[] } {
  
  const titlePrefixes: Record<PushStyle, string> = {
    gentle: '',
    firm: '⚠️ ',
    emergency: '🚨 ',
  }

  switch (surface) {
    case 'notification':
      return {
        title: `${titlePrefixes[pushStyle]}${interception.suggestedAction.title}`,
        body: interception.message.slice(0, 100),
        actions: [
          { label: 'Do It', action: 'execute_action' },
          { label: 'Snooze 15m', action: 'snooze' },
          { label: 'Dismiss', action: 'dismiss' },
        ],
      }

    case 'widget':
      return {
        title: interception.suggestedAction.title,
        body: interception.message.slice(0, 60),
        actions: [
          { label: 'Start', action: 'execute_action' },
        ],
      }

    case 'live_activity':
      return {
        title: interception.suggestedAction.title,
        body: `${Math.round(interception.confidence === 'certain' ? 95 : interception.confidence === 'high' ? 75 : interception.confidence === 'medium' ? 50 : 25)}% confident you're ${STATE_CHIPS[interception.state].label.toLowerCase()}`,
        actions: [
          { label: 'Rescue Me', action: 'execute_action' },
          { label: 'Not Now', action: 'dismiss' },
        ],
      }

    case 'lock_screen':
      return {
        title: interception.suggestedAction.title,
        body: interception.message.slice(0, 80),
        actions: [
          { label: 'Start', action: 'execute_action' },
        ],
      }

    case 'siri':
      return {
        title: interception.suggestedAction.title,
        body: interception.message,
        actions: [
          { label: 'Start Mission', action: 'execute_action' },
          { label: 'Tell Me More', action: 'explain' },
        ],
      }

    case 'shortcut':
      return {
        title: interception.suggestedAction.title,
        body: interception.suggestedAction.description,
        actions: [
          { label: 'Run', action: 'execute_action' },
        ],
      }

    default: // app
      return {
        title: interception.suggestedAction.title,
        body: interception.message,
        actions: [
          { label: 'Do It Now', action: 'execute_action' },
          { label: 'Snooze', action: 'snooze' },
          { label: 'Dismiss', action: 'dismiss' },
        ],
      }
  }
}

// ══════════════════════════════════════════════════════════════
// PULSE CALCULATOR — The living heartbeat of the app
// ════════════════════════════════════════════════════════════──

export interface IntentionPulse {
  // Core metrics
  state: AvoidanceState
  confidence: AgentConfidence
  momentumScore: number
  sessionsToday: number
  minutesToday: number
  streak: number
  
  // Agent status
  agentMode: AgentMode
  pendingInterceptions: number
  queuedActions: number
  
  // Proactive suggestion
  primaryAction: AgentAction | null
  reasoning: string
  
  // Visual state
  pulseColor: string
  pulseIntensity: number // 0-1, how "urgent" the pulse should feel
  glowColor: string
  
  // Surface recommendations
  recommendedSurface: SurfaceType
  surfaceAvailable: SurfaceType[]
}

export function calculateIntentionPulse(
  agentState: AgentState,
  driftDetection: ReturnType<typeof detectDrift>,
  sessions: MissionSession[],
  momentumEvents: MomentumEvent[],
  missions: Mission[]
): IntentionPulse {
  const todayStr = new Date().toISOString().slice(0, 10)
  const todaySessions = sessions.filter(s => s.started_at.slice(0, 10) === todayStr && (s.status === 'completed' || s.status === 'salvaged'))
  const minutesToday = Math.round(todaySessions.reduce((s, sess) => s + sess.actual_seconds, 0) / 60)
  const weekAgo = Date.now() - 7 * 86400000
  const weekPoints = momentumEvents.filter(e => new Date(e.created_at).getTime() >= weekAgo).reduce((s, e) => s + e.points, 0)
  
  const chip = STATE_CHIPS[driftDetection.detectedState]
  const isDrifting = driftDetection.isDrifting
  
  // Pulse intensity based on urgency
  const pulseIntensity = 
    driftDetection.urgency === 'high' ? 0.9 :
    driftDetection.urgency === 'medium' ? 0.6 :
    driftDetection.urgency === 'low' ? 0.3 : 0.1

  // Determine best surface
  const recommendedSurface: SurfaceType = 
    agentState.userIsInApp ? 'app' :
    agentState.userIsInSession ? 'live_activity' :
    isDrifting && driftDetection.urgency === 'high' ? 'notification' :
    isDrifting ? 'widget' :
    'widget'

  return {
    state: driftDetection.detectedState,
    confidence: driftDetection.confidence,
    momentumScore: weekPoints,
    sessionsToday: todaySessions.length,
    minutesToday,
    streak: 0, // Calculated from sessions
    agentMode: isDrifting && driftDetection.urgency === 'high' ? 'intercept' : 'ambient',
    pendingInterceptions: agentState.activeInterceptions.filter(i => !i.shown).length,
    queuedActions: agentState.queuedActions.length,
    primaryAction: agentState.queuedActions[0] || null,
    reasoning: driftDetection.reasoning,
    pulseColor: chip.color,
    pulseIntensity,
    glowColor: isDrifting ? chip.color : colors.brand[500],
    recommendedSurface,
    surfaceAvailable: ['app', 'widget', 'notification', 'live_activity'],
  }
}
