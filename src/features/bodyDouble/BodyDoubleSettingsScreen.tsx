// ══════════════════════════════════════════════════════════════
// INTENT — Body Double Settings Screen
// Choose mode, check-in frequency, silent options
// ══════════════════════════════════════════════════════════════

import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { BODY_DOUBLE_MODES } from '../../services/bodyDouble/bodyDoubleSessionEngine'
import type { BodyDoubleMode } from '../../services/bodyDouble/bodyDoubleSessionEngine'

interface Props {
  selectedMode: BodyDoubleMode
  onSelectMode: (mode: BodyDoubleMode) => void
  onStart: () => void
}

export const BodyDoubleSettingsScreen: React.FC<Props> = ({ selectedMode, onSelectMode, onStart }) => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Body Double</Text>
      <Text style={styles.subtitle}>Choose how present you want support to be.</Text>

      {BODY_DOUBLE_MODES.map((config) => (
        <TouchableOpacity
          key={config.mode}
          style={[styles.modeCard, selectedMode === config.mode && styles.selectedCard]}
          onPress={() => onSelectMode(config.mode)}
        >
          <View style={styles.modeHeader}>
            <Text style={styles.modeLabel}>{config.label}</Text>
            {selectedMode === config.mode && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.modeDescription}>{config.description}</Text>
          <Text style={styles.modeFrequency}>
            {config.checkInFrequency >= 999 ? 'No interruptions' : `Check-in every ${config.checkInFrequency} min`}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.startButton} onPress={onStart}>
        <Text style={styles.startText}>Start Body Double</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '800', color: '#ffffff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888888', marginBottom: 24 },
  modeCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  selectedCard: { borderColor: '#00ff88' },
  modeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modeLabel: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  checkmark: { fontSize: 18, color: '#00ff88' },
  modeDescription: { fontSize: 14, color: '#cccccc', marginBottom: 4 },
  modeFrequency: { fontSize: 12, color: '#666666' },
  startButton: { backgroundColor: '#00ff88', borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  startText: { fontSize: 18, fontWeight: '800', color: '#000000' },
})
