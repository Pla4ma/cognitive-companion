# 2026 Competitive Research — INTENT Anti-Drift Agent

## AI Agent Products

| Competitor / Trend | What It Does | Why Users Care | Why It Threatens INTENT | What INTENT Must Do Differently | Implementation Implication |
|---|---|---|---|---|---|
| ChatGPT Agent / Codex | Autonomous agents that browse, code, execute multi-step tasks | Users want AI that *does*, not just *says* | Sets expectation that AI apps should act, not just chat | INTENT must act on the user's *real-world resistance*, not just digital tasks. Our agent catches drift moments, not code repos. | Agent action system with human-in-the-loop approval. Never execute external actions silently. |
| Gemini Spark (Proactive Agents) | Google's always-on agents that monitor context and suggest actions | Users expect apps to anticipate needs | If Google bakes anti-drift into Android/iOS natively, INTENT must be deeper | INTENT's moat is the Personal Drift Graph — behavioral learning no OS provides. | Local-first drift graph, exportable, user-owned. |
| Claude / Anthropic Tool Use | Claude can use tools, MCP servers, browse, compute | Users see AI as a tool-user, not just chatbot | Raises the bar for what "AI app" means | INTENT's tool use must be *safety-gated* and *approval-based*. We prepare actions, user confirms. | Tool registry with risk levels, permission receipts, audit log. |
| Replit Agent | AI agent that builds entire apps from prompts | Shows agents can do complex multi-step work | Users will expect mobile agents to handle complex real-world tasks | INTENT's domain is narrower and deeper: the moment of drift. We don't build apps; we rescue minutes. | Mission compiler must produce concrete, physical-action-first missions. |
| Cursor / Claude Code | AI-first IDEs that understand codebase context | Developers live in AI-augmented environments | If work tools become agentic, personal tools must too | INTENT must be the agent for *personal* productivity, not code. Our context is emotional state, not code. | Context capsule system for personal text, assignments, brain dumps. |
| MCP (Model Context Protocol) | Standardized tool registry for AI agents | Becoming the USB-C of AI tool integration | If MCP becomes standard, apps that don't connect will feel closed | INTENT must be MCP-ready: consume tools (calendar, reminders) and expose tools (create mission, salvage). | MCP architecture docs, security policy, mock connector, future server/client. |

## Mobile Platform Capabilities

| Capability | iOS Status (May 2026) | Android Status | Expo SDK 56 Feasibility | INTENT Use |
|---|---|---|---|---|
| App Intents / Shortcuts | Mature, powerful | N/A (Android uses Intent system) | Requires native module / config plugin | Start Rescue, Capture Distraction, Get Next Tiny Action |
| WidgetKit (Home Screen) | Mature, interactive widgets | AppWidgets (interactive) | expo-widgets or config plugin needed | "Rescue Me" button, momentum today, current mission |
| Live Activities / ActivityKit | Mature, Dynamic Island + Lock Screen | N/A (Android has different live update patterns) | Requires native module | Active mission timer, done/salvage actions |
| Notification Actions | Mature | Mature | expo-notifications supports actions | Start 2 min, Make smaller, I'm stuck, Snooze |
| Share Extension | Mature | Mature | Requires native module | Share text from other apps → mission |
| Spotlight Integration | Via App Intents | N/A | Via App Intents | Find missions, start rescue from search |
| Apple Foundation Models | iOS 26+ (new) | N/A | Requires native Swift module | On-device AI for mission rewriting, classification |
| Android Usage Stats | N/A | Requires permission | Requires native module | Future: detect app usage patterns for drift signals |
| Screen Time API | iOS, limited, entitlement required | N/A | Requires native module + entitlement | Future: detect doomscroll patterns (privacy-critical) |
| Focus Mode Integration | iOS Focus filters | Android Do Not Disturb | Limited Expo support | Suggest focus mode during missions |

## Productivity / Focus Competitors

| Competitor | What It Does | Why Users Care | Why It Threatens INTENT | What INTENT Must Do Differently |
|---|---|---|---|---|
| Forest | Plant virtual trees during focus sessions | Gamification, visual progress, simple | Simple and beloved; has brand recognition | INTENT is not a timer. We rescue drift moments, not protect focus sessions. Our graph > their trees. |
| Opal | Screen time blocking, app scheduling | Actually blocks distractions at system level | Has system-level blocking INTENT can't match | INTENT complements blockers. We catch the *moment before* the scroll. Partnership > competition. |
| Todoist | Task management with AI features | Organizes everything, natural language input | AI task parsing is becoming table stakes | INTENT doesn't manage tasks. We convert *any* context into one tiny action. Our compiler > their parser. |
| Motion | AI calendar auto-scheduling | Removes planning friction | Proactive scheduling is powerful | INTENT operates at a different layer: emotional state → action. We don't schedule; we rescue. |
| Reclaim | AI habit scheduling, smart calendar | Protects time for what matters | Smart calendar integration is compelling | INTENT's Personal Drift Graph is our moat. We learn *why* you drift, not just *when*. |
| Structured | Daily task timeline with integrations | Visual daily plan, integrates with calendar | Clean UI, good integrations | INTENT is not a timeline. We appear at the moment of drift, not on a schedule. |
| Finch | Self-care pet app, micro-habits | Emotional connection, gentle accountability | Cute, emotional, sticky | INTENT must match emotional depth without being cute. Our salvage engine > their self-care loops. |
| Notion AI | AI-powered workspace | All-in-one workspace with AI | AI features in existing tools raise expectations | INTENT is not a workspace. We are a rescue agent. Our focus is narrower and deeper. |
| Body Doubling Apps (Focusmate, etc.) | Virtual co-working sessions | Human presence helps starting | Direct competitor to Body Double mode | INTENT's body double is always-on, free, and integrated with mission system. No scheduling needed. |
| ADHD/Focus Apps (Brili, Tiimo) | Routine management, visual timers | Designed for neurodivergent users | Understands specific user needs | INTENT must be careful: we don't diagnose or claim treatment. But we must serve these users well. |
| Habit Trackers (Streaks, Habitica) | Track habits, gamify consistency | Streaks are motivating (but can be toxic) | Streaks are the default mental model | INTENT explicitly rejects shame-based streaks. Our momentum system rewards salvage, not just completion. |

## App Store Trend Risks

| Risk | Description | How INTENT Mitigates |
|---|---|---|
| AI Slop | Flood of low-quality AI apps getting rejected or buried | INTENT has real deterministic engine. AI enhances, doesn't replace. Core works offline. |
| ChatGPT Wrapper Rejection | Apple rejects apps that are just API wrappers | INTENT's core is the drift graph + mission compiler. AI is an enhancement layer. |
| Subscription Clarity | Apple requires clear pricing, restore purchases, terms | Clear free/premium split. Restore purchases. No dark patterns. |
| Privacy Labels | Required data disclosure | Privacy-first architecture. Local-first. Data map in Trust Center. |
| Account Deletion | Apple requires account deletion if account exists | Account deletion in Trust Center. Data export before deletion. |
| AI Safety Copy | Apple scrutinizes AI claims | No misleading claims. "AI-enhanced" not "AI-powered." No medical claims. |
| Mental Health Claims | Apps making therapeutic claims get rejected | Explicit safety boundaries. "Not therapy. Not diagnosis. Not treatment." |

## Key Takeaways

1. **The bar is "agentic"** — users expect AI to *do* things, not just chat. INTENT must have real agent actions with safety gates.
2. **On-device matters** — Apple Foundation Models and on-device inference are the future. INTENT must have a local-first architecture.
3. **System surfaces are mandatory** — an app that only lives inside itself is 2023. Widgets, notifications, shortcuts, Live Activities are table stakes.
4. **Privacy is a feature** — in the post-ChatGPT era, users care about where their data goes. INTENT's Trust Center is a differentiator.
5. **The moat is behavioral** — anyone can build a timer. The Personal Drift Graph (learning *your* unique patterns) is defensible.
6. **Failure intelligence is unique** — no major competitor mines failure for patterns. INTENT's salvage engine is a moat.
