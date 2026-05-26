# Focus/Live Screen Merge Spec

**Status:** Proposed  
**Date:** 2026-05-26  
**Goal:** Unify `app/focus.tsx` and `app/live.tsx` into a single active-session screen (`app/live.tsx`), with `focus.tsx` becoming a thin redirect.

---

## 1. Problem

`app/live.tsx` and `app/focus.tsx` share ~70% of their code: timer logic, distraction capture, progress ring, pause/resume/abandon/salvage controls. But they diverge in meaningful ways:

| Feature | `live.tsx` (rescue) | `focus.tsx` (body double) |
|---|---|---|
| Checkpoints (every 5m) | ❌ | ✅ |
| Milestones (25/50/75/100%) | ❌ | ✅ |
| Body presence modes (ambient/active/intervention) | ❌ | ✅ |
| Breathing animation | ❌ | ✅ |
| Post-session flow (multi-moment) | ✅ | ❌ |
| Social proof / activation celebration | ✅ | ❌ |
| Paywall trigger | ✅ | ❌ |
| Progressive profiling | ✅ | ❌ |
| Mission context display | ✅ | ❌ |
| Completion screen with reflection | ❌ (post-session flow handles it) | ✅ |
| Focus type selector (deep_work, creative, admin, learning) | ❌ | ✅ |
| Body double mode selector (solo/presence/voice) | ❌ | ✅ |

Maintaining two files means bug fixes (timer accuracy, distraction capture, etc.) must be applied twice.

---

## 2. Solution: Unified `live.tsx` with Mode Parameter

### 2.1 Route Parameter

```
/live                              → defaults to ?mode=rescue
/live?mode=rescue                  → current live.tsx behavior
/live?mode=body_double             → current focus.tsx behavior (body double)
/live?mode=deep_work               → focus.tsx with deep_work type pre-selected
```

The `mode` param controls which feature sets are active. It's read via `useLocalSearchParams()` from expo-router.

### 2.2 Mode Definitions

| Mode | Description | Source |
|---|---|---|
| `rescue` | Quick anti-drift timer with distraction capture. Default for "just need to start" moments. | Current `live.tsx` |
| `body_double` | Accountability session with checkpoints, milestones, body presence. | Current `focus.tsx` with `selectedType` = any |
| `deep_work` | Same as `body_double` but pre-configured for deep work (longer default duration, `deep_work` focus type). | Current `focus.tsx` with `selectedType` = `deep_work` |

### 2.3 `focus.tsx` Becomes a Redirect

```tsx
// app/focus.tsx — thin redirect
import { useEffect } from 'react'
import { useRouter } from 'expo-router'

export default function FocusScreen() {
  const router = useRouter()
  useEffect(() => {
    router.replace({ pathname: '/live', params: { mode: 'body_double' } })
  }, [])
  return null
}
```

This preserves any deep links or bookmarks to `/focus`.

---

## 3. Feature Mapping

### 3.1 Features That Are Always Active (shared)

These exist in both screens today and should remain in all modes:

- **Timer logic** — `setInterval`, `elapsedSeconds`, `updateSessionTimer`, auto-complete at planned duration
- **ProgressRing** — circular timer display
- **Pause / Resume / Abandon / Salvage controls**
- **Distraction capture** — FAB button, text input, `captureDistraction()`
- **Distraction counter** — shows count during session
- **App state recalibration** — `AppState` listener to fix timer drift after backgrounding (live.tsx BUG #2)

### 3.2 Features Conditional on `mode === 'rescue'`

These are live.tsx-only features that should remain rescue-only:

- **Mission context display** — shows `activeMission.title` and `activeMicro.exactAction` above timer
- **Mid-session encouragement** — progress-based text ("Building momentum...", "Almost done...")
- **Post-session flow** — `usePostSessionFlow()` multi-moment overlay (activation celebration, social proof, momentum update, etc.)
- **Social proof toast** — `getSocialProofStat()` after completion
- **Activation celebration** — first-rescue overlay
- **Paywall trigger** — session 5+ or day 14 for free users
- **Progressive profiling** — `useProgressiveProfiling()` modal

### 3.3 Features Conditional on `mode !== 'rescue'` (body_double / deep_work)

These are focus.tsx-only features that should activate for accountability modes:

- **Checkpoints** — every 5 minutes, prompt "Still on track?" with on_track / drifting / stuck options
- **Milestones** — 25%/50%/75%/100% progress dots with labels ("Good start", "Halfway", "Final push", "Finish!")
- **Body presence levels** — `ambient` / `active` / `intervention`, controlled by checkpoint responses
- **Breathing animation** — subtle scale pulse when body presence is active or intervention
- **Focus type selector** — setup screen shows `FOCUS_TYPES` grid (deep_work, creative, admin, learning)
- **Body double mode selector** — Solo / Presence / Voice options in setup
- **Completion screen with reflection** — energy/focus mood dots, milestone stats, motivational message

### 3.4 Setup Screen Differences

| Element | `rescue` mode | `body_double` / `deep_work` mode |
|---|---|---|
| Title | "Start a Mission" | "Start a Focus Session" |
| Focus type selector | Hidden | Shown (FOCUS_TYPES grid) |
| Duration options | `[2, 5, 10, 15, 25, 45, 60]` | `[10, 15, 25, 30, 45, 60, 90]` |
| Default duration | 10 min | Based on FOCUS_TYPES[type].defaultMinutes (25) |
| Body double mode selector | Hidden | Shown (Solo/Presence/Voice) |
| Mission banner | Shown if activeMission exists | Hidden |
| "Just Show Me the Timer" button | Shown | Hidden |
| Start button label | "Start Mission" | "Start {config.label} — {duration} min" |

---

## 4. Architecture

### 4.1 New Hook: `useSessionMode`

Extract mode-awareness into a custom hook:

```ts
// src/hooks/useSessionMode.ts

type SessionMode = 'rescue' | 'body_double' | 'deep_work'

interface SessionModeConfig {
  mode: SessionMode
  isRescue: boolean
  isBodyDouble: boolean
  showCheckpoints: boolean
  showMilestones: boolean
  showBodyPresence: boolean
  showMissionContext: boolean
  showPostSessionFlow: boolean
  showSocialProof: boolean
  showPaywall: boolean
  showProfiling: boolean
  showCompletionScreen: boolean
  showFocusTypeSelector: boolean
  showBodyDoubleSelector: boolean
  defaultDurations: number[]
  defaultDuration: number
  setupTitle: string
  startButtonLabel: string
}

function useSessionMode(): SessionModeConfig
```

This single hook controls all conditional rendering. The `live.tsx` component reads from it instead of scattering `mode === 'rescue'` checks everywhere.

### 4.2 Extracted Sub-Components

Move these from inline JSX into standalone components under `src/components/session/`:

| Component | Purpose | Used by mode |
|---|---|---|
| `SessionTimer` | ProgressRing + time display + pulse animation | All |
| `SessionControls` | Pause/Resume + End + Finish Early buttons | All |
| `DistractionCapture` | FAB + text input + submit | All |
| `DistractionCounter` | Brain icon + count pill | All |
| `CheckpointModal` | "Still on track?" overlay with 3 options | body_double, deep_work |
| `MilestoneBar` | Horizontal dot progress with labels | body_double, deep_work |
| `BodyPresenceIndicator` | Breathing dot + text pill | body_double, deep_work |
| `SetupScreen` | Duration/type/mode selectors (mode-aware) | All (different configs) |
| `CompletionReflection` | Energy/focus mood dots + stats | body_double, deep_work |
| `PostSessionFlow` | Multi-moment overlay (existing) | rescue |

### 4.3 Code That Stays Shared

- Timer `useEffect` with `setInterval` and `sessionStartRef`
- `AppState` recalibration listener
- `handleComplete`, `handleAbandon`, `handleSalvage` logic (though completion *display* differs)
- `handleCaptureDistraction`
- All Zustand store interactions
- `formatTime` usage
- Haptic feedback on completion

### 4.4 Code That Is Mode-Specific

| Concern | rescue | body_double/deep_work |
|---|---|---|
| Checkpoint generation + response handling | — | `setupSessionTracking()`, `handleCheckpointResponse()` |
| Milestone tracking in timer interval | — | `setMilestones()` update per tick |
| Body presence state machine | — | `setBodyPresence()` based on checkpoint responses |
| Breathing animation | — | `breatheAnim` Animated loop |
| Glow animation on timer | — | `glowAnim` |
| Post-session flow | `usePostSessionFlow()` hook | — |
| Social proof / activation | `getSocialProofStat()`, `getActivationCelebration()` | — |
| Paywall logic | `getDaysSinceActivation()`, session count check | — |
| Progressive profiling | `useProgressiveProfiling()` | — |
| Completion screen | Post-session flow handles it | Dedicated `CompletionReflection` component |

---

## 5. Implementation Steps (ordered)

1. **Create `useSessionMode` hook** — read `mode` from route params, return config object
2. **Extract `SessionTimer` component** — shared timer ring + display
3. **Extract `SessionControls` component** — shared pause/resume/end buttons
4. **Extract `DistractionCapture` component** — shared capture UI
5. **Extract `CheckpointModal` component** — from focus.tsx
6. **Extract `MilestoneBar` component** — from focus.tsx
7. **Extract `BodyPresenceIndicator` component** — from focus.tsx
8. **Extract `SetupScreen` component** — mode-aware setup view
9. **Extract `CompletionReflection` component** — from focus.tsx
10. **Refactor `live.tsx`** — use all extracted components, wire up `useSessionMode` conditionals
11. **Replace `focus.tsx`** — thin redirect to `/live?mode=body_double`
12. **Test all three modes** — rescue, body_double, deep_work
13. **Remove dead code** — any styles/logic that didn't survive extraction

---

## 6. Risk Assessment

| Risk | Mitigation |
|---|---|
| Deep links to `/focus` break | `focus.tsx` stays as redirect file |
| Timer bugs re-emerge from refactor | Timer logic stays in one `useEffect`, just moved into unified component. Port the BUG #2/#3 fixes verbatim. |
| Mode-specific state bleeds across modes | `useSessionMode` hook gates all conditional state init. Checkpoint/milestone refs only initialize when `showCheckpoints` is true. |
| Bundle size increases from extra components | All components are already rendered conditionally — no new code, just reorganized. Tree-shaking handles unused modes. |
| focus.tsx styles conflict with live.tsx styles | Merge into single `StyleSheet.create()` call. Prefix mode-specific styles with `bd_` (body double) or `rescue_` for clarity. |

---

## 7. Files to Create/Modify

| File | Action |
|---|---|
| `src/hooks/useSessionMode.ts` | **Create** — mode config hook |
| `src/hooks/useSessionTracking.ts` | **Create** — checkpoint + milestone generation (extracted from focus.tsx) |
| `src/components/session/SessionTimer.tsx` | **Create** — shared timer ring |
| `src/components/session/SessionControls.tsx` | **Create** — shared controls |
| `src/components/session/DistractionCapture.tsx` | **Create** — shared distraction UI |
| `src/components/session/CheckpointModal.tsx` | **Create** — from focus.tsx |
| `src/components/session/MilestoneBar.tsx` | **Create** — from focus.tsx |
| `src/components/session/BodyPresenceIndicator.tsx` | **Create** — from focus.tsx |
| `src/components/session/SetupScreen.tsx` | **Create** — mode-aware setup |
| `src/components/session/CompletionReflection.tsx` | **Create** — from focus.tsx |
| `app/live.tsx` | **Refactor** — use extracted components + useSessionMode |
| `app/focus.tsx` | **Replace** — thin redirect |
| `docs/FOCUS-LIVE-MERGE.md` | **This file** |
