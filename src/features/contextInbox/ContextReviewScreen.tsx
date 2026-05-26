// ══════════════════════════════════════════════════════════════
// INTENT — Context Review Screen
// Best-in-class privacy review for context capsules
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native'

interface ExtractedItem {
  type: 'obligation' | 'deadline' | 'blocker' | 'action'
  text: string
  selected: boolean
}

interface Props {
  rawText: string
  sensitivityLevel: 'safe' | 'personal' | 'sensitive' | 'restricted'
  extractedItems: ExtractedItem[]
  suggestedMission: string
  onStartMission: (items: ExtractedItem[], keepRaw: boolean, allowAI: boolean) => void
  onDelete: () => void
  onMakeSmaller: () => void
}

export const ContextReviewScreen: React.FC<Props> = ({
  rawText,
  sensitivityLevel,
  extractedItems: initialItems,
  suggestedMission,
  onStartMission,
  onDelete,
  onMakeSmaller,
}) => {
  const [items, setItems] = useState(initialItems)
  const [showRaw, setShowRaw] = useState(false)
  const [keepRaw, setKeepRaw] = useState(sensitivityLevel === 'safe')
  const [allowAI, setAllowAI] = useState(false)

  const toggleItem = (index: number) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, selected: !item.selected } : item))
  }

  const selectedCount = items.filter((i) => i.selected).length

  const getSensitivityColor = () => {
    switch (sensitivityLevel) {
      case 'safe': return '#00ff88'
      case 'personal': return '#ffaa00'
      case 'sensitive': return '#ff6600'
      case 'restricted': return '#ff3333'
      default: return '#888888'
    }
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>What INTENT Found</Text>
      <Text style={styles.subtitle}>You choose what it keeps.</Text>

      {/* Sensitivity Badge */}
      <View style={[styles.sensitivityBadge, { borderColor: getSensitivityColor() }]}>
        <Text style={[styles.sensitivityText, { color: getSensitivityColor() }]}>
          {sensitivityLevel.toUpperCase()}
        </Text>
      </View>

      {/* Raw Input Preview */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.collapseHeader} onPress={() => setShowRaw(!showRaw)}>
          <Text style={styles.sectionTitle}>Raw Input</Text>
          <Text style={styles.toggleText}>{showRaw ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {showRaw && (
          <View style={styles.rawBox}>
            <Text style={styles.rawText}>{rawText}</Text>
          </View>
        )}
      </View>

      {/* Extracted Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Extracted ({selectedCount} selected)</Text>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.itemCard, item.selected && styles.itemSelected]}
            onPress={() => toggleItem(index)}
          >
            <View style={styles.itemHeader}>
              <Text style={styles.itemType}>{item.type}</Text>
              <Text style={styles.checkmark}>{item.selected ? '✓' : '○'}</Text>
            </View>
            <Text style={styles.itemText}>{item.text}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Suggested Mission */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Suggested Tiny Mission</Text>
        <View style={styles.missionCard}>
          <Text style={styles.missionText}>{suggestedMission}</Text>
        </View>
      </View>

      {/* Privacy Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Processing Options</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Keep raw text</Text>
          <Switch value={keepRaw} onValueChange={setKeepRaw} trackColor={{ true: '#00ff88' }} />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Allow AI to improve mission</Text>
          <Switch value={allowAI} onValueChange={setAllowAI} trackColor={{ true: '#00ff88' }} />
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => onStartMission(items.filter((i) => i.selected), keepRaw, allowAI)}
        >
          <Text style={styles.startText}>Start mission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallerButton} onPress={onMakeSmaller}>
          <Text style={styles.smallerText}>Make smaller</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 16,
  },
  sensitivityBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 20,
  },
  sensitivityText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00ff88',
    marginBottom: 10,
  },
  collapseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleText: {
    color: '#888888',
    fontSize: 14,
  },
  rawBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
  },
  rawText: {
    fontSize: 13,
    color: '#cccccc',
    lineHeight: 18,
  },
  itemCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  itemSelected: {
    borderColor: '#00ff88',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemType: {
    fontSize: 11,
    color: '#888888',
    textTransform: 'uppercase',
  },
  checkmark: {
    fontSize: 16,
    color: '#00ff88',
  },
  itemText: {
    fontSize: 14,
    color: '#ffffff',
  },
  missionCard: {
    backgroundColor: '#1a2a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  missionText: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#ffffff',
  },
  actions: {
    gap: 10,
    marginBottom: 40,
  },
  startButton: {
    backgroundColor: '#00ff88',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  smallerButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  smallerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  deleteButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteText: {
    fontSize: 14,
    color: '#ff4444',
  },
})
