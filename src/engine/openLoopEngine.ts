// ══════════════════════════════════════════════════════════════
// INTENT — Open Loops Engine
// Attention hooks — close with tiny actions, not guilt
// ══════════════════════════════════════════════════════════════

import type { OpenLoop, OpenLoopSource, OpenLoopStatus } from '../../types/openLoop'
import type { ContextCapsule } from '../../types/contextCapsule'

// ── Generate ID ────────────────────────────────────────────

function generateId(): string {
  return `loop_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

// ── Create Open Loop ───────────────────────────────────────

export function createOpenLoop(
  title: string,
  source: OpenLoopSource,
  nextTinyAction: string,
  emotionalWeight: number = 3,
): OpenLoop {
  return {
    id: generateId(),
    title,
    source,
    emotionalWeight: Math.max(1, Math.min(5, emotionalWeight)),
    nextTinyAction,
    status: 'open',
    relatedContextId: null,
    relatedMissionThreadId: null,
    createdAt: Date.now(),
    lastTouchedAt: Date.now(),
  }
}

// ── Create from Context Capsule ────────────────────────────

export function createLoopFromCapsule(capsule: ContextCapsule): OpenLoop | null {
  const obligations = capsule.extractedData?.obligations ?? []
  if (obligations.length === 0) return null

  const first = obligations[0]
  return {
    id: generateId(),
    title: first,
    source: 'context_capsule',
    emotionalWeight: capsule.sensitivityLevel === 'sensitive' ? 4 : 3,
    nextTinyAction: generateTinyAction(first),
    status: 'open',
    relatedContextId: capsule.id,
    relatedMissionThreadId: null,
    createdAt: Date.now(),
    lastTouchedAt: Date.now(),
  }
}

// ── Create from Failed Mission ─────────────────────────────

export function createLoopFromFailure(missionTitle: string, failureReason: string): OpenLoop {
  return {
    id: generateId(),
    title: missionTitle,
    source: 'failed_mission',
    emotionalWeight: 4,
    nextTinyAction: generateSmallerAction(missionTitle),
    status: 'open',
    relatedContextId: null,
    relatedMissionThreadId: null,
    createdAt: Date.now(),
    lastTouchedAt: Date.now(),
  }
}

// ── Create from Distraction ────────────────────────────────

export function createLoopFromDistraction(distractionText: string): OpenLoop {
  return {
    id: generateId(),
    title: distractionText.slice(0, 100),
    source: 'repeated_distraction',
    emotionalWeight: 2,
    nextTinyAction: `Address "${distractionText.slice(0, 30)}..." later`,
    status: 'open',
    relatedContextId: null,
    relatedMissionThreadId: null,
    createdAt: Date.now(),
    lastTouchedAt: Date.now(),
  }
}

// ── Update Loop Status ─────────────────────────────────────

export function updateLoopStatus(loop: OpenLoop, status: OpenLoopStatus): OpenLoop {
  return { ...loop, status, lastTouchedAt: Date.now() }
}

export function touchLoop(loop: OpenLoop): OpenLoop {
  return { ...loop, lastTouchedAt: Date.now() }
}

// ── Tiny Action Generators ─────────────────────────────────

function generateTinyAction(title: string): string {
  const lower = title.toLowerCase()

  if (lower.includes('email') || lower.includes('mail')) return 'Write the subject line'
  if (lower.includes('essay') || lower.includes('paper') || lower.includes('write')) return 'Write one ugly sentence'
  if (lower.includes('clean') || lower.includes('room') || lower.includes('tidy')) return 'Put 10 items in a basket'
  if (lower.includes('study') || lower.includes('exam') || lower.includes('test')) return 'Make 3 flashcards'
  if (lower.includes('call') || lower.includes('phone')) return 'Write the phone number'
  if (lower.includes('pay') || lower.includes('bill')) return 'Open the bill and read the amount'
  if (lower.includes('shop') || lower.includes('buy')) return 'Write 3 items on a list'
  if (lower.includes('fix') || lower.includes('repair')) return 'Name what is broken'
  if (lower.includes('plan') || lower.includes('schedule')) return 'Write 3 time blocks'
  if (lower.includes('read')) return 'Read one paragraph'
  if (lower.includes('cook') || lower.includes('meal')) return 'Open the recipe'
  if (lower.includes('exercise') || lower.includes('workout')) return 'Put shoes on'
  if lower.includes('submit') || lower.includes('turn in') return 'Open the submission page'

  return 'Open it and read for 2 minutes'
}

function generateSmallerAction(title: string): string {
  return `Do the absolute smallest version of: ${title.slice(0, 40)}`
}

// ── Detect Open Loops from Patterns ────────────────────────

interface DistractionRecord {
  text: string
  count: number
  lastAt: number
}

export function detectRepeatedDistractions(distractions: DistractionRecord[]): string[] {
  return distractions.filter((d) => d.count >= 3).map((d) => d.text)
}

// ── Open Loop Copy ─────────────────────────────────────────

export function getOpenLoopCopy(loop: OpenLoop): string {
  if (loop.emotionalWeight >= 4) {
    return `${loop.title} — this keeps pulling at you. Close it with: ${loop.nextTinyAction}`
  }
  return `${loop.title} — ${loop.nextTinyAction}`
}

export function getOpenLoopsHeader(count: number): string {
  if (count === 0) return 'No open loops. You are clear.'
  if (count === 1) return '1 thing pulling your attention'
  return `${count} things pulling your attention`
}

export function getOpenLoopReliefCopy(loop: OpenLoop): string {
  return `You closed "${loop.title}". That attention is free now.`
}
