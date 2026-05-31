# INTENT APP — THERMO-NUCLEAR AUDIT PART 2
## The Systems, Soul, and Missing Pieces

**Generated:** May 27, 2026
**Current Rating:** 6.5/10
**Target Rating:** 10/10

---

## EXECUTIVE SUMMARY

INTENT is a technically sophisticated anti-avoidance agent app with strong domain models (drift detection, salvage engine, predictive intelligence, privacy architecture). But it's built like an engineer's app, not a human's app. The experience layer — first 60 seconds, daily hooks, visual beauty, emotional connection, social proof, narrative — is underdeveloped.

**Core Problem:** Engine without a soul. All machinery, no magic.

**The Shift Needed:** From 70% engineering / 30% experience → 40% engineering / 60% experience.

---

## NINE PILLARS OF ANALYSIS

### PILLAR 1: THE FIRST 60 SECONDS (Onboarding Gap)

**Current:** 5 steps: Welcome → Name → State → Rescue (2-min timer) → Complete

**Problems:**
- No "Aha Moment" compression — value takes ~2 minutes to deliver
- Name field comes BEFORE value (friction)
- State selection asks users to self-diagnose before trust is built
- No personality hook (no companion, no character, no entity)
- No micro-commitment before real commitment

**Fixes:**
1. Auto-detect state from time of day (TIME_PROFILES already exist)
2. Show value FIRST: *"Rescue 2 minutes. Right now."* → One tap → Timer
3. Move name field AFTER first rescue
4. Add a "Guardian" personality entity
5. Add social proof line on welcome screen
6. Target: First rescue in <15 seconds from app open

---

### PILLAR 2: THE DAILY HOOK (Why Open Tomorrow?)

**Current:** Same experience every day — greeting, stats, state chips, rescue button

**Problems:**
- No novelty, no discovery, no anticipation
- No morning/evening ritual
- Notifications are generic and fixed-time
- No daily challenge system
- No variable reward schedule

**Fixes:**
1. **Morning Intention** (8-10am): *"What's the ONE thing you want to rescue today?"*
2. **Evening Reflection** (8-10pm): *"You rescued [X] minutes. How does that feel?"*
3. **Daily Challenge**: Single achievable challenge from pattern data
4. **Surprise Insights**: 30% chance on app open of pattern discovery
5. **Danger-window-timed notifications**: Send 5 min before predicted danger window
6. **Curiosity-gap notifications**: *"We noticed something about your 3pm pattern..."*

---

### PILLAR 3: THE VISUAL EXPERIENCE (Dashboard vs App)

**Current:** Functional but static. Emotional colors applied as border colors.

**Problems:**
- No emotional design language (UI doesn't shift with state)
- No microinteractions that feel alive
- No typography personality
- Home screen is a dashboard, not an experience
- Rescue button doesn't pulse/breathe/live

**Fixes:**
1. **Ambient background**: Full-screen living color field based on detected state
2. **State-responsive layout**: Overwhelmed = fewer options, Ready = compact action-dense
3. **Microinteractions**: State chip animations, momentum counter ticking, rescue button breathing
4. **Organic celebration**: Ink bloom / warm glow after rescue (not fireworks)
5. **Distinctive typography**: Display font for greetings, letter-typeset insights
6. **Large prominent numbers**: "47 minutes rescued" should feel like an achievement

---

### PILLAR 4: THE RETENTION ENGINE (Good Bones, Missing Meat)

**Current:** 7 loops tracked (rescue, insight, comeback, momentum, revelation, context, social proof)

**Problems:**
- Loops are passive — track events but don't CREATE return reasons
- No variable reward schedule
- No social/community layer
- No commitment devices
- Streak protection notification is guilt-based

**Fixes:**
1. **Variable rewards**: 30% surprise insights, unlockable content every 5th rescue
2. **Streak milestones with unlocks**: 7 days → "Streak Guardian" mode, 14 days → "Deep Focus", 30 days → "Mastery"
3. **Ambient social counter**: "847 people rescuing right now"
4. **Rescue Circles** (opt-in): Groups of 5-10 anonymous users, mutual rescue visibility
5. **Rescue Pacts**: User sets weekly commitment, gentle accountability
6. **Shareable rescue cards**: Beautiful post-rescue cards worth sharing
7. **Guilt-free streak messaging**: "rescues matter, not perfect days"

---

### PILLAR 5: THE AI EXPERIENCE (Smart But Invisible)

**Current:** Anthropic Claude streaming chat, local fallback, safety gates, coach policy

**Problems:**
- No consistent AI personality (tone settings ≠ personality)
- AI only responds, never initiates
- No persistent conversation memory
- No on-device AI (fully remote-dependent)
- Generic system prompts

**Fixes:**
1. **AI Name & Identity**: "Anchor" or "Guardian" — consistent entity
2. **Persistent AI Memory**: Reference past conversations
3. **Proactive AI**: Ambient nudges based on danger windows
4. **Post-rescue intelligence**: 1-sentence observation after every rescue
5. **Weekly AI Letter**: Personalized narrative letter from the AI
6. **On-device AI**: ExecuTorch for state classification, sentiment, simple responses
7. **AI opinions & quirks**: *"I've noticed you always avoid on Tuesdays. I'm watching."*

---

### PILLAR 6: THE MISSION SYSTEM (Functional But Not Compelling)

**Current:** Mission creation, AI breakdown, micro-missions, multi-candidate selection, salvage

**Problems:**
- Missions feel like tasks (and tasks are the enemy for ADHD users)
- No narrative layer
- No difficulty calibration visible to user
- No "stuck" intervention during missions
- Mission creation is too complex

**Fixes:**
1. **Journey view**: Show the history of attempts, struggles, progress
2. **Mission as quest**: Frame missions as chapters in a story
3. **Visible calibration**: *"Based on your patterns, suggesting 3 minutes instead of 10"*
4. **In-mission stuck detection**: If no interaction for 60s, offer smaller version
5. **Rapid distraction pivot**: If 3+ distractions in 2 min, offer brain dump instead
6. **Post-mission story**: *"That was your 3rd attempt. The first time you got stuck at 'open document.' Today you completed 12 minutes."*

---

### PILLAR 7: THE PROGRESS SYSTEM (Data Without Story)

**Current:** Weekly narrative, 4-week trend, resistance analysis, intelligence panel, heatmap

**Problems:**
- Data dump, not a story
- No comparative intelligence
- No long-term visualization
- Weekly story is secondary, not primary
- No "character arc" view

**Fixes:**
1. **Story-first progress**: Make narrative the PRIMARY view
2. **Character arc**: *"Week 1: avoiding 60% of the time. Week 4: 35%. You're becoming a different person."*
3. **Comparative intelligence**: *"Your rescue rate is 67%. Top 30% of INTENT users."*
4. **Growth curve**: Cumulative rescued minutes over time with milestones
5. **State evolution chart**: How most-common state changed over time
6. **Journey map**: Scrollable timeline of every rescue, pattern, milestone

---

### PILLAR 8: TECHNICAL GAPS (Code Quality)

**File Size Violations (all >700 lines):**
- `app/(tabs)/index.tsx`: 809 lines → decompose
- `app/(tabs)/coach.tsx`: 904 lines → decompose
- `app/live.tsx`: 719 lines → decompose
- `app/onboarding.tsx`: 984 lines → decompose
- `src/engine/agent.ts`: 716 lines → decompose
- `src/engine/predictiveEngine.ts`: 705 lines → decompose
- `src/engine/antiAvoidance.ts`: 599 lines → decompose
- `src/services/retention/retentionEngine.ts`: **1055 lines** → CRITICAL, split into 4 modules

**Module-Level Mutable State:**
- `agent.ts`: lastDetectedState, consecutiveSameStateCount, lastDetectionHour
- `missionEngines.ts`: activeWeights, outcomeHistory
- `retentionEngine.ts`: retentionStorage
→ Move to DI or store

**Dead/Stubbed Code:**
- `analytics.ts`: 6+ no-op functions (~80 lines dead code)
- `services/abTesting.ts`: unclear if wired
- Unused type exports

**Duplicate Patterns:**
- State chips in 3 places (types/index.ts, index.tsx, onboarding.tsx)
- Time-of-day profiles in agent.ts AND predictiveEngine.ts
- Mission compilation in missionCompiler.ts AND inline in screens

**Store Issues:**
- Cloud sync duplicates partialize logic (maintenance bomb)
- resetState doesn't clear all slices consistently
- No optimistic updates for AI calls

---

### PILLAR 9: MARKET POSITIONING

**June 2026 Competitive Landscape:**
- Finch: Gamified pet, 10M+ downloads, TikTok viral
- Forest: Focus timer, 50M+ downloads
- Habitica: RPG gamification, 5M+ downloads
- Tiimo: Visual planner, accessibility-first
- Inflow: Real ADHD coaching, premium

**INTENT's Problem:** Positioning is INTELLECTUAL. "Anti-drift agent" appeals to people who already understand avoidance psychology.

**Fix:**
- Reframe around "rescue" — emotional, urgent, clear
- Tagline: *"Rescue your time. 2 minutes at a time."*
- Core loop: Open → See what you're avoiding → One tap → Timer → Done
- Kill complexity for new users: Hide missions/progress/coach for first 7 days

---

## SEVEN NEW SYSTEMS TO BUILD

### SYSTEM 1: ENGAGEMENT LOOP ENGINE
```
engagementLoop/
├── morningIntention.ts      // Daily "what will you rescue today?"
├── eveningReflection.ts     // Daily "how did it go?"
├── dailyChallenge.ts        // Single daily challenge
├── surpriseInsight.ts       // 30% chance of discovery moment
├── unlockableContent.ts     // New strategies/protocols that unlock
├── streakMilestones.ts      // Milestones with real rewards
└── variableReward.ts        // Randomized reward scheduling
```

### SYSTEM 2: NARRATIVE ENGINE
```
narrativeEngine/
├── dailyNarrative.ts        // "Today's chapter"
├── weeklyStory.ts           // (exists, enhance)
├── characterArc.ts          // Long-term personality evolution
├── milestoneNarrative.ts    // Story-driven milestone moments
├── comebackNarrative.ts     // Comeback as hero's journey
└── patternRevelation.ts     // "We discovered something about you"
```

### SYSTEM 3: SOCIAL PROOF ENGINE
```
socialProof/
├── ambientCounter.ts        // "X people rescuing right now"
├── rescueHeatmap.ts         // Global rescue activity visualization
├── anonymousStats.ts        // Aggregate comparisons
├── shareableCards.ts        // (exists, enhance significantly)
├── rescueCircle.ts          // Small anonymous groups
└── socialCommitment.ts      // Rescue pacts with friends
```

### SYSTEM 4: ADAPTIVE UI ENGINE
```
adaptiveUI/
├── stateResponsiveLayout.ts  // UI adapts to detected emotional state
├── progressiveDisclosure.ts  // Features unlock as user progresses
├── experienceTier.ts          // New/Developing/Established/Veteran UI
├── ambientBackground.ts       // Living color field based on state
└── breatheAnimation.ts        // State-responsive animation timing
```

### SYSTEM 5: MICRO-REWARD ENGINE
```
microRewards/
├── rescueCelebration.ts     // Enhanced completion celebration
├── streakVisual.ts          // Visual streak representation
├── momentumParticles.ts     // Particle effects on key actions
├── progressUnlocks.ts       // Feature/content unlocking
├── surpriseReward.ts        // Random rewards for engagement
└── achievementSystem.ts     // Achievement badges with meaning
```

### SYSTEM 6: OFFLINE-FIRST AI ENGINE
```
offlineAI/
├── onDeviceClassifier.ts    // State classification from text
├── onDeviceResponder.ts     // Simple response generation
├── patternMatcher.ts        // Local pattern matching for suggestions
├── sentimentAnalyzer.ts     // Brain dump sentiment analysis
├── modelManager.ts          // Model download/update management
└── hybridPipeline.ts        // Local-first, remote-enhanced pipeline
```

### SYSTEM 7: RETENTION RECOVERY ENGINE
```
retentionRecovery/
├── lapseDetection.ts        // Detect when a user is lapsing
├── reengagementSequence.ts  // Multi-touch re-engagement
├── comebackExperience.ts    // Special experience for returning users
├── guiltFreeReturn.ts       // Remove shame from coming back
└── diminishingNotifications.ts // Gradually reduce notification frequency
```

---

## IMPLEMENTATION PRIORITY

### TIER 0 — CRITICAL (Ship Blockers)
1. Onboarding compression (3 steps, <15s to first rescue)
2. Home screen decomposition (809 → <400 per file)
3. Retention engine decomposition (1055 → <400 per file)
4. Daily hook system (morning/evening/challenge)
5. Variable reward system (surprises + unlocks)
6. Adaptive UI for new users (hide complexity 7 days)

### TIER 1 — HIGH IMPACT
7. Ambient background (state-responsive color)
8. Rescue celebration overhaul (organic, full-screen)
9. Narrative engine (daily + character arc)
10. Social proof counter ("X people rescuing now")
11. Notification personalization (danger-window-timed)
12. AI personality (name, memory, opinions)

### TIER 2 — IMPORTANT (Pre-Launch)
13. Streak visual (non-numeric)
14. Progress screen story-first
15. Micro-interactions (animations, ticking)
16. Shareable rescue cards
17. Comeback experience (guilt-free)
18. Achievement system (meaningful)

### TIER 3 — ENHANCEMENT (Post-Launch)
19. On-device AI (ExecuTorch)
20. Rescue circles (anonymous groups)
21. Commitment devices (pacts)
22. Body double upgrade (real presence)
23. Widget overhaul (one-tap rescue)
24. Watch app

---

## CODEBASE HEALTH SCORECARD

| Category | Score | Notes |
|---|---|---|
| Architecture | 7/10 | Good slice structure, file sizes out of control |
| Type Safety | 8/10 | Strong types, some Record<string, unknown> in orchestrator |
| Test Coverage | 8/10 | 416/416 passing, mostly unit tests |
| Performance | 7/10 | MMKV/FlashList/Reanimated good, home screen recomputes |
| Accessibility | 6/10 | Screen reader exists but incomplete |
| Error Handling | 6/10 | Silent catches everywhere |
| Code Quality | 6/10 | 800+ line files, module-level mutable state, dead code |
| Documentation | 5/10 | Some inline, no architecture docs |
| Offline Support | 5/10 | MMKV offline, AI remote-only |
| Visual Polish | 5/10 | Functional, not beautiful |
| Emotional Design | 4/10 | Colors exist but not felt |
| Social Features | 3/10 | Body double is a label |
| Gamification | 4/10 | Points feel arbitrary |
| AI Personality | 4/10 | Generic, no memory |
| Retention Hooks | 5/10 | Tracked, not created |

**Overall: 6.5/10**

---

## THE 10/10 VISION

**Day 0:** Open → "Rescue 2 minutes" → One tap → Timer → Celebration. No signup.

**Day 1:** "Yesterday you rescued 2 minutes. Today's challenge: 3 minutes." → Tap → Done.

**Day 3:** "We noticed: You rescue best in the morning. 10am completion rate: 80%."

**Day 7:** Full-screen narrative: "Week 1: 14 rescues, 47 minutes. Your most common state was 'avoiding' — but you showed up."

**Day 14:** "1,247 people rescued time this week in your timezone."

**Day 30:** "Month 1: You started as someone who avoided. You're becoming someone who rescues."

**Day 90:** The app isn't a tool. It's part of who the user is.

---

## TWITTER/GITHUB/INTERNET TRENDS (JUNE 2026)

1. **Anti-productivity backlash**: Users tired of gamification-heavy apps. Trend toward "gentle accountability."
2. **AI coach fatigue**: "AI slop" is everywhere. Successful AI is invisible.
3. **Body doubling mainstream**: Expected feature. Real presence > timer label.
4. **Privacy-first selling point**: Local-first architecture is a genuine advantage.
5. **Micro-resolutions viral**: 2-minute commitments are trending. INTENT already does this but buries it.
6. **ExecuTorch RN**: On-device inference now production-ready.
7. **Expo SDK 56 + RN 0.79**: New architecture default. INTENT on right versions.

## RETENTION BENCHMARKS (JUNE 2026)

- Day 1 benchmark: 25-30% (health/fitness)
- Day 7 benchmark: 12-15%
- Day 30 benchmark: 5-8%
- Top 10%: Day 1 = 45%, Day 7 = 25%, Day 30 = 15%

INTENT must target TOP 10% to succeed.
