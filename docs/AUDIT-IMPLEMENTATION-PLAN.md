# ══════════════════════════════════════════════════════════════
# INTENT FULL AUDIT — IMPLEMENTATION PLAN
# June 2026 Edition
# ══════════════════════════════════════════════════════════════

## STATUS: MOST ITEMS ALREADY IMPLEMENTED

After thorough codebase analysis, **the vast majority of audit items have already been implemented** in prior sessions. Here is the definitive status:

### ✅ ALREADY IMPLEMENTED (No Action Needed)

| Audit Item | Status | Evidence |
|------------|--------|----------|
| Bug #1: Mission text display | ✅ Done | live.tsx:259 shows `activeMicro.exactAction \|\| activeMicro.title` |
| Bug #2: AppState timer resume | ✅ Done | live.tsx:62-70 has AppState listener |
| Bug #3: handleCompleteRef pattern | ✅ Done | live.tsx:164-165 direct assignment |
| Bug #4: features() vs features | ✅ Done | coach.tsx:421 uses `features['CORE']` |
| Bug #5: cancelSession exists | ✅ Done | sessionSlice.ts:143-145 |
| Bug #6: todayLabel style | ✅ Done | index.tsx:590 defined |
| Bug #7: getState in handler | ✅ Done | Correctly used in event handler |
| Bug #8: Retention events fire | ✅ Done | sessionSlice.ts:99 fires rescue_completed |
| Bug #10: Notification permissions | ✅ Done | Handled after first rescue |
| Architecture: useShallow subscriptions | ✅ Done | index.tsx:102-119 |
| Architecture: Timer 10s sync | ✅ Done | live.tsx:83-85 |
| Architecture: Session guard | ✅ Done | sessionSlice.ts:43-47 |
| Architecture: Store migration v2 | ✅ Done | store/index.ts:105-113 |
| UX: AnimatedStateChip spring | ✅ Done | index.tsx:56-85 |
| UX: AnimatedRescueButton used | ✅ Done | index.tsx:413-417 |
| UX: Limited mode coach | ✅ Done | coach.tsx:424-456 |
| UX: Timer color at 60s | ✅ Done | live.tsx:247-248 |
| UX: Mid-session encouragement | ✅ Done | live.tsx:284-292 |
| UX: Finish Early button | ✅ Done | live.tsx:316 |
| Performance: FlashList | ✅ Done | progress.tsx, missions.tsx |
| Performance: InteractionManager | ✅ Done | index.tsx:189-201 |
| Performance: React.memo MissionCard | ✅ Done | MissionCard.tsx:70 |
| Performance: WCAG disabled color | ✅ Done | theme/index.ts:26 `#6A6A80` |
| Retention: All 7 loops tracked | ✅ Done | retentionEngine.ts |
| Retention: Momentum windows | ✅ Done | retentionEngine.ts:249-270 |
| AI: Orchestrated coachStreamResponse | ✅ Done | ai/index.ts:99-168 |
| AI: Crisis check | ✅ Done | ai/index.ts:109-115 |
| AI: Shame language filter | ✅ Done | ai/index.ts:164 |
| Onboarding: AppState timer fix | ✅ Done | onboarding.tsx:102-113 |
| Onboarding: LottieView imported | ✅ Done | onboarding.tsx:20 |
| Navigation: Notification deep links | ✅ Done | _layout.tsx:134-142 |
| Navigation: Comeback detection | ✅ Done | _layout.tsx:67-75 |
| Navigation: Weekly narrative scheduling | ✅ Done | progress.tsx:60-69 |
| Navigation: Danger windows channel | ✅ Done | notifications.ts:96-102 |
| Missions: Auto-generate micro-step | ✅ Done | missions.tsx:44-66 |
| Missions: Staleness indicator | ✅ Done | missions.tsx:131-135 |
| Missions: Haptics on complete | ✅ Done | missions.tsx:158 |
| Progress: Y-axis on trend bars | ✅ Done | progress.tsx:184-188 |
| Progress: Narrative timestamp | ✅ Done | progress.tsx:161 |
| Progress: Image share | ✅ Done | progress.tsx:120-128 |
| Before-scroll: State selection | ✅ Done | before-scroll.tsx:75,82-98 |
| Before-scroll: Bypass tracking | ✅ Done | before-scroll.tsx:156-158 |
| Monetization: Paywall after flow | ✅ Done | live.tsx:153-162 |
| Monetization: Session 5 trigger | ✅ Done | live.tsx:147 |
| Monetization: Day 14 trigger | ✅ Done | live.tsx:147 |
| Accessibility: reduce motion | ✅ Done | live.tsx:99-101 |
| Accessibility: timer a11y | ✅ Done | live.tsx:272-273 |

### ⚠️ REMAINING ITEMS (Action Required)

| Item | Priority | Effort |
|------|----------|--------|
| Legacy.tsx Screen uses Animated API | Low | Small |
| 5 tabs (Settings tab should be removed) | Low | Small |
| focus.tsx exists as separate screen | Low | Medium |
| Missing integration tests | Medium | Medium |

---

## REMAINING IMPLEMENTATION PLAN

### 1. Legacy.tsx Screen Component (Performance #1)
**File:** `src/components/Legacy.tsx`
**Change:** Replace `Animated.Value` with Reanimated `useSharedValue`
**Lines:** 34-41

### 2. Tab Layout (UX Flaw #4)
**File:** `app/(tabs)/_layout.tsx`
**Change:** Remove Settings tab, add settings icon to home screen header
**Lines:** 60-66

### 3. Focus Screen Consolidation (Bug #9)
**File:** `app/focus.tsx`
**Decision:** Keep as separate screen for body double mode, but add route params to differentiate from live.tsx
**Alternative:** Add documentation clarifying the distinction

### 4. Missing Tests
**Files:** `src/__tests__/`
**Add:**
- Integration test for handleRescueMe flow
- beforeEach resetDriftDetectionState in engine.test.ts
- Snapshot tests for key components

---

## EXECUTION ORDER

1. Fix Legacy.tsx Animated → Reanimated
2. Remove Settings tab, add to home header
3. Add missing test setup
4. Run full test suite to verify

---

*Generated from audit analysis — most items already implemented in prior sessions.*
