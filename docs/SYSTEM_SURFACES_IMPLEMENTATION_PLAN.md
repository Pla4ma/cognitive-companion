# System Surfaces Implementation Plan

## Overview

A 2026 app cannot live only inside itself. INTENT must appear across system surfaces to catch users at the moment of drift.

## Feasibility Matrix

| Surface | iOS | Android | Expo SDK 56 | Dev Build Required | Intent Use |
|---|---|---|---|---|---|
| Home Screen Widget | ✅ WidgetKit | ✅ AppWidgets | ⚠️ Config plugin | ✅ Yes | "Rescue Me" button, momentum |
| Lock Screen Widget | ✅ WidgetKit | ⚠️ Limited | ⚠️ Config plugin | ✅ Yes | Active mission timer |
| Live Activities | ✅ ActivityKit | ❌ N/A | ⚠️ Native module | ✅ Yes + entitlement | Mission timer, done/salvage |
| Notification Actions | ✅ UNNotificationAction | ✅ Notification.Action | ✅ expo-notations | ❌ No | Start 2 min, smaller, stuck |
| App Intents / Shortcuts | ✅ AppIntents | ❌ N/A | ⚠️ Native module | ✅ Yes | Start rescue, capture distraction |
| Share Extension | ✅ ShareExtension | ⚠️ Share Target | ⚠️ Native module | ✅ Yes | Share text → mission |
| Quick Actions | ✅ UIApplicationShortcutItem | ⚠️ ShortcutManager | ⚠️ Config plugin | ✅ Yes | Long-press app icon |
| Voice Shortcuts | ✅ SiriKit | ⚠️ Google Assistant | ⚠️ Native module | ✅ Yes | "Hey Siri, rescue me" |
| Action Button | ✅ iPhone 15+ | ❌ N/A | ⚠️ Native module | ✅ Yes | Trigger rescue |

## Implementation Status

### ✅ Implemented (Expo-compatible)
- Notification action types and configurations (types defined)
- App intent action types (types defined)
- Widget data structures (types defined)
- Live Activity state types (types defined)
- Shortcut definitions (types defined)
- Shared content types (types defined)
- Surface availability matrix (documented)

### ⚠️ Requires Config Plugin / Native Module
- Home screen widget (iOS WidgetKit / Android AppWidgets)
- Lock screen widget
- Live Activity (iOS ActivityKit + entitlement)
- App Intents (iOS)
- Share extension (iOS/Android)
- Quick actions
- Voice shortcuts
- Action button

## What Needs a Development Build

All native surfaces require:
1. `prebuild` to generate native code
2. Config plugins for each surface
3. Native Swift/Kotlin module implementations
4. Entitlements (Live Activities, App Groups)
5. App Store review for entitlements

## Implementation Order

1. **Notification Actions** (easiest, works with Expo) — Phase 8
2. **Quick Actions** (config plugin) — Phase 11
3. **Home Screen Widget** (config plugin + native) — Phase 14
4. **App Intents** (native module) — Phase 16
5. **Live Activity** (entitlement required) — Phase 18
6. **Share Extension** (native module) — Phase 20
7. **Voice Shortcuts** (App Intents dependency) — Phase 22
8. **Action Button** (native module, iPhone 15+) — Phase 24

## Honest Note

Until a development build is created with the appropriate config plugins and native modules, these surfaces exist as **type definitions and mock implementations only**. The types are real and complete. The native code is not.

This is intentional — we architect first, implement native code when the build is ready.
