// ══════════════════════════════════════════════════════════════
// INTENT — Weekly Story Engine
// Generates personal momentum stories, not generic stats
// ══════════════════════════════════════════════════════════════

import type { DriftGraphInsight, UserState } from '../../types'

export interface WeeklyStory {
  weekStart: string
  weekEnd: string
  sections: StorySection[]
  experiment: WeeklyExperiment | null
  keepOrChange: KeepOrChangeOption[]
}

export interface StorySection {
  type: 'motion' | 'pattern' | 'trap' | 'comeback' | 'identity'
  title: string
  text: string
  confidence: 'low' | 'emerging' | 'reliable' | 'strong'
  eventCount: number
}

export interface WeeklyExperiment {
  hypothesis: string
  intervention: string
  durationDays: number
  successMetric: string
}

export interface KeepOrChangeOption {
  id: string
  label: string
  description: string
  action: 'keep' | 'change' | 'hide' | 'delete'
}

// ── Story Generation ────────────────────────────────────────

export function generateWeeklyStory(context: {
  weekStart: string
  weekEnd: string
  totalRescues: number
  totalSalvages: number
  totalAbandons: number
  totalSessions: number
  focusMinutes: number
  topStates: { state: UserState; count: number }[]
  topBlockers: { blocker: string; count: number }[]
  bestProtocol: string | null
  worstProtocol: string | null
  bestDuration: number | null
  strongestSignal: string | null
  comebackCount: number
  insights: DriftGraphInsight[]
  previousWeekRescues: number
}): WeeklyStory {
  const sections: StorySection[] = []

  // Section 1: "Your week in motion"
  sections.push(generateMotionSection(context))

  // Section 2: "Your strongest pattern"
  if (context.bestProtocol) {
    sections.push(generatePatternSection(context))
  }

  // Section 3: "Your biggest drift trap"
  if (context.strongestSignal || context.topBlockers.length > 0) {
    sections.push(generateTrapSection(context))
  }

  // Section 4: "Your best comeback"
  if (context.comebackCount > 0) {
    sections.push(generateComebackSection(context))
  }

  // Section 5: Identity reinforcement
  sections.push(generateIdentitySection(context))

  // Experiment
  const experiment = generateExperiment(context)

  // Keep/Change options
  const keepOrChange = generateKeepOrChange(context)

  return {
    weekStart: context.weekStart,
    weekEnd: context.weekEnd,
    sections,
    experiment,
    keepOrChange,
  }
}

function generateMotionSection(context: any): StorySection {
  const { totalRescues, totalSalvages, totalAbandons, focusMinutes } = context
  const hours = Math.round(focusMinutes / 60 * 10) / 10

  let text = `You rescued ${totalRescues} moment${totalRescues !== 1 ? 's' : ''} this week.`
  if (totalSalvages > 0) {
    text += ` ${totalSalvages} ${totalSalvages === 1 ? 'was' : 'were'} salvaged — that's resilience.`
  }
  if (totalAbandons > 0 && totalAbandons > totalRescues * 0.5) {
    text += ` You also abandoned ${totalAbandons} sessions. That's useful data — we'll learn from it.`
  }
  if (hours > 0) {
    text += ` Total focus time: ${hours} hours.`
  }

  return {
    type: 'motion',
    title: 'Your week in motion',
    text,
    confidence: context.totalRescues >= 3 ? 'reliable' : 'low',
    eventCount: context.totalRescues,
  }
}

function generatePatternSection(context: any): StorySection {
  const { bestProtocol, bestDuration, topStates } = context
  const topState = topStates[0]?.state || 'avoiding'

  let text = ''
  if (bestProtocol && bestDuration) {
    text = `When ${topState}, ${bestProtocol} for ${bestDuration} minutes worked best.`
  } else if (bestProtocol) {
    text = `${bestProtocol} was your most effective rescue protocol.`
  } else {
    text = `You're still learning your patterns. Keep going.`
  }

  return {
    type: 'pattern',
    title: 'Your strongest pattern',
    text,
    confidence: context.totalRescues >= 8 ? 'reliable' : context.totalRescues >= 3 ? 'emerging' : 'low',
    eventCount: context.totalRescues,
  }
}

function generateTrapSection(context: any): StorySection {
  const { strongestSignal, topBlockers } = context

  let text = ''
  if (strongestSignal) {
    text = `Your biggest drift trigger: "${strongestSignal}". This is where you lose momentum most often.`
  } else if (topBlockers.length > 0) {
    text = `Your most common blocker: "${topBlockers[0].blocker}". Knowing this helps us work around it.`
  }

  return {
    type: 'trap',
    title: 'Your biggest drift trap',
    text,
    confidence: 'emerging',
    eventCount: context.totalAbandons,
  }
}

function generateComebackSection(context: any): StorySection {
  return {
    type: 'comeback',
    title: 'Your best comeback',
    text: `You came back ${context.comebackCount} time${context.comebackCount !== 1 ? 's' : ''} after abandoning a session. That's the most important skill — not avoiding failure, but returning after it.`,
    confidence: context.comebackCount >= 3 ? 'reliable' : 'emerging',
    eventCount: context.comebackCount,
  }
}

function generateIdentitySection(context: any): StorySection {
  const { totalRescues, previousWeekRescues } = context

  let text = ''
  if (totalRescues > previousWeekRescues) {
    text = `You rescued more moments this week than last. You're building momentum.`
  } else if (totalRescues === previousWeekRescues && totalRescues > 0) {
    text = `Consistent. You showed up the same amount as last week. That's discipline.`
  } else if (totalRescues > 0) {
    text = `Fewer rescues than last week. That's okay. Some weeks are harder. What matters is you're still here.`
  } else {
    text = `No rescues this week. That's data, not judgment. What got in the way?`
  }

  return {
    type: 'identity',
    title: 'Who you are',
    text,
    confidence: 'low',
    eventCount: totalRescues,
  }
}

function generateExperiment(context: any): WeeklyExperiment | null {
  const { topStates, bestProtocol, bestDuration } = context
  const topState = topStates[0]?.state

  if (!topState) return null

  // Suggest an experiment based on the user's patterns
  if (topState === 'overwhelmed' || topState === 'scattered') {
    return {
      hypothesis: `When ${topState}, 2-minute missions work better than longer ones.`,
      intervention: `For the next 7 days, INTENT will suggest 2-minute missions when you select ${topState}.`,
      durationDays: 7,
      successMetric: 'Start rate and completion rate',
    }
  }

  if (topState === 'perfectionism') {
    return {
      hypothesis: `Ugly First Move bypasses perfectionism better than other protocols.`,
      intervention: `For the next 7 days, INTENT will default to Ugly First Move for writing/creative tasks.`,
      durationDays: 7,
      successMetric: 'Start rate for writing tasks',
    }
  }

  if (topState === 'avoiding') {
    return {
      hypothesis: `Two-Minute Ignition works best when avoiding.`,
      intervention: `For the next 7 days, INTENT will always suggest 2-minute starts when avoiding.`,
      durationDays: 7,
      successMetric: 'Completion rate for avoiding state',
    }
  }

  // Default experiment
  return {
    hypothesis: `${bestProtocol || 'Two-Minute Ignition'} is your best protocol.`,
    intervention: `For the next 7 days, INTENT will default to ${bestProtocol || 'Two-Minute Ignition'}.`,
    durationDays: 7,
    successMetric: 'Overall completion rate',
  }
}

function generateKeepOrChange(context: any): KeepOrChangeOption[] {
  const options: KeepOrChangeOption[] = []

  if (context.bestProtocol) {
    options.push({
      id: 'keep_protocol',
      label: `Keep using ${context.bestProtocol}`,
      description: 'This protocol works well for you.',
      action: 'keep',
    })
  }

  options.push({
    id: 'try_different',
    label: 'Try a different approach',
    description: 'Experiment with a new protocol next week.',
    action: 'change',
  })

  options.push({
    id: 'hide_insight',
    label: 'Hide this insight',
    description: 'I don\'t want to see this pattern.',
    action: 'hide',
  })

  return options
}

// ── Story Copy ──────────────────────────────────────────────

export const WEEKLY_STORY_COPY = {
  title: 'Your week in motion',
  subtitle: 'Not stats. Your story.',
  noData: 'Complete a few missions this week to see your personal story.',
  experimentPrompt: 'Want to try an experiment next week?',
  keepButton: 'Keep this',
  changeButton: 'Try something different',
  hideButton: 'Hide this',
  deleteButton: 'Delete this data',
}
