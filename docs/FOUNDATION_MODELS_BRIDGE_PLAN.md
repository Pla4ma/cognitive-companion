# INTENT — Foundation Models Bridge Plan

## Overview

Apple's Foundation Models (iOS 18+) provide on-device AI capabilities that can power INTENT's core features without sending data to remote servers. This document defines the native bridge architecture.

---

## Capabilities

### What Foundation Models Can Do

| Capability | INTENT Use Case | Privacy Benefit |
|------------|-----------------|-----------------|
| Text classification | Classify moment state | No state sent to cloud |
| Named entity recognition | Extract obligations from context | Raw text stays local |
| Text generation | Generate coach pulses | Coaching without remote AI |
| Sentiment analysis | Detect shame/spiral language | Safety checks on-device |
| Text summarization | Summarize weekly story | Memory stays private |

### What It Cannot Do

- Complex multi-step reasoning (use deterministic rules)
- Long-form mission compilation (use template library)
- Tool execution decisions (use policy engine)

---

## Native Bridge Interface

### IntentFoundationModelsModule (Swift)

```swift
import FoundationModels

class IntentFoundationModelsModule {
    
    // Check availability
    func isAvailable() -> Bool {
        return ProcessInfo.processInfo.operatingSystemVersion.majorVersion >= 18
    }
    
    // Classify moment from text input
    func classifyMomentLocal(input: String) -> MomentClassification {
        // Use NLModel or Foundation Models
        // Returns: state, confidence, energy_estimate
    }
    
    // Extract actions from messy text
    func extractActionsLocal(text: String) -> ExtractedContext {
        // Use Named Entity Recognition
        // Returns: obligations, deadlines, people, blockers
    }
    
    // Shrink a mission to smaller version
    func shrinkMissionLocal(mission: String, state: String) -> MicroMission {
        // Template matching + generation
        // Returns: smaller mission, fallback, duration
    }
    
    // Generate coach pulse
    func generateCoachPulseLocal(context: String) -> String {
        // Generate encouraging text
        // Returns: short coach message
    }
    
    // Detect sensitive content
    func detectSensitiveContentLocal(text: String) -> SensitivityResult {
        // Classification
        // Returns: sensitivity level, categories
    }
    
    // Summarize weekly events
    func summarizeWeeklyLocal(events: [String]) -> WeeklySummary {
        // Summarization
        // Returns: narrative, key stats, suggestions
    }
}
```

---

## JS Bridge Interface

### src/services/onDeviceAI/foundationModelsBridge.ts

```typescript
interface OnDeviceAI {
  isAvailable(): Promise<boolean>
  classifyMoment(input: string): Promise<MomentClassification>
  extractActions(text: string): Promise<ExtractedContext>
  shrinkMission(mission: string, state: string): Promise<MicroMissionSuggestion>
  generateCoachPulse(context: string): Promise<string>
  detectSensitiveContent(text: string): Promise<SensitivityResult>
  summarizeWeekly(events: string[]): Promise<WeeklySummary>
}

// Deterministic fallback implementation
class DeterministicAI implements OnDeviceAI {
  async isAvailable() { return true } // Always available
  
  async classifyMoment(input: string) {
    // Pattern matching on keywords
    return classifyByPatterns(input)
  }
  
  async extractActions(text: string) {
    // Regex-based extraction
    return extractContextDeterministic(text)
  }
  
  async shrinkMission(mission: string, state: string) {
    // Template-based shrinking
    return shrinkByTemplate(mission, state)
  }
  
  async generateCoachPulse(context: string) {
    // Copy bank selection
    return selectCoachCopy(context)
  }
  
  async detectSensitiveContent(text: string) {
    // Pattern matching
    return detectSensitivityByPatterns(text)
  }
  
  async summarizeWeekly(events: string[]) {
    // Statistical summary
    return generateStatSummary(events)
  }
}

// Native bridge implementation (requires iOS 18+)
class NativeFoundationAI implements OnDeviceAI {
  private module: any
  
  constructor() {
    try {
      this.module = requireNativeModule('IntentFoundationModels')
    } catch {
      throw new Error('Native module not available')
    }
  }
  
  async isAvailable() {
    return this.module?.isAvailable() ?? false
  }
  
  // ... delegates to native module
}

// Factory
export function createOnDeviceAI(): OnDeviceAI {
  try {
    const native = new NativeFoundationAI()
    if (native.isAvailable()) return native
  } catch {}
  return new DeterministicAI()
}
```

---

## Fallback Strategy

Every function has a deterministic fallback:

| Function | Native AI | Fallback |
|----------|-----------|----------|
| classifyMoment | NLModel | Keyword patterns |
| extractActions | NER | Regex patterns |
| shrinkMission | Generation | Template library |
| generateCoachPulse | Generation | Copy bank |
| detectSensitiveContent | Classification | Pattern matching |
| summarizeWeekly | Summarization | Statistical aggregation |

---

## Privacy Architecture

### Data Flow

```
User Input
    ↓
[Privacy Gate] ← Classify sensitivity
    ↓
[On-Device AI] ← If available and allowed
    ↓
[Deterministic Fallback] ← Always available
    ↓
[Quality Gate] ← Validate output
    ↓
[Product State] ← Store approved result
```

### Rules

1. Raw text NEVER sent to remote AI without explicit consent
2. Sensitive content NEVER leaves device
3. On-device AI results validated same as remote AI
4. User can disable all AI (local-only mode)
5. Deterministic fallback always works

---

## Android Equivalent

### Future: Local Model Bridge

```kotlin
class IntentLocalModelModule {
    // Similar interface
    // Could use:
    // - ML Kit for entity extraction
    // - TensorFlow Lite for classification
    // - Gemini Nano (when available)
    
    fun classifyMomentLocal(input: String): MomentClassification
    fun extractActionsLocal(text: String): ExtractedContext
    // ...
}
```

### Current: Same Deterministic Fallback

Android uses the same TypeScript deterministic fallback until native modules are built.

---

## Implementation Phases

### Phase 1: JS Interface (Now)
- [x] Define OnDeviceAI interface
- [x] Implement DeterministicAI
- [x] Wire into mission compiler
- [x] Wire into context extractor

### Phase 2: iOS Native Bridge (Dev Build)
- [ ] Create Expo Module
- [ ] Implement IntentFoundationModelsModule
- [ ] Test availability check
- [ ] Implement classifyMoment
- [ ] Implement extractActions

### Phase 3: Android Native Bridge
- [ ] Create Expo Module
- [ ] Implement with ML Kit
- [ ] Test availability

### Phase 4: Production
- [ ] Graceful fallback testing
- [ ] Performance benchmarks
- [ ] Privacy audit
- [ ] App Store documentation

---

## Acceptance Criteria

- [ ] JS code calls onDeviceAI without knowing implementation
- [ ] Deterministic fallback works for all functions
- [ ] Native module fails gracefully when unavailable
- [ ] Privacy classification enforced before any AI call
- [ ] Quality gate validates all AI output
- [ ] User can disable AI entirely
- [ ] Performance: < 500ms for on-device classification
