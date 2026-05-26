// ══════════════════════════════════════════════════════════════
// INTENT — Agent Run Detail Screen
// Full detail view of an agent run trace
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'

interface AgentStep {
  id: string
  label: string
  status: 'passed' | 'skipped' | 'failed' | 'fallback'
  detail?: string
  duration?: number
}

interface AgentRunDetail {
  id: string
  trigger: string
  startedAt: string
  duration: number
  usedRemoteAI: boolean
  usedLocalFallback: boolean
  explanation: string
  steps: AgentStep[]
}

const TRIGGER_LABELS: Record<string, string> = {
  manual_rescue: 'Manual Rescue',
  ambient_suggestion: 'Ambient Suggestion',
  context_capsule: 'Context Capsule',
  notification_action: 'Notification Action',
  before_scroll: 'Before Scroll',
  salvage: 'Salvage',
  body_double: 'Body Double',
}

export function AgentRunDetailScreen(): React.JSX.Element {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const { runId } = route.params ?? {}

  const [expandedStep, setExpandedStep] = useState<string | null>(null)

  // In production, load from AgentRunStore by ID
  const run: AgentRunDetail = {
    id: runId ?? 'demo',
    trigger: 'manual_rescue',
    startedAt: new Date().toISOString(),
    duration: 340,
    usedRemoteAI: false,
    usedLocalFallback: true,
    explanation:
      'You selected Overwhelmed with 5 minutes available. Shrink The Beast has the highest start rate for this state. Mission was reduced to 2 minutes to lower friction.',
    steps: [
      { id: 'safety', label: 'Safety Check', status: 'passed', detail: 'No crisis signals detected', duration: 12 },
      { id: 'classify', label: 'Moment Classification', status: 'passed', detail: 'State: overwhelmed, Energy: low, Time: 5min', duration: 8 },
      { id: 'protocol', label: 'Protocol Selection', status: 'passed', detail: 'Selected: shrink_the_beast (confidence: 0.82)', duration: 15 },
      { id: 'compile', label: 'Mission Compilation', status: 'passed', detail: '"Open the essay doc and write one ugly sentence"', duration: 22 },
      { id: 'quality', label: 'Quality Gate', status: 'passed', detail: 'Action is concrete, time-bound, specific', duration: 5 },
      { id: 'privacy', label: 'Privacy Gate', status: 'passed', detail: 'No sensitive data in mission text', duration: 4 },
      { id: 'tools', label: 'Tool Proposal', status: 'skipped', detail: 'No tool handoff needed for this mission' },
      { id: 'recommend', label: 'Final Recommendation', status: 'passed', detail: 'Mission approved with 2-min timer', duration: 3 },
    ],
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'passed': return '#00ff88'
      case 'failed': return '#ff4444'
      case 'fallback': return '#ffaa00'
      case 'skipped': return '#666'
      default: return '#888'
    }
  }

  const statusIcon = (s: string) => {
    switch (s) {
      case 'passed': return '✓'
      case 'failed': return '✗'
      case 'fallback': return '↻'
      case 'skipped': return '—'
      default: return '?'
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agent Run</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Trigger</Text>
            <Text style={styles.summaryValue}>
              {TRIGGER_LABELS[run.trigger] ?? run.trigger}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>{run.duration}ms</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>AI Used</Text>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>
                {run.usedRemoteAI
                  ? 'Enhanced with AI'
                  : run.usedLocalFallback
                    ? 'Local rules only'
                    : 'Deterministic'}
              </Text>
            </View>
          </View>
        </View>

        {/* Why This Mission */}
        <Text style={styles.sectionTitle}>Why This Mission?</Text>
        <View style={styles.explanationCard}>
          <Text style={styles.explanationText}>{run.explanation}</Text>
        </View>

        {/* Steps */}
        <Text style={styles.sectionTitle}>Agent Steps</Text>
        {run.steps.map((step, idx) => (
          <TouchableOpacity
            key={step.id}
            style={styles.stepCard}
            onPress={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
            activeOpacity={0.8}
          >
            <View style={styles.stepHeader}>
              <View style={[styles.stepDot, { backgroundColor: statusColor(step.status) }]} />
              <Text style={styles.stepNumber}>{idx + 1}</Text>
              <Text style={styles.stepLabel}>{step.label}</Text>
              <Text style={[styles.stepStatus, { color: statusColor(step.status) }]}>
                {statusIcon(step.status)} {step.status}
              </Text>
            </View>

            {expandedStep === step.id && step.detail && (
              <View style={styles.stepDetail}>
                <Text style={styles.stepDetailText}>{step.detail}</Text>
                {step.duration != null && (
                  <Text style={styles.stepDuration}>{step.duration}ms</Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
  },
  backText: { fontSize: 16, color: '#00ff88', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  summaryCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: { fontSize: 14, color: '#888' },
  summaryValue: { fontSize: 14, color: '#fff', fontWeight: '600' },
  aiBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#0a1a0a',
    borderWidth: 1,
    borderColor: '#00ff8830',
  },
  aiBadgeText: { fontSize: 12, color: '#00ff88', fontWeight: '600' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 24,
    marginBottom: 12,
  },
  explanationCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#00ff8820',
  },
  explanationText: { fontSize: 15, color: '#e0e0e0', lineHeight: 24 },
  stepCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  stepHeader: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  stepNumber: { fontSize: 12, color: '#555', width: 20, fontWeight: '600' },
  stepLabel: { flex: 1, fontSize: 14, color: '#e0e0e0', fontWeight: '600' },
  stepStatus: { fontSize: 12, fontWeight: '600' },
  stepDetail: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  stepDetailText: { fontSize: 13, color: '#aaa', lineHeight: 20 },
  stepDuration: { fontSize: 11, color: '#666', marginTop: 4 },
})
