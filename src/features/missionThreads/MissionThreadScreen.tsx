// ══════════════════════════════════════════════════════════════
// INTENT — Mission Thread Screen
// Track progress across attempts — not tasks
// ══════════════════════════════════════════════════════════════

import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import type { MissionThread, ThreadEvent } from '../../engine/missionThreadEngine'
import { getThreadSummary, getCurrentNextAction } from '../../engine/missionThreadEngine'

interface Props {
  thread: MissionThread
  onRescue: () => void
  onBack: () => void
}

export const MissionThreadScreen: React.FC<Props> = ({ thread, onRescue, onBack }) => {
  const summary = getThreadSummary(thread)
  const nextAction = getCurrentNextAction(thread)

  const getEventColor = (event: ThreadEvent) => {
    switch (event.type) {
      case 'mission_completed': return '#00ff88'
      case 'mission_started': return '#4488ff'
      case 'mission_salvaged': return '#ffaa00'
      case 'blocker_detected': return '#ff4444'
      case 'protocol_changed': return '#8888ff'
      case 'outcome_labeled': return '#cccccc'
      default: return '#666666'
    }
  }

  const getEventLabel = (event: ThreadEvent) => {
    switch (event.type) {
      case 'context_added': return '📎 Context added'
      case 'mission_compiled': return '📋 Mission created'
      case 'mission_started': return '▶️ Started'
      case 'mission_completed': return '✅ Completed'
      case 'mission_salvaged': return '🔄 Salvaged'
      case 'blocker_detected': return '🚧 Blocker found'
      case 'protocol_changed': return '🔀 Protocol changed'
      case 'handoff_created': return '📤 Action handoff'
      case 'outcome_labeled': return '🏷️ Outcome labeled'
      case 'next_action_generated': return '➡️ Next action'
      default: return event.type
    }
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backLink} onPress={onBack}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{thread.title}</Text>
      <Text style={styles.status}>{thread.status}</Text>

      {/* Summary Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{summary.totalAttempts}</Text>
          <Text style={styles.statLabel}>Attempts</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{summary.completions}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{summary.salvages}</Text>
          <Text style={styles.statLabel}>Salvaged</Text>
        </View>
      </View>

      {/* Current Next Action */}
      {nextAction && (
        <View style={styles.nextActionCard}>
          <Text style={styles.nextActionLabel}>Next tiny action</Text>
          <Text style={styles.nextActionText}>{nextAction}</Text>
          <TouchableOpacity style={styles.rescueButton} onPress={onRescue}>
            <Text style={styles.rescueText}>Start rescue</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Timeline */}
      <Text style={styles.sectionTitle}>Timeline</Text>
      {thread.events.map((event, index) => (
        <View key={event.id} style={styles.timelineItem}>
          <View style={[styles.timelineDot, { backgroundColor: getEventColor(event) }]} />
          {index < thread.events.length - 1 && <View style={styles.timelineLine} />}
          <View style={styles.timelineContent}>
            <Text style={styles.timelineLabel}>{getEventLabel(event)}</Text>
            <Text style={styles.timelineMessage}>{event.description}</Text>
            <Text style={styles.timelineTime}>
              {new Date(event.timestamp).toLocaleDateString()} {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 20, paddingTop: 60 },
  backLink: { marginBottom: 12 },
  backText: { fontSize: 14, color: '#666666' },
  title: { fontSize: 26, fontWeight: '800', color: '#ffffff', marginBottom: 4 },
  status: { fontSize: 13, color: '#00ff88', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#00ff88' },
  statLabel: { fontSize: 11, color: '#888888', marginTop: 4 },
  nextActionCard: { backgroundColor: '#1a2a1a', borderRadius: 14, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: '#00ff88' },
  nextActionLabel: { fontSize: 12, color: '#00ff88', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  nextActionText: { fontSize: 16, color: '#ffffff', fontWeight: '600', marginBottom: 14 },
  rescueButton: { backgroundColor: '#00ff88', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  rescueText: { fontSize: 15, fontWeight: '700', color: '#000000' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#00ff88', marginBottom: 14 },
  timelineItem: { flexDirection: 'row', marginBottom: 0, position: 'relative' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, marginRight: 12 },
  timelineLine: { position: 'absolute', left: 4.5, top: 14, bottom: -8, width: 1, backgroundColor: '#2a2a2a' },
  timelineContent: { flex: 1, paddingBottom: 16 },
  timelineLabel: { fontSize: 14, fontWeight: '600', color: '#ffffff', marginBottom: 2 },
  timelineMessage: { fontSize: 13, color: '#cccccc', marginBottom: 2 },
  timelineTime: { fontSize: 11, color: '#666666' },
})
