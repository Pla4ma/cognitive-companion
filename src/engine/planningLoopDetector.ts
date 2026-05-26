// ══════════════════════════════════════════════════════════════
// INTENT — Planning Loop Detector
// Detects when planning replaces execution
// ══════════════════════════════════════════════════════════════

export interface PlanningLoopSignal {
  detected: boolean
  severity: 'low' | 'medium' | 'high'
  indicators: string[]
  timeInAppWithoutAction: number // minutes
  suggestedIntervention: string
}

interface AppActivity {
  type: 'mission_edit' | 'goal_create' | 'coach_chat' | 'momentum_view' | 'mission_start' | 'mission_complete' | 'app_open'
  timestamp: number
}

const LOOP_INDICATORS = {
  missionEditsWithoutStart: 3,
  goalCreatesWithoutAction: 2,
  coachMessagesWithoutStart: 4,
  momentumViews: 3,
  minutesWithoutAction: 5,
}

export function detectPlanningLoop(activities: AppActivity[]): PlanningLoopSignal {
  const now = Date.now()
  const recentWindow = 10 * 60 * 1000 // 10 minutes
  const recent = activities.filter((a) => now - a.timestamp < recentWindow)

  const indicators: string[] = []
  let severity: 'low' | 'medium' | 'high' = 'low'

  // Count activity types
  const missionEdits = recent.filter((a) => a.type === 'mission_edit').length
  const goalCreates = recent.filter((a) => a.type === 'goal_create').length
  const coachChats = recent.filter((a) => a.type === 'coach_chat').length
  const momentumViews = recent.filter((a) => a.type === 'momentum_view').length
  const missionStarts = recent.filter((a) => a.type === 'mission_start').length
  const missionCompletes = recent.filter((a) => a.type === 'mission_complete').length

  // Time since last action
  const lastAction = recent.find((a) => a.type === 'mission_start' || a.type === 'mission_complete')
  const timeSinceAction = lastAction ? (now - lastAction.timestamp) / 60000 : 999

  // Detect patterns
  if (missionEdits >= LOOP_INDICATORS.missionEditsWithoutStart && missionStarts === 0) {
    indicators.push(`${missionEdits} mission edits without starting`)
    severity = 'medium'
  }

  if (goalCreates >= LOOP_INDICATORS.goalCreatesWithoutAction && missionStarts === 0) {
    indicators.push(`${goalCreates} goals created without action`)
    severity = 'medium'
  }

  if (coachChats >= LOOP_INDICATORS.coachMessagesWithoutStart && missionStarts === 0) {
    indicators.push(`${coachChats} coach messages without starting`)
    severity = 'high'
  }

  if (momentumViews >= LOOP_INDICATORS.momentumViews) {
    indicators.push(`${momentumViews} momentum checks without action`)
  }

  if (timeSinceAction >= LOOP_INDICATORS.minutesWithoutAction) {
    indicators.push(`${Math.round(timeSinceAction)} minutes without starting`)
    if (timeSinceAction > 10) severity = 'high'
  }

  const detected = indicators.length >= 2

  return {
    detected,
    severity,
    indicators,
    timeInAppWithoutAction: Math.round(timeSinceAction),
    suggestedIntervention: getIntervention(detected, severity),
  }
}

function getIntervention(detected: boolean, severity: string): string {
  if (!detected) return ''
  if (severity === 'high') return 'Pick for me'
  if (severity === 'medium') return 'Start 2-minute mission'
  return 'Want a tiny action?'
}

export function generatePlanningLoopCopy(signal: PlanningLoopSignal): string {
  if (!signal.detected) return ''

  const copies = [
    'Planning might be replacing starting. Want a 2-minute action?',
    'You have been organizing for a while. Ready for one tiny step?',
    'The best plan is one tiny action. Start now?',
    'Enough planning. One small move?',
  ]

  return copies[Math.floor(Math.random() * copies.length)]
}
