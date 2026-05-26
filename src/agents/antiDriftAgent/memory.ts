// ══════════════════════════════════════════════════════════════
// INTENT — Anti-Drift Agent: Memory Functions
// What to remember from each moment/session
// ══════════════════════════════════════════════════════════════

import type { MemoryItem, MemoryItemType, MemoryConfidence } from '../../types'
import type { GraphUpdate } from './types'

/**
 * Determine what to remember from a completed moment/session.
 */
export function extractMemoryUpdates(context: {
  state: string
  blocker: string | null
  protocolId: string
  outcome: 'completed' | 'salvaged' | 'abandoned'
  durationMinutes: number
  energy: string
  source: string
}): MemoryItem[] {
  const updates: MemoryItem[] = []
  const now = new Date().toISOString()

  // Remember successful protocol
  if (context.outcome === 'completed') {
    updates.push({
      id: `mem_proto_${Date.now()}`,
      type: 'successful_protocol',
      title: `${context.protocolId} works for ${context.state}`,
      summary: `When ${context.state}, ${context.protocolId} led to completion in ${context.durationMinutes}min`,
      source: 'mission',
      confidence: 'low',
      sensitivity: 'normal',
      storageLocation: 'local_only',
      userVisible: true,
      userEditable: true,
      createdAt: now,
      updatedAt: now,
      expiresAt: null,
      retentionPolicy: 'keep_until_deleted',
      relatedIds: [],
      rawEvidenceIds: [],
      deletedAt: null,
    })
  }

  // Remember failed protocol
  if (context.outcome === 'abandoned') {
    updates.push({
      id: `mem_fail_${Date.now()}`,
      type: 'failed_protocol',
      title: `${context.protocolId} didn't work for ${context.state}`,
      summary: `When ${context.state}, ${context.protocolId} was abandoned after ${context.durationMinutes}min`,
      source: 'mission',
      confidence: 'low',
      sensitivity: 'normal',
      storageLocation: 'local_only',
      userVisible: true,
      userEditable: true,
      createdAt: now,
      updatedAt: now,
      expiresAt: null,
      retentionPolicy: 'keep_until_deleted',
      relatedIds: [],
      rawEvidenceIds: [],
      deletedAt: null,
    })
  }

  // Remember blocker pattern
  if (context.blocker) {
    updates.push({
      id: `mem_block_${Date.now()}`,
      type: 'blocker',
      title: `${context.blocker} blocks ${context.state}`,
      summary: `Blocker "${context.blocker}" appeared during ${context.state} state`,
      source: 'moment',
      confidence: 'low',
      sensitivity: 'normal',
      storageLocation: 'local_only',
      userVisible: true,
      userEditable: true,
      createdAt: now,
      updatedAt: now,
      expiresAt: null,
      retentionPolicy: 'keep_until_deleted',
      relatedIds: [],
      rawEvidenceIds: [],
      deletedAt: null,
    })
  }

  // Remember energy pattern
  updates.push({
    id: `mem_energy_${Date.now()}`,
    type: 'energy_pattern',
    title: `${context.energy} energy during ${context.state}`,
    summary: `Energy level was ${context.energy} when ${context.state}`,
    source: 'moment',
    confidence: 'low',
    sensitivity: 'normal',
    storageLocation: 'local_only',
    userVisible: true,
    userEditable: true,
    createdAt: now,
    updatedAt: now,
    expiresAt: null,
    retentionPolicy: 'keep_until_deleted',
    relatedIds: [],
    rawEvidenceIds: [],
    deletedAt: null,
  })

  return updates
}

/**
 * Calculate confidence based on event count.
 */
export function calculateConfidence(eventCount: number): MemoryConfidence {
  if (eventCount < 3) return 'low'
  if (eventCount < 8) return 'emerging'
  if (eventCount < 20) return 'reliable'
  return 'strong'
}

/**
 * Generate graph updates from a session outcome.
 */
export function generateGraphUpdates(context: {
  state: string
  blocker: string | null
  protocolId: string
  outcome: 'completed' | 'salvaged' | 'abandoned'
  durationMinutes: number
  energy: string
  surface: string
}): GraphUpdate[] {
  const updates: GraphUpdate[] = []
  const now = new Date().toISOString()

  // State → Protocol edge
  updates.push({
    type: 'update_edge',
    targetId: `edge_state_${context.state}_proto_${context.protocolId}`,
    payload: {
      from: `state:${context.state}`,
      to: `protocol:${context.protocolId}`,
      label: `${context.state} → ${context.protocolId}`,
      weight: context.outcome === 'completed' ? 0.1 : -0.05,
      eventCount: 1,
      lastUpdated: now,
    },
  })

  // Protocol → Outcome edge
  updates.push({
    type: 'update_edge',
    targetId: `edge_proto_${context.protocolId}_outcome_${context.outcome}`,
    payload: {
      from: `protocol:${context.protocolId}`,
      to: `outcome:${context.outcome}`,
      label: `${context.protocolId} → ${context.outcome}`,
      weight: 0.1,
      eventCount: 1,
      lastUpdated: now,
    },
  })

  // State → Blocker edge
  if (context.blocker) {
    updates.push({
      type: 'update_edge',
      targetId: `edge_state_${context.state}_blocker_${context.blocker}`,
      payload: {
        from: `state:${context.state}`,
        to: `blocker:${context.blocker}`,
        label: `${context.state} → ${context.blocker}`,
        weight: 0.1,
        eventCount: 1,
        lastUpdated: now,
      },
    })
  }

  // Surface → Outcome edge
  updates.push({
    type: 'update_edge',
    targetId: `edge_surface_${context.surface}_outcome_${context.outcome}`,
    payload: {
      from: `surface:${context.surface}`,
      to: `outcome:${context.outcome}`,
      label: `${context.surface} → ${context.outcome}`,
      weight: 0.05,
      eventCount: 1,
      lastUpdated: now,
    },
  })

  return updates
}
