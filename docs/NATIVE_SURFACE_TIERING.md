# INTENT — Native Surface Implementation Tiering

## Overview

INTENT must exist across multiple surfaces to become a true ambient agent. This document defines what can be built at each tier, what requires native work, and the exact implementation path.

---

## Tier 0: Pure Expo / JS — Build Now

Everything in this tier works in Expo Go and requires no native code.

### ✅ Implemented

| Surface | Feature | Status |
|---------|---------|--------|
| In-app | State selection → mission | ✅ Built |
| In-app | Live mission timer | ✅ Built |
| In-app | Salvage flow | ✅ Built |
| In-app | Context inbox | ✅ Built |
| In-app | Action handoffs | ✅ Built |
| In-app | Ambient suggestions | ✅ Built |
| Deep links | `intent://rescue` routing | ✅ Built |
| Deep links | All action routes | ✅ Built |
| Notifications | Scheduled local notifications | ✅ Built |
| Notifications | Notification categories (Expo) | ⚠️ Partial |
| Share cards | Generated share images | ✅ Built |

### 🔧 To Build

| Feature | Effort | Notes |
|---------|--------|-------|
| Deep link testing harness | 1 day | Test all routes work correctly |
| Notification action buttons | 2 days | Expo notification categories with actions |
| Quick actions (3D touch menu) | 1 day | Expo `QuickActions` API |
| In-app widget cards | 2 days | Home screen cards mimicking widget layout |

---

## Tier 1: Expo Development Build + Config Plugins

Requires `expo-dev-client`. Cannot use Expo Go.

### iOS Widgets

| Component | Native Required | JS Bridge | Effort |
|-----------|----------------|-----------|--------|
| WidgetKit extension | Swift | Expo Module API | 3-4 days |
| Small widget (rescue button) | Swift | Shared data via App Group | 2 days |
| Medium widget (mission + timer) | Swift | Timeline provider | 2 days |
| Data provider | Swift | UserDefaults suite | 1 day |

**Config Plugin Required:**
```javascript
// withIntentWidget.js
module.exports = (config) => {
  // Add WidgetKit extension target
  // Configure App Group
  // Set up shared UserDefaults
  return config
}
```

### Android Widgets

| Component | Native Required | JS Bridge | Effort |
|-----------|----------------|-----------|--------|
| AppWidgetProvider | Kotlin | Expo Module API | 3-4 days |
| RemoteViews layout | XML | Shared SharedPreferences | 2 days |
| Widget receiver | Manifest | Config plugin | 1 day |

### Share Extension

| Component | Native Required | JS Bridge | Effort |
|-----------|----------------|-----------|--------|
| iOS Share Extension | Swift | Expo Module API | 3 days |
| Android Share Target | Kotlin | Intent filter | 2 days |
| JS handler | — | Linking API | 1 day |

### Calendar Integration

| Component | Native Required | JS Bridge | Effort |
|-----------|----------------|-----------|--------|
| iOS EventKit | Swift | Expo Calendar API | 2 days |
| Android Calendar Provider | Kotlin | ContentResolver | 2 days |

### App Shortcuts

| Component | Native Required | JS Bridge | Effort |
|-----------|----------------|-----------|--------|
| iOS Shortcuts app | Config plugin | Expo Module API | 2 days |
| Android App Shortcuts | Manifest | Dynamic shortcuts API | 1 day |

---

## Tier 2: Native Swift/Kotlin Modules

Requires custom native modules. Cannot be done in JS.

### App Intents (iOS 16+)

| Intent | Swift Implementation | JS Bridge | Effort |
|--------|---------------------|-----------|--------|
| StartRescueIntent | AppIntent protocol | Deep link | 2 days |
| CaptureDistractionIntent | AppIntent protocol | Deep link | 1 day |
| BeforeYouScrollIntent | AppIntent protocol | Deep link | 1 day |
| GetNextTinyActionIntent | AppIntent protocol | Deep link | 1 day |
| Siri integration | IntentHandler | Donate intent | 1 day |
| Spotlight indexing | CSSearchableIndex | Deep link | 1 day |

### ActivityKit / Live Activities (iOS 16.1+)

| Component | Swift | JS Bridge | Effort |
|-----------|-------|-----------|--------|
| LiveActivityAttributes | ActivityAttributes | Expo Module API | 2 days |
| Dynamic Island views | SwiftUI | Shared state | 2 days |
| Lock Screen widget | SwiftUI | Timer sync | 2 days |
| Activity updates | Activity.request | Push or local | 2 days |

### Foundation Models Bridge (iOS 18+)

| Function | Swift | Fallback | Effort |
|----------|-------|----------|--------|
| classifyMomentLocal | NLModel / CoreML | Deterministic rules | 3 days |
| extractActionsLocal | NLTagger | Regex patterns | 2 days |
| shrinkMissionLocal | Template matching | Template library | 2 days |
| generateCoachPulseLocal | NL generation | Copy banks | 2 days |

### Control Center (iOS 18+)

| Component | Swift | Effort |
|-----------|-------|--------|
| ControlWidget | ControlWidget protocol | 2 days |
| Quick rescue toggle | ToggleControl | 1 day |

### Action Button (iPhone 15 Pro+)

| Component | Swift | Effort |
|-----------|-------|--------|
| App intent binding | IntentResolver | 1 day |

### Android Usage Stats

| Component | Kotlin | Effort |
|-----------|--------|--------|
| UsageStatsManager | Permission + query | 3 days |
| Foreground service | Background monitoring | 2 days |

---

## Tier 3: Cloud Agent / Backend

Requires server infrastructure.

| Feature | Backend | Effort |
|---------|---------|--------|
| Background tasks | Supabase Edge Functions | 3 days |
| MCP connectors | Edge Function + MCP client | 5 days |
| Async agent runs | Edge Function + queue | 5 days |
| Cross-device sync | Supabase Realtime | 3 days |
| Push notifications | FCM/APNs via Supabase | 2 days |
| Cloud agent memory | Supabase RLS tables | 3 days |
| Subscription entitlements | Stripe + Supabase | 3 days |

---

## Implementation Order

### Sprint 1 (Week 1-2): Tier 0 Complete
1. Deep link testing harness
2. Notification action buttons
3. Quick actions menu
4. In-app widget-style cards

### Sprint 2 (Week 3-4): Tier 1 Foundation
1. Dev build setup
2. iOS widget (small + medium)
3. Android widget
4. Share extension (iOS)

### Sprint 3 (Week 5-6): Tier 1 Complete
1. Calendar integration
2. App shortcuts
3. Share extension (Android)

### Sprint 4 (Week 7-8): Tier 2 Core
1. App Intents (all 5)
2. Live Activities (basic)
3. Foundation Models bridge

### Sprint 5 (Week 9-10): Tier 2 Polish
1. Control Center widgets
2. Action Button integration
3. Android usage stats

### Sprint 6 (Week 11-12): Tier 3 Foundation
1. Supabase backend setup
2. Background tasks
3. Push notifications
4. Cloud sync

---

## Native File Structure

### iOS (when Tier 1/2 needed)

```
ios/
├── IntentWidgetExtension/
│   ├── IntentWidget.swift
│   ├── RescueWidget.swift
│   ├── TimerWidget.swift
│   ├── WidgetDataProvider.swift
│   └── Info.plist
├── IntentShareExtension/
│   ├── ShareViewController.swift
│   └── Info.plist
├── IntentAppIntents/
│   ├── StartRescueIntent.swift
│   ├── CaptureDistractionIntent.swift
│   ├── BeforeYouScrollIntent.swift
│   ├── GetNextTinyActionIntent.swift
│   └── IntentProvider.swift
├── IntentLiveActivity/
│   ├── LiveActivityAttributes.swift
│   ├── LiveActivityWidget.swift
│   └── DynamicIslandView.swift
└── IntentFoundationModels/
    ├── FoundationModelsBridge.swift
    ├── MomentClassifier.swift
    └── ActionExtractor.swift
```

### Android (when Tier 1/2 needed)

```
android/
├── app/src/main/java/com/intent/
│   ├── widget/
│   │   ├── RescueWidgetProvider.kt
│   │   ├── WidgetDataStore.kt
│   │   └── layouts/
│   ├── shortcuts/
│   │   ├── ShortcutManager.kt
│   │   └── DynamicShortcuts.kt
│   ├── share/
│   │   └── ShareReceiverActivity.kt
│   └── usage/
│       ├── UsageStatsService.kt
│       └── UsagePermissionHelper.kt
```

---

## Expo Module API Bridge Pattern

For each native feature, create a JS bridge module:

```typescript
// src/services/nativeBridge/widgetBridge.ts
import { requireNativeModule, Platform } from 'expo-modules-core'

interface WidgetBridgeModule {
  updateWidget(data: Record<string, unknown>): Promise<void>
  isAvailable(): Promise<boolean>
}

let widgetBridge: WidgetBridgeModule | null = null

try {
  widgetBridge = requireNativeModule<WidgetBridgeModule>('IntentWidget')
} catch {
  // Not available in Expo Go
}

export async function updateRescueWidget(mission: string, duration: number): Promise<void> {
  if (!widgetBridge) return
  await widgetBridge.updateWidget({ mission, duration, timestamp: Date.now() })
}

export async function isWidgetAvailable(): Promise<boolean> {
  if (!widgetBridge) return false
  return widgetBridge.isAvailable()
}
```

---

## Key Constraints

1. **Expo Go**: Only Tier 0 features work
2. **Dev Build**: Tier 0 + Tier 1 work
3. **Production Build**: All tiers work
4. **No faking**: If native module not available, show graceful fallback
5. **Privacy first**: Widget data must respect privacy mode
6. **Offline first**: All features must work without network

---

## Acceptance Criteria

- [ ] Tier 0: All deep links route correctly
- [ ] Tier 0: Notification actions trigger correct flows
- [ ] Tier 1: iOS widget shows rescue button and current mission
- [ ] Tier 1: Android widget shows rescue button
- [ ] Tier 1: Share extension captures text into context inbox
- [ ] Tier 2: App Intents work in Siri and Shortcuts
- [ ] Tier 2: Live Activity shows mission timer on lock screen
- [ ] Tier 2: Foundation Models classifies moments locally
- [ ] Tier 3: Background tasks run agent checks
- [ ] Tier 3: Push notifications deliver ambient suggestions
