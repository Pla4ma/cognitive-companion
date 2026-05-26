// ══════════════════════════════════════════════════════════════
// INTENT — Experiment Engine
// Helps users run self-experiments on their productivity
// ══════════════════════════════════════════════════════════════

import type { UserState } from '../../types'

export interface Experiment {
  id: string
  hypothesis: string
  startDate: string
  endDate: string
  targetState: UserState
  intervention: string
  successMetric: string
  result: ExperimentResult | null
  confidence: 'low' | 'emerging' | 'reliable' | 'strong'
  userFeedback: 'helpful' | 'not_helpful' | 'neutral' | null
  status: 'active' | 'completed' | 'cancelled'
}

export interface ExperimentResult {
  startRate: number // 0-1
  completionRate: number // 0-1
  salvageRate: number // 0-1
  userRating: number // 1-5
  conclusion: string
  recommendation: string
}

// ── Experiment Templates ────────────────────────────────────

export interface ExperimentTemplate {
  id: string
  title: string
  hypothesis: string
  targetStates: UserState[]
  intervention: string
  durationDays: number
  successMetric: string
}

export const EXPERIMENT_TEMPLATES: ExperimentTemplate[] = [
  {
    id: 'duration_2min',
    title: '2-Minute Default',
    hypothesis: 'When overwhelmed, 2-minute missions work better than longer ones.',
    targetStates: ['overwhelmed', 'scattered', 'avoiding'],
    intervention: 'INTENT will suggest 2-minute missions when you select the target state.',
    durationDays: 7,
    successMetric: 'Start rate and completion rate',
  },
  {
    id: 'protocol_ugly',
    title: 'Ugly First Move',
    hypothesis: 'Making an intentionally bad first version bypasses perfectionism.',
    targetStates: ['perfectionism', 'anxious', 'stuck'],
    intervention: 'INTENT will default to Ugly First Move for the target state.',
    durationDays: 7,
    successMetric: 'Start rate for writing/creative tasks',
  },
  {
    id: 'body_double_gentle',
    title: 'Gentle Body Double',
    hypothesis: 'Gentle check-ins work better than firm prompts when anxious.',
    targetStates: ['anxious', 'low_confidence', 'shame_spiral'],
    intervention: 'INTENT will use Gentle Co-Work body double mode.',
    durationDays: 7,
    successMetric: 'Completion rate and user rating',
  },
  {
    id: 'notification_timing',
    title: 'Notification Timing',
    hypothesis: 'Notifications at usual drift times reduce avoidance.',
    targetStates: ['avoiding', 'doomscroll_risk'],
    intervention: 'INTENT will send a rescue prompt at your usual drift time.',
    durationDays: 14,
    successMetric: 'Notification action conversion rate',
  },
  {
    id: 'morning_vs_evening',
    title: 'Morning vs Evening',
    hypothesis: 'Morning rescues have higher completion rates than evening ones.',
    targetStates: ['tired', 'bored'],
    intervention: 'INTENT will track morning vs evening completion rates.',
    durationDays: 14,
    successMetric: 'Completion rate by time of day',
  },
  {
    id: 'before_scroll',
    title: 'Before You Scroll',
    hypothesis: 'A 2-minute mission before scrolling reduces total scroll time.',
    targetStates: ['doomscroll_risk', 'bored', 'avoiding'],
    intervention: 'INTENT will intercept with a 2-minute mission before scrolling.',
    durationDays: 7,
    successMetric: 'Before-scroll completion rate',
  },
  {
    id: 'maintenance_spark',
    title: 'Maintenance Mode',
    hypothesis: 'Low-energy actions on tired days preserve momentum.',
    targetStates: ['tired', 'bored'],
    intervention: 'INTENT will suggest Maintenance Spark protocol on tired days.',
    durationDays: 7,
    successMetric: 'Comeback rate after tired days',
  },
  {
    id: 'decision_breaker',
    title: 'Let INTENT Choose',
    hypothesis: 'When there are too many choices, having INTENT pick one reduces paralysis.',
    targetStates: ['scattered', 'overwhelmed', 'unclear'],
    intervention: 'INTENT will use Decision Breaker to choose one action.',
    durationDays: 7,
    successMetric: 'Start rate for scattered/overwhelmed states',
  },
]

// ── Experiment Management ───────────────────────────────────

export function createExperiment(template: ExperimentTemplate, targetState: UserState): Experiment {
  const now = new Date()
  const endDate = new Date(now.getTime() + template.durationDays * 86400000)

  return {
    id: `exp_${Date.now()}`,
    hypothesis: template.hypothesis,
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    targetState,
    intervention: template.intervention,
    successMetric: template.successMetric,
    result: null,
    confidence: 'low',
    userFeedback: null,
    status: 'active',
  }
}

export function evaluateExperiment(
  experiment: Experiment,
  data: {
    totalAttempts: number
    completed: number
    salvaged: number
    userRating: number
  },
): Experiment {
  const startRate = data.totalAttempts > 0 ? (data.completed + data.salvaged) / data.totalAttempts : 0
  const completionRate = data.totalAttempts > 0 ? data.completed / data.totalAttempts : 0
  const salvageRate = data.totalAttempts > 0 ? data.salvaged / data.totalAttempts : 0

  let conclusion = ''
  let recommendation = ''

  if (completionRate >= 0.7) {
    conclusion = `Strong result! ${(completionRate * 100).toFixed(0)}% completion rate.`
    recommendation = 'Keep this as your default approach.'
  } else if (completionRate >= 0.5) {
    conclusion = `Moderate result. ${(completionRate * 100).toFixed(0)}% completion rate.`
    recommendation = 'This works sometimes. Try combining with another approach.'
  } else if (salvageRate >= 0.3) {
    conclusion = 'Low completion but high salvage rate. The intervention helps you recover.'
    recommendation = 'Keep the intervention but try a shorter duration.'
  } else {
    conclusion = `Low impact. Only ${(completionRate * 100).toFixed(0)}% completion rate.`
    recommendation = 'Try a different approach for this state.'
  }

  return {
    ...experiment,
    status: 'completed',
    result: {
      startRate,
      completionRate,
      salvageRate,
      userRating: data.userRating,
      conclusion,
      recommendation,
    },
    confidence: data.totalAttempts >= 10 ? 'reliable' : data.totalAttempts >= 5 ? 'emerging' : 'low',
  }
}

export function getRecommendedExperiment(
  topStates: { state: UserState; count: number }[],
  completedExperiments: Experiment[],
): ExperimentTemplate | null {
  // Find states that don't have completed experiments
  const testedStates = new Set(completedExperiments.map(e => e.targetState))
  const untestedStates = topStates.filter(s => !testedStates.has(s.state))

  if (untestedStates.length === 0) {
    // All states tested — recommend the one with lowest completion rate
    const worstExperiment = completedExperiments
      .filter(e => e.result)
      .sort((a, b) => (a.result?.completionRate || 0) - (b.result?.completionRate || 0))[0]

    if (worstExperiment) {
      return EXPERIMENT_TEMPLATES.find(t => t.targetStates.includes(worstExperiment.targetState)) || null
    }
    return null
  }

  // Recommend experiment for the most frequent untested state
  const targetState = untestedStates[0].state
  return EXPERIMENT_TEMPLATES.find(t => t.targetStates.includes(targetState)) || null
}
