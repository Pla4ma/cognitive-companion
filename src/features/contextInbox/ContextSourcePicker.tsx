// ══════════════════════════════════════════════════════════════
// INTENT — Context Source Picker
// Grid of source options for context capture
// ══════════════════════════════════════════════════════════════

import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native'
import type { ContextSource } from '../../types/contextCapsule'

interface SourceOption {
  key: ContextSource
  label: string
  icon: string
  description: string
  available: boolean
  comingSoon: boolean
  beta: boolean
}

const SOURCE_OPTIONS: SourceOption[] = [
  {
    key: 'paste_text',
    label: 'Paste Text',
    icon: '📋',
    description: 'Paste assignment, email, or any text',
    available: true,
    comingSoon: false,
    beta: false,
  },
  {
    key: 'brain_dump',
    label: 'Brain Dump',
    icon: '🧠',
    description: 'Stream of consciousness capture',
    available: true,
    comingSoon: false,
    beta: false,
  },
  {
    key: 'manual_text',
    label: 'Assignment',
    icon: '📝',
    description: 'Structured entry with title & deadline',
    available: true,
    comingSoon: false,
    beta: false,
  },
  {
    key: 'share_text',
    label: 'Share Extension',
    icon: '🔗',
    description: 'Share from other apps',
    available: true,
    comingSoon: false,
    beta: true,
  },
  {
    key: 'screenshot_ocr',
    label: 'Screenshot OCR',
    icon: '📸',
    description: 'Extract text from screenshots',
    available: false,
    comingSoon: true,
    beta: false,
  },
  {
    key: 'voice_note',
    label: 'Voice Note',
    icon: '🎙️',
    description: 'Speak your context aloud',
    available: false,
    comingSoon: true,
    beta: false,
  },
]

interface ContextSourcePickerProps {
  onSelectSource: (source: ContextSource) => void
  onClose: () => void
}

export function ContextSourcePicker({ onSelectSource, onClose }: ContextSourcePickerProps) {
  const renderSourceCard = ({ item }: { item: SourceOption }) => {
    const disabled = !item.available

    return (
      <TouchableOpacity
        style={[styles.sourceCard, disabled && styles.sourceCardDisabled]}
        onPress={() => !disabled && onSelectSource(item.key)}
        activeOpacity={disabled ? 1 : 0.7}
        disabled={disabled}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.sourceIcon}>{item.icon}</Text>
          {item.beta && (
            <View style={styles.betaBadge}>
              <Text style={styles.betaText}>BETA</Text>
            </View>
          )}
          {item.comingSoon && (
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>SOON</Text>
            </View>
          )}
        </View>
        <Text style={[styles.sourceLabel, disabled && styles.sourceLabelDisabled]}>
          {item.label}
        </Text>
        <Text style={[styles.sourceDesc, disabled && styles.sourceDescDisabled]}>
          {item.description}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Context</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>Choose how to capture your context</Text>

      <FlatList
        data={SOURCE_OPTIONS}
        keyExtractor={(item) => item.key}
        renderItem={renderSourceCard}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  closeButton: {
    fontSize: 22,
    color: '#888',
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  gridContent: {
    paddingBottom: 40,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sourceCard: {
    width: '48%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  sourceCardDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sourceIcon: {
    fontSize: 32,
  },
  betaBadge: {
    backgroundColor: '#6C3AED',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    marginTop: 4,
  },
  betaText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  comingSoonBadge: {
    backgroundColor: '#333',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    marginTop: 4,
  },
  comingSoonText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 0.5,
  },
  sourceLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  sourceLabelDisabled: {
    color: '#666',
  },
  sourceDesc: {
    fontSize: 12,
    color: '#888',
    lineHeight: 16,
  },
  sourceDescDisabled: {
    color: '#555',
  },
})
