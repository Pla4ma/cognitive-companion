// ══════════════════════════════════════════════════════════════
// INTENT — Ambient Digest Screen
// Shows daily/weekly ambient agent activity
// ══════════════════════════════════════════════════════════════

import React from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import type { AmbientSuggestion } from '../../src/types/ambient'

interface AmbientDigestScreenProps {
  suggestions?: AmbientSuggestion[]
}

export default function AmbientDigestScreen({ suggestions = [] }: AmbientDigestScreenProps) {
  const router = useRouter()

  const actedOn = suggestions.filter((s) => s.actedAt)
  const dismissed = suggestions.filter((s) => s.dismissedAt)
  const expired = suggestions.filter((s) => !s.actedAt && !s.dismissedAt && new Date(s.expiresAt) < new Date())

  const actRate = suggestions.length > 0 ? actedOn.length / suggestions.length : 0

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Ambient Digest</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Total" value={suggestions.length.toString()} color="#6C3AED" />
        <StatCard label="Acted" value={actedOn.length.toString()} color="#10B981" />
        <StatCard label="Dismissed" value={dismissed.length.toString()} color="#F59E0B" />
        <StatCard label="Act Rate" value={`${Math.round(actRate * 100)}%`} color="#3B82F6" />
      </View>

      {/* Copy guidance */}
      {actRate < 0.2 && suggestions.length >= 5 && (
        <View style={styles.insightCard}>
          <Text style={styles.insightEmoji}>💡</Text>
          <Text style={styles.insightText}>
            Most suggestions were dismissed. Consider reducing intensity or adjusting danger windows.
          </Text>
        </View>
      )}

      {actRate > 0.6 && suggestions.length >= 3 && (
        <View style={styles.insightCard}>
          <Text style={styles.insightEmoji}>✅</Text>
          <Text style={styles.insightText}>
            Ambient mode is working well! Most suggestions led to action.
          </Text>
        </View>
      )}

      {/* Recent Suggestions */}
      <Text style={styles.sectionTitle}>Recent Suggestions</Text>
      {suggestions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🌊</Text>
          <Text style={styles.emptyText}>No suggestions yet</Text>
          <Text style={styles.emptyHint}>
            Ambient mode will suggest rescues during your danger windows.
          </Text>
        </View>
      ) : (
        suggestions.slice(0, 10).map((s) => (
          <View key={s.id} style={styles.suggestionRow}>
            <View style={styles.suggestionHeader}>
              <Text style={styles.suggestionTitle}>{s.title}</Text>
              <StatusBadge suggestion={s} />
            </View>
            <Text style={styles.suggestionBody}>{s.body}</Text>
            <Text style={styles.suggestionMeta}>
              {s.trigger.replace(/_/g, ' ')} · {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function StatusBadge({ suggestion }: { suggestion: AmbientSuggestion }) {
  if (suggestion.actedAt) {
    return (
      <View style={[styles.statusBadge, { backgroundColor: '#10B98122' }]}>
        <Text style={[styles.statusText, { color: '#10B981' }]}>Acted</Text>
      </View>
    )
  }
  if (suggestion.dismissedAt) {
    return (
      <View style={[styles.statusBadge, { backgroundColor: '#F59E0B22' }]}>
        <Text style={[styles.statusText, { color: '#F59E0B' }]}>Dismissed</Text>
      </View>
    )
  }
  return (
    <View style={[styles.statusBadge, { backgroundColor: '#6B728022' }]}>
      <Text style={[styles.statusText, { color: '#6B7280' }]}>Expired</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  content: { padding: 20, paddingBottom: 48 },
  header: { marginBottom: 24 },
  backButton: { padding: 8, marginBottom: 8 },
  backText: { fontSize: 16, color: '#6C3AED' },
  title: { fontSize: 28, fontWeight: '700', color: '#F1F1F1' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: '#1A1A2E', borderRadius: 14, padding: 14, alignItems: 'center',
  },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  sectionTitle: {
    fontSize: 14, fontWeight: '600', color: '#9CA3AF', marginTop: 16, marginBottom: 12,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  insightCard: {
    backgroundColor: '#1A1A2E', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
  },
  insightEmoji: { fontSize: 20, marginRight: 12 },
  insightText: { fontSize: 14, color: '#D1D5DB', flex: 1, lineHeight: 20 },
  emptyCard: { backgroundColor: '#1A1A2E', borderRadius: 16, padding: 32, alignItems: 'center' },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 18, color: '#F1F1F1', fontWeight: '600', marginBottom: 8 },
  emptyHint: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  suggestionRow: {
    backgroundColor: '#1A1A2E', borderRadius: 14, padding: 16, marginBottom: 8,
  },
  suggestionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  suggestionTitle: { fontSize: 16, fontWeight: '600', color: '#F1F1F1', flex: 1 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  suggestionBody: { fontSize: 14, color: '#9CA3AF', marginBottom: 6 },
  suggestionMeta: { fontSize: 12, color: '#6B7280' },
})
