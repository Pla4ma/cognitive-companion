# INTENT — May 2026 Final Review

## Honest Assessment

### 1. Does INTENT feel like 2026 or 2024?
**2026, with caveats.** The ambient agent architecture, context inbox, action handoffs, and commandless agent are genuinely 2026 concepts. But the execution is still partly 2024 — the UI patterns, some engine implementations, and the native integration story are incomplete.

### 2. What can a user do that they cannot do in Forest/Todoist/AI coach apps?
- Get a rescue mission in under 3 seconds with Emergency Start
- Drop chaos into Context Inbox and get a tiny mission out
- Receive ambient suggestions during danger windows
- See their personal drift pattern and playbook
- Get attention receipts that show what they did with rescued time
- Have AI that acts more than it argues
- Experience a planning loop detector that catches overthinking

### 3. What is the one screenshot that sells it?
**The Drift Mirror.** "You almost drifted here: Overwhelmed + 5 minutes + essay. What saved it: Ugly First Move. Your new rule: When writing feels too big, start with one bad sentence."

### 4. What is the one TikTok demo?
**Emergency Start → Mission starts in 2 seconds → Timer runs → Attention Receipt appears.** No typing, no choices, no AI wait. Just action.

### 5. What is the one retention reason?
**The Personal Playbook.** It gets more valuable over time. After 20 rescues, it knows your patterns better than you do. Leaving means starting over.

### 6. What is the one privacy trust reason?
**Local-first, permissioned, auditable.** The Trust Center shows exactly what data exists, what was sent to AI, and what was kept local. Users can delete anything.

### 7. What is the one native integration story?
**Deep links + notification actions.** "Start 2-min rescue" from a notification opens the exact rescue flow with prefilled state/duration. Widgets and App Intents extend this.

### 8. What is the agentic capability today?
- Deterministic-first mission compilation
- Safety guard + quality gate
- Context extraction (basic)
- Protocol selection from drift graph
- Ambient suggestion generation
- Action handoff proposals (draft stage)
- Agent run tracing

### 9. What is only roadmap?
- Full App Intents (requires native Swift)
- Live Activities (requires native module)
- Foundation Models bridge (requires iOS 26+)
- Cloud agent backend
- MCP connectors
- Real calendar/reminder integration

### 10. What still feels fake?
- Context Inbox extraction is keyword-based, not NLP
- Body Double is just timer + check-ins, not real presence
- Accountability Pacts have no real contact integration
- Action Handoffs are draft-only, no real execution

### 11. What still feels too complex?
- Too many screens for a rescue app
- Coach can still be chatty if guardrails fail
- Some engines overlap (predictive vs commandless)
- State management is scattered

### 12. What should be removed?
- Dashboard as primary view
- Generic goals CRUD
- Long coach chat tab
- Multiple state chips when data exists
- Excessive stats before value experienced

### 13. What would make Apple reject it?
- Nothing obvious. App does not claim medical/therapeutic benefit. Safety engine redirects to professional resources. No hidden data collection.

### 14. What would make users uninstall?
- Too many notifications
- Generic missions that do not feel personal
- Slow time-to-action
- AI that argues instead of acting
- No visible progress

### 15. What would make users pay?
- Playbook that gets smarter over time
- Advanced Body Double modes
- Mission Chains for complex work
- Weekly story with real insights
- Accountability features

### 16. What would make users tell a friend?
**"This app caught me right before I started scrolling and gave me a 2-minute mission. I actually did it."** The Before You Scroll feature and Emergency Start are the viral moments.

### 17. Honest Rating

| Dimension | Score |
|-----------|-------|
| Product concept | 8.5/10 |
| Code architecture | 8/10 |
| Differentiation | 8/10 |
| 2026-native capability | 7.5/10 |
| Agentic depth | 7.5/10 |
| Native platform integration | 5/10 |
| Virality | 7/10 |
| App Store killer potential | 7.5/10 |
| **Overall** | **7.5/10** |

### What must happen to reach 10/10

1. **Native widgets + App Intents** — requires development build + Swift/Kotlin
2. **Live Activities** — requires ActivityKit native module
3. **Foundation Models bridge** — requires iOS 26+ native module
4. **Real context extraction** — NLP-based, not keyword
5. **Ambient agent that truly learns** — needs more data + cloud sync
6. **One "wait, what?" moment** — The Drift Mirror needs to be emotionally perfect
7. **First-week orchestration** — feature flags + day-by-day progression
8. **Simplification** — fewer screens, one primary action per surface
9. **Viral mechanic** — shareable attention receipts that make others want the app
10. **Performance** — time-to-action under 3 seconds for Emergency Start
