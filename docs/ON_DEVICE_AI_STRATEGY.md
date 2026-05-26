# On-Device AI Strategy for INTENT

## What Works Now (Deterministic)

The core rescue system is fully deterministic and works offline:
- State selection → protocol mapping
- Mission generation from templates
- Drift signal detection from app behavior
- Salvage flow from predefined rules
- Personal drift graph computation
- All safety checks

This is the foundation. It always works. It never requires network.

## What Could Use On-Device AI (Future)

### Apple Foundation Models (iOS 26+)
Requires: Native Swift module, iOS 26+, config plugin

Potential tasks:
- **Summarize brain dump** → Extract key obligations
- **Classify moment** → Detect emotional state from text
- **Extract action items** → From pasted assignments
- **Rewrite mission** → Make it smaller/more specific
- **Generate coach pulse** → Personalized check-in text
- **Detect sensitive content** → Local privacy classification
- **Generate weekly insight** → From drift graph data

### Android Local Models
Requires: ONNX Runtime or similar, native module

Similar tasks as iOS, using on-device ML.

## Fallback Hierarchy

```
1. Deterministic local rules (always available)
2. Local templates (always available)
3. Cached successful patterns (available after first session)
4. On-device AI (if available and enabled)
5. Remote AI (if allowed and connected)
6. User manual choice (always available)
```

## Implementation Plan

### Now
- ✅ Deterministic engine (complete)
- ✅ Local templates (complete)
- ✅ Cached patterns (drift graph)
- ✅ Fallback hierarchy (defined)
- ⚠️ On-device AI bridge (placeholder only)

### Post-Launch
- Apple Foundation Models native module
- Android ONNX Runtime integration
- Config plugin for native bridges
- A/B test: on-device AI vs deterministic

## Honest Note

On-device AI is a **nice-to-have enhancement**, not a requirement. The deterministic engine produces high-quality missions without any AI. On-device AI would make missions more personalized and natural-sounding, but the core product works without it.

Do not claim on-device AI capabilities until the native module is implemented and tested.
