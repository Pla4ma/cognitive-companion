# INTENT

**Anti-procrastination agent for your pocket.** No dashboard. No AI hype. One screen: "About to drift? Pick your state. I'll shrink the action."

## What It Does

INTENT is a local-first mobile app that intercepts avoidance before it becomes a scroll hole.

1. **State selection** — Name how you feel (avoiding, overwhelmed, stuck, tired, etc.)
2. **Protocol match** — The app selects a rescue protocol tuned to that state
3. **Micro-mission** — You get a tiny, concrete action (2–5 minutes, physically doable)
4. **Live session** — Body-double timer with distraction capture
5. **Complete or salvage** — Every outcome is progress data

## Core Screens

```
/              — Home: state selector + rescue button
/live          — Active mission session (timer, distractions)
/focus         — Body-double accountability session
/coach         — Text-to-mission (paste chaos, get action)
/before-scroll — Intercept before you open social media
/progress      — Minimal stats (minutes rescued, streak)
/settings      — App preferences
/onboarding    — First-run setup
```

## Tech Stack

- **Expo SDK 56** — React Native 0.76, Expo Router v4
- **Deterministic engine** — No remote AI dependency. Rescue protocols, mission compiler, drift graph all run on-device.
- **Zustand** — Client state
- **Async Storage** — Persistence
- **Optional Sentry** — Crash reporting (consent-gated, PII-scrubbed)

## Why No Remote AI?

Every feature works 100% offline. Rescue protocols are matched by state, not by LLM. The app doesn't need an API key, a cloud backend, or a subscription to help you start.

Remote AI (if configured) is strictly additive — it can refine mission quality, but the deterministic fallback is always there. No data ever leaves the device without explicit consent.

## Setup

```bash
git clone <repo>
cd cognitive-companion
npm install
npx expo start
```

## Design Principles

1. **One decisive action per open** — No dashboard museum. The home screen asks one question.
2. **Smallest possible intervention** — 2-minute actions beat 25-minute plans.
3. **Failure is data, not judgment** — Salvage is always an option. Shame is the enemy.
4. **Local-first, always** — No cloud dependency for core functionality.
5. **Privacy is the product** — PII is never collected. Crash reports are opt-in and scrubbed.

## Status

Working prototype. Core loop (state select → rescue → live → complete/salvage) is functional. Overbuilt features are being trimmed. TypeScript-clean build.
