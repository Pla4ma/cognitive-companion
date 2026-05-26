// ══════════════════════════════════════════════════════════════
// INTENT — Ambient Suggestion Card Component
// Displays ambient rescue suggestions in-app
// ══════════════════════════════════════════════════════════════

import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import type { AmbientSuggestion } from '../../src/types/ambient'
import { generateWhyExplanation } from '../../src/services/ambient/ambientCopy'

interface AmbientSuggestionCardProps {
  suggestion: AmbientSuggestion
  onStart: (suggestion: AmbientSuggestion) => void
  onDismiss: (suggestionId: string) => void
  onWhy?: (suggestion: AmbientSuggestion) => void
}

export function AmbientSuggestionCard({ suggestion, onStart, onDismiss, onWhy }: AmbientSuggestionCardProps) {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>✨ Ambient</Text>
        </View>
        {suggestion.confidence > 0.7 && (
          <View style={styles.highConfBadge}>
            <Text style={styles.highConfText}>High confidence</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <Text style={styles.title}>{suggestion.title}</Text>
      <Text style={styles.body}>{suggestion.body}</Text>

      {/* Why explanation */}
      {onWhy && (
        <Pressable style={styles.whyButton} onPress={() => onWhy(suggestion)}>
          <Text style={styles.whyText}>Why this suggestion?</Text>
        </Pressable>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable style={styles.startButton} onPress={() => onStart(suggestion)}>
          <Text style={styles.startText}>{suggestion.recommendedAction}</Text>
        </Pressable>
        <Pressable style={styles.dismissButton} onPress={() => onDismiss(suggestion.id)}>
          <Text style={styles.dismissText}>Not now</Text>
        </Pressable>
      </View>
    </View>
  )
}

interface AmbientWhySheetProps {
  suggestion: AmbientSuggestion
  onClose: () => void
}

export function AmbientWhySheet({ suggestion, onClose }: AmbientWhySheetProps) {
  const explanation = generateWhyExplanation(suggestion.trigger, null)

  return (
    <View style={styles.sheet}>
      <Text style={styles.sheetTitle}>Why INTENT suggested this</Text>
      <Text style={styles.sheetBody}>{explanation}</Text>

      <View style={styles.sheetDetails}>
        <DetailRow label="Trigger" value={suggestion.trigger.replace(/_/g, ' ')} />
        <DetailRow label="Confidence" value={`${Math.round(suggestion.confidence * 100)}%`} />
        <DetailRow label="Privacy" value={suggestion.privacyLevel} />
        <DetailRow label="Surface" value={suggestion.surface.replace(/_/g, ' ')} />
      </View>

      <Pressable style={styles.sheetClose} onPress={onClose}>
        <Text style={styles.sheetCloseText}>Got it</Text>
      </Pressable>
    </View>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#6C3AED33',
  },
  header: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  badge: {
    backgroundColor: '#6C3AED22',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 12, color: '#6C3AED', fontWeight: '600' },
  highConfBadge: {
    backgroundColor: '#10B98122',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  highConfText: { fontSize: 12, color: '#10B981', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: '#F1F1F1', marginBottom: 6 },
  body: { fontSize: 15, color: '#9CA3AF', lineHeight: 22, marginBottom: 12 },
  whyButton: { marginBottom: 16 },
  whyText: { fontSize: 13, color: '#6C3AED', textDecorationLine: 'underline' },
  actions: { flexDirection: 'row', gap: 10 },
  startButton: {
    flex: 1, backgroundColor: '#6C3AED',
    borderRadius: 14, padding: 16, alignItems: 'center',
  },
  startText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  dismissButton: {
    paddingHorizontal: 20, padding: 16,
    borderRadius: 14, backgroundColor: '#2A2A3E',
  },
  dismissText: { fontSize: 15, color: '#9CA3AF', fontWeight: '500' },
  sheet: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 24,
    margin: 16,
  },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: '#F1F1F1', marginBottom: 12 },
  sheetBody: { fontSize: 15, color: '#D1D5DB', lineHeight: 22, marginBottom: 20 },
  sheetDetails: { marginBottom: 20 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2A2A3E',
  },
  detailLabel: { fontSize: 14, color: '#9CA3AF' },
  detailValue: { fontSize: 14, color: '#F1F1F1', fontWeight: '500' },
  sheetClose: {
    backgroundColor: '#6C3AED', borderRadius: 14, padding: 16, alignItems: 'center',
  },
  sheetCloseText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
})
