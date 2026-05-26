// ══════════════════════════════════════════════════════════════
// INTENT — Voice Services Barrel Export
// ══════════════════════════════════════════════════════════════

// ── Voice Capture ───────────────────────────────────────────
export {
  requestPermission,
  checkPermission,
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  getRecordingDuration,
  getRecordingStatus,
  getStateTransitions,
  resetCapture,
  acknowledgeCompletion,
  markProcessing,
} from './voiceCapture'

// ── Voice Transcription ─────────────────────────────────────
export {
  transcribeAudio,
  transcribeAudioWithDuration,
  clearTranscriptionCache,
  getTranscriptionCacheSize,
  registerOfflineTranscriber,
  registerCloudTranscriber,
} from './voiceTranscription'

// ── Voice Intent Extraction ─────────────────────────────────
export {
  extractIntentFromVoice,
  detectUserState,
  isBrainDump,
} from './voiceIntent'

// ── Voice Copy ──────────────────────────────────────────────
export {
  getVoiceCopy,
  getStatePrompts,
  getCategoryPrompts,
  getVoiceExperienceCopy,
} from './voiceCopy'

// ── Voice Types ─────────────────────────────────────────────
export type {
  VoiceState,
  VoiceStateTransition,
  VoiceRecording,
  VoiceRecordingStatus,
  VoiceError,
  VoiceErrorCode,
  VoiceTranscriptionResult,
  TranscriptionCacheEntry,
  VoiceIntentCategory,
  VoiceIntentResult,
  VoiceIntentContext,
  VoiceCopy,
  VoiceCaptureOptions,
  VoiceTranscriptionOptions,
  VoiceIntentOptions,
} from '../../types/voice'
