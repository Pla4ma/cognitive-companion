# INTENT — Pruning Decisions

## Feature Classification

### Core Day 0 (Must ship)
- Emergency Start button
- State selection (manual)
- Mission compiler
- Live mission timer
- Salvage flow
- Attention Receipt
- Before You Scroll (basic)
- Trust Center (privacy controls)
- Onboarding flow
- Deep link handling

### Core First Week
- Personal Drift Graph (simple)
- Weekly Story (basic)
- Context Inbox (paste chaos)
- Body Double (basic)
- Ambient Mode (opt-in, low frequency)
- Mission outcome labels
- Open Loops (basic)
- Playbook (starter rules)

### Premium Later
- Advanced Playbook with AI insights
- Advanced Body Double modes
- Mission Chains
- Advanced Context parsing
- Accountability Pacts
- Action Handoffs (full)
- Drift Mirror (full)
- Personalized experiments
- Weekly story with AI narration

### Native Later (Requires dev build)
- iOS/Android widgets
- App Intents
- Live Activities
- Share extension
- Foundation Models bridge
- Calendar/reminder integration
- Voice shortcuts

### Experimental (Flag behind feature flags)
- MCP connectors
- Advanced ambient mode
- Accountability pacts with real contact sync
- Screen time integration
- Cross-device sync

### Delete / Hide
- Dashboard clutter (stats as primary UI)
- Excessive charts
- Generic goals CRUD (feels like Todoist)
- Generic streak obsession
- Long coach chat as primary tab
- Multiple state selection chips when data exists
- Generic "How are you?" prompts when context available

---

## Navigation Simplification

**Before**: 7+ tabs, dashboard-heavy
**After**: 3 primary modes

### Tab 1: Rescue
- Emergency Start
- State selection (manual or commandless)
- Before You Scroll
- Live Mission
- Salvage
- Body Double
- Mission Chains

### Tab 2: Playbook
- Momentum / Intent Score
- Drift Graph
- Weekly Story
- Experiments
- Personal Rules
- Drift Mirror

### Tab 3: Vault
- Context Inbox
- Mission Threads
- Open Loops
- Memory / Trust Center
- Action Handoffs
- Settings

### Contextual (Not tabs)
- Coach: appears in mission, rescue sheet, context capsule, salvage
- Notifications: ambient suggestions
- Widgets: one-tap rescue

---

## Complexity Reduction Rules

1. One primary action per screen
2. No feature requires more than 2 taps to start
3. No form has more than 3 fields
4. No screen has more than 5 interactive elements visible
5. Coach never produces paragraphs unless user asks
6. Stats never shown before value experienced
7. Settings grouped by concern, not by feature
8. No feature explanation longer than 1 sentence
