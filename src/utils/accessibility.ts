// ══════════════════════════════════════════════════════════════
// INTENT — Accessibility Utilities
// Reduce motion, screen reader announcements, animation helpers
// ══════════════════════════════════════════════════════════════

import { AccessibilityInfo, Platform } from 'react-native'

// ── State ──────────────────────────────────────────────────

let _reduceMotionEnabled = false
let _initialized = false

/**
 * Initialize reduce-motion detection.
 * Reads the current value and subscribes to changes.
 * Safe to call multiple times — only subscribes once.
 */
export function initReduceMotion(): void {
  if (_initialized) return
  _initialized = true

  // Read initial value
  AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
    _reduceMotionEnabled = enabled
  })

  // Subscribe to changes
  const subscription = AccessibilityInfo.addEventListener(
    'reduceMotionChanged',
    (enabled: boolean) => {
      _reduceMotionEnabled = enabled
    },
  )

  // Note: on RN 0.65+ addEventListener returns a subscription object
  // with a .remove() method. No manual cleanup needed unless the
  // caller explicitly wants to unsubscribe.
  void subscription
}

// ── Queries ────────────────────────────────────────────────

/**
 * Returns true if animations should play.
 * Returns false if the user has enabled "Reduce Motion".
 */
export function shouldAnimate(): boolean {
  return !_reduceMotionEnabled
}

/**
 * Returns the given duration, or 0 if reduce motion is enabled.
 * Use as: `withTiming(getAnimationDuration(300))` to respect user prefs.
 */
export function getAnimationDuration(normalDuration: number): number {
  return _reduceMotionEnabled ? 0 : normalDuration
}

// ── Screen Reader ──────────────────────────────────────────

/**
 * Announce a message to the screen reader (TalkBack / VoiceOver).
 * On web this is a no-op.
 */
export function announceForScreenReader(message: string): void {
  if (Platform.OS === 'web') return
  AccessibilityInfo.announceForAccessibility(message)
}
