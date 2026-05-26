// ══════════════════════════════════════════════════════════════
// INTENT — Outcome Picker
// Completion is not binary — nuanced outcome selection
// ══════════════════════════════════════════════════════════════

import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import type { MissionOutcome } from '../../engine/outcomeEngine'
import { getOutcomeOptions, getOutcomeMeta, getOutcomePrompt } from '../../engine/outcomeEngine'

interface Props {
  onSelect: (outcome: MissionOutcome) => void
}

export const OutcomePicker: React.FC<Props> = ({ onSelect }) => {
  const options = getOutcomeOptions()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getOutcomePrompt()}</Text>
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {options.map((outcome) => {
          const meta = getOutcomeMeta(outcome)
          return (
            <TouchableOpacity
              key={outcome}
              style={styles.option}
              onPress={() => onSelect(outcome)}
              activeOpacity={0.7}
            >
              <Text style={styles.emoji}>{meta.emoji}</Text>
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>{meta.label}</Text>
                <Text style={styles.optionDesc}>{meta.description}</Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    maxHeight: 500,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  list: {
    flexGrow: 0,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222222',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  emoji: {
    fontSize: 24,
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 13,
    color: '#888888',
  },
})
