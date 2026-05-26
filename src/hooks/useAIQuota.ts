// ══════════════════════════════════════════════════════════════
// INTENT — useAIQuota
// Tracks daily AI message count via MMKV, enforces free-tier limits
// ══════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react'
import { MMKV } from 'react-native-mmkv'
import { useAppStore } from '../store'

const quotaStorage = new MMKV({ id: 'intent-quota' })

function todayKey(): string {
  return `ai_messages_${new Date().toISOString().slice(0, 10)}`
}

const FREE_DAILY_LIMIT = 5

export interface AIQuota {
  canSendMessage: boolean
  incrementMessages: () => void
  messagesRemaining: number
  isPro: boolean
}

export function useAIQuota(): AIQuota {
  const user = useAppStore((s) => s.user)
  const isPro = user?.plan === 'pro' || user?.plan === 'lifetime'
  const limit = isPro ? 999 : FREE_DAILY_LIMIT

  // We track the count in local state so re-renders happen on increment.
  const [count, setCount] = useState<number>(() => {
    return quotaStorage.getNumber(todayKey()) ?? 0
  })

  const incrementMessages = useCallback(() => {
    const key = todayKey()
    const current = quotaStorage.getNumber(key) ?? 0
    const next = current + 1
    quotaStorage.set(key, next)
    setCount(next)
  }, [])

  const canSendMessage = isPro || count < limit
  const messagesRemaining = isPro ? 999 : Math.max(0, limit - count)

  return { canSendMessage, incrementMessages, messagesRemaining, isPro }
}
