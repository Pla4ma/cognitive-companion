// ══════════════════════════════════════════════════════════════
// INTENT — Voice Transcription Service
// Offline-first transcription with cloud fallback placeholder
// ══════════════════════════════════════════════════════════════

import type {
  VoiceTranscriptionResult,
  TranscriptionCacheEntry,
  VoiceTranscriptionOptions,
} from '../../types/voice'

// ── Cache ───────────────────────────────────────────────────

const transcriptionCache = new Map<string, TranscriptionCacheEntry>()
const DEFAULT_CACHE_SIZE = 20

function getCacheKey(uri: string): string {
  // Normalize URI to a consistent key
  return uri.split('?')[0] ?? uri
}

function evictOldestCacheEntry(maxSize: number): void {
  if (transcriptionCache.size <= maxSize) return

  let oldestKey: string | null = null
  let oldestTime = Infinity

  for (const [key, entry] of transcriptionCache) {
    if (entry.createdAt < oldestTime) {
      oldestTime = entry.createdAt
      oldestKey = key
    }
  }

  if (oldestKey !== null) {
    transcriptionCache.delete(oldestKey)
  }
}

function getCachedResult(uri: string): VoiceTranscriptionResult | null {
  const key = getCacheKey(uri)
  const entry = transcriptionCache.get(key)
  if (!entry) return null

  return { ...entry.result, cached: true }
}

function setCacheResult(
  uri: string,
  result: VoiceTranscriptionResult,
  maxSize: number,
): void {
  const key = getCacheKey(uri)
  evictOldestCacheEntry(maxSize - 1)
  transcriptionCache.set(key, {
    uri: key,
    result,
    createdAt: Date.now(),
  })
}

/**
 * Clear the transcription cache.
 */
export function clearTranscriptionCache(): void {
  transcriptionCache.clear()
}

/**
 * Get current cache size.
 */
export function getTranscriptionCacheSize(): number {
  return transcriptionCache.size
}

// ── Offline Transcription (placeholder) ─────────────────────
// This is a stub for a local speech-to-text engine.
// When expo-speech-recognition or similar becomes available,
// swap this implementation.

interface OfflineTranscriber {
  isAvailable(): Promise<boolean>
  transcribe(uri: string, language?: string): Promise<{ text: string; confidence: number }>
}

const offlineTranscriber: OfflineTranscriber = {
  async isAvailable(): Promise<boolean> {
    // TODO: Check if on-device speech recognition is available
    // For iOS 18+ and Android 15+, native STT APIs exist
    return false
  },

  async transcribe(_uri: string, _language?: string): Promise<{ text: string; confidence: number }> {
    throw new Error('Offline transcription not yet implemented')
  },
}

// ── Cloud Transcription (placeholder) ───────────────────────
// This is a stub for cloud speech-to-text.
// When the backend STT endpoint is ready, swap this.

interface CloudTranscriber {
  isAvailable(): Promise<boolean>
  transcribe(uri: string, language?: string): Promise<{ text: string; confidence: number }>
}

const cloudTranscriber: CloudTranscriber = {
  async isAvailable(): Promise<boolean> {
    // TODO: Check network availability and API key
    return false
  },

  async transcribe(_uri: string, _language?: string): Promise<{ text: string; confidence: number }> {
    throw new Error('Cloud transcription not yet implemented')
    // Future implementation:
    // 1. Upload audio file to STT endpoint
    // 2. Receive { text, confidence, segments }
    // 3. Return result
  },
}

// ── Duration Extraction ─────────────────────────────────────

function getAudioDurationMs(uri: string): number {
  // Best-effort: if URI contains duration hint, extract it
  // Otherwise, caller should pass duration from recording
  const match = uri.match(/duration[=:]([0-9]+)/i)
  return match?.[1] ? parseInt(match[1], 10) : 0
}

// ── Public API ──────────────────────────────────────────────

/**
 * Transcribe an audio file. Offline-first with cloud fallback.
 *
 * Checks cache first, then tries offline, then cloud.
 * Returns a result even if both fail (empty text, zero confidence).
 */
export async function transcribeAudio(
  uri: string,
  options: VoiceTranscriptionOptions = {},
): Promise<VoiceTranscriptionResult> {
  const {
    preferOffline = true,
    language = 'en-US',
    cacheSize = DEFAULT_CACHE_SIZE,
  } = options

  // 1. Check cache
  const cached = getCachedResult(uri)
  if (cached) {
    return cached
  }

  const durationMs = getAudioDurationMs(uri)
  let result: VoiceTranscriptionResult

  // 2. Try offline first (if preferred)
  if (preferOffline) {
    try {
      const offlineAvailable = await offlineTranscriber.isAvailable()
      if (offlineAvailable) {
        const offlineResult = await offlineTranscriber.transcribe(uri, language)
        result = {
          text: offlineResult.text,
          confidence: offlineResult.confidence,
          durationMs,
          source: 'offline',
          cached: false,
        }
        setCacheResult(uri, result, cacheSize)
        return result
      }
    } catch {
      // Offline failed, fall through to cloud
    }
  }

  // 3. Try cloud fallback
  try {
    const cloudAvailable = await cloudTranscriber.isAvailable()
    if (cloudAvailable) {
      const cloudResult = await cloudTranscriber.transcribe(uri, language)
      result = {
        text: cloudResult.text,
        confidence: cloudResult.confidence,
        durationMs,
        source: 'cloud',
        cached: false,
      }
      setCacheResult(uri, result, cacheSize)
      return result
    }
  } catch {
    // Cloud also failed
  }

  // 4. Both failed — return empty result
  // In production, this should surface to the user via voice error handling
  result = {
    text: '',
    confidence: 0,
    durationMs,
    source: 'offline',
    cached: false,
  }

  return result
}

/**
 * Transcribe with the duration from the capture engine.
 * Use this when the caller knows the actual recording duration.
 */
export async function transcribeAudioWithDuration(
  uri: string,
  durationMs: number,
  options: VoiceTranscriptionOptions = {},
): Promise<VoiceTranscriptionResult> {
  // Set duration in the URI query for downstream extraction
  const separator = uri.includes('?') ? '&' : '?'
  const uriWithDuration = `${uri}${separator}duration=${durationMs}`

  const result = await transcribeAudio(uriWithDuration, options)
  // Override with the known duration
  result.durationMs = durationMs
  return result
}

/**
 * Register a custom offline transcriber implementation.
 * Use this when a native STT module becomes available.
 */
export function registerOfflineTranscriber(transcriber: OfflineTranscriber): void {
  // We reassign the module-level object's methods
  // This works because the object reference is const but properties are mutable
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(offlineTranscriber as any).isAvailable = transcriber.isAvailable.bind(transcriber)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(offlineTranscriber as any).transcribe = transcriber.transcribe.bind(transcriber)
}

/**
 * Register a custom cloud transcriber implementation.
 * Use this when the backend STT endpoint is ready.
 */
export function registerCloudTranscriber(transcriber: CloudTranscriber): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(cloudTranscriber as any).isAvailable = transcriber.isAvailable.bind(transcriber)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(cloudTranscriber as any).transcribe = transcriber.transcribe.bind(transcriber)
}
