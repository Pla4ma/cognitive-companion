// ══════════════════════════════════════════════════════════════
// INTENT — Centralized Haptic Patterns
// All haptic feedback lives here so components stay clean and
// patterns stay consistent across the app.
// ══════════════════════════════════════════════════════════════

import * as Haptics from 'expo-haptics';

const { ImpactFeedbackStyle, NotificationFeedbackType, selectionAsync } = Haptics;

// ── Helpers ──────────────────────────────────────────────

/** Pause between chained haptic pulses. */
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ── Individual Patterns ──────────────────────────────────

/** Light tap — general press feedback. */
export async function tap(): Promise<void> {
  await Haptics.impactAsync(ImpactFeedbackStyle.Light);
}

/** Medium confirmation — primary action acknowledged. */
export async function confirm(): Promise<void> {
  await Haptics.impactAsync(ImpactFeedbackStyle.Medium);
}

/** Heavy impact — significant action (delete, dismiss, etc). */
export async function action(): Promise<void> {
  await Haptics.impactAsync(ImpactFeedbackStyle.Heavy);
}

/** Success notification — task completed, goal reached. */
export async function success(): Promise<void> {
  await Haptics.notificationAsync(NotificationFeedbackType.Success);
}

/** Warning notification — danger window, approaching deadline. */
export async function warning(): Promise<void> {
  await Haptics.notificationAsync(NotificationFeedbackType.Warning);
}

/** Two soft taps 100 ms apart — subtle "ok" feedback. */
export async function gentle(): Promise<void> {
  await Haptics.impactAsync(ImpactFeedbackStyle.Light);
  await sleep(100);
  await Haptics.impactAsync(ImpactFeedbackStyle.Light);
}

/** Three medium taps 150 ms apart — mission complete / celebration. */
export async function celebration(): Promise<void> {
  await Haptics.impactAsync(ImpactFeedbackStyle.Medium);
  await sleep(150);
  await Haptics.impactAsync(ImpactFeedbackStyle.Medium);
  await sleep(150);
  await Haptics.impactAsync(ImpactFeedbackStyle.Medium);
}

/** Single light tap — called every 4 s during body-double breathing. */
export async function breathe(): Promise<void> {
  await Haptics.impactAsync(ImpactFeedbackStyle.Light);
}

/** Single light tap — called every second in the last 10 s of a timer. */
export async function tick(): Promise<void> {
  await Haptics.impactAsync(ImpactFeedbackStyle.Light);
}

/** Warning + 300 ms pause + medium — rescue session started. */
export async function rescue(): Promise<void> {
  await Haptics.notificationAsync(NotificationFeedbackType.Warning);
  await sleep(300);
  await Haptics.impactAsync(ImpactFeedbackStyle.Medium);
}

/** OS-level selection feedback — chip toggles, pickers. */
export async function selection(): Promise<void> {
  await selectionAsync();
}

// ── Aggregate Export ─────────────────────────────────────

/** HapticPatterns — use as `HapticPatterns.tap()`, `HapticPatterns.celebration()`, etc. */
export const HapticPatterns = {
  tap,
  confirm,
  action,
  success,
  warning,
  gentle,
  celebration,
  breathe,
  tick,
  rescue,
  selection,
} as const;
