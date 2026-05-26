// ══════════════════════════════════════════════════════════════
// INTENT — useFeatureGate
// Maps user plan + session count to feature availability
// ══════════════════════════════════════════════════════════════

import { useMemo } from 'react'
import { useAppStore } from '../store'

export interface FeatureGates {
  rescue: boolean
  rescueProtocols: boolean
  intelligencePanel: boolean
  dangerWindows: boolean
  resistanceMap: boolean
  fullHistory: boolean
  aiCoach: boolean
  aiCoachUnlimited: boolean
  aiCoachDailyLimit: number
  missionsLimit: number
  weeklyNarrative: boolean
  shareCard: boolean
  cloudBackup: boolean
}

export function useFeatureGate(): { isPro: boolean; gates: FeatureGates } {
  const user = useAppStore((s) => s.user)
  const sessionCount = useAppStore((s) => s.sessionCount)

  return useMemo(() => {
    const isPro = user?.plan === 'pro' || user?.plan === 'lifetime'

    const gates: FeatureGates = {
      rescue: true,
      rescueProtocols: true,
      intelligencePanel: isPro,
      dangerWindows: isPro,
      resistanceMap: isPro,
      fullHistory: isPro,
      aiCoach: true,
      aiCoachUnlimited: isPro,
      aiCoachDailyLimit: isPro ? 999 : 5,
      missionsLimit: isPro ? 999 : 5,
      weeklyNarrative: isPro,
      shareCard: isPro,
      cloudBackup: isPro,
    }

    return { isPro, gates }
  }, [user?.plan, sessionCount])
}
