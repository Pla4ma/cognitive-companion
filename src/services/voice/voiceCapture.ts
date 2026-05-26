// ══════════════════════════════════════════════════════════════
// INTENT — Voice Capture Service
// Core recording engine with state machine
// Uses expo-av Audio.Recording
// ══════════════════════════════════════════════════════════════

import { Audio } from 'expo-av'
import type {
  VoiceState,
  VoiceStateTransition,
  VoiceRecording,
  VoiceRecordingStatus,
  VoiceError,
  VoiceErrorCode,
  VoiceCaptureOptions,
} from '../../types/voice'

// ── Constants ───────────────────────────────────────────────

const DEFAULT_MAX_DURATION_MS = 120_000 // 2 minutes
const DEFAULT_MIN_DURATION_MS = 1_000   // 1 second
const METERING_UPDATE_INTERVAL_MS = 100

const VALID_TRANSITIONS: Record<VoiceState, VoiceState[]> = {
  idle: ['recording'],
  recording: ['paused', 'completed'],
  paused: ['recording', 'completed'],
  completed: ['processing', 'idle'],
  processing: ['completed', 'idle'],
}

// ── State ───────────────────────────────────────────────────

let currentState: VoiceState = 'idle'
let currentRecording: Audio.Recording | null = null
let recordingStartTime: number | null = null
let elapsedMsAtPause = 0
let stateTransitions: VoiceStateTransition[] = []
let lastError: VoiceError | null = null
let meteringInterval: ReturnType<typeof setInterval> | null = null
let lastMetering: number | null = null

// ── Internal Helpers ────────────────────────────────────────

function transitionTo(next: VoiceState): void {
  if (!VALID_TRANSITIONS[currentState].includes(next)) {
    throw new Error(
      `[VoiceCapture] Invalid transition: ${currentState} -> ${next}`,
    )
  }
  stateTransitions.push({
    from: currentState,
    to: next,
    timestamp: Date.now(),
  })
  currentState = next
}

function createError(code: VoiceErrorCode, message: string, recoverable = true): VoiceError {
  return { code, message, recoverable }
}

function setError(code: VoiceErrorCode, message: string, recoverable = true): void {
  lastError = createError(code, message, recoverable)
}

function clearError(): void {
  lastError = null
}

function getElapsedMs(): number {
  if (recordingStartTime === null) return elapsedMsAtPause
  return elapsedMsAtPause + (Date.now() - recordingStartTime)
}

function stopMetering(): void {
  if (meteringInterval !== null) {
    clearInterval(meteringInterval)
    meteringInterval = null
  }
  lastMetering = null
}

function startMetering(recording: Audio.Recording): void {
  stopMetering()
  meteringInterval = setInterval(async () => {
    try {
      const status = await recording.getStatusAsync()
      if (status.isRecording && status.metering !== undefined) {
        lastMetering = status.metering
      }
    } catch {
      // Silently ignore metering failures — non-critical
    }
  }, METERING_UPDATE_INTERVAL_MS)
}

async function configureAudioMode(): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  })
}

async function resetAudioMode(): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: false,
  })
}

function getRecordingQuality(
  preset: 'low' | 'medium' | 'high' = 'medium',
): Audio.RecordingOptions {
  const presets: Record<string, Audio.RecordingOptions> = {
    low: {
      ...Audio.RecordingOptionsPresets.LOW_QUALITY,
    },
    medium: {
      ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
    },
    high: {
      ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
      android: {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
        bitRate: 320_000,
        sampleRate: 48_000,
        numberOfChannels: 1,
      },
      ios: {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
        bitRate: 320_000,
        sampleRate: 48_000,
        numberOfChannels: 1,
      },
    },
  }
  return presets[preset] ?? presets.medium
}

// ── Public API ──────────────────────────────────────────────

/**
 * Request microphone permission. Returns true if granted.
 */
export async function requestPermission(): Promise<boolean> {
  try {
    const { status } = await Audio.requestPermissionsAsync()
    return status === 'granted'
  } catch {
    return false
  }
}

/**
 * Check current microphone permission status without prompting.
 */
export async function checkPermission(): Promise<boolean> {
  try {
    const { status } = await Audio.getPermissionsAsync()
    return status === 'granted'
  } catch {
    return false
  }
}

/**
 * Start a new voice recording.
 * Transitions: idle -> recording
 */
export async function startRecording(
  options: VoiceCaptureOptions = {},
): Promise<void> {
  clearError()

  if (currentState !== 'idle') {
    setError('RECORDING_FAILED', 'Cannot start recording: not in idle state')
    throw lastError
  }

  // Check permission
  let granted = await checkPermission()
  if (!granted) {
    granted = await requestPermission()
  }
  if (!granted) {
    setError('PERMISSION_DENIED', 'Microphone permission was denied')
    transitionTo('idle') // stay idle but set error
    throw lastError
  }

  try {
    await configureAudioMode()

    const recording = new Audio.Recording()
    const quality = getRecordingQuality(options.quality)
    await recording.prepareToRecordAsync(quality)

    currentRecording = recording
    recordingStartTime = Date.now()
    elapsedMsAtPause = 0

    await recording.startAsync()

    if (options.enableMetering !== false) {
      startMetering(recording)
    }

    transitionTo('recording')
  } catch (err) {
    stopMetering()
    currentRecording = null
    recordingStartTime = null
    await resetAudioMode().catch(() => {})
    setError('RECORDING_FAILED', `Failed to start recording: ${String(err)}`)
    throw lastError
  }
}

/**
 * Stop the current recording and return the result.
 * Transitions: recording | paused -> completed
 */
export async function stopRecording(): Promise<VoiceRecording | null> {
  clearError()

  if (currentState !== 'recording' && currentState !== 'paused') {
    setError('STOP_FAILED', 'No active recording to stop')
    return null
  }

  try {
    stopMetering()

    const elapsed = getElapsedMs()
    const recording = currentRecording!

    await recording.stopAndUnloadAsync()
    await resetAudioMode()

    const uri = recording.getURI()
    currentRecording = null
    recordingStartTime = null
    elapsedMsAtPause = 0

    transitionTo('completed')

    if (!uri) {
      setError('RECORDING_FAILED', 'Recording URI is null')
      return null
    }

    const minDuration = DEFAULT_MIN_DURATION_MS
    if (elapsed < minDuration) {
      setError('RECORDING_TOO_SHORT', `Recording too short: ${elapsed}ms < ${minDuration}ms`)
      transitionTo('idle')
      return null
    }

    const result: VoiceRecording = {
      uri,
      durationMs: elapsed,
      createdAt: new Date().toISOString(),
      mimeType: 'audio/m4a',
    }

    return result
  } catch (err) {
    stopMetering()
    currentRecording = null
    recordingStartTime = null
    await resetAudioMode().catch(() => {})
    setError('STOP_FAILED', `Failed to stop recording: ${String(err)}`)
    transitionTo('idle')
    return null
  }
}

/**
 * Pause the current recording.
 * Transitions: recording -> paused
 */
export async function pauseRecording(): Promise<void> {
  clearError()

  if (currentState !== 'recording') {
    setError('PAUSE_FAILED', 'No active recording to pause')
    throw lastError
  }

  try {
    await currentRecording!.pauseAsync()
    elapsedMsAtPause = getElapsedMs()
    recordingStartTime = null
    stopMetering()

    transitionTo('paused')
  } catch (err) {
    setError('PAUSE_FAILED', `Failed to pause recording: ${String(err)}`)
    throw lastError
  }
}

/**
 * Resume a paused recording.
 * Transitions: paused -> recording
 */
export async function resumeRecording(): Promise<void> {
  clearError()

  if (currentState !== 'paused') {
    setError('RESUME_FAILED', 'No paused recording to resume')
    throw lastError
  }

  try {
    await currentRecording!.startAsync()
    recordingStartTime = Date.now()
    startMetering(currentRecording!)

    transitionTo('recording')
  } catch (err) {
    setError('RESUME_FAILED', `Failed to resume recording: ${String(err)}`)
    throw lastError
  }
}

/**
 * Get the current recording duration in milliseconds.
 * Accumulates time across pauses.
 */
export function getRecordingDuration(): number {
  return getElapsedMs()
}

/**
 * Get current voice recording status.
 */
export function getRecordingStatus(): VoiceRecordingStatus {
  return {
    state: currentState,
    isRecording: currentState === 'recording',
    isDone: currentState === 'completed',
    durationMs: getElapsedMs(),
    metering: lastMetering,
    canRecord: currentState === 'idle',
    error: lastError,
  }
}

/**
 * Get the history of state transitions for the current session.
 */
export function getStateTransitions(): VoiceStateTransition[] {
  return [...stateTransitions]
}

/**
 * Reset to idle state. Use for cleanup or error recovery.
 */
export async function resetCapture(): Promise<void> {
  stopMetering()

  if (currentRecording) {
    try {
      await currentRecording.stopAndUnloadAsync()
    } catch {
      // Best effort cleanup
    }
    currentRecording = null
  }

  await resetAudioMode().catch(() => {})

  currentState = 'idle'
  recordingStartTime = null
  elapsedMsAtPause = 0
  stateTransitions = []
  clearError()
}

/**
 * Transition from completed to idle (after transcription is done).
 */
export function acknowledgeCompletion(): void {
  if (currentState === 'completed') {
    transitionTo('idle')
  }
}

/**
 * Mark recording as being processed (after transcription starts).
 */
export function markProcessing(): void {
  if (currentState === 'completed') {
    transitionTo('processing')
  }
}
