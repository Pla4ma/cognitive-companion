// ══════════════════════════════════════════════════════════════
// INTENT — Notification Copy Engine
// Safe, shame-free, privacy-aware notification generation
// ══════════════════════════════════════════════════════════════

import type { UserState } from '../../types/moment'

export type NotificationCategory = 'rescue' | 'before_scroll' | 'comeback' | 'body_double' | 'context_to_mission'
export type CopyStyle = 'gentle' | 'direct' | 'playful' | 'study' | 'silent'

export interface NotificationCopyRequest {
  category: NotificationCategory
  state: UserState | null
  style: CopyStyle
  privacyMode: 'safe' | 'standard'
  recentDismissals: number
  cooldownActive: boolean
}

export interface NotificationCopyResult {
  title: string
  body: string
  actions: string[]
  shouldSend: boolean
  reason: string
}

// ── Copy Banks ─────────────────────────────────────────────

const GENTLE_COPIES = [
  'A tiny restart is enough.',
  'Two minutes can count.',
  'No guilt. Want a small step?',
  'You do not need the whole task. Just the first move.',
]

const DIRECT_COPIES = [
  'Start the smallest version.',
  'Two minutes. Begin.',
  'Shrink it and move.',
  'Pick one action now.',
]

const PLAYFUL_COPIES = [
  'Tiny quest?',
  'Rescue the next 2 minutes?',
  'One small win before the scroll?',
  'Micro-mission unlocked.',
]

const STUDY_COPIES = [
  'Open the notes. One tiny step.',
  'Make 3 flashcards?',
  'Two minutes before the exam stress grows.',
  'Start with one problem.',
]

const SILENT_COPIES = [
  '2-minute rescue?',
  'Tiny restart?',
  'Start now?',
  'Before scroll?',
]

// ── Generate Copy ──────────────────────────────────────────

export function generateNotificationCopy(request: NotificationCopyRequest): NotificationCopyResult {
  // Cooldown check
  if (request.cooldownActive) {
    return {
      title: '',
      body: '',
      actions: [],
      shouldSend: false,
      reason: 'Cooldown active',
    }
  }

  // Dismissal reduction
  if (request.recentDismissals >= 3) {
    return {
      title: '',
      body: '',
      actions: [],
      shouldSend: false,
      reason: 'Too many recent dismissals',
    }
  }

  // Select copy bank
  const bank = selectCopyBank(request.style)
  const copy = bank[Math.floor(Math.random() * bank.length)]

  // Privacy: never mention sensitive state labels
  const title = request.privacyMode === 'safe' ? getSafeTitle(request.category) : getTitle(request.category, request.state)
  const actions = getActions(request.category)

  return {
    title,
    body: copy,
    actions,
    shouldSend: true,
    reason: `Generated ${request.style} copy for ${request.category}`,
  }
}

// ── Copy Bank Selection ────────────────────────────────────

function selectCopyBank(style: CopyStyle): string[] {
  switch (style) {
    case 'gentle': return GENTLE_COPIES
    case 'direct': return DIRECT_COPIES
    case 'playful': return PLAYFUL_COPIES
    case 'study': return STUDY_COPIES
    case 'silent': return SILENT_COPIES
    default: return GENTLE_COPIES
  }
}

// ── Title Generation ───────────────────────────────────────

function getSafeTitle(category: NotificationCategory): string {
  const titles: Record<NotificationCategory, string> = {
    rescue: 'Tiny restart available',
    before_scroll: 'Before you scroll',
    comeback: 'Welcome back',
    body_double: 'Body double ready',
    context_to_mission: 'Mission ready',
  }
  return titles[category]
}

function getTitle(category: NotificationCategory, state: UserState | null): string {
  if (!state) return getSafeTitle(category)
  const titles: Record<NotificationCategory, string> = {
    rescue: 'Rescue ready',
    before_scroll: 'Two minutes first',
    comeback: 'Your easiest next move',
    body_double: 'Start together',
    context_to_mission: 'Your mission is ready',
  }
  return titles[category]
}

// ── Action Buttons ─────────────────────────────────────────

function getActions(category: NotificationCategory): string[] {
  switch (category) {
    case 'rescue': return ['Start 2 min', 'Make smaller', 'Not now']
    case 'before_scroll': return ['Tiny win first', 'Not now']
    case 'comeback': return ['Start', 'Not now']
    case 'body_double': return ['Start together', 'Not now']
    case 'context_to_mission': return ['Start mission', 'Save for later', 'Not now']
    default: return ['Start', 'Not now']
  }
}

// ── Unsafe Copy Detection ──────────────────────────────────

const UNSAFE_PHRASES = [
  'you are avoiding', 'doomscroll', 'you usually', 'you are anxious',
  'shame spiral', 'you are failing', 'wasting time', 'lazy',
  'you never', 'you always', 'disappointing',
]

export function isUnsafeCopy(text: string): boolean {
  const lower = text.toLowerCase()
  return UNSAFE_PHRASES.some((phrase) => lower.includes(phrase))
}

export function sanitizeCopy(text: string): string {
  let sanitized = text
  for (const phrase of UNSAFE_PHRASES) {
    const regex = new RegExp(phrase, 'gi')
    sanitized = sanitized.replace(regex, 'a moment')
  }
  return sanitized
}
