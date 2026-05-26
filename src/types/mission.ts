// ══════════════════════════════════════════════════════════════
// INTENT — Mission Types
// MicroMission, MissionThread, and mission compilation types
// ══════════════════════════════════════════════════════════════

import type { UserState, EnergyLevel, BlockerType } from './moment'
import type { PrivacyClassification } from './privacy'
import type { RescueProtocolId } from './rescue'

export type MissionThreadStatus = 'active' | 'paused' | 'completed' | 'archived' | 'needs_recompile'

export interface MissionAttempt {
  id: string
  missionId: string
  startedAt: string
  endedAt: string | null
  outcome: 'completed' | 'salvaged' | 'abandoned'
  durationMinutes: number
  protocolId: RescueProtocolId
  blockerAtStart: BlockerType | null
  energyAtStart: EnergyLevel | null
}

export interface MissionThread {
  id: string
  title: string
  originMomentId: string
  relatedGoalId: string | null
  missions: string[] // mission IDs
  failedAttempts: MissionAttempt[]
  salvagedAttempts: MissionAttempt[]
  successfulAttempts: MissionAttempt[]
  dominantResistance: BlockerType | null
  bestProtocol: RescueProtocolId | null
  currentTinyNextAction: string | null
  status: MissionThreadStatus
  createdAt: string
  updatedAt: string
}

// ── MicroMission ────────────────────────────────────────────

export type MicroMissionStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'salvaged'

export interface MicroMission {
  id: string
  threadId: string | null
  title: string
  exactAction: string // The concrete physical action
  status: MicroMissionStatus
  estimatedMinutes: number
  actualMinutes: number | null
  resistanceBefore: number | null // 1-5
  resistanceAfter: number | null // 1-5
  distractionCaptured: string | null
  completionCriteria: string // What counts as done
  fallbackMission: string | null // If this is too hard
  salvageMission: string | null // Salvage version
  protocolId: RescueProtocolId
  state: UserState
  energy: EnergyLevel
  blocker: BlockerType | null
  sortOrder: number
  createdAt: string
  completedAt: string | null
  privacyClassification: PrivacyClassification
}

// ── Mission Compilation ─────────────────────────────────────

export interface MissionCompilationInput {
  state: UserState
  blocker: BlockerType | null
  energy: EnergyLevel
  availableMinutes: number
  contextText: string | null
  threadId: string | null
  previousFailures: MissionAttempt[]
  previousSuccesses: MissionAttempt[]
  protocolId: RescueProtocolId
  privacyPolicy: PrivacyClassification
}

export interface MissionQualityScore {
  specificity: number // 0-1
  physicalFirstAction: number // 0-1
  emotionalFriction: number // 0-1, lower is better
  durationFit: number // 0-1
  energyFit: number // 0-1
  stateFit: number // 0-1
  clarity: number // 0-1
  usefulness: number // 0-1
  salvageability: number // 0-1
  privacySafety: number // 0-1
  nonShamingLanguage: number // 0-1
  startNowScore: number // 0-1
  overall: number // 0-1 weighted average
}

export interface CompiledMission {
  primaryMission: MicroMission
  tinyFallbackMission: MicroMission
  salvageMission: MicroMission
  bodyDoubleScript: string | null
  antiDriftPlan: string
  completionCriteria: string
  successProbability: number // 0-1
  missionQualityScore: MissionQualityScore
  reason: string
  trackingTags: string[]
}

// ── Mission Quality Gates ───────────────────────────────────

export const MISSION_QUALITY_THRESHOLDS = {
  minOverallScore: 0.5,
  minSpecificity: 0.6,
  minPhysicalFirstAction: 0.7,
  minClarity: 0.6,
  maxEmotionalFriction: 0.4,
  minNonShamingLanguage: 0.9,
}

export const VAGUE_MISSION_PATTERNS = [
  /^study\b/i,
  /^work on\b/i,
  /^be productive/i,
  /^clean your/i,
  /^stop procrastinating/i,
  /^focus harder/i,
  /^finish the whole/i,
  /^fix your life/i,
  /^get disciplined/i,
  /^try harder/i,
  /^just do it/i,
  /^be better/i,
  /^stop being/i,
  /^you should/i,
  /^you need to/i,
  /^you have to/i,
]

export const SHAME_LANGUAGE_PATTERNS = [
  /\blazy\b/i,
  /\bpathetic\b/i,
  /\bno excuses\b/i,
  /\byou failed\b/i,
  /\byou wasted\b/i,
  /\byou'?re behind\b/i,
  /\beveryone else\b/i,
  /\bfix your life\b/i,
  /\bget your act together\b/i,
  /\bstop being\b/i,
  /\byou'?re not good enough\b/i,
  /\byou'?ll never\b/i,
  /\bworthless\b/i,
  /\bhopeless\b/i,
]
