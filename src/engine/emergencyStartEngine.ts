// ══════════════════════════════════════════════════════════════
// INTENT — Emergency Start Engine
// One giant button: "Start me." Under 3 seconds to action.
// ══════════════════════════════════════════════════════════════

import type { UserState } from '../../types/moment'
import type { MicroMission } from '../../types/mission'

interface EmergencyStartResult {
  mission: MicroMission
  source: 'last_successful' | 'default_safe' | 'universal_fallback'
  reasoning: string
}

// ── Last Successful Protocol Cache ─────────────────────────

interface ProtocolSuccess {
  state: UserState
  action: string
  duration: number
  successCount: number
}

let lastSuccessfulProtocol: ProtocolSuccess | null = null

export function recordProtocolSuccess(state: UserState, action: string, duration: number): void {
  if (lastSuccessfulProtocol?.state === state && lastSuccessfulProtocol?.action === action) {
    lastSuccessfulProtocol.successCount++
  } else {
    lastSuccessfulProtocol = { state, action, duration, successCount: 1 }
  }
}

export function getLastSuccessful(): ProtocolSuccess | null {
  return lastSuccessfulProtocol
}

// ── Emergency Start ────────────────────────────────────────

export function getEmergencyStartMission(): EmergencyStartResult {
  // Priority 1: Last successful protocol
  if (lastSuccessfulProtocol && lastSuccessfulProtocol.successCount >= 1) {
    return {
      mission: buildMission(lastSuccessfulProtocol.action, lastSuccessfulProtocol.duration),
      source: 'last_successful',
      reasoning: `This worked for you before (${lastSuccessfulProtocol.successCount}x)`,
    }
  }

  // Priority 2: Universal safe default
  return {
    mission: buildMission('Open the thing you are avoiding. Name it.', 2),
    source: 'universal_fallback',
    reasoning: 'The simplest possible start',
  }
}

// ── Safe Defaults by State ─────────────────────────────────

const SAFE_DEFAULTS: Record<UserState, { action: string; duration: number }> = {
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
  return {
    mission: buildMission(safe.action, safe.duration),
    source: 'default_safe',
    reasoning: `Safe start for ${state}`,
  }
}

// ── Build Mission ──────────────────────────────────────────

function buildMission(action: string, duration: number): MicroMission {
  return {
    id: `emergency_${Date.now()}`,
    title: action,
    exactAction: action,
    duration,
    protocolId: 'emergency_start',
    fallbackAction: 'Just open it',
    salvageAction: 'You showed up. That counts.',
    bodyDoubleMode: null,
    category: 'rescue',
    createdAt: Date.now(),
  }
}

// ── Emergency Start Copy ───────────────────────────────────

export function getEmergencyStartCopy(): string {
  return 'Start me'
}

export function getEmergencyStartSubcopy(): string {
  return 'No choices. No typing. Just start.'
}

export function getEmergencyStartSuccessCopy(duration: number): string {
  return `You started. ${duration} minutes of action you would have lost.`
}
