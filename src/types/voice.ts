// ══════════════════════════════════════════════════════════════
// INTENT — Voice Types
// Voice capture, transcription, and intent extraction types
// ══════════════════════════════════════════════════════════════

import type { UserState } from './moment'
import type { RescueProtocolId } from './rescue'

// ── Voice State Machine ─────────────────────────────────────

export type VoiceState =
  | 'idle'
  | 'recording'
  | 'paused'
  | 'completed'
  | 'processing'

export interface VoiceStateTransition {
  from: VoiceState
  to: VoiceState
  timestamp: number
}

// ── Voice Recording ─────────────────────────────────────────

export interface VoiceRecording {
  uri: string
  durationMs: number
  createdAt: string
  mimeType: string
}

export interface VoiceRecordingStatus {
  state: VoiceState
  isRecording: boolean
  isDone: boolean
  durationMs: number
  metering: number | null
  canRecord: boolean
  error: VoiceError | null
}

export type VoiceErrorCode =
  | 'PERMISSION_DENIED'
  | 'AUDIO_UNAVAILABLE'
  | 'RECORDING_FAILED'
  | 'STOP_FAILED'
  | 'PAUSE_FAILED'
  | 'RESUME_FAILED'
  | 'TRANSCRIPTION_FAILED'
  | 'INTENT_EXTRACTION_FAILED'
  | 'RECORDING_TOO_SHORT'
  | 'RECORDING_TOO_LONG'
  | 'DEVICE_NOT_SUPPORTED'

export interface VoiceError {
  code: VoiceErrorCode
  message: string
  recoverable: boolean
}

// ── Voice Transcription ─────────────────────────────────────

export interface VoiceTranscriptionResult {
  text: string
  confidence: number
  durationMs: number
  source: 'offline' | 'cloud'
  cached: boolean
}

export interface TranscriptionCacheEntry {
  uri: string
  result: VoiceTranscriptionResult
  createdAt: number
}

// ── Voice Intent ────────────────────────────────────────────

export type VoiceIntentCategory =
  | 'state_declaration'
  | 'request'
  | 'distraction'
  | 'brain_dump'
  | 'unknown'

export interface VoiceIntentResult {
  category: VoiceIntentCategory
  state: UserState | null
  protocol: RescueProtocolId | null
  confidence: number
  extractedText: string
  rawTranscript: string
  context: VoiceIntentContext
}

export interface VoiceIntentContext {
  /** Detected time references like "30 minutes" */
  timeReference: number | null
  /** Detected emotion keywords */
  emotionKeywords: string[]
  /** Whether user explicitly asked for help */
  explicitRequest: boolean
  /** Whether user mentioned a specific task */
  mentionedTask: string | null
  /** Items from a brain dump list */
  brainDumpItems: string[]
}

// ── Voice Mode Copy ─────────────────────────────────────────

export interface VoiceCopy {
  listeningPrompt: string
  processingPrompt: string
  errorPrompt: string
  confirmationPrompt: string
  permissionDeniedPrompt: string
  recordingTooShortPrompt: string
  stateDetectedPrompt: string
}

// ── Voice Service Options ───────────────────────────────────

export interface VoiceCaptureOptions {
  /** Max recording duration in ms (default 120_000 = 2 min) */
  maxDurationMs?: number
  /** Min recording duration in ms to accept (default 1000) */
  minDurationMs?: number
  /** Enable metering for visual feedback */
  enableMetering?: boolean
  /** Audio quality preset */
  quality?: 'low' | 'medium' | 'high'
}

export interface VoiceTranscriptionOptions {
  /** Prefer offline transcription even when cloud is available */
  preferOffline?: boolean
  /** Language hint for transcription engine */
  language?: string
  /** Max cache size (number of entries) */
  cacheSize?: number
}

export interface VoiceIntentOptions {
  /** Confidence threshold below which result is 'unknown' */
  minConfidence?: number
  /** Whether to attempt state mapping from free text */
  enableStateMapping?: boolean
}
