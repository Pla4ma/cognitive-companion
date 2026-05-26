// ══════════════════════════════════════════════════════════════
// INTENT — Drift Interception Orchestrator v3
// The beating heart of the app. This is what makes INTENT different.
//
// Not a timer. Not a chatbot. Not a dashboard.
// An always-on system that catches the exact moment you're about to
// drift and converts it into meaningful action — faster, safer, and
// more personally than anything else.
//
// Architecture:
//   Monitor → Detect → Decide → Deliver → Learn
// ══════════════════════════════════════════════════════════════

import {
  UserState, UserProfile, Mission, MicroMission, MissionSession,
  MomentumEvent, Distraction, ResistancePattern, PushStyle,
} from '../types'
import {
  AgentState, AgentMode, AgentConfidence, AgentInterception,
  AgentAction, SurfaceType,
} from '../engine/agent'
import {
  detectAvoidanceState, generateMicroMission, categorizeDistraction,
} from '../engine/antiAvoidance'
import {
  assessCrisis, classifyContent, checkSafetyBoundaries,
  filterShameLanguage,
} from '../engine/safety'

// ── Drift Signal ────────────────────────────────────────────

export type DriftSignalType =
  | 'session_inactivity'     // User hasn't started a session in expected window
  | 'time_of_day_pattern'   // Historical drift time approaching
  | 'abandoned_streak'      // Multiple abandoned sessions in a row
  | 'mission_stall'         // Active mission with no progress
  | 'energy_mismatch'       // Low-energy time but high-demand mission queued
  | 'distraction_cluster'   // Multiple distractions captured in short window
  | 'resistance_pattern'    // Repeating resistance on same mission type
  | 'comeback_window'       // Post-abandonment window where user often returns
  | 'streak_at_risk'        // Daily streak about to break
  | 'body_double_idle'      // Body double session running but no progress
  | 'brain_dump_pending'    // Unprocessed brain dump with actionable items
  | 'overload_detected'     // Too many active missions for current capacity

export interface DriftSignal {
  id: string
  type: DriftSignalType
  confidence: number          // 0-1
  severity: 'info' | 'warning' | 'urgent' | 'critical'
  state: UserState
  message: string             // Human-readable why we think they're drifting
  suggestedInterception: InterceptionStrategy
  surfacePriority: SurfaceType[] // Ordered: best surface first
  expiresAt: string           // When this signal becomes stale
  metadata: Record<string, any>
}

// ── Interception Strategy ──────────────────────────────────

export type InterceptionType =
  | 'gentle_nudge'            // Soft notification: "Hey, you usually focus now"
  | 'pattern_insight'         // "You always struggle at 2pm — try a quick win"
  | 'micro_mission_push'      // Push a pre-generated micro-mission
  | 'body_double_prompt'      // Suggest starting body double mode
  | 'salvage_offer'           // Offer to salvage an abandoned session
  | 'mission_simplify'        // Help break down stalled mission
  | 'distraction_shield'      // Offer to enable distraction blocking
  | 'comeback_invitation'     // "You usually come back strong after this"
  | 'streak_reminder'         // "Your streak is alive — 2 minutes keeps it"
  | 'brain_dump_action'       // "You have unprocessed items from your dump"
  | 'escalating_intervention' // Firmer: "This is your 3rd time stalling"
  | 'crisis_intervention'     // Safety-first crisis routing

export interface InterceptionStrategy {
  type: InterceptionType
  message: string
  action: AgentAction
  fallbackType: InterceptionType
  escalationCount: number     // How many times we've tried to intercept
  lastAttempt: string | null
  cooldownMinutes: number     // Minimum time between same-type interceptions
}

// ── User Pattern Profile ───────────────────────────────────

export interface UserPatternProfile {
  userId: string
  averageSessionStartHour: number     // When they usually start
  averageSessionDuration: number      // Average minutes
  mostCommonDriftTime: number         // Hour when drift most likely
  driftFrequencyByDay: Record<string, number> // Mon-Sun drift rates
  resistanceByMissionType: Record<string, number>
  recoverySpeed: number               // How quickly they bounce back (0-1)
  preferredPushStyle: PushStyle
  effectivenessByType: Record<InterceptionType, number> // Which interceptions work
  lastUpdated: string
}

// ── Drift Interception Orchestrator ────────────────────────

export interface OrchestratorConfig {
  enabledSurfaces: SurfaceType[]
  maxInterceptionsPerHour: number
  minInterceptionIntervalMinutes: number
  escalationThreshold: number     // Failed interventions before escalating
  respectQuietHours: boolean
  quietHoursStart: number         // 22 = 10pm
  quietHoursEnd: number           // 7 = 7am
  // v4 additions
  signalCooldownMinutes: number           // Don't repeat same signal type in this window
  surfacePriorityMap: Partial<Record<DriftSignalType, SurfaceType[]>>
  strategyChain: Partial<Record<InterceptionType, InterceptionType[]>>
  adaptiveCooldown: boolean               // Increase cooldown for ineffective types
  maxPerTypePerDay: number
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  enabledSurfaces: ['app', 'widget', 'notification', 'live_activity'],
  maxInterceptionsPerHour: 3,
  minInterceptionIntervalMinutes: 20,
  escalationThreshold: 3,
  respectQuietHours: true,
  quietHoursStart: 22,
  quietHoursEnd: 7,
  signalCooldownMinutes: 90,
  surfacePriorityMap: {},
  strategyChain: {},
  adaptiveCooldown: true,
  maxPerTypePerDay: 5,
}

export class DriftInterceptionOrchestrator {
  private agentState: AgentState
  private patternProfile: UserPatternProfile | null
  private config: OrchestratorConfig
  private signalHistory: DriftSignal[] = []
  // v4: strategy chain tracking
  private strategyChainState: Map<string, { chainIndex: number; startedAt: number }> = new Map()
  // v4: per-signal-type cooldown
  private lastSignalTimestamps: Map<DriftSignalType, number[]> = new Map()
  // v4: per-type effectiveness tracking
  private typeEffectiveness: Map<InterceptionType, { attempted: number; succeeded: number }> = new Map()

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.agentState = this.createInitialAgentState()
    this.patternProfile = null
  }

  private createInitialAgentState(): AgentState {
    return {
      mode: 'ambient',
      confidence: 'low',
      lastDriftDetected: null,
      lastInterception: null,
      currentSurface: 'app',
      userIsInApp: false,
      userIsInSession: false,
      timeSinceLastSession: 0,
      activeInterceptions: [],
      queuedActions: [],
      patternConfidence: 0,
    }
  }

  // ── MONITOR Phase ──────────────────────────────────────────

  updateAgentState(update: Partial<AgentState>): void {
    this.agentState = { ...this.agentState, ...update }
  }

  setPatternProfile(profile: UserPatternProfile): void {
    this.patternProfile = profile
  }

  // ── DETECT Phase ───────────────────────────────────────────

  analyze(
    user: UserProfile | null,
    sessions: MissionSession[],
    missions: Mission[],
    momentumEvents: MomentumEvent[],
    distractions: Distraction[],
    brainDumps: any[],
  ): DriftSignal[] {
    if (!user) return []

    const signals: DriftSignal[] = []
    const now = new Date()
    const hour = now.getHours()

    // Always check: detect current avoidance state
    const currentState = detectAvoidanceState(
      sessions.slice(0, 10),
      missions,
      this.agentState.timeSinceLastSession,
    )

    // 1. Session inactivity signal
    if (this.agentState.timeSinceLastSession > 120 && !this.agentState.userIsInSession) {
      const confidence = Math.min(this.agentState.timeSinceLastSession / 480, 0.9)
      signals.push({
        id: uid(),
        type: 'session_inactivity',
        confidence,
        severity: confidence > 0.7 ? 'urgent' : 'warning',
        state: currentState,
        message: this.getInactivityMessage(currentState, user.display_name),
        suggestedInterception: this.selectInterception('gentle_nudge', currentState),
        surfacePriority: this.getSurfacePriority(),
        expiresAt: new Date(now.getTime() + 3600000).toISOString(),
        metadata: { inactiveMinutes: this.agentState.timeSinceLastSession },
      })
    }

    // 2. Time-of-day pattern signal
    if (this.patternProfile && this.isHighRiskTime(hour)) {
      signals.push({
        id: uid(),
        type: 'time_of_day_pattern',
        confidence: 0.75,
        severity: 'warning',
        state: currentState,
        message: this.getPatternMessage(user.display_name),
        suggestedInterception: this.selectInterception('pattern_insight', currentState),
        surfacePriority: ['notification', 'widget', 'app'],
        expiresAt: new Date(now.getTime() + 1800000).toISOString(),
        metadata: { hour, driftRate: this.patternProfile.driftFrequencyByDay },
      })
    }

    // 3. Abandoned streak signal
    const recentAbandoned = sessions
      .filter(s => s.status === 'abandoned')
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
      .slice(0, 5)

    if (recentAbandoned.length >= 2) {
      const allRecent = recentAbandoned.every(s => {
        const age = (now.getTime() - new Date(s.started_at).getTime()) / 3600000
        return age < 24
      })
      if (allRecent) {
        signals.push({
          id: uid(),
          type: 'abandoned_streak',
          confidence: 0.85,
          severity: recentAbandoned.length >= 3 ? 'urgent' : 'warning',
          state: 'stuck',
          message: this.getAbandonedStreakMessage(user.display_name, recentAbandoned.length),
          suggestedInterception: this.selectInterception('mission_simplify', 'stuck'),
          surfacePriority: ['app', 'notification'],
          expiresAt: new Date(now.getTime() + 7200000).toISOString(),
          metadata: { abandonedCount: recentAbandoned.length },
        })
      }
    }

    // 4. Mission stall signal
    const stalledMissions = missions.filter(m => {
      if (m.status !== 'active') return false
      const age = (now.getTime() - new Date(m.created_at).getTime()) / 86400000
      return age > 3
    })
    if (stalledMissions.length > 0) {
      signals.push({
        id: uid(),
        type: 'mission_stall',
        confidence: 0.7,
        severity: 'warning',
        state: 'stuck',
        message: `You have ${stalledMissions.length} mission${stalledMissions.length > 1 ? 's' : ''} that haven't moved in days. Want to simplify one?`,
        suggestedInterception: this.selectInterception('mission_simplify', 'stuck'),
        surfacePriority: ['app'],
        expiresAt: new Date(now.getTime() + 14400000).toISOString(),
        metadata: { stalledCount: stalledMissions.length },
      })
    }

    // 5. Distraction cluster signal
    const recentDistractions = distractions.filter(d => {
      const age = (now.getTime() - new Date(d.captured_at).getTime()) / 3600000
      return age < 2
    })
    if (recentDistractions.length >= 3) {
      const topCategory = this.getTopDistractionCategory(recentDistractions)
      signals.push({
        id: uid(),
        type: 'distraction_cluster',
        confidence: 0.8,
        severity: 'urgent',
        state: 'distracted',
        message: `${recentDistractions.length} distractions in 2 hours — mostly ${topCategory}. Want a shield?`,
        suggestedInterception: this.selectInterception('distraction_shield', 'distracted'),
        surfacePriority: ['notification', 'app'],
        expiresAt: new Date(now.getTime() + 1800000).toISOString(),
        metadata: { distractionCount: recentDistractions.length, topCategory },
      })
    }

    // 6. Streak at risk signal
    const todayStr = now.toISOString().slice(0, 10)
    const hasSessionToday = sessions.some(s =>
      s.started_at.slice(0, 10) === todayStr &&
      (s.status === 'completed' || s.status === 'salvaged')
    )
    if (!hasSessionToday && hour >= 18 && this.agentState.patternConfidence > 0.3) {
      signals.push({
        id: uid(),
        type: 'streak_at_risk',
        confidence: 0.6 + (hour - 18) * 0.05, // Increases as night goes on
        severity: hour >= 21 ? 'urgent' : 'info',
        state: currentState,
        message: this.getStreakMessage(user.display_name, hour),
        suggestedInterception: this.selectInterception('streak_reminder', currentState),
        surfacePriority: ['notification', 'widget'],
        expiresAt: new Date(now.getTime() + 3600000).toISOString(),
        metadata: { hour },
      })
    }

    // 7. Comeback window signal
    const lastAbandoned = sessions.find(s => s.status === 'abandoned')
    if (lastAbandoned) {
      const ageMinutes = (now.getTime() - new Date(lastAbandoned.started_at).getTime()) / 60000
      // Best comeback window: 15-45 minutes after abandonment
      if (ageMinutes >= 15 && ageMinutes <= 45) {
        signals.push({
          id: uid(),
          type: 'comeback_window',
          confidence: 0.72,
          severity: 'info',
          state: currentState,
          message: this.getComebackMessage(user.display_name),
          suggestedInterception: this.selectInterception('comeback_invitation', currentState),
          surfacePriority: ['notification', 'app'],
          expiresAt: new Date(new Date(lastAbandoned.started_at).getTime() + 45 * 60000).toISOString(),
          metadata: { minutesSinceAbandon: Math.round(ageMinutes) },
        })
      }
    }

    // 8. Overload detection
    const activeMissions = missions.filter(m => m.status === 'active')
    if (activeMissions.length > 5) {
      signals.push({
        id: uid(),
        type: 'overload_detected',
        confidence: 0.9,
        severity: 'warning',
        state: 'overwhelmed',
        message: `${activeMissions.length} active missions. Let's pick just one.`,
        suggestedInterception: this.selectInterception('micro_mission_push', 'overwhelmed'),
        surfacePriority: ['app'],
        expiresAt: new Date(now.getTime() + 7200000).toISOString(),
        metadata: { activeCount: activeMissions.length },
      })
    }

    // Sort by confidence descending, filter expired
    const validSignals = signals
      .filter(s => new Date(s.expiresAt).getTime() > now.getTime())
      .sort((a, b) => b.confidence - a.confidence)

    this.signalHistory.push(...validSignals)
    // Keep last 100 signals
    if (this.signalHistory.length > 100) {
      this.signalHistory = this.signalHistory.slice(-100)
    }

    return validSignals
  }

  // ── DECIDE Phase ───────────────────────────────────────────

  shouldIntercept(signal: DriftSignal): { should: boolean; reason: string } {
    // Check quiet hours
    if (this.config.respectQuietHours) {
      const hour = new Date().getHours()
      if (hour >= this.config.quietHoursStart || hour < this.config.quietHoursEnd) {
        return { should: false, reason: 'Quiet hours active' }
      }
    }

    // v4: Signal deduplication — don't re-fire same signal type on cooldown
    if (this.isSignalOnCooldown(signal.type)) {
      return { should: false, reason: `Signal ${signal.type} on cooldown (${this.config.signalCooldownMinutes}m)` }
    }

    // v4: Adaptive cooldown based on interception type effectiveness
    const effectiveCooldown = this.getEffectiveCooldown(signal.suggestedInterception.type)
    const recentInterceptions = this.agentState.activeInterceptions.filter(i => {
      const age = (Date.now() - new Date(i.created_at).getTime()) / 60000
      return age < effectiveCooldown
    })
    if (recentInterceptions.length > 0) {
      return { should: false, reason: `Adaptive rate limited (cooldown: ${effectiveCooldown}m)` }
    }

    // Check max per hour
    const hourAgo = Date.now() - 3600000
    const hourInterceptions = this.agentState.activeInterceptions.filter(i =>
      new Date(i.created_at).getTime() > hourAgo
    )
    if (hourInterceptions.length >= this.config.maxInterceptionsPerHour) {
      return { should: false, reason: 'Max per hour reached' }
    }

    // v4: Per-type daily limit
    if (this.hasExceededDailyLimit(signal.suggestedInterception.type)) {
      return { should: false, reason: `Daily limit reached for ${signal.suggestedInterception.type}` }
    }

    // Check escalation: count recent interceptions of any type
    const recentCount = this.agentState.activeInterceptions.filter(i => {
      const age = (Date.now() - new Date(i.created_at).getTime()) / 60000
      return age < 60 // Within last hour
    }).length
    if (recentCount >= this.config.escalationThreshold) {
      signal.suggestedInterception = this.selectInterception('escalating_intervention', signal.state)
    }

    // Record signal fire for deduplication tracking
    this.recordSignalFire(signal.type)

    // Init strategy chain for this signal
    this.initStrategyChain(signal.id, signal.suggestedInterception.type)

    // Safety check
    const safetyCheck = checkSafetyBoundaries(signal.suggestedInterception.message)
    if (!safetyCheck.safe) {
      const filtered = filterShameLanguage(signal.suggestedInterception.message)
      signal.suggestedInterception.message = filtered.filtered
    }

    return { should: true, reason: 'All checks passed' }
  }

  // ── DELIVER Phase ──────────────────────────────────────────

  createInterception(signal: DriftSignal): AgentInterception {
    const strategy = signal.suggestedInterception

    return {
      id: uid(),
      type: this.mapInterceptionType(signal.type),
      confidence: this.numberToConfidence(signal.confidence),
      state: signal.state,
      message: strategy.message,
      suggestedAction: strategy.action,
      surface: signal.surfacePriority[0],
      shown: false,
      dismissed: false,
      actedUpon: false,
      created_at: new Date().toISOString(),
    }
  }

  formatForSurface(interception: AgentInterception, surface: SurfaceType): { title: string; body: string; actions: string[] } {
    switch (surface) {
      case 'notification':
        return {
          title: interception.suggestedAction?.title || 'INTENT Check-In',
          body: interception.message,
          actions: ['Start Session', 'Snooze', 'Dismiss'],
        }
      case 'widget':
        return {
          title: 'INTENT',
          body: interception.message.slice(0, 80),
          actions: ['Tap to focus'],
        }
      case 'live_activity':
        return {
          title: 'Drift Check',
          body: interception.message.slice(0, 120),
          actions: ['Take Action'],
        }
      case 'lock_screen':
        return {
          title: 'INTENT',
          body: interception.message.slice(0, 60),
          actions: ['Focus Now'],
        }
      case 'app':
      default:
        return {
          title: 'Quick Check-In',
          body: interception.message,
          actions: ['Start a session', 'Capture distraction', 'Maybe later'],
        }
    }
  }

  // ── LEARN Phase ────────────────────────────────────────────

  recordInterceptionOutcome(
    interceptionId: string,
    outcome: 'acted' | 'dismissed' | 'ignored' | 'expired',
    signalId?: string,
  ): { nextInterception: InterceptionType | null } | void {
    const interception = this.agentState.activeInterceptions.find(i => i.id === interceptionId)
    if (!interception) return

    // Track per-type effectiveness
    const type = this.resolveInterceptionType(interception)
    const stats = this.typeEffectiveness.get(type) || { attempted: 0, succeeded: 0 }

    if (outcome === 'acted') {
      interception.actedUpon = true
      stats.succeeded++
      this.typeEffectiveness.set(type, stats)
      this.agentState.patternConfidence = Math.min(
        this.agentState.patternConfidence + 0.08, // +0.08 for acted (vs 0.05 before)
        1.0,
      )
      return { nextInterception: null }
    }

    if (outcome === 'dismissed') {
      interception.dismissed = true
      stats.attempted++
      this.typeEffectiveness.set(type, stats)
      this.agentState.patternConfidence = Math.max(this.agentState.patternConfidence - 0.02, 0)
    }

    if (outcome === 'ignored') {
      stats.attempted += 2 // Ignored counts more against the type
      this.typeEffectiveness.set(type, stats)
    }

    this.agentState.lastInterception = new Date().toISOString()

    // Strategy chaining: on dismiss/ignore, try next in chain
    if ((outcome === 'dismissed' || outcome === 'ignored') && signalId) {
      const nextType = this.nextStrategyAfter(type, signalId)
      if (nextType) {
        return { nextInterception: nextType }
      }
    }

    return { nextInterception: null }
  }

  private resolveInterceptionType(interception: AgentInterception): InterceptionType {
    // Map AgentInterception type back to InterceptionType
    const map: Record<string, InterceptionType> = {
      drift_warning: 'gentle_nudge',
      pattern_match: 'pattern_insight',
      avoidance_detected: 'escalating_intervention',
      energy_mismatch: 'body_double_prompt',
      comeback_opportunity: 'comeback_invitation',
    }
    return map[interception.type] || 'gentle_nudge'
  }

  // ── Helper Methods ─────────────────────────────────────────

  private getSurfacePriority(): SurfaceType[] {
    if (this.agentState.userIsInApp) return ['app', 'notification']
    if (this.agentState.userIsInSession) return ['app', 'live_activity']
    return this.config.enabledSurfaces
  }

  private isHighRiskTime(hour: number): boolean {
    if (!this.patternProfile) return false
    return this.patternProfile.mostCommonDriftTime === hour
  }

  private selectInterception(type: InterceptionType, state: UserState): InterceptionStrategy {
    const messages: Record<InterceptionType, string> = {
      gentle_nudge: this.getGentleNudgeMessage(state),
      pattern_insight: this.getPatternInsightMessage(state),
      micro_mission_push: '',
      body_double_prompt: `Start a body double session? Having virtual company can help right now.`,
      salvage_offer: `Want to salvage your last session? Partial progress still counts.`,
      mission_simplify: `Let's break this into something you can do in 2 minutes.`,
      distraction_shield: `We've noticed ${state} distractions. Want to enable focus mode?`,
      comeback_invitation: `You usually come back strong. A 2-minute start is all it takes.`,
      streak_reminder: `Your streak is still alive. Even 2 minutes keeps the chain going.`,
      brain_dump_action: `You have items from your brain dump waiting to become action.`,
      escalating_intervention: `This is the third time we've noticed this pattern. What would actually help right now?`,
      crisis_intervention: `Your safety matters most. Please reach out to someone who can help.`,
    }

    return {
      type,
      message: messages[type],
      action: {
        id: `action_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'start_micro_mission' as const,
        title: this.getActionLabel(type),
        description: messages[type],
        estimated_minutes: 2,
        mission_id: null,
        micro_mission_id: null,
        requires_approval: false,
        auto_execute: false,
        priority: 'medium' as const,
        created_at: new Date().toISOString(),
      },
      fallbackType: 'gentle_nudge',
      escalationCount: 0,
      lastAttempt: null,
      cooldownMinutes: 20,
    }
  }

  private getActionLabel(type: InterceptionType): string {
    const labels: Record<InterceptionType, string> = {
      gentle_nudge: 'Start 2 min',
      pattern_insight: 'Try it',
      micro_mission_push: 'Show me',
      body_double_prompt: 'Start body double',
      salvage_offer: 'Salvage session',
      mission_simplify: 'Simplify',
      distraction_shield: 'Enable focus mode',
      comeback_invitation: 'Come back',
      streak_reminder: 'Save streak',
      brain_dump_action: 'Process dump',
      escalating_intervention: 'I need help',
      crisis_intervention: 'Get support',
    }
    return labels[type]
  }

  // ── v4: Strategy Chaining ──────────────────────────────────
  // Each InterceptionType can have fallbacks in priority order.
  // When one fails (dismissed/ignored), the next in chain fires.
  private getStrategyChain(type: InterceptionType): InterceptionType[] {
    const customChain = this.config.strategyChain[type]
    if (customChain) return [type, ...customChain]

    // Default chains per signal
    const defaultChains: Partial<Record<InterceptionType, InterceptionType[]>> = {
      gentle_nudge: ['gentle_nudge', 'pattern_insight', 'micro_mission_push'],
      pattern_insight: ['pattern_insight', 'body_double_prompt', 'streak_reminder'],
      salvage_offer: ['salvage_offer', 'mission_simplify', 'micro_mission_push'],
      distraction_shield: ['distraction_shield', 'body_double_prompt', 'gentle_nudge'],
      streak_reminder: ['streak_reminder', 'comeback_invitation', 'gentle_nudge'],
      comeback_invitation: ['comeback_invitation', 'salvage_offer', 'micro_mission_push'],
      micro_mission_push: ['micro_mission_push', 'body_double_prompt', 'gentle_nudge'],
      mission_simplify: ['mission_simplify', 'micro_mission_push', 'gentle_nudge'],
      body_double_prompt: ['body_double_prompt', 'micro_mission_push', 'gentle_nudge'],
      escalating_intervention: ['escalating_intervention', 'crisis_intervention', 'comeback_invitation'],
    }
    return defaultChains[type] || [type]
  }

  // Get the next strategy in the chain after a failure
  nextStrategyAfter(current: InterceptionType, signalId: string): InterceptionType | null {
    const state = this.strategyChainState.get(signalId)
    if (!state) return null
    const chain = this.getStrategyChain(current)
    const nextIndex = state.chainIndex + 1
    if (nextIndex >= chain.length) return null
    // Update chain position
    this.strategyChainState.set(signalId, { chainIndex: nextIndex, startedAt: state.startedAt })
    return chain[nextIndex]
  }

  // Start or reset strategy chain for a signal
  initStrategyChain(signalId: string, type: InterceptionType): void {
    this.strategyChainState.set(signalId, { chainIndex: 0, startedAt: Date.now() })
  }

  // v4: Signal deduplication — don't fire same type within cooldown window
  private isSignalOnCooldown(type: DriftSignalType): boolean {
    const timestamps = this.lastSignalTimestamps.get(type)
    if (!timestamps || timestamps.length === 0) return false
    const now = Date.now()
    // Count fires in cooldown window
    const recentFires = timestamps.filter(t => (now - t) < this.config.signalCooldownMinutes * 60000)
    this.lastSignalTimestamps.set(type, recentFires) // cleanup stale
    return recentFires.length > 0
  }

  private recordSignalFire(type: DriftSignalType): void {
    const timestamps = this.lastSignalTimestamps.get(type) || []
    timestamps.push(Date.now())
    // Keep last 10
    if (timestamps.length > 10) timestamps.splice(0, timestamps.length - 10)
    this.lastSignalTimestamps.set(type, timestamps)
  }

  // v4: Per-type daily limit
  private hasExceededDailyLimit(type: InterceptionType): boolean {
    const stats = this.typeEffectiveness.get(type)
    if (!stats) return false
    return stats.attempted >= this.config.maxPerTypePerDay
  }

  // v4: Adaptive cooldown — if a type has <30% success rate, increase its cooldown
  private getEffectiveCooldown(type: InterceptionType): number {
    if (!this.config.adaptiveCooldown) return this.config.minInterceptionIntervalMinutes
    const stats = this.typeEffectiveness.get(type)
    if (!stats || stats.attempted < 3) return this.config.minInterceptionIntervalMinutes
    const successRate = stats.succeeded / stats.attempted
    if (successRate < 0.2) return this.config.minInterceptionIntervalMinutes * 3
    if (successRate < 0.35) return this.config.minInterceptionIntervalMinutes * 2
    return this.config.minInterceptionIntervalMinutes
  }

  private getInactivityMessage(state: UserState, name: string): string {
    const greeting = name ? `${name},` : 'Hey,'
    switch (state) {
      case 'avoiding': return `${greeting} you've been away. What's one tiny thing you could do right now?`
      case 'tired': return `${greeting} you've been resting. When you're ready, even 2 minutes counts.`
      default: return `${greeting} it's been a while since your last session. Want to start small?`
    }
  }

  private getPatternMessage(name: string): string {
    const greeting = name ? `${name},` : ''
    return `${greeting} this is usually when you tend to drift. Want to get ahead of it?`
  }

  private getAbandonedStreakMessage(name: string, count: number): string {
    if (count >= 3) {
      return `${count} sessions didn't stick recently. That's okay. Want to try a much smaller version?`
    }
    return `Your last couple of sessions got abandoned. What would make the next one easier?`
  }

  private getStreakMessage(name: string, hour: number): string {
    if (hour >= 21) {
      return `Your streak is still alive! Even 2 minutes before bed keeps it going.`
    }
    return `You haven't had a session today yet. Your streak is still alive.`
  }

  private getComebackMessage(name: string): string {
    const greeting = name ? `${name},` : ''
    return `${greeting} this is when you usually bounce back. One small action keeps the momentum.`
  }

  private getGentleNudgeMessage(state: UserState): string {
    switch (state) {
      case 'avoiding': return `You might be avoiding something. Open it for just 2 minutes.`
      case 'overwhelmed': return `Too much? Write it all down, then circle just one thing.`
      case 'stuck': return `Stuck? What's the very next physical action? Not the project — the action.`
      case 'tired': return `Tired? Do the easiest version, or rest intentionally for 10 minutes.`
      case 'distracted': return `Distracted? Write them all down, then set a 15-minute timer.`
      case 'anxious': return `Anxious? Name the fear, then start for 5 minutes before you feel ready.`
      case 'scattered': return `Scattered? Close everything. One mission. One timer.`
      case 'ready': return `You're in the zone. Protect it. Start now.`
      default: return `Want to start a focus session?`
    }
  }

  private getPatternInsightMessage(state: UserState): string {
    return `You usually struggle around this time. Get ahead of it: what's one 2-minute win?`
  }

  private getTopDistractionCategory(distractions: Distraction[]): string {
    const categories: Record<string, number> = {}
    for (const d of distractions) {
      const cat = categorizeDistraction(d.content)
      categories[cat] = (categories[cat] || 0) + 1
    }
    let top = 'other'
    let max = 0
    for (const [cat, count] of Object.entries(categories)) {
      if (count > max) { max = count; top = cat }
    }
    return top
  }

  private mapInterceptionType(signalType: DriftSignalType): AgentInterception['type'] {
    switch (signalType) {
      case 'session_inactivity': return 'drift_warning'
      case 'time_of_day_pattern': return 'pattern_match'
      case 'abandoned_streak': return 'avoidance_detected'
      case 'mission_stall': return 'avoidance_detected'
      case 'energy_mismatch': return 'energy_mismatch'
      case 'distraction_cluster': return 'drift_warning'
      case 'resistance_pattern': return 'pattern_match'
      case 'comeback_window': return 'comeback_opportunity'
      case 'streak_at_risk': return 'drift_warning'
      case 'body_double_idle': return 'energy_mismatch'
      case 'brain_dump_pending': return 'drift_warning'
      case 'overload_detected': return 'energy_mismatch'
      default: return 'drift_warning'
    }
  }

  private numberToConfidence(n: number): AgentConfidence {
    if (n >= 0.9) return 'certain'
    if (n >= 0.7) return 'high'
    if (n >= 0.4) return 'medium'
    return 'low'
  }

  // ── Public Accessors ───────────────────────────────────────

  getAgentState(): AgentState {
    return { ...this.agentState }
  }

  getSignalHistory(): DriftSignal[] {
    return [...this.signalHistory]
  }

  getConfig(): OrchestratorConfig {
    return { ...this.config }
  }

  // v4: Expose effectiveness stats for UI/learning
  getTypeEffectiveness(): Map<InterceptionType, { attempted: number; succeeded: number }> {
    return new Map(this.typeEffectiveness)
  }

  getTypeSuccessRate(type: InterceptionType): number | null {
    const stats = this.typeEffectiveness.get(type)
    if (!stats || stats.attempted === 0) return null
    return stats.succeeded / stats.attempted
  }

  // v4: Reset adaptive tracking (e.g., on profile change)
  resetAdaptiveTracking(): void {
    this.typeEffectiveness.clear()
    this.strategyChainState.clear()
    this.lastSignalTimestamps.clear()
  }
}

// ── Utility ─────────────────────────────────────────────────

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}
