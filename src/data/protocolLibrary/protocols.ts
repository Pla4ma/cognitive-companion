// ══════════════════════════════════════════════════════════════
// INTENT — Protocol Library
// High-quality mission templates by category
// ══════════════════════════════════════════════════════════════

import type { UserState } from '../../types/moment'
import type { RescueProtocolId } from '../../types/rescue'

export interface ProtocolTemplate {
  id: string
  category: ProtocolCategory
  state: UserState
  title: string
  exactAction: string
  duration: number
  energy: 'low' | 'medium' | 'high'
  fallback: string
  salvage: string
  bodyDoubleScript: string | null
  tags: string[]
}

export type ProtocolCategory =
  | 'school' | 'work' | 'life_admin' | 'cleaning'
  | 'creative' | 'health' | 'social' | 'doomscroll'
  | 'comeback' | 'emotional_reset'

// ── School Protocols ───────────────────────────────────────

export const SCHOOL_PROTOCOLS: ProtocolTemplate[] = [
  // Overwhelmed
  { id: 'school-overwhelmed-1', category: 'school', state: 'overwhelmed', title: 'Open assignment', exactAction: 'Open the assignment and highlight the due date', duration: 2, energy: 'low', fallback: 'Just open the file', salvage: 'Name the file out loud', bodyDoubleScript: null, tags: ['study', 'assignment'] },
  { id: 'school-overwhelmed-2', category: 'school', state: 'overwhelmed', title: 'Write title', exactAction: 'Write the title of the essay doc', duration: 2, energy: 'low', fallback: 'Create a new document', salvage: 'Say the title out loud', bodyDoubleScript: null, tags: ['writing'] },
  { id: 'school-overwhelmed-3', category: 'school', state: 'overwhelmed', title: 'First problem only', exactAction: 'Solve the first problem only', duration: 5, energy: 'medium', fallback: 'Read the first problem', salvage: 'Underline what you need to find', bodyDoubleScript: null, tags: ['math', 'problems'] },
  { id: 'school-overwhelmed-4', category: 'school', state: 'overwhelmed', title: 'Make 3 flashcards', exactAction: 'Make 3 flashcards from the first heading', duration: 5, energy: 'medium', fallback: 'Read the first heading', salvage: 'Write one key term', bodyDoubleScript: null, tags: ['study', 'flashcards'] },

  // Perfectionism
  { id: 'school-perfectionism-1', category: 'school', state: 'perfectionism', title: 'Worst first sentence', exactAction: 'Write the worst first sentence on purpose', duration: 2, energy: 'low', fallback: 'Type any sentence', salvage: 'Say a bad sentence out loud', bodyDoubleScript: null, tags: ['writing'] },
  { id: 'school-perfectionism-2', category: 'school', state: 'perfectionism', title: 'Messy outline', exactAction: 'Make a messy outline with 3 bad bullets', duration: 5, energy: 'medium', fallback: 'Write 3 words', salvage: 'Name 3 topics', bodyDoubleScript: null, tags: ['writing', 'outline'] },

  // Stuck
  { id: 'school-stuck-1', category: 'school', state: 'stuck', title: 'Read rubric', exactAction: 'Open the rubric and read the first row', duration: 2, energy: 'low', fallback: 'Open the rubric', salvage: 'Name one requirement', bodyDoubleScript: null, tags: ['assignment'] },
  { id: 'school-stuck-2', category: 'school', state: 'stuck', title: 'Find examples', exactAction: 'Find one example or reference', duration: 5, energy: 'medium', fallback: 'Search for the topic', salvage: 'Write down the search term', bodyDoubleScript: null, tags: ['research'] },

  // Doomscroll
  { id: 'school-doomscroll-1', category: 'school', state: 'doomscroll_risk', title: 'Read one paragraph', exactAction: 'Before scrolling, open your notes and read one paragraph', duration: 2, energy: 'low', fallback: 'Open the notes app', salvage: 'Name the subject', bodyDoubleScript: null, tags: ['study'] },

  // Tired
  { id: 'school-tired-1', category: 'school', state: 'tired', title: 'Review notes', exactAction: 'Open your notes and read for 2 minutes', duration: 2, energy: 'low', fallback: 'Open the file', salvage: 'Name the topic', bodyDoubleScript: null, tags: ['study'] },
]

// ── Work Protocols ─────────────────────────────────────────

export const WORK_PROTOCOLS: ProtocolTemplate[] = [
  { id: 'work-overwhelmed-1', category: 'work', state: 'overwhelmed', title: 'Draft first comment', exactAction: 'Open the ticket and write the first comment draft', duration: 5, energy: 'medium', fallback: 'Open the ticket', salvage: 'Read the title', bodyDoubleScript: null, tags: ['ticket'] },
  { id: 'work-overwhelmed-2', category: 'work', state: 'overwhelmed', title: '3 update bullets', exactAction: 'Write 3 bullets for the status update', duration: 5, energy: 'medium', fallback: 'Write 1 bullet', salvage: 'Name 1 thing done', bodyDoubleScript: null, tags: ['update'] },
  { id: 'work-avoiding-1', category: 'work', state: 'avoiding', title: 'One sentence reply', exactAction: 'Reply with one sentence draft, not send', duration: 2, energy: 'low', fallback: 'Open the email', salvage: 'Name who to reply to', bodyDoubleScript: null, tags: ['email'] },
  { id: 'work-stuck-1', category: 'work', state: 'stuck', title: 'Read the task', exactAction: 'Open the task and read the description', duration: 2, energy: 'low', fallback: 'Open the task', salvage: 'Name the task', bodyDoubleScript: null, tags: ['task'] },
]

// ── Life Admin Protocols ───────────────────────────────────

export const LIFE_ADMIN_PROTOCOLS: ProtocolTemplate[] = [
  { id: 'admin-overwhelmed-1', category: 'life_admin', state: 'overwhelmed', title: 'Read the bill', exactAction: 'Open the bill and read the amount', duration: 2, energy: 'low', fallback: 'Find the bill', salvage: 'Name what bill', bodyDoubleScript: null, tags: ['bill'] },
  { id: 'admin-avoiding-1', category: 'life_admin', state: 'avoiding', title: 'One folder', exactAction: 'Put the document in one folder', duration: 2, energy: 'low', fallback: 'Find the document', salvage: 'Name the document', bodyDoubleScript: null, tags: ['organize'] },
  { id: 'admin-avoiding-2', category: 'life_admin', state: 'avoiding', title: 'Write phone number', exactAction: 'Write the appointment phone number', duration: 2, energy: 'low', fallback: 'Find the number', salvage: 'Name what appointment', bodyDoubleScript: null, tags: ['call'] },
]

// ── Cleaning Protocols ─────────────────────────────────────

export const CLEANING_PROTOCOLS: ProtocolTemplate[] = [
  { id: 'clean-overwhelmed-1', category: 'cleaning', state: 'overwhelmed', title: '10 items basket', exactAction: 'Put 10 items into one basket', duration: 2, energy: 'low', fallback: 'Put 5 items', salvage: 'Put 1 item', bodyDoubleScript: null, tags: ['declutter'] },
  { id: 'clean-overwhelmed-2', category: 'cleaning', state: 'overwhelmed', title: 'One square foot', exactAction: 'Clear one square foot of surface', duration: 3, energy: 'medium', fallback: 'Clear a corner', salvage: 'Move 3 things', bodyDoubleScript: null, tags: ['surface'] },
  { id: 'clean-avoiding-1', category: 'cleaning', state: 'avoiding', title: '5 trash items', exactAction: 'Throw away 5 obvious pieces of trash', duration: 2, energy: 'low', fallback: 'Throw away 3', salvage: 'Throw away 1', bodyDoubleScript: null, tags: ['trash'] },
]

// ── Creative Protocols ─────────────────────────────────────

export const CREATIVE_PROTOCOLS: ProtocolTemplate[] = [
  { id: 'creative-perfectionism-1', category: 'creative', state: 'perfectionism', title: 'Ugly first sketch', exactAction: 'Create an ugly first sketch', duration: 5, energy: 'medium', fallback: 'Draw a circle', salvage: 'Name the project', bodyDoubleScript: null, tags: ['art'] },
  { id: 'creative-stuck-1', category: 'creative', state: 'stuck', title: '50 bad words', exactAction: 'Write 50 bad words', duration: 3, energy: 'medium', fallback: 'Write 20 words', salvage: 'Write 5 words', bodyDoubleScript: null, tags: ['writing'] },
  { id: 'creative-avoiding-1', category: 'creative', state: 'avoiding', title: 'Name the file', exactAction: 'Create and name the project file', duration: 2, energy: 'low', fallback: 'Open the app', salvage: 'Say the project name', bodyDoubleScript: null, tags: ['setup'] },
]

// ── Health Protocols ───────────────────────────────────────

export const HEALTH_PROTOCOLS: ProtocolTemplate[] = [
  { id: 'health-tired-1', category: 'health', state: 'tired', title: 'Fill water', exactAction: 'Fill a glass of water', duration: 1, energy: 'low', fallback: 'Get up', salvage: 'Think about water', bodyDoubleScript: null, tags: ['hydration'] },
  { id: 'health-avoiding-1', category: 'health', state: 'avoiding', title: 'Put shoes on', exactAction: 'Put your shoes on', duration: 2, energy: 'low', fallback: 'Find your shoes', salvage: 'Stand up', bodyDoubleScript: null, tags: ['exercise'] },
  { id: 'health-anxious-1', category: 'health', state: 'anxious', title: '2 min outside', exactAction: 'Stand outside for 2 minutes', duration: 2, energy: 'low', fallback: 'Open a window', salvage: 'Take 3 deep breaths', bodyDoubleScript: null, tags: ['nature', 'breathing'] },
]

// ── Social Protocols ───────────────────────────────────────

export const SOCIAL_PROTOCOLS: ProtocolTemplate[] = [
  { id: 'social-anxious-1', category: 'social', state: 'anxious', title: 'Draft check-in', exactAction: 'Draft one check-in text', duration: 2, energy: 'low', fallback: 'Write the first line', salvage: 'Name who to text', bodyDoubleScript: null, tags: ['text'] },
  { id: 'social-avoiding-1', category: 'social', state: 'avoiding', title: 'First line only', exactAction: 'Write the first line of the message', duration: 2, energy: 'low', fallback: 'Open the chat', salvage: 'Name who to contact', bodyDoubleScript: null, tags: ['message'] },
]

// ── Doomscroll Protocols ───────────────────────────────────

export const DOOMSCROLL_PROTOCOLS: ProtocolTemplate[] = [
  { id: 'doomscroll-any-1', category: 'doomscroll', state: 'doomscroll_risk', title: '2 min action first', exactAction: 'Do one 2-minute action before scrolling', duration: 2, energy: 'low', fallback: 'Open a productive app', salvage: 'Put phone down for 30 seconds', bodyDoubleScript: null, tags: ['before_scroll'] },
  { id: 'doomscroll-any-2', category: 'doomscroll', state: 'doomscroll_risk', title: 'Name the avoidance', exactAction: 'Name what you are avoiding, then choose', duration: 2, energy: 'low', fallback: 'Think about it', salvage: 'Acknowledge the urge', bodyDoubleScript: null, tags: ['before_scroll', 'awareness'] },
]

// ── Comeback Protocols ─────────────────────────────────────

export const COMEBACK_PROTOCOLS: ProtocolTemplate[] = [
  { id: 'comeback-any-1', category: 'comeback', state: 'avoiding', title: 'Smallest thing', exactAction: 'Do the smallest thing you can think of', duration: 2, energy: 'low', fallback: 'Open the app', salvage: 'Acknowledge you came back', bodyDoubleScript: null, tags: ['comeback'] },
  { id: 'comeback-any-2', category: 'comeback', state: 'overwhelmed', title: '2-min restart', exactAction: 'Set a 2-minute timer and start anything', duration: 2, energy: 'low', fallback: 'Set the timer', salvage: 'Just exist for a moment', bodyDoubleScript: null, tags: ['comeback', 'timer'] },
]

// ── Emotional Reset Protocols ──────────────────────────────

export const EMOTIONAL_RESET_PROTOCOLS: ProtocolTemplate[] = [
  { id: 'reset-anxious-1', category: 'emotional_reset', state: 'anxious', title: '3 deep breaths', exactAction: 'Take 3 slow deep breaths', duration: 1, energy: 'low', fallback: 'Take 1 breath', salvage: 'Close your eyes', bodyDoubleScript: null, tags: ['breathing'] },
  { id: 'reset-shame-1', category: 'emotional_reset', state: 'shame_spiral', title: 'Tiny reset', exactAction: 'Name one tiny thing you can do right now', duration: 2, energy: 'low', fallback: 'Just sit for a moment', salvage: 'You showed up. That counts.', bodyDoubleScript: null, tags: ['reset', 'compassion'] },
  { id: 'reset-scattered-1', category: 'emotional_reset', state: 'scattered', title: 'Close all tabs', exactAction: 'Close everything except one thing', duration: 2, energy: 'low', fallback: 'Minimize all windows', salvage: 'Name the one thing', bodyDoubleScript: null, tags: ['focus'] },
]

// ── Combined Library ───────────────────────────────────────

export const ALL_PROTOCOLS: ProtocolTemplate[] = [
  ...SCHOOL_PROTOCOLS,
  ...WORK_PROTOCOLS,
  ...LIFE_ADMIN_PROTOCOLS,
  ...CLEANING_PROTOCOLS,
  ...CREATIVE_PROTOCOLS,
  ...HEALTH_PROTOCOLS,
  ...SOCIAL_PROTOCOLS,
  ...DOOMSCROLL_PROTOCOLS,
  ...COMEBACK_PROTOCOLS,
  ...EMOTIONAL_RESET_PROTOCOLS,
]

// ── Lookup Functions ───────────────────────────────────────

export function getProtocolsForState(state: UserState): ProtocolTemplate[] {
  return ALL_PROTOCOLS.filter((p) => p.state === state)
}

export function getProtocolsForCategory(category: ProtocolCategory): ProtocolTemplate[] {
  return ALL_PROTOCOLS.filter((p) => p.category === category)
}

export function getProtocolsForDuration(maxMinutes: number): ProtocolTemplate[] {
  return ALL_PROTOCOLS.filter((p) => p.duration <= maxMinutes)
}

export function getProtocolsForEnergy(energy: 'low' | 'medium' | 'high'): ProtocolTemplate[] {
  return ALL_PROTOCOLS.filter((p) => p.energy === energy)
}

export function findBestProtocol(
  state: UserState,
  maxDuration: number,
  energy: 'low' | 'medium' | 'high',
): ProtocolTemplate | null {
  const candidates = ALL_PROTOCOLS.filter(
    (p) => p.state === state && p.duration <= maxDuration && p.energy === energy,
  )
  if (candidates.length === 0) {
    // Relax energy constraint
    const relaxed = ALL_PROTOCOLS.filter((p) => p.state === state && p.duration <= maxDuration)
    return relaxed[0] ?? null
  }
  return candidates[0]
}

export function getRandomProtocol(state: UserState): ProtocolTemplate | null {
  const protocols = getProtocolsForState(state)
  if (protocols.length === 0) return null
  return protocols[Math.floor(Math.random() * protocols.length)]
}
