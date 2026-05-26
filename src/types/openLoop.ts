// ══════════════════════════════════════════════════════════════
// INTENT — Open Loops Types
// Things that keep pulling attention because unresolved
// ══════════════════════════════════════════════════════════════

export type OpenLoopStatus = 'open' | 'in_progress' | 'relieved' | 'dismissed'
export type OpenLoopSource = 'repeated_distraction' | 'brain_dump' | 'failed_mission' | 'avoided_goal' | 'context_capsule' | 'user_capture'

export interface OpenLoop {
  id: string
  title: string
  source: OpenLoopSource
  emotionalWeight: number // 1-5
  nextTinyAction: string
  status: OpenLoopStatus
  relatedContextId: string | null
  relatedMissionThreadId: string | null
  createdAt: number
  lastTouchedAt: number
}
