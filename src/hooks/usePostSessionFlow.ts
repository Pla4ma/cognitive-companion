// ══════════════════════════════════════════════════════════════
// INTENT — Post-Session Flow Hook
// Orchestrates the post-session moment sequence after handleComplete()
// Manages a deliberate sequence instead of independent overlays
// ══════════════════════════════════════════════════════════════

import { useState, useCallback, useRef, useEffect } from 'react'
import { useAppStore } from '../store'
import {
  getPostSessionMoments,
  type PostSessionMomentConfig,
  type PostSessionMoment,
} from '../services/retention/retentionEngine'
import type { MissionSession } from '../types'

export type { PostSessionMomentConfig }

export interface PostSessionState {
  currentMoment: PostSessionMomentConfig | null
  momentIndex: number
  totalMoments: number
  isComplete: boolean
  nextAction: string | null
}

export function usePostSessionFlow() {
  const [postSessionState, setPostSessionState] = useState<PostSessionState>({
    currentMoment: null,
    momentIndex: 0,
    totalMoments: 0,
    isComplete: false,
    nextAction: null,
  })
  const momentsRef = useRef<PostSessionMomentConfig[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const displayMoment = useCallback((index: number, moments: PostSessionMomentConfig[]) => {
    if (index >= moments.length) {
      setPostSessionState(s => ({ ...s, isComplete: true, currentMoment: null }))
      return
    }
    const moment = moments[index]
    setPostSessionState({
      currentMoment: moment,
      momentIndex: index,
      totalMoments: moments.length,
      isComplete: false,
      nextAction: index < moments.length - 1 ? 'next' : 'done',
    })
    if (!moment.requiresInteraction && moment.displayDurationMs > 0) {
      timerRef.current = setTimeout(() => {
        displayMoment(index + 1, moments)
      }, moment.displayDurationMs)
    }
  }, [])

  const startFlow = useCallback(
    (completedSession: MissionSession) => {
      const state = useAppStore.getState()
      const moments = getPostSessionMoments(
        state.retentionState,
        state.sessions,
        state.brainDumps,
        completedSession,
      )
      momentsRef.current = moments
      if (moments.length === 0) {
        setPostSessionState(s => ({ ...s, isComplete: true }))
        return
      }
      displayMoment(0, moments)
    },
    [displayMoment],
  )

  const advanceMoment = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const nextIndex = postSessionState.momentIndex + 1
    displayMoment(nextIndex, momentsRef.current)
  }, [postSessionState.momentIndex, displayMoment])

  const skipToEnd = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setPostSessionState(s => ({ ...s, isComplete: true, currentMoment: null }))
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { postSessionState, startFlow, advanceMoment, skipToEnd }
}
