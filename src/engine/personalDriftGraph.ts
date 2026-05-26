// ══════════════════════════════════════════════════════════════
// INTENT — Personal Drift Graph Engine
// Learns the user's unique drift patterns over time
// ══════════════════════════════════════════════════════════════

import type {
  PersonalDriftGraph, DriftGraphEdge, DriftGraphInsight, DriftConfidence,
  UserState, EnergyLevel, RescueProtocolId,
} from '../types'
import { RESCUE_PROTOCOLS } from '../types/rescue'

export interface GraphEvent {
  state: UserState
  blocker: string | null
  protocolId: RescueProtocolId
  durationMinutes: number
  outcome: 'completed' | 'salvaged' | 'abandoned'
  energy: EnergyLevel
  surface: string
  timestamp: string
}

// ── Graph CRUD ──────────────────────────────────────────────

export function createEmptyGraph(userId: string): PersonalDriftGraph {
  return {
    userId, nodes: new Map(), edges: [], insights: [],
    lastComputed: new Date().toISOString(), totalEvents: 0,
  }
}

export function recordEvent(graph: PersonalDriftGraph, event: GraphEvent): PersonalDriftGraph {
  const newNodes = new Map(graph.nodes)
  const newEdges = [...graph.edges]
  const now = new Date().toISOString()
  const eventHour = new Date(event.timestamp).getHours()
  const eventDay = new Date(event.timestamp).getDay()
  const isWeekend = eventDay === 0 || eventDay === 6

  const stateKey = `state:${event.state}`
  const protocolKey = `protocol:${event.protocolId}`
  const outcomeKey = `outcome:${event.outcome}`
  const energyKey = `energy:${event.energy}`
  const surfaceKey = `surface:${event.surface}`
  const durationKey = `duration:${event.durationMinutes}`
  const hourKey = `hour:${String(eventHour).padStart(2, '0')}`
  const dayKindKey = isWeekend ? 'day_kind:weekend' : 'day_kind:weekday'

  if (!newNodes.has(stateKey)) newNodes.set(stateKey, { kind: 'state', value: event.state })
  if (!newNodes.has(protocolKey)) newNodes.set(protocolKey, { kind: 'protocol', value: event.protocolId })
  if (!newNodes.has(outcomeKey)) newNodes.set(outcomeKey, { kind: 'outcome', value: event.outcome })
  if (!newNodes.has(energyKey)) newNodes.set(energyKey, { kind: 'energy', value: event.energy })
  if (!newNodes.has(surfaceKey)) newNodes.set(surfaceKey, { kind: 'surface', value: event.surface })
  if (!newNodes.has(durationKey)) newNodes.set(durationKey, { kind: 'duration', value: event.durationMinutes })
  if (!newNodes.has(hourKey)) newNodes.set(hourKey, { kind: 'time_of_day', value: `${String(eventHour).padStart(2, '0')}:00` })
  if (!newNodes.has(dayKindKey)) newNodes.set(dayKindKey, { kind: 'time_of_day', value: isWeekend ? 'weekend' : 'weekday' })
  if (event.blocker) {
    const blockerKey = `blocker:${event.blocker}`
    if (!newNodes.has(blockerKey)) newNodes.set(blockerKey, { kind: 'blocker', value: event.blocker })
  }

  const updateEdge = (from: string, to: string, label: string) => {
    const existing = newEdges.find(e => e.from === from && e.to === to)
    if (existing) {
      existing.eventCount += 1
      existing.weight = Math.min(1, existing.weight + (event.outcome === 'completed' ? 0.1 : 0.02))
      existing.lastUpdated = now
    } else {
      newEdges.push({
        id: `edge_${from}_${to}_${Date.now()}`, from, to, label,
        weight: event.outcome === 'completed' ? 0.1 : 0.02,
        eventCount: 1, lastUpdated: now,
      })
    }
  }

  updateEdge(stateKey, protocolKey, `${event.state} → ${event.protocolId}`)
  updateEdge(protocolKey, outcomeKey, `${event.protocolId} → ${event.outcome}`)
  updateEdge(surfaceKey, outcomeKey, `${event.surface} → ${event.outcome}`)
  updateEdge(stateKey, durationKey, `${event.state} → ${event.durationMinutes}min`)
  if (event.blocker) updateEdge(stateKey, `blocker:${event.blocker}`, `${event.state} → ${event.blocker}`)
  updateEdge(hourKey, stateKey, `at ${eventHour}:00 → ${event.state}`)
  updateEdge(dayKindKey, stateKey, `${isWeekend ? 'weekend' : 'weekday'} → ${event.state}`)

  return { ...graph, nodes: newNodes, edges: newEdges, totalEvents: graph.totalEvents + 1, lastComputed: now }
}

// ══════════════════════════════════════════════════════════════
// Edge Decay — older events carry less weight
// ══════════════════════════════════════════════════════════════

export function decayEdges(graph: PersonalDriftGraph, daysHalfLife: number = 14): PersonalDriftGraph {
  const now = Date.now()
  const halfLifeMs = daysHalfLife * 86400000
  const newEdges = graph.edges.map(edge => {
    const ageMs = now - new Date(edge.lastUpdated).getTime()
    if (ageMs <= 0) return edge
    const decayFactor = Math.pow(0.5, ageMs / halfLifeMs)
    return { ...edge, weight: Math.max(0.01, edge.weight * decayFactor) }
  })
  return { ...graph, edges: newEdges, lastComputed: new Date().toISOString() }
}

// ══════════════════════════════════════════════════════════════
// Recovery Sequences — what works after a failure
// ══════════════════════════════════════════════════════════════

export interface RecoverySequence {
  state: string
  blocker: string | null
  recoveryProtocol: string
  recoveryDuration: number
  successRate: number
  sampleSize: number
}

export function analyzeRecoverySequences(graph: PersonalDriftGraph): RecoverySequence[] {
  if (graph.totalEvents < 6) return []
  const sequences: RecoverySequence[] = []
  const abandons = graph.edges.filter(e => e.to === 'outcome:abandoned')

  for (const abandon of abandons) {
    if (!abandon.from.startsWith('protocol:')) continue
    const protocol = abandon.from.replace('protocol:', '')
    const stateEdges = graph.edges.filter(e => e.from.startsWith('state:') && e.to === abandon.from)
    if (stateEdges.length === 0) continue

    const stateNode = stateEdges[0].from.replace('state:', '')
    const blockerEdge = graph.edges.find(e =>
      e.from === `state:${stateNode}` && e.to.startsWith('blocker:')
    )
    const blocker = blockerEdge ? blockerEdge.to.replace('blocker:', '') : null

    const comebackEdges = graph.edges.filter(e =>
      e.from.startsWith('protocol:') && e.to === 'outcome:completed'
    )
    const recoveryProtocols: Record<string, { ok: number; total: number }> = {}

    for (const ce of comebackEdges) {
      const rp = ce.from.replace('protocol:', '')
      if (!recoveryProtocols[rp]) recoveryProtocols[rp] = { ok: 0, total: 0 }
      recoveryProtocols[rp].total += ce.eventCount
      recoveryProtocols[rp].ok += ce.eventCount
    }

    const sorted = Object.entries(recoveryProtocols)
      .filter(([_, v]) => v.total >= 2)
      .sort((a, b) => (b[1].ok / b[1].total) - (a[1].ok / a[1].total))

    if (sorted.length > 0) {
      const [bestProto, stats] = sorted[0]
      const durEdge = graph.edges.find(e =>
        e.from === `state:${stateNode}` && e.to.startsWith('duration:')
      )
      const duration = durEdge ? parseInt(durEdge.to.replace('duration:', ''), 10) || 2 : 2
      sequences.push({
        state: stateNode,
        blocker,
        recoveryProtocol: bestProto,
        recoveryDuration: duration,
        successRate: stats.ok / stats.total,
        sampleSize: stats.total,
      })
    }
  }

  return sequences.sort((a, b) => b.successRate - a.successRate)
}

// ══════════════════════════════════════════════════════════════
// Drift Chain Analysis — multi-step pattern detection
// ══════════════════════════════════════════════════════════════

export interface DriftChain {
  triggerState: string
  blocker: string | null
  escapeProtocol: string
  chainLength: number
  frequency: number
}

export function analyzeDriftChains(graph: PersonalDriftGraph): DriftChain[] {
  if (graph.totalEvents < 8) return []
  const chains: DriftChain[] = []

  // Find state→blocker→outcome:abandoned patterns
  const stateBlockers = new Map<string, Map<string, number>>()
  for (const edge of graph.edges) {
    if (edge.from.startsWith('state:') && edge.to.startsWith('blocker:')) {
      const state = edge.from.replace('state:', '')
      const blocker = edge.to.replace('blocker:', '')
      if (!stateBlockers.has(state)) stateBlockers.set(state, new Map())
      stateBlockers.get(state)!.set(blocker, (stateBlockers.get(state)!.get(blocker) || 0) + edge.eventCount)
    }
  }

  for (const [state, blockers] of stateBlockers) {
    for (const [blocker, freq] of blockers) {
      // Find what protocol follows this state+blocker pair
      const protocolEdges = graph.edges.filter(e =>
        e.from === `state:${state}` && e.to.startsWith('protocol:')
      )
      if (protocolEdges.length === 0) continue

      const escaped = protocolEdges
        .filter(e => {
          const outcomeEdges = graph.edges.filter(oe =>
            oe.from === e.to && oe.to === 'outcome:completed'
          )
          return outcomeEdges.length > 0
        })
        .sort((a, b) => b.weight - a.weight)

      if (escaped.length > 0) {
        chains.push({
          triggerState: state,
          blocker,
          escapeProtocol: escaped[0].to.replace('protocol:', ''),
          chainLength: 4,
          frequency: freq,
        })
      }
    }
  }

  return chains.sort((a, b) => b.frequency - a.frequency)
}

// ── Insights ────────────────────────────────────────────────

export function computeInsights(graph: PersonalDriftGraph): DriftGraphInsight[] {
  if (graph.totalEvents < 2) return []
  const insights: DriftGraphInsight[] = []
  const now = new Date().toISOString()
  const allStates: UserState[] = ['avoiding','overwhelmed','stuck','tired','distracted','anxious','scattered','ready','bored','perfectionism','unclear','time_pressure','low_confidence','shame_spiral','fake_productivity','planning_loop','doomscroll_risk']

  for (const state of allStates) {
    const stateKey = `state:${state}`
    const protocolEdges = graph.edges.filter(e => e.from === stateKey && e.to.startsWith('protocol:'))
    if (protocolEdges.length === 0) continue

    let bestProtocol: string | null = null
    let bestWeight = -1
    for (const edge of protocolEdges) {
      const completed = graph.edges.filter(e => e.from === edge.to && e.to === 'outcome:completed').length
      const total = graph.edges.filter(e => e.from === edge.to && (e.to === 'outcome:completed' || e.to === 'outcome:salvaged' || e.to === 'outcome:abandoned')).length
      const rate = total > 0 ? completed / total : 0
      if (rate > bestWeight && total >= 2) { bestWeight = rate; bestProtocol = edge.to.replace('protocol:', '') }
    }
    if (bestProtocol) {
      const eventCount = protocolEdges.reduce((s, e) => s + e.eventCount, 0)
      insights.push({
        id: `insight_best_proto_${state}`,
        text: `When ${state}, ${bestProtocol} has the highest completion rate (${Math.round(bestWeight * 100)}%).`,
        confidence: getConfidence(eventCount), eventCount,
        category: 'best_protocol', relatedNodeIds: [stateKey], generatedAt: now,
      })
    }

    // Best duration by state
    const durationEdges = graph.edges.filter(e => e.from === stateKey && e.to.startsWith('duration:'))
    if (durationEdges.length >= 3) {
      const durMap: [number, { completed: number; total: number }][] = []
      for (const edge of durationEdges) {
        const dur = parseInt(edge.to.replace('duration:', ''), 10)
        if (isNaN(dur)) continue
        const existing = durMap.find(x => x[0] === dur)
        if (existing) {
          existing[1].total += edge.eventCount
          if (edge.to === 'outcome:completed') existing[1].completed += edge.eventCount
        } else {
          durMap.push([dur, { completed: 0, total: edge.eventCount }])
        }
      }
      let bestDur: number | null = null
      let bestDurRate = -1
      for (const [dur, stats] of durMap) {
        const rate = stats.total > 0 ? stats.completed / stats.total : 0
        if (rate > bestDurRate && stats.total >= 2) { bestDurRate = rate; bestDur = dur }
      }
      if (bestDur !== null) {
        insights.push({
          id: `insight_best_dur_${state}`,
          text: `When ${state}, ${bestDur}-minute missions work best (${Math.round(bestDurRate * 100)}% completion).`,
          confidence: getConfidence(durationEdges.reduce((s, e) => s + e.eventCount, 0)),
          eventCount: durationEdges.reduce((s, e) => s + e.eventCount, 0),
          category: 'best_duration', relatedNodeIds: [stateKey], generatedAt: now,
        })
      }
    }
  }

  // Strongest drift signal
  const signalCounts: [string, number][] = []
  for (const edge of graph.edges) {
    if (edge.from.startsWith('state:') && edge.to === 'outcome:abandoned') {
      const state = edge.from.replace('state:', '')
      const existing = signalCounts.find(x => x[0] === state)
      if (existing) existing[1] += edge.eventCount
      else signalCounts.push([state, edge.eventCount])
    }
  }
  let strongestSignal: string | null = null
  let strongestCount = 0
  for (const [signal, count] of signalCounts) {
    if (count > strongestCount) { strongestCount = count; strongestSignal = signal }
  }
  if (strongestSignal && strongestCount >= 2) {
    insights.push({
      id: 'insight_strongest_signal',
      text: `Your biggest drift pattern is "${strongestSignal}" (${strongestCount} abandons).`,
      confidence: getConfidence(strongestCount), eventCount: strongestCount,
      category: 'strongest_signal', relatedNodeIds: [`state:${strongestSignal}`], generatedAt: now,
    })
  }

  // Best comeback
  const comebackEdges = graph.edges.filter(e => e.from.startsWith('protocol:') && e.to === 'outcome:completed')
  let bestComeback: string | null = null
  let bestComebackRate = -1
  for (const edge of comebackEdges) {
    const total = graph.edges.filter(e => e.from === edge.from).length
    const completed = graph.edges.filter(e => e.from === edge.from && e.to === 'outcome:completed').length
    const rate = total > 0 ? completed / total : 0
    if (rate > bestComebackRate && total >= 2) { bestComebackRate = rate; bestComeback = edge.from.replace('protocol:', '') }
  }
  if (bestComeback) {
    insights.push({
      id: 'insight_best_comeback',
      text: `Your best comeback pattern is ${bestComeback} (${Math.round(bestComebackRate * 100)}% success).`,
      confidence: getConfidence(comebackEdges.length), eventCount: comebackEdges.length,
      category: 'best_comeback', relatedNodeIds: [], generatedAt: now,
    })
  }

  // ── Recovery Sequence Insights ─────────────────────────────
  const recoverySequences = analyzeRecoverySequences(graph)
  for (const seq of recoverySequences.slice(0, 3)) {
    const blockerText = seq.blocker ? ` after ${seq.blocker}` : ''
    insights.push({
      id: `insight_recovery_${seq.state}_${seq.recoveryProtocol}`,
      text: `When ${seq.state}${blockerText}, ${seq.recoveryProtocol} recovers you (${Math.round(seq.successRate * 100)}% success, ${seq.sampleSize}x).`,
      confidence: getConfidence(seq.sampleSize), eventCount: seq.sampleSize,
      category: 'recovery_sequence', relatedNodeIds: [`state:${seq.state}`], generatedAt: now,
    })
  }

  // ── Drift Chain Insights ───────────────────────────────────
  const driftChains = analyzeDriftChains(graph)
  for (const chain of driftChains.slice(0, 2)) {
    insights.push({
      id: `insight_chain_${chain.triggerState}_${chain.blocker}`,
      text: `Common drift pattern: ${chain.triggerState} + ${chain.blocker} → recover with ${chain.escapeProtocol} (${chain.frequency}x).`,
      confidence: getConfidence(chain.frequency), eventCount: chain.frequency,
      category: 'drift_chain', relatedNodeIds: [`state:${chain.triggerState}`], generatedAt: now,
    })
  }

  return insights
}

// ── Query Functions ─────────────────────────────────────────

export function getBestProtocol(graph: PersonalDriftGraph, state: UserState): RescueProtocolId | null {
  if (graph.totalEvents < 3) return null
  const stateKey = `state:${state}`
  const protocolEdges = graph.edges.filter(e => e.from === stateKey && e.to.startsWith('protocol:'))
  let best: RescueProtocolId | null = null
  let bestRate = -1
  for (const edge of protocolEdges) {
    const completed = graph.edges.filter(e => e.from === edge.to && e.to === 'outcome:completed').length
    const total = graph.edges.filter(e => e.from === edge.to).length
    const rate = total > 0 ? completed / total : 0
    if (rate > bestRate && total >= 2) { bestRate = rate; best = edge.to.replace('protocol:', '') as RescueProtocolId }
  }
  return best
}

export function getBestDuration(graph: PersonalDriftGraph, state: UserState): number | null {
  if (graph.totalEvents < 3) return null
  const stateKey = `state:${state}`
  const durationEdges = graph.edges.filter(e => e.from === stateKey && e.to.startsWith('duration:'))
  const durMap: [number, { completed: number; total: number }][] = []
  for (const edge of durationEdges) {
    const dur = parseInt(edge.to.replace('duration:', ''), 10)
    if (isNaN(dur)) continue
    const existing = durMap.find(x => x[0] === dur)
    if (existing) { existing[1].total += edge.eventCount } else { durMap.push([dur, { completed: 0, total: edge.eventCount }]) }
  }
  let bestDur: number | null = null
  let bestRate = -1
  for (const [dur, stats] of durMap) {
    const rate = stats.total > 0 ? stats.completed / stats.total : 0
    if (rate > bestRate && stats.total >= 2) { bestRate = rate; bestDur = dur }
  }
  return bestDur
}

export function getStrongestSignal(graph: PersonalDriftGraph): string | null {
  const counts: [string, number][] = []
  for (const edge of graph.edges) {
    if (edge.to === 'outcome:abandoned') {
      const state = edge.from.replace('state:', '')
      const existing = counts.find(x => x[0] === state)
      if (existing) existing[1] += edge.eventCount; else counts.push([state, edge.eventCount])
    }
  }
  let best: string | null = null
  let bestCount = 0
  for (const [signal, count] of counts) { if (count > bestCount) { bestCount = count; best = signal } }
  return best
}

export function getBestComebackStrategy(graph: PersonalDriftGraph): string | null {
  if (graph.totalEvents < 5) return null
  const edges = graph.edges.filter(e => e.from.startsWith('protocol:') && e.to === 'outcome:completed')
  let best: string | null = null
  let bestRate = -1
  for (const edge of edges) {
    const total = graph.edges.filter(e => e.from === edge.from).length
    const completed = graph.edges.filter(e => e.from === edge.from && e.to === 'outcome:completed').length
    const rate = total > 0 ? completed / total : 0
    if (rate > bestRate && total >= 2) { bestRate = rate; best = edge.from.replace('protocol:', '') }
  }
  return best
}

export function getBestSurface(graph: PersonalDriftGraph): string | null {
  if (graph.totalEvents < 3) return null
  const edges = graph.edges.filter(e => e.from.startsWith('surface:') && e.to === 'outcome:completed')
  let best: string | null = null
  let bestCount = 0
  for (const edge of edges) { if (edge.eventCount > bestCount) { bestCount = edge.eventCount; best = edge.from.replace('surface:', '') } }
  return best
}

export function summarizeGraph(graph: PersonalDriftGraph): string {
  if (graph.totalEvents === 0) return 'No data yet. Complete a few missions to see your patterns.'
  const parts: string[] = [`${graph.totalEvents} events recorded.`]
  const bestProtocol = getBestProtocol(graph, 'avoiding')
  if (bestProtocol) parts.push(`Best protocol for avoiding: ${bestProtocol}.`)
  const strongest = getStrongestSignal(graph)
  if (strongest) parts.push(`Strongest drift pattern: ${strongest}.`)
  const bestSurface = getBestSurface(graph)
  if (bestSurface) parts.push(`Best entry point: ${bestSurface}.`)
  const chains = analyzeDriftChains(graph)
  if (chains.length > 0) {
    const top = chains[0]
    parts.push(`Common chain: ${top.triggerState} + ${top.blocker} → ${top.escapeProtocol} (${top.frequency}x).`)
  }
  const recoveries = analyzeRecoverySequences(graph)
  if (recoveries.length > 0) {
    const top = recoveries[0]
    parts.push(`Best recovery: ${top.state} → ${top.recoveryProtocol} (${Math.round(top.successRate * 100)}%).`)
  }
  return parts.join(' ')
}

function getConfidence(eventCount: number): DriftConfidence {
  if (eventCount < 3) return 'low'
  if (eventCount < 8) return 'emerging'
  if (eventCount < 20) return 'reliable'
  return 'strong'
}
