// ══════════════════════════════════════════════════════════════
// INTENT — useProgressiveProfiling Hook
// Triggers contextual questions after specific sessions per audit spec:
//   Session 1: "What type of work were you doing?"
//   Session 3: "What time of day do you usually struggle?"
//   Session 5: "What's your biggest ongoing project?"
//   Session 7: Offer push notification setup
//   Session 14: Offer auth/backup
//   Session 30: Offer Pro plan
// ══════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect } from 'react'
import { useAppStore } from '../store'

export type ProfilingQuestion =
  | 'work_type'
  | 'struggle_time'
  | 'biggest_project'
  | 'notification_setup'
  | 'auth_backup'
  | 'offer_pro'

interface ProfilingState {
  /** Whether a profiling question should be shown */
  shouldShow: boolean
  /** The type of question to show */
  questionType: ProfilingQuestion | null
  /** Current session count (for determining next question) */
  sessionCount: number
}

const SESSION_THRESHOLDS: { count: number; question: ProfilingQuestion }[] = [
  { count: 1, question: 'work_type' },
  { count: 3, question: 'struggle_time' },
  { count: 5, question: 'biggest_project' },
  { count: 7, question: 'notification_setup' },
]

export function useProgressiveProfiling() {
  const sessionCount = useAppStore((s) => s.sessions.length)
  const profilingState = useAppStore((s) => s.profilingState)
  const updateProfile = useAppStore((s) => s.updateProfile)
  const setProfilingShown = useAppStore((s) => s.setProfilingShown)

  const [state, setState] = useState<ProfilingState>({
    shouldShow: false,
    questionType: null,
    sessionCount: 0,
  })

  // Check if we should show a profiling question after session count changes
  useEffect(() => {
    // Find the highest threshold that has been reached but not yet shown
    const pendingThreshold = SESSION_THRESHOLDS.find(
      t => sessionCount >= t.count && !profilingState[t.question],
    )

    if (pendingThreshold) {
      setState({
        shouldShow: true,
        questionType: pendingThreshold.question,
        sessionCount,
      })
    }
  }, [sessionCount, profilingState])

  const handleAnswer = useCallback(
    (answer: string) => {
      if (!state.questionType) return

      // Save the answer to user profile
      const fieldMap: Record<string, string> = {
        work_type: 'work_type',
        struggle_time: 'struggle_time',
        biggest_project: 'biggest_project',
      }
      const field = fieldMap[state.questionType]
      if (field) {
        updateProfile({ [field]: answer } as any)
      }

      // Mark this profiling question as shown
      setProfilingShown(state.questionType)

      setState({ shouldShow: false, questionType: null, sessionCount: 0 })
    },
    [state.questionType, updateProfile, setProfilingShown],
  )

  const handleDismiss = useCallback(() => {
    if (state.questionType) {
      setProfilingShown(state.questionType)
    }
    setState({ shouldShow: false, questionType: null, sessionCount: 0 })
  }, [state.questionType, setProfilingShown])

  return {
    ...state,
    handleAnswer,
    handleDismiss,
  }
}
