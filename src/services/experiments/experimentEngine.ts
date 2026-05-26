// ══════════════════════════════════════════════════════════════
// INTENT — Experiment Engine
// Self-experimentation system for personal behavioral insights
// ══════════════════════════════════════════════════════════════

import type { UserState } from '../../types/moment'

// ── Types ─────────────────────────────────────────────────

export interface ExperimentTemplate {
  id: string
  title: string
  hypothesis: string
  targetStates: UserState[]
  intervention: string
  durationDays: number
  successMetric: string
}

export interface Experiment {
  id: string
  title: string
  hypothesis: string
  targetState: UserState
  intervention: string
  durationDays: number
  successMetric: string
  status: 'active' | 'completed' | 'abandoned'
  startedAt: string
  endedAt: string | null
  result: ExperimentResult | null
}

export interface ExperimentResults {
  totalAttempts: number
  completed: number
  salvaged: number
  userRating: number // 1-5
}

export interface ExperimentResult {
  completionRate: number
  salvageRate: number
  averageRating: number
  conclusion: string
  recommendation: string
}

// ── Create Experiment ─────────────────────────────────────

export function createExperiment(
  template: ExperimentTemplate,
  targetState: UserState,
): Experiment {
  return {
    id: template.id || `exp_${Date.now()}`,
    title: template.title,
    hypothesis: template.hypothesis,
    targetState,
    intervention: template.intervention,
    durationDays: template.durationDays,
    successMetric: template.successMetric,
    status: 'active',
    startedAt: new Date().toISOString(),
    endedAt: null,
    result: null,
  }
}

// ── Evaluate Experiment ───────────────────────────────────

export function evaluateExperiment(
  experiment: Experiment,
  results: ExperimentResults,
): Experiment {
  const completionRate = results.totalAttempts > 0
    ? results.completed / results.totalAttempts
    : 0

  const salvageRate = results.totalAttempts > 0
    ? results.salvaged / results.totalAttempts
    : 0

  const averageRating = results.userRating

  // Determine conclusion
  let conclusion: string
  let recommendation: string

  if (completionRate >= 0.7 && averageRating >= 3.5) {
    conclusion = `Strong results! ${(completionRate * 100).toFixed(0)}% completion rate with an average rating of ${averageRating.toFixed(1)}/5.`
    recommendation = 'This intervention works well for you. Consider making it part of your routine.'
  } else if (completionRate >= 0.5 && averageRating >= 3) {
    conclusion = `Moderate results. ${(completionRate * 100).toFixed(0)}% completion rate.`
    recommendation = 'This approach shows promise. Try it for another week to see if results improve.'
  } else if (completionRate >= 0.3) {
    conclusion = `Low impact. Only ${(completionRate * 100).toFixed(0)}% completion rate with a rating of ${averageRating.toFixed(1)}/5.`
    recommendation = 'This intervention may not be the right fit. Consider a different approach.'
  } else {
    conclusion = `Low impact. ${(completionRate * 100).toFixed(0)}% completion rate.`
    recommendation = 'This approach isn\'t working well. Try something different next week.'
  }

  return {
    ...experiment,
    status: 'completed',
    endedAt: new Date().toISOString(),
    result: {
      completionRate: Math.round(completionRate * 100) / 100,
      salvageRate: Math.round(salvageRate * 100) / 100,
      averageRating,
      conclusion,
      recommendation,
    },
  }
}

// ── Recommend Experiment ──────────────────────────────────

const DEFAULT_EXPERIMENTS: ExperimentTemplate[] = [
  {
    id: 'exp_2min_rule',
    title: '2-Minute Rule',
    hypothesis: 'If you commit to just 2 minutes, you\'ll often continue beyond that.',
    targetStates: ['avoiding'],
    intervention: 'Set a 2-minute timer. Start the task. Stop when the timer goes off if you want.',
    durationDays: 7,
    successMetric: 'completion_rate',
  },
  {
    id: 'exp_brain_dump',
    title: 'Brain Dump Ritual',
    hypothesis: 'If overwhelmed is your default state, dumping thoughts before starting will help.',
    targetStates: ['overwhelmed', 'scattered'],
    intervention: 'Before each session, spend 2 minutes writing everything on your mind. Then pick one thing.',
    durationDays: 7,
    successMetric: 'completion_rate',
  },
  {
    id: 'exp_ugly_draft',
    title: 'Ugly First Draft',
    hypothesis: 'If perfectionism blocks you, intentionally making something bad will break the spell.',
    targetStates: ['perfectionism', 'stuck'],
    intervention: 'Write/draw/create the worst version of what you need to do. Then fix one thing.',
    durationDays: 7,
    successMetric: 'completion_rate',
  },
  {
    id: 'exp_fear_naming',
    title: 'Name the Fear',
    hypothesis: 'If anxiety is your blocker, naming the specific fear reduces its power.',
    targetStates: ['anxious', 'low_confidence'],
    intervention: 'Before starting, write: "I\'m afraid that _____". Then start anyway.',
    durationDays: 7,
    successMetric: 'completion_rate',
  },
  {
    id: 'exp_energy_match',
    title: 'Energy-Matched Sessions',
    hypothesis: 'Matching session intensity to your energy level will improve completion rates.',
    targetStates: ['tired'],
    intervention: 'When tired, only do 2-5 minute sessions. Save longer sessions for high energy.',
    durationDays: 7,
    successMetric: 'completion_rate',
  },
  {
    id: 'exp_distraction_capture',
    title: 'Distraction Capture',
    hypothesis: 'Writing down distractions instead of acting on them will help you return to focus.',
    targetStates: ['distracted', 'doomscroll_risk'],
    intervention: 'When distracted, write the distraction on a note. Return to task. Review notes after.',
    durationDays: 7,
    successMetric: 'completion_rate',
  },
]

export function getRecommendedExperiment(
  topStates: { state: string; count: number }[],
  previousExperiments: Experiment[],
): ExperimentTemplate | null {
  if (topStates.length === 0) return null

  // Find states that haven't been experimented on yet
  const testedStates = new Set(previousExperiments.map(e => e.targetState))
  const untestedStates = topStates.filter(s => !testedStates.has(s.state as UserState))

  // If all top states have been tested, recommend for the most frequent one
  const targetStates = untestedStates.length > 0 ? untestedStates : topStates
  const topState = targetStates[0].state as UserState

  // Find matching experiment template
  const match = DEFAULT_EXPERIMENTS.find(exp =>
    exp.targetStates.includes(topState),
  )

  if (match) {
    return {
      ...match,
      hypothesis: match.hypothesis.replace('{state}', topState),
    }
  }

  // Generic fallback
  return {
    id: `exp_generic_${topState}`,
    title: 'Try Something Different',
    hypothesis: `If "${topState}" keeps showing up, try a different approach this week.`,
    intervention: 'Experiment with shorter sessions, different timing, or a body double.',
    targetStates: [topState],
    durationDays: 7,
    successMetric: 'completion_rate',
  }
}
