# ══════════════════════════════════════════════════════════════
# INTENT — Focus/Live Merge Specification
# June 2026
# ══════════════════════════════════════════════════════════════

## Problem

Two `app/live.tsx` and `app/focus.tsx` both:
- Start sessions
- Have timers with `elapsedSeconds` / store updates
- Handle distraction capture
- Handle complete/abandon/salvage flows

This creates: duplicate code, confusion about which screen to use, risk of conflicting active sessions.

## Solution

Merge all session-ui into `app/live.tsx` with a `mode` route param.

### Modes

| Mode | Entry Point | Duration Default | Features |
|------|------------|-----------------|----------|
| `rescue` | Home "Rescue Me" | 2–25 min (user-selected) | Minimal UI, just timer + mission text |
| `body_double` | Coach "Body Double" or Quick Action | 25 min | Checkpoints, milestones, body presence modes |
| `deep_work` | Coach / explicit intent | 50 min | All body_double features + extended milestones |

### Route Params

```typescript
// Navigation from home:
router.push({ pathname: '/live', params: { mode: 'rescue', missionId: '...' } })

// Navigation from coach quick action:
router.push({ pathname: '/live', params: { mode: 'body_double' } })

// Default (backward compat):
// /live → defaults to mode=rescue
```

### Implementation Plan

1. Add `useLocalSearchParams` to `live.tsx` to read `mode`
2. Conditionally render sections based on `mode === 'body_double'` or `mode === 'deep_work'`
3. Extract focus-only features (checkpoints, milestones, body presence modes) into separate components
4. Include these components conditionally in `live.tsx`
5. Make `focus.tsx` a thin redirect: `router.replace('/live?mode=body_double')`

### Conditional Sections in live.tsx

```tsx
const { mode = 'rescue' } = useLocalSearchParams<{ mode: string }/>

{mode !== 'rescue' && (
  <>
    <Checkpoints milestones={milestones} current={elapsedSeconds} />
    <BodyPresenceIndicator mode={bodyPresenceMode} />
    <SessionMilestones checkpoints={[25, 50, 75]} />
  </>
)}
```

### Focus.tsx After Merge

```tsx
export default function FocusScreen() {
  const router = useRouter()
  useEffect(() => {
    router.replace({ pathname: '/live', params: { mode: 'body_double' } })
  }, [])
  return null
}
```

## Verification

- `/focus` redirects to `/live?mode=body_double`
- `/live` (no params) works as before (rescue mode)
- Rescue flow from home screen works unchanged
- Body double features appear in body_double mode
- No duplicate `activeSession` risk (single screen)

## Status

Spec approved. Implementation pending.
