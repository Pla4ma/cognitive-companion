// ══════════════════════════════════════════════════════════════
// INTENT — useActiveMission
// Returns the currently active mission and its next pending/in-progress micro
// ══════════════════════════════════════════════════════════════

import { useMemo } from 'react'
import { useAppStore } from '../store'
import type { Mission, MicroMission } from '../types'

export interface ActiveMissionResult {
  activeMission: Mission | undefined
  activeMicro: MicroMission | undefined
}

export function useActiveMission(): ActiveMissionResult {
  const missions = useAppStore((s) => s.missions)
  const microMissions = useAppStore((s) => s.microMissions)

  return useMemo(() => {
    const activeMission = missions.find((m) => m.status === 'active')

    const activeMicro = activeMission
      ? microMissions.find(
          (mm) =>
            mm.threadId === activeMission.id &&
            (mm.status === 'pending' || mm.status === 'in_progress'),
        )
      : undefined

    return { activeMission, activeMicro }
  }, [missions, microMissions])
}
