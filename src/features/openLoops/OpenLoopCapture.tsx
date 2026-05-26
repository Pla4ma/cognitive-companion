// ══════════════════════════════════════════════════════════════
// INTENT — Open Loop Capture
// Quick capture for open loops — what keeps pulling attention
// ══════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native'
import type { OpenLoop } from '../../types/openLoop'
import { createOpenLoop } from '../../engine/openLoopEngine'

interface Props {
  onLoopCreated: (loop: OpenLoop) => void
  recentLoops: OpenLoop[]
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  work: ['email', 'meeting', 'deadline', 'project', 'boss', 'team', 'report', 'client'],
  school: ['homework', 'essay', 'exam', 'study', 'class', 'assignment', 'grade', 'professor'],
  home: ['clean', 'laundry', 'dishes', 'kitchen', 'room', 'garage', 'organize'],
  health: ['exercise', 'doctor', 'appointment', 'gym', 'sleep', 'eat', 'therapy'],
  social: ['call', 'text', 'friend', 'birthday', 'party', 'visit', 'family'],
  finance: ['pay', 'bill', 'bank', 'budget', 'tax', 'invoice', 'money'],
  admin: ['form', 'sign', 'submit', 'register', 'renew', 'update', 'cancel'],
}

function detectCategory(text: string): string {
  const lower = text.toLowerCase()
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return category
  }
  return 'personal'
}

function suggestTinyAction(text: string, category: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('email') || lower.includes('mail')) return 'Write the subject line'
  if (lower.includes('call') || lower.includes('phone')) return 'Find the contact number'
  if (lower.includes('clean') || lower.includes('tidy')) return 'Put 5 things away'
  if (lower.includes('study') || lower.includes('read')) return 'Open the first page'
  if (lower.includes('write') || lower.includes('essay')) return 'Write one ugly sentence'
  if (lower.includes('pay') || lower.includes('bill')) return 'Open the bill'
  if (lower.includes('fix') || lower.includes('repair')) return 'Name what is broken'

  switch (category) {
    case 'work': return 'Write the first line'
    case 'school': return 'Open the document'
    case 'home': return 'Start with one corner'
    case 'health': return 'Look up the number'
    default: return 'Open it and read for 2 minutes'
  }
}

export const OpenLoopCapture: React.FC<Props> = ({ onLoopCreated, recentLoops }) => {
  const [text, setText] = useState('')
  const [lastCategory, setLastCategory] = useState<string | null>(null)

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim()
    if (trimmed.length === 0) return

    const category = detectCategory(trimmed)
    const tinyAction = suggestTinyAction(trimmed, category)
    const loop = createOpenLoop(trimmed, 'user_capture', tinyAction)

    onLoopCreated(loop)
    setLastCategory(category)
    setText('')
  }, [text, onLoopCreated])

  const renderRecentLoop = useCallback(({ item }: { item: OpenLoop }) => (
    <View style={styles.recentItem}>
      <View style={styles.recentDot} />
      <Text style={styles.recentText} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.recentAction} numberOfLines={1}>{item.nextTinyAction}</Text>
    </View>
  ), [])

  return (
    <View style={styles.container}>
      <Text style={styles.header}>What keeps pulling your attention?</Text>
      <Text style={styles.subtitle}>
        Naming it is the first step. INTENT will suggest a tiny action.
      </Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="e.g. That email I need to send..."
          placeholderTextColor="#555555"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          maxLength={200}
        />
        <TouchableOpacity
          style={[styles.submitButton, text.trim().length === 0 && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={text.trim().length === 0}
        >
          <Text style={styles.submitText}>+</Text>
        </TouchableOpacity>
      </View>

      {lastCategory && text.length === 0 && (
        <Text style={styles.categoryHint}>
          Detected category: {lastCategory}
        </Text>
      )}

      {recentLoops.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.recentHeader}>Recent captures</Text>
          <FlatList
            data={recentLoops.slice(0, 5)}
            keyExtractor={(item) => item.id}
            renderItem={renderRecentLoop}
            scrollEnabled={false}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  submitButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#00ff88',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: {
    backgroundColor: '#2a2a2a',
  },
  submitText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  categoryHint: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 16,
  },
  recentSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    paddingTop: 16,
  },
  recentHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888888',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  recentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginRight: 10,
  },
  recentText: {
    fontSize: 14,
    color: '#cccccc',
    flex: 1,
    marginRight: 8,
  },
  recentAction: {
    fontSize: 12,
    color: '#00ff88',
    maxWidth: 120,
  },
})
