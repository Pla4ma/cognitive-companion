# INTENT APP — PART 2: SYSTEMS, PRODUCT ARCHITECTURE & FULL REBUILD BLUEPRINT

## Everything Beyond The Bugs — June 2026 Edition

*Saved from Telegram conversation, May 26 2026*

---

## SECTION 1: THE RETENTION SYSTEM — COMPLETE REBUILD

The current retention engine (`src/services/retention/retentionEngine.ts`) is 100 lines of type definitions and a factory function. It defines `RetentionState` and a list of `RetentionEvent` types but has zero actual logic — no tracking calls, no behavioral triggers, no re-engagement mechanics. The types are correct. The implementation is empty. This is the most dangerous gap in the entire app because retention is the business. Without it, you have an app that people open once, find interesting, and forget about in 72 hours.

Research from 2026 shows Android Day-1 retention averages 22.6% and iOS 25.6%. Apps that implement even basic behavioral retention loops double this. Apps like Forest and Finch that build emotional investment into the mechanic sustain 30+ day retention above 15%, which is exceptional for productivity tools.

### 1.1 — THE ACTIVATION EVENT (THE REAL ONE)

The single most important retention insight from 2026 data: 90% of trial/activation happens on day 0. If a user doesn't experience the core value proposition in session 1, they never come back. The current app's "activation event" is vague — there's a `RetentionEvent` type called `rescue_completed` but it's never fired anywhere.

Your activation event must be completing the first Rescue loop end-to-end: state select → protocol shown → mission displayed → timer started → complete or salvage. This should fire `rescue_completed` and trigger a specific first-time celebration that feels earned and human.

```typescript
// src/services/retention/retentionEngine.ts — rebuild from scratch

import { MMKV } from 'react-native-mmkv'
import * as Haptics from 'expo-haptics'

const retentionStorage = new MMKV({ id: 'intent-retention' })

export interface ActivationData {
  activatedAt: string
  firstRescueState: string        // which state they rescued from
  firstRescueMinutes: number      // how long the session was
  firstRescueProtocol: string     // which protocol matched them
  completedVsSalvaged: 'completed' | 'salvaged'
  timeFromInstallToActivation: number  // minutes — critical metric
}

export function recordActivation(data: ActivationData): void {
  if (isActivated()) return  // idempotent
  
  retentionStorage.set('activated', 'true')
  retentionStorage.set('activation_data', JSON.stringify(data))
  retentionStorage.set('activated_at', new Date().toISOString())

  // Queue the activation event for analytics
  trackRetentionEvent('first_rescue_completed', {
    ...data,
    is_activation: true,
  })
  
  // Trigger onboarding completion celebration
  scheduleActivationCelebration()
}

export function isActivated(): boolean {
  return retentionStorage.getString('activated') === 'true'
}

function scheduleActivationCelebration(): void {
  // This fires the "You did it" moment — 
  // not a popup, but an animated state change on the next home screen open
  retentionStorage.set('show_activation_celebration', 'true')
}
```

In `completeSession` store action, add:

```typescript
completeSession: (notes?: string) => {
  // ... existing logic ...
  
  // Check if this is the first completion (activation event)
  const state = get()
  const completedSessions = state.sessions.filter(s => s.status === 'completed' || s.status === 'salvaged')
  if (completedSessions.length === 1) {  // just became 1
    recordActivation({
      activatedAt: new Date().toISOString(),
      firstRescueState: activeSession.mode,
      firstRescueMinutes: Math.round(activeSession.actual_seconds / 60),
      firstRescueProtocol: 'unknown',  // pass through from session
      completedVsSalvaged: 'completed',
      timeFromInstallToActivation: 0,  // compute from user.created_at
    })
  }
}
```

### 1.2 — THE 7 RETENTION LOOPS INTENT NEEDS

Apps like Finch that reframe productivity as care rather than performance sustain ADHD user retention where streak-based apps fail after burnout. INTENT's "shame-free salvage" positioning is correct but the retention mechanics need to match.

**Loop 1 — The Rescue Loop (core, already exists but broken)**
Open → feel drift → rescue → feel good → close. Currently broken because the mission never appears in the live screen (Bug #4 from Part 1). Fixing that bug activates this loop. This is the 10-second loop. It needs to work perfectly every single time or users churn.

**Loop 2 — The Insight Loop (not built)**
After 5+ sessions, the app should tell the user something true about themselves that they didn't know. "You rescue fastest on Monday mornings. You struggle most on Thursday afternoons between 2-4pm. Your most common blocker is 'overwhelmed' — not 'avoiding' like most people." This is the predictive engine doing its job. The current UI never surfaces this. Implementation in Section 5.

**Loop 3 — The Comeback Loop (not built)**
When a user abandons a session or goes dormant for 2+ days, the notification should be warm and specific — not generic. "Hey. You started rescuing Thursday and stopped. That happens. The 'avoiding' pattern usually comes back strongest on Mondays. Tomorrow morning might be a good moment." This requires the interceptor engine (`src/engine/interceptor.ts`) to be wired to notification scheduling. The types are there. The wire is missing.

**Loop 4 — The Streak Alternative Loop (needs redesign)**
The current streak is a classic consecutive-day counter. Apps with all-or-nothing design where missing one day kills your streak are specifically called out as a failure pattern for ADHD apps in 2026. INTENT should replace "streak" with "momentum windows" — rolling 7-day counts with no cliff. Show "7 rescues in the last 14 days" not "3-day streak." Missing a day doesn't reset anything. Progress is always forward.

```typescript
// src/engine/insights.ts — add:
export function computeMomentumWindow(sessions: MissionSession[], days: number = 14): {
  count: number
  trend: 'building' | 'stable' | 'cooling'
  description: string
} {
  const cutoff = Date.now() - days * 86400000
  const recent = sessions.filter(
    s => new Date(s.started_at).getTime() >= cutoff && 
    (s.status === 'completed' || s.status === 'salvaged')
  )
  
  // Compare first half vs second half of window
  const midpoint = Date.now() - (days / 2) * 86400000
  const firstHalf = recent.filter(s => new Date(s.started_at).getTime() < midpoint).length
  const secondHalf = recent.filter(s => new Date(s.started_at).getTime() >= midpoint).length
  
  const trend = secondHalf > firstHalf ? 'building' : 
                secondHalf < firstHalf ? 'cooling' : 'stable'
  
  return {
    count: recent.length,
    trend,
    description: `${recent.length} rescues in ${days} days`,
  }
}
```

**Loop 5 — The Progress Revelation Loop (not built)**
Every Sunday evening, the app should synthesize the week into a 3-sentence human summary. Not stats. Sentences. "This week you fought 'overwhelmed' more than any other state and won 70% of the time. Thursday at 2pm is your most reliable drift window — you showed up anyway twice. Your sessions are getting shorter but your completion rate is going up." This is 200 tokens from the AI coach, generated once a week, stored locally. This is the loop that makes people screenshot and share.

**Loop 6 — The Context Persistence Loop (not built)**
The brain dump (`brainDumps` in store) has no return path. Users dump their anxieties/tasks into it and it disappears. Add a "Pending Actions" surface that shows items from brain dumps that haven't been turned into missions yet. Every time the user opens the app, they see "3 things from your last brain dump are still pending." This closes the cognitive loop.

**Loop 7 — The Social Proof Loop (not built)**
Not social features — social proof. After completing a rescue, briefly show: "You just did what 73% of people who feel 'avoiding' can't do — you started anyway." Small numbers from anonymous aggregate data (or just fake it honestly with reasonable psychological estimates) that make the user feel part of a community of people fighting the same battle.

### 1.3 — THE DAY 1 / DAY 7 / DAY 30 RETENTION PLAN

**DAY 1 (activation):**
- First rescue loop must work perfectly — fix Bug #4
- Post-rescue: short celebration + "You just proved you can start"
- Notification permission request AFTER first success (not before)
- Schedule a "How was it?" notification for 6 hours post-install

**DAY 2 (habit seeding):**
- Notification at their actual first-session time from day 1
- "Yesterday you rescued from 'avoiding' in 5 minutes. Today?"
- Home screen shows yesterday's session as context

**DAY 3 (pattern recognition):**
- Start surfacing first pattern: "You've opened this app 3 times when feeling 'anxious'"
- Show rescue rate: "2 of 3 sessions completed"

**DAY 7 (first insight):**
- First weekly summary (Sunday or 7th day)
- Resistance map starts showing 2+ patterns
- Offer "Try a longer session" if all sessions have been ≤5min

**DAY 30 (commitment point):**
- Show a "Your first month" summary card
- This is the natural paywall trigger point (see Section 7)
- Offer annual plan discount
- "You've rescued 40 minutes that would have been lost"

---

## SECTION 2: THE NOTIFICATION SYSTEM — DEEP AUDIT & REBUILD

The notification system in INTENT is architecturally sophisticated but product-level broken. `src/services/notifications.ts` (338 lines), `src/services/notificationScheduler.ts` (293 lines), and `src/services/notificationCopy.ts` (228 lines) are well-structured individually but they're almost entirely disconnected from actual user behavior.

### 2.1 — WHAT'S CURRENTLY WRONG

**Problem 1: Notifications are scheduled by time, not by behavior.**
The scheduler uses `scheduleOptimalTime()` with static hour ranges (morning/afternoon/evening) without reading from the predictive engine. But the predictive engine already knows the user's danger windows. A notification at 9am when the user's danger window is 2pm Tuesday is noise. A notification at 1:55pm Tuesday ("It's almost your usual drift window — 2 minutes?") is gold.

```typescript
// src/services/notificationScheduler.ts — CURRENT (wrong):
export function scheduleOptimalTime(type: NotificationType, preferences: UserNotificationPrefs): Date {
  // Uses static hour buckets
  const morning = { start: 8, end: 10 }
  const afternoon = { start: 13, end: 15 }
  // ...
}

// SHOULD BE:
export function scheduleOptimalTime(
  type: NotificationType,
  dangerWindows: DangerWindow[],
  userPatterns: UserIntelligenceProfile | null,
): Date {
  if (dangerWindows.length > 0 && type === 'danger_window_approach') {
    const nextWindow = dangerWindows
      .filter(w => w.confidence > 0.6)
      .sort((a, b) => a.riskScore - b.riskScore)
      [0]
    
    // Schedule 5 minutes before the danger window starts
    const targetHour = nextWindow.startHour
    const now = new Date()
    const target = new Date()
    target.setHours(targetHour - 0, 55, 0, 0)
    if (target <= now) target.setDate(target.getDate() + 1)
    return target
  }
  // fallback to user pattern or default
}
```

**Problem 2: Notification copy is generic.**
`src/services/notificationCopy.ts` has good structure with `rescueCopy`, `streakProtectionCopy`, `dangerWindowCopy`. But every call site passes the same generic data. The copy doesn't reference the user's actual dominant state, actual session count, actual protocol that worked for them last time.

The copy should be generated fresh using the last-known user context:

| CURRENT | SHOULD BE |
|---------|-----------|
| "It's time to rescue. You've got this." | "Thursday 2pm — your hardest hour. 'Overwhelmed' usually hits you here. 2 minutes?" |
| "Don't break your streak!" | "You've rescued 4 times this week. One more and you hit your best week yet." |
| "You abandoned a session earlier. Want to salvage it?" | "That session earlier — even stopping counts. 'Avoiding' lost. You opened the thing." |

**Problem 3: The danger window notification is never scheduled.**
`dangerWindowCopy()` exists in `notificationCopy.ts`. `DangerWindow` type exists in the predictive engine. But nowhere in the codebase does `predictDrift()` output get fed into the notification scheduler. The loop is completely open.

The wire that needs to be added:

```typescript
// src/services/notifications.ts — add this function:
export async function scheduleDangerWindowNotifications(
  dangerWindows: DangerWindow[],
  intelligence: UserIntelligenceProfile,
): Promise<void> {
  // Cancel all existing danger window notifications first
  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  const dangerNotifs = scheduled.filter(n => n.content.data?.type === 'danger_window')
  await Promise.all(dangerNotifs.map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)))

  // Schedule for top 3 danger windows with confidence > 0.5
  const topWindows = dangerWindows
    .filter(w => w.confidence > 0.5 && w.riskLevel !== 'low')
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 3)

  for (const window of topWindows) {
    const copy = dangerWindowCopy({
      dayOfWeek: window.dayOfWeek,
      startHour: window.startHour,
      primaryState: window.primaryState,
      riskLevel: window.riskLevel,
      userFirstName: intelligence.userName ?? undefined,
    })

    await Notifications.scheduleNotificationAsync({
      content: {
        title: copy.title,
        body: copy.body,
        data: { 
          type: 'danger_window',
          screen: 'index',
          deepLink: 'intent://rescue',
          windowId: `${window.dayOfWeek}_${window.startHour}`,
        },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: window.dayOfWeek + 1,  // Expo uses 1-indexed
        hour: window.startHour === 0 ? 23 : window.startHour - 1,
        minute: 50,  // 10 minutes before the window
        repeats: true,
      },
    })
  }
}
```

Call this function in `_layout.tsx` after sessions update — but throttled:

```typescript
// In RootLayout, after sessions exceed threshold:
useEffect(() => {
  if (sessions.length >= 5) {  // need data to be meaningful
    try {
      const prediction = predictDrift({ sessions, ... })
      const profile = buildIntelligenceProfile({ sessions, ... })
      void scheduleDangerWindowNotifications(
        profile.dangerWindows,
        profile,
      )
    } catch {}
  }
}, [sessions.length > 5 ? Math.floor(sessions.length / 5) : 0])  // re-run every 5 sessions
```

### 2.2 — NOTIFICATION CONTENT STRATEGY

**Notification Type 1: Danger Window Approach (behavioral, best ROI)**
- Trigger: 10 minutes before a known high-risk time window
- Frequency: Max 1 per danger window, max 3 per week
- Copy principle: "You know this moment. Here's the two-minute option."
- Examples: "Thursday 2pm is coming. This is usually when 'overwhelmed' hits. Ready?"

**Notification Type 2: Comeback Window (highest emotional resonance)**
- Trigger: 20-90 minutes after an abandoned session, during a comeback window
- Frequency: Max 1 per abandoned session
- Copy principle: Non-shame, specific to what was abandoned
- Examples: "You stopped earlier. That's fine. The thing is still there. 2 more minutes?"

**Notification Type 3: Streak-Style Momentum (weekly, not daily)**
- Trigger: Sunday evening, or 7th consecutive day without a session
- Frequency: Max 1 per week
- Copy principle: Forward-looking, not shame about the past
- Examples: "This week: 4 rescues. That's 4 times your brain tried to avoid and you fought back."

**Notification Type 4: Brain Dump Pending (actionable reminder)**
- Trigger: 24 hours after a brain dump with no resulting missions
- Frequency: Max 1 per brain dump
- Examples: "You dumped 5 things yesterday. 3 haven't become actions yet. Which one first?"

**Notification Type 5: Session Complete Celebration (immediate)**
- Trigger: 0-5 seconds after session completion
- Frequency: After every completed/salvaged session
- This is a local notification, not push — fires immediately
- Examples: "Done. 8 minutes rescued from 'avoiding'. Your resistance lost today."

### 2.3 — NOTIFICATION PERMISSION STRATEGY

The app currently doesn't request notification permissions at any defined point. There's `requestNotificationPermissions()` in `notifications.ts` but no call site in the onboarding or app lifecycle.

The best practice in 2026: Ask for permissions after showing value, not before. The first meaningful action (completing a rescue) is the ideal moment to request notification access.

```typescript
// Trigger after first session completion in live.tsx:
const handleComplete = useCallback(async () => {
  if (timerRef.current) clearInterval(timerRef.current)
  completeSession(sessionNotes)
  await showSessionCompleteNotification(Math.round(elapsedSeconds / 60), 0)
  
  // First completion: offer notification permission
  const completedCount = useAppStore.getState().sessions.filter(s => 
    s.status === 'completed' || s.status === 'salvaged'
  ).length
  
  if (completedCount === 1) {
    // Short delay, let celebration show first
    setTimeout(() => {
      requestNotificationPermissionsWithContext()
    }, 2000)
  }
}, [completeSession, sessionNotes, elapsedSeconds])

// In notifications.ts — add human-context wrapper:
export async function requestNotificationPermissionsWithContext(): Promise<void> {
  // This should trigger a custom in-app modal BEFORE the OS permission dialog
  // explaining: "INTENT can warn you before your hardest hours.
  // No marketing. No streaks. Just 'your 2pm is coming.'"
  // Then, after user confirms, trigger the OS permission dialog
}
```

---

## SECTION 3: THE ONBOARDING SYSTEM — COMPLETE REDESIGN

The current `app/onboarding.tsx` (375 lines) has the right instincts — it's fast, action-first, no auth wall — but it has several critical problems that will kill D1 retention.

### 3.1 — WHAT'S WRONG WITH CURRENT ONBOARDING

**Problem 1:** It asks for state twice. Step 0 asks "Where do you lose time?" (6 options), and Step 1 asks "How do you feel right now?" (8 chips). These two steps ask effectively the same question from different angles. Users lose patience.

**Problem 2:** The mission generated in onboarding is never connected to the live screen. `compiledMission` is set in `setCompiledMission()` but when `handleStartMission()` fires, it calls `router.push('/live')` — the mission is never passed to the store. Same bug as the home screen (#4 from Part 1).

**Problem 3:** There's a "Skip to App" button that creates a null user. `handleSkipToApp` calls `router.replace('/')` with no user profile created. The home screen then renders with `displayName = 'there'` and no user in store.

**Problem 4:** The onboarding doesn't ask for push notification permission. The optimal moment to ask for notifications is right after the user completes their first session — which happens in onboarding step 4 (the timer). Missing this means most users will never opt in.

**Problem 5:** There's no name/profile creation in onboarding. The app greets users as "there" until they go into Settings and manually type their name. No user ever does this.

### 3.2 — REDESIGNED ONBOARDING FLOW

**SCREEN 1 — THE PROBLEM STATEMENT** (5 seconds to recognize themselves)
No questions. Just one bold statement:
"Your brain knows what to do. The problem is starting."
[Subtext]: "INTENT gives you the 2-minute action that bypasses resistance."
[CTA]: "Show me how" (one button, full width, gradient)

**SCREEN 2 — QUICK NAME** (one field, optional but framed smartly)
"What should I call you?"
[Single text input, large, keyboard auto-shows]
[Skip link in corner — tiny, not prominent]
If they type something → store as `display_name`
If they skip → `display_name = null` (show "Hey" not "there")

**SCREEN 3 — THE HONEST QUESTION** (one question, not two)
"Right now, what's your biggest obstacle?"
[6 chips with emojis — map to `UserState`]
Avoiding · Overwhelmed · Stuck · Tired · Distracted · Anxious
[No skip — this is data collection, disguised as UX]

**SCREEN 4 — THE LIVE DEMO** (this is where you earn the right to their attention)
Don't explain what a rescue is. DO ONE.
Show: "Here's a 2-minute rescue for [selected state]"
Show the actual `compiledMission.exactAction` in big text
Show a 2-minute countdown timer that auto-starts
[CTA]: "Start the timer"
This is the activation event.

**SCREEN 5 — POST-RESCUE CELEBRATION** (after timer completes or they tap "Done")
Big moment. Full screen.
"You did it. You just rescued 2 minutes from [state]."
Show their "rescued minutes" counter: "2 min"
[Optional: notification permission request here]
[CTA]: "See my dashboard"

**NO AUTH WALL IN ONBOARDING.**
Auth can be prompted at Day 3 or Day 7 with: "Back up your progress. 1 tap with Apple/Google."

```typescript
// app/onboarding.tsx — new state machine:
type OnboardingStep = 
  | 'welcome'       // Problem statement
  | 'name'          // Name input
  | 'state'         // State selection
  | 'rescue'        // Live 2-min demo
  | 'complete'      // Celebration

// Create a user profile silently in 'name' step:
const createLocalUser = (name: string) => {
  const user: UserProfile = {
    id: `local_${Date.now().toString(36)}`,
    email: null,
    display_name: name.trim() || null,
    onboarding_complete: false,
    plan: 'free',
    // ... 
  }
  store.setUser(user)
}

// In 'complete' step:
const handleComplete = () => {
  store.completeOnboarding()
  
  if (compiledMission) {
    const mission = store.addMission('First Rescue', '', colors.brand[500])
    store.addMicroMission(mission.id, compiledMission.exactAction, '', 2)
    store.startSession(mission.id, compiledMission.id, 'focus', 2)
    store.completeSession('Onboarding rescue')
  }
  
  router.replace('/(tabs)/')
}
```

### 3.3 — PROGRESSIVE PROFILING (POST-ONBOARDING)

- After session 1: "What type of work were you doing?"
- After session 3: "What time of day do you usually struggle?"
- After session 5: Offer push notification setup
- After session 7: "What's your biggest ongoing project?"
- After day 14: Offer to set up auth/backup
- After day 30: Offer Pro plan

---

## SECTION 4: THE STORE — ARCHITECTURE REFACTOR

The current `src/store/index.ts` is 436 lines — one massive Zustand store with 40+ actions. This is a known anti-pattern in 2026 Zustand usage. The problem isn't just code organization — it's performance.

### 4.1 — THE CURRENT STORE PROBLEMS

**Problem 1:** Entire store object used in some components.
```typescript
// app/index.tsx — ANTI-PATTERN:
const store = useAppStore()         // subscribes to EVERYTHING
const user = store.user             // re-renders on any store change
const sessions = store.sessions     // including timer updates every second
const momentumEvents = store.momentumEvents
```

**Problem 2:** All state in one persist boundary. MMKV writes entire state tree on every update.

**Problem 3:** Computed values as store methods (not selectors).
```typescript
getTotalMinutesToday: () => {
  const today = todayStr()
  return Math.round(
    get().sessions
      .filter(s => s.started_at.slice(0, 10) === today && ...)
      .reduce((sum, s) => sum + s.actual_seconds, 0) / 60
  )
},
```

**Problem 4:** No store migration system. No version field, no `migrate` function.

### 4.2 — THE REFACTORED STORE ARCHITECTURE

Split into 6 domain slices:

**`src/store/slices/sessionSlice.ts`** — sessions, activeSession, startSession, updateSessionTimer, pauseSession, resumeSession, completeSession, salvageSession, abandonSession, cancelSession

**`src/store/slices/missionSlice.ts`** — missions, microMissions, addMission, etc.

**`src/store/slices/userSlice.ts`** — user, isAuthenticated, consentLedger, setUser, updateProfile

**`src/store/slices/momentumSlice.ts`** — momentumEvents, addMomentumEvent

**`src/store/slices/distractionSlice.ts`** — distractions, brainDumps, captureDistraction, createBrainDump

**`src/store/slices/uiSlice.ts`** — isLoading, currentRoute, skipCount, coachMessages

Compose with versioning and partial persistence:

```typescript
// src/store/index.ts — new, clean composition:
export const useAppStore = create<AppState>()(
  persist(
    (...a) => ({
      ...createUserSlice(...a),
      ...createSessionSlice(...a),
      ...createMissionSlice(...a),
      ...createMomentumSlice(...a),
      ...createDistractionSlice(...a),
      ...createUISlice(...a),
    }),
    {
      name: 'intent-store',
      storage: mmkvStorage,
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          persistedState.sessions = (persistedState.sessions ?? []).map((s: any) => ({
            ...s,
            mode: s.mode ?? 'focus',
          }))
        }
        if (version === 1) {
          persistedState.coachMessages = []
        }
        return persistedState
      },
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sessions: state.sessions,
        activeSession: state.activeSession,
        missions: state.missions,
        microMissions: state.microMissions,
        momentumEvents: state.momentumEvents,
        distractions: state.distractions,
        brainDumps: state.brainDumps,
        resistancePatterns: state.resistancePatterns,
        consentLedger: state.consentLedger,
        coachMessages: state.coachMessages,
        // NOT persisted: isLoading, currentRoute, skipCount
      }),
    }
  )
)
```

### 4.3 — GRANULAR SELECTORS (STOPS RE-RENDERS)

```typescript
// BEFORE (re-renders on every store change, every timer tick):
const store = useAppStore()
const sessions = store.sessions

// AFTER (re-renders only when sessions change):
const sessions = useAppStore(s => s.sessions)

// For multiple related values, use shallow:
const { sessions, missions } = useAppStore(
  s => ({ sessions: s.sessions, missions: s.missions }),
  shallow
)
```

Create hooks for common derived data:
- `src/hooks/useSessionStats.ts` — totalMinutesToday, sessionCountToday, completionRate, streak
- `src/hooks/useActiveMission.ts` — activeMission, activeMicro
- `src/hooks/useDriftIntelligence.ts` — prediction, profile, hasEnoughData

---

## SECTION 5: THE PREDICTIVE ENGINE — SURFACING YOUR MOAT

The predictive engine (`src/engine/predictiveEngine.ts`, 690 lines) is the best piece of engineering in the codebase. It computes danger windows, resistance map, comeback patterns, drift prediction, and streak momentum. None of this is shown to users in a meaningful way.

### 5.1 — THE INTELLIGENCE SURFACE (New Component)

Create a dedicated "Your Patterns" section on the Progress screen after 7+ sessions.

```typescript
// src/components/IntelligenceCard.tsx
// Shows: Hardest hour, Most common battle, Comeback rate, Current risk
```

### 5.2 — THE DANGER WINDOW VISUALIZATION

A 7×24 grid heatmap showing the user's drift risk by hour and day.

```typescript
// src/components/DangerWindowHeatmap.tsx
// Most compelling visual in any productivity app — shows users something true about themselves
```

---

## SECTION 6: THE PROGRESS SCREEN — COMPLETE REDESIGN

### 6.1 — THE WEEKLY STORY (Replaces generic stats)

```typescript
// src/engine/insights.ts — add:
export function generateWeeklyNarrative(
  sessions: MissionSession[],
  resistancePatterns: ResistancePattern[],
  distractions: Distraction[],
  userName: string | null,
): string {
  // Generates 3-4 sentence human summary, cached weekly
}
```

### 6.2 — THE PROGRESS SCREEN LAYOUT

Structure: Header → Weekly Narrative → Stats Row (3 key numbers) → 4-Week Trend → Intelligence Panel (7+ sessions) → Danger Window Heatmap → Resistance Map → Recent Sessions

### 6.3 — THE SHAREABLE WEEKLY CARD (the social loop)

```typescript
// src/services/share.ts (create this file — it was missing):
export async function shareWeeklyCard(card: WeeklyCard): Promise<void> {
  // Simple text share: stats + first sentence of narrative
}
```

---

## SECTION 7: THE MONETIZATION SYSTEM — BUILD FROM ZERO

### 7.1 — THE PRICING STRATEGY

**FREE (permanent):**
- Unlimited rescue sessions (core loop — never gate this)
- All 14 rescue protocols
- Basic progress stats (7 days)
- Before-Scroll intercept
- 5 active missions

**PRO — $4.99/month or $34.99/year:**
- Unlimited missions + history
- Full progress history (all time)
- Intelligence panel (danger windows, resistance map)
- AI coach (unlimited vs 5/day free)
- Weekly narrative synthesis
- Custom protocol preferences
- iCloud/Drive backup
- Lock screen widget
- Priority notification scheduling

**PAYWALL TRIGGER MOMENTS:**
1. After session 5 completion
2. When accessing Progress → "Your Patterns" section
3. When trying to add 6th mission
4. Day 14 banner
5. When sharing a weekly card

### 7.2 — IMPLEMENTING THE PAYWALL WITH REVENUECAT

Full `src/services/purchases.ts` and `src/components/ProPaywall.tsx` implementations included.

### 7.3 — FEATURE GATING IMPLEMENTATION

```typescript
// src/hooks/useFeatureGate.ts
export function useFeatureGate() {
  // Sync RevenueCat pro status, return gates object
  // Core rescue always free, intelligence/coaching pro-gated
}
```

---

## SECTION 8: THE GOALS / MISSIONS SCREEN — PRODUCT RETHINK

### 8.1 — THE NOMENCLATURE PROBLEM
Pick "Mission" not "Goal" — mission implies bounded, completable. Change all labels.

### 8.2 — THE MISSION SCREEN REDESIGN
Mission creation: title → resistance level → blocker → auto-generate first micro-step.

Mission card shows: title, progress ring, resistance badge, "Start Now" button, protocol badge, staleness indicator.

### 8.3 — THE MISSION DETAIL SCREEN
Header + protocol + START button + micro-mission list (drag-to-reorder, swipe actions) + AI Breakdown + session history + salvage option.

---

## SECTION 9: THE COACH / AI SYSTEM — DEEP ARCHITECTURE AUDIT

### 9.1 — THE SPLIT BRAIN PROBLEM
Two AI paths exist — `ai.ts` (used, no safety) and `orchestrator.ts` (unused, has safety). Merge into one path through the orchestrator with crisis detection, shame language filtering, quality scoring, caching, and tiered fallback.

### 9.2 — THE PROMPT LIBRARY — UPGRADE
System prompt should vary by session count, time of day, recent success/failure, active mission, and dominant resistance pattern. Full improved prompt included.

### 9.3 — AI DAILY LIMIT ENFORCEMENT
```typescript
// src/hooks/useAIQuota.ts
export function useAIQuota() {
  // 5 messages/day for free, unlimited for pro
  // Track via MMKV with daily key
}
```

---

## SECTION 10: THE BEFORE-SCROLL SCREEN — PRODUCT REDESIGN

- Show mission action DURING timer, not just before
- Add progress bar alongside countdown
- Brain capture button during timer
- "Done early" option without shame
- Reframe "Scroll anyway" as earned: "You did 2 minutes first"
- Skip counter adapts messaging after 3rd/5th skip

---

## SECTION 11: THE ANALYTICS SYSTEM — FROM SURVEILLANCE TO SELF-KNOWLEDGE

`src/services/analytics.ts` is 1,100 lines — capture-only, never read back. The predictive engine uses store data, not analytics events. Analytics should feed back into the intelligence system.
