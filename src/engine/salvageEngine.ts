// ══════════════════════════════════════════════════════════════
// INTENT — Salvage Engine 2.0
// Converts failure into useful intelligence
// ══════════════════════════════════════════════════════════════

import type { MicroMission, MissionThread, UserState, BlockerType, EnergyLevel } from '../types'
import type { RescueProtocol } from '../types/rescue'
import { RESCUE_PROTOCOLS, getFallbackProtocol } from '../types/rescue'

export interface SalvageInput {
  mission: MicroMission
  thread: MissionThread | null
  abandonmentReason: 'canceled_early' | 'pause_too_long' | 'backgrounded' | 'user_tapped_stuck' | 'timer_ended_incomplete' | 'many_distractions' | 'never_started'
  sessionDurationSeconds: number
  distractionCount: number
  state: UserState
  energy: EnergyLevel
  blocker: BlockerType | null
}

export interface SalvagePlan {
  noShameMessage: string
  partialCredit: string
  smallerVersion: string
  newProtocolId: string
  comebackWhen: string
  bodyDoubleOffer: boolean
  captureBlocker: boolean
  momentumEvent: {
    type: string
    points: number
    note: string
  }
  threadUpdate: {
    dominantResistance: BlockerType | null
    bestProtocol: string | null
    needsRecompile: boolean
  }
}

export function generateSalvagePlan(input: SalvageInput): SalvagePlan {
  const protocol = RESCUE_PROTOCOLS[input.mission.protocolId]
  const fallbackProtocolId = getFallbackProtocol(input.mission.protocolId)
  const fallbackProtocol = RESCUE_PROTOCOLS[fallbackProtocolId]

  const noShameMessage = getNoShameMessage(input.abandonmentReason, input.sessionDurationSeconds)
  const partialCredit = getPartialCredit(input.sessionDurationSeconds, input.mission.estimatedMinutes)
  const smallerVersion = getSmallerVersion(input.mission, fallbackProtocol)

  return {
    noShameMessage,
    partialCredit,
    smallerVersion,
    newProtocolId: fallbackProtocolId,
    comebackWhen: getComebackTiming(input.state, input.energy),
    bodyDoubleOffer: protocol.bodyDoubleRules.defaultMode !== 'silent_room',
    captureBlocker: !!input.blocker,
    momentumEvent: {
      type: 'salvage',
      points: Math.max(1, Math.round(input.sessionDurationSeconds / 60)),
      note: `Salvaged: ${input.mission.title}`,
    },
    threadUpdate: {
      dominantResistance: input.blocker,
      bestProtocol: input.mission.protocolId,
      needsRecompile: input.abandonmentReason === 'never_started',
    },
  }
}

function getNoShameMessage(reason: string, durationSeconds: number): string {
  const minutes = Math.round(durationSeconds / 60)

  const messages: Record<string, string> = {
    canceled_early: minutes > 0
      ? `You did ${minutes} minutes. That counts. Want to try a smaller version?`
      : `Starting is the hardest part. Want to try just 1 minute?`,
    pause_too_long: `You paused. That's okay. The mission is still here. Want to restart with less time?`,
    backgrounded: `Life happens. You're back. Want the 2-minute version?`,
    user_tapped_stuck: `You're stuck. That's data. Let's try a different approach.`,
    timer_ended_incomplete: `The timer ended. That's okay. What did you accomplish? Even a little counts.`,
    many_distractions: `Lots of distractions. That's useful to know. Want to try with a shorter timer?`,
    never_started: `You didn't start. No judgment. What's the smallest possible first step?`,
  }

  return messages[reason] || `This still counts if we learn from it.`
}

function getPartialCredit(durationSeconds: number, estimatedMinutes: number): string {
  const minutes = Math.round(durationSeconds / 60)
  const percent = estimatedMinutes > 0 ? Math.round((minutes / estimatedMinutes) * 100) : 0

  if (percent >= 75) return `You did ${minutes} minutes (${percent}% of the mission). Almost there!`
  if (percent >= 50) return `You did ${minutes} minutes (${percent}%). Solid progress.`
  if (percent >= 25) return `You did ${minutes} minutes (${percent}%). That's a start.`
  if (minutes > 0) return `You did ${minutes} minutes. Every minute counts.`
  return `You showed up. That's the first step.`
}

function getSmallerVersion(mission: MicroMission, fallbackProtocol: RescueProtocol): string {
  const fallbackMinutes = fallbackProtocol.salvageRules.maxFallbackMinutes

  if (fallbackMinutes <= 1) {
    return `Open the document. That's it. Just open it.`
  }
  if (fallbackMinutes <= 2) {
    return `Set a 2-minute timer. Do the absolute smallest version of: ${mission.exactAction.slice(0, 50)}`
  }
  return `Set a ${fallbackMinutes}-minute timer. Do a smaller version of: ${mission.exactAction.slice(0, 50)}`
}

function getComebackTiming(state: UserState, energy: EnergyLevel): string {
  if (state === 'tired' || energy === 'depleted') {
    return 'When you have a bit more energy. Even 5 minutes later.'
  }
  if (state === 'shame_spiral') {
    return 'Right now. No guilt. One tiny thing.'
  }
  if (state === 'avoiding') {
    return 'In 10 minutes. Set a reminder.'
  }
  return 'Whenever you\'re ready. The mission will be here.'
}

// ── Salvage Copy ────────────────────────────────────────────

export const SALVAGE_COPY = {
  title: 'This still counts.',
  subtitle: 'Failure is data. Let\'s learn from it.',
  partialCredit: 'Partial progress is real progress.',
  noShame: 'No guilt. No shame. Just a smaller restart.',
  options: {
    smaller: 'Try the 2-minute version',
    different: 'Try a different approach',
    blocker: 'Tell me what\'s blocking you',
    reschedule: 'Remind me later',
    rest: 'I need a break',
    done: 'I\'m done for now',
  },
}
