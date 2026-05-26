// INTENT — State & Behavior Engines
// Small state-management utilities:
//   - Intent Lock (reduce exit paths during sessions)
//   - Open Loops (track attention hooks)
//   - Intent Score (convert intention → action metric)
//   - Emergency Start (one-tap rescue)
//   - New User Magic (day-0 experience)

import type { UserState } from '../types/moment'
import type { MicroMission } from '../types/mission'
import type { OpenLoop, OpenLoopSource, OpenLoopStatus } from '../types/openLoop'
import type { ContextCapsule } from '../types/contextCapsule'

// ══════════════════════════════════════════════════════════════
// SECTION 1: Intent Lock
// Psychological lock during missions — reduce escape paths
// ══════════════════════════════════════════════════════════════

export type ExitFrictionOption = 'make_smaller' | 'capture_distraction' | 'salvage' | 'end_session'

export interface IntentLockState {
  active: boolean
  missionId: string | null
  exitAttempts: number
  exitFrictionShown: boolean
  reducedUI: boolean
  startedAt: number
}

export function createIntentLockState(missionId: string): IntentLockState {
  return { active: true, missionId, exitAttempts: 0, exitFrictionShown: false, reducedUI: true, startedAt: Date.now() }
}

export function recordExitAttempt(state: IntentLockState): IntentLockState {
  return { ...state, exitAttempts: state.exitAttempts + 1, exitFrictionShown: true }
}

export function shouldShowExitFriction(state: IntentLockState): boolean {
  return state.active && state.exitAttempts === 0
}

export function getExitFrictionCopy(): string {
  return 'Want the smaller version before you leave?'
}

export function getExitFrictionOptions(): ExitFrictionOption[] {
  return ['make_smaller', 'capture_distraction', 'salvage', 'end_session']
}

export function getExitOptionLabel(option: ExitFrictionOption): string {
  const labels: Record<ExitFrictionOption, string> = {
    make_smaller: 'Make it smaller',
    capture_distraction: 'Capture distraction',
    salvage: 'Salvage what I did',
    end_session: 'End session',
  }
  return labels[option]
}

export function deactivateIntentLock(state: IntentLockState): IntentLockState {
  return { ...state, active: false, reducedUI: false }
}

// ══════════════════════════════════════════════════════════════
// SECTION 2: Open Loops
// Attention hooks — close with tiny actions, not guilt
// ══════════════════════════════════════════════════════════════

function generateLoopId(): string {
  return `loop_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function createOpenLoop(
  title: string, source: OpenLoopSource, nextTinyAction: string, emotionalWeight: number = 3,
): OpenLoop {
  return {
    id: generateLoopId(), title, source,
    emotionalWeight: Math.max(1, Math.min(5, emotionalWeight)),
    nextTinyAction, status: 'open',
    relatedContextId: null, relatedMissionThreadId: null,
    createdAt: Date.now(), lastTouchedAt: Date.now(),
  }
}

export function createLoopFromCapsule(capsule: ContextCapsule): OpenLoop | null {
  const obligations = capsule.extractedObligations.map(o => o.text) ?? []
  if (obligations.length === 0) return null
  const first = obligations[0]
  return {
    id: generateLoopId(), title: first, source: 'context_capsule',
    emotionalWeight: capsule.sensitivity === 'sensitive' ? 4 : 3,
    nextTinyAction: generateTinyAction(first), status: 'open',
    relatedContextId: capsule.id, relatedMissionThreadId: null,
    createdAt: Date.now(), lastTouchedAt: Date.now(),
  }
}

export function createLoopFromFailure(missionTitle: string, failureReason: string): OpenLoop {
  return {
    id: generateLoopId(), title: missionTitle, source: 'failed_mission',
    emotionalWeight: 4, nextTinyAction: generateSmallerAction(missionTitle),
    status: 'open', relatedContextId: null, relatedMissionThreadId: null,
    createdAt: Date.now(), lastTouchedAt: Date.now(),
  }
}

export function createLoopFromDistraction(distractionText: string): OpenLoop {
  return {
    id: generateLoopId(), title: distractionText.slice(0, 100), source: 'repeated_distraction',
    emotionalWeight: 2, nextTinyAction: `Address "${distractionText.slice(0, 30)}..." later`,
    status: 'open', relatedContextId: null, relatedMissionThreadId: null,
    createdAt: Date.now(), lastTouchedAt: Date.now(),
  }
}

export function updateLoopStatus(loop: OpenLoop, status: OpenLoopStatus): OpenLoop {
  return { ...loop, status, lastTouchedAt: Date.now() }
}

export function touchLoop(loop: OpenLoop): OpenLoop {
  return { ...loop, lastTouchedAt: Date.now() }
}

function generateTinyAction(title: string): string {
  const lower = title.toLowerCase()
  if (lower.includes('email') || lower.includes('mail')) return 'Write the subject line'
  if (lower.includes('essay') || lower.includes('paper') || lower.includes('write')) return 'Write one ugly sentence'
  if (lower.includes('clean') || lower.includes('room') || lower.includes('tidy')) return 'Put 10 items in a basket'
  if (lower.includes('study') || lower.includes('exam') || lower.includes('test')) return 'Make 3 flashcards'
  if (lower.includes('call') || lower.includes('phone')) return 'Write the phone number'
  if (lower.includes('pay') || lower.includes('bill')) return 'Open the bill and read the amount'
  if (lower.includes('shop') || lower.includes('buy')) return 'Write 3 items on a list'
  if (lower.includes('fix') || lower.includes('repair')) return 'Name what is broken'
  if (lower.includes('plan') || lower.includes('schedule')) return 'Write 3 time blocks'
  if (lower.includes('read')) return 'Read one paragraph'
  if (lower.includes('cook') || lower.includes('meal')) return 'Open the recipe'
  if (lower.includes('exercise') || lower.includes('workout')) return 'Put shoes on'
  if (lower.includes('submit') || lower.includes('turn in')) return 'Open the submission page'
  return 'Open it and read for 2 minutes'
}

function generateSmallerAction(title: string): string {
  return `Do the absolute smallest version of: ${title.slice(0, 40)}`
}

export function detectRepeatedDistractions(distractions: Array<{ text: string; count: number; lastAt: number }>): string[] {
  return distractions.filter((d) => d.count >= 3).map((d) => d.text)
}

export function getOpenLoopCopy(loop: OpenLoop): string {
  if (loop.emotionalWeight >= 4) return `${loop.title} — this keeps pulling at you. Close it with: ${loop.nextTinyAction}`
  return `${loop.title} — ${loop.nextTinyAction}`
}

export function getOpenLoopsHeader(count: number): string {
  if (count === 0) return 'No open loops. You are clear.'
  if (count === 1) return '1 thing pulling your attention'
  return `${count} things pulling your attention`
}

export function getOpenLoopReliefCopy(loop: OpenLoop): string {
  return `You closed "${loop.title}". That attention is free now.`
}

// ══════════════════════════════════════════════════════════════
// SECTION 3: Intent Score
// "How often did you convert intention into action?"
// ══════════════════════════════════════════════════════════════

export interface IntentScoreComponents {
  startRate: number
  rescueCompletion: number
  salvageRate: number
  comebackRate: number
  reducedDrift: number
  planningLoopAvoidance: number
  beforeScrollWins: number
  missionFit: number
  consistency: number
}

export interface IntentScore {
  total: number
  components: IntentScoreComponents
  label: string
  description: string
  confidence: 'low' | 'medium' | 'high'
}

export function calculateIntentScore(components: IntentScoreComponents): IntentScore {
  const weights = { startRate: 0.20, rescueCompletion: 0.15, salvageRate: 0.10, comebackRate: 0.15, reducedDrift: 0.10, planningLoopAvoidance: 0.05, beforeScrollWins: 0.10, missionFit: 0.10, consistency: 0.05 }
  const total = Math.round(
    (components.startRate * weights.startRate +
    components.rescueCompletion * weights.rescueCompletion +
    components.salvageRate * weights.salvageRate +
    components.comebackRate * weights.comebackRate +
    components.reducedDrift * weights.reducedDrift +
    components.planningLoopAvoidance * weights.planningLoopAvoidance +
    components.beforeScrollWins * weights.beforeScrollWins +
    components.missionFit * weights.missionFit +
    components.consistency * weights.consistency) * 100
  )
  return { total, components, label: getScoreLabel(total), description: getScoreDescription(total), confidence: getConfidence(components) }
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Strong converter'
  if (score >= 60) return 'Building momentum'
  if (score >= 40) return 'Finding rhythm'
  if (score >= 20) return 'Starting to move'
  return 'Early days'
}

function getScoreDescription(score: number): string {
  if (score >= 80) return 'You turn stuck moments into action most of the time.'
  if (score >= 60) return 'You are building a pattern of converting intention into movement.'
  if (score >= 40) return 'Some moments are turning into action. That matters.'
  if (score >= 20) return 'Every rescue teaches the app what works for you.'
  return 'This score learns from your first rescues. It gets more useful over time.'
}

function getConfidence(components: IntentScoreComponents): 'low' | 'medium' | 'high' {
  const avg = Object.values(components).reduce((a, b) => a + b, 0) / Object.values(components).length
  if (avg > 0.7) return 'high'
  if (avg > 0.3) return 'medium'
  return 'low'
}

export function getScoreDisclaimer(): string {
  return 'Intent Score is not your worth. It measures how often the app helped you turn stuck moments into action.'
}

export function getScoreTrend(current: number, previous: number): string {
  const diff = current - previous
  if (diff > 5) return 'Improving'
  if (diff < -5) return 'Shifting'
  return 'Stable'
}

// ══════════════════════════════════════════════════════════════
// SECTION 4: Emergency Start
// One giant button: "Start me." Under 3 seconds to action.
// ══════════════════════════════════════════════════════════════

interface EmergencyStartResult {
  mission: MicroMission
  source: 'last_successful' | 'default_safe' | 'universal_fallback'
  reasoning: string
}

interface ProtocolSuccess { state: UserState; action: string; duration: number; successCount: number }

let lastSuccessfulProtocol: ProtocolSuccess | null = null

export function recordProtocolSuccess(state: UserState, action: string, duration: number): void {
  if (lastSuccessfulProtocol?.state === state && lastSuccessfulProtocol?.action === action) {
    lastSuccessfulProtocol.successCount++
  } else {
    lastSuccessfulProtocol = { state, action, duration, successCount: 1 }
  }
}

export function getLastSuccessful(): ProtocolSuccess | null { return lastSuccessfulProtocol }

export function getEmergencyStartMission(): EmergencyStartResult {
  if (lastSuccessfulProtocol && lastSuccessfulProtocol.successCount >= 1) {
    return { mission: buildMission(lastSuccessfulProtocol.action, lastSuccessfulProtocol.duration), source: 'last_successful', reasoning: `This worked for you before (${lastSuccessfulProtocol.successCount}x)` }
  }
  return { mission: buildMission('Open the thing you are avoiding. Name it.', 2), source: 'universal_fallback', reasoning: 'The simplest possible start' }
}

const SAFE_DEFAULTS: Record<string, { action: string; duration: number }> = {
  overwhelmed: { action: 'Do the smallest version of what scares you', duration: 2 },
  stuck: { action: 'Open the thing and read for 2 minutes', duration: 2 },
  avoiding: { action: 'Open it. Read one line.', duration: 2 },
  tired: { action: 'Do one tiny thing, then rest', duration: 2 },
  anxious: { action: 'Take 3 breaths, then one small step', duration: 2 },
  doomscroll_risk: { action: 'One 2-minute action before you scroll', duration: 2 },
  perfectionism: { action: 'Write the worst version on purpose', duration: 2 },
  scattered: { action: 'Close everything except one thing', duration: 2 },
  shame_spiral: { action: 'Name one tiny thing you can do', duration: 2 },
  ready: { action: 'Start the first thing on your mind', duration: 5 },
}

export function getEmergencyStartForState(state: UserState): EmergencyStartResult {
  const safe = SAFE_DEFAULTS[state] ?? SAFE_DEFAULTS.overwhelmed
  return { mission: buildMission(safe.action, safe.duration), source: 'default_safe', reasoning: `Safe start for ${state}` }
}

function buildMission(action: string, duration: number): MicroMission {
  return {
    id: `emergency_${Date.now()}`, threadId: null, title: action, exactAction: action,
    status: 'pending', estimatedMinutes: duration, actualMinutes: null,
    resistanceBefore: null, resistanceAfter: null, distractionCaptured: null,
    completionCriteria: `Do the action for ${duration} minutes`,
    fallbackMission: 'Just open it', salvageMission: 'You showed up. That counts.',
    protocolId: 'emergency_start', state: 'overwhelmed', energy: 'medium',
    blocker: null, sortOrder: 0, createdAt: new Date().toISOString(), completedAt: null,
    privacyClassification: 'local_only',
  }
}

export function getEmergencyStartCopy(): string { return 'Start me' }
export function getEmergencyStartSubcopy(): string { return 'No choices. No typing. Just start.' }
export function getEmergencyStartSuccessCopy(duration: number): string {
  return `You started. ${duration} minutes of action you would have lost.`
}

// ══════════════════════════════════════════════════════════════
// SECTION 5: New User Magic
// App feels smart on day 0 without pretending it has data
// ══════════════════════════════════════════════════════════════

export interface StarterDefault {
  state: UserState; protocol: string; duration: number; copy: string
}

export const STARTER_DEFAULTS: StarterDefault[] = [
  { state: 'overwhelmed', protocol: 'shrink_the_beast', duration: 2, copy: 'Start with the smallest version' },
  { state: 'stuck', protocol: 'body_double', duration: 2, copy: 'Open it and read for 2 minutes' },
  { state: 'avoiding', protocol: 'ugly_first_move', duration: 2, copy: 'Open it. One line.' },
  { state: 'tired', protocol: 'maintenance_spark', duration: 2, copy: 'One tiny thing, then rest' },
  { state: 'anxious', protocol: 'pressure_valve', duration: 2, copy: 'Breathe. Then one small step.' },
  { state: 'doomscroll_risk', protocol: 'before_scroll', duration: 2, copy: 'One 2-minute win before you scroll' },
  { state: 'perfectionism', protocol: 'ugly_first_move', duration: 2, copy: 'Write the worst version on purpose' },
  { state: 'scattered', protocol: 'focus_one', duration: 2, copy: 'Close everything. Pick one thing.' },
  { state: 'shame_spiral', protocol: 'tiny_reset', duration: 2, copy: 'Just one tiny thing. No judgment.' },
  { state: 'ready', protocol: 'deep_work_sprint', duration: 15, copy: 'Start the thing on your mind' },
]

export function getStarterDefault(state: UserState): StarterDefault {
  return STARTER_DEFAULTS.find((d) => d.state === state) ?? STARTER_DEFAULTS[0]
}

export type MissionFeedback = 'too_easy' | 'just_right' | 'too_hard' | 'wrong_task' | 'helped_start' | 'did_not_help'

export interface FeedbackEvent {
  feedback: MissionFeedback; state: UserState; duration: number; protocolId: string; timestamp: number
}

export function processFeedback(event: FeedbackEvent): { adjustment: string; newDuration: number; confidence: number } {
  switch (event.feedback) {
    case 'too_easy': return { adjustment: 'increase_duration', newDuration: Math.min(event.duration + 5, 30), confidence: 0.6 }
    case 'too_hard': return { adjustment: 'decrease_duration', newDuration: Math.max(event.duration - 2, 1), confidence: 0.7 }
    case 'wrong_task': return { adjustment: 'switch_protocol', newDuration: event.duration, confidence: 0.3 }
    case 'just_right': return { adjustment: 'keep', newDuration: event.duration, confidence: 0.8 }
    case 'helped_start': return { adjustment: 'keep', newDuration: event.duration, confidence: 0.9 }
    case 'did_not_help': return { adjustment: 'try_different', newDuration: event.duration, confidence: 0.2 }
    default: return { adjustment: 'keep', newDuration: event.duration, confidence: 0.5 }
  }
}

export function isNewUser(totalMissions: number, totalDays: number): boolean {
  return totalMissions < 5 || totalDays < 3
}

export function getNewUserCopy(): string {
  return 'INTENT is learning what works for you. Each rescue teaches it something.'
}

export function getDay0Copy(): string {
  return 'Start with one 2-minute action. That is all.'
}
