// ══════════════════════════════════════════════════════════════
// INTENT — Anti-Drift Agent: Fallbacks
// Hierarchical fallback system: deterministic → templates → cached → AI → user
// ══════════════════════════════════════════════════════════════

import type { FallbackTier } from './types'
import type { UserState, EnergyLevel, BlockerType } from '../../types'

/**
 * Fallback hierarchy for any agent output.
 * Always produces a usable result — never returns null/undefined.
 */
export function resolveWithFallback<T>(context: {
  tier: FallbackTier
  deterministicFn: () => T | null
  templateFn: () => T | null
  cachedFn: () => T | null
  onDeviceAIFn: (() => T | null) | null
  remoteAIFn: (() => Promise<T | null>) | null
  userChoiceFn: (() => T | null) | null
  defaultValue: T
}): T {
  // Tier 1: Deterministic rules (always available)
  const deterministic = context.deterministicFn()
  if (deterministic !== null) return deterministic

  // Tier 2: Local templates
  if (context.tier === 'local_templates' || context.tier === 'cached_patterns' ||
      context.tier === 'on_device_ai' || context.tier === 'remote_ai' || context.tier === 'user_choice') {
    const template = context.templateFn()
    if (template !== null) return template
  }

  // Tier 3: Cached patterns
  if (context.tier === 'cached_patterns' || context.tier === 'on_device_ai' ||
      context.tier === 'remote_ai' || context.tier === 'user_choice') {
    const cached = context.cachedFn()
    if (cached !== null) return cached
  }

  // Tier 4: On-device AI (if available)
  if ((context.tier === 'on_device_ai' || context.tier === 'remote_ai' || context.tier === 'user_choice')
      && context.onDeviceAIFn) {
    const onDevice = context.onDeviceAIFn()
    if (onDevice !== null) return onDevice
  }

  // Tier 5: Remote AI (async — caller must handle)
  // This is handled separately since it's async

  // Tier 6: User choice
  if (context.tier === 'user_choice' && context.userChoiceFn) {
    const userChoice = context.userChoiceFn()
    if (userChoice !== null) return userChoice
  }

  // Ultimate fallback: default value
  return context.defaultValue
}

// ── Coach Pulse Fallbacks ───────────────────────────────────

export function getDeterministicCoachPulse(
  state: UserState,
  availableMinutes: number,
  blocker: BlockerType | null,
): string {
  const pulses: Record<UserState, string> = {
    avoiding: `You're avoiding something. That's okay. What if you gave it just ${availableMinutes} minutes?`,
    overwhelmed: `Too much at once. Let's find the one smallest thing. What's the tiniest next step?`,
    stuck: `You want to move but don't know how. What's the very first physical action? Not the project — the action.`,
    tired: `Low energy is real. What's the easiest possible version of what you need to do?`,
    distracted: `Your mind is pulling you in many directions. Write down the top 3. Pick one. Close everything else.`,
    anxious: `Anxiety is your brain trying to protect you. Name the fear in one sentence. Then set a ${availableMinutes}-min timer.`,
    scattered: `Jumping between things? Write down everything pulling your attention. Then pick just ONE.`,
    ready: `You're in the zone. Protect this. Start now before the moment passes.`,
    bored: `Boredom is a signal, not a sentence. Add a constraint: do it in 10 minutes, or do it badly on purpose.`,
    perfectionism: `Perfectionism is procrastination in disguise. Make the worst version on purpose. You can fix it later.`,
    unclear: `You don't know the first step. Write: "I don't know how to start because _______." Fill in the blank.`,
    time_pressure: `Running out of time? Define "enough." Write: "Done means _______." Then do that.`,
    low_confidence: `You don't think you can do it. Do the smallest possible version. ${availableMinutes} minutes. Proof before perfection.`,
    shame_spiral: `You're not behind. You're human. One tiny thing. That's the reset.`,
    fake_productivity: `You're planning but not doing. Close the planning app. Open the real work. One physical action.`,
    planning_loop: `You've planned enough. Set a ${availableMinutes}-min timer. Do the first physical action. No more planning.`,
    doomscroll_risk: `About to disappear into scrolling? Give me ${availableMinutes} minutes first. One tiny thing. Then choose intentionally.`,
  }

  return pulses[state] || `Let's find one small thing you can do in ${availableMinutes} minutes.`
}

// ── Mission Fallbacks ───────────────────────────────────────

export function getDeterministicMission(
  state: UserState,
  availableMinutes: number,
  energy: EnergyLevel,
  blocker: BlockerType | null,
): string {
  // High-specificity missions based on state + blocker
  if (state === 'perfectionism') {
    return 'Open the document and write the worst possible first sentence. You can fix it later.'
  }
  if (state === 'overwhelmed' && blocker === 'too_big') {
    return 'Write down the three things pulling your attention. Pick the smallest. Do only that.'
  }
  if (state === 'avoiding') {
    return 'Open the thing you\'re avoiding and write its name. That\'s it.'
  }
  if (state === 'tired' || energy === 'depleted') {
    return 'Do one low-energy reset: clear one surface or open one file.'
  }
  if (state === 'scattered') {
    return 'Write down the three things pulling your attention. Pick one. Close everything else.'
  }
  if (state === 'anxious') {
    return 'Write the bad version of the first sentence. It doesn\'t have to be good.'
  }
  if (state === 'stuck') {
    return 'Set a 2-minute timer and name the first step out loud.'
  }
  if (state === 'distracted') {
    return 'Write down every distraction. Phone in another room. 5-minute sprint.'
  }
  if (state === 'doomscroll_risk') {
    return 'Do one tiny action first. Then choose: continue or scroll.'
  }
  if (state === 'shame_spiral') {
    return 'Open the thing you\'ve been avoiding. Write one sentence. No guilt.'
  }
  if (state === 'planning_loop' || state === 'fake_productivity') {
    return 'Close the planning app. Open the real work. Do one physical action.'
  }
  if (state === 'unclear') {
    return 'Write one sentence: "I don\'t know how to start because _______."'
  }
  if (state === 'time_pressure') {
    return 'Write: "Done means _______." Not perfect. Done.'
  }
  if (state === 'low_confidence') {
    return 'Do the smallest possible version. 2 minutes. Proof before perfection.'
  }
  if (state === 'bored') {
    return 'Add a constraint: do it in 10 minutes, or do it standing up.'
  }

  // Default
  return `Open the thing you need to work on and do one small action in ${availableMinutes} minutes.`
}

// ── Fallback Tier Selection ─────────────────────────────────

export function selectFallbackTier(context: {
  localOnlyMode: boolean
  remoteAiEnabled: boolean
  onDeviceAiAvailable: boolean
  hasCachedPatterns: boolean
}): FallbackTier {
  if (context.localOnlyMode) {
    if (context.onDeviceAiAvailable) return 'on_device_ai'
    if (context.hasCachedPatterns) return 'cached_patterns'
    return 'local_templates'
  }

  if (context.remoteAiEnabled) {
    if (context.onDeviceAiAvailable) return 'on_device_ai'
    return 'remote_ai'
  }

  if (context.hasCachedPatterns) return 'cached_patterns'
  return 'local_templates'
}
