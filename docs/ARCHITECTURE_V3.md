# INTENT v3 — Architecture Document

## The One Sentence

INTENT catches the moment you're about to drift and converts it into one tiny action you can start now — without typing, without setup, without shame.

## The Core Insight

Most productivity apps organize your past (tasks, goals, calendars).
Most focus apps protect your present (timers, blockers, streaks).
INTENT rescues your **next 5 minutes**.

The user never has to plan. They just have to be honest about how they feel right now.

## The Three Pillars

### 1. MOMENT (Not a Timer)
The atomic unit is not a session or a task. It's a **Moment** — the exact instant when drift begins.

A Moment captures:
- **State**: How the user feels (avoiding, overwhelmed, stuck, tired, distracted, anxious, scattered, ready + 8 more)
- **Energy**: depleted/low/medium/high
- **Time available**: 1/2/5/10/15/25 min
- **Blocker**: What's stopping them (too_big, unclear, scary, perfectionism, etc.)
- **Privacy**: local_only/safe_for_ai/sensitive/never_send

### 2. RESCUE PROTOCOL (Not a Coach)
The AI doesn't chat. It runs **protocols** — behavior playbooks that convert Moments into Micro-Missions.

12 protocols:
1. Two-Minute Ignition
2. Ugly First Move
3. Clear The Fog
4. Shrink The Beast
5. Lock The Door
6. Maintenance Spark
7. Pressure Valve
8. Body Double Start
9. Decision Breaker
10. Comeback Seed
11. Planning Loop Breaker
12. Doomscroll Intercept

Each protocol has:
- best_for_states
- avoid_for_states
- default_duration
- mission_compilation_rules
- coach_tone_rules
- salvage_rules
- safety_notes

### 3. PERSONAL DRIFT GRAPH (Not Streaks)
The app learns the user's unique drift patterns over time.

Nodes: states, blockers, protocols, durations, times, push styles, distractions, outcomes, surfaces
Edges: state→blocker, blocker→protocol, protocol→duration→outcome

Insights (confidence-labeled):
- "When overwhelmed, 5-min missions work 2.1x better than 25-min"
- "Your best comeback: Comeback Seed → 2-min timer → body double"
- "Planning loops happen when you open Missions without starting"

## The Screen Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     INTENT v3 SCREENS                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  RESCUE (Home)                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ "About to drift?"                                   │   │
│  │                                                     │   │
│  │ [Avoiding] [Overwhelmed] [Stuck] [Tired] [Distracted]│   │
│  │ [Anxious] [Scattered] [Ready]                       │   │
│  │                                                     │   │
│  │          ┌──────────────────────────┐               │   │
│  │          │      RESCUE ME            │               │   │
│  │          └──────────────────────────┘               │   │
│  │                                                     │   │
│  │ [Before I Scroll] [Body Double] [Paste Chaos]       │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  LIVE MISSION                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ "Open your essay and write one ugly sentence."      │   │
│  │                                                     │   │
│  │              ┌──────────────────┐                   │   │
│  │              │   ██ 24:31 ██    │                   │   │
│  │              │   remaining      │                   │   │
│  │              └──────────────────┘                   │   │
│  │                                                     │   │
│  │ [Smaller] [Stuck] [Distracted] [Salvage] [Done]     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  MISSIONS (Context Inbox)                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ "Drop messy context here."                          │   │
│  │ [Paste text] [Brain dump] [Add context]             │   │
│  │                                                     │   │
│  │ Context Capsules → Mission Threads                  │   │
│  │ ┌───────────────────────────────────────────────┐   │   │
│  │ │ Biology test Friday                           │   │   │
│  │ │ → Thread: 4 attempts, best: Ugly First Move   │   │   │
│  │ │ → Next: "Make 3 flashcards from page 1"       │   │   │
│  │ └───────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  MOMENTUM (Personal Drift Graph)                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ This week: 47 momentum points ↑ vs last week       │   │
│  │                                                     │   │
│  │ "When overwhelmed, 5-min missions work best."       │   │
│  │ Confidence: strong (18 events)                      │   │
│  │                                                     │   │
│  │ Best comeback: Comeback Seed → 2-min → body double  │   │
│  │ Distraction pattern: thoughts peak at 2pm           │   │
│  │                                                     │   │
│  │ [Next experiment: 5-min default when overwhelmed]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  COACH (Action-First Agent)                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [I'm stuck] [Make smaller] [Avoiding] [Tired]      │   │
│  │                                                     │   │
│  │ ┌───────────────────────────────────────────────┐   │   │
│  │ │ Stuck. Open the doc. Name the blocker out     │   │   │
│  │ │ loud. Then write one bad sentence.            │   │   │
│  │ │                                               │   │   │
│  │ │ What's the blocker?                           │   │   │
│  │ └───────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  │ [Do it] [Smaller] [Body double] [Not now]          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  TRUST CENTER                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ What INTENT learns                                  │   │
│  │ What stays local                                    │   │
│  │ What AI can see                                     │   │
│  │ Agent actions                                       │   │
│  │ Safety boundaries                                   │   │
│  │ Local mode                                          │   │
│  │ Data controls                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## The Data Flow

```
User opens app / widget / notification
         │
         ▼
┌─────────────────────┐
│   MOMENT CAPTURE     │ ← State + Energy + Time + Blocker
│   (no typing)        │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   DRIFT RADAR        │ ← Signals + History + Time patterns
│   (local engine)     │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   PROTOCOL SELECTOR  │ ← Best protocol for state + history
│   (local + AI)       │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   MISSION COMPILER   │ ← Concrete, tiny, physical action
│   (local + AI)       │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   LIVE MISSION       │ ← Timer + Distraction capture + Salvage
│   (full screen)      │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   SALVAGE / COMPLETE │ ← Partial credit + Pattern update
│   (always offered)   │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   DRIFT GRAPH UPDATE │ ← Nodes + Edges + Confidence
│   (local)            │
└─────────────────────┘
```

## The Agent Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENT ORCHESTRATOR                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 LOCAL POLICY ENGINE                    │  │
│  │  - Moment classification                              │  │
│  │  - Protocol selection                                 │  │
│  │  - Mission compilation (templates)                    │  │
│  │  - Drift signal detection                             │  │
│  │  - Safety classification                              │  │
│  │  - Privacy classification                             │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                   │
│              ┌──────────┴──────────┐                       │
│              ▼                     ▼                       │
│  ┌──────────────────┐  ┌──────────────────────┐          │
│  │  LOCAL EXECUTION  │  │  REMOTE AI (optional) │          │
│  │  - Fast           │  │  - Better missions    │          │
│  │  - Private        │  │  - Better insights    │          │
│  │  - Deterministic  │  │  - Richer language    │          │
│  └──────────────────┘  └──────────────────────┘          │
│              │                     │                       │
│              └──────────┬──────────┘                       │
│                         ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   OUTPUT GATES                        │  │
│  │  - Quality gate (reject vague missions)               │  │
│  │  - Safety gate (block harmful content)                │  │
│  │  - Privacy gate (block sensitive data send)           │  │
│  │  - Shame gate (rewrite shaming language)              │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                  │
│                         ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   UI OUTPUT                           │  │
│  │  - Mission card                                       │  │
│  │  - Coach pulse                                        │  │
│  │  - Insight card                                       │  │
│  │  - Salvage offer                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## The Permission Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   PERMISSION LAYERS                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: LOCAL ONLY (default)                              │
│  - All data on device                                       │
│  - No remote AI                                             │
│  - No analytics                                             │
│  - Full functionality                                       │
│                                                             │
│  Layer 2: SAFE FOR AI (opt-in)                              │
│  - Anonymized patterns sent to AI                           │
│  - No raw text sent                                         │
│  - No brain dumps sent                                      │
│  - Better mission quality                                   │
│                                                             │
│  Layer 3: CONTEXT PROCESSING (opt-in)                       │
│  - Pasted text processed by AI                              │
│  - Deadlines extracted                                      │
│  - Obligations identified                                   │
│  - Better mission threads                                   │
│                                                             │
│  Layer 4: EXTERNAL ACTIONS (opt-in + per-action)            │
│  - Calendar blocks                                          │
│  - Reminders                                                │
│  - Email drafts                                             │
│  - Each action requires confirmation                        │
│                                                             │
│  Layer 5: CONNECTORS (opt-in + per-connector)               │
│  - Calendar sync                                            │
│  - Reminder sync                                            │
│  - Third-party tools                                        │
│  - Each connector requires explicit consent                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## What Makes This 10/10

1. **First rescue in under 10 seconds** — no typing, no setup, no account
2. **Works offline** — core engine is local, cloud AI is enhancement
3. **Learns from failure** — salvage system mines abandoned sessions for patterns
4. **Appears everywhere** — widget, notification, shortcut, Live Activity architecture
5. **Privacy is visible** — Trust Center, data controls, local-only mode
6. **Agentic, not chatty** — AI prepares actions, not just text
7. **Safe by design** — crisis handling, no shame, no diagnosis
8. **Tested** — real test coverage for all critical engines
9. **Emotionally intelligent** — understands avoidance patterns, not just tasks
10. **Demonstrably different** — first 10 seconds unlike any other app

## What Still Requires Native Build

- iOS App Intents (requires native module or Expo config plugin)
- Live Activities / ActivityKit (requires native module)
- Home Screen Widgets (requires native module or Expo config plugin)
- Share Extension (requires native module)
- Apple Foundation Models bridge (requires native Swift module, iOS 26+)
- Android widgets (requires native module)
- MCP connector (requires native networking module)

## MVP-Ready (Expo SDK 56)

- Moment capture
- Rescue protocols
- Mission compiler (local)
- Live mission with timer
- Salvage engine
- Personal drift graph (local)
- Coach (action-first, local + remote AI)
- Trust center
- Privacy controls
- Onboarding (instant rescue)
- No-typing flow
- Before You Scroll
- Body Double modes
- Weekly story
- Experiments
- Notification actions (basic)
- Tests

## Post-Launch (Native Modules)

- iOS App Intents
- Live Activities
- Home Screen Widgets
- Share Extension
- Apple Foundation Models
- Android widgets
- MCP connectors
- Cloud sync
- Calendar/reminder integration
