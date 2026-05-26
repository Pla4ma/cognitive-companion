// ══════════════════════════════════════════════════════════════
// INTENT — Before Scroll History Screen
// Track before-scroll sessions over time
// ══════════════════════════════════════════════════════════════

import React from 'react'
import { View, Text, StyleSheet, FlatList } from 'react-native'
import type { BeforeScrollSession } from '../../services/beforeScroll/beforeScrollEngine'
import { BEFORE_SCROLL_MODES } from '../../services/beforeScroll/beforeScrollEngine'

interface Props {
  sessions: BeforeScrollSession[]
}

export const BeforeScrollHistoryScreen: React.FC<Props> = ({ sessions }) => {
  const wins = sessions.filter((s) => s.tinyWinCompleted).length
  const intentionalScrolls = sessions.filter((s) => s.outcome === 'intentional_scroll').length
  const switched = sessions.filter((s) => s.outcome === 'switched_mission').length

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'tiny_win': return '#00ff88'
      case 'intentional_scroll': return '#ffaa00'
      case 'switched_mission': return '#4488ff'
      case 'done': return '#00ff88'
      default: return '#666666'
    }
  }

  const getOutcomeLabel = (session: BeforeScrollSession) => {
    if (session.outcome === 'tiny_win' || (session.tinyWinCompleted && session.outcome === 'abandoned')) return 'Tiny win'
    if (session.outcome === 'intentional_scroll') return 'Intentional scroll'
    if (session.outcome === 'switched_mission') return 'Switched mission'
    if (session.outcome === 'done') return 'Done'
    return 'Abandoned'
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Before You Scroll</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{wins}</Text>
          <Text style={styles.statLabel}>Tiny wins</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{intentionalScrolls}</Text>
          <Text style={styles.statLabel}>Intentional scrolls</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{sessions.length}</Text>
          <Text style={styles.statLabel}>Total sessions</Text>
        </View>
      </View>

      <Text style={styles.insight}>
        {wins > 0
          ? `${wins}/${sessions.length} sessions started with a tiny win.`
          : 'Start your first before-scroll session.'}
      </Text>

      <FlatList
        data={sessions.slice().reverse()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionMode}>
                {BEFORE_SCROLL_MODES.find((m) => m.mode === item.mode)?.label ?? item.mode}
              </Text>
              <Text style={[styles.sessionOutcome, { color: getOutcomeColor(item.outcome) }]}>
                {getOutcomeLabel(item)}
              </Text>
            </View>
            <Text style={styles.sessionTime}>
              {new Date(item.startedAt).toLocaleDateString()} {new Date(item.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {item.avoidanceNamed && (
              <Text style={styles.avoidance}>Avoiding: {item.avoidanceNamed}</Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No before-scroll sessions yet. Try one next time you feel the pull to scroll.</Text>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '800', color: '#ffffff', marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#00ff88' },
  statLabel: { fontSize: 11, color: '#888888', marginTop: 4 },
  insight: { fontSize: 14, color: '#cccccc', marginBottom: 20, lineHeight: 20 },
  sessionCard: { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 14, marginBottom: 8 },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sessionMode: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
  sessionOutcome: { fontSize: 13, fontWeight: '600' },
  sessionTime: { fontSize: 12, color: '#666666' },
  avoidance: { fontSize: 12, color: '#888888', marginTop: 4, fontStyle: 'italic' },
  empty: { fontSize: 14, color: '#666666', textAlign: 'center', marginTop: 40 },
})
