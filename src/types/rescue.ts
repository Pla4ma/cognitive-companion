// ══════════════════════════════════════════════════════════════
// INTENT — Rescue Types
// RescueProtocol and intervention types
// ══════════════════════════════════════════════════════════════

import type { UserState, EnergyLevel } from './moment'

export type RescueProtocolId =
  | 'two_minute_ignition'
  | 'ugly_first_move'
  | 'clear_the_fog'
  | 'shrink_the_beast'
  | 'lock_the_door'
  | 'maintenance_spark'
  | 'pressure_valve'
  | 'body_double_start'
  | 'decision_breaker'
  | 'comeback_seed'
  | 'planning_loop_breaker'
  | 'doomscroll_intercept'

export interface MissionCompilationRules {
  requirePhysicalFirstAction: boolean
  maxDurationMinutes: number
  minDurationMinutes: number
  allowVagueActions: boolean
  requireCompletionCriteria: boolean
  templateStyle: 'directive' | 'question' | 'imperative' | 'gentle'
}

export interface CoachToneRules {
  defaultTone: 'gentle' | 'firm' | 'urgent'
  maxResponseLength: number
  useEmoji: boolean
  allowQuestions: boolean
  checkInFrequencyMinutes: number | null
}

export interface SalvageRules {
  offerPartialCredit: boolean
  maxFallbackMinutes: number
  suggestBodyDouble: boolean
  suggestProtocolSwitch: boolean
  noShameLanguage: boolean
}

export interface BodyDoubleRules {
  defaultMode: 'silent_room' | 'gentle_cowork' | 'firm_start' | 'study_room' | 'emergency_2min' | 'stay_with_me'
  checkInIntervalMinutes: number
  maxPromptsPerSession: number
  binaryQuestionsOnly: boolean
}

export interface NotificationRules {
  enabled: boolean
  maxPerDay: number
  quietHoursStart: number
  quietHoursEnd: number
  actionLabels: string[]
}

export interface RescueProtocol {
  id: RescueProtocolId
  name: string
  description: string
  bestForStates: UserState[]
  avoidForStates: UserState[]
  defaultDurationMinutes: number
  minDurationMinutes: number
  maxDurationMinutes: number
  recommendedEnergyLevels: EnergyLevel[]
  missionCompilationRules: MissionCompilationRules
  coachToneRules: CoachToneRules
  salvageRules: SalvageRules
  bodyDoubleRules: BodyDoubleRules
  notificationRules: NotificationRules
  successDefinitionTemplate: string
  fallbackTemplate: string
  contraindications: string[]
  safetyNotes: string[]
}

export const RESCUE_PROTOCOLS: Record<RescueProtocolId, RescueProtocol> = {
  two_minute_ignition: {
    id: 'two_minute_ignition',
    name: 'Two-Minute Ignition',
    description: 'Start something tiny enough to bypass resistance. Just 2 minutes.',
    bestForStates: ['avoiding', 'tired', 'low_confidence', 'shame_spiral'],
    avoidForStates: ['ready', 'time_pressure'],
    defaultDurationMinutes: 2,
    minDurationMinutes: 1,
    maxDurationMinutes: 5,
    recommendedEnergyLevels: ['depleted', 'low', 'medium'],
    missionCompilationRules: {
      requirePhysicalFirstAction: true, maxDurationMinutes: 5, minDurationMinutes: 1,
      allowVagueActions: false, requireCompletionCriteria: true, templateStyle: 'imperative',
    },
    coachToneRules: { defaultTone: 'gentle', maxResponseLength: 80, useEmoji: true, allowQuestions: false, checkInFrequencyMinutes: null },
    salvageRules: { offerPartialCredit: true, maxFallbackMinutes: 1, suggestBodyDouble: true, suggestProtocolSwitch: false, noShameLanguage: true },
    bodyDoubleRules: { defaultMode: 'emergency_2min', checkInIntervalMinutes: 1, maxPromptsPerSession: 3, binaryQuestionsOnly: true },
    notificationRules: { enabled: true, maxPerDay: 3, quietHoursStart: 22, quietHoursEnd: 7, actionLabels: ['Start 2 min', 'Snooze', 'Not today'] },
    successDefinitionTemplate: 'You started. That counts.',
    fallbackTemplate: 'Even 30 seconds counts. Want to try 1 minute?',
    contraindications: ['crisis_state'],
    safetyNotes: ['Never pressure. Always offer smaller.'],
  },

  ugly_first_move: {
    id: 'ugly_first_move',
    name: 'Ugly First Move',
    description: 'Make a bad first version intentionally. Perfectionism is the enemy.',
    bestForStates: ['perfectionism', 'anxious', 'stuck'],
    avoidForStates: ['tired', 'shame_spiral'],
    defaultDurationMinutes: 5,
    minDurationMinutes: 2,
    maxDurationMinutes: 15,
    recommendedEnergyLevels: ['low', 'medium', 'high'],
    missionCompilationRules: {
      requirePhysicalFirstAction: true, maxDurationMinutes: 15, minDurationMinutes: 2,
      allowVagueActions: false, requireCompletionCriteria: true, templateStyle: 'directive',
    },
    coachToneRules: { defaultTone: 'firm', maxResponseLength: 100, useEmoji: false, allowQuestions: true, checkInFrequencyMinutes: 5 },
    salvageRules: { offerPartialCredit: true, maxFallbackMinutes: 2, suggestBodyDouble: false, suggestProtocolSwitch: true, noShameLanguage: true },
    bodyDoubleRules: { defaultMode: 'gentle_cowork', checkInIntervalMinutes: 5, maxPromptsPerSession: 4, binaryQuestionsOnly: false },
    notificationRules: { enabled: true, maxPerDay: 2, quietHoursStart: 22, quietHoursEnd: 7, actionLabels: ['Start ugly version', 'Snooze'] },
    successDefinitionTemplate: 'You made something. It can be fixed later.',
    fallbackTemplate: 'Write one bad sentence. That\'s it.',
    contraindications: [],
    safetyNotes: ['Emphasize that ugly is intentional, not a reflection of ability.'],
  },

  clear_the_fog: {
    id: 'clear_the_fog',
    name: 'Clear The Fog',
    description: 'Convert chaos into one visible next move.',
    bestForStates: ['scattered', 'unclear', 'overwhelmed'],
    avoidForStates: ['ready'],
    defaultDurationMinutes: 5,
    minDurationMinutes: 2,
    maxDurationMinutes: 10,
    recommendedEnergyLevels: ['low', 'medium', 'high'],
    missionCompilationRules: {
      requirePhysicalFirstAction: true, maxDurationMinutes: 10, minDurationMinutes: 2,
      allowVagueActions: false, requireCompletionCriteria: true, templateStyle: 'question',
    },
    coachToneRules: { defaultTone: 'gentle', maxResponseLength: 120, useEmoji: true, allowQuestions: true, checkInFrequencyMinutes: 3 },
    salvageRules: { offerPartialCredit: true, maxFallbackMinutes: 2, suggestBodyDouble: true, suggestProtocolSwitch: true, noShameLanguage: true },
    bodyDoubleRules: { defaultMode: 'gentle_cowork', checkInIntervalMinutes: 3, maxPromptsPerSession: 5, binaryQuestionsOnly: true },
    notificationRules: { enabled: true, maxPerDay: 3, quietHoursStart: 22, quietHoursEnd: 7, actionLabels: ['Clear the fog', 'Brain dump', 'Snooze'] },
    successDefinitionTemplate: 'You identified one next move.',
    fallbackTemplate: 'Write down the three things pulling your attention. Pick one.',
    contraindications: [],
    safetyNotes: ['Do not add to overwhelm. Keep output minimal.'],
  },

  shrink_the_beast: {
    id: 'shrink_the_beast',
    name: 'Shrink The Beast',
    description: 'Make the task smaller until it feels doable.',
    bestForStates: ['overwhelmed', 'anxious', 'avoiding'],
    avoidForStates: ['ready', 'bored'],
    defaultDurationMinutes: 5,
    minDurationMinutes: 1,
    maxDurationMinutes: 15,
    recommendedEnergyLevels: ['depleted', 'low', 'medium'],
    missionCompilationRules: {
      requirePhysicalFirstAction: true, maxDurationMinutes: 15, minDurationMinutes: 1,
      allowVagueActions: false, requireCompletionCriteria: true, templateStyle: 'imperative',
    },
    coachToneRules: { defaultTone: 'gentle', maxResponseLength: 100, useEmoji: true, allowQuestions: true, checkInFrequencyMinutes: 5 },
    salvageRules: { offerPartialCredit: true, maxFallbackMinutes: 2, suggestBodyDouble: true, suggestProtocolSwitch: true, noShameLanguage: true },
    bodyDoubleRules: { defaultMode: 'stay_with_me', checkInIntervalMinutes: 3, maxPromptsPerSession: 5, binaryQuestionsOnly: true },
    notificationRules: { enabled: true, maxPerDay: 3, quietHoursStart: 22, quietHoursEnd: 7, actionLabels: ['Make smaller', '2-min version', 'Snooze'] },
    successDefinitionTemplate: 'You did a small piece. That\'s progress.',
    fallbackTemplate: 'What\'s the smallest possible version of this?',
    contraindications: [],
    safetyNotes: ['Never make the user feel bad for needing smaller.'],
  },

  lock_the_door: {
    id: 'lock_the_door',
    name: 'Lock The Door',
    description: 'Capture distraction and return to mission.',
    bestForStates: ['distracted', 'doomscroll_risk'],
    avoidForStates: ['tired', 'shame_spiral'],
    defaultDurationMinutes: 10,
    minDurationMinutes: 2,
    maxDurationMinutes: 25,
    recommendedEnergyLevels: ['medium', 'high'],
    missionCompilationRules: {
      requirePhysicalFirstAction: true, maxDurationMinutes: 25, minDurationMinutes: 2,
      allowVagueActions: false, requireCompletionCriteria: true, templateStyle: 'imperative',
    },
    coachToneRules: { defaultTone: 'firm', maxResponseLength: 80, useEmoji: false, allowQuestions: false, checkInFrequencyMinutes: 5 },
    salvageRules: { offerPartialCredit: true, maxFallbackMinutes: 2, suggestBodyDouble: true, suggestProtocolSwitch: false, noShameLanguage: true },
    bodyDoubleRules: { defaultMode: 'silent_room', checkInIntervalMinutes: 5, maxPromptsPerSession: 3, binaryQuestionsOnly: true },
    notificationRules: { enabled: true, maxPerDay: 4, quietHoursStart: 22, quietHoursEnd: 7, actionLabels: ['Lock in', 'Capture distraction', 'Snooze'] },
    successDefinitionTemplate: 'You returned to the mission.',
    fallbackTemplate: 'Write down the distraction. Return to mission.',
    contraindications: [],
    safetyNotes: ['Never shame for being distracted.'],
  },

  maintenance_spark: {
    id: 'maintenance_spark',
    name: 'Maintenance Spark',
    description: 'Use low-energy action to preserve identity and momentum.',
    bestForStates: ['tired', 'shame_spiral', 'bored'],
    avoidForStates: ['ready', 'time_pressure'],
    defaultDurationMinutes: 5,
    minDurationMinutes: 1,
    maxDurationMinutes: 10,
    recommendedEnergyLevels: ['depleted', 'low'],
    missionCompilationRules: {
      requirePhysicalFirstAction: true, maxDurationMinutes: 10, minDurationMinutes: 1,
      allowVagueActions: false, requireCompletionCriteria: true, templateStyle: 'gentle',
    },
    coachToneRules: { defaultTone: 'gentle', maxResponseLength: 80, useEmoji: true, allowQuestions: false, checkInFrequencyMinutes: null },
    salvageRules: { offerPartialCredit: true, maxFallbackMinutes: 1, suggestBodyDouble: false, suggestProtocolSwitch: false, noShameLanguage: true },
    bodyDoubleRules: { defaultMode: 'silent_room', checkInIntervalMinutes: 5, maxPromptsPerSession: 2, binaryQuestionsOnly: true },
    notificationRules: { enabled: true, maxPerDay: 2, quietHoursStart: 22, quietHoursEnd: 7, actionLabels: ['Low-energy start', 'Rest instead', 'Snooze'] },
    successDefinitionTemplate: 'You kept the thread alive.',
    fallbackTemplate: 'Clear one surface. Open one file. That\'s enough.',
    contraindications: [],
    safetyNotes: ['Rest is a valid choice. Never pressure.'],
  },

  pressure_valve: {
    id: 'pressure_valve',
    name: 'Pressure Valve',
    description: 'Reduce scope and define "enough."',
    bestForStates: ['time_pressure', 'anxious', 'overwhelmed'],
    avoidForStates: ['ready', 'bored'],
    defaultDurationMinutes: 5,
    minDurationMinutes: 2,
    maxDurationMinutes: 15,
    recommendedEnergyLevels: ['low', 'medium', 'high'],
    missionCompilationRules: {
      requirePhysicalFirstAction: true, maxDurationMinutes: 15, minDurationMinutes: 2,
      allowVagueActions: false, requireCompletionCriteria: true, templateStyle: 'directive',
    },
    coachToneRules: { defaultTone: 'firm', maxResponseLength: 100, useEmoji: false, allowQuestions: true, checkInFrequencyMinutes: 3 },
    salvageRules: { offerPartialCredit: true, maxFallbackMinutes: 2, suggestBodyDouble: false, suggestProtocolSwitch: true, noShameLanguage: true },
    bodyDoubleRules: { defaultMode: 'firm_start', checkInIntervalMinutes: 3, maxPromptsPerSession: 4, binaryQuestionsOnly: true },
    notificationRules: { enabled: true, maxPerDay: 3, quietHoursStart: 22, quietHoursEnd: 7, actionLabels: ['Define enough', 'Reduce scope', 'Snooze'] },
    successDefinitionTemplate: 'You defined "enough" and did it.',
    fallbackTemplate: 'Write: "Done means _______." Then do that.',
    contraindications: [],
    safetyNotes: ['Help reduce scope, not increase pressure.'],
  },

  body_double_start: {
    id: 'body_double_start',
    name: 'Body Double Start',
    description: 'Provide guided presence for high-resistance moments.',
    bestForStates: ['stuck', 'low_confidence', 'avoiding', 'shame_spiral'],
    avoidForStates: ['ready'],
    defaultDurationMinutes: 10,
    minDurationMinutes: 2,
    maxDurationMinutes: 25,
    recommendedEnergyLevels: ['low', 'medium', 'high'],
    missionCompilationRules: {
      requirePhysicalFirstAction: true, maxDurationMinutes: 25, minDurationMinutes: 2,
      allowVagueActions: false, requireCompletionCriteria: true, templateStyle: 'imperative',
    },
    coachToneRules: { defaultTone: 'gentle', maxResponseLength: 80, useEmoji: true, allowQuestions: true, checkInFrequencyMinutes: 3 },
    salvageRules: { offerPartialCredit: true, maxFallbackMinutes: 2, suggestBodyDouble: true, suggestProtocolSwitch: true, noShameLanguage: true },
    bodyDoubleRules: { defaultMode: 'stay_with_me', checkInIntervalMinutes: 2, maxPromptsPerSession: 6, binaryQuestionsOnly: true },
    notificationRules: { enabled: true, maxPerDay: 2, quietHoursStart: 22, quietHoursEnd: 7, actionLabels: ['Body double me', 'Start together', 'Snooze'] },
    successDefinitionTemplate: 'You started with support.',
    fallbackTemplate: 'I\'m here. What\'s the tiniest first step?',
    contraindications: [],
    safetyNotes: ['Never claim a real person is watching.'],
  },

  decision_breaker: {
    id: 'decision_breaker',
    name: 'Decision Breaker',
    description: 'App chooses one safe action when there are too many choices.',
    bestForStates: ['scattered', 'overwhelmed', 'unclear'],
    avoidForStates: ['ready'],
    defaultDurationMinutes: 5,
    minDurationMinutes: 2,
    maxDurationMinutes: 10,
    recommendedEnergyLevels: ['low', 'medium', 'high'],
    missionCompilationRules: {
      requirePhysicalFirstAction: true, maxDurationMinutes: 10, minDurationMinutes: 2,
      allowVagueActions: false, requireCompletionCriteria: true, templateStyle: 'imperative',
    },
    coachToneRules: { defaultTone: 'firm', maxResponseLength: 60, useEmoji: false, allowQuestions: false, checkInFrequencyMinutes: null },
    salvageRules: { offerPartialCredit: true, maxFallbackMinutes: 2, suggestBodyDouble: false, suggestProtocolSwitch: false, noShameLanguage: true },
    bodyDoubleRules: { defaultMode: 'firm_start', checkInIntervalMinutes: 5, maxPromptsPerSession: 3, binaryQuestionsOnly: true },
    notificationRules: { enabled: true, maxPerDay: 2, quietHoursStart: 22, quietHoursEnd: 7, actionLabels: ['Pick for me', 'Snooze'] },
    successDefinitionTemplate: 'You let the app choose. You started.',
    fallbackTemplate: 'I\'ll pick. Ready?',
    contraindications: [],
    safetyNotes: ['Never make high-stakes decisions for the user.'],
  },

  comeback_seed: {
    id: 'comeback_seed',
    name: 'Comeback Seed',
    description: 'Restart without shame after inactivity or abandonment.',
    bestForStates: ['shame_spiral', 'avoiding', 'low_confidence', 'tired'],
    avoidForStates: ['ready'],
    defaultDurationMinutes: 2,
    minDurationMinutes: 1,
    maxDurationMinutes: 5,
    recommendedEnergyLevels: ['depleted', 'low', 'medium'],
    missionCompilationRules: {
      requirePhysicalFirstAction: true, maxDurationMinutes: 5, minDurationMinutes: 1,
      allowVagueActions: false, requireCompletionCriteria: true, templateStyle: 'gentle',
    },
    coachToneRules: { defaultTone: 'gentle', maxResponseLength: 80, useEmoji: true, allowQuestions: false, checkInFrequencyMinutes: null },
    salvageRules: { offerPartialCredit: true, maxFallbackMinutes: 1, suggestBodyDouble: true, suggestProtocolSwitch: false, noShameLanguage: true },
    bodyDoubleRules: { defaultMode: 'gentle_cowork', checkInIntervalMinutes: 2, maxPromptsPerSession: 3, binaryQuestionsOnly: true },
    notificationRules: { enabled: true, maxPerDay: 2, quietHoursStart: 22, quietHoursEnd: 7, actionLabels: ['Comeback start', 'Tiny restart', 'Not today'] },
    successDefinitionTemplate: 'You came back. That\'s the win.',
    fallbackTemplate: 'One tiny thing. No guilt. Just start.',
    contraindications: ['crisis_state'],
    safetyNotes: ['Never reference "streak broken" or "you failed."'],
  },

  planning_loop_breaker: {
    id: 'planning_loop_breaker',
    name: 'Planning Loop Breaker',
    description: 'Force one execution action instead of more planning.',
    bestForStates: ['fake_productivity', 'planning_loop', 'scattered'],
    avoidForStates: ['ready', 'unclear'],
    defaultDurationMinutes: 5,
    minDurationMinutes: 2,
    maxDurationMinutes: 10,
    recommendedEnergyLevels: ['medium', 'high'],
    missionCompilationRules: {
      requirePhysicalFirstAction: true, maxDurationMinutes: 10, minDurationMinutes: 2,
      allowVagueActions: false, requireCompletionCriteria: true, templateStyle: 'imperative',
    },
    coachToneRules: { defaultTone: 'firm', maxResponseLength: 60, useEmoji: false, allowQuestions: false, checkInFrequencyMinutes: null },
    salvageRules: { offerPartialCredit: true, maxFallbackMinutes: 2, suggestBodyDouble: false, suggestProtocolSwitch: false, noShameLanguage: true },
    bodyDoubleRules: { defaultMode: 'firm_start', checkInIntervalMinutes: 5, maxPromptsPerSession: 2, binaryQuestionsOnly: true },
    notificationRules: { enabled: true, maxPerDay: 2, quietHoursStart: 22, quietHoursEnd: 7, actionLabels: ['Stop planning', 'Do one thing', 'Snooze'] },
    successDefinitionTemplate: 'You did the thing instead of planning it.',
    fallbackTemplate: 'Close the planning app. Open the real work. Do one action.',
    contraindications: [],
    safetyNotes: ['Be direct but never shaming.'],
  },

  doomscroll_intercept: {
    id: 'doomscroll_intercept',
    name: 'Doomscroll Intercept',
    description: 'Give a 1-2 minute action before the user falls into scrolling.',
    bestForStates: ['doomscroll_risk', 'avoiding', 'bored'],
    avoidForStates: ['ready', 'time_pressure'],
    defaultDurationMinutes: 2,
    minDurationMinutes: 1,
    maxDurationMinutes: 5,
    recommendedEnergyLevels: ['low', 'medium', 'high'],
    missionCompilationRules: {
      requirePhysicalFirstAction: true, maxDurationMinutes: 5, minDurationMinutes: 1,
      allowVagueActions: false, requireCompletionCriteria: true, templateStyle: 'imperative',
    },
    coachToneRules: { defaultTone: 'gentle', maxResponseLength: 60, useEmoji: true, allowQuestions: false, checkInFrequencyMinutes: null },
    salvageRules: { offerPartialCredit: true, maxFallbackMinutes: 1, suggestBodyDouble: false, suggestProtocolSwitch: false, noShameLanguage: true },
    bodyDoubleRules: { defaultMode: 'silent_room', checkInIntervalMinutes: 1, maxPromptsPerSession: 2, binaryQuestionsOnly: true },
    notificationRules: { enabled: true, maxPerDay: 4, quietHoursStart: 22, quietHoursEnd: 7, actionLabels: ['2 min first', 'I\'ll scroll after', 'Not now'] },
    successDefinitionTemplate: 'You chose intentionally.',
    fallbackTemplate: 'One tiny thing. Then scroll if you want.',
    contraindications: [],
    safetyNotes: ['Never shame scrolling. Frame as intentional choice.'],
  },
}

export function getProtocolForState(state: UserState): RescueProtocolId {
  const mapping: Record<UserState, RescueProtocolId> = {
    avoiding: 'two_minute_ignition',
    overwhelmed: 'shrink_the_beast',
    stuck: 'body_double_start',
    tired: 'maintenance_spark',
    distracted: 'lock_the_door',
    anxious: 'pressure_valve',
    scattered: 'clear_the_fog',
    ready: 'two_minute_ignition',
    bored: 'doomscroll_intercept',
    perfectionism: 'ugly_first_move',
    unclear: 'clear_the_fog',
    time_pressure: 'pressure_valve',
    low_confidence: 'comeback_seed',
    shame_spiral: 'comeback_seed',
    fake_productivity: 'planning_loop_breaker',
    planning_loop: 'planning_loop_breaker',
    doomscroll_risk: 'doomscroll_intercept',
  }
  return mapping[state]
}

export function getFallbackProtocol(protocolId: RescueProtocolId): RescueProtocolId {
  const fallbacks: Record<RescueProtocolId, RescueProtocolId> = {
    two_minute_ignition: 'comeback_seed',
    ugly_first_move: 'two_minute_ignition',
    clear_the_fog: 'shrink_the_beast',
    shrink_the_beast: 'two_minute_ignition',
    lock_the_door: 'two_minute_ignition',
    maintenance_spark: 'comeback_seed',
    pressure_valve: 'shrink_the_beast',
    body_double_start: 'two_minute_ignition',
    decision_breaker: 'two_minute_ignition',
    comeback_seed: 'maintenance_spark',
    planning_loop_breaker: 'two_minute_ignition',
    doomscroll_intercept: 'two_minute_ignition',
  }
  return fallbacks[protocolId]
}
