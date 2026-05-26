// ══════════════════════════════════════════════════════════════
// INTENT — Body Double History Screen
// Track body double sessions over time
// ══════════════════════════════════════════════════════════════

import React from 'react'
import { View, Text, StyleSheet, FlatList } from 'react-native'
import type { BodyDoubleSession } from '../../services/bodyDouble/bodyDoubleSessionEngine'
import { BODY_DOUBLE_MODES, getBodyDoubleSummary } from '../../services/bodyDouble/bodyDoubleSessionEngine'

interface Props {
  sessions: BodyDoubleSession[]
}

export const BodyDoubleHistoryScreen: React.FC<Props> = ({ sessions }) => {
  const completed = sessions.filter((s) => s.outcome === 'completed').length
  const partial = sessions.filter((s) => s.outcome === 'partial').length
  const avgDuration = sessions.length > 0
    ? Math.round(sessions.reduce((a, s) => a + ((s.endedAt ?? Date.now()) - s.startedAt), 0) / sessions.length / 60000)
    : 0

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Body Double Sessions</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{partial}</Text>
          <Text style={styles.statLabel}>Partial</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{avgDuration}m</Text>
          <Text style={styles.statLabel}>Avg duration</Text>
        </View>
      </View>

      <FlatList
        data={sessions.slice().reverse()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const summary = getBodyDoubleSummary(item)
          const modeConfig = BODY_DOUBLE_MODES.find((m) => m.mode === item.mode)
          return (
            <View style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <Text style={styles.sessionMode}>{modeConfig?.label ?? item.mode}</Text>
                <Text style={[styles.sessionOutcome, { color: item.outcome === 'completed' ? '#00ff88' : item.outcome === 'partial' ? '#ffaa00' : '#666666' }]}>
                  {item.outcome ?? 'in progress'}
                </Text>
              </View>
              <Text style={styles.sessionIntention}>"{item.intention}"</Text>
              <Text style={styles.sessionMeta}>
                {summary.duration}m · {summary.checkInCount} check-ins · {Math.round(summary.responseRate * 100)}% response
              </Text>
            </View>
          )
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No body double sessions yet. Start one to work alongside presence.</Text>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '800', color: '#ffffff', marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#00ff88' },
  statLabel: { fontSize: 11, color: '#888888', marginTop: 4 },
  sessionCard: { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 14, marginBottom: 8 },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  sessionMode: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  sessionOutcome: { fontSize: 13, fontWeight: '600' },
  sessionIntention: { fontSize: 13, color: '#cccccc', fontStyle: 'italic', marginBottom: 6 },
  sessionMeta: { fontSize: 12, color: '#666666' },
  empty: { fontSize: 14, color: '#666666', textAlign: 'center', marginTop: 40 },
})
