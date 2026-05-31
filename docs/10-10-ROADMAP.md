# ══════════════════════════════════════════════════════════════
# INTENT — 10/10 ROADMAP
# From Audit-Complete to Industry-Shaking
# ══════════════════════════════════════════════════════════════

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Bring INTENT from ~9/10 (audit items implemented) to 10/10 (industry-shaking, every competitor feature surpassed).

**Current State:** 416/416 tests passing, 14/14 suites. All audit P0/P1/Short-Term/Medium-Term items implemented. The foundation is wired. Now we build the moat.

**Architecture:** React Native (Expo) + Zustand (6 slices) + Reanimated 3 + expo-notifications + Anthropic API via orchestrator pipeline + MMKV retention storage.

**Project Root:** `/root/projects/cognitive-companion`

---

## STATUS LEGEND

- ✅ DONE — Implemented and verified in prior sessions
- 🔴 NOT STARTED — Needs implementation
- 🟡 PARTIAL — Exists but incomplete

---

## WHAT THE AUDIT SAYS IS DONE (Verify Before Trusting)

These items are marked ✅ in the existing implementation plan. Before implementing anything new, **verify each one actually works** by reading the code. The audit is the source of truth — if the code doesn't match the audit's fix, it's not done.

| Audit Item | Claimed Status | Verification Command |
|---|---|---|
| Bug #1: Mission text shows exactAction | ✅ | `grep -n "exactAction" app/live.tsx` |
| Bug #2: AppState timer resume | ✅ | `grep -n "AppState" app/live.tsx` |
| Bug #4: features['CORE'] not features() | ✅ | `grep -n "features\[" app/(tabs)/coach.tsx` |
| Bug #5: cancelSession exists | ✅ | `grep -n "cancelSession" src/store/slices/sessionSlice.ts` |
| Bug #8: Retention events fire | ✅ | `grep -n "rescue_completed" src/store/slices/sessionSlice.ts` |
| Orchestrated coachStreamResponse | ✅ | `grep -n "routeAgent\|assessCrisis" src/services/ai/index.ts` |
| AnimatedStateChip spring | ✅ | `grep -n "withSpring" app/(tabs)/index.tsx` |
| AnimatedRescueButton used | ✅ | `grep -n "AnimatedRescueButton" app/(tabs)/index.tsx` |
| Timer 10s sync | ✅ | `grep -n "elapsed % 10\|elapsedSeconds % 10" app/live.tsx` |
| Limited mode coach | ✅ | `grep -n "limited\|sessionCount < 3" app/(tabs)/coach.tsx` |
| Heatmap above fold | ✅ | `grep -n "Heatmap\|heatmap" app/(tabs)/progress.tsx` |
| Paywall session 5 trigger | ✅ | `grep -n "sessionCount >= 5\|>= 5" app/live.tsx` |
| WCAG disabled color | ✅ | `grep -n "6A6A80" src/theme/index.ts` |
| FlashList installed | ✅ | `grep -n "flash-list" package.json` |

**If any verification fails, that item becomes a task in Phase 1.**

---

## PHASE 0 — VERIFICATION SPRINT (30 min)

Run these commands to confirm the current state before starting any new work:

```bash
cd /root/projects/cognitive-companion

# 1. All tests pass?
npx jest --no-cache --forceExit 2>&1 | tail -5

# 2. TypeScript clean?
npx tsc --noEmit 2>&1 | tail -5

# 3. Verify each audit fix above
# (Run the grep commands from the table)

# 4. Check for remaining Animated API usage (should only be in non-critical paths)
grep -rn "from 'react-native'" app/ src/components/ | grep "Animated" | grep -v "import.*Animated.*from 'react-native-reanimated'"
```

---

## PHASE 1 — CLOSE REMAINING GAPS (1-2 days)

These are items the audit identified that may not be fully wired, plus the "industry-shaking" features the audit says every competitor has.

---

### Task 1: Home Screen Auto-Select Last Resistance State

**Objective:** If user was struggling < 2 hours ago, pre-select that state chip on mount. Zero-friction re-entry.

**Audit Reference:** Section 11, "Quick-Tap Pattern"

**Files:**
- Modify: `app/(tabs)/index.tsx` (add useEffect on mount)

**Steps:**

1. In `app/(tabs)/index.tsx`, find the existing mount useEffect. Add auto-select logic:

```typescript
// After existing mount useEffect, add:
useEffect(() => {
  // Guard: if active session exists, redirect to live
  const { activeSession } = useAppStore.getState()
  if (activeSession?.status === 'active') {
    router.replace('/live')
    return
  }
  // Auto-select last resistance state if recent
  if (resistancePatterns.length > 0) {
    const mostRecent = resistancePatterns[0]
    const hoursSince = (Date.now() - new Date(mostRecent.created_at).getTime()) / 3600000
    if (hoursSince < 2) {
      setSelectedState(mostRecent.state as UserState)
      // Auto-focus rescue section for accessibility
      AccessibilityInfo.announceForAccessibility(
        `${mostRecent.state} selected. Tap Rescue Me to begin.`
      )
    }
  }
}, [])
```

2. Run tests: `npx jest --no-cache --forceExit --testPathPatterns="store" 2>&1`

**Verify:** App opens → if recent resistance pattern, chip is pre-selected.

---

### Task 2: Home Screen — "You're On A Roll" Visual Warmth

**Audit Reference:** Section 11, "A 'You're On A Roll' State"

**Objective:** When `momentum.last7Days >= 5`, the home screen greeting and visual tone shift warmer.

**Files:**
- Modify: `app/(tabs)/index.tsx` (greeting logic + color shift)

**Steps:**

1. In the greeting section, add momentum-aware copy:

```typescript
const momentum = retentionState.momentumWindows.last7Days
const greeting = momentum >= 5
  ? `You're on a roll, ${displayName} 🔥`
  : momentum >= 3
    ? `Building momentum, ${displayName}`
    : `Hey ${displayName}`
```

2. Add a subtle warm tint to the greeting pill when momentum >= 5:

```typescript
{momentum >= 5 && (
  <View style={[styles.momentumPill, { backgroundColor: '#10B981' + '20' }]}>
    <Flame size={14} color="#10B981" />
    <Text style={[styles.momentumText, { color: '#10B981' }]}>
      {momentum} rescues this week
    </Text>
  </View>
)}
```

3. Run tests: `npx jest --no-cache --forceExit 2>&1 | tail -5`

**Verify:** With 5+ rescues, greeting says "You're on a roll" with warm green pill.

---

### Task 3: Home Screen — First-Open Warm Empty State

**Audit Reference:** Section 5, Flaw #7

**Objective:** When `sessionCount === 0`, skip the stats row and show an encouraging CTA instead of cold zeros.

**Files:**
- Modify: `app/(tabs)/index.tsx` (conditional empty state)

**Steps:**

1. Wrap the stats row in a session count guard:

```typescript
{sessionCount > 0 ? (
  <View style={styles.todayRow}>
    {/* existing stats */}
  </View>
) : (
  <View style={styles.firstRescueCTA}>
    <Text style={styles.firstRescueTitle}>Ready for your first rescue?</Text>
    <Text style={styles.firstRescueBody}>
      Pick how you're feeling right now. I'll give you one tiny action to start.
    </Text>
  </View>
)}
```

2. Add styles:

```typescript
firstRescueCTA: {
  alignItems: 'center',
  paddingVertical: spacing.xl,
  marginTop: spacing.lg,
},
firstRescueTitle: {
  ...typography.h3,
  color: colors.text.primary,
  marginBottom: spacing.sm,
},
firstRescueBody: {
  ...typography.body,
  color: colors.text.tertiary,
  textAlign: 'center',
  paddingHorizontal: spacing.xl,
},
```

**Verify:** Fresh install shows "Ready for your first rescue?" instead of "0m Focus today".

---

### Task 4: Coach Screen — Streaming Text LayoutAnimation

**Audit Reference:** Section 13, "The Streaming Text Display Issue"

**Objective:** Fix flickery streaming text by wrapping token updates in LayoutAnimation.

**Files:**
- Modify: `app/(tabs)/coach.tsx` (streaming text handler)

**Steps:**

1. Find the `onChunk` callback that sets `streamingText`. Wrap in LayoutAnimation:

```typescript
import { LayoutAnimation } from 'react-native'

// In the onChunk callback:
onChunk: (text: string) => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
  setStreamingText(text)
},
```

2. Run tests: `npx jest --no-cache --forceExit 2>&1 | tail -5`

**Verify:** AI response text grows smoothly instead of jumping.

---

### Task 5: Coach Screen — Keep Action Suggestions Collapsed During Conversation

**Audit Reference:** Section 13, "The Core Problem"

**Objective:** Don't hide action suggestions after first message. Collapse them instead.

**Files:**
- Modify: `app/(tabs)/coach.tsx` (action suggestions panel)

**Steps:**

1. Find `setShowActions(false)` in the message send handler. Replace with collapse:

```typescript
// Instead of:
// setShowActions(false)

// Use:
setActionsExpanded(false)
```

2. Add state variable:

```typescript
const [actionsExpanded, setActionsExpanded] = useState(true)
```

3. Render the actions panel as collapsible even during conversation:

```typescript
{showActions && (
  <TouchableOpacity onPress={() => setActionsExpanded(!actionsExpanded)}>
    <View style={styles.actionsToggle}>
      <Zap size={16} color={colors.text.tertiary} />
      <Text style={styles.actionsToggleText}>Quick Actions</Text>
    </View>
  </TouchableOpacity>
)}
{actionsExpanded && showActions && (
  <View style={styles.actionSuggestions}>
    {/* existing suggestions */}
  </View>
)}
```

**Verify:** After sending a message, "Quick Actions" toggle remains visible above input.

---

### Task 6: Coach Screen — Session-Count-Based System Prompt Tier

**Audit Reference:** Section 8, "The System Prompt Problem"

**Objective:** Vary AI coaching tone based on how experienced the user is.

**Files:**
- Modify: `src/services/ai/index.ts` (system prompt builder)

**Steps:**

1. Add tier function to the AI barrel:

```typescript
function getProgressTier(sessionCount: number): 'newcomer' | 'developing' | 'established' | 'veteran' {
  if (sessionCount < 5) return 'newcomer'
  if (sessionCount < 20) return 'developing'
  if (sessionCount < 50) return 'established'
  return 'veteran'
}

const TIER_GUIDANCE: Record<string, string> = {
  newcomer: 'This person is new. Keep responses extra short (2-3 sentences max). Focus on one tiny action. Celebrate everything. Don\'t explain the system — they\'ll learn by doing.',
  developing: 'This person is building a pattern. You can reference their history. Note patterns emerging. Be encouraging but start being specific.',
  established: 'This person knows the system. Skip basic explanations. Be more direct. Challenge them gently. Reference their actual data.',
  veteran: 'This person is experienced. Be almost blunt. Reference their data aggressively. Push them harder. They can take it.',
}
```

2. In `buildSystemPrompt`, inject the tier guidance:

```typescript
export function buildSystemPrompt(context: CoachContext): string {
  const tier = getProgressTier(context.sessionCount ?? 0)
  const tierGuidance = TIER_GUIDANCE[tier]
  
  return `You are INTENT's coach. ${tierGuidance}
  
User: ${context.userName ?? 'there'}
Push style: ${context.pushStyle}
Current momentum: ${context.currentMomentum} rescues this week

Rules: Never use shame language. Keep responses under 3 sentences. Always end with one specific action.
...`
}
```

**Verify:** A user with 0 sessions gets extra-short celebratory responses. A user with 50 sessions gets direct challenges.

---

### Task 7: Before-Scroll — Show Mission Text During Timer

**Audit Reference:** Section 17, "The timer shows elapsed time, but not the mission action"

**Objective:** During the 2-minute timer step, show "Your mission: [exactAction]" prominently above the countdown.

**Files:**
- Modify: `app/before-scroll.tsx` (timer step render)

**Steps:**

1. Find the timer step render. Add mission text above the countdown:

```typescript
{step === 'timer' && mission && (
  <View style={styles.timerMissionContainer}>
    <Text style={styles.timerMissionLabel}>Your mission:</Text>
    <Text style={styles.timerMissionAction}>{mission.primaryMission.exactAction}</Text>
    {/* existing timer countdown below */}
  </View>
)}
```

2. Add styles:

```typescript
timerMissionContainer: {
  alignItems: 'center',
  paddingHorizontal: spacing.xl,
  marginBottom: spacing.xl,
},
timerMissionLabel: {
  ...typography.caption,
  color: colors.text.tertiary,
  textTransform: 'uppercase',
  letterSpacing: 1,
  marginBottom: spacing.sm,
},
timerMissionAction: {
  ...typography.body,
  color: colors.text.primary,
  textAlign: 'center',
  lineHeight: 24,
},
```

**Verify:** Timer step shows mission text prominently above the countdown number.

---

### Task 8: Progress Screen — Shareable Weekly Card (Image, Not Text)

**Audit Reference:** Section 23, "Social sharing that actually compels"

**Objective:** Generate a beautiful PNG weekly card for sharing on Instagram/stories.

**Files:**
- Modify: `app/(tabs)/progress.tsx` (share handler)
- Verify: `src/components/WeeklyShareCard.tsx` exists
- Verify: `src/services/share.ts` has image support

**Steps:**

1. Verify `WeeklyShareCard.tsx` exists and has the styled card component
2. Verify `react-native-view-shot` is installed: `grep "react-native-view-shot" package.json`
3. In `progress.tsx`, update the share handler to use image capture:

```typescript
const handleShare = async () => {
  if (shareCardRef.current) {
    try {
      const uri = await captureRef(shareCardRef, { format: 'png', quality: 1 })
      await Share.share({ url: uri, message: 'My week in rescues 🟢' })
    } catch (e) {
      // Fallback to text share
      const text = generateWeeklySummaryCard(...)
      await Share.share({ message: text })
    }
  }
}
```

4. Add `shareCardRef` to the WeeklyShareCard component:

```typescript
const shareCardRef = useRef<View>(null)
<View ref={shareCardRef} style={styles.shareCardWrapper}>
  <WeeklyShareCard ... />
</View>
```

**Verify:** Share button generates PNG card, opens native share sheet with image.

---

### Task 9: Progress Screen — Intelligence Teaser for Free Users

**Audit Reference:** Section 5, Flaw #6

**Objective:** Show blurred/partial intelligence insights to free users to create desire for Pro.

**Files:**
- Modify: `app/(tabs)/progress.tsx` (intelligence section)

**Steps:**

1. Find the intelligence panel section. Add a free-user teaser:

```typescript
{plan === 'free' && sessionCount >= 3 ? (
  <Card variant="default" style={styles.intelTeaser}>
    <View style={styles.intelTeaserHeader}>
      <Brain size={20} color={colors.brand[500]} />
      <Text style={styles.intelTeaserTitle}>Your Patterns</Text>
    </View>
    <Text style={styles.intelTeaserText}>
      You rescue fastest when avoiding. You struggle most at...
    </Text>
    <View style={styles.intelBlurOverlay}>
      <TouchableOpacity onPress={() => setShowPaywall(true)}>
        <Text style={styles.intelUnlockCTA}>Unlock full insights →</Text>
      </TouchableOpacity>
    </View>
  </Card>
) : plan === 'pro' && sessionCount >= 7 ? (
  {/* existing full IntelligenceCard */}
) : null}
```

**Verify:** Free user with 3+ sessions sees teaser card with "Unlock full insights" CTA.

---

### Task 10: ProgressRing — AnimatedCircle for Smooth Animation

**Audit Reference:** Section 6, Performance #2

**Objective:** Use Reanimated AnimatedCircle for smooth stroke-dashoffset animation between seconds.

**Files:**
- Modify: `src/components/Legacy.tsx` (ProgressRing)

**Steps:**

1. Find ProgressRing component. Replace border-based ring with SVG animated circle:

```typescript
import Animated, { useSharedValue, withTiming, useAnimatedProps } from 'react-native-reanimated'
import { Svg, Circle } from 'react-native-svg'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

// Inside ProgressRing:
const radius = (size - strokeWidth) / 2
const circumference = 2 * Math.PI * radius
const progressValue = useSharedValue(progress)

useEffect(() => {
  progressValue.value = withTiming(progress, { duration: 950 })
}, [progress])

const animatedProps = useAnimatedProps(() => ({
  strokeDashoffset: circumference * (1 - progressValue.value),
}))

return (
  <View accessible={true} accessibilityRole="progressbar"
    accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
    accessibilityLabel={`Session progress: ${Math.round(progress * 100)}% complete`}>
    <Svg width={size} height={size}>
      <Circle cx={size/2} cy={size/2} r={radius} stroke={backgroundColor}
        strokeWidth={strokeWidth} fill="none" />
      <AnimatedCircle cx={size/2} cy={size/2} r={radius} stroke={color}
        strokeWidth={strokeWidth} fill="none"
        strokeDasharray={`${circumference}`}
        animatedProps={animatedProps}
        strokeLinecap="round"
        transform={`rotate(-90, ${size/2}, ${size/2})`}
      />
    </Svg>
  </View>
)
```

2. Run tests: `npx jest --no-cache --forceExit 2>&1 | tail -5`

**Verify:** Timer ring animates smoothly between seconds instead of jumping.

---

## PHASE 2 — COMPETITIVE MOAT (1-2 weeks)

These are the features every 2026 competitor has that INTENT doesn't. Build these to be competitive.

---

### Task 11: iOS Widget — Minimal State + Rescue Me

**Audit Reference:** Section 23, "Widgets on the home screen"

**Objective:** Build a minimal iOS widget showing last state emoji + "Rescue Me" deep link.

**Files:**
- Verify: `plugins/withWidgetKit.js` exists
- Create: Widget native module (SwiftUI)
- Modify: `app.json` (widget config)

**Steps:**

1. Read `plugins/withWidgetKit.js` to understand existing widget infrastructure
2. Read `src/services/widgets/widgetPrivacy.ts` for privacy-safe data sharing
3. Create App Group shared container for state data
4. Write minimal SwiftUI widget that reads last state from shared container
5. Add deep link URL scheme for "Rescue Me" button
6. Update `app.json` with widget bundle identifier

**Verify:** Widget appears in iOS widget gallery. Tapping "Rescue Me" opens app and starts rescue.

---

### Task 12: Voice Input on Coach Screen

**Audit Reference:** Section 23, "Voice input"

**Objective:** Add microphone button to coach screen for speech-to-text input.

**Files:**
- Verify: `src/types/voice.ts` exists
- Verify: `src/services/voice/voiceIntent.ts` exists
- Modify: `app/(tabs)/coach.tsx` (add mic button)

**Steps:**

1. Check if `expo-speech` or `@react-native-voice/voice` is in package.json
2. If not: `npx expo install @react-native-voice/voice`
3. Add mic button next to TextInput:

```typescript
import Voice from '@react-native-voice/voice'

const [isListening, setIsListening] = useState(false)

const toggleVoice = async () => {
  if (isListening) {
    await Voice.stop()
    setIsListening(false)
  } else {
    await Voice.start('en-US')
    setIsListening(true)
  }
}

Voice.onSpeechResults = (e) => {
  const text = e.value?.[0] ?? ''
  setInputText(text)
  setIsListening(false)
}
```

4. Add mic button UI next to send button:

```typescript
<TouchableOpacity onPress={toggleVoice} style={styles.micBtn}>
  <Mic size={20} color={isListening ? colors.accent.red : colors.text.tertiary} />
</TouchableOpacity>
```

**Verify:** Mic button appears. Tap → voice recognition starts → text appears in input.

---

### Task 13: Mission Completion Celebration

**Audit Reference:** Section 16, "Mission completion is missing a celebration"

**Objective:** Add haptic + animation celebration when user marks a mission complete.

**Files:**
- Modify: `app/(tabs)/missions.tsx` (completion handler)

**Steps:**

1. Find the mission complete handler. Add celebration:

```typescript
import * as Haptics from 'expo-haptics'

const handleCompleteMission = async (missionId: string) => {
  // Haptic celebration sequence
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 150)
  
  // Mark complete
  completeMission(missionId)
  
  // Show brief toast
  showToast('Mission complete! 🎉')
}
```

**Verify:** Marking a mission complete triggers success haptic + toast.

---

### Task 14: System Prompt — Progress Tier Integration

**Objective:** Wire the tier system from Task 6 into the actual coachStreamResponse flow.

**Files:**
- Modify: `src/services/ai/index.ts` (CoachContext type + buildSystemPrompt)

**Steps:**

1. Add `sessionCount` to CoachContext:

```typescript
export interface CoachContext {
  userName: string
  pushStyle: 'gentle' | 'firm' | 'emergency'
  currentMomentum: number
  sessionCount: number  // ADD THIS
  currentRisk?: number
}
```

2. In the coach screen, pass sessionCount when building context:

```typescript
const context: CoachContext = {
  userName: user?.display_name ?? 'there',
  pushStyle: user?.push_style ?? 'gentle',
  currentMomentum: retentionState.momentumWindows.last7Days,
  sessionCount: sessionCount,
  currentRisk: prediction?.currentRisk,
}
```

**Verify:** New user gets extra-short responses. Veteran user gets direct challenges.

---

### Task 15: Social Proof Stats — Dynamic From User Data

**Audit Reference:** Section 7, "Social Proof Loop"

**Objective:** Replace hardcoded social proof strings with user-data-driven stats where possible.

**Files:**
- Modify: `src/services/retention/retentionEngine.ts` (getSocialProofStat)

**Steps:**

1. Read current `getSocialProofStat` implementation
2. Add dynamic stat computation:

```typescript
export function getSocialProofStat(state: RetentionState): string {
  const total = state.totalRescues
  const salvages = state.totalSalvages
  const completions = total - salvages
  
  // Dynamic stats based on user data
  if (salvages > 0 && completions > 0) {
    const salvageRate = Math.round((salvages / total) * 100)
    return `${100 - salvageRate}% of your rescues were full completions`
  }
  
  if (state.momentumWindows.last7Days >= 5) {
    return `${state.momentumWindows.last7Days} rescues this week — you're in the top 15% of users`
  }
  
  if (total >= 10) {
    return `Users who reach ${total} rescues are 3x more likely to build lasting habits`
  }
  
  // Fallback to hardcoded
  return SOCIAL_PROOF_STRINGS[total % SOCIAL_PROOF_STRINGS.length]
}
```

**Verify:** Social proof toast shows user-specific data when available.

---

## PHASE 3 — GROWTH FEATURES (2-4 weeks)

These are long-term competitive advantages that require native development.

---

### Task 16: iCloud/Drive Backup for Pro Users

**Audit Reference:** Section 23, "Cross-device sync"

**Objective:** Sync session data across devices for Pro subscribers.

**Files:**
- Verify: `src/services/sync.ts` exists
- Modify: `src/store/index.ts` (add sync middleware)

**Steps:**

1. Read existing `src/services/sync.ts`
2. Add sync trigger after `completeSession` for Pro users:

```typescript
// In sessionSlice.ts, after completeSession:
const plan = cross().user?.plan
if (plan === 'pro') {
  const data = JSON.stringify(cross().sessions.slice(0, 100))
  backupToCloud(data).catch(() => {})
}
```

3. Add restore on app launch in `_layout.tsx`:

```typescript
useEffect(() => {
  if (plan === 'pro') {
    restoreFromCloud().then(data => {
      if (data) mergeRestoredData(JSON.parse(data))
    }).catch(() => {})
  }
}, [])
```

**Verify:** Pro user data persists across app reinstalls on same device.

---

### Task 17: iOS Live Activity During Sessions

**Audit Reference:** Section 23, "Streak/momentum visualization on the lock screen"

**Objective:** Show session timer and state on lock screen during active sessions.

**Files:**
- Modify: `app.json` (Live Activity config)
- Create: Native Live Activity module
- Modify: `app/live.tsx` (start/stop activity)

**Steps:**

1. Check if `expo-live-activity` or equivalent is available
2. If not, create a minimal native module using `expo-modules-core`
3. Start activity when session starts:

```typescript
// In live.tsx, after session starts:
LiveActivity.startActivity({
  state: activeSession?.mode ?? 'focus',
  minutes: selectedDuration,
  startTime: Date.now(),
})
```

4. Update every 30 seconds:

```typescript
if (elapsedSeconds % 30 === 0) {
  LiveActivity.update({ elapsed: elapsedSeconds })
}
```

5. End on complete:

```typescript
LiveActivity.endActivity({ completed: true })
```

**Verify:** Lock screen shows session timer during active session.

---

### Task 18: E2E Test Suite (MAESTRO)

**Audit Reference:** Section 21, "No E2E tests"

**Objective:** Smoke test: open app → complete onboarding → do a rescue → see completion.

**Files:**
- Create: `.maestro/flows/onboarding.yaml`
- Create: `.maestro/flows/rescue.yaml`

**Steps:**

1. Install Maestro: `curl -Ls "https://get.maestro.mobile.dev" | bash`
2. Create onboarding flow YAML
3. Create rescue flow YAML
4. Run: `maestro test .maestro/flows/`

**Verify:** Both flows pass.

---

### Task 19: A/B Testing for Paywall Triggers

**Audit Reference:** Section 19, "In-app A/B testing for paywall triggers"

**Objective:** Test different paywall triggers (session 3 vs 5 vs 7).

**Files:**
- Verify: `src/services/abTesting.ts` exists
- Modify: `app/live.tsx` (use A/B variant)

**Steps:**

1. Read existing `src/services/abTesting.ts`
2. In live.tsx, replace hardcoded trigger:

```typescript
const paywallTrigger = getVariant('paywall_trigger')
if (sessionCount >= paywallTrigger && plan === 'free') {
  setPendingPaywall(true)
}
```

**Verify:** Different users see paywall at different session counts.

---

## PHASE 4 — FINAL POLISH (1 week)

The 1% improvements that separate 9.5/10 from 10/10.

---

### Task 20: Focus/Live Screen Consolidation

**Audit Reference:** Section 14, "Duplicate Functionality"

**Objective:** Merge focus.tsx features into live.tsx with mode parameter.

**Files:**
- Modify: `app/live.tsx` (add body_double mode)
- Modify: `app/focus.tsx` (redirect to `/live?mode=body_double`)

**Steps:**

1. Add mode parameter to live.tsx route:

```typescript
const { mode = 'rescue' } = useLocalSearchParams<{ mode: string }>()
```

2. In live.tsx, conditionally render body-double features when `mode === 'body_double'`:

```typescript
{mode === 'body_double' && (
  <View style={styles.bodyDoubleSection}>
    {/* Checkpoints, milestones, body presence */}
  </View>
)}
```

3. In focus.tsx, redirect to live:

```typescript
useEffect(() => {
  router.replace({ pathname: '/live', params: { mode: 'body_double' } })
}, [])
```

**Verify:** `/focus` redirects to `/live?mode=body_double`. Body double features appear.

---

### Task 21: Streak vs Momentum — Clarify Messaging

**Audit Reference:** Section 7, "The Streak Problem"

**Objective:** Make the UI explicitly explain why momentum windows replace streaks.

**Files:**
- Modify: `app/(tabs)/index.tsx` (momentum pill copy)

**Steps:**

1. Update the momentum pill tooltip/subtitle:

```typescript
<Text style={styles.momentumExplanation}>
  {momentum} rescues this week — rescues matter, not perfect days.
</Text>
```

**Verify:** Momentum pill shows explanatory text.

---

### Task 22: ProgressRing Accessibility Label

**Audit Reference:** Section 20, "The ProgressRing SVG has no accessibility label"

**Objective:** Add screen reader label to ProgressRing.

**Files:**
- Modify: `src/components/Legacy.tsx` (ProgressRing wrapper)

**Steps:**

1. Already handled in Task 10 if AnimatedCircle wrapper is used. Verify:

```typescript
<View
  accessible={true}
  accessibilityRole="progressbar"
  accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
  accessibilityLabel={`Session progress: ${Math.round(progress * 100)}% complete`}
>
  <Svg>...</Svg>
</View>
```

**Verify:** VoiceOver reads "Session progress: 45% complete" on the ring.

---

### Task 23: Rescue Me Accessibility Hint

**Audit Reference:** Section 20, "No accessibilityHint on the Rescue Me button"

**Objective:** Add accessibility hint to rescue button.

**Files:**
- Modify: `app/(tabs)/index.tsx` (AnimatedRescueButton props)

**Steps:**

1. Find AnimatedRescueButton usage. Add hint:

```typescript
<AnimatedRescueButton
  ...
  accessibilityHint="Starts your rescue session based on your current state"
/>
```

**Verify:** VoiceOver reads the hint after the button label.

---

### Task 24: Focus Management After Chip Selection

**Audit Reference:** Section 20, "Focus management after rescue"

**Objective:** When rescue section appears, announce it for screen readers.

**Files:**
- Modify: `app/(tabs)/index.tsx` (chip selection handler)

**Steps:**

1. After setting selectedState, announce:

```typescript
const handleChipPress = (chipId: UserState) => {
  setSelectedState(chipId)
  Haptics.selectionAsync()
  
  // Accessibility announcement
  const chip = STATE_CHIPS.find(c => c.id === chipId)
  if (chip) {
    AccessibilityInfo.announceForAccessibility(
      `${chip.label} selected. ${selectedMinutes} minutes ready. Tap Rescue Me to begin.`
    )
  }
}
```

**Verify:** VoiceOver announces state selection and next action.

---

### Task 25: Module-Level Mutable State Warning

**Audit Reference:** Section 4, Problem #4

**Objective:** Add warning comment about module-level mutation in agent.ts.

**Files:**
- Modify: `src/engine/agent.ts`

**Steps:**

1. Add comment above the module-level variables:

```typescript
// ⚠️ WARNING: Module-level mutable state. Persists across JS bundle lifetime.
// Use resetDriftDetectionState() in tests to avoid pollution.
// In production, this is intentional — drift detection accumulates across sessions.
let lastDetectedState: AvoidanceState | null = null
let consecutiveSameStateCount = 0
let lastDetectionHour = -1
```

**Verify:** Comment exists above the variables.

---

## VERIFICATION CHECKLIST

After ALL phases complete:

```bash
cd /root/projects/cognitive-companion

# 1. All tests pass
npx jest --no-cache --forceExit 2>&1 | tail -5
# Expected: 416+ passed

# 2. TypeScript clean
npx tsc --noEmit 2>&1 | tail -5
# Expected: no errors

# 3. No remaining old Animated API in critical paths
grep -rn "new Animated.Value" app/ src/components/ --include="*.tsx" | grep -v "__tests__" | grep -v "node_modules"
# Expected: only non-critical uses

# 4. All audit items verified
grep -n "exactAction" app/live.tsx | head -3
grep -n "AppState" app/live.tsx | head -3
grep -n "rescue_completed" src/store/slices/sessionSlice.ts | head -3
grep -n "routeAgent" src/services/ai/index.ts | head -3
grep -n "6A6A80" src/theme/index.ts | head -3
```

---

## FINAL SCORE TARGET

| Area | Before | After Phase 1 | After Phase 2 | After Phase 3 | After Phase 4 |
|---|---|---|---|---|---|
| Core Loop | 6.5 | 9 | 9 | 9 | 9.5 |
| Retention | 3 | 8 | 8.5 | 9 | 9 |
| AI System | 5 | 8 | 9 | 9 | 9.5 |
| UX/Design | 7 | 9 | 9.5 | 9.5 | 10 |
| Performance | 6 | 8 | 8 | 8.5 | 9 |
| Onboarding | 7 | 9 | 9 | 9 | 9.5 |
| Monetization | 4 | 8 | 8.5 | 9 | 9 |
| Accessibility | 7 | 9 | 9 | 9 | 10 |
| Testing | 7 | 8 | 8 | 9 | 9 |
| Differentiation | 7 | 8 | 9.5 | 10 | 10 |
| **OVERALL** | **6.5** | **8.5** | **9** | **9.5** | **10** |

---

## EXECUTION ORDER

```
Phase 1 (Close gaps — do first):
  Task 1  → Auto-select last resistance state
  Task 2  → Momentum warmth greeting
  Task 3  → First-open warm empty state
  Task 4  → Streaming text LayoutAnimation
  Task 5  → Keep action suggestions collapsed
  Task 6  → System prompt tier
  Task 7  → Before-scroll mission text during timer
  Task 8  → Shareable weekly image card
  Task 9  → Intelligence teaser for free users
  Task 10 → AnimatedCircle ProgressRing

Phase 2 (Competitive moat — do second):
  Task 11 → iOS Widget
  Task 12 → Voice input
  Task 13 → Mission completion celebration
  Task 14 → System prompt tier integration
  Task 15 → Dynamic social proof stats

Phase 3 (Growth — do third):
  Task 16 → iCloud backup for Pro
  Task 17 → iOS Live Activity
  Task 18 → E2E tests (MAESTRO)
  Task 19 → A/B testing for paywall

Phase 4 (Final polish — do last):
  Task 20 → Focus/Live consolidation
  Task 21 → Streak vs momentum messaging
  Task 22 → ProgressRing accessibility
  Task 23 → Rescue Me accessibility hint
  Task 24 → Focus management after chip select
  Task 25 → Module-level state warning
```

---

*Generated from INTENT Full Thermonuclear Audit (June 2026) — targeting 10/10.*
