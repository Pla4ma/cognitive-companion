# INTENT APP — PART 2B: EVERYTHING MISSING FROM A 10/10

## Deep Analysis — June 2026 Edition
## Covers: Product Gaps, UX Architecture, Competitive Analysis, Industry Research, Systems Not Yet Built

*This document covers what BLUEPRINT-PART2-SYSTEMS.md does NOT. Read that first.*

---

## TABLE OF CONTENTS

1. Why This App Is Not A 10/10 — The Honest Diagnosis
2. The Home Screen — First Impression Architecture
3. Micro-Interactions & Haptics — The Feel Layer
4. Motion Design & Animation System
5. The "Soul" Layer — What Makes People Tell Friends
6. Competitive Landscape Analysis (May 2026)
7. Error States, Empty States, Edge Cases
8. Accessibility & Inclusive Design
9. Offline-First & Data Architecture
10. Performance Budget & Optimization
11. The Widget System — Lock Screen Intelligence
12. App Store Presence & ASO
13. Privacy Architecture Deep Dive
14. The "Before You Open The App" Surface
15. Testing Strategy & Quality Gates
16. Analytics Feedback Loop (Real Implementation)
17. The Emotional Design System
18. Feature Interaction Map — Emergent Experiences
19. The Launch Strategy
20. What A 10/10 Actually Means — Industry Benchmarks

---

## SECTION 1: WHY THIS APP IS NOT A 10/10 — THE HONEST DIAGNOSIS

### The Core Problem: Everything Is Built, Nothing Is Felt

INTENT has remarkable engineering. The predictive engine (700 lines) computes danger windows, resistance maps, drift velocity, decay-weighted patterns, weekend/weekday separation, and streak momentum. The mission compiler (520 lines) generates state-aware, blocker-aware, energy-aware micro-missions with quality scoring, shame language rejection, and fallback chains. The retention engine (1055 lines) tracks 7 retention loops, activation data, momentum windows, comeback detection, and social proof. The agent architecture (716 lines) has multi-signal drift detection with calibrated weights, consecutive-state escalation, and action generation for 15+ avoidance states.

**None of this is visible to the user in a meaningful way.**

The user sees:
- A dark screen with some cards
- A timer that counts down
- A coach chat that sends messages
- Some numbers on a progress screen

The gap between what the app KNOWS and what the user FEELS is the single largest problem. This is the difference between a 6/10 and a 10/10.

### The 10 Problems That Keep INTENT From Being 10/10

**Problem 1: The Home Screen Has No Hook**
The dashboard shows a greeting, some stats, and a "Start Rescue" button. There's no reason to open the app other than when you're already in crisis. Finch gets you to open the app to check on your bird. Duolingo gets you to open the app to maintain your streak. INTENT gets you to open the app... when you're procrastinating. But if you're procrastinating, you're probably doomscrolling, not opening a productivity app. The home screen needs a PULL, not just a PUSH.

**Problem 2: The Timer Is Just A Timer**
The focus session timer (live.tsx, 884 lines) is a countdown with pause/resume/complete buttons. It has body double presence indicators and checkpoint prompts, but it doesn't feel like someone is WITH you. The "body double" concept is just an animated dot with text. There's no ambient presence, no breathing rhythm, no sense of shared space. Compare this to Forest (where a tree grows) or Finch (where your bird goes on an adventure). The timer needs to feel ALIVE.

**Problem 3: Progress Is Numbers, Not Stories**
The progress screen shows weekly rescued minutes, completion rates, and a 4-week trend chart. These are NUMBERS. Humans don't bond with numbers. They bond with narratives. "You rescued 47 minutes this week" means nothing emotionally. "This week you fought 'overwhelmed' 4 times and won 3. Thursday at 2pm was your hardest moment — but you showed up anyway" is a STORY. The weekly narrative exists in code but isn't surfaced prominently enough.

**Problem 4: The AI Coach Is Generic**
The AI coach (ai.ts, 349 lines) has a well-structured system prompt with progress tiers and push style adaptation. But in practice, it's a chat interface where you type messages and get responses. It doesn't INITIATE. It doesn't KNOW when you're struggling. It doesn't appear at the right moment. The orchestrator architecture exists (agent.ts, agent.ts) but it's never actually triggered from the UI based on real drift detection. The coach is reactive, not proactive.

**Problem 5: No Reward Loop That Feels Personal**
The momentum system exists (addMomentumEvent) but it's just a point counter. There's no visual representation of growth, no "level up" moment, no unlockable content, no personal artifact that accumulates. Finch has a growing bird. Forest has a growing forest. Duolingo has a streak with a bird that gets sad. INTENT has... a number. The emotional investment loop is missing.

**Problem 6: The Before-Scroll Screen Is Disconnected**
The before-scroll intercept (before-scroll.tsx, 613 lines) is a separate screen that requires the user to navigate to it. But the whole point of an anti-scrolling tool is that it INTERCEPTS you, not that you have to seek it out. Without system-level integration (Screen Time API, app blocker, or at minimum a widget shortcut), this feature is opt-in for people who would never opt in because they're too busy scrolling.

**Problem 7: The Missions Screen Feels Like Work**
The missions/goals section requires the user to create missions, manage micro-missions, track progress, and update status. This is project management. People who are procrastinating don't want to do project management. The mission system should be invisible — created automatically from brain dumps, AI conversations, and pattern detection, not manually by the user.

**Problem 8: The Trust Center Is Bare**
The trust center (trust.tsx, 117 lines) has 4 permission toggles and a "Privacy First" pledge. In 2026, with increasing awareness of data practices, this needs to be a SHOWCASE. "Here's exactly what data we have about you. Here's every prediction we've made. Here's every time we intervened. Delete any of it with one tap." The trust center should be a feature, not a compliance checkbox.

**Problem 9: No Ambient Intelligence Surface**
The predictive engine computes danger windows, drift predictions, and resistance maps. The notification system can schedule targeted alerts. But there's no WIDGET, no LIVE ACTIVITY, no LOCK SCREEN surface that shows this intelligence. The most valuable data in the app is locked behind opening the app and navigating to the progress screen. This data should be visible without opening the app.

**Problem 10: The App Doesn't Learn Fast Enough**
The predictive engine needs 5+ sessions to generate meaningful predictions. The danger window detection needs 3+ samples per time slot. The resistance map needs 3+ patterns. But Day 1-3 users have NO data, and they're the ones most likely to churn. The app needs to use population-level priors (what's typical for someone in their demographic/timezone/state) until personal data accumulates, then gracefully transition to personal predictions.

---

## SECTION 2: THE HOME SCREEN — FIRST IMPRESSION ARCHITECTURE

### The Problem: Why Open This App?

Current home screen flow:
1. Greeting ("Hey [name]" or "Hey there")
2. Stats row (rescued minutes, streak, momentum)
3. Active mission card
4. Recent sessions
5. Start Rescue button

This is a DASHBOARD. Dashboards are for people who are already engaged. The home screen of a 10/10 app is a HOOK — it gives you a reason to open the app even when you don't need to be rescued.

### The Redesigned Home Screen

**Layer 1: The Ambient Status (always visible, top of screen)**
```
┌─────────────────────────────────────┐
│  Good afternoon, Alex               │
│  ● You're in a low-risk window      │
│  Next danger: Thursday 2pm          │
└─────────────────────────────────────┘
```
This uses the predictive engine's `predictDrift()` output. When risk is low, it's calming ("You're doing fine"). When risk is rising, it's alerting ("Your usual drift time is coming"). This creates a reason to check the app — to see your status.

**Layer 2: The Personal Insight (changes daily, below status)**
```
┌─────────────────────────────────────┐
│  💡 Your pattern: You complete 80%  │
│  of sessions started before noon.   │
│  It's 10:30am. Good timing.         │
└─────────────────────────────────────┘
```
This uses `getAnalyticsInsight()` from the predictive engine. One insight per day, cached, changes based on data. This is the "what did I learn about myself today" hook.

**Layer 3: The Momentum Ring (visual, not numeric)**
```
┌─────────────────────────────────────┐
│         ╭───────────╮               │
│        ╱  7 rescues  ╲              │
│       │   this week    │            │
│        ╲  ↑ building  ╱             │
│         ╰───────────╯               │
└─────────────────────────────────────┘
```
Replace the numeric stats row with a single visual ring that shows momentum (7-day rolling count) with a trend indicator. One number, one direction. Not three numbers.

**Layer 4: The Quick Action (contextual, not static)**
Instead of a permanent "Start Rescue" button, show contextual actions based on current state:
- If danger window approaching: "Pre-rescue: 2 minutes before your hard hour"
- If brain dumps pending: "3 thoughts from yesterday. Pick one?"
- If no session today: "Your first rescue today. 2 minutes?"
- If session completed today: "You did it. Rest or continue?"
- If comeback detected: "Welcome back. One tiny thing?"

**Layer 5: The Story Card (weekly, shareable)**
A card that appears every Sunday with the weekly narrative. Tappable to expand, shareable as image. This is the "screenshot and share" moment.

### Implementation

```typescript
// src/hooks/useHomeScreenState.ts
export function useHomeScreenState() {
  const sessions = useAppStore(s => s.sessions)
  const brainDumps = useAppStore(s => s.brainDumps)
  const retentionState = useAppStore(s => s.retentionState)
  const user = useAppStore(s => s.user)
  
  const prediction = useMemo(() => {
    if (sessions.length < 3) return null
    return predictDrift({ sessions, patterns: [], momentumEvents: [], missions: [] })
  }, [sessions])
  
  const insight = useMemo(() => {
    if (sessions.length < 5) return null
    return getAnalyticsInsight(buildSessionAnalytics(sessions))
  }, [sessions])
  
  const quickAction = useMemo(() => {
    const now = new Date()
    const hour = now.getHours()
    const todaySessions = sessions.filter(s => s.started_at.startsWith(now.toISOString().slice(0, 10)))
    const completedToday = todaySessions.filter(s => s.status === 'completed' || s.status === 'salvaged')
    const pendingDumps = brainDumps.filter(d => !d.converted_to_mission)
    
    // Comeback detection
    const comeback = detectComeback(sessions, retentionState.lastRescueDate)
    if (comeback.isComeback) return { type: 'comeback', message: comeback.message }
    
    // Brain dump pending
    if (pendingDumps.length > 0) return { type: 'brain_dump', count: pendingDumps.length }
    
    // Danger window approaching
    if (prediction?.nextDangerWindow && prediction.timeToNextDanger < 60) {
      return { type: 'danger_approaching', minutes: prediction.timeToNextDanger }
    }
    
    // No session today
    if (completedToday.length === 0) return { type: 'first_today' }
    
    // Session completed
    return { type: 'done_today', count: completedToday.length }
  }, [sessions, brainDumps, retentionState, prediction])
  
  return { prediction, insight, quickAction, userName: user?.display_name ?? null }
}
```

---

## SECTION 3: MICRO-INTERACTIONS & HAPTICS — THE FEEL LAYER

### The Problem: The App Doesn't Feel Physical

Every action in INTENT is instantaneous and flat. Tap a button → screen changes. No weight, no texture, no feedback. In 2026, the best apps (Finch, Linear, Arc) have micro-interactions that make digital actions feel physical.

### The Haptic Language

INTENT needs a consistent haptic vocabulary:

```typescript
// src/services/haptics.ts
import * as Haptics from 'expo-haptics'

export const HapticPatterns = {
  // Light taps — navigation, selection
  tap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  
  // Medium impact — button press, confirmation
  confirm: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  
  // Heavy impact — session start, major action
  action: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  
  // Success pattern — session complete, milestone reached
  success: async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  },
  
  // Warning pattern — drift detected, checkpoint
  warning: async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
  },
  
  // Error pattern — session abandoned (gentle, not punishing)
  gentle: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await new Promise(r => setTimeout(r, 100))
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  },
  
  // Triple pulse — milestone celebration
  celebration: async () => {
    for (let i = 0; i < 3; i++) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      await new Promise(r => setTimeout(r, 150))
    }
  },
  
  // Breathing rhythm — body double presence (called every 4s)
  breathe: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  },
  
  // Countdown tick — last 10 seconds of timer
  tick: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  },
  
  // Rescue pulse — when drift is detected and intervention fires
  rescue: async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    await new Promise(r => setTimeout(r, 300))
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  },
} as const
```

### Where Haptics Fire

| Moment | Pattern | Rationale |
|--------|---------|-----------|
| Session start | `action` | Heavy — "this matters" |
| Timer tick (last 10s) | `tick` | Light pulse — urgency building |
| Checkpoint appears | `warning` | "Are you still here?" |
| Checkpoint response | `confirm` | "Got it" |
| Milestone reached (25%, 50%, 75%) | `celebration` | Triple pulse — progress |
| Session complete | `success` | "You did it" |
| Session salvaged | `gentle` | Soft double — "still counts" |
| Session abandoned | `gentle` | Same as salvage — no shame |
| Drift detected (ambient) | `rescue` | Double pulse — attention |
| Brain dump saved | `confirm` | "Captured" |
| State chip selected | `tap` | Light feedback |
| Navigation | `tap` | Minimal feedback |

### Reduce Motion Support

```typescript
// src/utils/accessibility.ts
import { AccessibilityInfo } from 'react-native'

let _reduceMotionEnabled = false

export async function initReduceMotion() {
  _reduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled()
  AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
    _reduceMotionEnabled = enabled
  })
}

export function shouldAnimate(): boolean {
  return !_reduceMotionEnabled
}

export function getAnimationDuration(normal: number): number {
  return _reduceMotionEnabled ? 0 : normal
}
```

---

## SECTION 4: MOTION DESIGN & ANIMATION SYSTEM

### The Problem: Animations Are Ad-Hoc

The current codebase has animations scattered across files — `Animated.Value` in focus.tsx, `useSharedValue` in onboarding.tsx, spring configs inline. There's no animation language.

### The Animation Design System

```typescript
// src/theme/animations.ts
import { Easing } from 'react-native-reanimated'

export const motion = {
  // Duration tokens
  duration: {
    instant: 100,   // Micro-interactions (haptic feedback)
    fast: 200,      // Button press, chip selection
    normal: 300,    // Screen transitions, card reveals
    slow: 500,      // Celebration, completion
    breathe: 4000,  // Body double breathing
  },
  
  // Easing tokens
  easing: {
    // Standard: most transitions
    standard: Easing.bezier(0.4, 0, 0.2, 1),
    // Decelerate: entering elements
    decelerate: Easing.bezier(0, 0, 0.2, 1),
    // Accelerate: exiting elements
    accelerate: Easing.bezier(0.4, 0, 1, 1),
    // Spring: playful, bouncy
    spring: Easing.bezier(0.175, 0.885, 0.32, 1.275),
  },
  
  // Spring configs (for react-native-reanimated)
  spring: {
    gentle: { damping: 20, stiffness: 90, mass: 1 },
    bouncy: { damping: 12, stiffness: 180, mass: 0.8 },
    stiff: { damping: 30, stiffness: 300, mass: 0.5 },
    slow: { damping: 25, stiffness: 60, mass: 1.2 },
  },
  
  // Scale tokens for press feedback
  scale: {
    press: 0.97,     // Button press
    cardPress: 0.98, // Card press
    chipPress: 0.95, // Chip selection
  },
} as const
```

### Key Animation Patterns

**Pattern 1: The Rescue Start Sequence**
When the user taps "Start Rescue," the screen should transition with weight:
1. Button scales down (0.97, 100ms)
2. Background darkens slightly (200ms)
3. Mission card slides up from bottom (300ms, decelerate easing)
4. Timer fades in (200ms, after card settles)
5. Haptic: `action`

**Pattern 2: The Session Complete Celebration**
When a session completes:
1. Timer ring fills to 100% (300ms, spring easing)
2. Haptic: `success`
3. Emoji scales up from 0 with bounce (500ms, bouncy spring)
4. Stats row slides in from left, staggered 100ms each
5. Message fades in (300ms, after stats)
6. Button slides up from bottom (300ms, decelerate)

**Pattern 3: The Drift Detection Alert**
When drift is detected:
1. Subtle pulse on the presence indicator (breathe animation intensifies)
2. Haptic: `rescue`
3. Checkpoint card slides down from top (250ms, decelerate)
4. Background slightly dims (200ms)

**Pattern 4: The Weekly Narrative Reveal**
When the weekly story appears:
1. Card scales from 0.95 to 1 (300ms, gentle spring)
2. Text fades in line by line (staggered 150ms per line)
3. Share button fades in last (200ms, after text)

---

## SECTION 5: THE "SOUL" LAYER — WHAT MAKES PEOPLE TELL FRIENDS

### The Problem: INTENT Is Functional, Not Lovable

People don't tell their friends about apps that work. They tell them about apps that made them FEEL something. Finch makes you feel responsible for a cute bird. Duolingo makes you feel guilty about a green owl. Forest makes you feel like you're growing something.

INTENT's "soul" is the insight: "This app knows something true about me that I didn't know about myself." That's the moment people screenshot and share.

### The Moments That Create "Soul"

**Moment 1: The First True Insight**
After 5+ sessions, the app surfaces: "You complete 80% of sessions started before noon. Your afternoons are a war zone." This is the "this app GETS me" moment. It must be:
- Visually distinct (a special card, not inline text)
- Surprising (the user didn't know this about themselves)
- Actionable (suggests when to schedule focus time)
- Shareable (one-tap share)

**Moment 2: The Pattern Name**
After 7+ sessions, the app names your pattern: "You're a Classic Avoider. You know what to do. You just can't start. 73% of your sessions begin with 'avoiding.' But your completion rate is 85% once you start." This is identity creation. The user now has a label for their struggle.

**Moment 3: The Comeback Recognition**
When a user returns after 3+ days: "11 days. That's not failure — that's being human. The fact that you opened this app again is the whole point. One tiny thing?" This must feel personal, not templated.

**Moment 4: The Milestone That Matters**
Not "10 rescues!" but "You've rescued 2.5 hours that would have been lost to drift. That's a movie. That's a workout. That's a conversation you needed to have." Convert minutes into relatable human experiences.

**Moment 5: The Weekly Card**
Every Sunday: a shareable card with 3 sentences about the week. This is the "screenshot and post on Instagram stories" moment. Design it to be beautiful enough to share.

### Implementation: The Insight System

```typescript
// src/engine/insights.ts — add these:

export function generatePatternName(
  sessions: MissionSession[],
  patterns: ResistancePattern[],
): { name: string; description: string; icon: string } | null {
  if (sessions.length < 7) return null
  
  const stateCounts: Record<string, number> = {}
  for (const s of sessions) {
    stateCounts[s.mode] = (stateCounts[s.mode] ?? 0) + 1
  }
  const dominant = Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0]
  if (!dominant) return null
  
  const ratio = dominant[1] / sessions.length
  const names: Record<string, { name: string; desc: string; icon: string }> = {
    avoiding: { name: 'The Classic Avoider', desc: "You know what to do. You just can't start. But once you do, you finish.", icon: '🙈' },
    overwhelmed: { name: 'The Overwhelmed Achiever', desc: "You take on too much. Your brain freezes. But you always find a way through.", icon: '🌊' },
    stuck: { name: 'The Analytical Stuck', desc: "You think before you act. Sometimes too much. Your breakthrough is always one small step.", icon: '🫠' },
    tired: { name: 'The Persistent Tired', desc: "You show up even when exhausted. Your willpower is your superpower and your weakness.", icon: '😴' },
    anxious: { name: 'The Anxious Starter', desc: "Fear drives your avoidance. But you've proven you can push through it.", icon: '😰' },
    perfectionism: { name: 'The Perfectionist Paradox', desc: "Your standards are your strength and your prison. Ugly first drafts are your medicine.", icon: '✨' },
  }
  
  if (ratio > 0.4) {
    const info = names[dominant[0]] ?? names.avoiding
    return { name: info.name, description: info.desc, icon: info.icon }
  }
  
  return { name: 'The Multifighter', description: 'You face different battles every day. Adaptability is your strength.', icon: '⚡' }
}

export function minutesToHumanExperience(minutes: number): string {
  if (minutes < 5) return "a quick breath"
  if (minutes < 15) return "a short walk"
  if (minutes < 30) return "a coffee break"
  if (minutes < 60) return "an episode of your favorite show"
  if (minutes < 120) return "a movie"
  if (minutes < 300) return "a good night's sleep"
  const hours = Math.round(minutes / 60)
  return `${hours} hours — that's a full workday`
}
```

---

## SECTION 6: COMPETITIVE LANDSCAPE ANALYSIS (MAY 2026)

### Direct Competitors

**Finch (Self-Care Pet)**
- *What they do right:* Emotional investment through virtual pet. The bird grows, goes on adventures, needs care. You open the app to check on your bird, not to "be productive."
- *What INTENT can learn:* The PULL mechanic. INTENT needs something that makes you open the app when you're NOT in crisis. A growing "resistance meter" that decays if you don't use the app? A visualization of your "rescued time" that accumulates?
- *What they do wrong:* No actual productivity tools. It's gamification without substance. INTENT has the substance — it needs the gamification.

**One Sec (Screen Time Intervention)**
- *What they do right:* System-level integration. One Sec intercepts you BEFORE you open distracting apps. It forces a breathing pause. This is the "before you scroll" concept but implemented at the OS level.
- *What INTENT can learn:* The intercept must happen at the system level, not inside the app. INTENT's before-scroll screen is useless if the user has to navigate to it. Widget + Shortcuts integration is the minimum viable intercept.
- *What they do wrong:* It's a speed bump, not a solution. It delays scrolling but doesn't offer an alternative. INTENT IS the alternative.

**ClearSpace (Screen Time + Replacement)**
- *What they do right:* Replaces the dopamine hit of social media with a micro-activity. Shows you what you COULD do instead of scrolling.
- *What INTENT can learn:* The "replacement" mechanic. When showing the before-scroll screen, suggest a specific 2-minute mission that's more appealing than scrolling.

**Forest (Focus Timer)**
- *What they do right:* Visual growth during focus. A tree grows while you focus. If you leave, the tree dies. Simple, visual, emotional.
- *What INTENT can learn:* The active session needs a VISUAL metaphor that grows/changes during the timer. Not just a countdown.

**Opal (Screen Time Control)**
- *What they do right:* Premium design, privacy-first (on-device), app blocking at system level.
- *What INTENT can learn:* Design polish. Opal's UI feels premium. INTENT's UI feels functional.

### Indirect Competitors

**Tiimo (Visual Daily Planner)**
- Visual timeline with icons and colors. Turns schedule into something you can SEE. INTENT could adopt visual timeline concepts for showing "when you're most vulnerable."

**Shimmer ADHD Coaching**
- Real ADHD coaching with AI assistance. INTENT is doing this with the AI coach but without the human element. The AI coach should feel more human.

**Focus Bear**
- Habit tracking + focus sessions. Similar to INTENT but more habit-focused. INTENT's advantage is the emotional/psychological depth.

### What INTENT Does That NO ONE Else Does

1. **State-aware mission generation** — No other app asks "how are you feeling?" and generates a specific micro-mission based on the answer. This is unique IP.
2. **On-device predictive intelligence** — The danger window system, resistance map, and drift prediction run entirely on-device. No other app does this.
3. **Salvage-first philosophy** — No other app treats "stopping early" as a feature rather than a failure. This is a positioning advantage.
4. **Shame-free language system** — The mission compiler's shame language rejection is unique. No other app actively filters out shame-inducing language.
5. **Body double concept** — The "someone is here with you" concept during focus sessions is unique to INTENT (though it needs better execution).

---

## SECTION 7: ERROR STATES, EMPTY STATES, EDGE CASES

### The Problem: No Error Handling

The current codebase has ZERO error boundaries for critical flows. If the AI API fails, the user sees nothing. If the store corrupts, the app crashes. If the notification permission is denied, nothing happens.

### Empty States That Need Design

**No Sessions Yet (Day 0)**
```
Current: Blank progress screen
Should be: "Your story starts with one rescue. [Start Your First Rescue]"
```

**No Missions Yet**
```
Current: Empty mission list
Should be: "Every big thing starts with a tiny step. [Create Your First Mission]"
With suggested missions based on their state selection.
```

**No Brain Dumps Yet**
```
Current: Empty list
Should be: "When something's pulling you away, dump it here. It takes 10 seconds."
With a prominent "Capture a thought" button.
```

**AI API Failure**
```
Current: Silent failure
Should be: "Coach is offline. But you're not. [Start a 2-minute rescue anyway]"
With the compiled mission from the mission compiler (no AI needed).
```

**Store Corruption**
```typescript
// src/store/recovery.ts
export function attemptStoreRecovery(): boolean {
  try {
    const raw = mmkvStorage.getString('intent-storage')
    if (!raw) return false
    const parsed = JSON.parse(raw)
    // Validate critical fields
    if (!parsed.state || typeof parsed.state !== 'object') return false
    // Attempt migration
    const migrated = migrateStore(parsed.state, parsed.version ?? 0)
    return true
  } catch {
    // Wipe and start fresh
    mmkvStorage.clearAll()
    return false
  }
}
```

**Notification Permission Denied**
```
Current: Nothing happens
Should be: "Notifications are off. You can still use INTENT, but you'll miss danger window alerts. [Open Settings]"
```

**No Internet (AI Coach)**
```
Current: API call fails silently
Should be: "Offline mode. Here's a pre-compiled mission instead."
Fallback to missionCompiler output without AI enhancement.
```

### Edge Cases

**User opens app during danger window but has no sessions:**
→ Use population priors. "Most people struggle at this time. Want to try a 2-minute rescue?"

**User has 100+ sessions but no patterns detected:**
→ "You've been using INTENT for a while but your patterns are too varied to predict. That's actually a strength — you're adaptable."

**User completes a session in under 30 seconds:**
→ "That was fast. Did you actually do the action? [Yes, I did] [I skipped through]" — This catches gaming the system.

**User has been on free plan for 60+ days with high engagement:**
→ Soft paywall: "You've rescued X hours with INTENT. Unlock the full picture with Pro."

---

## SECTION 8: ACCESSIBILITY & INCLUSIVE DESIGN

### The Problem: Zero Accessibility Implementation

The current codebase has no `accessibilityLabel`, no `accessibilityHint`, no `accessibilityRole`, no screen reader support, no dynamic type support, no color contrast verification beyond basic WCAG notes in comments.

### Required Accessibility Implementation

**1. Screen Reader Support**
```typescript
// Every interactive element needs:
<TouchableOpacity
  accessibilityLabel="Start 2-minute rescue session"
  accessibilityHint="Double-tap to begin a timed focus session"
  accessibilityRole="button"
  onPress={handleStart}
>

// Every informational element needs:
<Text
  accessibilityLabel={`Rescued 47 minutes this week. Trend: building.`}
  accessibilityRole="text"
>
```

**2. Dynamic Type Support**
```typescript
// src/theme/typography.ts — add:
import { useWindowDimensions } from 'react-native'

export function getScaledFontSize(base: number): number {
  // React Native doesn't have native Dynamic Type,
  // but we can respect the system font scale
  const { fontScale } = useWindowDimensions()
  return Math.round(base * Math.min(fontScale, 1.5)) // cap at 1.5x
}
```

**3. Color Contrast Verification**
All text/background combinations must meet WCAG AA (4.5:1 for normal text, 3:1 for large text). The current theme uses `#B4B4C8` for secondary text on `#060608` background — contrast ratio is approximately 8.2:1 (passes). But `#7E7E96` on `#0E0E12` is approximately 4.1:1 (borderline for small text).

**4. Focus Indicators**
```typescript
// All interactive elements need visible focus indicators for keyboard/switch control
borderWidth: 2,
borderColor: isFocused ? colors.brand[400] : 'transparent',
```

**5. Reduced Motion**
Already covered in Section 3. All animations must check `shouldAnimate()`.

**6. Screen Reader Announcements**
```typescript
// src/utils/accessibility.ts
import { AccessibilityInfo } from 'react-native'

export function announceForScreenReader(message: string) {
  AccessibilityInfo.announceForAccessibility(message)
}

// Use at key moments:
// Session start: "Rescue session started. 2 minutes."
// Session complete: "Session complete. You rescued 2 minutes."
// Drift detected: "Drift detected. You seem to be avoiding."
```

---

## SECTION 9: OFFLINE-FIRST & DATA ARCHITECTURE

### The Problem: No Offline Resilience

The AI coach requires internet. The sync system requires internet. But the core rescue loop (state select → mission compile → timer → complete) should work entirely offline.

### Offline-First Architecture

```typescript
// src/services/connectivity.ts
import NetInfo from '@react-native-community/netinfo'

let _isConnected = true

export function initConnectivity() {
  NetInfo.addEventListener(state => {
    _isConnected = state.isConnected ?? false
  })
}

export function isOnline(): boolean {
  return _isConnected
}

// src/hooks/useOfflineCapable.ts
export function useOfflineCapable() {
  const online = isOnline()
  
  return {
    canUseAI: online,
    canRescue: true, // Always works offline
    canSync: online,
    canScheduleNotifications: online,
    offlineMessage: online ? null : 'Offline mode. Rescue sessions work without internet.',
  }
}
```

### Data Integrity

```typescript
// src/store/integrity.ts
export function validateStoreIntegrity(state: unknown): {
  valid: boolean
  errors: string[]
  repaired: Partial<AppState> | null
} {
  const errors: string[] = []
  const s = state as Record<string, unknown>
  
  // Check sessions array
  if (!Array.isArray(s.sessions)) {
    errors.push('sessions is not an array')
    s.sessions = []
  }
  
  // Check for orphaned micro-missions
  const missionIds = new Set((s.missions as Array<{id: string}>)?.map(m => m.id) ?? [])
  const orphaned = (s.microMissions as Array<{mission_id: string}>)?.filter(
    mm => !missionIds.has(mm.mission_id)
  ) ?? []
  if (orphaned.length > 0) {
    errors.push(`${orphaned.length} orphaned micro-missions`)
  }
  
  // Check for sessions with missing required fields
  const invalidSessions = (s.sessions as Array<Record<string, unknown>>)?.filter(
    sess => !sess.id || !sess.started_at || !sess.status
  ) ?? []
  if (invalidSessions.length > 0) {
    errors.push(`${invalidSessions.length} invalid sessions`)
  }
  
  return {
    valid: errors.length === 0,
    errors,
    repaired: errors.length > 0 ? { sessions: s.sessions as AppState['sessions'] } : null,
  }
}
```

---

## SECTION 10: PERFORMANCE BUDGET & OPTIMIZATION

### The Problem: No Performance Monitoring

The app has no performance instrumentation. No render tracking, no bundle size monitoring, no memory profiling.

### Performance Budgets

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Cold start to interactive | < 2s | `@shopify/react-native-performance` |
| Home screen render | < 16ms (60fps) | React DevTools Profiler |
| Store update to re-render | < 8ms | Custom middleware |
| AI response first token | < 1.5s | Network timing |
| Timer accuracy | < 100ms drift over 25min | Stopwatch comparison |
| Bundle size (main) | < 4MB | Metro bundle analyzer |
| Memory usage (idle) | < 80MB | Xcode Instruments |
| Memory usage (active session) | < 120MB | Xcode Instruments |

### Key Optimizations

**1. Granular Store Selectors (Already Identified in Part 2)**
Replace `useAppStore()` with `useAppStore(s => s.sessions)`. This is the single biggest performance win.

**2. FlashList for Session History**
Already using `@shopify/flash-list` in progress.tsx. Verify it's used everywhere with long lists.

**3. Memoize Expensive Computations**
```typescript
// src/hooks/useMemoizedEngine.ts
export function useMemoizedPrediction(sessions: MissionSession[]) {
  return useMemo(() => {
    if (sessions.length < 3) return null
    return predictDrift({ sessions, patterns: [], momentumEvents: [], missions: [] })
  }, [sessions.length, sessions[sessions.length - 1]?.id])
  // Only recompute when session count changes or last session changes
}
```

**4. Lazy Load AI**
The AI module (349 lines + orchestrator) should be dynamically imported:
```typescript
const ai = await import('../services/ai')
```

**5. Debounce Store Writes**
MMKV writes are fast but not instant. Debounce rapid store updates:
```typescript
// src/store/storage.ts
let _writeTimeout: ReturnType<typeof setTimeout> | null = null
const _pendingWrites = new Map<string, string>()

export function debouncedWrite(key: string, value: string) {
  _pendingWrites.set(key, value)
  if (_writeTimeout) clearTimeout(_writeTimeout)
  _writeTimeout = setTimeout(() => {
    for (const [k, v] of _pendingWrites) {
      mmkv.set(k, v)
    }
    _pendingWrites.clear()
  }, 100) // 100ms debounce
}
```

---

## SECTION 11: THE WIDGET SYSTEM — LOCK SCREEN INTELLIGENCE

### The Problem: Intelligence Locked Behind App Open

The most valuable data in INTENT (danger windows, current risk, momentum) is only visible when you open the app and navigate to the progress screen. This data should be on the lock screen.

### Widget Design

**Small Widget (2×2):**
```
┌──────────────┐
│ INTENT       │
│ ● Low risk   │
│ 7 rescues    │
│ this week    │
└──────────────┘
```

**Medium Widget (4×2):**
```
┌──────────────────────────────┐
│ INTENT          Thursday 2pm │
│ ● You're in a danger window  │
│ 'Overwhelmed' usually hits   │
│ now. 2 minutes? [RESCUE]     │
└──────────────────────────────┘
```

**Lock Screen Widget (iOS 17+):**
```
┌────────┐
│ ⚡ 47m │  ← rescued this week
└────────┘
```

### Implementation (iOS)

```swift
// ios/IntentWidget/IntentWidget.swift
import WidgetKit
import SwiftUI

struct IntentProvider: TimelineProvider {
  func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
    // Read from shared App Group container
    let sharedDefaults = UserDefaults(suiteName: "group.com.intent.app")
    let riskLevel = sharedDefaults?.string(forKey: "currentRiskLevel") ?? "low"
    let weeklyMinutes = sharedDefaults?.integer(forKey: "weeklyMinutes") ?? 0
    let nextDangerHour = sharedDefaults?.integer(forKey: "nextDangerHour") ?? -1
    
    let entry = IntentEntry(
      date: Date(),
      riskLevel: riskLevel,
      weeklyMinutes: weeklyMinutes,
      nextDangerHour: nextDangerHour
    )
    
    let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
    let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
    completion(timeline)
  }
}
```

### Widget Data Sync

```typescript
// src/services/widgetSync.ts
import * as ExpoWidget from 'expo-widget' // or react-native-shared-group-preferences

export function syncWidgetData(state: AppState) {
  const prediction = predictDrift({
    sessions: state.sessions,
    patterns: state.resistancePatterns,
    momentumEvents: state.momentumEvents,
    missions: state.missions,
  })
  
  const weekAgo = Date.now() - 7 * 86400000
  const weeklyMinutes = state.sessions
    .filter(s => new Date(s.started_at).getTime() >= weekAgo)
    .filter(s => s.status === 'completed' || s.status === 'salvaged')
    .reduce((sum, s) => sum + Math.round(s.actual_seconds / 60), 0)
  
  // Write to shared App Group container
  ExpoWidget.setItem('currentRiskLevel', prediction?.currentRiskLevel ?? 'low')
  ExpoWidget.setItem('weeklyMinutes', weeklyMinutes)
  ExpoWidget.setItem('nextDangerHour', prediction?.nextDangerWindow?.startHour ?? -1)
  ExpoWidget.setItem('userName', state.user?.display_name ?? '')
  
  ExpoWidget.reloadWidget()
}
```

---

## SECTION 12: APP STORE PRESENCE & ASO

### The Problem: No App Store Strategy

INTENT needs to be positioned correctly in the App Store. It's not a "productivity app" (too generic). It's not a "focus timer" (too competitive). It's an "anti-procrastination rescue tool" — a category that barely exists.

### App Store Positioning

**App Name:** INTENT — Beat Procrastination
**Subtitle:** 2-Minute Rescue Sessions
**Category:** Productivity (primary), Health & Fitness (secondary)

**Keywords (prioritized):**
1. anti procrastination
2. ADHD focus
3. productivity rescue
4. task initiation
5. body double
6. focus timer
7. overcome avoidance
8. momentum tracker
9. brain dump
10. gentle accountability

**Description Hook (first 3 lines — visible before "more"):**
"Your brain knows what to do. The problem is starting.
INTENT gives you a 2-minute rescue — the tiny action that breaks the avoidance loop.
No guilt. No streaks. Just starting."

**Screenshots Strategy:**
1. Home screen with danger window insight (shows intelligence)
2. Rescue session in progress (shows timer + mission)
3. Weekly narrative card (shows personalization)
4. Before-scroll intercept (shows unique feature)
5. Progress screen with heatmap (shows depth)

### Preview Video Concept
1. Open app → "Good afternoon. Your 2pm danger window is approaching."
2. Tap "Start Rescue" → Mission appears: "Open the thing you're avoiding."
3. Timer starts → Body double presence indicator appears
4. Timer completes → "You rescued 2 minutes from 'avoiding.'"
5. Weekly card → "This week you fought 'overwhelmed' 4 times and won 3."

---

## SECTION 13: PRIVACY ARCHITECTURE DEEP DIVE

### The Current Privacy Model

INTENT stores everything locally (MMKV). The only external call is the Anthropic API for the AI coach. The trust center has 4 toggles. This is good but incomplete.

### What's Missing

**1. Data Export**
```typescript
// src/services/dataExport.ts
export async function exportAllData(): Promise<string> {
  const state = useAppStore.getState()
  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    user: state.user,
    sessions: state.sessions,
    missions: state.missions,
    microMissions: state.microMissions,
    momentumEvents: state.momentumEvents,
    resistancePatterns: state.resistancePatterns,
    distractions: state.distractions,
    brainDumps: state.brainDumps,
    retentionState: state.retentionState,
  }
  return JSON.stringify(exportData, null, 2)
}
```

**2. Data Deletion**
```typescript
// src/services/dataDeletion.ts
export async function deleteAllData(): Promise<void> {
  // Clear MMKV
  const mmkv = new MMKV()
  mmkv.clearAll()
  
  // Clear retention storage
  const retention = new MMKV({ id: 'intent-retention' })
  retention.clearAll()
  
  // Clear widget data
  const widgetDefaults = new MMKV({ id: 'intent-widget' })
  widgetDefaults.clearAll()
  
  // Cancel all scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync()
  
  // Reset store
  useAppStore.getState().resetState()
}
```

**3. AI Data Minimization**
The AI coach sends context to Anthropic. Minimize what's sent:
```typescript
// Only send what the AI needs, never raw session data
const context = {
  userName: user.display_name,
  pushStyle: user.push_style,
  currentMomentum: momentumScore,
  activeMissions: missions.filter(m => m.status === 'active').length,
  todayMinutes: minutesToday,
  currentStreak: retentionState.currentStreak,
  recentAvoidance: lastSession?.mode ?? null,
  // NEVER send: session history, brain dumps, distractions, user ID
}
```

**4. Consent Audit Trail**
The consent ledger exists but isn't surfaced properly. The trust center should show:
- Every time consent was granted/revoked
- What data was shared when
- An export of the consent log

---

## SECTION 14: THE "BEFORE YOU OPEN THE APP" SURFACE

### The Problem: The Best Feature Requires Opening The App

The before-scroll intercept is INTENT's most unique feature. But it requires the user to:
1. Realize they're about to scroll
2. Open INTENT instead of the scroll app
3. Navigate to the before-scroll screen
4. Complete the intercept

This will never work. By the time you realize you're scrolling, you're already scrolling.

### The Solution: System-Level Intercept Layers

**Layer 1: iOS Widget Shortcut (MVP)**
Add a widget that's one tap from the home screen. The widget shows current risk level and has a "2 min?" button. This is the minimum viable intercept.

**Layer 2: Siri Shortcut / Shortcuts App Integration**
```typescript
// src/services/shortcuts.ts
import * as SiriShortcuts from 'expo-siri-shortcuts'

export async function registerShortcuts() {
  // "Hey Siri, rescue me" → opens app to state select
  await SiriShortcuts.createShortcut({
    activityType: 'com.intent.app.rescue',
    title: 'Rescue me',
    suggestedInvocationPhrase: 'Rescue me',
    userInfo: { action: 'start_rescue' },
  })
  
  // "Hey Siri, brain dump" → opens brain dump
  await SiriShortcuts.createShortcut({
    activityType: 'com.intent.app.braindump',
    title: 'Brain dump',
    suggestedInvocationPhrase: 'Brain dump',
    userInfo: { action: 'brain_dump' },
  })
}
```

**Layer 3: Screen Time API Integration (iOS 16+)**
```typescript
// This requires Family Controls entitlement — complex but possible
// For MVP, use ManagedSettings to trigger a notification when
// the user opens a distracting app
import { ManagedSettings, FamilyControls } from 'react-native-screen-time'

// Request authorization
export async function requestScreenTimeAuth() {
  // This triggers the Family Controls authorization dialog
  // User grants permission to monitor app usage
}

// When user opens a blocked app, show INTENT notification
// This is the "intercept" — not blocking, but redirecting
```

**Layer 4: Live Activity (iOS 16.1+)**
During an active session, show a Live Activity on the Dynamic Island and lock screen:
```typescript
// src/services/liveActivity.ts
import * as LiveActivities from 'expo-live-activities'

export async function startFocusLiveActivity(minutes: number, mission: string) {
  await LiveActivities.startActivity({
    attributes: { type: 'focus_session' },
    contentState: {
      minutesRemaining: minutes,
      mission: mission.slice(0, 40),
      status: 'active',
    },
  })
}
```

---

## SECTION 15: TESTING STRATEGY & QUALITY GATES

### Current Test Status
416/416 tests, 14/14 suites passing. Good coverage of engine logic. Missing: UI component tests, integration tests, E2E tests.

### What's Missing

**1. Visual Regression Tests**
```typescript
// Use Detox or Maestro for E2E
describe('Onboarding Flow', () => {
  it('completes 5-step onboarding', async () => {
    await element(by.text('Show me how')).tap()
    await element(by.id('name-input')).typeText('Alex')
    await element(by.text('Continue')).tap()
    await element(by.text('Avoiding')).tap()
    await element(by.text('Continue')).tap()
    await expect(element(by.text('YOUR 2-MINUTE MISSION'))).toBeVisible()
    await element(by.text('Start Timer')).tap()
    // ... wait for timer or tap "Done"
    await expect(element(by.text('You rescued 2 minutes'))).toBeVisible()
  })
})
```

**2. Performance Regression Tests**
```typescript
describe('Performance', () => {
  it('home screen renders in < 16ms', async () => {
    const start = performance.now()
    render(<HomeScreen />)
    const end = performance.now()
    expect(end - start).toBeLessThan(16)
  })
  
  it('store update triggers re-render in < 8ms', async () => {
    // Use React DevTools Profiler API
  })
})
```

**3. Accessibility Audit**
```typescript
import { render, screen } from '@testing-library/react-native'

describe('Accessibility', () => {
  it('all buttons have labels', () => {
    render(<HomeScreen />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button.props.accessibilityLabel).toBeTruthy()
    })
  })
})
```

---

## SECTION 16: ANALYTICS FEEDBACK LOOP (REAL IMPLEMENTATION)

### The Problem: Analytics Is Write-Only

`src/services/analytics.ts` is 1,100 lines of event capture. It never reads data back. The predictive engine uses store data, not analytics events. Analytics should inform the intelligence system.

### The Analytics Feedback Architecture

```typescript
// src/services/analyticsFeedback.ts

export interface AnalyticsInsight {
  type: 'pattern' | 'anomaly' | 'milestone' | 'regression'
  message: string
  confidence: number
  actionable: boolean
  suggestedAction?: string
}

export function generateAnalyticsInsights(
  events: AnalyticsEvent[],
  sessions: MissionSession[],
): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = []
  
  // Pattern: Session duration declining
  const recentDurations = sessions.slice(0, 10).map(s => s.actual_seconds)
  const olderDurations = sessions.slice(10, 20).map(s => s.actual_seconds)
  if (recentDurations.length >= 5 && olderDurations.length >= 5) {
    const recentAvg = recentDurations.reduce((a, b) => a + b, 0) / recentDurations.length
    const olderAvg = olderDurations.reduce((a, b) => a + b, 0) / olderDurations.length
    if (recentAvg < olderAvg * 0.7) {
      insights.push({
        type: 'regression',
        message: 'Your sessions are getting shorter. This might mean you\'re rushing, or it might mean you\'re more efficient.',
        confidence: 0.7,
        actionable: true,
        suggestedAction: 'Try a 10-minute session today.',
      })
    }
  }
  
  // Anomaly: Sudden spike in abandons
  const last7days = sessions.filter(s => 
    (Date.now() - new Date(s.started_at).getTime()) < 7 * 86400000
  )
  const abandonRate = last7days.filter(s => s.status === 'abandoned').length / Math.max(last7days.length, 1)
  if (abandonRate > 0.5 && last7days.length >= 3) {
    insights.push({
      type: 'anomaly',
      message: 'You\'ve abandoned more sessions than usual this week. Something might be different.',
      confidence: 0.8,
      actionable: true,
      suggestedAction: 'Try shorter sessions (2 minutes) to rebuild momentum.',
    })
  }
  
  // Milestone: Longest streak
  // ... etc
  
  return insights
}
```

---

## SECTION 17: THE EMOTIONAL DESIGN SYSTEM

### The Problem: The App Is Dark Purple With Cards

The visual design is competent but not emotional. It uses a dark theme with purple accents and card-based layouts. This is the same design language as every other productivity app in 2026.

### Emotional Design Principles for INTENT

**Principle 1: Calm, Not Energetic**
INTENT's users are often anxious, overwhelmed, or exhausted. The design should be CALMING, not exciting. Use:
- Slower animations (400ms instead of 200ms)
- Rounded corners (16px minimum)
- Muted colors (not bright purple — more like #8B7AAD)
- Generous whitespace
- No countdown urgency until the timer is active

**Principle 2: Warm, Not Clinical**
The language should be warm, not clinical. Replace:
- "Session abandoned" → "You stepped away"
- "Drift detected" → "I noticed you might be struggling"
- "Completion rate: 73%" → "You finish almost 3 out of 4 times"
- "Risk level: critical" → "This is a hard moment for you"

**Principle 3: Physical, Not Digital**
Design elements should feel physical:
- Cards should have subtle shadows (like paper)
- Buttons should have depth (pressed state = inset shadow)
- Transitions should have weight (not instant snaps)
- The timer should feel like a physical object (not just numbers)

**Principle 4: Personal, Not Generic**
Every screen should reference the user's data:
- Home screen greeting uses their name AND their current state
- Mission text references their specific blocker
- Progress numbers are contextualized ("that's more than last week")
- Error messages are personalized ("Alex, something went wrong")

### Color Emotion Map

| State | Primary Color | Background Tint | Rationale |
|-------|--------------|-----------------|-----------|
| Calm/ready | Soft green (#6EE7B7) | Green tint | Safety, go |
| Avoiding | Warm amber (#FCD34D) | Amber tint | Attention, not alarm |
| Overwhelmed | Soft blue (#93C5FD) | Blue tint | Calm, spacious |
| Stuck | Muted purple (#C4B5FD) | Purple tint | Creative, thinking |
| Tired | Warm gray (#D1D5DB) | Gray tint | Rest, no pressure |
| Anxious | Soft pink (#FCA5A5) | Pink tint | Warmth, safety |
| Shame spiral | Deep teal (#5EEAD4) | Teal tint | Fresh start, clean |

---

## SECTION 18: FEATURE INTERACTION MAP — EMERGENT EXPERIENCES

### The Problem: Features Are Isolated

The brain dump, mission compiler, predictive engine, AI coach, and retention system are all separate modules. They don't create EMERGENT experiences — moments that are more than the sum of their parts.

### Emergent Experience 1: The Brain Dump → Mission → Rescue Chain
```
User dumps anxiety → AI analyzes → Mission compiler generates specific mission →
Predictive engine times it right → Notification fires at danger window →
User opens app → Mission is already waiting → Timer starts → Session completes →
Retention engine records → Social proof shown → Weekly narrative updated
```
This is the FULL loop. Currently, brain dumps sit in a list and nothing happens.

### Emergent Experience 2: The Pattern → Insight → Action Chain
```
Predictive engine detects Thursday 2pm danger window →
Insight system generates "Your hardest hour" →
Home screen shows "Thursday 2pm is coming" →
Notification fires at 1:50pm →
User opens app → Pre-compiled mission for "overwhelmed" →
Session completes → Pattern is reinforced → Prediction improves
```

### Emergent Experience 3: The Comeback → Celebration → Momentum Chain
```
User absent 5 days → Retention engine detects comeback →
Home screen shows "5 days. No guilt. One tiny thing?" →
User completes 2-minute rescue → Celebration fires →
"5 days away and you came back. That's resilience." →
Momentum window updates → Weekly narrative includes comeback →
Shareable card shows the comeback story
```

### Implementation: The System Event Bus

```typescript
// src/services/systemBridge.ts (expand existing)

export type SystemEvent = 
  | { type: 'session_completed'; session: MissionSession }
  | { type: 'session_abandoned'; session: MissionSession }
  | { type: 'brain_dump_created'; dump: BrainDump }
  | { type: 'danger_window_approaching'; window: DangerWindow }
  | { type: 'comeback_detected'; daysAway: number }
  | { type: 'pattern_milestone'; pattern: string; count: number }
  | { type: 'weekly_narrative_ready'; narrative: string }
  | { type: 'app_opened'; source: 'cold_start' | 'notification' | 'widget' | 'shortcut' }

export function processSystemEvent(
  event: SystemEvent,
  context: SystemContext,
): SystemAction[] {
  const actions: SystemAction[] = []
  
  switch (event.type) {
    case 'session_completed': {
      // Trigger retention recording
      actions.push({ type: 'record_retention', event: 'rescue_completed' })
      // Trigger social proof
      const proof = getSocialProofStat(event.session.mode, true)
      if (proof) actions.push({ type: 'show_social_proof', message: proof })
      // Update widget
      actions.push({ type: 'sync_widget' })
      // Schedule follow-up notification
      actions.push({ type: 'schedule_followup', delay: 6 * 3600 })
      break
    }
    
    case 'brain_dump_created': {
      // After 24h, remind about pending dumps
      actions.push({ type: 'schedule_dump_reminder', dumpId: event.dump.id, delay: 86400 })
      break
    }
    
    case 'danger_window_approaching': {
      // Pre-compile mission for the likely state
      const mission = compileMission({
        state: event.window.primaryState,
        blocker: null,
        energy: 'medium',
        availableMinutes: 2,
        contextText: null,
        threadId: null,
        previousFailures: [],
        previousSuccesses: [],
        protocolId: getProtocolForState(event.window.primaryState),
        privacyPolicy: 'local_only',
      })
      actions.push({ type: 'precompile_mission', mission })
      actions.push({ type: 'show_notification', copy: 'danger_window' })
      break
    }
    
    case 'comeback_detected': {
      actions.push({ type: 'show_comeback_message', daysAway: event.daysAway })
      break
    }
    
    case 'app_opened': {
      // Check for pending actions
      const pendingDumps = context.brainDumps.filter(d => !d.converted_to_mission)
      if (pendingDumps.length > 0) {
        actions.push({ type: 'show_pending_dumps', count: pendingDumps.length })
      }
      // Check for comeback
      const comeback = detectComeback(context.sessions, context.retentionState.lastRescueDate)
      if (comeback.isComeback) {
        actions.push({ type: 'show_comeback_message', daysAway: comeback.daysAway })
      }
      break
    }
  }
  
  return actions
}
```

---

## SECTION 19: THE LAUNCH STRATEGY

### Pre-Launch (2 weeks before)

1. **TestFlight Beta** — 100 users from ADHD/productivity communities
2. **Feedback Collection** — In-app feedback button (Settings → Send Feedback)
3. **Crash Reporting** — Sentry integration (already configured, verify DSN)
4. **Analytics** — Verify all critical events fire correctly

### Launch Week

1. **Product Hunt Launch** — Position as "Anti-procrastination tool, not another productivity app"
2. **Reddit Posts** — r/ADHD, r/productivity, r/getdisciplined (genuine, not spammy)
3. **Twitter/X Thread** — "I built an app that catches you before you procrastinate. Here's how it works."
4. **Indie Hackers** — Share the revenue model and retention data

### Post-Launch (ongoing)

1. **Weekly Review** — Check retention metrics, session completion rates, feature usage
2. **User Interviews** — 5 users per week for first month
3. **A/B Testing** — Onboarding flow, notification copy, paywall trigger
4. **Content Marketing** — Blog posts about procrastination psychology (SEO)

### Key Metrics to Track

| Metric | Target (Month 1) | Target (Month 3) |
|--------|-------------------|-------------------|
| D1 Retention | 40% | 45% |
| D7 Retention | 20% | 25% |
| D30 Retention | 10% | 15% |
| Activation Rate (first rescue) | 60% | 70% |
| Sessions per User per Week | 3 | 5 |
| Pro Conversion | 3% | 5% |
| App Store Rating | 4.5+ | 4.7+ |
| Crash-Free Rate | 99.5% | 99.9% |

---

## SECTION 20: WHAT A 10/10 ACTUALLY MEANS — INDUSTRY BENCHMARKS

### The 10/10 App Checklist

A 10/10 app in June 2026 has ALL of these:

**Product:**
- [ ] Clear value proposition communicated in < 5 seconds
- [ ] First meaningful action completed in < 60 seconds
- [ ] Reason to open the app daily (not just when in crisis)
- [ ] Feature that people screenshot and share
- [ ] Feature that no competitor has
- [ ] Monetization that feels fair, not extractive
- [ ] Works offline for core functionality
- [ ] System-level integration (widgets, shortcuts, notifications)

**Engineering:**
- [ ] < 2 second cold start
- [ ] 60fps on all screens
- [ ] Zero crashes in production
- [ ] Offline-first data architecture
- [ ] Comprehensive error handling
- [ ] Type-safe store with migrations
- [ ] 80%+ test coverage on critical paths
- [ ] Bundle size < 4MB

**Design:**
- [ ] Consistent design system (tokens, not magic numbers)
- [ ] Animations that feel physical
- [ ] Haptic feedback at key moments
- [ ] Accessibility (screen reader, dynamic type, reduce motion)
- [ ] Empty states that educate
- [ ] Error states that help
- [ ] Loading states that don't frustrate

**Emotional:**
- [ ] Makes users feel understood
- [ ] Celebrates progress, not perfection
- [ ] Never shames or punishes
- [ ] Creates identity ("I'm a Classic Avoider")
- [ ] Generates stories worth sharing
- [ ] Feels like a companion, not a tool

### Where INTENT Is Today (Honest Assessment)

| Category | Current | Target | Gap |
|----------|---------|--------|-----|
| Product | 6/10 | 10/10 | 4 — No daily pull, no shareable moment, before-scroll disconnected |
| Engineering | 7/10 | 10/10 | 3 — No error handling, no offline resilience, no performance monitoring |
| Design | 6/10 | 10/10 | 4 — No haptics, no motion system, no accessibility, generic empty states |
| Emotional | 5/10 | 10/10 | 5 — No soul layer, no identity creation, no shareable moments, no pull mechanic |

**Overall: 6/10 → Target 10/10**

### The 4 Things That Will Get INTENT To 10/10

1. **The Pull Mechanic** — Something that makes users open the app when they're NOT in crisis. A daily insight, a growing visualization, a personal pattern that evolves.

2. **The Shareable Moment** — A weekly card so good that people screenshot it. The pattern name, the weekly narrative, the comeback story.

3. **The System-Level Intercept** — Widget + Shortcuts + Notifications that catch the user BEFORE they start scrolling, not after.

4. **The Feel Layer** — Haptics, animations, and micro-interactions that make the app feel ALIVE. Every tap should have weight. Every completion should feel earned.

---

## IMPLEMENTATION PRIORITY ORDER

### Phase 1: Foundation (Week 1-2)
1. Error states & empty states (Section 7)
2. Haptic patterns (Section 3)
3. Accessibility labels (Section 8)
4. Store integrity checks (Section 9)
5. Performance instrumentation (Section 10)

### Phase 2: Intelligence Surface (Week 3-4)
1. Home screen redesign (Section 2)
2. Widget system (Section 11)
3. Pattern naming system (Section 5)
4. Weekly narrative prominence (Section 5)
5. Analytics feedback loop (Section 16)

### Phase 3: Feel Layer (Week 5-6)
1. Animation design system (Section 4)
2. Motion patterns (Section 4)
3. Emotional color map (Section 17)
4. Micro-interaction polish (Section 3)
5. Screen reader announcements (Section 8)

### Phase 4: System Integration (Week 7-8)
1. System event bus (Section 18)
2. Brain dump → mission chain (Section 18)
3. Danger window → notification chain (Section 18)
4. Comeback → celebration chain (Section 18)
5. Siri shortcuts (Section 14)

### Phase 5: Launch Prep (Week 9-10)
1. App Store assets (Section 12)
2. Performance optimization (Section 10)
3. E2E tests (Section 15)
4. Beta testing (Section 19)
5. Analytics verification (Section 16)

---

*This document is Part 2B. Read BLUEPRINT-PART2-SYSTEMS.md for Part 2A (retention loops, notifications, onboarding, store refactor, predictive engine surface, progress redesign, monetization, missions, coach/AI, before-scroll, analytics). Together they form the complete rebuild blueprint.*
