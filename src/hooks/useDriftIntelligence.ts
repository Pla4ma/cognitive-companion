// ══════════════════════════════════════════════════════════════
// INTENT — useDriftIntelligence
// On-device drift prediction and intelligence profile
// ══════════════════════════════════════════════════════════════

import { useMemo } from 'react'
import { useAppStore } from '../store'
import {
  predictDrift,
  buildIntelligenceProfile,
  type DriftPrediction,
  type UserIntelligenceProfile,
} from '../engine/predictiveEngine'

export interface DriftIntelligence {
  hasEnoughData: boolean
  prediction: DriftPrediction | null
  profile: UserIntelligenceProfile | null
}

export function useDriftIntelligence(): DriftIntelligence {
  const sessions = useAppStore((s) => s.sessions)
  const resistancePatterns = useAppStore((s) => s.resistancePatterns)
  const distractions = useAppStore((s) => s.distractions)
  const momentumEvents = useAppStore((s) => s.momentumEvents)
  const missions = useAppStore((s) => s.missions)
  const microMissions = useAppStore((s) => s.microMissions)
  const brainDumps = useAppStore((s) => s.brainDumps)

  const hasEnoughData = sessions.length >= 5

  const prediction = useMemo(() => {
    if (!hasEnoughData) return null
    try {
      return predictDrift({
        sessions,
        patterns: resistancePatterns,
        distractions,
        momentumEvents,
        missions,
        microMissions,
        brainDumps,
      })
    } catch {
      return null
    }
  }, [hasEnoughData, sessions, resistancePatterns, distractions, momentumEvents, missions, microMissions, brainDumps])

  const profile = useMemo(() => {
    if (!hasEnoughData) return null
    try {
      return buildIntelligenceProfile({
        sessions,
        patterns: resistancePatterns,
        distractions,
        momentumEvents,
        missions,
        microMissions,
        brainDumps,
      })
    } catch {
      return null
    }
  }, [hasEnoughData, sessions, resistancePatterns, distractions, momentumEvents, missions, microMissions, brainDumps])

  return { hasEnoughData, prediction, profile }
}
