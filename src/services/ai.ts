// ══════════════════════════════════════════════════════════════
// INTENT — AI Client v2
// Action-first, mission-aware, structured schemas, salvage agent
// ══════════════════════════════════════════════════════════════

import { ChatMessage, AvoidanceState, STATE_CHIPS, COACH_PERSONAS, PushStyle, AIActionPlan, AISalvagePlan } from '../types'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

function getApiKey(): string {
  return process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? ''
}

// ── System Prompt Builder ─────────────────────────────────

function buildSystemPrompt(
  context: {
    userName: string
    pushStyle: PushStyle
    currentMomentum: number
    activeMissions: number
    todayMinutes: number
    currentStreak: number
    recentAvoidance: AvoidanceState | null
  }
): string {
  const styleGuide: Record<PushStyle, string> = {
    gentle: 'Be warm and understanding. Use soft language. Frame everything as suggestions, not demands. "You might want to..." "Perhaps try..."',
    firm: 'Be direct and clear. No hedging. "Do this." "Stop that." Still respectful, but no fluff.',
    emergency: 'Be urgent and commanding. Short sentences. Imperatives. "Now." "Move." "Stop thinking. Start doing."',
  }

  return `You are the Rescue Coach for the INTENT app. You are NOT a generic chatbot. You are an anti-avoidance specialist.

YOUR CORE RULES:
1. **ALWAYS be action-first.** Your first sentence must be a specific action. Not empathy first. Not explanation first. ACTION first.
2. **Keep responses SHORT.** 2-3 paragraphs maximum. Get to the point.
3. **Never ask "How does that make you feel?"** That's therapy. You're a rescue coach.
4. **Always reference their state.** If they're avoiding, name it. If they're overwhelmed, acknowledge it.
5. **Give ONE next step.** Not a list of 5 things. One. Clear. Actionable.
6. **Be honest.** If they're lying to yourself, call it out respectfully.
7. **Reference their data.** Their streak, momentum, missions, minutes. Use numbers.

USER CONTEXT:
- Name: ${context.userName}
- Push style: ${context.pushStyle} — ${styleGuide[context.pushStyle]}
- Current momentum: ${context.currentMomentum} points this week
- Active missions: ${context.activeMissions}
- Today: ${context.todayMinutes} minutes focused
- Current streak: ${context.currentStreak} days
- Recent avoidance state: ${context.recentAvoidance ?? 'none detected'}

RESPONSE FORMAT:
- Line 1: State acknowledgment (3-5 words max)
- Line 2-3: The action — what to do RIGHT NOW (specific, physical, tiny)
- Optional: One sentence of why this works
- Final line: A direct question or "Go now."

TONE: ${styleGuide[context.pushStyle]}`
}

// ── Streaming Chat ────────────────────────────────────────

export async function streamChat(
  messages: ChatMessage[],
  userMessage: string,
  context: Parameters<typeof buildSystemPrompt>[0],
  onChunk: (text: string) => void,
  onComplete: (fullText: string) => void,
): Promise<void> {
  const apiKey = getApiKey()
  const systemPrompt = buildSystemPrompt(context)

  const conversationMessages = messages.slice(-15).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
    content: m.content,
  }))
  conversationMessages.push({ role: 'user', content: userMessage })

  if (!apiKey) {
    const fallback = getLocalResponse(userMessage, context)
    let text = ''
    for (const char of fallback) {
      text += char
      onChunk(text)
      await new Promise((r) => setTimeout(r, 6))
    }
    onComplete(fallback)
    return
  }

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        system: systemPrompt,
        messages: conversationMessages,
        stream: true,
      }),
    })

    if (!response.ok) throw new Error(`API error: ${response.status}`)

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let fullText = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              fullText += parsed.delta.text
              onChunk(fullText)
            }
          } catch { /* skip */ }
        }
      }
    }
    onComplete(fullText)
  } catch (error) {
    console.error('AI streaming error:', error)
    const fallback = getLocalResponse(userMessage, context)
    onComplete(fallback)
  }
}

// ── Goal → Mission Breakdown ──────────────────────────────

export async function generateMissionBreakdown(
  missionTitle: string,
  missionDescription: string,
  pushStyle: PushStyle,
): Promise<{ microMissions: { title: string; description: string; estimated_minutes: number }[]; reasoning: string }> {
  const apiKey = getApiKey()

  if (!apiKey) {
    return getLocalMissionBreakdown(missionTitle)
  }

  const prompt: Record<PushStyle, string> = {
    gentle: `Help me break this mission into 3-5 tiny, gentle micro-missions. Each should take 5-25 minutes. Use encouraging language.`,
    firm: `Break this mission into 3-5 actionable micro-missions. Each should take 5-25 minutes. Be direct. No fluff.`,
    emergency: `Break this mission into 3-5 EMERGENCY micro-missions. Each should take UNDER 15 minutes. Assume the user is avoiding this. Make the first one almost embarrassingly small.`,
  }

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: `${pushStyle}\n\nMission: ${missionTitle}\n${missionDescription ? `Description: ${missionDescription}` : ''}\n\nRespond as JSON: { "microMissions": [{"title":"...","description":"...","estimated_minutes":10}], "reasoning":"..." }` }],
      }),
    })

    const data = await response.json()
    const content = data.content?.[0].text ?? ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    return getLocalMissionBreakdown(missionTitle)
  } catch {
    return getLocalMissionBreakdown(missionTitle)
  }
}

// ── Salvage Agent ─────────────────────────────────────────

export async function generateSalvagePlan(
  missionTitle: string,
  minutesCompleted: number,
  plannedMinutes: number,
  pushStyle: PushStyle,
): Promise<AISalvagePlan> {
  const completionRatio = minutesCompleted / Math.max(plannedMinutes, 1)

  if (completionRatio < 0.15) {
    return {
      original_mission_id: '',
      partial_credit_minutes: 0,
      salvageable: false,
      reason: 'Session was very short. Better to start fresh.',
      adjusted_mission: missionTitle,
      new_duration_minutes: 5,
      encouragement: 'That\'s okay. The timing was off. Try a 5-minute version when you\'re ready.',
    }
  }

  const apiKey = getApiKey()
  if (!apiKey) {
    return {
      original_mission_id: '',
      partial_credit_minutes: Math.round(minutesCompleted),
      salvageable: true,
      reason: `You did ${minutesCompleted} minutes. That counts.`,
      adjusted_mission: `Salvaged: ${missionTitle} (${minutesCompleted}m)`,
      new_duration_minutes: minutesCompleted,
      encouragement: `You showed up for ${minutesCompleted} minutes. Most people did zero. That's a win.`,
    }
  }

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        messages: [{ role: 'user', content: `Create a salvage plan for this session. Mission: ${missionTitle}. Completed: ${minutesCompleted} of ${plannedMinutes} minutes. Push style: ${pushStyle}. JSON: { "salvageable": true, "reason": "...", "adjusted_mission": "...", "new_duration_minutes": ${minutesCompleted}, "encouragement": "..." }` }],
      }),
    })
    const data = await response.json()
    const content = data.content?.[0].text ?? ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0]) as AISalvagePlan
    throw new Error('No JSON')
  } catch {
    return {
      original_mission_id: '',
      partial_credit_minutes: Math.round(minutesCompleted),
      salvageable: true,
      reason: `You did ${minutesCompleted} minutes. That counts.`,
      adjusted_mission: `Salvaged: ${missionTitle} (${minutesCompleted}m)`,
      new_duration_minutes: minutesCompleted,
      encouragement: `You showed up for ${minutesCompleted} minutes. Most people did zero.`,
    }
  }
}

// ── Local Fallbacks ───────────────────────────────────────

function getLocalResponse(
  input: string,
  context: { userName: string; pushStyle: PushStyle; currentMomentum: number; recentAvoidance: AvoidanceState | null },
): string {
  const name = context.userName || 'friend'
  const lower = input.toLowerCase()
  const style = context.pushStyle

  const prefix: Record<PushStyle, string> = {
    gentle: '',
    firm: '',
    emergency: '🚨 ',
  }

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return `${prefix[style]}Hey ${name}. What's the one thing you're avoiding right now? Name it. Then we'll break it down together.`
  }

  if (lower.includes('avoid') || lower.includes('procrastinat') || lower.includes('can\'t start')) {
    const responses: Record<PushStyle, string> = {
      gentle: `${prefix[style]}You're avoiding something. That's okay — it's normal.\n\nHere's what I want you to do: Set a timer for 2 minutes. Just 2. Open the thing you're avoiding. Look at it. You can stop after 2 minutes.\n\nThe resistance is lying to you. It always feels worse before you start.\n\nWhat are you avoiding?`,
      firm: `${prefix[style]}You're avoiding something. Stop thinking about it.\n\nSet a 2-minute timer. Open the document. Write one sentence. That's it.\n\nYou don't need motivation. You need 2 minutes of action.\n\nWhat are you avoiding? Name it. Now.`,
      emergency: `${prefix[style]}STOP. You're avoiding something. I can tell.\n\nHere's what happens NOW:\n1. Set a 2-minute timer\n2. Open the thing\n3. Do ONE tiny action\n\nNo thinking. No planning. No "I'll start in 5 minutes."\n\n2 minutes. GO. What are you avoiding?`,
    }
    return responses[style]
  }

  if (lower.includes('overwhelm') || lower.includes('too much') || lower.includes('everything')) {
    return `${prefix[style]}You're overwhelmed. Your brain is trying to do everything at once.\n\nBrain dump: Write down EVERYTHING on your mind. Don't organize. Just dump. 3 minutes.\n\nThen circle the ONE thing that would make everything else easier.\n\nThat's your mission. Everything else can wait.\n\nGo.`
  }

  if (lower.includes('tired') || lower.includes('exhausted') || lower.includes('no energy')) {
    return `${prefix[style]}You're tired. That's real. Don't fight it.\n\nOption A: Do a 5-minute low-energy version of your easiest task.\nOption B: Rest intentionally. Set a 10-minute timer. Close your eyes. No phone.\n\nBoth are productive. Choose one. Now.`
  }

  if (lower.includes('distract') || lower.includes('phone') || lower.includes('focus')) {
    return `${prefix[style]}Distractions are winning right now. Let's fix that.\n\n1. Write down every distraction pulling at you. Get them out of your head.\n2. Phone goes in another room. Not silent. ANOTHER ROOM.\n3. Set a 15-minute timer. One task. Nothing else.\n\nCapture the distractions, then create your bubble. Go.`
  }

  if (lower.includes('goal') || lower.includes('mission') || lower.includes('plan') || lower.includes('break down')) {
    return `${prefix[style]}Let's break this mission down.\n\nWhat's the mission? Tell me in one sentence.\n\nThen I'll help you split it into tiny pieces — each one doable in 5-25 minutes.\n\nThe key: the first piece should be almost embarrassingly small. So small you can't say no.\n\nWhat's the mission?`
  }

  if (lower.includes('stuck') || lower.includes('don\'t know how') || lower.includes('confused')) {
    return `${prefix[style]}You're stuck. That means you're thinking about the whole thing.\n\nStop. What's the very next physical action?\n\nNot "work on the project." Not "figure it out."\n\n"Open the laptop." "Write the first sentence." "Send the email."\n\nWhat's the next physical action? Do that. Only that.`
  }

  // Default
  return `${prefix[style]}Hey ${name}. ${context.currentMomentum > 0 ? `You've got ${context.currentMomentum} momentum points this week. That's real progress.` : 'Let\'s build some momentum today.'}\n\nWhat's the ONE thing you need to do right now? Not the most important thing in life — the one thing that would make today feel like a win.\n\nTell me. Then we'll make it happen.`
}

function getLocalMissionBreakdown(title: string): { microMissions: { title: string; description: string; estimated_minutes: number }[]; reasoning: string } {
  return {
    microMissions: [
      { title: `Open & orient: ${title}`, description: 'Open the relevant files, documents, or workspace. Spend 5 minutes just looking at what you have. Don\'t do anything yet — just orient.', estimated_minutes: 5 },
      { title: `First tiny action: ${title}`, description: 'Do the smallest possible action that counts as progress. Write one sentence. Create one file. Send one email.', estimated_minutes: 10 },
      { title: `Build momentum: ${title}`, description: 'Now that you\'ve started, do 15 minutes of focused work. No distractions. Just build on what you started.', estimated_minutes: 15 },
      { title: `Review & plan next: ${title}`, description: 'Look at what you accomplished. Write down the next 2-3 actions. Close everything cleanly.', estimated_minutes: 5 },
    ],
    reasoning: 'This breakdown follows the anti-avoidance pattern: orient → tiny action → momentum → review. Each step is designed to be completable in a single session.',
  }
}
