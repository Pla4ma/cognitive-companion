// ══════════════════════════════════════════════════════════════
// INTENT — Anti-Avoidance Engine
// Deterministic mission generation, resistance handling, salvage logic
// This is the core IP of the app. No AI needed — it's all local.
// ══════════════════════════════════════════════════════════════

import { 
  UserState, StateChip, STATE_CHIPS, Mission, MicroMission,
  ResistanceLevel, ResistancePattern, Distraction, BrainDump,
  PushStyle, MissionSession, EnergyLevel, BodyDoubleMode,
} from '../types'

// ── State Detection ───────────────────────────────────────

export function detectAvoidanceState(
  recentSessions: { started_at: string; status: string }[],
  pendingMissions: Mission[],
  lastActivityMinutes: number
): UserState {
  const now = Date.now()
  
  if (lastActivityMinutes > 4320) return 'avoiding'
  
  const pendingCount = pendingMissions.filter(m => m.status === 'active').length
  if (pendingCount > 5) return 'overwhelmed'
  
  const recentAbandoned = recentSessions.filter(s => {
    const age = (now - new Date(s.started_at).getTime()) / 60000
    return age < 1440 && s.status === 'abandoned'
  })
  if (recentAbandoned.length >= 3) return 'stuck'
  
  const hour = new Date().getHours()
  if (hour >= 23 || hour < 6) return 'tired'
  
  return 'ready'
}

// ── Micro-Mission Generator ───────────────────────────────

interface MissionContext {
  state: UserState
  mission: Mission | null
  push_style: PushStyle
  availableMinutes: number
  resistanceHistory: ResistancePattern[]
}

export function generateMicroMission(context: MissionContext): {
  title: string
  description: string
  estimated_minutes: number
  body_double_mode: string
  resistance_acknowledgment: string
} {
  const chip = STATE_CHIPS[context.state]
  
  const templates: Record<UserState, () => ReturnType<typeof generateMicroMission>> = {
    avoiding: () => ({
      title: `2-minute start: ${context.mission?.title ?? 'something small'}`,
      description: 'Set a timer for 2 minutes. Open the thing you\'re avoiding. Write one sentence. That\'s it. You can stop after 2 minutes if you want.',
      estimated_minutes: 2,
      body_double_mode: 'presence',
      resistance_acknowledgment: 'You\'re avoiding this. That\'s normal. The resistance is lying to you — it always feels worse before you start.',
    }),
    overwhelmed: () => ({
      title: 'Brain dump + pick one',
      description: 'Write down everything on your mind. Don\'t organize. Just dump. Then circle the ONE thing that would make everything else easier.',
      estimated_minutes: 5,
      body_double_mode: 'voice',
      resistance_acknowledgment: 'You have too much going on. Let\'s clear the fog first. One thing at a time.',
    }),
    stuck: () => ({
      title: 'Find the next physical action',
      description: 'Don\'t think about the project. What\'s the very next physical action? "Open laptop" not "work on project." Do that.',
      estimated_minutes: 10,
      body_double_mode: 'presence',
      resistance_acknowledgment: 'You\'re stuck because you\'re thinking about the whole thing. Let\'s find the smallest next step.',
    }),
    tired: () => ({
      title: 'Low-energy version',
      description: 'What\'s the easiest possible version of this task? Do that. Or rest intentionally — set a timer for 10 minutes and close your eyes.',
      estimated_minutes: 5,
      body_double_mode: 'presence',
      resistance_acknowledgment: 'You\'re tired. That\'s real. Let\'s do something small or rest properly. Both are productive.',
    }),
    distracted: () => ({
      title: 'Capture + focus sprint',
      description: 'Write down every distraction pulling at you. Get them out of your head. Then set a 15-minute timer. Phone in another room.',
      estimated_minutes: 15,
      body_double_mode: 'screen_share',
      resistance_acknowledgment: 'Your environment is working against you. Let\'s capture what\'s pulling you away, then create a bubble.',
    }),
    anxious: () => ({
      title: 'Name the fear + 5-minute start',
      description: 'Write down exactly what you\'re afraid of. Be specific. Then set a 5-minute timer. Start before you feel ready.',
      estimated_minutes: 5,
      body_double_mode: 'voice',
      resistance_acknowledgment: 'Anxiety is your brain trying to protect you. Name it, thank it, then move anyway.',
    }),
    scattered: () => ({
      title: 'Close everything + one mission',
      description: 'Close all browser tabs. Close all apps. Pick ONE mission. Set a timer. Everything else can wait.',
      estimated_minutes: 10,
      body_double_mode: 'presence',
      resistance_acknowledgment: 'You\'re trying to do everything at once. Let\'s do one thing well instead.',
    }),
    ready: () => ({
      title: `Full focus: ${context.mission?.title ?? 'your mission'}`,
      description: 'You\'re in the zone. Protect this state. Set a 25-minute timer. Phone away. Full focus.',
      estimated_minutes: 25,
      body_double_mode: 'none',
      resistance_acknowledgment: 'You\'re ready. Don\'t waste this energy on preparation. Start now.',
    }),
    // Extended states
    bored: () => ({
      title: 'Make it interesting',
      description: 'Add a constraint: do it in 10 minutes, do it badly on purpose, or do it standing up. Boredom needs novelty, not more time.',
      estimated_minutes: 10,
      body_double_mode: 'none',
      resistance_acknowledgment: 'Boredom is your brain asking for stimulation, not escape. Change the conditions, not the task.',
    }),
    perfectionism: () => ({
      title: 'Ugly first version',
      description: 'Make the worst possible version on purpose. Write the worst first sentence. Create the ugliest draft. Permission to be bad.',
      estimated_minutes: 5,
      body_double_mode: 'presence',
      resistance_acknowledgment: 'Perfectionism is fear wearing a fancy outfit. Make it ugly first. You can fix it later.',
    }),
    unclear: () => ({
      title: 'Name the confusion',
      description: 'Write one sentence: "I don\'t know how to start because _______." Fill in the blank. That\'s your real first step.',
      estimated_minutes: 5,
      body_double_mode: 'voice',
      resistance_acknowledgment: 'Unclear tasks feel impossible. Name the confusion and it shrinks.',
    }),
    time_pressure: () => ({
      title: 'Define "enough"',
      description: 'Write down: "Done means _______." Not perfect. Done. Then do only that.',
      estimated_minutes: 5,
      body_double_mode: 'none',
      resistance_acknowledgment: 'Time pressure makes everything feel urgent. Define "enough" and ignore the rest.',
    }),
    low_confidence: () => ({
      title: '2-minute proof',
      description: 'Do the smallest possible version. 2 minutes. If it\'s terrible, you\'re learning. If it\'s good, you\'re moving.',
      estimated_minutes: 2,
      body_double_mode: 'presence',
      resistance_acknowledgment: 'Low confidence wants proof before action. Give it 2 minutes of proof, not 2 hours of worry.',
    }),
    shame_spiral: () => ({
      title: 'Reset, not punish',
      description: 'You\'re not behind. You\'re human. Pick one tiny thing. Do it. That\'s the reset.',
      estimated_minutes: 2,
      body_double_mode: 'voice',
      resistance_acknowledgment: 'Shame spirals want you to do everything or nothing. Do one tiny thing. That breaks the spiral.',
    }),
    fake_productivity: () => ({
      title: 'Stop planning, start doing',
      description: 'Close the planning app. Open the real work. Do one physical action. Planning is not progress.',
      estimated_minutes: 5,
      body_double_mode: 'presence',
      resistance_acknowledgment: 'Planning feels like work. It\'s not. One real action beats 10 more minutes of planning.',
    }),
    planning_loop: () => ({
      title: 'Planning loop breaker',
      description: 'You\'ve planned enough. Set a 5-minute timer. Do the first physical action. No more planning until the timer ends.',
      estimated_minutes: 5,
      body_double_mode: 'presence',
      resistance_acknowledgment: 'Planning loops feel productive but they\'re avoidance. Break the loop with one physical action.',
    }),
    doomscroll_risk: () => ({
      title: '2 minutes before you scroll',
      description: 'Give me 2 minutes before you disappear. One tiny action. Then you can scroll with a clear conscience.',
      estimated_minutes: 2,
      body_double_mode: 'presence',
      resistance_acknowledgment: 'You\'re about to scroll. That\'s okay. But give me 2 minutes first. One tiny win before the slip.',
    }),
  }

  return templates[context.state]()
}

// ── Salvage Logic ─────────────────────────────────────────

export function shouldOfferSalvage(
  session: { actual_seconds: number; planned_minutes: number; status: string }
): boolean {
  if (session.status !== 'abandoned') return false
  const completionRatio = session.actual_seconds / (session.planned_minutes * 60)
  return completionRatio >= 0.2
}

export function generateSalvagePlan(
  session: { actual_seconds: number; planned_minutes: number },
  mission: Mission | null
): {
  salvageable: boolean
  adjusted_title: string
  adjusted_minutes: number
  encouragement: string
  momentum_points: number
} {
  const actualMinutes = Math.round(session.actual_seconds / 60)
  const completionRatio = session.actual_seconds / Math.max(session.planned_minutes * 60, 1)

  if (completionRatio < 0.2) {
    return {
      salvageable: false,
      adjusted_title: '',
      adjusted_minutes: 0,
      encouragement: 'That\'s okay. Sometimes the timing is wrong. Try again when you\'re ready.',
      momentum_points: 5,
    }
  }

  return {
    salvageable: true,
    adjusted_title: `Salvaged: ${mission?.title ?? 'Mission'} (${actualMinutes}m)`,
    adjusted_minutes: actualMinutes,
    encouragement: `You showed up and did ${actualMinutes} minutes. That counts. Most people did zero. You didn't.`,
    momentum_points: Math.round(completionRatio * 20) + 10,
  }
}

// ── Momentum Score ────────────────────────────────────────

export function calculateMomentumScore(
  events: { type: string; points: number; created_at: string }[],
  days: number = 7
): { score: number; trend: 'up' | 'down' | 'stable'; breakdown: Record<string, number> } {
  const now = Date.now()
  const cutoff = now - days * 86400000
  const prevCutoff = cutoff - days * 86400000

  const recentEvents = events.filter(e => new Date(e.created_at).getTime() >= cutoff)
  const prevEvents = events.filter(e => {
    const t = new Date(e.created_at).getTime()
    return t >= prevCutoff && t < cutoff
  })

  const recentScore = recentEvents.reduce((sum, e) => sum + e.points, 0)
  const prevScore = prevEvents.reduce((sum, e) => sum + e.points, 0)

  let trend: 'up' | 'down' | 'stable' = 'stable'
  if (prevScore > 0) {
    const change = (recentScore - prevScore) / prevScore
    if (change > 0.1) trend = 'up'
    else if (change < -0.1) trend = 'down'
  }

  const breakdown: Record<string, number> = {}
  for (const event of recentEvents) {
    breakdown[event.type] = (breakdown[event.type] || 0) + event.points
  }

  return { score: recentScore, trend, breakdown }
}

// ── Resistance Pattern Analyzer ───────────────────────────

export function analyzeResistancePatterns(
  patterns: ResistancePattern[]
): {
  most_common_state: UserState | null
  most_effective_strategy: string | null
  trend: 'improving' | 'worsening' | 'stable'
  insight: string
} {
  if (patterns.length === 0) {
    return {
      most_common_state: null,
      most_effective_strategy: null,
      trend: 'stable',
      insight: 'Complete a few more sessions to see your resistance patterns.',
    }
  }

  const stateCounts: Record<string, number> = {}
  for (const p of patterns) {
    stateCounts[p.avoidance_state] = (stateCounts[p.avoidance_state] || 0) + p.frequency
  }
  const mostCommon = Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0]

  const strategySuccess: Record<string, { total: number; success: number }> = {}
  for (const p of patterns) {
    if (p.successful_strategy) {
      if (!strategySuccess[p.successful_strategy]) {
        strategySuccess[p.successful_strategy] = { total: 0, success: 0 }
      }
      strategySuccess[p.successful_strategy].total++
      strategySuccess[p.successful_strategy].success += p.frequency
    }
  }
  const bestStrategy = Object.entries(strategySuccess)
    .sort((a, b) => b[1].success / b[1].total - a[1].success / a[1].total)[0]

  const sorted = [...patterns].sort((a, b) => 
    new Date(a.last_occurred).getTime() - new Date(b.last_occurred).getTime()
  )
  const recent = sorted.slice(-5)
  const older = sorted.slice(0, -5)
  const recentFreq = recent.reduce((s, p) => s + p.frequency, 0) / Math.max(recent.length, 1)
  const olderFreq = older.reduce((s, p) => s + p.frequency, 0) / Math.max(older.length, 1)
  
  let trend: 'improving' | 'worsening' | 'stable' = 'stable'
  if (olderFreq > 0) {
    if (recentFreq < olderFreq * 0.8) trend = 'improving'
    else if (recentFreq > olderFreq * 1.2) trend = 'worsening'
  }

  const stateLabel = STATE_CHIPS[mostCommon[0] as UserState]?.label || mostCommon[0]
  const insight = `You most often feel ${stateLabel} when starting. ${bestStrategy ? `Your most effective strategy is: ${bestStrategy[0]}` : 'Try different strategies to find what works.'}`

  return {
    most_common_state: mostCommon[0] as UserState,
    most_effective_strategy: bestStrategy?.[0] || null,
    trend,
    insight,
  }
}

// ── Distraction Categorizer ────────────────────────────────

// ── Salvage Tiers v4 ───────────────────────────────────────

export type SalvageTier = 'complete' | 'gold' | 'silver' | 'bronze' | 'none'

export interface SalvageTierResult {
  tier: SalvageTier
  label: string
  encouragement: string
  adjustedMinutes: number
  momentumPoints: number
  nextAction: string        // What to do next after salvage
}

export function evaluateSalvageTier(session: {
  actual_seconds: number
  planned_minutes: number
}): SalvageTierResult {
  const actualMinutes = Math.round(session.actual_seconds / 60)
  const ratio = session.actual_seconds / Math.max(session.planned_minutes * 60, 1)

  if (ratio >= 0.9) {
    return {
      tier: 'complete',
      label: 'Completed',
      encouragement: 'You did it. Every minute counts.',
      adjustedMinutes: actualMinutes,
      momentumPoints: 30,
      nextAction: 'mark_complete',
    }
  }

  if (ratio >= 0.6) {
    return {
      tier: 'gold',
      label: 'Strong Session',
      encouragement: `You did ${actualMinutes} of ${session.planned_minutes} planned minutes. That is a win.`,
      adjustedMinutes: actualMinutes,
      momentumPoints: 22,
      nextAction: 'salvage_session',
    }
  }

  if (ratio >= 0.35) {
    return {
      tier: 'silver',
      label: 'Partial Progress',
      encouragement: `${actualMinutes} minutes is real progress. Most people do zero. You showed up.`,
      adjustedMinutes: actualMinutes,
      momentumPoints: 15,
      nextAction: 'salvage_session',
    }
  }

  if (ratio >= 0.15) {
    return {
      tier: 'bronze',
      label: 'Tiny Win',
      encouragement: `Even ${actualMinutes} minutes moves the needle. Momentum > perfection.`,
      adjustedMinutes: Math.max(actualMinutes, 1),
      momentumPoints: 8,
      nextAction: 'capture_distraction_and_retry',
    }
  }

  return {
    tier: 'none',
    label: 'Not Salvageable',
    encouragement: 'That is okay. Sometimes the timing is wrong. Try again when you are ready.',
    adjustedMinutes: 0,
    momentumPoints: 5,
    nextAction: 'start_fresh',
  }
}

// ── Mission Chaining v4 ─────────────────────────────────────

export interface ChainSuggestion {
  title: string
  description: string
  estimatedMinutes: number
  type: 'continue' | 'deepen' | 'switch' | 'rest'
}

export function suggestNextMission(
  completedMission: { title: string; actual_seconds: number; planned_minutes: number },
  state: UserState,
): ChainSuggestion {
  const ratio = completedMission.actual_seconds / Math.max(completedMission.planned_minutes * 60, 1)

  // If they completed most of the mission, suggest deepening
  if (ratio >= 0.7) {
    return {
      title: `Keep going: ${completedMission.title}`,
      description: 'You are in motion. Continue for another session while the momentum is there.',
      estimatedMinutes: completedMission.planned_minutes,
      type: 'continue',
    }
  }

  // If they did a bit but stopped, suggest a smaller version
  if (ratio >= 0.3) {
    return {
      title: `Easier version: ${completedMission.title}`,
      description: 'Make it even smaller. What is the absolute minimum next step?',
      estimatedMinutes: Math.max(2, Math.round(completedMission.planned_minutes / 2)),
      type: 'deepen',
    }
  }

  // State-based suggestions
  switch (state) {
    case 'overwhelmed':
      return {
        title: 'Brain dump what is left',
        description: 'Write down everything still on your mind. One item at a time.',
        estimatedMinutes: 3,
        type: 'switch',
      }
    case 'tired':
      return {
        title: 'Rest intentionally',
        description: 'Set a timer for 10 minutes. Close your eyes. No guilt.',
        estimatedMinutes: 10,
        type: 'rest',
      }
    case 'distracted':
      return {
        title: 'Capture remaining distractions',
        description: 'Write down anything still pulling at your attention.',
        estimatedMinutes: 2,
        type: 'switch',
      }
    default:
      return {
        title: `Tiny next: ${completedMission.title}`,
        description: 'What is one more tiny thing you can do?',
        estimatedMinutes: 2,
        type: 'continue',
      }
  }
}

// ── Context-Aware Micro-Mission Generation v4 ─────────────

export interface ContextAwareMissionParams {
  state: UserState
  mission: Mission | null
  pushStyle: PushStyle
  availableMinutes: number
  resistanceHistory: ResistancePattern[]
  timeOfDay: number        // 0-23
  energyLevel: EnergyLevel
  lastSessionOutcome: 'completed' | 'abandoned' | 'salvaged' | null
  consecutiveFailures: number  // How many recent sessions were abandoned
}

export function generateContextAwareMission(params: ContextAwareMissionParams): {
  title: string
  description: string
  estimatedMinutes: number
  bodyDoubleMode: BodyDoubleMode
  resistanceAcknowledgment: string
  adjustments: string[]      // Why the mission was adapted
} {
  const adjustments: string[] = []
  const base = generateMicroMission({
    state: params.state,
    mission: params.mission,
    push_style: params.pushStyle,
    availableMinutes: params.availableMinutes,
    resistanceHistory: params.resistanceHistory,
  })

  // 1. Cap duration to available time
  let estimatedMinutes = base.estimated_minutes
  if (params.availableMinutes < estimatedMinutes) {
    estimatedMinutes = Math.max(params.availableMinutes, 1)
    adjustments.push(`Capped to ${estimatedMinutes}m (${params.availableMinutes}m available)`)
  }

  // 2. Shrink if energy is depleted
  if (params.energyLevel === 'depleted') {
    estimatedMinutes = Math.min(estimatedMinutes, 2)
    adjustments.push('Depleted energy: shrunk to 2 min')
  }

  // 3. Enlarge if last session was completed and they have energy
  if (params.lastSessionOutcome === 'completed' && params.energyLevel === 'high') {
    estimatedMinutes = Math.min(estimatedMinutes + 5, 30)
    adjustments.push('Momentum boost: extended duration')
  }

  // 4. Shrink further if consecutive failures
  if (params.consecutiveFailures >= 2) {
    estimatedMinutes = Math.min(estimatedMinutes, 2)
    adjustments.push(`${params.consecutiveFailures} consecutive failures: minimized to 2 min`)
  }

  // 5. Late-night adjustment
  if (params.timeOfDay >= 22 || params.timeOfDay < 6) {
    estimatedMinutes = Math.min(estimatedMinutes, 5)
    if (base.body_double_mode !== 'none') {
      adjustments.push('Late hour: minimal body double mode')
    }
  }

  // 6. Pattern-aware resistance acknowledgment
  let resistanceAcknowledgment = base.resistance_acknowledgment
  const matchingPattern = params.resistanceHistory.find(p =>
    p.avoidance_state === params.state && p.frequency >= 3
  )
  if (matchingPattern) {
    resistanceAcknowledgment = `${base.resistance_acknowledgment} This is a familiar pattern (${matchingPattern.frequency}x). You have broken it before.`
    adjustments.push('Pattern match: added familiarity acknowledgment')
  }

  return {
    title: estimatedMinutes <= 2
      ? `Tiny: ${base.title}`
      : base.title,
    description: base.description,
    estimatedMinutes,
    bodyDoubleMode: base.body_double_mode as BodyDoubleMode,
    resistanceAcknowledgment,
    adjustments,
  }
}

export function categorizeDistraction(content: string): Distraction['category'] {
  const lower = content.toLowerCase()
  if (lower.includes('think') || lower.includes('wonder') || lower.includes('remember') || lower.includes('what if')) return 'thought'
  if (lower.includes('want') || lower.includes('feel like') || lower.includes('crave') || lower.includes('urge')) return 'urge'
  if (lower.includes('text') || lower.includes('message') || lower.includes('notification') || lower.includes('phone') || lower.includes('email')) return 'notification'
  if (lower.includes('noise') || lower.includes('people') || lower.includes('room') || lower.includes('comfortable') || lower.includes('chair')) return 'environment'
  if (lower.includes('anxious') || lower.includes('stressed') || lower.includes('worried') || lower.includes('scared') || lower.includes('frustrated')) return 'emotion'
  return 'other'
}

// ── Brain Dump Processor ──────────────────────────────────

export function processBrainDump(rawText: string): {
  items: string[]
  action_items: string[]
  worries: string[]
  ideas: string[]
} {
  const lines = rawText.split(/[.\n]/).map(l => l.trim()).filter(l => l.length > 0)
  const action_items: string[] = []
  const worries: string[] = []
  const ideas: string[] = []
  
  for (const line of lines) {
    const lower = line.toLowerCase()
    if (lower.includes('need to') || lower.includes('should') || lower.includes('have to') || lower.includes('must')) {
      action_items.push(line)
    } else if (lower.includes('worried') || lower.includes('anxious') || lower.includes('scared') || lower.includes('what if') || lower.includes('afraid')) {
      worries.push(line)
    } else if (lower.includes('idea') || lower.includes('what about') || lower.includes('could') || lower.includes('maybe')) {
      ideas.push(line)
    } else {
      action_items.push(line)
    }
  }
  
  return { items: lines, action_items, worries, ideas }
}

// ── Push Style Adapter ────────────────────────────────────

export function adaptMessageToPushStyle(baseMessage: string, style: PushStyle): string {
  switch (style) {
    case 'gentle':
      return baseMessage
        .replace(/must/gi, 'could')
        .replace(/need to/gi, 'might want to')
        .replace(/should/gi, 'could consider')
        .replace(/now/gi, 'when you\'re ready')
        .replace(/!/g, '.')
    case 'firm':
      return baseMessage
        .replace(/could/gi, 'need to')
        .replace(/might want to/gi, 'must')
        .replace(/when you're ready/gi, 'now')
        .replace(/consider/gi, 'do')
    case 'emergency':
      return `🚨 ${baseMessage}\n\nThis is not optional. Your future self is counting on you right now. 2 minutes. Go.`
    default:
      return baseMessage
  }
}
