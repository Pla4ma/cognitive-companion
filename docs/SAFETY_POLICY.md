# Safety Policy for INTENT

## Purpose

INTENT deals with motivation, avoidance, anxiety-like language, stuckness, and personal struggles. The safety policy engine ensures the app never causes harm.

## Safety Categories

### 1. Normal Productivity
- **Trigger**: Standard state selections, mission generation
- **Response**: Proceed normally

### 2. Emotional Distress
- **Trigger**: User expresses stress, frustration, mild anxiety
- **Examples**: "I'm so stressed about this", "I can't handle everything"
- **Response**: Supportive, low-pressure. No diagnosis. Offer tiny safe action.

### 3. High Emotional Distress
- **Trigger**: User expresses significant emotional pain
- **Examples**: "I'm falling apart", "Everything is too much", "I feel hopeless"
- **Response**: Gentle support. Suggest reaching out to trusted person/professional. Avoid intense push style.

### 4. Self-Harm or Crisis
- **Trigger**: User expresses self-harm, suicidal ideation, or crisis
- **Examples**: "I want to hurt myself", "I can't go on", "I want to die"
- **Response**: 
  - Do NOT provide productivity mission
  - Show support resources
  - Encourage emergency/local support
  - Route out of normal flow
  - No gamification, no streaks, no pressure

### 5. Medical/Mental Health Request
- **Trigger**: User asks about diagnosis, treatment, or medication
- **Response**: No diagnosis. No treatment claims. Recommend professional support.

### 6. Legal/Financial High-Stakes
- **Trigger**: User mentions legal issues, financial crises
- **Response**: Do not decide for user. Suggest drafting questions/checklists only. Require review.

### 7. Dangerous External Action
- **Trigger**: AI proposes or user requests dangerous action
- **Response**: Block or require strong confirmation. Never execute silently.

### 8. Privacy-Sensitive Content
- **Trigger**: User shares sensitive personal information
- **Response**: Classify sensitivity. Avoid analytics. Require AI consent.

### 9. Shame/Coercion Language
- **Trigger**: AI output contains shame language
- **Response**: Rewrite output. Block phrases like "lazy", "pathetic", "you failed".

## Push Style Safety

Even "intense" mode cannot shame.

**Allowed (direct)**:
- "Start now. Two minutes. No debate."
- "You said you'd do this. Time to move."
- "The timer is running. Begin."

**Not allowed (abusive)**:
- "You're lazy if you don't."
- "Everyone else can do this. Why can't you?"
- "You failed again."
- "No excuses."

## Mission Safety

### Do NOT generate missions involving:
- Unsafe physical actions
- Illegal behavior
- Risky financial decisions
- Sending sensitive messages without review
- Medical self-treatment
- Harassment
- Self-harm
- Dangerous dieting/exercise extremes

### AI Output Guard
Every remote AI response must pass safety guard before display:
1. Check for crisis language
2. Check for shame language
3. Check for unsafe actions
4. Check for medical claims
5. Check for privacy violations

## Coach Crisis Fallback

If user says something like:
- "I want to hurt myself"
- "I can't go on"
- "I'm going to kill myself"

Then:
1. Do NOT continue normal productivity coaching
2. Show support resources
3. Encourage immediate help
4. Route to crisis screen
5. No gamification, no missions, no pressure

## Over-Trigger Prevention

Do NOT over-trigger on mild frustration:
- "Ugh, I don't want to do this" → Normal avoiding state, not crisis
- "This is so annoying" → Normal frustration, not distress
- "I hate this task" → Normal aversion, not self-harm

Handle serious language carefully, but don't treat every negative emotion as a crisis.

## Implementation

See: `src/agents/antiDriftAgent/safety.ts` — complete implementation of:
- `classifyInput(text)` → SafetyLevel
- `detectCrisisLanguage(text)` → { detected, matchedPatterns }
- `rewriteShameLanguage(text)` → { rewritten, wasRewritten }
- `isMissionSafe(missionText)` → { safe, reason }
- `buildSafetyStatus(input, actions)` → SafetyStatus
- `getCrisisResponse()` → { message, resources, shouldBlockProductivity }
