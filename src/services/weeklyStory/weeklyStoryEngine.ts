// ══════════════════════════════════════════════════════════════
// INTENT — Weekly Story Engine
// Generates narrative weekly summaries with experiment suggestions
// ══════════════════════════════════════════════════════════════

import type { UserState } from '../../types/moment'

// ── Types ─────────────────────────────────────────────────

export interface WeeklyStoryInput {
  weekStart: string
  weekEnd: string
  totalRescues: number
  totalSalvages: number
  totalAbandons: number
  totalSessions: number
  focusMinutes: number
  topStates: { state: string; count: number }[]
  topBlockers: { blocker: string; count: number }[]
  bestProtocol: string | null
  worstProtocol: string | null
  bestDuration: number | null
  strongestSignal: string | null
  comebackCount: number
  insights: string[]
  previousWeekRescues: number
}

export interface StorySection {
  type: 'motion' | 'pattern' | 'signal' | 'experiment' | 'insight'
  title: string
  body: string
}

export interface ExperimentSuggestion {
  hypothesis: string
  intervention: string
  durationDays: number
  targetStates: UserState[]
}

export interface WeeklyStory {
  title: string
  subtitle: string
  sections: StorySection[]
  experiment: ExperimentSuggestion | null
}

// ── Story Generation ──────────────────────────────────────

export function generateWeeklyStory(input: WeeklyStoryInput): WeeklyStory {
  const sections: StorySection[] = []

  // Section 1: Motion (always first)
  const motionDelta = input.totalRescues - input.previousWeekRescues
  const motionWord = motionDelta > 0 ? 'up' : motionDelta < 0 ? 'down' : 'same'
  sections.push({
    type: 'motion',
    title: 'Your Week in Motion',
    body: input.totalRescues === 0
      ? 'No rescues this week. That\'s okay — we\'re here when you\'re ready.'
      : `You rescued ${input.totalRescues} time${input.totalRescues !== 1 ? 's' : ''} this week${motionDelta !== 0 ? `, ${motionWord} from last week` : ''}. ${input.totalSalvages > 0 ? `${input.totalSalvages} salvaged.` : ''} ${input.focusMinutes > 0 ? `${input.focusMinutes} focus minutes total.` : ''}`,
  })

  // Section 2: Pattern (if top states exist)
  if (input.topStates.length > 0) {
    const top = input.topStates[0]
    sections.push({
      type: 'pattern',
      title: 'What\'s Showing Up',
      body: `Your most frequent state was "${top.state}" (${top.count} time${top.count !== 1 ? 's' : ''}). ${input.topBlockers.length > 0 ? `The biggest blocker was "${input.topBlockers[0].blocker}".` : ''}`,
    })
  }

  // Section 3: Signal (strongest signal)
  if (input.strongestSignal) {
    sections.push({
      type: 'signal',
      title: 'The Signal',
      body: `The strongest signal this week was "${input.strongestSignal}". This shows up a lot in your pattern.`,
    })
  }

  // Section 4: Experiment suggestion
  const experiment = generateExperimentSuggestion(input)

  if (experiment) {
    sections.push({
      type: 'experiment',
      title: 'Try This Experiment',
      body: experiment.hypothesis,
    })
  }

  // Section 5: Insight
  if (input.totalSessions > 0) {
    const completionRate = input.totalRescues > 0
      ? Math.round(((input.totalRescues - input.totalAbandons) / input.totalRescues) * 100)
      : 0
    sections.push({
      type: 'insight',
      title: 'One Insight',
      body: input.bestProtocol
        ? `Your best protocol was "${input.bestProtocol}". It seems to work well for you.`
        : `Your completion rate was ${completionRate}%. Every rescue counts.`,
    })
  }

  return {
    title: `Week of ${input.weekStart}`,
    subtitle: `${input.totalRescues} rescue${input.totalRescues !== 1 ? 's' : ''}, ${input.focusMinutes} focus minutes`,
    sections,
    experiment,
  }
}

// ── Experiment Suggestion ─────────────────────────────────

function generateExperimentSuggestion(input: WeeklyStoryInput): ExperimentSuggestion | null {
  if (input.topStates.length === 0) return null

  const topState = input.topStates[0].state as UserState

  const experimentMap: Record<string, ExperimentSuggestion> = {
    avoiding: {
      hypothesis: 'If "avoiding" is your biggest challenge, try the 2-minute rule: commit to just 2 minutes of starting. Track whether that helps you break through avoidance.',
      intervention: '2-minute rule',
      durationDays: 7,
      targetStates: ['avoiding' as UserState],
    },
    overwhelmed: {
      hypothesis: 'If "overwhelmed" keeps showing up, try a brain dump at the start of each session. Getting everything out of your head might reduce the feeling of overwhelm.',
      intervention: 'Brain dump ritual',
      durationDays: 7,
      targetStates: ['overwhelmed' as UserState],
    },
    stuck: {
      hypothesis: 'If "stuck" is your pattern, try asking "what\'s the next physical action?" before each session. Naming the concrete action might help you move forward.',
      intervention: 'Next physical action prompt',
      durationDays: 7,
      targetStates: ['stuck' as UserState],
    },
    tired: {
      hypothesis: 'If tiredness keeps blocking you, try shorter sessions (2-5 min) when energy is low. Track whether tiny sessions feel more doable.',
      intervention: 'Micro sessions for low energy',
      durationDays: 7,
      targetStates: ['tired' as UserState],
    },
    anxious: {
      hypothesis: 'If anxiety is the pattern, try naming the specific fear before starting. Research shows naming emotions reduces their intensity. Test it this week.',
      intervention: 'Fear naming ritual',
      durationDays: 7,
      targetStates: ['anxious' as UserState],
    },
  }

  const experiment = experimentMap[topState] ?? {
    hypothesis: `If "${topState}" keeps showing up, try a different approach this week — shorter sessions, different timing, or a body double.`,
    intervention: 'Varied approach',
    durationDays: 7,
    targetStates: [topState],
  }

  return experiment
}
