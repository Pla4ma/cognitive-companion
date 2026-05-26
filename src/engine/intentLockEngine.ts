// ══════════════════════════════════════════════════════════════
// INTENT — Intent Lock Engine
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
  return {
    active: true,
    missionId,
    exitAttempts: 0,
    exitFrictionShown: false,
    reducedUI: true,
    startedAt: Date.now(),
  }
}

export function recordExitAttempt(state: IntentLockState): IntentLockState {
  return {
    ...state,
    exitAttempts: state.exitAttempts + 1,
    exitFrictionShown: true,
  }
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
