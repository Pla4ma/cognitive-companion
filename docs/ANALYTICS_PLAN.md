# Analytics Plan for INTENT

## Core Funnel

```
app_opened → moment_captured → protocol_selected → mission_compiled → mission_started → mission_completed/salvaged
```

## Activation Metric

**first_rescue_completed OR first_rescue_salvaged**

A user is "activated" when they complete or salvage their first mission. This is the key moment — they've experienced the core value.

## Retention Metrics

- D1 return: User opens app the next day
- D3 return: User opens app within 3 days
- D7 return: User opens app within 7 days
- Comeback after failure: User returns within 24h of abandoning
- Widget/notification action usage: User starts from outside the app
- Weekly story viewed: User engages with insights
- Experiment started: User tries a self-experiment
- Body double repeat usage: User uses body double more than once

## Behavior Metrics

- Start rate by state: % of moments that lead to mission start
- Completion rate by state: % of started missions that complete
- Salvage rate: % of abandoned missions that are salvaged
- Abandonment by duration: Which durations have highest abandonment
- Best protocol by user segment: Which protocols work best
- Mission quality score: Average quality of compiled missions
- Time to start: Seconds from app open to mission start
- No-typing flow usage: % of missions started without typing
- AI vs local mission performance: Completion rate comparison
- Notification action conversion: % of notifications that lead to action
- Before-scroll conversion: % of intercepts that lead to mission

## Quality Metrics

- Crash-free sessions: Target >99%
- App startup time: Target <2s
- Mission compile latency: Target <300ms local
- AI response latency: Target <3s
- Fallback rate: % of times local fallback is used
- Timer accuracy: Drift <1s per minute
- Storage errors: Target 0
- Notification delivery rate: Target >95%
- Action review cancel rate: % of proposed actions that are canceled

## Privacy Rules

### Never Send to Analytics
- Raw mission text (use categories/tags instead)
- Brain dump text
- Distraction content
- Sensitive context
- Raw user text of any kind

### Safe to Send
- Event names (moment_captured, mission_completed, etc.)
- State labels (avoiding, overwhelmed, etc.)
- Protocol IDs (two_minute_ignition, etc.)
- Duration numbers (2, 5, 10, etc.)
- Outcome labels (completed, salvaged, abandoned)
- Surface labels (app, widget, notification)
- Quality scores (0-1 ranges)
- Confidence labels (low, emerging, reliable, strong)

### Opt-Out
- All analytics can be disabled in Trust Center
- When disabled, no events are sent
- Local analytics (for user's own view) still work

## Event Schema Examples

```typescript
// Moment captured
moment_captured: {
  source: 'app_open' | 'widget' | 'notification_action' | ...
  userState: 'avoiding' | 'overwhelmed' | ...
  intensity: 1 | 2 | 3 | 4 | 5
  availableTime: 1 | 2 | 5 | 10 | 15 | 25
  energy: 'depleted' | 'low' | 'medium' | 'high'
  privacyClassification: 'local_only' | 'safe_for_ai' | 'sensitive'
}

// Mission compiled
mission_compiled: {
  protocolId: string
  duration: number
  missionQualityScore: number // 0-1
  usedAI: boolean
  usedFallback: boolean
  stateFit: number
  durationFit: number
}

// Mission completed
mission_completed: {
  duration: number
  protocolId: string
  state: string
  salvageUsed: boolean
  sourceSurface: string
}

// Mission salvaged
mission_salvage: {
  originalDuration: number
  salvageDuration: number
  protocolId: string
  abandonmentReason: string
}
```
