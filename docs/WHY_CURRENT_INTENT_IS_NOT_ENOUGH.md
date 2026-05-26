# Why Current INTENT Is Not Enough

## The Brutal Truth

Current INTENT (v3) is a **7/10 focus-companion app with an AI coat of paint**. It has good bones — solid state model, basic agent, decent architecture — but it's still fundamentally a *productivity app*, not an *anti-drift agent*.

Here's what's still wrong:

---

## What Is Still 2023

1. **Manual-first input** — The app waits for the user to type, tap through flows, and manually create context. A 2026 agent *anticipates* and *prepares*.

2. **Flat type system** — Types are in `index.ts` and `moment.ts`, but there's no deep domain model. No `RescueProtocol`, no `MissionThread`, no `ContextCapsule`, no `AgentAction`, no `DriftGraph`, no `PermissionReceipt`.

3. **Agent is decorative** — The agent engine has drift detection and action generation, but it's not connected to a real decision pipeline. There's no orchestrator, no policy engine, no safety gate, no quality gate.

4. **No system surfaces** — No widget architecture, no notification actions, no App Intent placeholders, no Live Activity design. The app lives only inside itself.

5. **No behavioral memory** — The app doesn't learn persistently. There's no Personal Drift Graph. Every session starts from scratch.

---

## What Is Still Generic

1. **Micro-missions are template-based** — They're not compiled from the user's actual context, resistance patterns, and drift history. A real mission compiler would say: *"You've tried to start the essay 4 times. Last time, Ugly First Move for 5 minutes worked. Try: 'Open your essay doc and write one ugly sentence under the intro.'"*

2. **The coach is a chat screen** — It's not mission-aware, not session-stage-aware, and doesn't adapt tone based on what works for *this* user.

3. **Salvage is basic** — It offers "try again" instead of mining the failure for pattern intelligence and generating a specific salvage plan.

4. **There's no MissionThread** — Missions are isolated. The app doesn't understand that 3 abandoned missions are all about the *same* underlying resistance.

---

## What Is Not Defensible

1. **Any competitor can copy the states** — 8 state chips with emojis? That's one afternoon of work.

2. **Any competitor can add a timer** — Focus timers are commoditized.

3. **Any competitor can add AI chat** — ChatGPT API + a text box = done.

4. **The current drift detection is simple heuristics** — No persistent graph, no confidence scoring, no behavioral learning.

5. **There's no data moat** — Without the Personal Drift Graph, there's no switching cost. Users can leave and get the same experience elsewhere.

---

## What Is Too Manual

1. **User must type or paste context** — No share extension, no App Intent, no voice shortcut, no ambient capture.

2. **User must manually create missions** — The app should *compile* missions from context automatically.

3. **User must manually track distractions** — The app should detect drift signals from behavior patterns.

4. **User must manually review their week** — The app should generate a Weekly Story automatically.

---

## What Lacks System-Level Surfaces

1. **No widget** — Can't start rescue from home screen.

2. **No notification actions** — Can't "Start 2 min" from a notification.

3. **No App Intents** — Can't say "Hey Siri, rescue me."

4. **No Live Activity** — Can't see mission progress on lock screen.

5. **No share extension** — Can't share an assignment from another app into INTENT.

6. **No quick actions** — Can't long-press the app icon for instant rescue.

---

## What Lacks Agentic Depth

1. **No tool registry** — The app can't prepare actions (draft email, create reminder, calendar block).

2. **No permission system** — No consent architecture for external actions.

3. **No agent action review** — No "here's what I'll do, confirm?" flow.

4. **No MCP architecture** — No plan for connecting to external tools/services.

5. **No safety policy engine** — No crisis detection, no shame-language filter, no external action guard.

---

## What Lacks Intelligence

1. **No Personal Drift Graph** — The app doesn't learn that "when overwhelmed, 5-minute missions work 2.1x better than 25-minute."

2. **No protocol selector** — The app doesn't match protocols to states based on *this user's* history.

3. **No mission quality scoring** — Missions aren't scored for specificity, physical first action, duration fit, etc.

4. **No experiment system** — The app doesn't help users run self-experiments on their productivity.

5. **No weekly story** — Just stats, not narrative.

---

## What Lacks Virality

1. **No shareable proof** — No "I almost drifted, INTENT rescued 5 minutes" cards.

2. **No before/after narrative** — No "I was about to scroll for an hour" moment.

3. **No social proof architecture** — No anonymous pattern sharing, no community insights.

---

## What Lacks Trust

1. **No Trust Center** — No visible privacy controls, no data map, no AI transparency.

2. **No permission receipts** — No audit trail of what the app did with user data.

3. **No local-only mode** — No way to use the app with zero cloud dependency.

4. **No safety boundaries** — No explicit "not therapy, not diagnosis" messaging.

---

## What Lacks App Store Differentiation

1. **The screenshots would look like every other focus app** — Timer, chat, dashboard.

2. **The first 10 seconds are setup, not value** — Auth, onboarding, goal creation before first rescue.

3. **The pitch is generic** — "AI anti-procrastination app" could describe 500 apps.

4. **No unique emotional moment** — The app doesn't own "I'm about to drift" the way Uber owns "I need a ride."

---

## The Bottom Line

Current INTENT is a **well-architected v1** that needs to become a **deep, agentic, privacy-first anti-drift system**. The foundation is solid — Zustand, Expo 56, Hermes, good type system — but the product surface is still 2023.

The transformation requires:
- Deep object model (Phase 1)
- Anti-drift agent core (Phase 2)
- Personal Drift Graph (Phase 3)
- Mission Compiler 2.0 (Phase 4)
- System surfaces (Phase 8)
- Trust Center (Phase 17)
- Safety engine (Phase 18)
- And 20+ more phases of depth

Without these, INTENT is just another productivity app in a sea of AI slop.
