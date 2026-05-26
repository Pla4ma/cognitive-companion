# INTENT v4 — Architecture Document

**Version:** 4.0 (V2 Completion)
**Updated:** May 25, 2026
**Stack:** Expo SDK 56 · React 19 · TypeScript 5.4 strict · Zustand · MMKV · Sentry
**Bundle ID:** `com.intent.app`
**Source:** 225 files · 43,196 lines TypeScript

---

## 1. The One Sentence

INTENT catches the moment you're about to drift and converts it into one tiny action you can start now — without typing, without setup, without shame.

## 2. The Core Insight

Most productivity apps organize your past (tasks, goals, calendars).
Most focus apps protect your present (timers, blockers, streaks).
INTENT rescues your **next 5 minutes**.

The user never has to plan. They just have to be honest about how they feel right now.

---

## 3. Complete Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        NATIVE SURFACES                               │
│  WidgetKit │ ActivityKit │ App Intents │ Siri Shortcuts │ Deep Links │
│  (service layer complete, native modules for platform integration)   │
├──────────────────────────────────────────────────────────────────────┤
│                        APP LAYER (18 screens)                        │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐                │
│  │  Onboarding  │→│   Rescue    │→│  Live Mission │                │
│  │  (instant)   │  │  (home)     │  │  (timer)      │                │
│  └─────────────┘  └──────┬──────┘  └──────┬───────┘                │
│                          │                 │                         │
│  ┌─────────────┐  ┌──────┴──────┐  ┌──────┴───────┐                │
│  │  Context    │  │  Ambient    │  │  Salvage /    │                │
│  │  Inbox      │  │  Settings   │  │  Complete     │                │
│  └─────────────┘  └─────────────┘  └──────────────┘                │
│                                                                      │
│  + Trust · Memory · Goals · Progress · Settings · Coach · Share      │
│  + Before-Scroll · Ambient-Onboarding · Danger-Window-Editor         │
├──────────────────────────────────────────────────────────────────────┤
│                     FEATURE LAYER (58 files)                         │
│                                                                      │
│  actionHandoffs(7) │ contextInbox(9) │ ambient(5) │ driftMirror(4)  │
│  openLoops(3) │ playbook(3) │ agentRuns(2) │ attentionReceipt(3)    │
│  intentLock(2) │ missionThreads(3) │ momentum(2) │ rescue(3)        │
│  bodyDouble(2) │ beforeScroll(2) │ adaptation(1) │ demo(1)          │
│  widgets(1) │ feedback(1) │ emergencyStart(1) │ liveMission(1)      │
├──────────────────────────────────────────────────────────────────────┤
│                  SHARED COMPONENTS (13 files)                        │
│  Button │ Card │ Chip │ Badge │ Slider │ Toast │ Skeleton            │
│  ProgressRing │ SectionHeader │ EmptyState │ ErrorBoundary           │
├──────────────────────────────────────────────────────────────────────┤
│                    ANTI-DRIFT AGENT (10 files)                       │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  planner.ts → policy.ts → safety.ts → fallbacks.ts → memory  │   │
│  │  tools.ts → prompts.ts → questionPolicy.ts → types.ts        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Pipeline: Classify → Plan → Safety Check → Execute → Learn         │
├──────────────────────────────────────────────────────────────────────┤
│                       ENGINE LAYER (24 files)                        │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐   │
│  │  CORE ENGINES     │  │  PATTERN ENGINES  │  │  FEATURE ENGINES │   │
│  │                   │  │                   │  │                  │   │
│  │  missionCompiler  │  │  predictiveEngine │  │  driftMirror     │   │
│  │  salvageEngine    │  │  personalDrift    │  │  openLoopEngine  │   │
│  │  toolRegistry     │  │  Graph            │  │  attention       │   │
│  │  interceptor      │  │  playbookEngine   │  │  Receipt         │   │
│  │  agent            │  │  intentScore      │  │  emergencyStart  │   │
│  │  safety           │  │  planningLoop     │  │  intentLock      │   │
│  │  commandlessAgent │  │  Detector         │  │  missionThread   │   │
│  │  antiAvoidance    │  │  outcomeEngine    │  │  newUserMagic    │   │
│  │  bodyDoubleEngine │  │                   │  │  mission         │   │
│  │                   │  │                   │  │  Candidate       │   │
│  └──────────────────┘  └──────────────────┘  └─────────────────┘   │
├──────────────────────────────────────────────────────────────────────┤
│                      SERVICE LAYER (67 files)                        │
│                                                                      │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐    │
│  │  AI SERVICES    │  │  VOICE         │  │  NOTIFICATIONS     │    │
│  │  (5 files)      │  │  SERVICES      │  │  (4 files)         │    │
│  │  1,929 lines    │  │  (5 files)     │  │  1,391 lines       │    │
│  │                 │  │  1,364 lines   │  │                    │    │
│  │  orchestrator   │  │                │  │  notifications     │    │
│  │  coachPolicy    │  │  voiceCapture  │  │  scheduler         │    │
│  │  validatedAI    │  │  voiceIntent   │  │  copy              │    │
│  │  promptLibrary  │  │  transcription │  │  copyEngine        │    │
│  │  bridge         │  │  voiceCopy     │  │                    │    │
│  └────────────────┘  └────────────────┘  └────────────────────┘    │
│                                                                      │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐    │
│  │  SURFACES       │  │  AMBIENT       │  │  ACTION HANDOFFS   │    │
│  │  (5 files)      │  │  (7 files)     │  │  (7 files)         │    │
│  │  1,482 lines    │  │  876 lines     │  │  1,298 lines       │    │
│  │                 │  │                │  │                    │    │
│  │  widgetService  │  │  ambientAgent  │  │  calendarHandoff   │    │
│  │  liveActivity   │  │  ambientPolicy │  │  reminderHandoff   │    │
│  │  appIntents     │  │  dangerWindow  │  │  emailDraft        │    │
│  │  shortcuts      │  │  quietHours    │  │  messageDraft      │    │
│  │                 │  │  scheduler     │  │  checklist         │    │
│  └────────────────┘  └────────────────┘  │  handoffPolicy     │    │
│                                           └────────────────────┘    │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐    │
│  │  CONSENT        │  │  CRASH         │  │  CONTEXT           │    │
│  │  (1 file)       │  │  REPORTING     │  │  (3 files)         │    │
│  │  531 lines      │  │  (1 file)      │  │  696 lines         │    │
│  │                 │  │  253 lines     │  │                    │    │
│  │  18 permissions │  │  Sentry+PII    │  │  contextExtractor  │    │
│  │  consent ledger │  │  scrubbing     │  │  contextInbox      │    │
│  │  GDPR/CCPA      │  │                │  │  contextStorage    │    │
│  └────────────────┘  └────────────────┘  └────────────────────┘    │
│                                                                      │
│  + analytics(1,112) · store(MMKV) · timer · tools · experiments      │
│  + retention · monetization · deeplinks · metrics · share · demo     │
│  + performance · feedback · firstWeek · missionChains · momentum     │
│  + adaptation · agentRuns · beforeScroll · bodyDouble · widgets      │
├──────────────────────────────────────────────────────────────────────┤
│                       TYPE SYSTEM (19 files)                        │
│                                                                      │
│  moment │ drift │ rescue │ mission │ agentAction │ contextCapsule   │
│  privacy │ systemSurface │ memory │ ambient │ contextInbox          │
│  actionHandoff │ deepLink │ agentRun │ voice │ attentionReceipt     │
│  openLoop │ surfaces │ index (barrel + legacy compat)               │
├──────────────────────────────────────────────────────────────────────┤
│                       STORAGE LAYER                                  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  MMKV (react-native-mmkv v3.2.0)                            │   │
│  │  Synchronous key-value storage, ~30x faster than AsyncStorage │   │
│  │  Zustand persist adapter                                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Zustand Store                                               │   │
│  │  Global state: user, missions, drift graph, consent ledger   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 4. Engine Catalog

### 4.1 Core Engines

| Engine | Lines | Purpose |
|--------|------:|---------|
| **toolRegistry.ts** | 757 | MCP-ready tool registration with 4 security tiers (read, write, external, sensitive). Each tool has risk level, consent requirements, and audit logging. |
| **interceptor.ts** | 662 | Doomscroll/scroll intercept engine. Detects app switching, scroll patterns, and triggers rescue prompts at optimal intervention points. |
| **agent.ts** | 606 | Core agent state machine. Manages agent lifecycle: idle → sensing → planning → executing → learning. Coordinates all other engines. |
| **safety.ts** | 416 | Crisis routing (9 categories), shame language filter, content classification, safety boundaries. Routes self-harm language to professional resources. |
| **missionCompiler.ts** | 386 | 12-dimension quality scoring for micro-missions. Generates concrete, tiny, physical actions. Rejects vague missions. |
| **antiAvoidance.ts** | 386 | Avoidance pattern detection and intervention. Identifies procrastination strategies and suggests counter-protocols. |
| **bodyDoubleEngine.ts** | 313 | 6 guided presence modes: silent, verbal, timer, screen-share, accountability, ambient. Session management with check-ins. |
| **commandlessAgent.ts** | 156 | No-typing rescue flow. State chips → time chips → "Pick for me" → mission. Zero keyboard input required. |

### 4.2 Pattern Engines

| Engine | Lines | Purpose |
|--------|------:|---------|
| **predictiveEngine.ts** | 541 | Pattern prediction from drift graph. Identifies: best protocol for state, optimal duration, distraction patterns, comeback sequences. |
| **personalDriftGraph.ts** | 281 | User pattern learning graph. Nodes: states, blockers, protocols, durations, times, outcomes. Edges: weighted transitions with confidence scores. |
| **playbookEngine.ts** | 119 | Personal rule/experiment system. "When [state], try [protocol] for [duration]." Self-experimentation with outcome tracking. |
| **intentScore.ts** | 96 | Momentum scoring. Tracks rescue frequency, completion rate, pattern improvement over time. |
| **planningLoopDetector.ts** | 101 | Detects when user is overthinking/planning instead of doing. Breaks planning loops with action prompts. |
| **outcomeEngine.ts** | 149 | Session outcome classification: completed, salvaged, abandoned, interrupted. Feeds back into drift graph. |

### 4.3 Feature Engines

| Engine | Lines | Purpose |
|--------|------:|---------|
| **driftMirror.ts** | 120 | Weekly pattern reflection. "You almost drifted here: [context]. What saved it: [protocol]." Shareable insights. |
| **openLoopEngine.ts** | 157 | Open loop capture and closure tracking. Captures unfinished thoughts/tasks and tracks resolution. |
| **attentionReceiptEngine.ts** | 112 | "What you did with rescued time." Shows users the tangible output of their focus sessions. |
| **emergencyStartEngine.ts** | 111 | 2-second rescue start. Bypasses all selection screens. State → mission → timer in 2 taps. |
| **intentLockEngine.ts** | 60 | Focus lock with exit friction. When locked, exiting requires acknowledging what you're leaving. |
| **missionThreadEngine.ts** | 127 | Multi-attempt mission threading. Tracks attempts at the same task, learns what works. |
| **newUserMagic.ts** | 83 | First-week experience engine. Feature gating, progressive disclosure, "wow moment" optimization. |
| **missionCandidateSelector.ts** | 145 | Multi-candidate mission ranking. Generates 3-5 candidate missions, selects best based on user patterns. |

---

## 5. Service Catalog

### 5.1 AI Services (1,929 lines)

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI ORCHESTRATOR (902 LOC)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Input: User moment + context + consent ledger                  │
│                                                                 │
│  Pipeline (deterministic-first):                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Local    │→│ Template │→│ Cached   │→│ On-device│      │
│  │ Rules    │  │ Library  │  │ Pattern  │  │ AI       │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│                                                    │            │
│                                              ┌─────┴─────┐     │
│                                              │ Remote AI  │     │
│                                              │ (optional) │     │
│                                              └───────────┘     │
│                                                                 │
│  Output Gates:                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Safety   │→│ Quality  │→│ Privacy  │→│ Shame    │      │
│  │ Gate     │  │ Gate     │  │ Gate     │  │ Filter   │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│                                                                 │
│  Output: Validated coach response / mission / insight           │
└─────────────────────────────────────────────────────────────────┘
```

- **coachPolicy.ts** (425) — Tone adaptation per user preference (gentle/firm/emergency), response templates
- **validatedAI.ts** (305) — Output validation, shame language detection, crisis content checking, output sanitization
- **promptLibrary.ts** (238) — Structured prompt templates for rescue, salvage, brain dump scenarios
- **bridge.ts** (107) — On-device AI bridge for Foundation Models / Core ML integration

### 5.2 Voice Services (1,364 lines)

```
Voice Input → voiceCapture (state machine) → voiceTranscription
              │                                  │
              │                                  ▼
              │                           voiceIntent (classify)
              │                                  │
              ▼                                  ▼
         Recording                      Intent → Action
         (expo-av)
```

- **voiceCapture.ts** (401) — Recording state machine: idle → recording → paused → completed → processing. Metering, max/min duration, expo-av integration.
- **voiceIntent.ts** (439) — Voice → intent classification. Maps spoken words to app actions (start rescue, begin body double, etc.)
- **voiceTranscription.ts** (252) — Offline + cloud transcription bridge. Graceful fallback when offline.
- **voiceCopy.ts** (209) — Voice UX copy and prompts

### 5.3 Notification Services (1,391 lines)

- **notifications.ts** (490) — Full notification delivery: push registration, permission handling, notification categories, action buttons. Uses expo-notifications.
- **notificationScheduler.ts** (345) — Optimal timing based on user patterns, debounce logic, outcome tracking, quiet hours respect.
- **notificationCopy.ts** (378) — Notification text generation: rescue prompts, streak protection, daily summaries, danger window alerts.
- **notificationCopy/engine.ts** (178) — Copy engine with template system

### 5.4 Surface Services (1,482 lines)

- **widgetService.ts** (450) — Prepares data for iOS WidgetKit and Android AppWidget. Privacy-aware: respects widget_data consent. Supports multiple widget types (small, medium, large).
- **liveActivityService.ts** (338) — ActivityKit Live Activity management. Shows active session timer on Lock Screen / Dynamic Island.
- **appIntentsService.ts** (311) — iOS App Intents integration. Defines donateable intents for Siri and Shortcuts.
- **shortcutService.ts** (335) — Siri Shortcuts + voice commands. "Hey Siri, start a rescue."

### 5.5 Consent Service (531 lines)

```
18 Permissions across 6 categories:
┌──────────────┬──────────────────────────────────────────────┐
│ Data         │ basic, sensitive, location, export           │
│ AI           │ analysis, training                           │
│ Notifications│ smart, marketing                             │
│ Sharing      │ anonymous, research                          │
│ Device       │ on_device_only, cloud_sync, backup, biometric│
│ Access       │ widget_data, live_activity, siri_shortcuts   │
│              │ crash_reporting                              │
└──────────────┴──────────────────────────────────────────────┘

Consent Flow:
Permission Request → Check Ledger → Has Receipt?
  ├─ Yes → Use stored decision
  └─ No  → Check default → Prompt if needed → Record receipt
```

### 5.6 Crash Reporting (253 lines)

- Sentry v6 integration
- Consent-gated: zero data without permission
- PII scrubbing: 25+ sensitive key patterns (email, phone, address, location, raw_content, brain_dump, etc.)
- Deep scrub with 10-level depth limit
- String truncation at 200 chars
- Breadcrumb tracking for navigation + actions

---

## 6. Type System Overview

### 6.1 Core Domain Types

```
Moment (user state capture)
├── state: UserState (avoiding | overwhelmed | stuck | tired | ...)
├── energy: EnergyLevel (depleted | low | medium | high)
├── timeAvailable: number (minutes)
├── blocker: BlockerType (too_big | unclear | scary | perfectionism | ...)
└── privacy: PrivacyLevel (local_only | safe_for_ai | sensitive | never_send)

DriftSignal (pattern detection)
├── type: 'state_recurrence' | 'time_pattern' | 'blocker_cluster' | ...
├── confidence: number (0-1)
├── evidence: string[]
└── suggestedProtocol: RescueProtocol

RescueProtocol (behavior playbook)
├── id: string
├── bestForStates: UserState[]
├── avoidForStates: UserState[]
├── defaultDuration: number
├── missionCompilationRules: MissionRules
├── coachToneRules: ToneRules
└── salvageRules: SalvageRules

MicroMission (compiled action)
├── title: string
├── description: string
├── duration: number
├── qualityScore: QualityScore (12 dimensions)
├── protocol: RescueProtocol
└── outcome: MissionOutcome
```

### 6.2 Type File Map

| File | Types | Purpose |
|------|------:|---------|
| moment.ts | ~15 | User moment capture types |
| drift.ts | ~20 | Drift signals, graph structure |
| rescue.ts | ~15 | Rescue protocols, outcomes |
| mission.ts | ~20 | Micro-missions, quality dimensions |
| agentAction.ts | ~10 | Agent action proposals |
| contextCapsule.ts | ~10 | Context inbox items |
| privacy.ts | ~15 | Privacy settings, classifications |
| systemSurface.ts | ~15 | Widget/LA/Intent data |
| memory.ts | ~10 | Memory items, user control |
| ambient.ts | ~15 | Ambient suggestions, danger windows |
| contextInbox.ts | ~10 | Context inbox types |
| actionHandoff.ts | ~15 | Calendar/reminder/email handoffs |
| deepLink.ts | ~10 | Deep link routing |
| agentRun.ts | ~10 | Agent run traces |
| voice.ts | ~15 | Voice capture/transcription |
| attentionReceipt.ts | ~10 | Attention receipt types |
| openLoop.ts | ~10 | Open loop types |
| surfaces.ts | ~20 | Widget/LA/Intent bridge |
| index.ts | ~25 | Barrel exports + legacy compat |

**Total: ~260 exported types across 19 files (2,592 lines)**

---

## 7. Security Architecture

### 7.1 Consent-Gated Pipeline

Every data flow in INTENT passes through consent checks:

```
User Action
    │
    ▼
┌─────────────────┐
│ Consent Check    │ ← checkPermission(permissionId, ledger, user)
│                  │
│  Has receipt?    │
│  ├─ Yes: use it  │
│  └─ No: default  │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
 Allowed    Denied → Fallback behavior
    │
    ▼
 Execute with privacy classification
```

### 7.2 Privacy Classifications

| Level | What Happens | Example Data |
|-------|-------------|--------------|
| `local_only` | Never leaves device | Emotional states, brain dumps |
| `safe_for_ai` | Anonymized, sent to AI | Pattern summaries, protocol preferences |
| `sensitive` | Encrypted, user-controlled | Focus sessions, mission history |
| `never_send` | Absolute prohibition | Raw voice recordings, location |

### 7.3 Safety Engine

```
Input Text/Action
    │
    ▼
┌─────────────────┐
│ Crisis Detection │ ← 9 categories: self-harm, substance, abuse, ...
│                  │
│  Detected?       │
│  ├─ Yes: Route to│ → Crisis hotline, professional resources
│  │   resources   │
│  └─ No: Continue │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Shame Filter     │ ← Blocks: "lazy", "failed", "wasted", "pathetic", ...
│                  │
│  Found?          │
│  ├─ Yes: Rewrite │ → Compassionate alternative
│  └─ No: Continue │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Content Classify │ ← Categorize content for appropriate handling
└─────────────────┘
```

### 7.4 Tool Security Tiers

| Tier | Risk | Consent | Example |
|------|------|---------|---------|
| Read | Low | None needed | View progress, read patterns |
| Write | Medium | Implicit | Update drift graph, save mission |
| External | High | Per-action | Create calendar event, send email |
| Sensitive | Critical | Explicit + confirm | Export data, delete account |

### 7.5 PII Scrubbing (Crash Reports)

25+ sensitive key patterns auto-redacted:
`email`, `phone`, `address`, `name`, `display_name`, `avatar_url`, `password`, `ssn`, `credit_card`, `bank_account`, `ip_address`, `location`, `lat`, `lng`, `latitude`, `longitude`, `raw_content`, `brain_dump`, `context_text`, `distraction_content`, `message_body`

String truncation: 200 chars max
Depth limit: 10 levels

---

## 8. Consent Flow

### 8.1 Onboarding Consent (5 steps)

```
Step 1: "Track Your Progress" (required)
  → data_collection_basic: default granted, required

Step 2: "Understand Your Patterns" (recommended)
  → data_collection_sensitive: default granted, optional

Step 3: "AI-Powered Coaching" (recommended)
  → ai_analysis: default granted, optional

Step 4: "Smart Check-Ins" (recommended)
  → notifications_smart: default granted, optional

Step 5: "Help Improve INTENT" (recommended)
  → data_sharing_anonymous: default granted, optional
```

### 8.2 Runtime Consent

When a feature needs a permission not yet granted:
1. Check consent ledger for existing receipt
2. If no receipt, check permission default
3. If needs prompt, show contextual explanation sheet
4. Record receipt with timestamp, source, context
5. Proceed or fallback based on decision

### 8.3 Data Rights (GDPR/CCPA)

- **Right to Access:** Download all data as JSON
- **Right to Deletion:** Delete all user data permanently
- **Right to Portability:** Export in standard formats
- **Right to Correction:** Edit any stored data
- **Right to Object:** Opt out of specific processing

---

## 9. Native Surface Architecture

### 9.1 Service Layer (Complete)

```
┌─────────────────────────────────────────────────────────┐
│                   NATIVE SURFACE SERVICES                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  WidgetKit (widgetService.ts, 450 LOC)                  │
│  ├─ Widget types: small, medium, large                  │
│  ├─ Data: current session, streak, rescue prompt        │
│  ├─ Privacy: respects widget_data consent               │
│  └─ Bridge: WidgetBridgeModule interface                │
│                                                         │
│  ActivityKit (liveActivityService.ts, 338 LOC)          │
│  ├─ Live Activity: timer, progress, state               │
│  ├─ Dynamic Island: compact/minimal presentation        │
│  ├─ Lock Screen: expanded presentation                  │
│  └─ Bridge: ActivityKitBridge interface                 │
│                                                         │
│  App Intents (appIntentsService.ts, 311 LOC)            │
│  ├─ Intents: StartRescue, StartBodyDouble, ViewProgress │
│  ├─ Parameters: state, duration, protocol               │
│  ├─ Donation: frequent intents suggested to Siri        │
│  └─ Bridge: AppIntentsBridge interface                  │
│                                                         │
│  Siri Shortcuts (shortcutService.ts, 335 LOC)           │
│  ├─ Phrases: "Start a rescue", "Begin body double"      │
│  ├─ Activities: NSUserActivity donation                 │
│  └─ Bridge: SiriShortcutBridge interface                │
│                                                         │
│  Deep Links (deepLinkService.ts, 229 LOC)               │
│  ├─ Schemes: intent://rescue, intent://context, ...     │
│  ├─ Universal Links: intentapp.com/...                  │
│  └─ Routing: screen + params extraction                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 9.2 Native Module Requirements

| Surface | iOS Native | Android Native | Complexity |
|---------|-----------|---------------|------------|
| Widget | WidgetKit Swift + Config Plugin | AppWidget Kotlin + Config Plugin | Medium |
| Live Activity | ActivityKit Swift module | N/A (Android equivalent TBD) | High |
| App Intents | AppIntents Swift module | N/A | Medium |
| Siri Shortcuts | SiriKit entitlements | N/A | Low |
| Share Extension | iOS Share Extension | Intent Filter | Medium |
| Foundation Models | iOS 26+ Swift module | N/A | High |

### 9.3 Implementation Strategy

1. **Phase 1:** Deep links + notification actions (works now)
2. **Phase 2:** iOS Widget via config plugin + Swift module
3. **Phase 3:** Live Activity via ActivityKit native module
4. **Phase 4:** App Intents via AppIntents Swift module
5. **Phase 5:** Foundation Models bridge (iOS 26+)

---

## 10. Data Flow Diagrams

### 10.1 Rescue Flow (Primary)

```
User taps "Rescue Me"
    │
    ▼
Moment Capture (state + energy + time)
    │
    ▼
AI Orchestrator
    ├─ Deterministic: state → protocol mapping
    ├─ Template: protocol → mission template
    └─ Quality gate: reject vague missions
    │
    ▼
Mission Compiler
    ├─ Select protocol (12 available)
    ├─ Generate 3-5 candidates
    ├─ Score on 12 dimensions
    └─ Select best match
    │
    ▼
Safety Gate
    ├─ Crisis check → route if detected
    ├─ Shame filter → rewrite if found
    └─ Privacy check → classify output
    │
    ▼
Live Mission Screen
    ├─ Display mission + timer
    ├─ Capture distractions
    └─ Voice input (optional)
    │
    ▼
Outcome
    ├─ Completed → drift graph update + attention receipt
    ├─ Stuck → shrink mission → retry
    └─ Abandoned → salvage offer → partial credit
```

### 10.2 Context-to-Mission Flow

```
User pastes text / brain dump
    │
    ▼
Context Extractor
    ├─ Extract deadlines, obligations, entities
    ├─ Classify sensitivity
    └─ Create ContextCapsule
    │
    ▼
Context Inbox Engine
    ├─ Queue capsule
    ├─ Privacy review (if sensitive)
    └─ Link to existing threads
    │
    ▼
Mission Thread Engine
    ├─ Generate mission from context
    ├─ Track attempts
    └─ Learn what works
    │
    ▼
Action Handoff (optional)
    ├─ Calendar event
    ├─ Reminder
    ├─ Email draft
    └─ Checklist
```

### 10.3 Notification Flow

```
Notification Scheduler
    │
    ├─ Check user patterns (optimal times)
    ├─ Check quiet hours
    ├─ Check consent (notifications_smart)
    └─ Debounce (avoid spam)
    │
    ▼
Notification Copy Engine
    ├─ Generate contextual copy
    ├─ Include action buttons
    └─ Respect notification preferences
    │
    ▼
expo-notifications
    ├─ Local notification
    └─ Push notification (if remote)
    │
    ▼
User Interaction
    ├─ Tap → Deep link to relevant screen
    ├─ Action button → Execute action directly
    └─ Dismiss → Track outcome
```

---

## 11. Storage Architecture

```
┌─────────────────────────────────────────────────┐
│              MMKV (react-native-mmkv)            │
│  Synchronous key-value storage                   │
│  ~30x faster than AsyncStorage                   │
│  Encrypted at rest (iOS/Android)                 │
├─────────────────────────────────────────────────┤
│                                                  │
│  Keys:                                           │
│  ├─ user-profile      → UserProfile JSON         │
│  ├─ consent-ledger    → ConsentLedger JSON       │
│  ├─ drift-graph       → PersonalDriftGraph JSON  │
│  ├─ mission-history   → MicroMission[] JSON      │
│  ├─ privacy-settings  → UserPrivacySettings JSON │
│  ├─ notification-prefs→ NotificationPrefs JSON   │
│  └─ ...                                          │
│                                                  │
├─────────────────────────────────────────────────┤
│              Zustand Store                        │
│  Global state management                         │
│  Persisted via MMKV adapter                      │
│  Slices: user, missions, drift, consent, UI      │
└─────────────────────────────────────────────────┘
```

---

## 12. Testing Architecture

```
┌─────────────────────────────────────────────────┐
│              TEST INFRASTRUCTURE                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  Jest 30 + ts-jest                               │
│  @testing-library/react-native                   │
│                                                  │
│  Test Files (10):                                │
│  ├─ engine.test.ts (65 tests)                    │
│  │   Mission compiler, salvage, drift graph,     │
│  │   body double, rescue protocols, safety        │
│  ├─ services.test.ts (73 tests)                  │
│  │   Context extractor, analytics, tools,         │
│  │   retention, weekly story, experiments         │
│  ├─ interceptor.test.ts (73 tests)               │
│  │   Doomscroll intercept, scroll detection       │
│  ├─ aiOrchestrator.test.ts (58 tests)            │
│  │   Pipeline, safety gates, consent integration  │
│  ├─ store.test.ts (51 tests)                     │
│  │   Zustand store, MMKV storage                  │
│  ├─ voiceIntent.test.ts (48 tests)               │
│  │   Voice → intent classification                │
│  ├─ notificationCopy.test.ts (43 tests)          │
│  │   Notification text generation                 │
│  ├─ predictiveEngine.test.ts (29 tests)          │
│  │   Pattern prediction                           │
│  ├─ phase64-deep-testing.test.ts (109 tests)     │
│  │   Deep integration across all engines           │
│  └─ phase70-deeplink-validation.test.ts (24)     │
│      Deep link routing                            │
│                                                  │
│  Total: 327 test cases                           │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 13. Dependency Map

### Production Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| expo | ~56.0.0 | Framework |
| react | ^19.2.6 | UI library |
| react-native | 0.79.2 | Platform |
| zustand | ^5.0.13 | State management |
| react-native-mmkv | ^3.2.0 | Fast storage |
| @sentry/react-native | ^6.0.0 | Crash reporting |
| expo-notifications | ^56.0.13 | Push notifications |
| expo-av | ~15.0.0 | Voice recording |
| expo-haptics | ~15.0.0 | Haptic feedback |
| expo-secure-store | ~14.0.0 | Secure storage |
| expo-router | ^4.0.22 | File-based routing |
| expo-linking | ~7.0.0 | Deep links |
| expo-task-manager | ~56.0.0 | Background tasks |
| expo-device | ~7.0.0 | Device info |
| expo-crypto | ~14.0.0 | UUID generation |
| expo-clipboard | ~7.0.0 | Clipboard access |
| date-fns | ^4.1.0 | Date utilities |
| lottie-react-native | ^7.2.0 | Animations |
| lucide-react-native | ^1.16.0 | Icons |
| react-native-reanimated | ~3.17.0 | Animations |
| react-native-gesture-handler | ~2.20.0 | Gestures |
| react-native-screens | ~4.0.0 | Native screens |

### Dev Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| typescript | 5.4 | Type checking |
| jest | ^30.4.2 | Testing |
| ts-jest | ^29.4.11 | TS test transform |
| eslint | ^9.0.0 | Linting |
| prettier | ^3.3.0 | Formatting |
| @typescript-eslint/* | ^8.0.0 | TS lint rules |
| @testing-library/react-native | ^12.8.1 | Component testing |

---

## 14. Key Metrics Summary

| Metric | Value |
|--------|-------|
| Source files | 225 |
| Source lines | 43,196 |
| Engine files | 24 (6,167 lines) |
| Service files | 67 (15,180 lines) |
| Type files | 19 (2,592 lines) |
| Component files | 13 (1,392 lines) |
| Feature files | 58 (11,127 lines) |
| Test files | 10 (3,519 lines) |
| Agent files | 10 (2,075 lines) |
| App screens | 18 (6,149 lines) |
| Test cases | 327 |
| `as any` (production) | 4 |
| `as any` (tests) | 15 |
| Permissions | 18 |
| Rescue protocols | 12 |
| Quality dimensions | 12 |
| Body double modes | 6 |
| Safety categories | 9 |
| Doc files | 26 |

---

*Generated: May 25, 2026 — V2 Completion*
*Architecture Version: 4.0*
*Previous version: ARCHITECTURE_V3.md*
