// ══════════════════════════════════════════════════════════════
// INTENT — Mission Thread Timeline
// Embeddable timeline component for mission threads
// ══════════════════════════════════════════════════════════════

import React from 'react'
import { View, Text, StyleSheet, FlatList } from 'react-native'
import type { ThreadEvent } from '../../engine/missionThreadEngine'

interface Props {
  events: ThreadEvent[]
  maxItems?: number
}

export const MissionThreadTimeline: React.FC<Props> = ({ events, maxItems }) => {
  const displayEvents = maxItems ? events.slice(-maxItems) : events

  const getEventColor = (type: string) => {
    switch (type) {
      case 'mission_completed': return '#00ff88'
      case 'mission_started': return '#4488ff'
      case 'mission_salvaged': return '#ffaa00'
      case 'blocker_detected': return '#ff4444'
      case 'protocol_changed': return '#8888ff'
      default: return '#666666'
    }
  }

  const getEventEmoji = (type: string) => {
    switch (type) {
      case 'context_added': return '📎'
      case 'mission_compiled': return '📋'
      case 'mission_started': return '▶️'
      case 'mission_completed': return '✅'
      case 'mission_salvaged': return '🔄'
      case 'blocker_detected': return '🚧'
      case 'protocol_changed': return '🔀'
      case 'handoff_created': return '📤'
      case 'outcome_labeled': return '🏷️'
      case 'next_action_generated': return '➡️'
      default: return '•'
    }
  }

  if (displayEvents.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No events yet.</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {displayEvents.map((event, index) => (
        <View key={event.id} style={styles.eventRow}>
          <View style={styles.eventLeft}>
            <View style={[styles.dot, { backgroundColor: getEventColor(event.type) }]} />
            {index < displayEvents.length - 1 && <View style={styles.line} />}
          </View>
          <View style={styles.eventContent}>
            <Text style={styles.eventLabel}>
              {getEventEmoji(event.type)} {event.description}
            </Text>
            <Text style={styles.eventTime}>
              {new Date(event.timestamp).toLocaleDateString()} {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  emptyContainer: { paddingVertical: 20, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#666666' },
  eventRow: { flexDirection: 'row', minHeight: 40 },
  eventLeft: { width: 24, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  line: { flex: 1, width: 1, backgroundColor: '#2a2a2a', marginTop: 4 },
  eventContent: { flex: 1, paddingLeft: 8, paddingBottom: 12 },
  eventLabel: { fontSize: 13, color: '#cccccc', lineHeight: 18 },
  eventTime: { fontSize: 11, color: '#555555', marginTop: 2 },
})
