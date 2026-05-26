# INTENT — Live Activity Spec & Timer Rearchitecture

## Overview

Live Activities show mission progress on the Lock Screen and Dynamic Island. The timer must be rearchitected to support background persistence, app kill recovery, and Live Activity updates.

---

## Live Activity Data Model

### LiveActivityAttributes

```swift
struct LiveActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var missionId: String
        var exactAction: String
        var protocolName: String
        var startTime: Date
        var endTime: Date
        var elapsed: TimeInterval
        var remaining: TimeInterval
        var state: TimerState
        var bodyDoubleMode: String?
        var actions: [LiveActivityAction]
    }
    
    var missionId: String
    var missionTitle: String
}

enum TimerState: String, Codable {
    case preparing, running, paused, backgrounded, completed, abandoned, salvageOffered
}

enum LiveActivityAction: String, Codable {
    case done, stuck, makeSmaller, captureDistraction, salvage
}
```

### Dynamic Island Views

**Compact Leading:** Timer countdown  
**Compact Trailing:** Mission state icon  
**Minimal:** Timer + state color  
**Expanded:** Full mission details + action buttons  

### Lock Screen Widget

```
┌─────────────────────────────────┐
│ 🎯 INTENT Rescue     ⏱️ 2:34  │
│                                 │
│ "Write one ugly sentence"       │
│                                 │
│ [Done] [Stuck] [Smaller]        │
└─────────────────────────────────┘
```

---

## Timer State Machine

### States

```
idle → preparing → running → completed
                     ↓          ↑
                  paused ───────┘
                     ↓
               backgrounded → running (foreground)
                     ↓
                abandoned
                     ↓
             salvage_offered → salvaged
```

### Transitions

| From | To | Trigger |
|------|-----|---------|
| idle | preparing | User starts mission |
| preparing | running | Timer starts |
| running | paused | User pauses |
| running | backgrounded | App backgrounds |
| running | completed | Timer ends / user completes |
| running | abandoned | User cancels |
| running | salvage_offered | User stuck |
| paused | running | User resumes |
| backgrounded | running | App foregrounds |
| salvage_offered | salvaged | User accepts salvage |
| salvage_offered | abandoned | User declines |

---

## Timer Service Architecture

### File Structure

```
src/services/timer/
├── missionTimer.ts          # Core timer logic
├── timerPersistence.ts      # AsyncStorage persistence
├── timerStateMachine.ts     # State transitions
├── timerEvents.ts           # Event emitter for UI updates
└── index.ts
```

### missionTimer.ts

```typescript
interface MissionTimer {
  id: string
  missionId: string
  startTime: number        // Date.now()
  plannedEndTime: number   // startTime + duration
  actualEndTime: number | null
  state: TimerState
  elapsed: number          // computed from Date.now() - startTime
  remaining: number        // computed from plannedEndTime - Date.now()
  backgroundedAt: number | null
  totalPausedMs: number
}

// Core functions
startTimer(missionId: string, durationMinutes: number): MissionTimer
pauseTimer(timer: MissionTimer): MissionTimer
resumeTimer(timer: MissionTimer): MissionTimer
backgroundTimer(timer: MissionTimer): MissionTimer
foregroundTimer(timer: MissionTimer): MissionTimer
completeTimer(timer: MissionTimer): MissionTimer
abandonTimer(timer: MissionTimer): MissionTimer
salvageTimer(timer: MissionTimer): MissionTimer

// Computed
getElapsed(timer: MissionTimer): number
getRemaining(timer: MissionTimer): number
isExpired(timer: MissionTimer): boolean
```

### timerStateMachine.ts

```typescript
type TimerState = 
  | 'idle' | 'preparing' | 'running' | 'paused' 
  | 'backgrounded' | 'completed' | 'abandoned' 
  | 'salvage_offered' | 'salvaged'

interface TimerTransition {
  from: TimerState
  to: TimerState
  guard: (timer: MissionTimer) => boolean
  action: (timer: MissionTimer) => MissionTimer
}

const TRANSITIONS: TimerTransition[] = [
  { from: 'idle', to: 'preparing', guard: () => true, action: initTimer },
  { from: 'preparing', to: 'running', guard: () => true, action: startRunning },
  { from: 'running', to: 'paused', guard: (t) => t.state === 'running', action: pause },
  { from: 'running', to: 'backgrounded', guard: () => true, action: background },
  { from: 'running', to: 'completed', guard: () => true, action: complete },
  { from: 'backgrounded', to: 'running', guard: () => true, action: foreground },
  { from: 'running', to: 'salvage_offered', guard: () => true, action: offerSalvage },
  { from: 'salvage_offered', to: 'salvaged', guard: () => true, action: salvage },
  { from: 'salvage_offered', to: 'abandoned', guard: () => true, action: abandon },
]
```

### timerPersistence.ts

```typescript
const TIMER_STORAGE_KEY = 'intent-active-timer'

async function saveTimer(timer: MissionTimer): Promise<void>
async function loadTimer(): Promise<MissionTimer | null>
async function clearTimer(): Promise<void>

// On app launch, check for persisted timer
async function recoverTimer(): Promise<MissionTimer | null> {
  const saved = await loadTimer()
  if (!saved) return null
  
  if (saved.state === 'running') {
    // App was killed while timer running
    // Calculate elapsed from saved startTime
    saved.state = 'backgrounded'
    saved.backgroundedAt = saved.backgroundedAt ?? Date.now()
  }
  
  return saved
}
```

### timerEvents.ts

```typescript
type TimerEventType = 
  | 'tick' | 'state_change' | 'completed' | 'salvage_offered' 
  | 'drift_detected' | 'background' | 'foreground'

interface TimerEvent {
  type: TimerEventType
  timer: MissionTimer
  timestamp: number
}

// Event emitter for UI updates
function onTimerEvent(type: TimerEventType, handler: (event: TimerEvent) => void): () => void
function emitTimerEvent(event: TimerEvent): void
```

---

## Background Handling

### App Background → Foreground

1. On background: save `backgroundedAt` timestamp
2. On foreground: calculate `elapsed = Date.now() - startTime - totalPausedMs`
3. If elapsed >= plannedDuration: trigger completion
4. If elapsed < plannedDuration: resume with correct remaining
5. Update Live Activity

### App Kill Recovery

1. On app launch: check AsyncStorage for persisted timer
2. If timer exists and state was 'running':
   - Calculate elapsed from `startTime`
   - If expired: offer salvage
   - If not expired: resume in backgrounded state
3. Clear persisted timer after recovery

### Clock Changes / Timezone

- Use `Date.now()` exclusively (Unix timestamp, timezone-agnostic)
- Never use `Date` objects for duration calculations
- Store all times as milliseconds since epoch

---

## Live Activity Updates

### Update Frequency

- Running: every 15 seconds
- Paused: on state change only
- Backgrounded: on foreground only
- Near completion: every 5 seconds (last 30 seconds)

### Update Payload

```typescript
function buildLiveActivityUpdate(timer: MissionTimer, mission: Mission): LiveActivityUpdate {
  return {
    missionId: timer.missionId,
    exactAction: mission.exactAction,
    protocolName: mission.protocolId,
    startTime: new Date(timer.startTime),
    endTime: new Date(timer.plannedEndTime),
    elapsed: getElapsed(timer),
    remaining: getRemaining(timer),
    state: timer.state,
    actions: ['done', 'stuck', 'make_smaller', 'capture_distraction'],
  }
}
```

---

## Drift Detection During Timer

When the timer is running, detect drift signals:

1. **Long pause**: If paused > 2 minutes, suggest smaller mission
2. **No interaction**: If no app interaction for 5 minutes, send gentle nudge
3. **Background duration**: If backgrounded > 10 minutes, offer salvage
4. **Multiple distractions**: If > 3 distractions captured, suggest body double

---

## Acceptance Criteria

- [ ] Timer uses Date.now() for all calculations
- [ ] Background → foreground recovery is accurate to 1 second
- [ ] App kill → relaunch recovery works
- [ ] Timer state persists across app restarts
- [ ] Live Activity shows correct time on lock screen
- [ ] Dynamic Island shows mission state
- [ ] Drift signals generated during timer
- [ ] Salvage offered after long background
