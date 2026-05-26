// ══════════════════════════════════════════════════════════════
// INTENT — Not This Sheet
// One-tap feedback when recommendation is wrong
// ══════════════════════════════════════════════════════════════

import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { NOT_THIS_REASONS, getNotThisPrompt, getNotThisSkipLabel } from '../../services/feedback/notThisFeedback'
import type { NotThisReason } from '../../services/feedback/notThisFeedback'

interface Props {
  onSelect: (reason: NotThisReason) => void
  onSkip: () => void
}

export const NotThisSheet: React.FC<Props> = ({ onSelect, onSkip }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getNotThisPrompt()}</Text>

      <View style={styles.grid}>
        {NOT_THIS_REASONS.map(({ reason, label }) => (
          <TouchableOpacity
            key={reason}
            style={styles.chip}
            onPress={() => onSelect(reason)}
            activeOpacity={0.7}
          >
            <Text style={styles.chipText}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
        <Text style={styles.skipText}>{getNotThisSkipLabel()}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 20,
  },
  chip: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  chipText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    color: '#666666',
  },
})
