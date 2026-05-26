// ══════════════════════════════════════════════════════════════
// INTENT — Coach Policy
// AI that argues less and acts more
// Extended: persona definition, response adaptation, template library
// ══════════════════════════════════════════════════════════════

import type { UserState, PushStyle, EnergyLevel } from '../../types'
import { filterShameLanguage } from '../../engine/safety'

// ── Response Hierarchy ─────────────────────────────────────

export type CoachResponseType =
  | 'tiny_action'       // stuck → give one action
  | 'shrink_scope'      // overwhelmed → reduce
  | 'capture_return'    // distracted → capture and return
  | 'rest_offer'        // tired → rest or tiny action
  | 'motivation_one'    // wants motivation → 1 sentence + CTA
  | 'plan_minimum'      // wants to plan → just enough to start
  | 'mission_thread'    // big help → mission thread + first micro
  | 'safety_redirect'   // emotional spiral → safety support

export interface CoachPolicyDecision {
  responseType: CoachResponseType
  maxSentences: number
  cta: string | null
  buttons: string[]
  shouldOfferMission: boolean
  shouldOfferBodyDouble: boolean
  shouldOfferShrink: boolean
}

// ── Coach Persona (Extended) ────────────────────────────────

export interface CoachPersona {
  id: PushStyle
  name: string
  emoji: string
  tone: string
  vocabulary: 'casual' | 'direct' | 'motivational'
  emojiUsage: 'none' | 'minimal' | 'moderate' | 'frequent'
  sentenceStyle: 'short' | 'medium' | 'varied'
  encouragementStyle: 'acknowledging' | 'celebrating' | 'matter_of_fact'
  maxResponseLength: number
  description: string
}

const PERSONAS: Record<PushStyle, CoachPersona> = {
  gentle: {
    id: 'gentle',
    name: 'Sage',
    emoji: '🌱',
    tone: 'warm, patient, empathetic',
    vocabulary: 'casual',
    emojiUsage: 'moderate',
    sentenceStyle: 'short',
    encouragementStyle: 'acknowledging',
    maxResponseLength: 200,
    description: 'Patient, nurturing, empathetic. Speaks softly. Validates feelings before suggesting action.',
  },
  firm: {
    id: 'firm',
    name: 'Coach',
    emoji: '🔥',
    tone: 'direct, motivating, no-nonsense',
    vocabulary: 'direct',
    emojiUsage: 'minimal',
    sentenceStyle: 'short',
    encouragementStyle: 'matter_of_fact',
    maxResponseLength: 150,
    description: 'Direct, motivating, no-nonsense. Gets to the point. Focuses on action over feelings.',
  },
  emergency: {
    id: 'emergency',
    name: 'Spark',
    emoji: '⚡',
    tone: 'urgent, high-energy, breaking through',
    vocabulary: 'motivational',
    emojiUsage: 'frequent',
    sentenceStyle: 'short',
    encouragementStyle: 'celebrating',
    maxResponseLength: 120,
    description: 'Urgent, high-energy, breaking through. Uses urgency to cut through resistance. Never shaming.',
  },
}

/**
 * Define a complete persona from a push style.
 * Returns tone, vocabulary, emoji usage, etc.
 */
export function definePersona(style: PushStyle): CoachPersona {
  return PERSONAS[style] || PERSONAS.gentle
}

// ── Response Templates ──────────────────────────────────────

interface ResponseTemplate {
  message: string
  followUp: string | null
  maxSentences: number
}

type TemplateMap = Partial<Record<UserState | 'default', ResponseTemplate>>

const RESPONSE_TEMPLATES: Record<CoachResponseType, TemplateMap> = {
  tiny_action: {
    avoiding: { message: 'Open the thing you are avoiding. Write one sentence. That is it.', followUp: 'You can stop after 2 minutes if you want.', maxSentences: 2 },
    stuck: { message: 'Set a timer. Name the first step out loud.', followUp: null, maxSentences: 2 },
    tired: { message: 'One tiny thing. Then rest.', followUp: 'Even opening the file counts.', maxSentences: 2 },
    anxious: { message: 'Write the bad version. It does not have to be good.', followUp: null, maxSentences: 2 },
    low_confidence: { message: '2 minutes. Proof before perfection.', followUp: null, maxSentences: 2 },
    shame_spiral: { message: 'You are here now. That is the win. One tiny thing.', followUp: 'No guilt. Just start.', maxSentences: 2 },
    default: { message: 'What is one tiny thing you can do right now?', followUp: null, maxSentences: 2 },
  },
  shrink_scope: {
    overwhelmed: { message: 'Too much. Let us shrink it. What is the smallest version?', followUp: 'Start the 2-minute version.', maxSentences: 2 },
    anxious: { message: 'Name the fear. Then do the tiniest version.', followUp: null, maxSentences: 2 },
    default: { message: 'Make it smaller. 2 minutes max.', followUp: null, maxSentences: 2 },
  },
  capture_return: {
    distracted: { message: 'Write down what pulled you away. Then return.', followUp: 'The distraction can wait.', maxSentences: 2 },
    default: { message: 'Capture the distraction. Return to mission.', followUp: null, maxSentences: 2 },
  },
  rest_offer: {
    tired: { message: 'You are tired. Rest or do the 2-minute version.', followUp: 'Both are productive.', maxSentences: 2 },
    default: { message: 'Low energy? Try the easiest version. Or rest properly.', followUp: null, maxSentences: 2 },
  },
  motivation_one: {
    ready: { message: 'You are ready. Do not waste this. Start now.', followUp: null, maxSentences: 1 },
    default: { message: 'You showed up. That is the hard part. Now do one small thing.', followUp: null, maxSentences: 1 },
  },
  plan_minimum: {
    overwhelmed: { message: 'Write the three things. Pick one. Close the rest.', followUp: 'Just one.', maxSentences: 3 },
    scattered: { message: 'Write down everything pulling your attention. Pick one. Close the rest.', followUp: null, maxSentences: 3 },
    default: { message: 'Write: Done means _______. Not perfect. Done. Then do that.', followUp: null, maxSentences: 3 },
  },
  mission_thread: {
    default: { message: 'Let us break this into tiny steps. First step: open the thing.', followUp: 'Ready?', maxSentences: 3 },
  },
  safety_redirect: {
    shame_spiral: { message: 'You are not behind. You are not broken. You are here.', followUp: 'One tiny step. That is the reset.', maxSentences: 3 },
    default: { message: 'Your safety matters most. You are not alone.', followUp: 'If you need support, reach out to someone you trust.', maxSentences: 3 },
  },
}

/**
 * Get a response template for a given type and state.
 * Returns the message string, or null if no template exists.
 */
export function getResponseTemplate(type: CoachResponseType, state: UserState): string | null {
  const templates = RESPONSE_TEMPLATES[type]
  if (!templates) return null
  const template = templates[state] || templates.default
  return template?.message ?? null
}

/**
 * Get a full response template object.
 */
export function getFullResponseTemplate(type: CoachResponseType, state: UserState): ResponseTemplate | null {
  const templates = RESPONSE_TEMPLATES[type]
  if (!templates) return null
  return templates[state] || templates.default || null
}

// ── Response Adaptation ─────────────────────────────────────

/**
 * Adapt a response based on user state, energy, resistance level, and push style.
 * Integrates with safety engine to filter shame language.
 */
export function adaptResponse(
  response: string,
  state: UserState,
  energy: EnergyLevel,
  resistance: number, // 1-5
  pushStyle: PushStyle,
): string {
  let adapted = response
  const persona = definePersona(pushStyle)

  // 1. Adapt length based on energy
  if (energy === 'depleted') {
    // Ultra-short for depleted energy
    adapted = truncateToSentences(adapted, 1)
  } else if (energy === 'low') {
    adapted = truncateToSentences(adapted, persona.maxResponseLength <= 120 ? 1 : 2)
  }

  // 2. Adapt urgency based on resistance
  if (resistance >= 4) {
    // High resistance — shorter, more direct
    adapted = truncateToSentences(adapted, 1)
  }

  // 3. Adapt tone based on state
  if (state === 'shame_spiral') {
    // Never use any pressure language in shame spiral
    adapted = adapted
      .replace(/\bmust\b/gi, 'could')
      .replace(/\bneed to\b/gi, 'might')
      .replace(/\bshould\b/gi, 'could')
      .replace(/\bnow\b/gi, 'when you are ready')
  }

  if (state === 'anxious') {
    // Reduce pressure, add grounding
    adapted = adapted.replace(/\bjust\b/gi, '')
    adapted = adapted.replace(/\bstart now\b/gi, 'start when ready')
  }

  // 4. Apply push style transformation
  adapted = applyPushStyle(adapted, pushStyle)

  // 5. Always filter shame language (final safety net)
  const shameResult = filterShameLanguage(adapted)
  if (shameResult.wasModified) {
    adapted = shameResult.filtered
  }

  // 6. Add emoji based on persona
  if (persona.emojiUsage !== 'none' && !adapted.match(/[\u{1F300}-\u{1FAFF}]/u)) {
    const emoji = getStateEmoji(state)
    if (emoji && persona.emojiUsage !== 'minimal') {
      adapted = `${emoji} ${adapted}`
    }
  }

  return adapted.trim()
}

function applyPushStyle(text: string, style: PushStyle): string {
  switch (style) {
    case 'gentle':
      return text
        .replace(/\bmust\b/gi, 'could')
        .replace(/\bneed to\b/gi, 'might want to')
        .replace(/\bshould\b/gi, 'could consider')
        .replace(/\bnow\b/gi, 'when you are ready')
        .replace(/!/g, '.')
    case 'firm':
      return text
        .replace(/\bcould\b/gi, 'need to')
        .replace(/\bmight want to\b/gi, 'must')
        .replace(/\bwhen you are ready\b/gi, 'now')
        .replace(/\bconsider\b/gi, 'do')
    case 'emergency':
      return text.startsWith('🚨') ? text : `🚨 ${text}`
    default:
      return text
  }
}

function getStateEmoji(state: UserState): string {
  const emojis: Partial<Record<UserState, string>> = {
    avoiding: '🙈',
    overwhelmed: '🌊',
    stuck: '🫠',
    tired: '😴',
    distracted: '🦋',
    anxious: '😰',
    scattered: '🌪️',
    ready: '🚀',
    shame_spiral: '💛',
    doomscroll_risk: '📱',
  }
  return emojis[state] || ''
}

function truncateToSentences(text: string, maxSentences: number): string {
  const sentences = text.split(/(?<=[.!?])\s+/)
  if (sentences.length <= maxSentences) return text
  return sentences.slice(0, maxSentences).join(' ')
}

// ── Policy Decision (Existing) ────────────────────────────────

export function decideCoachResponse(
  state: UserState,
  userMessage: string,
  hasActiveMission: boolean,
  missionAttemptCount: number,
): CoachPolicyDecision {
  const lower = userMessage.toLowerCase()

  // Safety check — emotional spiral
  if (state === 'shame_spiral' || lower.includes('hate myself') || lower.includes('worthless')) {
    return {
      responseType: 'safety_redirect',
      maxSentences: 3,
      cta: null,
      buttons: ['I need support', 'Tiny reset'],
      shouldOfferMission: false,
      shouldOfferBodyDouble: false,
      shouldOfferShrink: false,
    }
  }

  // Stuck → give one action
  if (state === 'stuck' || lower.includes("don't know") || lower.includes('no idea')) {
    return {
      responseType: 'tiny_action',
      maxSentences: 2,
      cta: 'Start this',
      buttons: ['Start this', 'Make smaller', 'Different action'],
      shouldOfferMission: true,
      shouldOfferBodyDouble: false,
      shouldOfferShrink: false,
    }
  }

  // Overwhelmed → shrink scope
  if (state === 'overwhelmed' || lower.includes('too much') || lower.includes('overwhelm')) {
    return {
      responseType: 'shrink_scope',
      maxSentences: 2,
      cta: 'Start 2-min version',
      buttons: ['Start 2-min version', 'Make even smaller', 'Body double me'],
      shouldOfferMission: true,
      shouldOfferBodyDouble: false,
      shouldOfferShrink: true,
    }
  }

  // Distracted → capture and return
  if (lower.includes('distracted') || lower.includes('went off') || lower.includes('lost focus')) {
    return {
      responseType: 'capture_return',
      maxSentences: 2,
      cta: 'Back to mission',
      buttons: ['Back to mission', 'Capture distraction', 'Start new'],
      shouldOfferMission: false,
      shouldOfferBodyDouble: false,
      shouldOfferShrink: false,
    }
  }

  // Tired → rest or tiny action
  if (state === 'tired' || lower.includes('exhausted') || lower.includes('no energy')) {
    return {
      responseType: 'rest_offer',
      maxSentences: 2,
      cta: 'Try 2-min version',
      buttons: ['Try 2-min version', 'Rest instead', 'Something physical'],
      shouldOfferMission: true,
      shouldOfferBodyDouble: false,
      shouldOfferShrink: true,
    }
  }

  // Motivation → 1 sentence + CTA
  if (lower.includes('motivat') || lower.includes('inspire') || lower.includes('can\'t do')) {
    return {
      responseType: 'motivation_one',
      maxSentences: 1,
      cta: 'Start now',
      buttons: ['Start now', 'Make smaller', 'Body double'],
      shouldOfferMission: true,
      shouldOfferBodyDouble: false,
      shouldOfferShrink: false,
    }
  }

  // Plan → minimum to start
  if (lower.includes('plan') || lower.includes('organize') || lower.includes('think about')) {
    return {
      responseType: 'plan_minimum',
      maxSentences: 3,
      cta: 'Start first step',
      buttons: ['Start first step', 'Save plan', 'Make it smaller'],
      shouldOfferMission: true,
      shouldOfferBodyDouble: false,
      shouldOfferShrink: false,
    }
  }

  // Big help → mission thread
  if (lower.includes('help me') || lower.includes('big task') || lower.includes('project')) {
    return {
      responseType: 'mission_thread',
      maxSentences: 3,
      cta: 'Start first tiny step',
      buttons: ['Start first tiny step', 'Break it down more', 'Body double me'],
      shouldOfferMission: true,
      shouldOfferBodyDouble: true,
      shouldOfferShrink: false,
    }
  }

  // Default: tiny action
  return {
    responseType: 'tiny_action',
    maxSentences: 2,
    cta: 'Start this',
    buttons: ['Start this', 'Make smaller', 'Not this'],
    shouldOfferMission: true,
    shouldOfferBodyDouble: false,
    shouldOfferShrink: false,
  }
}

// ── Coach Copy Rules ───────────────────────────────────────

export function validateCoachResponse(response: string, policy: CoachPolicyDecision): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []
  const sentences = response.split(/[.!?]+/).filter((s) => s.trim().length > 0)

  if (sentences.length > policy.maxSentences) {
    issues.push(`Response has ${sentences.length} sentences, max is ${policy.maxSentences}`)
  }

  if (response.length > 500) {
    issues.push('Response is too long')
  }

  // Check for shame language
  const shameResult = filterShameLanguage(response)
  if (shameResult.hadShameLanguage) {
    issues.push(`Shame language detected: ${shameResult.detectedPatterns.join(', ')}`)
  }

  return { valid: issues.length === 0, issues }
}

// ══════════════════════════════════════════════════════════════
// v4 — Multi-Turn Coach Memory & Context-Aware Coaching
// ══════════════════════════════════════════════════════════════

export interface CoachTurn {
  timestamp: number
  state: UserState
  userMessage: string
  responseType: CoachResponseType
  outcome?: 'accepted' | 'dismissed' | 'ignored'
}

export interface CoachSessionContext {
  isInSession: boolean
  sessionMinutesElapsed: number
  currentProtocol: string | null       // Active rescue protocol name
  protocolAttemptNumber: number         // How many protocol attempts this session
  lastMissedAction: string | null       // What the user last dismissed
  bodyDoubleActive: boolean
}

export interface CoachMemory {
  recentTurns: CoachTurn[]              // Last 5 coach interactions
  sessionContext: CoachSessionContext
  ignoredAdviceTypes: Set<CoachResponseType>  // Types user repeatedly ignores
  preferredActionTypes: string[]        // Types user responds to best
  personaOverride: PushStyle | null     // Temporary persona override
}

export function createCoachMemory(): CoachMemory {
  return {
    recentTurns: [],
    sessionContext: {
      isInSession: false,
      sessionMinutesElapsed: 0,
      currentProtocol: null,
      protocolAttemptNumber: 0,
      lastMissedAction: null,
      bodyDoubleActive: false,
    },
    ignoredAdviceTypes: new Set(),
    preferredActionTypes: [],
    personaOverride: null,
  }
}

export function recordCoachTurn(
  memory: CoachMemory,
  turn: CoachTurn,
): void {
  memory.recentTurns.push(turn)
  // Keep last 5
  if (memory.recentTurns.length > 5) {
    memory.recentTurns = memory.recentTurns.slice(-5)
  }

  // Track ignored advice types
  if (turn.outcome === 'ignored') {
    memory.ignoredAdviceTypes.add(turn.responseType)
  }

  // Track preferred action types
  if (turn.outcome === 'accepted') {
    if (!memory.preferredActionTypes.includes(turn.responseType)) {
      memory.preferredActionTypes.push(turn.responseType)
    }
  }

  // Auto-switch persona if all recent turns ignored
  const recentOutcomes = memory.recentTurns.slice(-3).map(t => t.outcome)
  if (recentOutcomes.every(o => o === 'ignored' || o === 'dismissed')) {
    memory.personaOverride = 'firm' // Escalate to firm after 3 ignored
  }
}

export function updateCoachSessionContext(
  memory: CoachMemory,
  update: Partial<CoachSessionContext>,
): void {
  memory.sessionContext = { ...memory.sessionContext, ...update }
}

// v4: Decide coach response with session awareness and multi-turn context
export function decideCoachResponseV2(
  state: UserState,
  userMessage: string,
  hasActiveMission: boolean,
  missionAttemptCount: number,
  memory: CoachMemory,
): CoachPolicyDecision {
  const base = decideCoachResponse(state, userMessage, hasActiveMission, missionAttemptCount)

  // 1. If body double is active, always offer it
  if (memory.sessionContext.bodyDoubleActive) {
    base.shouldOfferBodyDouble = true
  }

  // 2. If user is in a session and distracted, use capture_return
  if (memory.sessionContext.isInSession && state === 'distracted') {
    base.responseType = 'capture_return'
    base.buttons = ['Back to session', 'Capture distraction', 'End session']
  }

  // 3. Avoid advice types user has repeatedly ignored
  if (memory.ignoredAdviceTypes.has(base.responseType)) {
    const alternatives: Record<CoachResponseType, CoachResponseType> = {
      tiny_action: 'motivation_one',
      shrink_scope: 'plan_minimum',
      capture_return: 'tiny_action',
      rest_offer: 'tiny_action',
      motivation_one: 'tiny_action',
      plan_minimum: 'mission_thread',
      mission_thread: 'plan_minimum',
      safety_redirect: 'tiny_action',
    }
    const altType = alternatives[base.responseType]
    if (altType && !memory.ignoredAdviceTypes.has(altType)) {
      base.responseType = altType
      base.cta = 'Try this approach'
      base.buttons = ['Try this approach', 'Something else', 'Make smaller']
    }
  }

  // 4. Protocol-aware adaptation
  if (memory.sessionContext.currentProtocol === '2-minute-start' && missionAttemptCount > 0) {
    base.responseType = 'motivation_one'
    base.maxSentences = 1
    base.cta = 'Just start'
    base.buttons = ['Just start', 'Shrink further', 'Body double']
  }

  if (memory.sessionContext.currentProtocol === 'brain-dump' && missionAttemptCount > 0) {
    base.responseType = 'plan_minimum'
    base.cta = 'Pick one item'
    base.buttons = ['Pick one item', 'Dump more', 'Start timer']
  }

  // 5. If last action was missed, adjust
  if (memory.sessionContext.lastMissedAction) {
    base.shouldOfferShrink = true
    base.cta = 'Make it even smaller'
  }

  // 6. If user has preferred actions, bias toward them
  if (memory.preferredActionTypes.length > 0 && !memory.ignoredAdviceTypes.has(base.responseType)) {
    // Try preferred type if it's different but applicable
    const preferred = memory.preferredActionTypes[0] as CoachResponseType
    const preferredTemplates: Partial<Record<CoachResponseType, UserState[]>> = {
      tiny_action: ['stuck', 'avoiding', 'tired'],
      shrink_scope: ['overwhelmed', 'scattered'],
      capture_return: ['distracted'],
      motivation_one: ['ready', 'avoiding'],
      plan_minimum: ['overwhelmed', 'scattered'],
    }
    const applicableStates = preferredTemplates[preferred]
    if (applicableStates?.includes(state)) {
      base.responseType = preferred
    }
  }

  return base
}

// v4: Generate body-double-specific coaching adaptation
export function adaptForBodyDouble(
  response: string,
  bodyDoubleMode: 'presence' | 'voice' | 'screen_share' | 'none',
): string {
  switch (bodyDoubleMode) {
    case 'presence':
      return `${response}\n\nI'm here with you. No pressure. Just presence.`
    case 'voice':
      return `${response}\n\nSay it out loud — saying it makes it real.`
    case 'screen_share':
      return `${response}\n\nI can see your screen. Let's start together.`
    case 'none':
      return response
  }
}
