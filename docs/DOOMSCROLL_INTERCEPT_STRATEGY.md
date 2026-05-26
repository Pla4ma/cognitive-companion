# Doomscroll Intercept Strategy

## What We Can Do Now (MVP)

### User-Initiated Intercept
- User taps "Before I Scroll" button in app
- Widget shortcut to "Before I Scroll"
- Notification action: "2 min first"
- App quick action (long-press icon)
- Custom scheduled prompts ("Usually scroll at 9pm? Get a prompt at 8:55")

### Drift Signal Detection
- `app_open_no_start` → User opens app but doesn't start a mission
- Recommend smaller action, hide stats
- Offer "Before I Scroll" as a quick option

### Manual App-Blocker Guidance
- Provide instructions for setting up Screen Time limits
- Deep link to Screen Time settings (iOS)
- Suggest focus mode during missions

## What We Cannot Do (Honest)

- ❌ Detect actual doomscrolling in other apps (no API for this)
- ❌ Block apps at system level (requires MDM or Screen Time API with entitlement)
- ❌ Read Safari/Instagram/TikTok usage (privacy sandbox)
- ❌ Claim to "detect attention" (we detect app behavior, not attention)

## Future Possibilities

### iOS Screen Time API (DeviceActivity framework)
- Requires: Special entitlement from Apple
- Can monitor app usage during missions
- Can suggest blocking distracting apps
- Very limited API, Apple controls access

### Android UsageStats
- Requires: `PACKAGE_USAGE_STATS` permission
- User must grant in settings
- Can detect app switches during missions
- Can suggest blocking

### Focus Mode Integration
- iOS: Suggest enabling Focus mode during missions
- Android: Suggest Do Not Disturb
- Both: Deep link to settings

## The "Before You Scroll" Flow

1. User taps "Before I Scroll" (from app, widget, or notification)
2. App says: "Give me 2 minutes before you disappear."
3. Mission generated: tiny life/admin/study/cleaning action
4. User completes or salvages
5. App asks: "Now choose intentionally."
   - "I still want to scroll" → Opens chosen app
   - "I want another tiny mission" → Generates new mission
   - "I'm done" → Returns to main screen

## Key Principle

**Never shame scrolling.** The power is intentionality, not restriction. The user chooses after a tiny win. This reframes scrolling as a conscious choice, not a failure.

## Privacy

- Never read browsing history
- Never monitor other apps without explicit permission
- Never send browsing data to analytics
- All intercept data stays local
