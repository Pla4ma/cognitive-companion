# INTENT — App Intents Spec (iOS 16+)

## Overview

App Intents let INTENT respond to Siri, Shortcuts, Spotlight, and system actions without opening the app. Each intent maps to a deep link and can return structured results.

---

## Intent 1: StartRescueIntent

**Title:** Start Rescue  
**Description:** Begin a tiny rescue mission with optional state and duration

### Parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| state | String | No | `unclear` | User's current drift state |
| duration | Int | No | `5` | Mission duration in minutes |
| energy | String | No | `medium` | Energy level |

### Privacy Notes
- State labels are local-only
- No data sent to Siri servers
- Intent donation is anonymized

### JS Deep Link
```
intent://rescue?state={state}&duration={duration}&energy={energy}&source=app_intent
```

### Swift Pseudo-code
```swift
struct StartRescueIntent: AppIntent {
    static var title: LocalizedStringResource = "Start Rescue"
    static var description = IntentDescription("Begin a tiny rescue mission")
    static var openAppWhenRun: Bool = true
    
    @Parameter(title: "State")
    var state: String?
    
    @Parameter(title: "Duration")
    var duration: Int?
    
    func perform() async throws -> some IntentResult {
        let url = "intent://rescue?state=\(state ?? "unclear")&duration=\(duration ?? 5)&source=app_intent"
        return .result(opensIntent: URL(string: url)!)
    }
}
```

### Test Cases
- Default parameters → opens rescue with defaults
- With state "overwhelmed" → opens rescue with overwhelmed state
- With duration 2 → opens 2-minute rescue
- Invalid state → defaults to "unclear"
- Works without network

---

## Intent 2: CaptureDistractionIntent

**Title:** Capture Distraction  
**Description:** Save a distraction thought without losing focus

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| text | String | No | The distraction text |

### Privacy Notes
- Text stored locally only
- Never included in analytics
- Classified for sensitivity

### JS Deep Link
```
intent://capture-distraction?text={text}
```

### Swift Pseudo-code
```swift
struct CaptureDistractionIntent: AppIntent {
    static var title = "Capture Distraction"
    static var description = IntentDescription("Save a distraction and return to focus")
    
    @Parameter(title: "Distraction")
    var text: String?
    
    func perform() async throws -> some IntentResult & OpensIntent {
        let url = "intent://capture-distraction?text=\(text ?? "")"
        return .result(opensIntent: URL(string: url)!)
    }
}
```

### Test Cases
- With text → saves distraction and confirms
- Without text → opens capture form
- Sensitive text → classified appropriately
- Long text → truncated safely

---

## Intent 3: BeforeYouScrollIntent

**Title:** Before You Scroll  
**Description:** Start a tiny win before scrolling

### Parameters

| Name | Type | Required | Default |
|------|------|----------|---------|
| duration | Int | No | `2` |

### JS Deep Link
```
intent://before-scroll?duration={duration}
```

### Swift Pseudo-code
```swift
struct BeforeYouScrollIntent: AppIntent {
    static var title = "Before You Scroll"
    static var description = IntentDescription("Do a tiny action before scrolling")
    
    @Parameter(title: "Duration")
    var duration: Int?
    
    func perform() async throws -> some IntentResult {
        let url = "intent://before-scroll?duration=\(duration ?? 2)"
        return .result(opensIntent: URL(string: url)!)
    }
}
```

### Test Cases
- Default → 2-minute before-scroll flow
- With duration 5 → 5-minute flow
- Opens correct screen directly

---

## Intent 4: StartBodyDoubleIntent

**Title:** Start Body Double  
**Description:** Start a body double session for accountability

### Parameters

| Name | Type | Required | Default |
|------|------|----------|---------|
| mode | String | No | `gentle` |
| mission | String | No | — |

### JS Deep Link
```
intent://body-double?mode={mode}&source=app_intent
```

### Test Cases
- Default → gentle body double
- With mode "silent" → silent mode
- Works with existing mission context

---

## Intent 5: GetNextTinyActionIntent

**Title:** Get Next Tiny Action  
**Description:** Get the next small action to take

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| context | String | No | Additional context |

### Returns
- Mission title
- Exact action
- Duration

### JS Deep Link
```
intent://rescue?source=app_intent
```

### Swift Pseudo-code
```swift
struct GetNextTinyActionIntent: AppIntent {
    static var title = "Get Next Tiny Action"
    static var description = IntentDescription("Get your next small action")
    static var isDiscoverable: Bool = true
    
    func perform() async throws -> some IntentResult & ReturnsValue<String> {
        // Returns formatted action text
        return .result(value: "Open essay doc and write one ugly sentence")
    }
}
```

---

## Intent 6: BrainDumpIntent

**Title:** Brain Dump  
**Description:** Capture messy thoughts and get a mission

### Parameters

| Name | Type | Required |
|------|------|----------|
| text | String | Yes |

### JS Deep Link
```
intent://paste-chaos?text={text}&source=app_intent
```

---

## Intent 7: SalvageCurrentMissionIntent

**Title:** Salvage Current Mission  
**Description:** Get a smaller version of the current mission

### Parameters
None.

### JS Deep Link
```
intent://salvage-current
```

---

## Siri Integration

### Phrases
- "Rescue me with Intent"
- "Start a tiny mission"
- "Before I scroll"
- "I'm stuck"
- "Capture distraction"
- "Brain dump"

### Intent Donation
After successful rescue, donate the intent to improve Siri suggestions:
```swift
let intent = StartRescueIntent()
intent.state = "overwhelmed"
intent.duration = 5
INInteraction(intent: intent, response: nil).donate()
```

---

## Spotlight Indexing

Index completed rescues for search:
```swift
let attributeSet = CSSearchableItemAttributeSet(itemContentType: "rescue")
attributeSet.title = "Rescue: Overwhelmed → 5 min"
attributeSet.contentDescription = "You rescued this moment"
```

---

## Shortcuts Integration

All intents are available in the Shortcuts app as actions. Users can create custom workflows:
- "When I open Instagram → Start Before You Scroll"
- "At 8 PM → Get Next Tiny Action"
- "When I arrive home → Start Rescue"
