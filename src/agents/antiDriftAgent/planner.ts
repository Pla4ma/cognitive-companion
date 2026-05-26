// ══════════════════════════════════════════════════════════════
// INTENT — Anti-Drift Agent: Planner (Main Entry Point)
// Orchestrates the full agent decision pipeline
// ══════════════════════════════════════════════════════════════

import type {
  AntiDriftInput,
  AntiDriftOutput,
  AgentDecision,
  AgentDecisionType,
  CoachPulse,
  SafetyStatus,
  ProposedTool,
  FallbackTier,
} from './types'
import type { RescueProtocol, RescueProtocolId } from '../../types'
import { RESCUE_PROTOCOLS } from '../../types'
import { buildInterventionDecisions } from './policy'
import { buildSafetyStatus, classifyInput, getCrisisResponse } from './safety'
import { getDeterministicCoachPulse, getDeterministicMission, selectFallbackTier } from './fallbacks'
import { extractMemoryUpdates, generateGraphUpdates } from './memory'
import { INTERNAL_TOOLS } from './tools'

/**
 * Main entry point for the Anti-Drift Agent.
 * Deterministic-first: produces usable output without remote AI.
 */
export function runAntiDriftAgent(input: AntiDriftInput): AntiDriftOutput {
  const { moment, recentSignals, driftGraph, privacySettings, isComeback, abandonCountToday } = input
  const now = new Date().toISOString()

  // ── Step 0: No-moment fallback (home screen idle) ─────────
  if (!moment) {
    return buildIdleOutput(input, now)
  }

  // ── Step 1: Safety check ──────────────────────────────────
  const userText = moment.context_text || ''
  const safety = buildSafetyStatus(userText, ['create_mission', 'start_mission'])

  // Crisis: block productivity, offer support
  if (safety.level === 'crisis') {
    const crisisResponse = getCrisisResponse()
    return {
      decision: {
        type: 'no_action_needed',
        reason: 'Crisis detected',
        confidence: 1,
        urgency: 'high',
        requiresConfirmation: false,
        explanation: crisisResponse.message,
      },
      recommendedProtocol: RESCUE_PROTOCOLS['comeback_seed'],
      compiledMission: null,
      coachPulse: {
        message: crisisResponse.message,
        emoji: '💙',
        tone: 'gentle',
        followUpQuestion: null,
        quickActions: crisisResponse.resources.map(r => ({
          id: r.label,
          label: r.label,
          emoji: '📞',
          action: 'no_action_needed' as AgentDecisionType,
        })),
        source: 'deterministic',
      },
      interventions: {
        shouldStartBodyDouble: false,
        bodyDoubleReason: null,
        shouldHideStats: true,
        hideStatsReason: 'Crisis detected. Hide all stats.',
        shouldOfferSalvage: false,
        salvageReason: null,
        shouldUseRemoteAI: false,
        useRemoteAIReason: 'Crisis. No AI.',
        shouldSuggestBrainDump: false,
        shouldSuggestRest: false,
        shouldInterceptDoomscroll: false,
      },
      proposedTools: [],
      safetyStatus: safety,
      usedRemoteAI: false,
      fallbackTierUsed: 'deterministic_rules',
      auditLog: [],
      graphUpdates: [],
      memoryUpdates: [],
      confidence: 1,
    }
  }

  // ── Step 2: Select protocol ───────────────────────────────
  const protocolId = selectProtocol(moment.user_state, driftGraph) as RescueProtocolId
  const protocol = RESCUE_PROTOCOLS[protocolId]

  // ── Step 3: Build intervention decisions ──────────────────
  const interventions = buildInterventionDecisions({
    state: moment.user_state,
    energy: moment.energy_level,
    signals: recentSignals,
    abandonCountToday,
    hasActiveSession: input.hasActiveSession,
    missionsCompletedToday: input.missionsCompletedToday,
    focusMinutesToday: input.focusMinutesToday,
    localOnlyMode: privacySettings.localOnlyMode,
    remoteAiEnabled: privacySettings.remoteAiEnabled,
    hasContextText: !!moment.context_text,
    hasComplexBlocker: !!moment.selected_blocker && moment.selected_blocker !== 'unknown',
    deterministicOutputQuality: 0.7, // TODO: compute from mission compiler
  })

  // ── Step 4: Generate coach pulse ──────────────────────────
  const coachPulse: CoachPulse = {
    message: getDeterministicCoachPulse(moment.user_state, moment.available_minutes, moment.selected_blocker),
    emoji: getEmojiForState(moment.user_state),
    tone: protocol.coachToneRules.defaultTone,
    followUpQuestion: generateFollowUpQuestion(moment.user_state, moment.intensity),
    quickActions: generateQuickActions(moment.user_state, protocolId),
    source: 'deterministic',
  }

  // ── Step 5: Determine agent decision ──────────────────────
  const decision = buildDecision(moment, protocol, isComeback, interventions)

  // ── Step 6: Propose tools ─────────────────────────────────
  const proposedTools = buildProposedTools(decision, protocol, privacySettings)

  // ── Step 7: Select fallback tier ──────────────────────────
  const fallbackTier = selectFallbackTier({
    localOnlyMode: privacySettings.localOnlyMode,
    remoteAiEnabled: privacySettings.remoteAiEnabled,
    onDeviceAiAvailable: false, // TODO: check native module
    hasCachedPatterns: (driftGraph?.totalEvents || 0) > 5,
  })

  // ── Step 8: Build output ──────────────────────────────────
  return {
    decision,
    recommendedProtocol: protocol,
    compiledMission: null, // Filled asynchronously by Mission Compiler
    coachPulse,
    interventions,
    proposedTools,
    safetyStatus: safety,
    usedRemoteAI: false,
    fallbackTierUsed: fallbackTier,
    auditLog: [],
    graphUpdates: generateGraphUpdates({
      state: moment.user_state,
      blocker: moment.selected_blocker,
      protocolId,
      outcome: 'completed', // Will be updated when session ends
      durationMinutes: moment.available_minutes,
      energy: moment.energy_level,
      surface: input.source,
    }),
    memoryUpdates: extractMemoryUpdates({
      state: moment.user_state,
      blocker: moment.selected_blocker,
      protocolId,
      outcome: 'completed',
      durationMinutes: moment.available_minutes,
      energy: moment.energy_level,
      source: input.source,
    }),
    confidence: decision.confidence,
  }
}

// ── Helper Functions ────────────────────────────────────────

function selectProtocol(state: string, driftGraph: any): string {
  // Use drift graph if we have reliable data
  if (driftGraph && driftGraph.totalEvents >= 8) {
    // TODO: look up best protocol from graph
  }
  // Fall back to deterministic mapping
  const mapping: Record<string, string> = {
    avoiding: 'two_minute_ignition',
    overwhelmed: 'shrink_the_beast',
    stuck: 'body_double_start',
    tired: 'maintenance_spark',
    distracted: 'lock_the_door',
    anxious: 'pressure_valve',
    scattered: 'clear_the_fog',
    ready: 'two_minute_ignition',
    bored: 'doomscroll_intercept',
    perfectionism: 'ugly_first_move',
    unclear: 'clear_the_fog',
    time_pressure: 'pressure_valve',
    low_confidence: 'comeback_seed',
    shame_spiral: 'comeback_seed',
    fake_productivity: 'planning_loop_breaker',
    planning_loop: 'planning_loop_breaker',
    doomscroll_risk: 'doomscroll_intercept',
  }
  return mapping[state] || 'two_minute_ignition'
}

function buildDecision(
  moment: any,
  protocol: RescueProtocol,
  isComeback: boolean,
  interventions: any,
): AgentDecision {
  if (isComeback) {
    return {
      type: 'comeback_welcome',
      reason: 'User is returning after inactivity',
      confidence: 0.9,
      urgency: 'medium',
      requiresConfirmation: false,
      explanation: 'Welcome back. No guilt. One tiny thing.',
    }
  }

  if (interventions.shouldInterceptDoomscroll) {
    return {
      type: 'doomscroll_intercept',
      reason: 'Doomscroll risk detected',
      confidence: 0.8,
      urgency: 'high',
      requiresConfirmation: false,
      explanation: 'About to scroll? Give me 2 minutes first.',
    }
  }

  if (interventions.shouldSuggestBrainDump) {
    return {
      type: 'brain_dump',
      reason: 'Overwhelmed or scattered state',
      confidence: 0.7,
      urgency: 'medium',
      requiresConfirmation: false,
      explanation: 'Too much in your head. Let it out.',
    }
  }

  if (interventions.shouldSuggestRest) {
    return {
      type: 'rest_suggestion',
      reason: 'Low energy or depleted',
      confidence: 0.7,
      urgency: 'low',
      requiresConfirmation: false,
      explanation: 'Rest is productive. Or do the easiest possible thing.',
    }
  }

  return {
    type: 'start_mission',
    reason: `Protocol: ${protocol.name}`,
    confidence: 0.8,
    urgency: moment.intensity >= 4 ? 'high' : moment.intensity >= 3 ? 'medium' : 'low',
    requiresConfirmation: false,
    explanation: `When ${moment.user_state}, ${protocol.name} works best.`,
  }
}

function buildProposedTools(decision: AgentDecision, protocol: RescueProtocol, privacy: any): ProposedTool[] {
  const tools: ProposedTool[] = []

  // Always propose create_mission
  const createTool = INTERNAL_TOOLS.find(t => t.id === 'create_mission')
  if (createTool) {
    tools.push({
      toolId: createTool.id,
      toolName: createTool.name,
      riskLevel: createTool.riskLevel,
      category: createTool.category,
      autoExecutable: true,
      parameters: {},
      reason: 'Create the compiled mission',
    })
  }

  // Propose start_mission
  if (decision.type === 'start_mission') {
    const startTool = INTERNAL_TOOLS.find(t => t.id === 'start_mission')
    if (startTool) {
      tools.push({
        toolId: startTool.id,
        toolName: startTool.name,
        riskLevel: startTool.riskLevel,
        category: startTool.category,
        autoExecutable: false,
        parameters: {},
        reason: 'Start the mission timer',
      })
    }
  }

  // Propose body double
  if (decision.type === 'start_mission' && protocol.bodyDoubleRules.defaultMode !== 'silent_room') {
    tools.push({
      toolId: 'start_body_double',
      toolName: 'Start Body Double',
      riskLevel: 'low',
      category: 'internal',
      autoExecutable: false,
      parameters: { mode: protocol.bodyDoubleRules.defaultMode },
      reason: `Body double mode: ${protocol.bodyDoubleRules.defaultMode}`,
    })
  }

  return tools
}

function getEmojiForState(state: string): string {
  const emojis: Record<string, string> = {
    avoiding: '🙈', overwhelmed: '🌊', stuck: '🫠', tired: '😴',
    distracted: '🦋', anxious: '😰', scattered: '🌪️', ready: '🚀',
    bored: '😑', perfectionism: '✨', unclear: '❓', time_pressure: '⏰',
    low_confidence: '😔', shame_spiral: '🌀', fake_productivity: '📋',
    planning_loop: '🔄', doomscroll_risk: '📱',
  }
  return emojis[state] || '💡'
}

function generateFollowUpQuestion(state: string, intensity: number): string | null {
  if (intensity >= 4) {
    return 'What\'s the one thing that would make this feel smaller?'
  }
  if (state === 'overwhelmed' || state === 'scattered') {
    return 'What\'s pulling your attention right now?'
  }
  if (state === 'avoiding') {
    return 'What are you avoiding?'
  }
  return null
}

/**
 * Build output for when no active moment exists (home screen idle state).
 * Returns a gentle, non-intrusive suggestion.
 */
function buildIdleOutput(input: AntiDriftInput, now: string): AntiDriftOutput {
  const defaultProtocol = RESCUE_PROTOCOLS['two_minute_ignition']
  return {
    decision: {
      type: 'no_action_needed',
      reason: 'No active moment — idle state',
      confidence: 0.5,
      urgency: 'low',
      requiresConfirmation: false,
      explanation: 'Pick a state when you feel drift starting.',
    },
    recommendedProtocol: defaultProtocol,
    compiledMission: null,
    coachPulse: {
      message: 'Ready when you are. Tap a state to start.',
      tone: 'gentle',
      emoji: '💡',
      followUpQuestion: null,
      quickActions: [],
      source: 'deterministic',
    },
    interventions: {
      shouldStartBodyDouble: false, bodyDoubleReason: null,
      shouldHideStats: false, hideStatsReason: null,
      shouldOfferSalvage: false, salvageReason: null,
      shouldUseRemoteAI: false, useRemoteAIReason: null,
      shouldSuggestBrainDump: false,
      shouldSuggestRest: false,
      shouldInterceptDoomscroll: false,
    },
    proposedTools: [],
    safetyStatus: { level: 'safe' as const, crisisDetected: false, shameRewritten: false, actionsBlocked: [], notes: [] },
    usedRemoteAI: false,
    fallbackTierUsed: 'deterministic_rules' as FallbackTier,
    auditLog: [],
    graphUpdates: [],
    memoryUpdates: [],
    confidence: 0.5,
  }
}

function generateQuickActions(state: string, protocolId: string): any[] {
  const actions = [
    { id: 'start', label: 'Start', emoji: '▶️', action: 'start_mission' as AgentDecisionType },
    { id: 'smaller', label: 'Smaller', emoji: '🔽', action: 'start_mission' as AgentDecisionType },
  ]

  if (state === 'doomscroll_risk' || state === 'avoiding') {
    actions.push({ id: '2min', label: '2 min', emoji: '⏱️', action: 'start_mission' as AgentDecisionType })
  }

  return actions
}
