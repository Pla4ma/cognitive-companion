# INTENT — Screenshot & Voice Future Honesty

## What Actually Works Today

### Image Import
- **Status**: Not implemented
- **What exists**: Architecture for context capsule with image source
- **What's needed**: `expo-image-picker` integration
- **Fallback**: "Paste text from screenshot" — user manually types what they see

### OCR (Text from Image)
- **Status**: Not implemented
- **What exists**: Context extractor interface accepts text
- **What's needed**: Native ML Kit / Vision framework bridge
- **Fallback**: User pastes text manually
- **App Store note**: Do not claim OCR capability if not implemented

### Voice Capture
- **Status**: Not implemented
- **What exists**: No voice module
- **What's needed**: `expo-speech` for TTS, native speech-to-text module
- **Fallback**: "Voice capture requires native module; use text fallback for now"
- **App Store note**: Do not show microphone button if it does nothing

### Share Extension
- **Status**: Architecture documented only
- **What exists**: `docs/NATIVE_SURFACE_TIERING.md` Tier 1 spec
- **What's needed**: Native share extension target (iOS) / intent filter (Android)
- **Fallback**: Deep link `intent://paste-chaos` for manual sharing

### Screenshot Detection
- **Status**: Not implemented
- **What exists**: Nothing
- **What's needed**: Native module monitoring photo library (privacy concern)
- **Fallback**: Do not implement. Too invasive.

---

## Rules

1. If a button exists, it must work or be clearly labeled as beta/coming soon
2. If an API is not available, show a text fallback — never a broken button
3. If a feature requires native code, mark it with `[NATIVE]` in the UI
4. Never expose unfinished features in production builds
5. Demo mode can show these features as "coming soon" for App Store screenshots

---

## Implementation Sequence

1. `expo-image-picker` → image import (works in Expo Go)
2. Text extraction from pasted text → deterministic first
3. Share extension → requires development build
4. Voice → requires native module + permissions
5. OCR → requires ML Kit / Vision framework bridge
6. Screenshot detection → do not implement
