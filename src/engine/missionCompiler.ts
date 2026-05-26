// ══════════════════════════════════════════════════════════════
// INTENT — Mission Compiler 2.0
// Converts moments + context + protocol into executable micro-missions
// ══════════════════════════════════════════════════════════════

import type {
  MissionCompilationInput,
  MissionQualityScore,
  CompiledMission,
  MicroMission,
  UserState,
  BlockerType,
  EnergyLevel,
  RescueProtocolId,
} from '../types'
import type { RescueProtocol } from '../types'
import { RESCUE_PROTOCOLS, getFallbackProtocol } from '../types/rescue'
import { MISSION_QUALITY_THRESHOLDS, VAGUE_MISSION_PATTERNS, SHAME_LANGUAGE_PATTERNS } from '../types/mission'

// ── Main Entry Point ────────────────────────────────────────

export function compileMission(input: MissionCompilationInput): CompiledMission {
  const protocol = RESCUE_PROTOCOLS[input.protocolId]
  const now = new Date().toISOString()

  // Generate primary mission
  const primaryText = generatePrimaryMission(input, protocol)
  const primary: MicroMission = {
    id: `mission_${Date.now()}`,
    threadId: input.threadId,
    title: primaryText.slice(0, 60),
    exactAction: primaryText,
    status: 'pending',
    estimatedMinutes: input.availableMinutes,
    actualMinutes: null,
    resistanceBefore: null,
    resistanceAfter: null,
    distractionCaptured: null,
    completionCriteria: generateCompletionCriteria(primaryText, input.availableMinutes),
    fallbackMission: null,
    salvageMission: null,
    protocolId: input.protocolId,
    state: input.state,
    energy: input.energy,
    blocker: input.blocker,
    sortOrder: 0,
    createdAt: now,
    completedAt: null,
    privacyClassification: input.privacyPolicy,
  }

  // Generate fallback
  const fallbackText = generateFallback(primaryText, protocol, input.energy)
  const fallback: MicroMission = {
    ...primary,
    id: `mission_fallback_${Date.now()}`,
    title: fallbackText.slice(0, 60),
    exactAction: fallbackText,
    estimatedMinutes: Math.max(1, Math.min(2, input.availableMinutes)),
    sortOrder: 1,
  }
  primary.fallbackMission = fallbackText

  // Generate salvage
  const salvageText = generateSalvage(primaryText, protocol)
  const salvage: MicroMission = {
    ...primary,
    id: `mission_salvage_${Date.now()}`,
    title: salvageText.slice(0, 60),
    exactAction: salvageText,
    estimatedMinutes: 1,
    sortOrder: 2,
  }
  primary.salvageMission = salvageText

  // Score the mission
  const quality = scoreMission(primaryText, input)

  return {
    primaryMission: primary,
    tinyFallbackMission: fallback,
    salvageMission: salvage,
    bodyDoubleScript: generateBodyDoubleScript(protocol, input.availableMinutes),
    antiDriftPlan: generateAntiDriftPlan(input.state, input.blocker),
    completionCriteria: primary.completionCriteria,
    successProbability: estimateSuccessProbability(input),
    missionQualityScore: quality,
    reason: `Protocol: ${protocol.name}. State: ${input.state}. Energy: ${input.energy}.`,
    trackingTags: [input.state, input.protocolId, input.energy, input.blocker || 'unknown'],
  }
}

// ── Mission Generation ──────────────────────────────────────

export function generatePrimaryMission(input: MissionCompilationInput, protocol: RescueProtocol): string {
  const { state, blocker, energy, availableMinutes, contextText } = input

  // If we have context, use it
  if (contextText) {
    return generateContextualMission(contextText, state, availableMinutes, protocol)
  }

  // Check blocker-specific missions (more precise than state alone)
  if (blocker) {
    const blockerMission = generateBlockerAwareMission(state, blocker, availableMinutes, energy)
    if (blockerMission) return blockerMission
  }

  // State-based missions (no context)
  const missions: Record<UserState, () => string> = {
    avoiding: () => `Open the thing you're avoiding and write its name. That's it.`,
    overwhelmed: () => `Write down the three things pulling your attention. Pick the smallest. Do only that.`,
    stuck: () => `Set a ${availableMinutes}-minute timer and name the first step out loud.`,
    tired: () => `Do one low-energy reset: clear one surface or open one file.`,
    distracted: () => `Write down every distraction. Phone in another room. ${availableMinutes}-minute sprint.`,
    anxious: () => `Write the bad version of the first sentence. It doesn't have to be good.`,
    scattered: () => `Write down the three things pulling your attention. Pick one. Close everything else.`,
    ready: () => `Open the thing you need to work on and do one small action in ${availableMinutes} minutes.`,
    bored: () => `Add a constraint: do it in 10 minutes, or do it standing up.`,
    perfectionism: () => `Open the document and write the worst possible first sentence. You can fix it later.`,
    unclear: () => `Write one sentence: "I don't know how to start because _______."`,
    time_pressure: () => `Write: "Done means _______." Not perfect. Done.`,
    low_confidence: () => `Do the smallest possible version. ${availableMinutes} minutes. Proof before perfection.`,
    shame_spiral: () => `Open the thing you've been avoiding. Write one sentence. No guilt.`,
    fake_productivity: () => `Close the planning app. Open the real work. Do one physical action.`,
    planning_loop: () => `Close the planning app. Set a ${availableMinutes}-minute timer. Do the first physical action.`,
    doomscroll_risk: () => `Do one tiny action first. Then choose: continue or scroll.`,
  }

  return missions[state]() || `Open the thing you need to work on and do one small action in ${availableMinutes} minutes.`
}

// ── Blocker-Aware Missions ─────────────────────────────────

function generateBlockerAwareMission(
  state: UserState, blocker: string, minutes: number, energy: string,
): string | null {
  const pairs: Record<string, string> = {
    'avoiding-too_big': `Open the thing and do just one piece. Set a ${Math.min(minutes, 2)}-minute timer.`,
    'avoiding-unknown': `Write: "I don't know where to start because _______." Then open the thing.`,
    'overwhelmed-too_big': `Write down the 3 biggest pieces. Pick the smallest 2-minute version.`,
    'overwhelmed-many_tasks': `Write down every task. Cross out all but ONE. Do only that.`,
    'perfectionism-detailed': `Set a ${Math.min(minutes, 5)}-minute timer. Write the worst possible version.`,
    'perfectionism-fear_of_failure': `Write: "The worst that can happen is _______." Then start ugly.`,
    'stuck-confused': `Write: "I don't know how to start because _______." Then try 2 minutes.`,
    'stuck-missing_info': `Write down what info you need. Send one message or open one search.`,
    'tired-depleted': `Do 2 minutes. Not 5. Two minutes of the easiest action. Then rest.`,
    'distracted-digital': `Turn off phone notifications. ${minutes}-minute sprint. Then check.`,
  }

  const key = `${state}-${blocker}`
  if (pairs[key]) return pairs[key]

  // Energy adjustments
  if ((energy === 'depleted' || energy === 'low') && (state === 'tired' || state === 'avoiding')) {
    return `Do the smallest possible version for 2 minutes. Not 1 minute more.`
  }

  return null
}

function generateContextualMission(context: string, state: UserState, minutes: number, protocol: RescueProtocol): string {
  const hasDeadline = /\b(due|deadline|by|before|tomorrow|friday|monday|week)\b/i.test(context)
  const hasAssignment = /\b(assignment|essay|paper|project|report|homework)\b/i.test(context)
  const hasEmail = /\b(email|message|reply|send)\b/i.test(context)
  const hasMeeting = /\b(meeting|call|zoom|presentation)\b/i.test(context)
  const hasReading = /\b(read|chapter|book|article|page|section|textbook)\b/i.test(context)
  const hasCoding = /\b(code|debug|bug|fix|pull request|PR|merge|branch|commit)\b/i.test(context)
  const hasCleaning = /\b(clean|tidy|organize|declutter|wash|dishes|laundry|room)\b/i.test(context)
  const hasStudying = /\b(study|exam|test|quiz|review|flashcard|memorize)\b/i.test(context)
  const hasFitness = /\b(run|gym|exercise|workout|walk|stretch|yoga)\b/i.test(context)
  const hasCreative = /\b(write|draw|paint|design|create|edit|draft)\b/i.test(context)

  if (hasAssignment && state === 'perfectionism') return `Open your assignment doc and write one ugly sentence under the heading.`
  if (hasAssignment && state === 'avoiding') return `Open your assignment and copy the prompt into a new document. That's it.`
  if (hasAssignment && state === 'overwhelmed') return `Open your assignment. Write down the 3 sub-tasks. Pick the smallest.`
  if (hasEmail && state === 'avoiding') return `Open the email and write only the subject line.`
  if (hasMeeting && state === 'anxious') return `Write down 3 questions you might be asked. Prepare one answer.`
  if (hasDeadline && state === 'time_pressure') return `Write: "Done means _______." Define "enough" in one sentence.`
  if (hasReading && state === 'avoiding') return `Open the book/article and read the first paragraph. That's it.`
  if (hasReading && state === 'tired') return `Read one paragraph. If you want to keep going, great. Otherwise stop.`
  if (hasCoding && state === 'stuck') return `Write down what the code should do in one sentence. Then open the relevant file.`
  if (hasCoding && state === 'avoiding') return `Open the codebase. Find the relevant file. Read one function.`
  if (hasCleaning && state === 'tired') return `Set a 5-minute timer. Clean only during the timer. Then stop.`
  if (hasCleaning && state === 'overwhelmed') return `Pick one surface. Clear only that surface. That's the mission.`
  if (hasStudying && state === 'avoiding') return `Open your notes. Read one heading. Close them. That's done.`
  if (hasStudying && state === 'shame_spiral') return `Open one flashcard. Read it. You showed up. That counts.`
  if (hasFitness && state === 'avoiding') return `Put on your workout clothes/shoes. Nothing else required.`
  if (hasFitness && state === 'tired') return `Do 3 minutes. Three minutes only. Then decide.`
  if (hasCreative && state === 'perfectionism') return `Write/draw the worst possible version. Make it intentionally bad.`
  if (hasCreative && state === 'stuck') return `Set a ${Math.min(minutes, 5)}-minute timer. Create anything. No judgment.`
  if (hasEmail && state === 'overwhelmed') return `Open your inbox. Find 3 emails that need replies. Reply to the shortest one.`

  return `Open the relevant document and do one small action related to: ${context.slice(0, 50)}...`
}

// ── Quality Scoring ─────────────────────────────────────────

export function scoreMission(mission: string, context: MissionCompilationInput): MissionQualityScore {
  const lower = mission.toLowerCase()

  // Specificity: does it mention a specific action/object?
  const hasSpecificObject = /\b(doc|file|email|assignment|essay|paper|laptop|phone|tab|browser|note|book|page|sentence|line|word|item|surface|basket|room)\b/i.test(mission)
  const hasSpecificVerb = /\b(open|write|pick|move|set|copy|paste|tap|press|close|clear|delete|send|read|highlight|underline|circle|draw|type)\b/i.test(mission)
  const specificity = (hasSpecificObject ? 0.5 : 0) + (hasSpecificVerb ? 0.5 : 0)

  // Physical first action
  const physicalVerbs = /\b(open|pick|move|set|tap|press|close|clear|put|grab|stand|walk|sit)\b/i.test(mission)
  const physicalFirstAction = physicalVerbs ? 0.9 : 0.3

  // Emotional friction (lower is better)
  const hasPressure = /\b(must|should|have to|need to|gotta)\b/i.test(mission)
  const hasShame = SHAME_LANGUAGE_PATTERNS.some(p => p.test(mission))
  const emotionalFriction = (hasPressure ? 0.3 : 0) + (hasShame ? 0.5 : 0)

  // Duration fit
  const mentionsTime = /\b(\d+\s*min|timer|clock|alarm)\b/i.test(mission)
  const durationFit = mentionsTime ? 0.9 : (context.availableMinutes <= 5 ? 0.7 : 0.5)

  // Energy fit
  const isLowEnergy = context.energy === 'depleted' || context.energy === 'low'
  const isLowEnergyMission = /\b(clear|open|write one|name|list|small|tiny|easy)\b/i.test(mission)
  const energyFit = (isLowEnergy && isLowEnergyMission) ? 0.9 : (!isLowEnergy && !isLowEnergyMission) ? 0.8 : 0.4

  // State fit
  const stateFit = 0.8 // Simplified — would check protocol match

  // Clarity
  const wordCount = mission.split(/\s+/).length
  const clarity = wordCount >= 5 && wordCount <= 25 ? 0.9 : wordCount < 5 ? 0.5 : 0.6

  // Usefulness
  const usefulness = (hasSpecificVerb && hasSpecificObject) ? 0.9 : 0.5

  // Salvageability
  const salvageability = /\b(that's it|just|only|simply)\b/i.test(mission) ? 0.9 : 0.6

  // Privacy safety
  const privacySafety = !/\b(password|ssn|social security|credit card|bank account)\b/i.test(mission) ? 0.95 : 0.2

  // Non-shaming language
  const nonShaming = !SHAME_LANGUAGE_PATTERNS.some(p => p.test(mission)) ? 0.95 : 0.2

  // Start now score
  const startNow = /\b(now|right now|immediately|first|start)\b/i.test(mission) ? 0.9 : 0.6

  // Overall weighted average
  const overall = (
    specificity * 0.15 +
    physicalFirstAction * 0.15 +
    (1 - emotionalFriction) * 0.1 +
    durationFit * 0.1 +
    energyFit * 0.1 +
    stateFit * 0.05 +
    clarity * 0.1 +
    usefulness * 0.1 +
    salvageability * 0.05 +
    privacySafety * 0.05 +
    nonShaming * 0.05 +
    startNow * 0.05
  )

  return {
    specificity,
    physicalFirstAction,
    emotionalFriction,
    durationFit,
    energyFit,
    stateFit,
    clarity,
    usefulness,
    salvageability,
    privacySafety,
    nonShamingLanguage: nonShaming,
    startNowScore: startNow,
    overall: Math.min(1, Math.max(0, overall)),
  }
}

// ── Rejection ───────────────────────────────────────────────

export function rejectMission(mission: string): { rejected: boolean; reason: string | null } {
  // Check vague patterns
  for (const pattern of VAGUE_MISSION_PATTERNS) {
    if (pattern.test(mission)) {
      return { rejected: true, reason: `Vague mission: matches pattern "${pattern.source}"` }
    }
  }

  // Check shame patterns
  for (const pattern of SHAME_LANGUAGE_PATTERNS) {
    if (pattern.test(mission)) {
      return { rejected: true, reason: `Shame language detected: matches pattern "${pattern.source}"` }
    }
  }

  // Check if too long (likely too big)
  if (mission.split(/\s+/).length > 30) {
    return { rejected: true, reason: 'Mission is too long/complex' }
  }

  return { rejected: false, reason: null }
}

// ── Rewriting ───────────────────────────────────────────────

export function rewriteMission(mission: string, targetMinutes: number, state: UserState): string {
  // Make it smaller
  if (targetMinutes <= 2) {
    return `Open the thing and do one tiny action. That's it.`
  }
  if (targetMinutes <= 5) {
    return `Open the relevant document and do one small action in 5 minutes.`
  }
  return mission
}

export function generateFallback(mission: string, protocol: RescueProtocol, energy?: string): string {
  const fallbackMinutes = protocol.salvageRules.maxFallbackMinutes

  // Energy-aware fallback — lower energy = smaller action
  if (energy === 'depleted') {
    return `Put your hands on the keyboard. Just that. No typing required.`
  }
  if (energy === 'low') {
    return `Open the thing. Read one word. That's the whole mission.`
  }

  if (fallbackMinutes <= 1) {
    return `Open the thing. That's it. Just open it.`
  }
  if (fallbackMinutes <= 2) {
    return `Open the document and write one word. That counts.`
  }
  return `Set a ${fallbackMinutes}-minute timer. Do the smallest possible version.`
}

export function generateSalvage(mission: string, protocol: RescueProtocol): string {
  return `This still counts if we learn from it. Want the 1-minute version?`
}

export function generateBodyDoubleScript(protocol: RescueProtocol, durationMinutes: number): string | null {
  const mode = protocol.bodyDoubleRules.defaultMode

  if (mode === 'silent_room') {
    return `I'm here. You're not alone. Let's do this together for ${durationMinutes} minutes.`
  }
  if (mode === 'gentle_cowork') {
    return `I'll check in every few minutes. No pressure. Just presence.`
  }
  if (mode === 'firm_start') {
    return `Let's go. ${durationMinutes} minutes. First step: open the thing. Now.`
  }
  if (mode === 'study_room') {
    return `After this session, I'll ask you to explain what you learned. Ready?`
  }
  if (mode === 'emergency_2min') {
    return `2 minutes. I'll guide you step by step. Ready? Step 1: Open the document.`
  }
  if (mode === 'stay_with_me') {
    return `I'm staying with you. We'll go slow. What's the tiniest first step?`
  }

  return null
}

export function generateAntiDriftPlan(state: UserState, blocker: BlockerType | null): string {
  const plans: Record<UserState, string> = {
    avoiding: 'If you feel the urge to switch apps, write the urge down first. Then return.',
    overwhelmed: 'If you start thinking about other tasks, write them down. Return to the one thing.',
    stuck: 'If you freeze, say out loud: "The next step is _______."',
    tired: 'If you can\'t focus, do a 30-second stretch. Then return.',
    distracted: 'If a distraction appears, write it down. Don\'t act on it. Return.',
    anxious: 'If anxiety spikes, take 3 breaths. Then continue.',
    scattered: 'If you think of something else, write it down. Return to the one mission.',
    ready: 'If you start preparing more, stop. You\'re ready. Start now.',
    bored: 'If boredom hits, change your position (stand up, sit differently). Continue.',
    perfectionism: 'If you start editing, stop. Ugly first. Fix later.',
    unclear: 'If you\'re still stuck, write: "I need help with _______."',
    time_pressure: 'If panic rises, re-read your "Done means _______." Continue.',
    low_confidence: 'If self-doubt appears, say: "I\'m doing the smallest version." Continue.',
    shame_spiral: 'If shame appears, say: "I\'m here now. That\'s what matters." Continue.',
    fake_productivity: 'If you start planning more, close the planning app. Do the thing.',
    planning_loop: 'If you\'re planning again, set a 2-minute timer. Execute one action.',
    doomscroll_risk: 'If you want to scroll, finish this first. Then choose intentionally.',
  }

  return plans[state] || 'If you start drifting, take one breath. Return to the mission.'
}

export function generateCompletionCriteria(mission: string, durationMinutes: number): string {
  if (mission.includes('open') && mission.includes('write')) {
    return 'You opened the document and wrote something. That\'s it.'
  }
  if (mission.includes('write')) {
    return 'You wrote at least one sentence or bullet point.'
  }
  if (mission.includes('open')) {
    return 'You opened the relevant file or app.'
  }
  if (mission.includes('timer')) {
    return 'You set the timer and started the task.'
  }
  return `You did the action for ${durationMinutes} minutes or completed the step.`
}

// ── Success Probability ─────────────────────────────────────

// ── Mission Chaining — what to do next ─────────────────────

export function generateNextStep(
  completedMission: string,
  state: UserState,
  outcome: 'completed' | 'salvaged' | 'partial',
): string {
  const lower = completedMission.toLowerCase()
  if (outcome === 'salvaged' || outcome === 'partial') {
    if (lower.includes('open')) return `You opened it. Now try: read one sentence.`
    if (lower.includes('write') || lower.includes('sentence')) return `You wrote something. Try: write one more sentence.`
    if (lower.includes('pick') || lower.includes('choose')) return `You picked something. Try: do it for 2 minutes.`
    return `Set a 2-minute timer. Do the tiniest next action.`
  }
  // Completed — suggest the natural next
  if (state === 'perfectionism') return `Good. Now read what you wrote without changing anything. That's the next step.`
  if (state === 'avoiding') return `You started. Next: stay for 2 more minutes or take a break. Your choice.`
  if (state === 'overwhelmed') return `You picked one thing. Next: do the next smallest action on that thing.`
  if (state === 'tired') return `You did something. That's enough. Rest now.`
  if (state === 'anxious') return `You started. That was the hard part. Next: one more small step.`
  if (state === 'shame_spiral') return `You showed up. That's a win. Take a breath. You can do more later.`
  if (state === 'doomscroll_risk') return `You did a tiny action. Now choose: continue or scroll?`
  return `Next step: do one more small action or take a reset break.`
}

export function estimateSuccessProbability(input: MissionCompilationInput): number {
  let probability = 0.6 // Base

  // Energy adjustment
  if (input.energy === 'high') probability += 0.15
  else if (input.energy === 'medium') probability += 0.05
  else if (input.energy === 'low') probability -= 0.1
  else if (input.energy === 'depleted') probability -= 0.2

  // Duration adjustment
  if (input.availableMinutes <= 2) probability += 0.1
  else if (input.availableMinutes <= 5) probability += 0.05
  else if (input.availableMinutes >= 25) probability -= 0.1

  // State adjustment
  if (input.state === 'ready') probability += 0.15
  else if (input.state === 'shame_spiral') probability -= 0.15
  else if (input.state === 'avoiding') probability -= 0.1

  // Previous failures adjustment
  if (input.previousFailures.length > input.previousSuccesses.length) {
    probability -= 0.1
  }

  return Math.min(0.95, Math.max(0.1, probability))
}
