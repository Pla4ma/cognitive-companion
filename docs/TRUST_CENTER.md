# Trust Center — INTENT

## Purpose

A 2026 AI app must have a visible Trust Center. Not just a privacy policy link — a comprehensive, user-friendly explanation of what the app learns, how it uses data, and what the user controls.

## Sections

### 1. What INTENT Learns
Shows:
- Moments (state selections, energy, time)
- Missions (titles, outcomes — not raw text by default)
- Drift signals (behavioral patterns)
- Resistance patterns (what blocks you)
- Distractions (categories, not content)
- Coach preferences (push style, tone)
- Momentum events (scores, not private context)

### 2. What Stays Local
Shows:
- Local-only data categories
- Restricted memory items
- Private context capsules
- Raw brain dumps (when local-only mode is enabled)

### 3. What AI Can See
Shows:
- Current mission (title only, not raw context)
- Selected state
- Safe summary (not raw text)
- Allowed context (only if user permits)
- NOT: raw restricted content, brain dumps, distraction content

### 4. What Analytics Can See
Shows:
- Event names (moment_captured, mission_completed)
- No raw mission text by default
- No brain dump text
- No private distraction text
- Opt-out controls (toggle analytics off completely)

### 5. Agent Actions
Shows:
- Proposed actions (what the app wants to do)
- Executed actions (what the app did)
- Canceled actions (what you stopped)
- Permission receipts (audit trail)
- External service use (which services were accessed)

### 6. Safety Boundaries
Explains:
- Not therapy
- Not medical diagnosis
- Not emergency support
- Not a replacement for professional help
- AI may be wrong
- User controls all external actions

### 7. Local Mode
Lets user:
- Disable remote AI
- Disable analytics
- Keep all behavioral learning on device
- Clear cloud-linked state

### 8. Data Controls
- Export all data (JSON)
- Delete all data
- Delete specific memory items
- Delete coach history
- Delete context capsules
- Delete drift graph
- Delete account
- Revoke permissions

## Trust Center Copy Examples

**Header**: "INTENT can learn your patterns. It should never trap you inside them."

**Data Control**: "You can inspect, edit, or delete what INTENT remembers. Any time."

**AI Transparency**: "INTENT uses AI to improve missions. You control what it sees. Sensitive content stays local unless you allow otherwise."

**Local Mode**: "Turn on local mode to keep everything on your device. The app still works — it just doesn't send data anywhere."

**Agent Actions**: "INTENT can prepare actions like drafting emails or creating reminders. Nothing happens without your confirmation."

## Implementation

See: `src/features/trust/` (UI screens to be implemented)
Types: `src/types/privacy.ts` (complete)
