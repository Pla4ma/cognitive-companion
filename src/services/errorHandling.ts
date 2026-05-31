// ══════════════════════════════════════════════════════════════
// INTENT — Error Handling Service
// Converts technical errors into warm, encouraging, actionable messages.
// All user-facing copy is non-technical and non-judgmental.
// No store imports — errors are passed in as parameters.
// ══════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────

export type ErrorCode =
  | 'AI_OFFLINE'
  | 'STORE_CORRUPT'
  | 'NOTIFICATION_DENIED'
  | 'SESSION_EXPIRED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN'

export interface AppError {
  code: ErrorCode
  message: string
  recoverable: boolean
  suggestedAction?: string
}

export interface UserFacingError {
  title: string
  message: string
  action?: string
  actionHandler?: string   // name of handler function to invoke
}

// ── Error Code Metadata ──────────────────────────────────────

const ERROR_METADATA: Record<ErrorCode, {
  recoverable: boolean
  userTitle: string
  userMessage: string
  action?: string
  actionHandler?: string
}> = {
  AI_OFFLINE: {
    recoverable: true,
    userTitle: 'Coach is resting',
    userMessage: 'Your AI coach could not connect right now. You still have everything you need — try a pre-compiled mission instead.',
    action: 'Use a quick mission',
    actionHandler: 'navigateToQuickMission',
  },
  STORE_CORRUPT: {
    recoverable: true,
    userTitle: 'Data hiccup',
    userMessage: 'Something got tangled in your saved data. We are working to fix it — your sessions are still safe.',
    action: 'Restore from backup',
    actionHandler: 'attemptStoreRecovery',
  },
  NOTIFICATION_DENIED: {
    recoverable: false,
    userTitle: 'Notifications are off',
    userMessage: 'We cannot send you rescue nudges without notification permission. You can still use INTENT — you just will not get reminders.',
    action: 'Open settings',
    actionHandler: 'openNotificationSettings',
  },
  SESSION_EXPIRED: {
    recoverable: true,
    userTitle: 'Session timed out',
    userMessage: 'Your session expired, but your progress is saved. Ready to pick up where you left off?',
    action: 'Start fresh',
    actionHandler: 'startNewSession',
  },
  NETWORK_ERROR: {
    recoverable: true,
    userTitle: 'Connection lost',
    userMessage: 'You are offline right now. Rescue sessions, timers, and everything that matters still work perfectly — AI coaching will be back when you reconnect.',
    // no action needed, just informational
  },
  UNKNOWN: {
    recoverable: true,
    userTitle: 'Something unexpected happened',
    userMessage: 'We hit a bump, but nothing is broken. Your data is safe. Give it another try?',
    action: 'Try again',
    actionHandler: 'retry',
  },
}

// ── AI Error Handler ─────────────────────────────────────────

/**
 * Converts an AI API failure into an AppError with a friendly message
 * and a suggestion to use a pre-compiled mission instead.
 */
export function handleAIError(error: unknown): AppError {
  const rawMessage = extractErrorMessage(error)
  const isTimeout = rawMessage.toLowerCase().includes('timeout') || rawMessage.toLowerCase().includes('timed out')
  const isRateLimit = rawMessage.toLowerCase().includes('429') || rawMessage.toLowerCase().includes('rate')
  const isAuth = rawMessage.toLowerCase().includes('401') || rawMessage.toLowerCase().includes('403') || rawMessage.toLowerCase().includes('auth')

  let message: string
  let suggestedAction: string

  if (isTimeout) {
    message = 'The AI coach took too long to respond. It happens sometimes — your rescue does not need AI to work.'
    suggestedAction = 'Try a 2-minute pre-compiled mission while the coach rests.'
  } else if (isRateLimit) {
    message = 'Your coach is helping a lot of people right now. Give it a moment, or jump into a quick mission on your own.'
    suggestedAction = 'Start a pre-compiled mission — you already know what to do.'
  } else if (isAuth) {
    message = 'There is a connection issue with the AI service. Your account is fine — this is temporary.'
    suggestedAction = 'Pre-compiled missions work perfectly without AI.'
  } else {
    message = 'The AI coach could not respond right now. That is okay — you do not need AI to rescue a moment.'
    suggestedAction = 'Use a pre-compiled mission. You have got this.'
  }

  return {
    code: 'AI_OFFLINE',
    message,
    recoverable: true,
    suggestedAction,
  }
}

// ── Store Error Handler ──────────────────────────────────────

/**
 * Attempts to recover from store read/write failures.
 * Returns an AppError with context about what happened.
 */
export function handleStoreError(error: unknown): AppError {
  const rawMessage = extractErrorMessage(error)
  const isParseError = rawMessage.toLowerCase().includes('parse') ||
    rawMessage.toLowerCase().includes('json') ||
    rawMessage.toLowerCase().includes('syntax')
  const isQuota = rawMessage.toLowerCase().includes('quota') ||
    rawMessage.toLowerCase().includes('storage') ||
    rawMessage.toLowerCase().includes('full')
  const isCorrupt = rawMessage.toLowerCase().includes('corrupt') ||
    rawMessage.toLowerCase().includes('invalid') ||
    rawMessage.toLowerCase().includes('malformed')

  if (isParseError || isCorrupt) {
    return {
      code: 'STORE_CORRUPT',
      message: 'Some saved data got scrambled. This is rare and usually fixable — we can try to restore from a clean state.',
      recoverable: true,
      suggestedAction: 'Attempt store recovery. Your sessions and patterns are backed up.',
    }
  }

  if (isQuota) {
    return {
      code: 'STORE_CORRUPT',
      message: 'Your device is running low on storage space. INTENT needs a little room to save your progress.',
      recoverable: true,
      suggestedAction: 'Free up some space on your device, then try again.',
    }
  }

  return {
    code: 'STORE_CORRUPT',
    message: 'We had trouble reading your saved data. This is usually temporary — your sessions are still there.',
    recoverable: true,
    suggestedAction: 'Try again in a moment, or restart the app.',
  }
}

// ── User-Facing Error Formatter ──────────────────────────────

/**
 * Converts any error (unknown type) into a warm, user-friendly message.
 * Use this as the final fallback before showing anything to the user.
 */
export function formatUserFacingError(error: unknown): UserFacingError {
  // If it is already an AppError, use its code
  if (isAppError(error)) {
    const meta = ERROR_METADATA[error.code]
    return {
      title: meta.userTitle,
      message: error.message || meta.userMessage,
      action: meta.action || undefined,
      actionHandler: meta.actionHandler || undefined,
    }
  }

  // Try to classify the error
  const rawMessage = extractErrorMessage(error).toLowerCase()

  if (rawMessage.includes('network') || rawMessage.includes('fetch') || rawMessage.includes('connection')) {
    const meta = ERROR_METADATA.NETWORK_ERROR
    return { title: meta.userTitle, message: meta.userMessage }
  }

  if (rawMessage.includes('ai') || rawMessage.includes('openai') || rawMessage.includes('anthropic') || rawMessage.includes('llm')) {
    const meta = ERROR_METADATA.AI_OFFLINE
    return {
      title: meta.userTitle,
      message: meta.userMessage,
      action: meta.action,
      actionHandler: meta.actionHandler,
    }
  }

  if (rawMessage.includes('storage') || rawMessage.includes('store') || rawMessage.includes('persist')) {
    const meta = ERROR_METADATA.STORE_CORRUPT
    return {
      title: meta.userTitle,
      message: meta.userMessage,
      action: meta.action,
      actionHandler: meta.actionHandler,
    }
  }

  if (rawMessage.includes('notification') || rawMessage.includes('permission')) {
    const meta = ERROR_METADATA.NOTIFICATION_DENIED
    return {
      title: meta.userTitle,
      message: meta.userMessage,
      action: meta.action,
      actionHandler: meta.actionHandler,
    }
  }

  // Generic fallback — always warm and encouraging
  const meta = ERROR_METADATA.UNKNOWN
  return {
    title: meta.userTitle,
    message: meta.userMessage,
    action: meta.action,
    actionHandler: meta.actionHandler,
  }
}

// ── Helpers ──────────────────────────────────────────────────

function extractErrorMessage(error: unknown): string {
  if (error == null) return ''
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && 'message' in error && typeof (error as Record<string, unknown>).message === 'string') {
    return (error as { message: string }).message
  }
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'recoverable' in error &&
    typeof (error as AppError).code === 'string'
  )
}

/**
 * Creates an AppError from a code and optional override message.
 * Useful for constructing errors in a consistent shape.
 */
export function createAppError(code: ErrorCode, overrideMessage?: string): AppError {
  const meta = ERROR_METADATA[code]
  return {
    code,
    message: overrideMessage ?? meta.userMessage,
    recoverable: meta.recoverable,
    suggestedAction: meta.action,
  }
}

/**
 * Returns true if the error is something the user can retry.
 */
export function isRecoverable(error: unknown): boolean {
  if (isAppError(error)) return error.recoverable
  // Network errors are generally recoverable
  const msg = extractErrorMessage(error).toLowerCase()
  if (msg.includes('timeout') || msg.includes('network') || msg.includes('fetch')) return true
  // Unknown errors default to recoverable (optimistic)
  return true
}

/**
 * Wraps an async function with error handling.
 * Returns the result or an AppError instead of throwing.
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorCode: ErrorCode = 'UNKNOWN',
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const data = await fn()
    return { data, error: null }
  } catch (err) {
    return { data: null, error: createAppError(resolveErrorCode(err, errorCode)) }
  }
}

function resolveErrorCode(err: unknown, fallback: ErrorCode): ErrorCode {
  const msg = extractErrorMessage(err).toLowerCase()
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection')) return 'NETWORK_ERROR'
  if (msg.includes('ai') || msg.includes('openai') || msg.includes('anthropic')) return 'AI_OFFLINE'
  if (msg.includes('storage') || msg.includes('store') || msg.includes('persist')) return 'STORE_CORRUPT'
  if (msg.includes('notification') || msg.includes('permission')) return 'NOTIFICATION_DENIED'
  if (msg.includes('expired') || msg.includes('session')) return 'SESSION_EXPIRED'
  return fallback
}
