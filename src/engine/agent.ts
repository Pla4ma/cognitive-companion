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
// DRIFT DETECTOR — Proactive interception engine
// ══════════════════════════════════════════════════════════════

interface DriftSignals {
  timeSinceLastSession: number
  sessionsToday: number
  plannedSessionsToday: number
  abandonedSessionsToday: number
  distractionsPerSession: number
  timeOfDay: number
  dayOfWeek: number
  resistancePatternMatch: boolean
  energyIndicator: 'low' | 'medium' | 'high'
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
  const avgDistractionsPerSession = completedToday.length > 0 
    ? todayDistractions.length / completedToday.length 
    : 0

  // ── Signal analysis ─────────────────────────────────────

  // Long gap since last session
  const isAvoiding = timeSinceLast > 180 && completedToday.length === 0 // 3+ hours, no sessions
  const isOverwhelmed = abandonedToday.length >= 2 // Multiple abandoned attempts
  const isDistracted = avgDistractionsPerSession > 3 // High distraction rate
  const isTired = (hour >= 22 || hour < 7) && completedToday.length === 0
  const isStuck = abandonedToday.length === 1 && completedToday.length === 0 // One abandoned, nothing since
  const isScattered = todayDistractions.filter(d => d.category === 'thought').length > 5
  const isAnxious = todayDistractions.filter(d => d.category === 'emotion').length > 2

  // ── Confidence scoring ──────────────────────────────────

  let confidence = 0
  let detectedState: AvoidanceState = 'ready'
  let urgency: 'low' | 'medium' | 'high' = 'low'
  let reasoning = ''

  if (isAvoiding) {
    confidence += 0.4
    detectedState = 'avoiding'
    urgency = timeSinceLast > 360 ? 'high' : 'medium'
    reasoning = `No sessions in ${Math.round(timeSinceLast)}m. User is likely avoiding.`
  }

  if (isOverwhelmed) {
    confidence += 0.3
    detectedState = 'overwhelmed'
    urgency = 'high'
    reasoning = `${abandonedToday.length} abandoned sessions today. User is overwhelmed.`
  }

  if (isDistracted) {
    confidence += 0.2
    detectedState = isDistracted && isAnxious ? 'anxious' : 'distracted'
    urgency = 'medium'
    reasoning = `${avgDistractionsPerSession.toFixed(1)} distractions per session. Environment is not focused.`
  }

  if (isTired) {
    confidence += 0.3
    detectedState = 'tired'
    urgency = 'low'
    reasoning = `Late hour (${hour}:00) with no sessions. User may be tired.`
  }

  if (isStuck) {
    confidence += 0.25
    detectedState = 'stuck'
    urgency = 'medium'
    reasoning = `One abandoned session, nothing since. User may be stuck.`
  }

  if (isScattered) {
    confidence += 0.2
    detectedState = 'scattered'
    urgency = 'medium'
    reasoning = `${todayDistractions.filter(d => d.category === 'thought').length} thought-distractions today. Mind is scattered.`
  }

  // Pattern matching from history
  const patternMatch = resistanceHistory.find(p => 
    p.avoidance_state === detectedState && 
    p.frequency >= 3 &&
    (now.getTime() - new Date(p.last_occurred).getTime()) < 7 * 86400000
  )
  if (patternMatch) {
    confidence += 0.15
    reasoning += ` Pattern match: ${patternMatch.frequency} previous occurrences of ${detectedState}.`
  }

  // Weekend adjustment
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    confidence *= 0.7 // Lower confidence on weekends
  }

  const isDrifting = confidence >= 0.3
  const agentConfidence: AgentConfidence = 
    confidence >= 0.8 ? 'certain' :
    confidence >= 0.6 ? 'high' :
    confidence >= 0.4 ? 'medium' : 'low'

  return { isDrifting, confidence: agentConfidence, detectedState, urgency, reasoning }
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
